import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
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
  isRetryableFirebaseError,
  normalizeText,
} from './validators'

const sessionRef = (code) => doc(db, 'sessions', code)
const responsesRef = (code) => collection(db, 'sessions', code, 'responses')
const participantsRef = (code) => collection(db, 'sessions', code, 'participants')
const reactionsRef = (code) => collection(db, 'sessions', code, 'reactions')

const retryFirestoreOperation = async (operation, attempts = 3) => {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isRetryableFirebaseError(error) || attempt === attempts - 1) throw error
      await new Promise((resolve) => globalThis.setTimeout(resolve, 250 * 2 ** attempt))
    }
  }
  throw lastError
}

export const getSession = async (code) => {
  const snapshot = await getDoc(sessionRef(code))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const getSessionWithRetry = (code) => retryFirestoreOperation(() => getSession(code))

export const getParticipants = async (code) => {
  const snapshot = await getDocs(participantsRef(code))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
}

export const getParticipantsWithRetry = (code) => retryFirestoreOperation(() => getParticipants(code))

export const getResponses = async (code) => {
  const snapshot = await getDocs(responsesRef(code))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
}

export const getResponsesWithRetry = (code) => retryFirestoreOperation(() => getResponses(code))

export const getSessionReportSnapshot = async (code) => {
  const [sessionSnapshot, responsesSnapshot, participantsSnapshot] = await Promise.all([
    getDocFromServer(sessionRef(code)),
    getDocsFromServer(responsesRef(code)),
    getDocsFromServer(participantsRef(code)),
  ])
  return {
    session: sessionSnapshot.exists() ? { id: sessionSnapshot.id, ...sessionSnapshot.data() } : null,
    responses: responsesSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
    participants: participantsSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
  }
}

export const getSessionReportSnapshotWithRetry = (code) =>
  retryFirestoreOperation(() => getSessionReportSnapshot(code))

export const createSession = async ({ code, title, slides, ownerUid, ownerEmail, presentationId, eventKey = null }) => {
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
    eventKey,
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
    eventKey: presentation.eventKey ?? null,
  })
  return code
}

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

export const syncPresence = async ({
  code,
  participantId,
  participantName,
  participantInstitution = '',
  attendance = false,
  includeJoinedAt = false,
}) => {
  const participantReference = doc(participantsRef(code), participantId)
  const payload = {
    participantId,
    participantName: getParticipantDisplayName(participantName),
    participantInstitution: normalizeText(participantInstitution ?? '').slice(0, 120),
    lastSeenAt: serverTimestamp(),
  }
  if (attendance) payload.attendance = true
  if (includeJoinedAt) {
    const existing = await getDoc(participantReference)
    if (!existing.exists()) payload.joinedAt = serverTimestamp()
  }
  await setDoc(participantReference, payload, { merge: true })
}

export const syncPresenceWithRetry = (options) => retryFirestoreOperation(() => syncPresence(options))

export const subscribeSession = (code, onNext, onError) =>
  onSnapshot(sessionRef(code), (snapshot) => {
    if (!snapshot.exists()) {
      onNext(null)
      return
    }
    onNext({ id: snapshot.id, ...snapshot.data() })
  }, onError)

export const subscribeResponses = (code, onNext, onError, slideId = '') => {
  const source = slideId
    ? query(responsesRef(code), where('slideId', '==', slideId))
    : query(responsesRef(code), orderBy('createdAt', 'desc'))
  return onSnapshot(source, (snapshot) => {
    onNext(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  }, onError)
}

export const subscribeParticipants = (code, onNext, onError) =>
  onSnapshot(participantsRef(code), (snapshot) => {
    onNext(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  }, onError)

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
