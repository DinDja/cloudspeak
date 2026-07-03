import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { REACTION_LIFETIME_MS, TEAM_SELECTION_TYPE } from './constants'
import {
  generateCode,
  getParticipantDisplayName,
  getTeamSelectionResponseId,
  normalizeText,
} from './validators'

const sessionRef = (code) => doc(db, 'sessions', code)
const responsesRef = (code) => collection(db, 'sessions', code, 'responses')
const participantsRef = (code) => collection(db, 'sessions', code, 'participants')
const reactionsRef = (code) => collection(db, 'sessions', code, 'reactions')

export const getSession = async (code) => {
  const snapshot = await getDoc(sessionRef(code))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const createSession = async ({ code, title, slides, ownerUid, ownerEmail, presentationId }) => {
  const payload = {
    code,
    title,
    status: 'live',
    createdAt: serverTimestamp(),
    launchedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    currentSlideIndex: 0,
    slides,
    ownerUid,
    ownerEmail,
    presentationId: presentationId ?? null,
  }
  await setDoc(sessionRef(code), payload)
  return code
}

export const launchPresentationAsSession = async ({ presentation, ownerUid, ownerEmail }) => {
  const code = generateCode()
  await createSession({
    code,
    title: presentation.title,
    slides: presentation.slides,
    ownerUid,
    ownerEmail,
    presentationId: presentation.id ?? null,
  })
  return code
}

export const endSession = (code) =>
  updateDoc(sessionRef(code), { status: 'ended', updatedAt: serverTimestamp() })

export const goNextSlide = (session) => {
  if (!session || session.currentSlideIndex >= session.slides.length - 1) return Promise.resolve()
  return updateDoc(sessionRef(session.code), {
    currentSlideIndex: session.currentSlideIndex + 1,
    updatedAt: serverTimestamp(),
  })
}

export const goPreviousSlide = (session) => {
  if (!session || session.currentSlideIndex <= 0) return Promise.resolve()
  return updateDoc(sessionRef(session.code), {
    currentSlideIndex: session.currentSlideIndex - 1,
    updatedAt: serverTimestamp(),
  })
}

export const deleteSession = async (code) => {
  const subcollections = ['responses', 'participants', 'reactions']
  for (const sub of subcollections) {
    const snapshot = await getDocs(collection(db, 'sessions', code, sub))
    await Promise.all(snapshot.docs.map((docRef) => deleteDoc(docRef.ref)))
  }
  await deleteDoc(sessionRef(code))
}

export const submitResponse = async ({ session, currentSlide, participantId, participantName, value }) => {
  const finalValue = normalizeText(value ?? '')
  if (!finalValue || !session || !currentSlide) return false

  if (currentSlide.type === TEAM_SELECTION_TYPE) {
    const selectedTeam = currentSlide.teams?.find((team) => team.name === finalValue)
    if (!selectedTeam) throw new Error('TEAM_UNAVAILABLE')

    const responseRef = doc(db, 'sessions', session.code, 'responses', getTeamSelectionResponseId(currentSlide.id, participantId))
    const slideResponsesQuery = query(responsesRef(session.code), where('slideId', '==', currentSlide.id))
    const snapshot = await getDocs(slideResponsesQuery)

    const selectedTeamCount = snapshot.docs.reduce((total, responseDoc) => {
      const data = responseDoc.data()
      if (data.type !== TEAM_SELECTION_TYPE) return total
      return normalizeText(data.value ?? '') === finalValue ? total + 1 : total
    }, 0)

    if (selectedTeamCount >= Number(selectedTeam.capacity)) throw new Error('TEAM_FULL')

    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(responseRef)
      if (existing.exists()) throw new Error('TEAM_ALREADY_SELECTED')
      transaction.set(responseRef, {
        participantId,
        participantName: getParticipantDisplayName(participantName),
        slideId: currentSlide.id,
        type: currentSlide.type,
        value: finalValue,
        createdAt: serverTimestamp(),
      })
    })
    return true
  }

  await addDoc(responsesRef(session.code), {
    participantId,
    participantName: getParticipantDisplayName(participantName),
    slideId: currentSlide.id,
    type: currentSlide.type,
    value: finalValue,
    createdAt: serverTimestamp(),
  })
  return true
}

export const sendReaction = async ({ code, participantId, type }) => {
  await addDoc(reactionsRef(code), {
    type,
    left: Math.round(Math.random() * 80 + 10),
    participantId,
    createdAt: serverTimestamp(),
  })
}

export const syncPresence = async ({ code, participantId, participantName, includeJoinedAt = false }) => {
  const payload = {
    participantId,
    participantName: getParticipantDisplayName(participantName),
    lastSeenAt: serverTimestamp(),
  }
  if (includeJoinedAt) payload.joinedAt = serverTimestamp()
  await setDoc(doc(participantsRef(code), participantId), payload, { merge: true })
}

export const subscribeSession = (code, onNext, onError) =>
  onSnapshot(sessionRef(code), (snapshot) => {
    if (!snapshot.exists()) {
      onNext(null)
      return
    }
    onNext({ id: snapshot.id, ...snapshot.data() })
  }, onError)

export const subscribeResponses = (code, onNext) =>
  onSnapshot(query(responsesRef(code), orderBy('createdAt', 'desc')), (snapshot) => {
    onNext(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  })

export const subscribeParticipants = (code, onNext) =>
  onSnapshot(participantsRef(code), (snapshot) => {
    onNext(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  })

export const subscribeReactions = (code, onNext) => {
  const q = query(reactionsRef(code), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const now = Date.now()
    const active = snapshot.docs
      .map((entry) => ({ id: entry.id, ...entry.data() }))
      .filter((item) => {
        const timestamp = item.createdAt?.toMillis?.() ?? now
        return now - timestamp < REACTION_LIFETIME_MS
      })
    onNext(active)
  })
}
