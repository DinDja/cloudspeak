import { createAttendancePdf } from './eventMinutes'
import { createAttendanceReport, sealAttendanceReport } from './firebaseSessions'
import { getAttendanceReportUrl, sha256Hex } from './attendanceReports'

export const issueAttendanceReport = async ({
  session,
  participants = [],
  ownerUid,
  ownerEmail,
  authorName = '',
}) => {
  const report = await createAttendanceReport({
    session,
    participants,
    ownerUid,
    ownerEmail,
    authorName,
  })

  const pdf = await createAttendancePdf({
    session,
    participants,
    authorName,
    report: {
      ...report,
      verificationUrl: getAttendanceReportUrl(report.reportId),
    },
  })
  const pdfBytes = pdf.output('arraybuffer')
  const pdfHash = await sha256Hex(pdfBytes)
  await sealAttendanceReport(report.reportId, pdfHash)

  return {
    pdf,
    pdfBytes,
    report: {
      ...report,
      status: 'sealed',
      pdfHash,
      verificationUrl: getAttendanceReportUrl(report.reportId),
    },
  }
}

export const downloadIssuedAttendanceReport = async (options) => {
  const result = await issueAttendanceReport(options)
  const code = String(options?.session?.code || 'evento').toLowerCase()
  const filename = `lista-presenca-verificavel-${code}.pdf`
  const blob = new Blob([result.pdfBytes], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  return result
}
