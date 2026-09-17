import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, FileCheck2, Loader2, ShieldAlert, Upload } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { getAttendanceReportWithRetry } from '../lib/firebaseSessions'
import { getAttendanceReportUrl, sha256Hex } from '../lib/attendanceReports'

export default function AttendanceVerificationView({ reportId, onBack }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileState, setFileState] = useState('idle')

  useEffect(() => {
    let active = true
    getAttendanceReportWithRetry(reportId)
      .then((value) => {
        if (!active) return
        if (!value || value.status !== 'sealed') {
          setError('Este certificado não existe ou ainda não foi selado.')
          return
        }
        setReport(value)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Não foi possível consultar o certificado.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reportId])

  const verifyFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !report?.pdfHash) return
    setFileName(file.name)
    setFileState('checking')
    try {
      const hash = await sha256Hex(await file.arrayBuffer())
      setFileState(hash === report.pdfHash ? 'valid' : 'invalid')
    } catch {
      setFileState('error')
    }
    event.target.value = ''
  }

  const createdAt = formatTimestamp(report?.createdAt)
  const sealedAt = formatTimestamp(report?.sealedAt)
  const verificationUrl = report ? getAttendanceReportUrl(report.reportId || report.id) : ''

  return (
    <div className="fala-app public-page min-h-[100dvh]">
      <header className="public-header">
        <Logo />
        <button type="button" className="fala-link flex items-center gap-2" onClick={onBack}>
          <ArrowLeft size={15} /> Voltar
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-10 sm:py-16">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="fala-eyebrow">CONFERÊNCIA PÚBLICA</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Lista de presença verificável
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Consulte se o certificado foi emitido pelo Fala SEC e confira a integridade do PDF original.
          </p>

          {loading && (
            <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" /> Consultando o certificado...
            </div>
          )}

          {!loading && error && (
            <div className="mt-8 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!loading && report && (
            <>
              <div className="mt-8 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="font-bold">Certificado localizado no Fala SEC</p>
                  <p className="mt-1">O registro está selado e não pode ser alterado pelas regras do sistema.</p>
                </div>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <Detail label="Certificado" value={report.reportId || report.id} />
                <Detail label="Sessão" value={report.sessionCode} />
                <Detail label="Evento" value={report.sessionTitle} />
                <Detail label="Registros" value={String(report.participantCount ?? 0)} />
                <Detail label="Criado em" value={createdAt} />
                <Detail label="Selado em" value={sealedAt} />
              </dl>

              <div className="mt-6 border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Hash da lista</p>
                <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-700">{report.listHash}</p>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <div className="flex items-start gap-3">
                  <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-stone-700" />
                  <div>
                    <h2 className="font-semibold text-slate-900">Conferir o PDF original</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Selecione o arquivo baixado no Fala SEC. A conferência acontece no próprio navegador.
                    </p>
                  </div>
                </div>
                <label className="fala-button fala-button--secondary mt-4 cursor-pointer">
                  <Upload size={15} />
                  Selecionar PDF
                  <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={verifyFile} />
                </label>
                {fileName && <p className="mt-3 text-xs text-slate-500">Arquivo: {fileName}</p>}
                {fileState === 'checking' && <p className="mt-3 text-sm font-semibold text-slate-600">Calculando a impressão digital...</p>}
                {fileState === 'valid' && <p className="mt-3 text-sm font-bold text-emerald-700">PDF íntegro: o arquivo corresponde ao certificado.</p>}
                {fileState === 'invalid' && <p className="mt-3 text-sm font-bold text-red-700">PDF divergente: o arquivo foi alterado ou não pertence a este certificado.</p>}
                {fileState === 'error' && <p className="mt-3 text-sm font-bold text-red-700">Não foi possível calcular a impressão digital deste arquivo.</p>}
              </div>

              <a
                href={verificationUrl}
                className="mt-6 block break-all text-xs text-stone-700 underline underline-offset-2"
              >
                {verificationUrl}
              </a>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value || 'Não informado'}</dd>
    </div>
  )
}

function formatTimestamp(value) {
  const date = value?.toDate?.() || (typeof value?.seconds === 'number' ? new Date(value.seconds * 1000) : null)
  if (!date || Number.isNaN(date.getTime())) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}
