import { useMemo, useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Check,
  Loader2,
  ArrowLeft,
  Send,
  Type as TypeIcon,
  Hash,
  FileText,
  Signal,
  Wifi,
} from 'lucide-react'
import Logo from '../components/ui/Logo'
import Badge from '../components/ui/Badge'
import { CHART_PALETTE, EVIDENCE_BOARD_TYPE, SUMMARY_TYPE, TEAM_SELECTION_TYPE, SLIDE_TYPES } from '../lib/constants'
import { buildTeamSelectionStats } from '../lib/validators'

export default function ParticipantView({
  session,
  currentSlide,
  responses,
  participantResponse,
  onSubmit,
  sending,
  onExit,
}) {
  const [value, setValue] = useState('')
  const [hasSubmittedThisSlide, setHasSubmittedThisSlide] = useState(false)
  const [submittedValue, setSubmittedValue] = useState('')
  const [syncKey, setSyncKey] = useState('')

  const currentSyncKey = `${currentSlide?.id ?? ''}|${currentSlide?.type ?? ''}|${participantResponse?.id ?? ''}`
  if (currentSyncKey !== syncKey) {
    setSyncKey(currentSyncKey)
    if (currentSlide?.type === 'word_cloud') {
      setHasSubmittedThisSlide(false)
      setSubmittedValue('')
    } else if (participantResponse) {
      setHasSubmittedThisSlide(true)
      setSubmittedValue(participantResponse.value ?? '')
    } else {
      setHasSubmittedThisSlide(false)
      setSubmittedValue('')
    }
  }

  const teamSelectionStats = useMemo(() => {
    if (!currentSlide || currentSlide.type !== TEAM_SELECTION_TYPE) return []
    return buildTeamSelectionStats(currentSlide, responses)
  }, [currentSlide, responses])

  const submit = async (event, predefinedValue) => {
    event?.preventDefault?.()
    const finalValue = predefinedValue ?? value
    if (!finalValue.trim()) return

    const didSubmit = await onSubmit(finalValue)
    if (!didSubmit) return

    setHasSubmittedThisSlide(true)
    setSubmittedValue(finalValue)
    if (!predefinedValue) setValue('')
  }

  const showSubmittedState = currentSlide?.type !== 'word_cloud' && hasSubmittedThisSlide
  const slideType = currentSlide ? SLIDE_TYPES[currentSlide.type] : null

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#f6f4ef] font-sans text-slate-900">
      <BackgroundDecor />

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-2 px-5 py-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onExit} aria-label="Sair da apresentação" className="p-1">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-stone-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-stone-600" />
              </span>
              Conectado
            </span>
            <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold tracking-[0.18em] text-white">
              {session.code}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-5 py-8 md:py-12">
        <Motion.div
          key={currentSlide?.id ?? 'loading'}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto w-full max-w-lg cs-slide-up"
        >
          {slideType && (
            <Badge tone={slideType.tone ?? 'brand'} className="mb-4">
              {slideType.label}
            </Badge>
          )}
          <h1 className="mb-8 font-display text-4xl font-semibold uppercase leading-[1.05] tracking-tight text-slate-900 md:text-5xl">
            {currentSlide?.question}
          </h1>

          <AnimatePresence mode="wait">
             {currentSlide?.type === EVIDENCE_BOARD_TYPE ? (
               <ParticipantEvidenceState />
             ) : currentSlide?.type === SUMMARY_TYPE ? (
               <ParticipantSummaryState />
             ) : showSubmittedState ? (
              currentSlide?.type === TEAM_SELECTION_TYPE ? (
                <SubmittedStateTeam submittedValue={submittedValue} />
              ) : (
                <SubmittedStateGeneric type={currentSlide?.type} />
              )
            ) : (
              <Motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {currentSlide?.type === 'multiple_choice' &&
                  currentSlide.options.map((option) => (
                    <button
                      key={option}
                      onClick={(event) => submit(event, option)}
                      disabled={sending}
                      className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:opacity-60"
                    >
                      <span className="relative z-10 flex items-center justify-between text-base font-medium text-slate-800">
                        {option}
                        <Send className="h-4 w-4 transition-all" />
                      </span>
                    </button>
                  ))}

                {currentSlide?.type === TEAM_SELECTION_TYPE && (
                  <div className="space-y-3">
                    {teamSelectionStats.map((team) => {
                      const color = CHART_PALETTE[team._colorIndex % CHART_PALETTE.length]
                      const isDisabled = sending || team.isFull
                      return (
                        <button
                          key={team.id ?? team.name}
                          onClick={(event) => submit(event, team.name)}
                          disabled={isDisabled}
                          className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-60"
                        >
                          <div className="relative z-10 flex items-start justify-between gap-4">
                            <div>
                              <span className="text-xl font-semibold tracking-tight text-slate-900">
                                {team.name}
                              </span>
                              <p className="mt-1.5 text-xs font-bold text-slate-500">
                                {team.isFull
                                  ? 'Todas as vagas foram preenchidas.'
                                  : `${team.spotsLeft} vaga${team.spotsLeft === 1 ? '' : 's'} restante${team.spotsLeft === 1 ? '' : 's'}`}
                              </p>
                            </div>
                            <span
                              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium tracking-wide text-slate-600"
                              style={{ color, backgroundColor: `${color}18` }}
                            >
                              {team.count}/{team.capacity}
                            </span>
                          </div>
                          <div className="relative z-10 mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${team.capacity > 0 ? Math.max(Math.round((team.count / team.capacity) * 100), team.count > 0 ? 8 : 0) : 0}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {currentSlide?.type === 'word_cloud' && (
                  <form
                    onSubmit={submit}
                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="relative">
                      <TypeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        maxLength={25}
                        placeholder="Digite sua ideia..."
                        className="cs-input-base py-4 pl-11 text-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending || !value.trim()}
                      className="cs-btn-base w-full gap-2 py-4 text-base"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      Enviar palavra
                    </button>
                    {hasSubmittedThisSlide && (
                      <p className="flex items-center justify-center gap-1.5 text-center text-sm font-medium text-stone-700">
                        <Check className="h-4 w-4" /> Enviado! Mande mais se quiser.
                      </p>
                    )}
                  </form>
                )}

                {currentSlide?.type === 'open_text' && (
                  <form onSubmit={submit} className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <textarea
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        maxLength={220}
                        placeholder="Escreva sua pergunta ou comentário..."
                        className="cs-input-base h-40 resize-none px-4 py-4 text-base"
                      />
                      <div className="px-1 pb-1">
                        <button
                          type="submit"
                          disabled={sending || !value.trim()}
                          className="cs-btn-base w-full gap-2 py-4 text-base"
                        >
                          {sending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                          Enviar resposta
                        </button>
                      </div>
                    </div>
                    <p className="text-center text-xs text-slate-500">{value.length}/220 caracteres</p>
                  </form>
                )}
              </Motion.div>
            )}
          </AnimatePresence>
        </Motion.div>
      </main>

    </div>
  )
}

function SubmittedStateTeam({ submittedValue }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl bg-slate-900 p-9 text-center text-white shadow-xl shadow-slate-900/10"
    >
      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <Users className="h-10 w-10 text-white" />
        </div>
        <p className="text-xs font-medium tracking-wide text-stone-300">Escolha confirmada</p>
        <h3 className="mt-2.5 text-3xl font-semibold tracking-tight">{submittedValue}</h3>
        <p className="mt-2.5 text-base leading-6 text-white/75">
          Sua escolha foi registrada. O apresentador já vê em qual clube você está. Olhe a tela principal!
        </p>
      </div>
    </Motion.div>
  )
}

function SubmittedStateGeneric({ type }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl bg-slate-900 p-9 text-center text-white shadow-xl shadow-slate-900/10"
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        <Check className="h-10 w-10 text-white" strokeWidth={3} />
      </div>
      <h3 className="text-3xl font-semibold tracking-tight">Enviado!</h3>
      <p className="mt-2.5 text-base leading-6 text-white/75">
        Olhe para a tela principal para ver os resultados ao vivo.
      </p>
      <p className="mt-3 text-xs text-white/60">
        Tipo ·{' '}
        {type === 'multiple_choice' ? 'Enquete' : type === 'open_text' ? 'Resposta aberta' : 'Interação'}
      </p>
    </Motion.div>
  )
}

function ParticipantEvidenceState() {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl bg-slate-900 p-9 text-center text-white shadow-xl shadow-slate-900/10"
    >
      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <FileText className="h-10 w-10 text-white" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-300">Etapa final</p>
        <h3 className="mt-2.5 text-3xl font-semibold tracking-tight">Quadro de evidências</h3>
        <p className="mt-2.5 text-base leading-6 text-white/75">
          As contribuições do evento foram organizadas na tela principal.
        </p>
      </div>
    </Motion.div>
  )
}

function ParticipantSummaryState() {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl bg-slate-900 p-9 text-center text-white shadow-xl shadow-slate-900/10"
    >
      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <FileText className="h-10 w-10 text-white" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-300">Navegação</p>
        <h3 className="mt-2.5 text-3xl font-semibold tracking-tight">Sumário da apresentação</h3>
        <p className="mt-2.5 text-base leading-6 text-white/75">
          O apresentador está escolhendo o próximo tópico. Acompanhe a tela principal.
        </p>
      </div>
    </Motion.div>
  )
}

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(39,82,216,0.08),_transparent_35%)]" />
  )
}
