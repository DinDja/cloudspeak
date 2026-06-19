import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Users, BarChart3, X, Heart, ThumbsUp, HelpCircle } from 'lucide-react'
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

function reactionClass(type) {
  if (type === 'heart') return 'h-16 w-16 fill-rose-500 text-rose-500 drop-shadow-xl'
  if (type === 'thumb') return 'h-16 w-16 fill-brand-600 text-brand-600 drop-shadow-xl'
  return 'h-16 w-16 fill-gold-400 text-slate-900 drop-shadow-xl'
}

export default function HostView({
  session,
  currentSlide,
  responses,
  reactions,
  connectedParticipants,
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
    <div className="relative min-h-[100dvh] overflow-hidden bg-canvas font-sans text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-grid-soft bg-[size:32px_32px] opacity-50" />

      <button
        type="button"
        onClick={onExit}
        className="fixed left-5 top-5 z-40 inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-600 shadow-soft ring-1 ring-slate-200 backdrop-blur-md transition-colors hover:bg-white hover:text-rose-600"
        title="Sair da projeção"
      >
        <X className="h-4 w-4" /> Sair
      </button>

      <div className="absolute left-0 right-0 top-4 z-10 flex justify-center px-4 cs-slide-down">
        <div className="flex items-center gap-5 rounded-4xl bg-white/85 p-3 pr-8 shadow-float ring-1 ring-slate-200/60 backdrop-blur-xl">
          <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-inner ring-1 ring-slate-100">
            <QRCodeSVG value={joinUrl} size={108} bgColor="transparent" fgColor={COLORS.slate[900]} />
          </div>
          <div className="text-left">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ocean-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ocean-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ocean-500" />
              </span>
              Ao vivo
            </span>
            <div className="mt-1 text-sm font-medium text-slate-600">
              Acesse <strong className="font-bold text-slate-900">cloudspeak.netlify.app</strong> e use o código:
            </div>
            <div className="mt-0.5 text-3xl font-black tracking-[0.2em] text-brand-600">{session.code}</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col items-center justify-center px-6 pb-32 pt-44 text-center">
        <h1 className="mb-14 max-w-5xl text-5xl font-black leading-tight tracking-tight text-slate-900 drop-shadow-sm md:text-6xl lg:text-7xl cs-text-balance">
          {currentSlide?.question}
        </h1>

        <div className="w-full max-w-4xl flex-1">
          {currentSlide?.type === 'multiple_choice' && (
            <MultipleChoiceResults slide={currentSlide} responses={responses} responseCount={responseCount} />
          )}
          {currentSlide?.type === 'word_cloud' && <WordCloudResults responses={responses} />}
          {currentSlide?.type === 'open_text' && <OpenTextResults responses={responses} />}
          {currentSlide?.type === TEAM_SELECTION_TYPE && (
            <TeamSelectionResults slide={currentSlide} responses={responses} responseCount={responseCount} />
          )}
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900/90 p-2.5 shadow-float ring-1 ring-white/10 backdrop-blur-xl">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoBack}
          className="group rounded-full p-3 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-7 w-7 transition-transform group-hover:-translate-x-1" />
        </button>
        <div className="flex h-10 items-center justify-center rounded-full bg-white/10 px-5 font-bold text-white shadow-inner">
          {session.currentSlideIndex + 1} / {session.slides.length}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoForward}
          className="group rounded-full p-3 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-7 w-7 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="fixed bottom-10 left-10 z-20 flex items-center gap-3 rounded-2xl bg-white/85 px-5 py-3 font-bold text-slate-600 shadow-soft ring-1 ring-slate-200/60 backdrop-blur-md">
        <Users className="h-6 w-6 text-brand-500" />
        <span className="text-xl">{connectedParticipants}</span>
      </div>
      <div className="fixed bottom-10 right-10 z-20 flex items-center gap-3 rounded-2xl bg-white/85 px-5 py-3 font-bold text-slate-600 shadow-soft ring-1 ring-slate-200/60 backdrop-blur-md">
        <BarChart3 className="h-6 w-6 text-rose-500" />
        <span className="text-xl">{responseCount}</span>
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {reactions.map((reaction) => {
          const Icon = REACTION_ICON[reaction.type] ?? HelpCircle
          return (
            <div
              key={reaction.id}
              className="absolute bottom-0 animate-float-up opacity-0"
              style={{ left: `${reaction.left}%` }}
            >
              <div className="relative">
                <Icon className={reactionClass(reaction.type)} />
                <span className="reaction-pop-burst" />
                <span className="reaction-pop-spark reaction-pop-spark-1" />
                <span className="reaction-pop-spark reaction-pop-spark-2" />
                <span className="reaction-pop-spark reaction-pop-spark-3" />
                <span className="reaction-pop-spark reaction-pop-spark-4" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
