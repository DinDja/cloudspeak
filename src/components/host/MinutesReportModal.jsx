import { useState } from 'react'
import { CheckCircle2, Download, FileText, ShieldCheck } from 'lucide-react'
import Modal from '../ui/Modal'
import { downloadAttendancePdf, downloadMinutesPdf, getAttendanceParticipants } from '../../lib/eventMinutes'
import {
  getParticipantsWithRetry,
  getSessionReportSnapshotWithRetry,
} from '../../lib/firebaseSessions'

export default function MinutesReportModal({
  open,
  session,
  responses,
  participants,
  onClose,
}) {
  const [authorName, setAuthorName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const attendanceCount = getAttendanceParticipants(participants).length

  const downloadAttendance = async () => {
    setBusy(true)
    setError('')
    try {
      const reportParticipants = session?.code ? await getParticipantsWithRetry(session.code) : participants
      await downloadAttendancePdf({ session, participants: reportParticipants, authorName })
    } catch (err) {
      console.error('attendance report failed', err)
      setError(err.message || 'Não foi possível gerar a lista de presença. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    setBusy(true)
    setError('')
    try {
      let reportSession = session
      let reportResponses = responses
      let reportParticipants = participants
      if (session?.code) {
        const latest = await getSessionReportSnapshotWithRetry(session.code)
        reportSession = latest.session ?? session
        reportResponses = latest.responses
        reportParticipants = latest.participants
      }
      await downloadMinutesPdf({
        session: reportSession,
        responses: reportResponses,
        participants: reportParticipants,
        authorName,
      })
      setCompleted(true)
    } catch (err) {
      console.error('minutes report failed', err)
      setError(err.message || 'Não foi possível gerar o documento. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose()
      }}
      maxWidth="max-w-xl"
    >
      {completed ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Documento gerado com sucesso</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            O PDF foi baixado com a frequência, a programação e todas as respostas literais disponíveis no momento da geração. A sessão continua ativa.
          </p>
          {error && <p className="fala-error mx-auto mt-4 max-w-md" role="alert">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="fala-button fala-button--secondary" disabled={busy} onClick={downloadAttendance}>
              <Download size={15} />
              Lista de presença (PDF)
            </button>
            <button type="button" className="fala-button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4 border-b border-slate-200 pb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="fala-eyebrow">DOCUMENTO INSTITUCIONAL</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Gerar documento atualizado</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                O PDF será montado com a logo institucional do documento-base, a lista de frequência e cada resposta recebida.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Summary label="Presenças registradas" value={attendanceCount} />
            <Summary label="Respostas" value={responses.length} />
            <Summary label="Slides" value={session?.slides?.length ?? 0} />
          </div>

          <label className="editor-field mt-6">
            <span>Nome da pessoa responsável <em>(opcional)</em></span>
            <input
              className="fala-input"
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              maxLength={120}
              placeholder="Será deixado em branco se não informado"
              disabled={busy}
            />
          </label>

          <div className="mt-5 flex gap-3 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              O documento preserva as respostas como foram enviadas. A conferência final pelo secretário continua necessária antes de assinatura ou protocolo.
            </p>
          </div>

          {error && <p className="fala-error mt-4" role="alert">{error}</p>}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" className="fala-button fala-button--secondary" disabled={busy} onClick={downloadAttendance}>
              <Download size={15} />
              Lista de presença (PDF)
            </button>
            <button type="button" className="fala-button" disabled={busy} onClick={download}>
              <Download size={15} />
              {busy ? 'Gerando…' : 'Baixar documento atualizado'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

function Summary({ label, value }) {
  return (
    <div className="border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  )
}
