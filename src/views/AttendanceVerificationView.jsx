import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCheck2,
  Hash,
  Loader2,
  QrCode,
  ShieldAlert,
  Upload,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Logo from '../components/ui/Logo'
import { getAttendanceReportWithRetry } from '../lib/firebaseSessions'
import { getAttendanceReportUrl, sha256Hex } from '../lib/attendanceReports'

export default function AttendanceVerificationView({ reportId, onBack }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileState, setFileState] = useState('idle')
  const [fileError, setFileError] = useState('')
  const [copied, setCopied] = useState(false)

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
        if (active) setError(getReportErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reportId])

  const verificationUrl = report ? getAttendanceReportUrl(report.reportId || report.id) : ''
  const certificateId = report?.reportId || report?.id || ''

  const verifyFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !report?.pdfHash) return

    setFileName(file.name)
    setFileError('')
    setFileState('checking')
    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileState('error')
      setFileError('Escolha um arquivo PDF para fazer a conferência.')
      return
    }

    try {
      const hash = await sha256Hex(await file.arrayBuffer())
      setFileState(hash === report.pdfHash ? 'valid' : 'invalid')
    } catch {
      setFileState('error')
      setFileError('Não foi possível ler este arquivo. Tente selecionar o PDF novamente.')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fala-app verification-editorial min-h-[100dvh]">
      <header className="verification-editorial__header">
        <div className="verification-editorial__header-inner">
          <Logo size="sm" />
          <span className="verification-editorial__header-label">Validação pública</span>
          <button type="button" className="verification-editorial__back" onClick={onBack}>
            <ArrowLeft size={15} /> Voltar ao início
          </button>
        </div>
      </header>

      <main className="verification-editorial__main">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} onBack={onBack} />}

        {!loading && report && (
          <>
            <section className="verification-editorial__intro" aria-labelledby="verification-title">
              <div>
                <p className="verification-editorial__eyebrow">FALA SEC / VALIDAÇÃO DE DOCUMENTO</p>
                <h1 id="verification-title">
                  Lista de presença <span>verificável.</span>
                </h1>
                <p className="verification-editorial__intro-text">
                  Este endereço é o registro público de origem da lista. O certificado abaixo foi localizado e está
                  selado no Fala SEC.
                </p>
              </div>
              <div className="verification-editorial__result">
                <CheckCircle2 size={21} />
                <div>
                  <strong>Registro localizado</strong>
                  <span>Emitido pelo Fala SEC</span>
                </div>
              </div>
            </section>

            <section className="verification-pdf" aria-labelledby="pdf-title">
              <div className="verification-editorial__section-label">
                <span>01</span>
                <div>
                  <p className="verification-editorial__eyebrow">CONFERÊNCIA OPCIONAL</p>
                  <h2 id="pdf-title">Você recebeu um PDF?</h2>
                  <p>Compare o arquivo original sem enviá-lo para a internet.</p>
                </div>
              </div>
              <label className={`verification-pdf__picker${fileState === 'checking' ? ' is-checking' : ''}`}>
                <FileCheck2 size={20} />
                <span>
                  <strong>{fileName || 'Selecione o PDF original'}</strong>
                  <small>{fileName ? 'Clique para trocar o arquivo' : 'A conferência acontece neste dispositivo'}</small>
                </span>
                <b>{fileState === 'checking' ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />} Escolher</b>
                <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={verifyFile} />
              </label>
              {fileState === 'valid' && <FileResult valid title="PDF íntegro" text="O arquivo corresponde exatamente ao certificado selado." />}
              {fileState === 'invalid' && <FileResult title="PDF divergente" text="O arquivo foi alterado ou não pertence a este certificado." />}
              {fileState === 'error' && <FileResult title="Não foi possível conferir" text={fileError || 'Tente selecionar o PDF novamente.'} />}
            </section>

            <div className="verification-editorial__rule" />

            <section className="verification-record" aria-labelledby="record-title">
              <div className="verification-record__data">
                <p className="verification-editorial__eyebrow">REGISTRO DO CERTIFICADO</p>
                <h2 id="record-title">{report.sessionTitle || 'Lista de presença'}</h2>
                <dl className="verification-record__facts">
                  <Fact label="ID do certificado" value={certificateId} mono />
                  <Fact label="Código da sessão" value={report.sessionCode} mono />
                  <Fact label="Presenças confirmadas" value={String(report.participantCount ?? 0)} />
                  <Fact label="Registro criado" value={formatTimestamp(report.createdAt)} />
                  <Fact label="Registro selado" value={formatTimestamp(report.sealedAt)} />
                  <Fact label="Fonte" value="Fala SEC" />
                </dl>
                <details className="verification-record__hash">
                  <summary>
                    <span><Hash size={14} /> Hash da lista</span>
                    <small>mostrar SHA-256</small>
                  </summary>
                  <code>{report.listHash}</code>
                </details>
              </div>

              <aside className="verification-record__qr" aria-label="QR Code da validação">
                <div className="verification-record__qr-heading">
                  <div>
                    <p className="verification-editorial__eyebrow">ABRIR NO CELULAR</p>
                    <h3>Valide este registro</h3>
                  </div>
                  <QrCode size={18} />
                </div>
                <div className="verification-record__qr-image">
                  <QRCodeSVG
                    value={verificationUrl}
                    size={154}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#20211e"
                    title="QR Code da página de validação"
                  />
                </div>
                <p>A leitura abre exatamente esta página de conferência.</p>
                <div className="verification-record__qr-actions">
                  <button type="button" onClick={copyLink}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Link copiado' : 'Copiar link'}
                  </button>
                  <a href={verificationUrl} target="_blank" rel="noreferrer" aria-label="Abrir validação em nova aba">
                    <ExternalLink size={14} />
                  </a>
                </div>
              </aside>
            </section>

            <section className="verification-audit" aria-labelledby="audit-title">
              <div className="verification-editorial__section-label">
                <span>02</span>
                <div>
                  <p className="verification-editorial__eyebrow">LEITURA DO RESULTADO</p>
                  <h2 id="audit-title">O que foi confirmado</h2>
                </div>
              </div>
              <div className="verification-audit__list">
                <AuditLine title="Origem" text="O certificado existe na base pública do Fala SEC." />
                <AuditLine title="Integridade do registro" text="A emissão está selada e não pode ser reaberta ou alterada." />
                <AuditLine title="Integridade do arquivo" text="O PDF original pode ser comparado pelo hash do certificado." />
              </div>
            </section>

            <footer className="verification-editorial__footer">
              <Hash size={14} />
              <span>Os dados técnicos desta página permitem a auditoria do documento. Fala SEC · Secretaria da Educação do Estado da Bahia.</span>
            </footer>
          </>
        )}
      </main>
    </div>
  )
}

function Fact({ label, value, mono = false }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={mono ? 'is-mono' : ''}>{value || 'Não informado'}</dd>
    </div>
  )
}

function AuditLine({ title, text }) {
  return (
    <div>
      <CheckCircle2 size={17} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

function FileResult({ valid = false, title, text }) {
  return (
    <div className={`verification-pdf__result${valid ? ' is-valid' : ''}`} role={valid ? 'status' : 'alert'}>
      {valid ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
      <span><strong>{title}</strong>{text}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <section className="verification-state" aria-live="polite">
      <Loader2 className="animate-spin" size={22} />
      <span>Consultando o registro público...</span>
    </section>
  )
}

function ErrorState({ message, onBack }) {
  return (
    <section className="verification-state is-error" role="alert">
      <ShieldAlert size={23} />
      <div>
        <strong>Certificado não localizado</strong>
        <p>{message}</p>
        <button type="button" onClick={onBack}><ArrowLeft size={14} /> Voltar ao início</button>
      </div>
    </section>
  )
}

function getReportErrorMessage(error) {
  if (error?.code === 'permission-denied') return 'Este registro não está disponível para consulta pública no momento.'
  return 'Não foi possível consultar o certificado agora. Tente abrir o link novamente.'
}

function formatTimestamp(value) {
  const date = value?.toDate?.() || (typeof value?.seconds === 'number' ? new Date(value.seconds * 1000) : null)
  if (!date || Number.isNaN(date.getTime())) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
