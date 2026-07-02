import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  ThumbsUp,
  HelpCircle,
  Sparkles,
  Users,
  Check,
  Loader2,
  ArrowLeft,
  Send,
  Type as TypeIcon,
  Hash,
  Signal,
  Wifi,
} from 'lucide-react'
import Logo from '../components/ui/Logo'
import Badge from '../components/ui/Badge'
import { CHART_PALETTE, TEAM_SELECTION_TYPE, SLIDE_TYPES } from '../lib/constants'
import { buildTeamSelectionStats } from '../lib/validators'

export default function ParticipantView({
  session,
  currentSlide,
  responses,
  participantResponse,
  onSubmit,
  onReact,
  sending,
  onExit,
}) {
  const [value, setValue] = useState('')
  const [hasSubmittedThisSlide, setHasSubmittedThisSlide] = useState(false)
  const [submittedValue, setSubmittedValue] = useState('')
  const [syncKey, setSyncKey] = useState('')
  const [connectedNow, setConnectedNow] = useState(0)

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

  useEffect(() => {
    let mounted = true
    const bump = () => {
      try {
        fetch('/api/presence', { method: 'POST', keepalive: true }).catch(() => {})
      } catch {}
    }
    bump()
    const id = window.setInterval(() => {
      if (!mounted) return
      setConnectedNow((c) => Math.max(c, responses.length))
    }, 1200)
    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [responses.length])

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
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#F4F4F0] font-sans text-[#09090B]">
      <BackgroundDecor />

      <header className="sticky top-0 z-20 border-b-[3px] border-[#09090B] bg-white">
        <div className="flex items-center justify-between gap-2 px-5 py-3">
          <Logo size="sm" withWordmark={false} />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 border-2 border-[#09090B] bg-emerald-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#09090B] shadow-[2px_2px_0px_0px_#09090B]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-emerald-600" />
              </span>
              Conectado
            </span>
            <span className="border-2 border-[#09090B] bg-[#09090B] px-3 py-1.5 font-black tracking-[0.2em] text-white shadow-[2px_2px_0px_0px_#09090B]">
              {session.code}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-5 py-8 md:py-12">
        <motion.div
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
          <h1 className="mb-8 text-3xl font-black leading-tight uppercase tracking-tight text-[#09090B] md:text-4xl">
            {currentSlide?.question}
          </h1>

          <AnimatePresence mode="wait">
            {showSubmittedState ? (
              currentSlide?.type === TEAM_SELECTION_TYPE ? (
                <SubmittedStateTeam submittedValue={submittedValue} />
              ) : (
                <SubmittedStateGeneric type={currentSlide?.type} />
              )
            ) : (
              <motion.div
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
                      className="group relative w-full overflow-hidden border-[3px] border-[#09090B] bg-white p-5 text-left shadow-[4px_4px_0px_0px_#09090B] transition-all duration-100 hover:shadow-[6px_6px_0px_0px_#09090B] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60"
                    >
                      <span className="relative z-10 flex items-center justify-between text-base font-bold text-[#09090B]">
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
                          className="group relative w-full overflow-hidden border-[3px] border-[#09090B] bg-white p-5 text-left shadow-[4px_4px_0px_0px_#09090B] transition-all duration-100 hover:shadow-[6px_6px_0px_0px_#09090B] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-60"
                        >
                          <div className="relative z-10 flex items-start justify-between gap-4">
                            <div>
                              <span className="text-xl font-black uppercase tracking-tight text-[#09090B]">
                                {team.name}
                              </span>
                              <p className="mt-1.5 text-xs font-bold text-slate-500">
                                {team.isFull
                                  ? 'Todas as vagas foram preenchidas.'
                                  : `${team.spotsLeft} vaga${team.spotsLeft === 1 ? '' : 's'} restante${team.spotsLeft === 1 ? '' : 's'}`}
                              </p>
                            </div>
                            <span
                              className="border-2 border-[#09090B] px-3 py-1 text-xs font-black uppercase tracking-[0.18em]"
                              style={{ color, backgroundColor: `${color}18` }}
                            >
                              {team.count}/{team.capacity}
                            </span>
                          </div>
                          <div className="relative z-10 mt-4 h-2 overflow-hidden border border-[#09090B] bg-white">
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
                  <form onSubmit={submit} className="space-y-3 border-[3px] border-[#09090B] bg-white p-4 shadow-[4px_4px_0px_0px_#09090B]">
                    <div className="relative">
                      <TypeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        maxLength={25}
                        placeholder="Digite sua ideia..."
                        className="w-full border-[3px] border-[#09090B] bg-white py-4 pl-11 pr-4 text-lg font-bold text-[#09090B] outline-none shadow-[4px_4px_0px_0px_#09090B] placeholder:text-slate-500 placeholder:font-medium focus:bg-[#E2FF32] focus:shadow-[6px_6px_0px_0px_#09090B] focus:translate-x-[-2px] focus:translate-y-[-2px]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending || !value.trim()}
                      className="cs-btn-base w-full gap-2 bg-[#09090B] py-4 text-base font-black text-white"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                      Enviar palavra
                    </button>
                    {hasSubmittedThisSlide && (
                      <p className="flex items-center justify-center gap-1.5 text-center text-sm font-black uppercase tracking-wider text-[#0055FF]">
                        <Check className="h-4 w-4" /> Enviado! Mande mais se quiser.
                      </p>
                    )}
                  </form>
                )}

                {currentSlide?.type === 'open_text' && (
                  <form onSubmit={submit} className="space-y-3">
                    <div className="border-[3px] border-[#09090B] bg-white p-3 shadow-[4px_4px_0px_0px_#09090B]">
                      <textarea
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        maxLength={250}
                        placeholder="Escreva sua pergunta ou comentário..."
                        className="h-40 w-full resize-none border-[3px] border-[#09090B] bg-white px-4 py-4 text-base font-bold text-[#09090B] outline-none shadow-[4px_4px_0px_0px_#09090B] placeholder:text-slate-500 placeholder:font-medium focus:bg-[#E2FF32] focus:shadow-[6px_6px_0px_0px_#09090B] focus:translate-x-[-2px] focus:translate-y-[-2px]"
                      />
                      <div className="px-1 pb-1">
                        <button
                          type="submit"
                          disabled={sending || !value.trim()}
                          className="cs-btn-base w-full gap-2 bg-[#09090B] py-4 text-base font-black text-white"
                        >
                          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                          Enviar resposta
                        </button>
                      </div>
                    </div>
                    <p className="text-center text-xs font-black uppercase tracking-wider text-slate-500">
                      {value.length}/250 caracteres
                    </p>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <FooterReactions onReact={onReact} />
    </div>
  )
}

function SubmittedStateTeam({ submittedValue }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden border-[3px] border-[#09090B] bg-[#09090B] p-9 text-center text-white shadow-[8px_8px_0px_0px_#E2FF32]"
    >
      <div className="relative">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-2 border-white/30 bg-white/20">
          <Users className="h-10 w-10 text-white" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#E2FF32]">vaga confirmada</p>
        <h3 className="mt-2.5 text-3xl font-black tracking-tight">{submittedValue}</h3>
        <p className="mt-2.5 text-base font-bold text-white/80">
          Sua escolha foi registrada. O apresentador já vê em qual clube você está. Olhe a tela principal!
        </p>
      </div>
    </motion.div>
  )
}

function SubmittedStateGeneric({ type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden border-[3px] border-[#09090B] bg-[#09090B] p-9 text-center text-white shadow-[8px_8px_0px_0px_#E2FF32]"
    >
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-2 border-white/30 bg-white/20">
        <Check className="h-10 w-10 text-white" strokeWidth={3} />
      </div>
      <h3 className="text-3xl font-black uppercase tracking-tight">Enviado!</h3>
      <p className="mt-2.5 text-base font-bold text-white/80">
        Olhe para a tela principal para ver os resultados ao vivo.
      </p>
      <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-white/60">
        Tipo · {type === 'multiple_choice' ? 'Enquete' : type === 'open_text' ? 'Resposta aberta' : 'Interação'}
      </p>
    </motion.div>
  )
}

function FooterReactions({ onReact }) {
  return (
    <footer className="sticky bottom-5 z-10 px-5">
      <div className="mx-auto flex w-full max-w-md items-center justify-around border-[3px] border-[#09090B] bg-white p-2.5 shadow-[4px_4px_0px_0px_#09090B]">
        <ReactionButton color="rose" icon={Heart} onClick={() => onReact('heart')} label="Curtir" />
        <span className="h-7 w-px bg-slate-200" />
        <ReactionButton color="brand" icon={ThumbsUp} onClick={() => onReact('thumb')} label="Joinha" />
        <span className="h-7 w-px bg-slate-200" />
        <ReactionButton color="amber" icon={HelpCircle} onClick={() => onReact('question')} label="Dúvida" />
      </div>
    </footer>
  )
}

function ReactionButton({ icon: Icon, onClick, color, label }) {
  const map = {
    rose: { bg: 'bg-rose-50', text: 'text-rose-500', fill: 'group-hover:fill-rose-500' },
    brand: { bg: 'bg-brand-50', text: 'text-brand-500', fill: 'group-hover:fill-brand-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-500', fill: 'group-hover:fill-amber-500' },
  }
  const tone = map[color]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group border-2 border-[#09090B] p-3.5 transition-all duration-100 hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${tone.bg}`}
      aria-label={label}
    >
      <Icon className={`h-7 w-7 ${tone.text} ${tone.fill} transition-transform`} />
    </button>
  )
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[#F4F4F0]" />
      <div className="pointer-events-none absolute inset-0 cs-grid opacity-30 cs-mask-radial" />
    </>
  )
}
