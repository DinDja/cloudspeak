import { useEffect, useMemo, useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Power,
  Users,
  BarChart3,
  Heart,
  ThumbsUp,
  HelpCircle,
  Copy,
  Check,
  Eye,
  ArrowLeft,
  Share2,
  Maximize2,
  FileText,
  QrCode,
  Download,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { EVIDENCE_BOARD_TYPE, SUMMARY_TYPE, TEAM_SELECTION_TYPE } from '../lib/constants'
import { QR_CODE_COLORS, COLORS } from '../lib/colors'
import { buildTeamSelectionStats, formatResponseValue, getJoinUrl, getPresenceUrl, getSlideJoinUrl } from '../lib/validators'
import { getSlideStyleClass, getSlideThemeVars } from '../lib/slideStyles'
import { AVANCA_EVENT_KEY } from '../lib/eventData'
import MultipleChoiceResults from '../components/slides/MultipleChoiceResults'
import WordCloudResults from '../components/slides/WordCloudResults'
import OpenTextResults from '../components/slides/OpenTextResults'
import TeamSelectionResults from '../components/slides/TeamSelectionResults'
import EvidenceBoard from '../components/slides/EvidenceBoard'
import MinutesReportModal from '../components/host/MinutesReportModal'
import { downloadIssuedAttendanceReport } from '../lib/attendanceReportService'
import { getParticipantsWithRetry } from '../lib/firebaseSessions'
import EducationWatermark from '../components/presenter/EducationWatermark'

const REACTION_ICON = {
  heart: Heart,
  thumb: ThumbsUp,
  question: HelpCircle,
}

const TONE = {
  bg: 'bg-white/85',
  ring: 'ring-slate-200/60',
  shadow: 'shadow-premium',
}

export default function HostView({
  session,
  ownerUid,
  ownerEmail,
  currentSlide,
  responses,
  reactions,
  connectedParticipants,
  currentSlideIndex,
  onNext,
  onPrevious,
  onGoToSlide,
  onEndProjection,
  canGoBack,
  canGoForward,
  onExit,
  allResponses = responses,
  participants = [],
}) {
  const joinUrl = useMemo(() => getJoinUrl(session.code), [session.code])
  const presenceUrl = useMemo(() => getPresenceUrl(session.code), [session.code])
  const slideJoinUrl = useMemo(() => getSlideJoinUrl(session.code, currentSlide?.id), [session.code, currentSlide?.id])
  const [fullscreenSlide, setFullscreenSlide] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [attendanceDownloading, setAttendanceDownloading] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')
  const [attendanceReport, setAttendanceReport] = useState(null)
  const slideStyleClass = getSlideStyleClass(currentSlide)
  const slideThemeVars = getSlideThemeVars(currentSlide)
  const normalizedSessionTitle = String(session.title ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
  const isAvancaEvent =
    session.eventKey === AVANCA_EVENT_KEY ||
    normalizedSessionTitle.includes('avanca') ||
    currentSlide?.style?.theme === 'avanca'

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setFullscreenSlide(false)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const openFullscreenSlide = async () => {
    setFullscreenSlide(true)
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // The application-level fullscreen overlay remains available if the browser blocks native fullscreen.
    }
  }

  const closeFullscreenSlide = async () => {
    setFullscreenSlide(false)
    try {
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen()
    } catch {
      // The overlay can still close even when native fullscreen cannot be exited programmatically.
    }
  }

  const responseCount = useMemo(() => {
    if (currentSlide?.type === EVIDENCE_BOARD_TYPE) return allResponses.length
    if (currentSlide?.type === TEAM_SELECTION_TYPE) {
      return buildTeamSelectionStats(currentSlide, responses).reduce((total, team) => total + team.count, 0)
    }
    return responses.length
  }, [allResponses.length, currentSlide, responses])

  const downloadAttendance = async () => {
    setAttendanceDownloading(true)
    setAttendanceError('')
    try {
      const latestParticipants = await getParticipantsWithRetry(session.code)
      const result = await downloadIssuedAttendanceReport({
        session,
        participants: latestParticipants,
        ownerUid,
        ownerEmail,
      })
      setAttendanceReport(result.report)
    } catch (error) {
      console.error('attendance report failed', error)
      setAttendanceError('Não foi possível gerar a lista de presença. Tente novamente.')
    } finally {
      setAttendanceDownloading(false)
    }
  }

  return (
    <>
      <div className="host-layout relative grid h-[100dvh] grid-cols-1 overflow-hidden bg-[#f6f4ef] font-sans text-[#17181d] lg:grid-cols-[minmax(0,1fr)_360px]">
        <BackgroundAurora />

        <main className="relative z-10 flex h-full min-w-0 flex-col overflow-hidden">
          <TopSessionBar
            code={session.code}
            status={session.status}
            sessionTitle={session.sessionLabel || session.title}
            onEndProjection={() => onEndProjection(session.code)}
            onExit={onExit}
            connectedParticipants={connectedParticipants}
            responseCount={responseCount}
          />

          <section
            className={`host-stage ${slideStyleClass} relative flex min-h-0 flex-1 items-center justify-start overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8`}
            style={slideThemeVars}
          >
            <EducationWatermark
              eventKey={session.eventKey}
              presentationTitle={session.title}
            />
            <div className="mx-auto my-auto w-full max-w-5xl text-center">
              <button
                type="button"
                onClick={openFullscreenSlide}
                className="absolute right-2 top-2 z-20 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition-colors hover:border-stone-400 hover:bg-stone-50 hover:text-stone-800 sm:right-4 sm:top-4 sm:px-3 sm:py-2 sm:text-xs"
                title="Slide em tela cheia"
              >
                <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{' '}
                <span className="hidden sm:inline">Tela cheia</span>
              </button>
              <AnimatePresence mode="wait">
                <Motion.div
                  key={currentSlide?.id ?? 'empty'}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-4 sm:space-y-6 md:space-y-8"
                >
                  {currentSlide?.type === EVIDENCE_BOARD_TYPE ? (
                    <EvidenceBoard session={session} responses={allResponses} participants={participants} />
                  ) : (
                    <>
                      <Motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="host-stage__badge inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:px-4 sm:py-1.5 sm:text-xs"
                  >
                    Etapa {currentSlideIndex + 1} ·{' '}
                    {currentSlide?.type === 'multiple_choice'
                      ? 'Enquete'
                      : currentSlide?.type === 'word_cloud'
                        ? 'Nuvem'
                        : currentSlide?.type === 'open_text'
                          ? 'Q&A'
                        : currentSlide?.type === TEAM_SELECTION_TYPE
                            ? 'Times'
                            : currentSlide?.type === SUMMARY_TYPE
                              ? 'Sumário'
                            : 'Etapa'}
                      </Motion.p>

                  <Motion.h1 className="host-stage__question mx-auto px-2 font-display uppercase text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                    {currentSlide?.question}
                      </Motion.h1>

                  <Motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mx-auto w-full px-2"
                  >
                    {currentSlide?.type === SUMMARY_TYPE ? (
                      <SummaryNavigation
                        slides={session.slides}
                        currentSlideIndex={currentSlideIndex}
                        onGoToSlide={onGoToSlide}
                      />
                    ) : currentSlide?.type === 'multiple_choice' && (
                      <MultipleChoiceResults
                        slide={currentSlide}
                        responses={responses}
                        responseCount={responseCount}
                      />
                    )}
                    {currentSlide?.type === 'word_cloud' && <WordCloudResults responses={responses} />}
                    {currentSlide?.type === 'open_text' && (
                      <OpenTextResults responses={responses} cardStyle={isAvancaEvent} />
                    )}
                    {currentSlide?.type === TEAM_SELECTION_TYPE && (
                      <TeamSelectionResults
                        slide={currentSlide}
                        responses={responses}
                        responseCount={responseCount}
                      />
                    )}
                      </Motion.div>
                    </>
                  )}
                </Motion.div>
              </AnimatePresence>
            </div>
          </section>

          <BottomControls
            session={session}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onNext={onNext}
            onPrevious={onPrevious}
          />

          <ReactionLayer reactions={reactions} />
        </main>

        <SidePanel
          session={session}
          currentSlide={currentSlide}
          slides={session.slides}
          responses={responses}
          connectedParticipants={connectedParticipants}
          joinUrl={joinUrl}
          presenceUrl={presenceUrl}
          slideJoinUrl={slideJoinUrl}
          reactionCount={reactions.length}
          onOpenReport={() => setReportOpen(true)}
          onDownloadAttendance={downloadAttendance}
          attendanceDownloading={attendanceDownloading}
          attendanceError={attendanceError}
          attendanceReport={attendanceReport}
        />
      </div>

      {fullscreenSlide && (
        <div className="fixed inset-0 z-[9999] flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-black/95 p-0 backdrop-blur-sm">
          <div
            className={`host-stage ${slideStyleClass} relative flex h-full min-h-0 w-full max-w-none flex-col items-center justify-center gap-4 overflow-hidden sm:gap-6`}
            style={slideThemeVars}
          >
            <EducationWatermark
              eventKey={session.eventKey}
              presentationTitle={session.title}
            />
            <button
              type="button"
              onClick={closeFullscreenSlide}
              className="absolute right-6 top-6 flex items-center gap-2 border-2 border-white bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-all duration-100 hover:bg-white/20 sm:right-8 sm:top-8 sm:px-4 sm:py-2 sm:text-sm"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" /> Fechar
            </button>
            <div className="flex w-full flex-col items-center gap-4 sm:gap-6 md:gap-8">
              {currentSlide?.type === EVIDENCE_BOARD_TYPE ? (
                <EvidenceBoard session={session} responses={allResponses} participants={participants} />
              ) : (
                <>
                  <Motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="host-stage__badge inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#17181d] sm:px-6 sm:py-3 sm:text-sm"
              >
                Etapa {currentSlideIndex + 1} ·{' '}
                {currentSlide?.type === 'multiple_choice'
                  ? 'Enquete'
                  : currentSlide?.type === 'word_cloud'
                    ? 'Nuvem'
                    : currentSlide?.type === 'open_text'
                      ? 'Q&A'
                      : currentSlide?.type === TEAM_SELECTION_TYPE
                        ? 'Times'
                        : currentSlide?.type === SUMMARY_TYPE
                          ? 'Sumário'
                        : 'Etapa'}
                  </Motion.p>

              <Motion.h1
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="host-stage__question mx-auto px-4 font-display uppercase text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              >
                {currentSlide?.question}
                  </Motion.h1>

              <Motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mx-auto w-full max-w-4xl px-4"
              >
                {currentSlide?.type === SUMMARY_TYPE ? (
                  <SummaryNavigation
                    slides={session.slides}
                    currentSlideIndex={currentSlideIndex}
                    onGoToSlide={onGoToSlide}
                    dark
                  />
                ) : currentSlide?.type === 'multiple_choice' && (
                  <MultipleChoiceResults
                    slide={currentSlide}
                    responses={responses}
                    responseCount={responseCount}
                  />
                )}
                {currentSlide?.type === 'word_cloud' && <WordCloudResults responses={responses} />}
                {currentSlide?.type === 'open_text' && (
                  <OpenTextResults responses={responses} cardStyle={isAvancaEvent} />
                )}
                {currentSlide?.type === TEAM_SELECTION_TYPE && (
                  <TeamSelectionResults
                    slide={currentSlide}
                    responses={responses}
                    responseCount={responseCount}
                  />
                )}
                  </Motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <MinutesReportModal
        open={reportOpen}
        session={session}
        responses={allResponses}
        participants={participants}
        ownerUid={ownerUid}
        ownerEmail={ownerEmail}
        onAttendanceIssued={setAttendanceReport}
        onClose={() => setReportOpen(false)}
      />
    </>
  )
}

function BackgroundAurora() {
  return <div className="pointer-events-none absolute inset-0 bg-[#f6f4ef]" />
}

function TopSessionBar({ code, status, sessionTitle, onEndProjection, onExit, connectedParticipants, responseCount }) {
  const isLive = status === 'live'
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return undefined
    const t = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(t)
  }, [copied])
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <header className="host-topbar relative z-20 grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-5 sm:py-3 lg:px-7 lg:py-4">
      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-widest sm:px-3 sm:py-1.5 sm:text-xs ${isLive ? 'border-stone-300 bg-stone-100 text-stone-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
          {isLive && (
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="absolute inline-flex h-full w-full bg-stone-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 bg-stone-700 sm:h-2 sm:w-2" />
            </span>
          )}
          <span>{isLive ? 'Ao vivo' : 'Encerrada'}</span>
        </span>
        <p className="truncate text-xs font-medium text-slate-600 sm:text-sm lg:block">{sessionTitle}</p>
      </div>

      <div className="flex items-center justify-center gap-1.5 sm:gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-4 sm:py-2">
          <span className="hidden text-[9px] font-bold uppercase tracking-widest text-slate-500 sm:inline">
            Código
          </span>
          <span className="text-lg font-bold tracking-[0.2em] text-slate-800 sm:text-2xl">{code}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-stone-400 hover:bg-stone-50 hover:text-stone-800 sm:h-8 sm:w-8"
            title={copied ? 'Copiado!' : 'Copiar código'}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <Motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="h-4 w-4 text-stone-700" strokeWidth={3} />
                </Motion.span>
              ) : (
                <Motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy className="h-4 w-4" />
                </Motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:gap-2 lg:gap-3">
        <StatChip icon={Users} label="Online" value={connectedParticipants} tone="brand" size="sm" />
        <StatChip icon={BarChart3} label="Respostas" value={responseCount} tone="violet" size="sm" />
        {isLive && (
          <button
            type="button"
            onClick={onEndProjection}
            aria-label="Encerrar projeção"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 transition-colors hover:bg-red-50 sm:h-10 sm:w-10"
            title="Encerrar projeção"
          >
            <Power className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:px-3.5 sm:py-2.5 sm:text-sm"
          title="Sair da projeção"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden lg:inline">Sair da projeção</span>
        </button>
      </div>
    </header>
  )
}

function StatChip({ icon, value, label, tone = 'brand', size = 'md' }) {
  const bgColors = {
    brand: 'bg-slate-800',
    ocean: 'bg-[#19a7a0]',
    violet: 'bg-[#5367dc]',
  }
  const Icon = icon

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white ${size === 'sm' ? 'px-2 py-1.5' : 'px-3.5 py-2.5'}`}
    >
      <span
        className={`flex items-center justify-center rounded-md ${bgColors[tone]} text-white ${size === 'sm' ? 'h-7 w-7 p-1.5' : 'h-9 w-9 p-2'}`}
      >
        <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </span>
      <div className="hidden sm:block">
        <p
          className={`font-semibold tracking-tight text-slate-800 leading-none ${size === 'sm' ? 'text-sm' : 'text-lg'}`}
        >
          {value}
        </p>
        <p
          className={`font-semibold uppercase tracking-wider text-slate-500 ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'}`}
        >
          {label}
        </p>
      </div>
    </div>
  )
}

function BottomControls({ session, canGoBack, canGoForward, onNext, onPrevious }) {
  return (
    <div className="relative z-20 flex items-center justify-center gap-2 px-2 sm:px-4 lg:bottom-6">
      <Motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:gap-1.5 sm:p-1.5"
      >
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoBack}
          className="group rounded-lg border border-transparent p-2 text-slate-700 transition-colors hover:border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:border-transparent disabled:hover:bg-transparent sm:p-3"
        >
          <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5 sm:h-6 sm:w-6" />
        </button>
        <div className="flex h-8 items-center justify-center rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-800 sm:h-10 sm:px-4">
          {session.currentSlideIndex + 1} / {session.slides.length}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoForward}
          className="group rounded-lg border border-transparent p-2 text-slate-700 transition-colors hover:border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:border-transparent disabled:hover:bg-transparent sm:p-3"
        >
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 sm:h-6 sm:w-6" />
        </button>
      </Motion.div>
    </div>
  )
}

function SummaryNavigation({ slides = [], currentSlideIndex, onGoToSlide, dark = false }) {
  const targetSlides = slides
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => slide?.type !== SUMMARY_TYPE)

  return (
    <div className="mx-auto w-full max-w-4xl text-left">
      <div className={`mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] ${dark ? 'text-white/70' : 'text-slate-500'}`}>
        Selecione um tópico para ir direto ao slide
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {targetSlides.map(({ slide, index }) => {
          const isCurrent = index === currentSlideIndex
          const label = slide?.question || `Slide ${index + 1}`
          return (
            <button
              key={slide?.id || index}
              type="button"
              disabled={isCurrent}
              onClick={() => onGoToSlide?.(index)}
              className={[
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                dark
                  ? isCurrent
                    ? 'border-white/40 bg-white text-slate-900'
                    : 'border-white/20 bg-white/10 text-white hover:border-white/50 hover:bg-white/20'
                  : isCurrent
                    ? 'border-stone-400 bg-stone-100 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:border-stone-400 hover:bg-stone-50',
              ].join(' ')}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${dark ? 'bg-white/15' : 'bg-slate-100'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="line-clamp-2 text-sm font-semibold leading-tight">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SidePanel({
  session,
  currentSlide,
  slides,
  responses,
  connectedParticipants,
  joinUrl,
  presenceUrl,
  slideJoinUrl,
  onOpenReport,
  onDownloadAttendance,
  attendanceDownloading,
  attendanceError,
  attendanceReport,
}) {
  const [feedTab, setFeedTab] = useState('live')
  const [qrFullscreen, setQrFullscreen] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const share = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setShareMessage('Link copiado')
    } catch {
      setShareMessage('Não foi possível copiar')
    }
  }

  return (
    <>
      <aside className="host-side-panel relative z-20 hidden h-full min-h-0 w-full max-w-[360px] flex-col gap-3 overflow-y-auto border-l border-slate-200 bg-white p-3 sm:gap-4 sm:p-5 cs-scroll-thin lg:flex">
        <section className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-[10px]">
              Como entrar
            </p>
            <button
              type="button"
              onClick={() => setQrFullscreen(true)}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-600 transition-colors hover:border-stone-300 hover:bg-stone-100 hover:text-stone-800 sm:px-2 sm:py-1 sm:text-[10px]"
              title="QR code em tela cheia"
            >
              <Maximize2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{' '}
              <span className="hidden sm:inline">Tela cheia</span>
            </button>
          </div>
          <p className="mt-1.5 text-sm font-semibold tracking-tight text-slate-900 sm:text-lg">
            Aponte a câmera
          </p>
          <div className="mt-3 flex items-center gap-3 sm:gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1.5 sm:h-28 sm:w-28 sm:p-2">
              <QRCodeSVG value={joinUrl} size={72} bgColor="transparent" fgColor={QR_CODE_COLORS[0]} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-600 sm:text-xs">Acesse</p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:mt-2 sm:text-xs">
                Código
              </p>
              <p className="text-xl font-bold tracking-[0.18em] text-slate-900 sm:text-2xl">{session.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={share}
            aria-label="Copiar link de participação"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700 transition-colors hover:border-stone-300 hover:bg-stone-100 hover:text-stone-800 sm:mt-4 sm:py-2 sm:text-xs"
          >
            <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{' '}
            <span className="hidden sm:inline" role="status">
              {shareMessage || 'Copiar link de participação'}
            </span>
          </button>
        </section>

        <EventQrTools
          code={session.code}
          slides={slides}
          joinUrl={joinUrl}
          presenceUrl={presenceUrl}
          slideJoinUrl={slideJoinUrl}
          onOpenReport={onOpenReport}
          onDownloadAttendance={onDownloadAttendance}
          attendanceDownloading={attendanceDownloading}
          attendanceError={attendanceError}
          attendanceReport={attendanceReport}
        />

        <section className="shrink-0">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {['live', 'ranking', 'público'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFeedTab(tab)}
                className={[
                  'flex-1 rounded-lg border border-transparent px-2 py-1 text-[9px] font-semibold uppercase tracking-wider transition-colors sm:px-3 sm:py-1.5 sm:text-xs',
                  feedTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
                ].join(' ')}
              >
                {tab === 'live' ? 'Ao vivo' : tab === 'ranking' ? 'Ranking' : 'Público'}
              </button>
            ))}
          </div>

          <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-2.5">
            {feedTab === 'live' && <LiveFeed responses={responses} currentSlide={currentSlide} />}
            {feedTab === 'ranking' && <RankingFeed currentSlide={currentSlide} responses={responses} />}
            {feedTab === 'público' && <AudienceFeed connectedParticipants={connectedParticipants} />}
          </div>
        </section>

        <section className="mt-auto shrink-0 rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm sm:p-5">
          <Badge2>Modo apresentador</Badge2>
          <p className="mt-1.5 text-xs font-bold leading-relaxed text-slate-700 sm:text-sm">
            A plateia está respondendo em tempo real. Você controla o avanço.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-2">
            <MiniStat label="Conexões" value={connectedParticipants} />
            <MiniStat label="Etapa" value={`${session.currentSlideIndex + 1}/${session.slides.length}`} />
          </div>
        </section>
      </aside>

      {qrFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setQrFullscreen(false)}
              className="absolute -top-10 right-0 flex items-center gap-2 border-2 border-white bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-all duration-100 hover:bg-white/20 sm:-top-12 sm:px-4 sm:py-2 sm:text-sm"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" /> Fechar
            </button>
            <div className="flex h-64 w-64 items-center justify-center border-4 border-white bg-white p-4 shadow-2xl sm:h-80 sm:w-80 sm:p-6">
              <QRCodeSVG value={joinUrl} size={200} bgColor="transparent" fgColor={QR_CODE_COLORS[0]} />
            </div>
            <div className="text-center">
              <p className="text-xl font-black tracking-[0.25em] text-white sm:text-2xl">{session.code}</p>
              <p className="mt-1 text-xs font-bold text-slate-300 sm:text-sm">{new URL(joinUrl).host}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function EventQrTools({
  code,
  slides = [],
  joinUrl,
  presenceUrl,
  slideJoinUrl,
  onOpenReport,
  onDownloadAttendance,
  attendanceDownloading,
  attendanceError,
  attendanceReport,
}) {
  const [selectedQr, setSelectedQr] = useState(null)
  const entries = [
    {
      label: 'Participar',
      hint: 'Entrada geral',
      value: joinUrl,
      color: QR_CODE_COLORS[0],
      filename: `qrcode-${code.toLowerCase()}-participar`,
    },
    {
      label: 'Presença',
      hint: 'Lista de frequência',
      value: presenceUrl,
      color: QR_CODE_COLORS[1],
      filename: `qrcode-${code.toLowerCase()}-presenca`,
    },
    {
      label: 'Pergunta atual',
      hint: 'Resposta do painel',
      value: slideJoinUrl,
      color: QR_CODE_COLORS[0],
      filename: `qrcode-${code.toLowerCase()}-pergunta-atual`,
    },
  ]
  const questionEntries = slides.map((slide, index) => ({
    label: `Pergunta ${index + 1}`,
    hint: 'QR da etapa',
    detail: slide.question,
    value: getSlideJoinUrl(code, slide.id),
    color: QR_CODE_COLORS[(index + 3) % QR_CODE_COLORS.length],
    filename: `qrcode-${code.toLowerCase()}-pergunta-${index + 1}`,
  }))

  return (
    <>
      <section className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Acesso rápido</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Entrada, frequência e perguntas</p>
          </div>
          <QrCode className="h-5 w-5 text-stone-700" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {entries.map((entry) => (
            <button
              key={entry.label}
              type="button"
              onClick={() => setSelectedQr(entry)}
              className="group rounded-lg border border-slate-200 bg-slate-50 p-2 text-left transition-colors hover:border-stone-400 hover:bg-stone-100"
              title={`Ampliar QR code: ${entry.label}`}
            >
              <span className="flex aspect-square items-center justify-center rounded-md bg-white p-1">
                <QRCodeSVG value={entry.value} size={82} className="h-full w-full" fgColor={entry.color} />
              </span>
              <span className="mt-2 block truncate text-[10px] font-bold text-slate-800">{entry.label}</span>
              <span className="mt-0.5 block truncate text-[9px] text-slate-500">{entry.hint}</span>
            </button>
          ))}
        </div>
        {questionEntries.length > 0 && (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Um QR por pergunta</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {questionEntries.map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  onClick={() => setSelectedQr(entry)}
                  className="group rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-left transition-colors hover:border-stone-400 hover:bg-stone-100"
                  title={`Ampliar ${entry.label}`}
                >
                  <span className="flex aspect-square items-center justify-center rounded-md bg-white p-1">
                    <QRCodeSVG value={entry.value} size={66} className="h-full w-full" fgColor={entry.color} />
                  </span>
                  <span className="mt-1 block truncate text-center text-[9px] font-bold text-slate-800">{entry.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-[10px] leading-4 text-slate-500">
          O QR de presença exige nome completo e instituição escolhida na lista. Clique em qualquer QR para ampliar e baixar.
        </p>
        <button
          type="button"
          onClick={onOpenReport}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-stone-100 px-3 py-2 text-xs font-bold text-stone-800 transition-colors hover:bg-stone-200"
        >
          <FileText className="h-4 w-4" />
          Gerar documento atualizado
        </button>
        <button
          type="button"
          onClick={onDownloadAttendance}
          disabled={attendanceDownloading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-stone-100 px-3 py-2 text-xs font-bold text-stone-800 transition-colors hover:bg-stone-200 disabled:cursor-wait disabled:opacity-60"
        >
          {attendanceDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {attendanceDownloading ? 'Gerando lista…' : 'Baixar lista de presença (PDF)'}
        </button>
        {attendanceError && <p className="mt-2 text-[10px] leading-4 text-red-700" role="alert">{attendanceError}</p>}
        {attendanceReport?.verificationUrl && (
          <div className="mt-3 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            <p className="flex items-center gap-1.5 font-bold"><ShieldCheck className="h-4 w-4" /> Lista verificável emitida</p>
            <a
              href={attendanceReport.verificationUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2"
            >
              Conferir certificado <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </section>

      {selectedQr && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 sm:p-6">
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 text-center sm:max-h-[calc(100dvh-3rem)] sm:p-8">
            <button
              type="button"
              onClick={() => setSelectedQr(null)}
              className="absolute right-3 top-3 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Fechar QR code"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-700">{selectedQr.hint}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">{selectedQr.label}</h2>
            {selectedQr.detail && <p className="mt-2 max-w-sm text-sm leading-5 text-slate-600">{selectedQr.detail}</p>}
            <div data-event-qr-modal className="mx-auto mt-6 flex aspect-square w-[min(82vw,32rem)] max-w-full items-center justify-center rounded-2xl border-[10px] border-slate-900 bg-white p-4 sm:p-5">
              <QRCodeSVG
                value={selectedQr.value}
                size={480}
                className="h-full w-full"
                fgColor={selectedQr.color ?? QR_CODE_COLORS[0]}
              />
            </div>
            <p className="mt-4 break-all text-[10px] leading-4 text-slate-500">{selectedQr.value}</p>
            <button
              type="button"
              onClick={() => downloadQrCode(selectedQr)}
              className="fala-button mt-4 w-full justify-center"
            >
              <Download size={15} />
              Baixar QR code (SVG)
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function downloadQrCode(entry) {
  const svg = document.querySelector('[data-event-qr-modal] svg')
  if (!svg) return
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  const source = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
    type: 'image/svg+xml;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${entry.filename || 'qrcode-evento'}.svg`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function Badge2({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-stone-700 sm:px-3 sm:py-1 sm:text-[10px]">
      <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {children}
    </span>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-3 sm:py-2">
      <p className="text-base font-semibold leading-tight text-slate-900 sm:text-lg">{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 sm:text-[10px]">
        {label}
      </p>
    </div>
  )
}

function LiveFeed({ responses, currentSlide }) {
  if (!responses.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs font-semibold text-slate-500">
        Aguardando a primeira resposta…
      </div>
    )
  }
  const recent = responses.slice(0, 8)
  return (
    <AnimatePresence initial={false}>
      {recent.map((entry, index) => {
        const displayValue = formatResponseValue(entry.value)
        return (
          <Motion.div
          key={entry.id ?? `${entry.participantId}-${index}`}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="truncate text-xs font-black text-slate-800">{entry.participantName || 'Anônimo'}</p>
            <span className="text-[10px] font-medium text-slate-400">
              {entry.createdAt?.toMillis
                ? new Date(entry.createdAt.toMillis()).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'agora'}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700">
            {currentSlide?.type === 'multiple_choice' && (
              <span className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                <Check className="h-3 w-3" /> {displayValue}
              </span>
            )}
            {currentSlide?.type !== 'multiple_choice' && displayValue}
          </p>
          </Motion.div>
        )
      })}
    </AnimatePresence>
  )
}

function RankingFeed({ currentSlide, responses }) {
  if (!currentSlide || currentSlide.type !== 'multiple_choice') {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs font-semibold text-slate-500">
        Ranking aparece em enquetes.
      </div>
    )
  }
  const counts = currentSlide.options.map((option) => ({
    option,
    count: responses.filter((r) => r.value === option).length,
  }))
  const ranked = [...counts].sort((a, b) => b.count - a.count)
  const total = ranked.reduce((acc, item) => acc + item.count, 0) || 1

  return (
    <div className="space-y-2">
      {ranked.map((row, index) => (
        <div key={row.option} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 truncate text-xs font-black text-slate-800">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${['bg-slate-900 text-white', 'bg-slate-100 text-slate-700', 'bg-slate-100 text-slate-700'][Math.min(index, 2)]}`}
              >
                {index + 1}
              </span>
              {row.option}
            </p>
            <p className="text-xs font-black text-slate-500">{row.count} votos</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <Motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(row.count / total) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full bg-stone-700"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function AudienceFeed({ connectedParticipants }) {
  return (
    <div className="border-y border-stone-200 py-6">
      <p className="font-display text-5xl">{connectedParticipants}</p>
      <p className="mt-2 text-sm text-stone-600">
        {connectedParticipants === 1 ? 'pessoa conectada' : 'pessoas conectadas'}
      </p>
      <p className="mt-3 text-xs leading-5 text-stone-500">
        Os nomes aparecem no feed quando as pessoas respondem.
      </p>
    </div>
  )
}

function ReactionLayer({ reactions }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {reactions.slice(0, 14).map((reaction) => {
          const Icon = REACTION_ICON[reaction.type] ?? HelpCircle
          const rotation =
            (String(reaction.id ?? reaction.type)
              .split('')
              .reduce((total, character) => total + character.charCodeAt(0), 0) %
              20) -
            10
          const palette =
            {
              heart: 'from-rose-400 to-rose-500',
              thumb: 'from-slate-700 to-slate-900',
              question: 'from-amber-400 to-amber-500',
            }[reaction.type] ?? 'from-slate-600 to-slate-800'
          return (
            <Motion.div
              key={reaction.id}
              className="absolute bottom-0"
              initial={{ opacity: 0, y: 100, scale: 0.4 }}
              animate={{ opacity: 1, y: -640, scale: 1.2, rotate: rotation }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 4.2, ease: [0.23, 1, 0.32, 1] }}
              style={{ left: `${reaction.left}%` }}
            >
              <div className="relative">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${palette} p-3 text-white shadow-lg`}
                >
                  <Icon className="h-full w-full" />
                </div>
                <span className="reaction-pop-burst" />
                <span className="reaction-pop-spark reaction-pop-spark-1" />
                <span className="reaction-pop-spark reaction-pop-spark-2" />
                <span className="reaction-pop-spark reaction-pop-spark-3" />
                <span className="reaction-pop-spark reaction-pop-spark-4" />
              </div>
            </Motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
