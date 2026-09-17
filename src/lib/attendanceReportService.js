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
  const pdfHash = await sha256Hex(pdf.output('arraybuffer'))
  await sealAttendanceReport(report.reportId, pdfHash)

  return {
    pdf,
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
  result.pdf.save(`lista-presenca-verificavel-${code}.pdf`)
  return result
}
