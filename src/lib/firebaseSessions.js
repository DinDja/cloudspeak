import {
  addDoc,
  collection,
  deleteField,
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
import { AVANCA_EVENT_KEY } from './eventData'
import { EVIDENCE_BOARD_TYPE, MAX_SLIDES, REACTION_LIFETIME_MS, TEAM_SELECTION_TYPE } from './constants'
import { createEvidenceBoardSlide } from './evidenceBoard'
import {
  generateCode,
  getParticipantDisplayName,
  getTeamSelectionResponseId,
  isRetryableFirebaseError,
  normalizeText,
} from './validators'
import {
  ATTENDANCE_REPORT_SCHEMA_VERSION,
  ATTENDANCE_REPORT_SOURCE,
  getAttendanceListHash,
  getCanonicalAttendanceRecords,
  getAttendanceReportUrl,
} from './attendanceReports'

const sessionRef = (code) => doc(db, 'sessions', code)
const sessionsCol = () => collection(db, 'sessions')
const responsesRef = (code) => collection(db, 'sessions', code, 'responses')
const participantsRef = (code) => collection(db, 'sessions', code, 'participants')
const reactionsRef = (code) => collection(db, 'sessions', code, 'reactions')
const attendanceReportsCol = () => collection(db, 'attendanceReports')
const attendanceReportRef = (reportId) => doc(db, 'attendanceReports', reportId)

const isAvancaPresentation = (presentation, slides) => {
  const normalizedTitle = String(presentation?.title ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')

  return presentation?.eventKey === AVANCA_EVENT_KEY
    || normalizedTitle.includes('avanca')
    || slides.some((slide) => slide?.style?.theme === 'avanca')
}

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

export const subscribeUserSessions = (ownerUid, onNext, onError) => {
  const q = query(sessionsCol(), where('ownerUid', '==', ownerUid))
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() }))
        .sort((left, right) => {
          const leftTime = left.createdAt?.toMillis?.() ?? 0
          const rightTime = right.createdAt?.toMillis?.() ?? 0
          return rightTime - leftTime
        })
      onNext(sessions)
    },
    onError,
  )
}

export const getParticipants = async (code) => {
  const snapshot = await getDocs(participantsRef(code))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
}

export const getParticipantsWithRetry = (code) => retryFirestoreOperation(async () => {
  const snapshot = await getDocsFromServer(participantsRef(code))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
})

export const createAttendanceReport = async ({
  session,
  participants = [],
  ownerUid,
  ownerEmail,
  authorName = '',
}) => {
  if (!session?.code || !ownerUid || !ownerEmail) throw new Error('INVALID_ATTENDANCE_REPORT')

  const reportReference = doc(attendanceReportsCol())
  const records = getCanonicalAttendanceRecords(participants)
  const listHash = await getAttendanceListHash(session, participants)
  const payload = {
    reportId: reportReference.id,
    source: ATTENDANCE_REPORT_SOURCE,
    schemaVersion: ATTENDANCE_REPORT_SCHEMA_VERSION,
    sessionCode: normalizeText(session.code),
    sessionTitle: normalizeText(session.title).slice(0, 120),
    sessionStatus: session.status,
    ownerUid,
    ownerEmail: normalizeText(ownerEmail).slice(0, 160),
    participantCount: records.length,
    listHash,
    authorName: normalizeText(authorName).slice(0, 120),
    createdAt: serverTimestamp(),
    status: 'draft',
  }

  await setDoc(reportReference, payload)
  return {
    ...payload,
    verificationUrl: getAttendanceReportUrl(reportReference.id),
  }
}

export const sealAttendanceReport = async (reportId, pdfHash) => {
  if (!reportId || !/^[a-f0-9]{64}$/.test(pdfHash ?? '')) {
    throw new Error('INVALID_ATTENDANCE_REPORT_HASH')
  }
  await updateDoc(attendanceReportRef(reportId), {
    pdfHash,
    sealedAt: serverTimestamp(),
    status: 'sealed',
  })
}

export const getAttendanceReport = async (reportId) => {
  if (!reportId) return null
  const snapshot = await getDoc(attendanceReportRef(reportId))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const getAttendanceReportWithRetry = (reportId) =>
  retryFirestoreOperation(() => getAttendanceReport(reportId))

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
    sessionLabel: '',
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
  const presentationSlides = presentation.slides ?? []
  const isAvanca = isAvancaPresentation(presentation, presentationSlides)
  const needsEvidenceBoard = isAvanca
    && !presentationSlides.some((slide) => slide.type === EVIDENCE_BOARD_TYPE)
  if (needsEvidenceBoard && presentationSlides.length >= MAX_SLIDES) {
    throw new Error('AVANCA_EVIDENCE_BOARD_LIMIT')
  }
  const slides = isAvanca
    ? [
        ...presentationSlides,
        ...(needsEvidenceBoard ? [createEvidenceBoardSlide()] : []),
      ]
    : presentationSlides
  await createSession({
    code,
    title: presentation.title,
    slides,
    ownerUid,
    ownerEmail,
    presentationId: presentation.id ?? null,
    eventKey: isAvanca ? AVANCA_EVENT_KEY : presentation.eventKey ?? null,
  })
  return code
}

export const updateSessionLabel = async (code, value) => {
  await updateDoc(sessionRef(code), {
    sessionLabel: normalizeText(value ?? '').slice(0, 80),
    updatedAt: serverTimestamp(),
  })
}

export const setSessionStatus = async (code, status) => {
  if (!['live', 'ended'].includes(status)) throw new Error('INVALID_SESSION_STATUS')
  await updateDoc(sessionRef(code), {
    status,
    endedAt: status === 'ended' ? serverTimestamp() : deleteField(),
    updatedAt: serverTimestamp(),
  })
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

export const goToSlide = (session, slideIndex) => {
  const targetIndex = Number(slideIndex)
  if (
    !session ||
    !Number.isInteger(targetIndex) ||
    targetIndex < 0 ||
    targetIndex >= session.slides.length ||
    targetIndex === session.currentSlideIndex
  ) {
    return Promise.resolve()
  }

  return updateDoc(sessionRef(session.code), {
    currentSlideIndex: targetIndex,
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
  participantContact = '',
  participantCpf = '',
  attendance = false,
  includeJoinedAt = false,
}) => {
  const participantReference = doc(participantsRef(code), participantId)
  const payload = {
    participantId,
    participantName: getParticipantDisplayName(participantName),
    lastSeenAt: serverTimestamp(),
  }
  const institution = normalizeText(participantInstitution ?? '').slice(0, 120)
  const contact = normalizeText(participantContact ?? '').slice(0, 120)
  const cpf = String(participantCpf ?? '').replace(/\D/g, '').slice(0, 11)
  // Regular presence heartbeats do not collect these fields. Omitting empty
  // values preserves any complete attendance registration already on the doc.
  if (institution) payload.participantInstitution = institution
  if (contact) payload.participantContact = contact
  if (cpf) payload.participantCpf = cpf
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
