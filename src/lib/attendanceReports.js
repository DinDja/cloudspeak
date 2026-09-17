import { normalizeText } from './validators'

export const ATTENDANCE_REPORT_SOURCE = 'fala-sec'
export const ATTENDANCE_REPORT_SCHEMA_VERSION = 1

const contactValue = (participant) => [
  participant?.participantContact,
  participant?.participantEmail ?? participant?.email,
  participant?.participantPhone ?? participant?.phone,
]
  .map((value) => normalizeText(value))
  .filter(Boolean)
  .join(' / ')

const cpfValue = (participant) => String(
  participant?.participantCpf ?? participant?.cpf ?? '',
).replace(/\D/g, '').slice(0, 11)

const participantRecord = (participant) => ({
  participantId: normalizeText(participant?.participantId || participant?.id),
  participantName: normalizeText(participant?.participantName) || 'Nome não informado',
  participantInstitution: normalizeText(participant?.participantInstitution) || '',
  participantContact: contactValue(participant),
  participantCpf: cpfValue(participant),
})

export const getAttendanceRecords = (participants = []) =>
  (participants ?? [])
    .filter((participant) => participant?.attendance === true)
    .map(participantRecord)
    .filter((participant) => participant.participantId)

export const getCanonicalAttendanceRecords = (participants = []) =>
  getAttendanceRecords(participants).sort((left, right) =>
    left.participantId.localeCompare(right.participantId),
  )

export const getAttendanceListPayload = (session, participants = []) => ({
  schemaVersion: ATTENDANCE_REPORT_SCHEMA_VERSION,
  sessionCode: normalizeText(session?.code),
  participants: getCanonicalAttendanceRecords(participants),
})

const encodeValue = (value) => {
  if (typeof value === 'string') return new TextEncoder().encode(value)
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  return new TextEncoder().encode(String(value ?? ''))
}

export const sha256Hex = async (value) => {
  if (!globalThis.crypto?.subtle?.digest) throw new Error('HASH_UNAVAILABLE')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encodeValue(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const getAttendanceListHash = async (session, participants = []) =>
  sha256Hex(JSON.stringify(getAttendanceListPayload(session, participants)))

export const getAttendanceReportUrl = (reportId) => {
  const configuredBaseUrl = import.meta.env.VITE_APP_URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const baseUrl = (configuredBaseUrl || currentOrigin).replace(/\/$/, '')
  return `${baseUrl}/?verify=${encodeURIComponent(reportId)}`
}

export const isValidAttendanceReportId = (value) =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value)

