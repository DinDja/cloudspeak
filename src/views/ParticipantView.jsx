import { useMemo, useState } from 'react'
import {
  Heart,
  ThumbsUp,
  HelpCircle,
  Sparkles,
  Users,
  Check,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import Logo from '../components/ui/Logo'
import { CHART_PALETTE, TEAM_SELECTION_TYPE } from '../lib/constants'
import { buildTeamSelectionStats } from '../lib/validators'

export default function ParticipantView({ session, currentSlide, responses, participantResponse, onSubmit, onReact, sending, onExit }) {
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
    event?.preventDefault()
    const finalValue = predefinedValue ?? value
    if (!finalValue.trim()) return

    const didSubmit = await onSubmit(finalValue)
    if (!didSubmit) return

    setHasSubmittedThisSlide(true)
    setSubmittedValue(finalValue)
    if (!predefinedValue) setValue('')
  }

  const showSubmittedState = currentSlide?.type !== 'word_cloud' && hasSubmittedThisSlide

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas font-sans text-slate-900">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/50 bg-white/85 px-5 py-3.5 backdrop-blur-md">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black tracking-widest text-slate-500">
            SALA {session.code}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600"
            title="Sair"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 md:py-14">
        <div className="mx-auto w-full max-w-lg cs-slide-up">
          <h1 className="mb-8 text-3xl font-black leading-tight tracking-tight text-slate-900 cs-text-balance md:text-4xl">
            {currentSlide?.question}
          </h1>

          {showSubmittedState ? (
            currentSlide?.type === TEAM_SELECTION_TYPE ? (
              <div className="mt-10 flex flex-col items-center justify-center rounded-4xl bg-brand-gradient p-9 text-center text-white shadow-float">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-100">vaga confirmada</p>
                <h3 className="mt-2.5 text-3xl font-black tracking-tight">{submittedValue}</h3>
                <p className="mt-2.5 text-base font-medium text-brand-50">
                  Sua escolha foi registrada. O apresentador já consegue ver em qual clube você está.
                </p>
              </div>
            ) : (
              <div className="mt-10 flex flex-col items-center justify-center rounded-4xl bg-ocean-gradient p-9 text-center text-white shadow-float">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                  <Check className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">Enviado!</h3>
                <p className="mt-2.5 text-base font-medium text-ocean-50">Olhe para a tela principal para ver os resultados ao vivo.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {currentSlide?.type === 'multiple_choice' &&
                currentSlide.options.map((option) => (
                  <button
                    key={option}
                    onClick={(event) => submit(event, option)}
                    disabled={sending}
                    className="group relative w-full overflow-hidden rounded-3xl bg-white p-6 text-left shadow-soft ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-float hover:ring-brand-400 active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className="relative z-10 text-xl font-bold text-slate-800 transition-colors group-hover:text-brand-700">
                      {option}
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-brand-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}

              {currentSlide?.type === TEAM_SELECTION_TYPE && (
                <div className="space-y-4">
                  {teamSelectionStats.map((team) => {
                    const color = CHART_PALETTE[team._colorIndex % CHART_PALETTE.length]
                    const isDisabled = sending || team.isFull
                    return (
                      <button
                        key={team.id ?? team.name}
                        onClick={(event) => submit(event, team.name)}
                        disabled={isDisabled}
                        className="group relative w-full overflow-hidden rounded-3xl bg-white p-6 text-left shadow-soft ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-float hover:ring-brand-400 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                      >
                        <div className="relative z-10 flex items-start justify-between gap-4">
                          <div>
                            <span className="text-2xl font-black text-slate-800 transition-colors group-hover:text-brand-700">
                              {team.name}
                            </span>
                            <p className="mt-1.5 text-sm font-semibold text-slate-500">
                              {team.isFull
                                ? 'Todas as vagas foram preenchidas.'
                                : `${team.spotsLeft} vaga${team.spotsLeft === 1 ? '' : 's'} restante${team.spotsLeft === 1 ? '' : 's'}`}
                            </p>
                          </div>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]"
                            style={{ color, backgroundColor: `${color}18` }}
                          >
                            {team.count}/{team.capacity}
                          </span>
                        </div>
                        <div className="relative z-10 mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200/80">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
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
                <form onSubmit={submit} className="space-y-4 rounded-4xl bg-white p-6 shadow-card ring-1 ring-slate-200">
                  <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    maxLength={25}
                    placeholder="Digite sua ideia..."
                    className="w-full rounded-2xl bg-slate-50 px-6 py-5 text-xl font-bold text-slate-800 outline-none ring-2 ring-transparent transition-all placeholder:text-slate-400 focus:bg-white focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !value.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-5 text-xl font-black text-white shadow-soft transition-all hover:bg-brand-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    Enviar Palavra
                  </button>
                  {hasSubmittedThisSlide && (
                    <p className="pt-1 text-center text-sm font-bold text-ocean-700">✓ Enviado! Mande mais palavras se quiser.</p>
                  )}
                </form>
              )}

              {currentSlide?.type === 'open_text' && (
                <form onSubmit={submit} className="space-y-4">
                  <div className="rounded-4xl bg-white p-2 shadow-card ring-1 ring-slate-200">
                    <textarea
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      maxLength={250}
                      placeholder="Escreva sua pergunta ou comentário aqui..."
                      className="h-40 w-full resize-none rounded-3xl bg-slate-50 px-6 py-5 text-xl font-medium text-slate-800 outline-none ring-2 ring-transparent transition-all placeholder:text-slate-400 focus:bg-white focus:ring-brand-500"
                    />
                    <div className="p-2">
                      <button
                        type="submit"
                        disabled={sending || !value.trim()}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-5 text-xl font-black text-white shadow-soft transition-all hover:bg-slate-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                      >
                        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        Enviar Resposta
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="sticky bottom-6 mt-auto px-5">
        <div className="mx-auto flex max-w-xs items-center justify-around rounded-full bg-white/90 p-3 shadow-float ring-1 ring-slate-200 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onReact('heart')}
            className="group rounded-full p-4 transition-all hover:bg-rose-50 active:scale-90"
            aria-label="Curtir"
          >
            <Heart className="h-8 w-8 fill-rose-100 text-rose-500 transition-transform group-hover:scale-110 group-hover:fill-rose-500" />
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            type="button"
            onClick={() => onReact('thumb')}
            className="group rounded-full p-4 transition-all hover:bg-brand-50 active:scale-90"
            aria-label="Joinha"
          >
            <ThumbsUp className="h-8 w-8 fill-brand-100 text-brand-500 transition-transform group-hover:scale-110 group-hover:fill-brand-500" />
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            type="button"
            onClick={() => onReact('question')}
            className="group rounded-full p-4 transition-all hover:bg-gold-50 active:scale-90"
            aria-label="Dúvida"
          >
            <HelpCircle className="h-8 w-8 fill-gold-100 text-gold-500 transition-transform group-hover:scale-110 group-hover:fill-gold-400" />
          </button>
        </div>
      </footer>
    </div>
  )
}
