import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  BarChart3,
  Heart,
  ThumbsUp,
  HelpCircle,
  Copy,
  Check,
  Eye,
  Square,
  Share2,
  Pause,
  Play as PlayIcon,
  Sparkles,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { TEAM_SELECTION_TYPE } from '../lib/constants'
import { COLORS } from '../lib/colors'
import { buildTeamSelectionStats, getJoinUrl } from '../lib/validators'
import MultipleChoiceResults from '../components/slides/MultipleChoiceResults'
import WordCloudResults from '../components/slides/WordCloudResults'
import OpenTextResults from '../components/slides/OpenTextResults'
import TeamSelectionResults from '../components/slides/TeamSelectionResults'

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
  currentSlide,
  responses,
  reactions,
  connectedParticipants,
  currentSlideIndex,
  onNext,
  onPrevious,
  canGoBack,
  canGoForward,
  onExit,
}) {
  const joinUrl = useMemo(() => getJoinUrl(session.code), [session.code])

  const responseCount = useMemo(() => {
    if (currentSlide?.type === TEAM_SELECTION_TYPE) {
      return buildTeamSelectionStats(currentSlide, responses).reduce((total, team) => total + team.count, 0)
    }
    return responses.length
  }, [currentSlide, responses])

  return (
    <div className="relative grid h-[100dvh] grid-cols-1 overflow-hidden bg-[#F4F4F0] font-sans text-[#09090B] lg:grid-cols-[minmax(0,1fr)_360px]">
      <BackgroundAurora />

      <main className="relative z-10 flex h-full flex-col overflow-hidden">
        <TopSessionBar code={session.code} sessionTitle={session.title} onExit={onExit} connectedParticipants={connectedParticipants} responseCount={responseCount} />

        <section className="relative flex flex-1 items-center justify-center overflow-y-auto px-6 py-8 cs-scroll-thin">
          <div className="w-full max-w-6xl text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide?.id ?? 'empty'}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-8"
              >
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 border-2 border-[#09090B] bg-[#E2FF32] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#09090B] shadow-[2px_2px_0px_0px_#09090B]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Etapa {currentSlideIndex + 1} · {currentSlide?.type === 'multiple_choice' ? 'Enquete' : currentSlide?.type === 'word_cloud' ? 'Nuvem' : currentSlide?.type === 'open_text' ? 'Q&A' : currentSlide?.type === TEAM_SELECTION_TYPE ? 'Times' : 'Etapa'}
                </motion.p>

                <motion.h1
                  className="mx-auto max-w-5xl text-4xl font-black leading-[1.05] uppercase tracking-tight text-[#09090B] md:text-5xl lg:text-6xl"
                >
                  {currentSlide?.question}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mx-auto w-full"
                >
                  {currentSlide?.type === 'multiple_choice' && (
                    <MultipleChoiceResults slide={currentSlide} responses={responses} responseCount={responseCount} />
                  )}
                  {currentSlide?.type === 'word_cloud' && <WordCloudResults responses={responses} />}
                  {currentSlide?.type === 'open_text' && <OpenTextResults responses={responses} />}
                  {currentSlide?.type === TEAM_SELECTION_TYPE && (
                    <TeamSelectionResults slide={currentSlide} responses={responses} responseCount={responseCount} />
                  )}
                </motion.div>
              </motion.div>
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
        responses={responses}
        connectedParticipants={connectedParticipants}
        joinUrl={joinUrl}
        reactionCount={reactions.length}
      />
    </div>
  )
}

function BackgroundAurora() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[#F4F4F0]" />
      <div className="pointer-events-none absolute inset-0 cs-grid opacity-30 cs-mask-radial" />
    </>
  )
}

function TopSessionBar({ code, sessionTitle, onExit, connectedParticipants, responseCount }) {
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
    } catch {}
  }
  return (
    <header className="relative z-20 grid grid-cols-1 items-center gap-3 border-b-[3px] border-[#09090B] bg-white px-5 py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-7 lg:py-4">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 border-2 border-[#09090B] bg-emerald-300 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#09090B] shadow-[2px_2px_0px_0px_#09090B]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 bg-emerald-600" />
          </span>
          Ao vivo
        </span>
        <p className="hidden truncate text-sm font-bold text-slate-600 lg:block">{sessionTitle}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 border-[3px] border-[#09090B] bg-white px-4 py-2 shadow-[4px_4px_0px_0px_#09090B]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código</span>
          <span className="text-2xl font-black tracking-[0.25em] text-[#09090B]">
            {code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-8 w-8 items-center justify-center border-2 border-[#09090B] bg-white text-slate-500 hover:bg-[#E2FF32] hover:text-[#09090B] hover:shadow-[2px_2px_0px_0px_#09090B] transition-all duration-100"
            title={copied ? 'Copiado!' : 'Copiar código'}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 lg:gap-3">
        <StatChip icon={Users} label="Online" value={connectedParticipants} tone="brand" />
        <StatChip icon={BarChart3} label="Respostas" value={responseCount} tone="violet" />
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 border-2 border-[#09090B] bg-white px-3.5 py-2.5 text-sm font-bold text-[#09090B] transition-all duration-100 hover:bg-[#FF0055] hover:text-white hover:shadow-[2px_2px_0px_0px_#09090B] lg:px-4"
          title="Sair da projeção"
        >
          <Square className="h-4 w-4 fill-current" />
          <span className="hidden lg:inline">Encerrar</span>
        </button>
      </div>
    </header>
  )
}

function StatChip({ icon: Icon, value, label, tone = 'brand' }) {
  const bgColors = {
    brand: 'bg-[#09090B]',
    ocean: 'bg-[#0055FF]',
    violet: 'bg-[#7C3AED]',
  }
  return (
    <div className="flex items-center gap-2.5 border-[3px] border-[#09090B] bg-white px-3.5 py-2.5 shadow-[4px_4px_0px_0px_#09090B]">
      <span className={`flex h-9 w-9 items-center justify-center border-2 border-[#09090B] ${bgColors[tone]} text-white`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-lg font-black tracking-tight text-[#09090B] leading-none">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function BottomControls({ session, canGoBack, canGoForward, onNext, onPrevious }) {
  const [paused, setPaused] = useState(false)

  return (
    <div className="absolute inset-x-0 bottom-5 z-30 flex items-center justify-center gap-3 px-4 lg:bottom-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-1.5 border-[3px] border-[#09090B] bg-[#09090B] p-1.5 shadow-[4px_4px_0px_0px_#09090B]"
      >
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoBack}
          className="group border-2 border-transparent p-3 text-white transition-all duration-100 hover:border-white hover:bg-white/10 disabled:opacity-30 disabled:hover:border-transparent disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" />
        </button>
        <div className="flex h-10 items-center justify-center border-2 border-white/30 bg-white/10 px-4 font-black text-white">
          {session.currentSlideIndex + 1} / {session.slides.length}
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className={[
            'border-2 border-transparent p-3 transition-all duration-100',
            paused ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'text-white hover:border-white/30 hover:bg-white/10',
          ].join(' ')}
          title={paused ? 'Retomar recepção' : 'Pausar recepção'}
        >
          {paused ? <PlayIcon className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoForward}
          className="group border-2 border-transparent p-3 text-white transition-all duration-100 hover:border-white hover:bg-white/10 disabled:opacity-30 disabled:hover:border-transparent disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>
    </div>
  )
}

function SidePanel({ session, currentSlide, responses, connectedParticipants, joinUrl }) {
  const [feedTab, setFeedTab] = useState('live')
  return (
    <aside className="relative z-20 hidden h-full flex-col gap-4 overflow-y-auto border-l-[3px] border-[#09090B] bg-white px-5 py-5 cs-scroll-thin lg:flex">
      <section className="relative overflow-hidden border-[3px] border-[#09090B] bg-[#09090B] p-5 text-white shadow-[6px_6px_0px_0px_#09090B]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#E2FF32]">Como entrar</p>
        <p className="mt-1 text-lg font-black tracking-tight">Aponte a câmera do celular</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center border-2 border-white bg-white p-2">
            <QRCodeSVG
              value={joinUrl}
              size={104}
              bgColor="transparent"
              fgColor={COLORS.brand[700]}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-300">Acesse</p>
            <p className="truncate text-base font-black tracking-tight">cloudspeak.com</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-400">Código</p>
            <p className="text-2xl font-black tracking-[0.18em] text-[#E2FF32]">
              {session.code}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(session.code)}
          className="mt-4 flex w-full items-center justify-center gap-2 border-2 border-white/30 bg-white/10 py-2 text-xs font-black uppercase tracking-wider text-white transition-all duration-100 hover:bg-white/20 hover:border-white/50"
        >
          <Share2 className="h-3.5 w-3.5" /> Compartilhar link
        </button>
      </section>

      <section>
        <div className="flex items-center gap-1 border-[3px] border-[#09090B] bg-white p-1 shadow-[3px_3px_0px_0px_#09090B]">
          {['live', 'ranking', 'público'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFeedTab(tab)}
              className={[
                'flex-1 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all duration-100 border-2',
                feedTab === tab
                  ? 'bg-[#09090B] text-white border-[#09090B]'
                  : 'text-slate-500 border-transparent hover:border-[#09090B] hover:bg-[#F4F4F0]',
              ].join(' ')}
            >
              {tab === 'live' ? 'Ao vivo' : tab === 'ranking' ? 'Ranking' : 'Público'}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2.5">
          {feedTab === 'live' && <LiveFeed responses={responses} currentSlide={currentSlide} />}
          {feedTab === 'ranking' && <RankingFeed currentSlide={currentSlide} responses={responses} />}
          {feedTab === 'público' && <AudienceFeed connectedParticipants={connectedParticipants} />}
        </div>
      </section>

      <section className="mt-auto border-[3px] border-[#09090B] bg-[#09090B] p-5 text-white shadow-[6px_6px_0px_0px_#09090B]">
        <Badge2>Modo apresentador</Badge2>
        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-300">
          A plateia está respondendo em tempo real. Você controla o avanço das etapas.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat label="Conexões" value={connectedParticipants} />
          <MiniStat label="Etapa" value={`${session.currentSlideIndex + 1}/${session.slides.length}`} />
        </div>
      </section>
    </aside>
  )
}

function Badge2({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 border-2 border-white/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
      <Eye className="h-3 w-3" /> {children}
    </span>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="border-2 border-white/30 bg-white/10 px-3 py-2">
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}

function LiveFeed({ responses, currentSlide }) {
  if (!responses.length) {
    return (
      <div className="border-[3px] border-dashed border-[#09090B] bg-white p-5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
        Aguardando a primeira resposta…
      </div>
    )
  }
  const recent = [...responses].reverse().slice(0, 8)
  return (
    <AnimatePresence initial={false}>
      {recent.map((entry, index) => (
        <motion.div
          key={entry.id ?? `${entry.participantId}-${index}`}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden border-2 border-[#09090B] bg-white p-3 shadow-[2px_2px_0px_0px_#09090B]"
        >
          <div className="flex items-center justify-between">
            <p className="truncate text-xs font-black text-slate-800">{entry.participantName || 'Anônimo'}</p>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {new Date(entry.createdAt?.toMillis?.() ?? Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-700">
            {currentSlide?.type === 'multiple_choice' && (
              <span className="inline-flex items-center gap-2 border border-[#09090B] bg-brand-200 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#09090B]">
                <Check className="h-3 w-3" /> {entry.value}
              </span>
            )}
            {currentSlide?.type !== 'multiple_choice' && entry.value}
          </p>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

function RankingFeed({ currentSlide, responses }) {
  if (!currentSlide || currentSlide.type !== 'multiple_choice') {
    return (
      <div className="border-[3px] border-dashed border-[#09090B] bg-white p-5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
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
        <div
          key={row.option}
          className="border-2 border-[#09090B] bg-white p-3 shadow-[2px_2px_0px_0px_#09090B]"
        >
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 truncate text-xs font-black text-slate-800">
              <span className={`flex h-6 w-6 items-center justify-center border-2 border-[#09090B] text-[10px] font-black ${['bg-[#09090B] text-white', 'bg-slate-200 text-[#09090B]', 'bg-slate-200 text-[#09090B]'][Math.min(index, 2)]}`}>
                {index + 1}
              </span>
              {row.option}
            </p>
            <p className="text-xs font-black text-slate-500">{row.count} votos</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden border border-[#09090B] bg-white">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(row.count / total) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="h-full bg-[#09090B]"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function AudienceFeed({ connectedParticipants }) {
  const fakeNames = ['Marina', 'Diego', 'Camila', 'Rafael', 'Bruna', 'Artur', 'Letícia', 'Pedro', 'Júlia', 'Vitor']
  const visible = fakeNames.slice(0, Math.min(connectedParticipants, fakeNames.length))
  return (
    <div className="grid grid-cols-1 gap-2">
      {visible.map((name, i) => {
        const gradient = ['from-brand-500 to-violet-500', 'from-ocean-500 to-ocean-700', 'from-sunset-500 to-coral-500', 'from-violet-500 to-coral-500'][i % 4]
        return (
          <div key={name + i} className="flex items-center gap-3 border-2 border-[#09090B] bg-white px-3 py-2 shadow-[2px_2px_0px_0px_#09090B]">
            <span className={`flex h-9 w-9 items-center justify-center border-2 border-[#09090B] bg-[#09090B] text-sm font-black text-white`}>
              {name[0]}
            </span>
            <p className="truncate text-xs font-bold text-[#09090B]">{name}</p>
            <span className="ml-auto h-2 w-2 border border-[#09090B] bg-emerald-400" />
          </div>
        )
      })}
      {connectedParticipants > visible.length && (
        <div className="text-center text-xs font-black uppercase tracking-wider text-slate-500">+{connectedParticipants - visible.length} outros</div>
      )}
      {visible.length === 0 && (
        <div className="border-[3px] border-dashed border-[#09090B] bg-white p-5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
          Aguardando conexão do público…
        </div>
      )}
    </div>
  )
}

function ReactionLayer({ reactions }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {reactions.slice(0, 14).map((reaction) => {
          const Icon = REACTION_ICON[reaction.type] ?? HelpCircle
          const palette = {
            heart: 'from-rose-400 to-rose-500',
            thumb: 'from-brand-500 to-brand-600',
            question: 'from-amber-400 to-amber-500',
          }[reaction.type] ?? 'from-brand-500 to-violet-500'
          return (
            <motion.div
              key={reaction.id}
              className="absolute bottom-0"
              initial={{ opacity: 0, y: 100, scale: 0.4 }}
              animate={{ opacity: 1, y: -640, scale: 1.2, rotate: Math.random() * 20 - 10 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 4.2, ease: [0.23, 1, 0.32, 1] }}
              style={{ left: `${reaction.left}%` }}
            >
              <div className="relative">
                <div className={`h-14 w-14 border-2 border-[#09090B] bg-gradient-to-br ${palette} p-3 text-white`}>
                  <Icon className="h-full w-full" />
                </div>
                <span className="reaction-pop-burst" />
                <span className="reaction-pop-spark reaction-pop-spark-1" />
                <span className="reaction-pop-spark reaction-pop-spark-2" />
                <span className="reaction-pop-spark reaction-pop-spark-3" />
                <span className="reaction-pop-spark reaction-pop-spark-4" />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
