import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Heart,
  HelpCircle,
  LoaderCircle,
  QrCode,
  Send,
  ThumbsUp,
  Users,
  WandSparkles,
  Play
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { db } from '../firebase'

// Paleta estilo Mentimeter (Vibrante e com alto contraste)
const palette = ['#E52E71', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6', '#E67E22', '#1ABC9C']
const PRESENCE_TTL_MS = 45000
const PRESENCE_HEARTBEAT_MS = 15000

const createSlideDraft = (type = 'multiple_choice') => ({
  id: crypto.randomUUID(),
  type,
  question: '',
  options: type === 'multiple_choice' ? ['', ''] : [],
})

const generateCode = () =>
  Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()

const getParticipantId = () => {
  // Use sessionStorage so each tab/browser instance gets a unique participant id.
  // This enables várias pessoas participarem da mesma sessão no mesmo dispositivo.
  const existing = sessionStorage.getItem('cloudspeak-participant-id')
  if (existing) return existing
  const created = crypto.randomUUID()
  sessionStorage.setItem('cloudspeak-participant-id', created)
  return created
}

const normalizeText = (value) => value.trim().replace(/\s+/g, ' ')

const getParticipantDisplayName = (value) => normalizeText(value) || 'Anônimo'

const getJoinUrl = (code) => {
  const configuredBaseUrl = import.meta.env.VITE_APP_URL
  const baseUrl = configuredBaseUrl || window.location.origin
  return `${baseUrl}/?code=${encodeURIComponent(code)}`
}

const sanitizeSlides = (slides = []) => {
  const normalizedSlides = slides
    .map((slide) => {
      const type = slide?.type
      const question = normalizeText(slide?.question ?? '')

      if (!question || !['multiple_choice', 'word_cloud', 'open_text'].includes(type)) {
        return null
      }

      if (type === 'multiple_choice') {
        const options = (slide?.options ?? [])
          .map((option) => normalizeText(option ?? ''))
          .filter(Boolean)

        if (options.length < 2) return null

        return {
          id: slide.id || crypto.randomUUID(),
          type,
          question,
          options,
        }
      }

      return {
        id: slide.id || crypto.randomUUID(),
        type,
        question,
      }
    })
    .filter(Boolean)

  if (normalizedSlides.length === 0) {
    return {
      slides: [],
      error:
        'Adicione pelo menos um slide válido. Em múltipla escolha, informe pergunta e no mínimo 2 opções.',
    }
  }

  return { slides: normalizedSlides, error: '' }
}

function Landing({ onCreate, onJoin, loading, initialCode = '' }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState(initialCode)
  const [title, setTitle] = useState('')
  const [slides, setSlides] = useState([createSlideDraft()])

  const updateSlide = (slideId, updater) => {
    setSlides((previous) =>
      previous.map((slide) => {
        if (slide.id !== slideId) return slide
        return typeof updater === 'function' ? updater(slide) : { ...slide, ...updater }
      }),
    )
  }

  const addSlide = () => {
    setSlides((previous) => [...previous, createSlideDraft()])
  }

  const removeSlide = (slideId) => {
    setSlides((previous) => {
      if (previous.length <= 1) return previous
      return previous.filter((slide) => slide.id !== slideId)
    })
  }

  const addOption = (slideId) => {
    updateSlide(slideId, (slide) => ({
      ...slide,
      options: [...(slide.options ?? []), ''],
    }))
  }

  const removeOption = (slideId, optionIndex) => {
    updateSlide(slideId, (slide) => {
      const nextOptions = (slide.options ?? []).filter((_, index) => index !== optionIndex)
      return {
        ...slide,
        options: nextOptions.length > 0 ? nextOptions : ['', ''],
      }
    })
  }

  const onCreatePresentation = () => {
    onCreate({
      title,
      slides,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-12 md:flex-row md:gap-16">
        
        {/* Lado do Participante (Foco Principal da Landing) */}
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200/50 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">SECTI - CloudSpeak</h1>
            <p className="mt-2 text-slate-500">Participe da apresentação</p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Código da sessão (ex: 123456)"
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-center text-xl font-bold tracking-widest text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome (opcional)"
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-center text-lg outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
              />
            </div>
            <button
              onClick={() => onJoin(name, code)}
              disabled={loading || code.trim().length < 6}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-lg font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <Play className="h-5 w-5" />}
              Entrar
            </button>
          </div>
        </section>

        {/* Separador Mobile */}
        <div className="my-12 w-full border-t-2 border-slate-200 md:hidden" />

        {/* Lado do Host */}
        <section className="w-full max-w-md text-center md:text-left">
          <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
            Apresentações interativas <span className="text-blue-600">ao vivo</span>.
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            Crie engajamento real com sua audiência através de enquetes, nuvens de palavras e perguntas ao vivo.
          </p>

          <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Configurar apresentação</h3>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título da apresentação"
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
            />

            <div className="space-y-3">
              {slides.map((slide, slideIndex) => (
                <article key={slide.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Slide {slideIndex + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeSlide(slide.id)}
                      disabled={slides.length <= 1}
                      className="text-xs font-bold text-slate-500 transition hover:text-rose-500 disabled:opacity-40"
                    >
                      Remover
                    </button>
                  </div>

                  <select
                    value={slide.type}
                    onChange={(event) => {
                      const nextType = event.target.value
                      updateSlide(slide.id, {
                        type: nextType,
                        options: nextType === 'multiple_choice' ? slide.options?.length ? slide.options : ['', ''] : [],
                      })
                    }}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500"
                  >
                    <option value="multiple_choice">Múltipla escolha</option>
                    <option value="word_cloud">Nuvem de palavras</option>
                    <option value="open_text">Texto aberto</option>
                  </select>

                  <textarea
                    value={slide.question}
                    onChange={(event) => updateSlide(slide.id, { question: event.target.value })}
                    placeholder="Pergunta do slide"
                    className="h-20 w-full resize-none rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500"
                  />

                  {slide.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {(slide.options ?? []).map((option, optionIndex) => (
                        <div key={`${slide.id}-option-${optionIndex}`} className="flex items-center gap-2">
                          <input
                            value={option}
                            onChange={(event) => {
                              updateSlide(slide.id, (currentSlide) => ({
                                ...currentSlide,
                                options: (currentSlide.options ?? []).map((item, index) =>
                                  index === optionIndex ? event.target.value : item,
                                ),
                              }))
                            }}
                            placeholder={`Opção ${optionIndex + 1}`}
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(slide.id, optionIndex)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-500 transition hover:text-rose-500"
                          >
                            X
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(slide.id)}
                        className="w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
                      >
                        + Adicionar opção
                      </button>
                    </div>
                  )}
                </article>
              ))}

              <button
                type="button"
                onClick={addSlide}
                className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
              >
                + Adicionar slide
              </button>
            </div>
          </div>
          
          <button
            onClick={onCreatePresentation}
            disabled={loading}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-lg font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <WandSparkles className="h-5 w-5" />}
            Criar nova apresentação
          </button>
        </section>
      </div>
    </div>
  )
}

function HostView({
  session,
  currentSlide,
  responses,
  reactions,
  onNext,
  onPrevious,
  canGoBack,
  canGoForward,
  connectedParticipants,
}) {
  const responseCount = responses.length
  const joinUrl = useMemo(() => getJoinUrl(session.code), [session.code])

  const multipleChoiceStats = useMemo(() => {
    if (!currentSlide || currentSlide.type !== 'multiple_choice') return []
    const counts = new Map(currentSlide.options.map((option) => [option, 0]))

    responses.forEach((entry) => {
      if (entry.value && counts.has(entry.value)) {
        counts.set(entry.value, counts.get(entry.value) + 1)
      }
    })

    // Retorna ordenado pelo formato original do slide
    return currentSlide.options.map((option) => ({ option, count: counts.get(option) ?? 0 }))
  }, [currentSlide, responses])

  const wordCloud = useMemo(() => {
    if (!currentSlide || currentSlide.type !== 'word_cloud') return []
    const counts = {}

    responses.forEach((entry) => {
      const key = normalizeText(entry.value || '').toLowerCase()
      if (key) counts[key] = (counts[key] ?? 0) + 1
    })

    return Object.entries(counts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
  }, [currentSlide, responses])

  const topWords = wordCloud.slice(0, 40)
  const maxWordCount = topWords[0]?.count ?? 1

  return (
    <div className="relative min-h-screen bg-white text-slate-900 overflow-hidden font-sans">
      
      {/* Banner Topo Estilo Menti */}
      <div className="absolute left-0 right-0 top-6 flex justify-center z-10 px-4">
        <div className="flex items-center gap-4 rounded-[28px] bg-white px-4 py-4 shadow-md shadow-slate-200 border border-slate-100 font-medium text-slate-700 md:px-6 md:py-3 md:text-lg">
          <div className="hidden rounded-2xl border border-slate-100 bg-slate-50 p-2 md:block">
            <QRCodeSVG value={joinUrl} size={144} bgColor="#f8fafc" fgColor="#0f172a" includeMargin />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Entre na sala</div>
            <div>
              Vá para <strong className="text-slate-900">cloudspeak.live</strong> e use o código <strong className="ml-1 text-xl tracking-wider text-blue-600 md:text-2xl">{session.code}</strong>
            </div>
            <div className="mt-1 text-sm text-slate-500">Escaneie o QR para abrir a sala já com o código preenchido.</div>
          </div>
        </div>
      </div>

      {/* Container Principal do Slide */}
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pt-24 pb-32 text-center">
        
        {/* Banner pequeno acima do título */}
        <div className="mb-8 flex w-full max-w-3xl items-center justify-center">
          <div className="rounded-full bg-gradient-to-r from-blue-500/15 to-indigo-500/15 px-6 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200/70">
            Sala <span className="font-black">{session.code}</span> — {connectedParticipants} participantes conectados
          </div>
        </div>

        {/* QR code acima do título */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          </div>
        </div>

        <h1 className="mb-16 max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
          {currentSlide?.question}
        </h1>

        <div className="w-full flex-1 w-full max-w-3xl">
          
          {/* Múltipla Escolha - Barras Grossas */}
          {currentSlide?.type === 'multiple_choice' && (
            <div className="flex flex-col gap-6 w-full">
              {multipleChoiceStats.map((entry, index) => {
                const percent = responseCount ? Math.round((entry.count / responseCount) * 100) : 0
                return (
                  <div key={entry.option} className="relative w-full">
                    <div className="flex justify-between text-lg font-bold text-slate-700 mb-2 px-1">
                      <span>{entry.option}</span>
                      <span>{entry.count > 0 ? entry.count : ''}</span>
                    </div>
                    <div className="h-14 w-full rounded-xl bg-slate-100 overflow-hidden flex items-center">
                      <div
                        className="h-full rounded-xl transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(percent, 2)}%`, // Mínimo de 2% só para aparecer a cor
                          backgroundColor: palette[index % palette.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Nuvem de Palavras */}
          {currentSlide?.type === 'word_cloud' && (
            <div className="flex h-full min-h-[400px] flex-wrap content-center justify-center gap-x-6 gap-y-4">
              {topWords.length === 0 && <div className="text-xl text-slate-400 font-medium">Aguardando participações...</div>}
              {topWords.map((item, index) => {
                const ratio = item.count / maxWordCount
                const size = 24 + ratio * 60 // Varia entre 24px e 84px
                return (
                  <span
                    key={`${item.word}-${index}`}
                    className="font-black transition-all duration-500 ease-out hover:scale-105"
                    style={{
                      fontSize: `${size}px`,
                      color: palette[index % palette.length],
                      opacity: 0.8 + (ratio * 0.2), // Palavras maiores ficam mais opacas
                    }}
                  >
                    {item.word}
                  </span>
                )
              })}
            </div>
          )}

          {/* Texto Aberto (Q&A) */}
          {currentSlide?.type === 'open_text' && (
            <div className="grid gap-4 md:grid-cols-2 text-left">
              {responses.length === 0 && <div className="col-span-2 text-center text-xl text-slate-400 font-medium mt-10">Aguardando perguntas...</div>}
              {responses.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl bg-slate-50 border border-slate-100 p-6 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-xl font-medium text-slate-800 leading-relaxed">{entry.value}</p>
                  <div className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                    {entry.participantName || 'Anônimo'}
                  </div>
                </article>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Controles Flutuantes do Host (Inferior) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white p-2 shadow-lg shadow-slate-200 border border-slate-100 z-20">
        <button
          onClick={onPrevious}
          disabled={!canGoBack}
          className="p-3 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Slide anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="px-4 py-2 font-bold text-slate-700 bg-slate-50 rounded-full text-sm flex items-center gap-2">
           <span className="bg-slate-200 text-slate-600 py-1 px-3 rounded-full">{session.currentSlideIndex + 1} / {session.slides.length}</span>
        </div>
        <button
          onClick={onNext}
          disabled={!canGoForward}
          className="p-3 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Próximo slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Contadores (Inferior Direita e Esquerda) */}
      <div className="fixed bottom-8 left-8 flex items-center gap-2 text-slate-500 font-medium">
        <Users className="h-5 w-5" /> {connectedParticipants}
      </div>
      <div className="fixed bottom-8 right-8 flex items-center gap-2 text-slate-500 font-medium">
        <BarChart3 className="h-5 w-5" /> {responseCount}
      </div>

      {/* Reações Animadas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute bottom-0 animate-float-up opacity-0"
            style={{ left: `${reaction.left}%` }}
          >
            {reaction.type === 'heart' && <Heart className="h-12 w-12 fill-rose-500 text-rose-500 drop-shadow-md" />}
            {reaction.type === 'thumb' && <ThumbsUp className="h-12 w-12 fill-blue-500 text-blue-500 drop-shadow-md" />}
            {reaction.type === 'question' && <HelpCircle className="h-12 w-12 fill-amber-400 text-amber-400 drop-shadow-md" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function ParticipantView({ session, currentSlide, onSubmit, onReact, sending }) {
  const [value, setValue] = useState('')
  const [hasSubmittedThisSlide, setHasSubmittedThisSlide] = useState(false)

  const submit = (event, predefinedValue) => {
    event?.preventDefault()
    const finalValue = predefinedValue ?? value
    if (!finalValue.trim()) return

    onSubmit(finalValue)
    setHasSubmittedThisSlide(true)
    if (!predefinedValue) setValue('')
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header Simples */}
      <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center">
        <div className="font-bold text-slate-800 tracking-tight">SECTI - CloudSpeak</div>
        <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Sessão {session.code}
        </div>
      </header>

      {/* Área da Pergunta */}
      <main className="flex-1 px-4 py-8 md:py-12 flex flex-col items-center">
        <div className="w-full max-w-md">
          <h1 className="mb-8 text-2xl font-black text-slate-900 md:text-3xl leading-snug">
            {currentSlide?.question}
          </h1>

          {/* Estado de Enviado */}
          {hasSubmittedThisSlide && currentSlide?.type !== 'word_cloud' ? (
             <div className="text-center bg-green-50 text-green-700 p-6 rounded-2xl border border-green-200 mt-10">
               <div className="text-3xl mb-2">🎉</div>
               <h3 className="font-bold text-lg">Resposta enviada!</h3>
               <p className="text-sm mt-1 opacity-80">Olhe para o telão para ver os resultados.</p>
             </div>
          ) : (
            <div className="space-y-3">
              {currentSlide?.type === 'multiple_choice' &&
                currentSlide.options.map((option) => (
                  <button
                    key={option}
                    onClick={(event) => submit(event, option)}
                    disabled={sending}
                    className="w-full rounded-2xl border-2 border-transparent bg-white px-6 py-5 text-left text-lg font-bold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-700 active:scale-[0.98] disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}

              {currentSlide?.type === 'word_cloud' && (
                <form onSubmit={submit} className="space-y-4">
                  <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    maxLength={25}
                    placeholder="Digite uma palavra..."
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-5 text-xl font-bold outline-none transition focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !value.trim()}
                    className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-lg font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {sending ? 'Enviando...' : 'Enviar palavra'}
                  </button>
                  {hasSubmittedThisSlide && (
                     <p className="text-center text-sm text-slate-500 mt-2 font-medium">
                       Palavra enviada! Você pode enviar mais de uma.
                     </p>
                  )}
                </form>
              )}

              {currentSlide?.type === 'open_text' && (
                <form onSubmit={submit} className="space-y-4">
                  <textarea
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    maxLength={250}
                    placeholder="Escreva sua pergunta ou comentário aqui..."
                    className="h-32 w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-6 py-5 text-lg outline-none transition focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !value.trim()}
                    className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-lg font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {sending ? 'Enviando...' : 'Enviar resposta'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Barra de Reações (Bottom) */}
      <footer className="bg-white border-t border-slate-100 p-4 pb-safe">
        <div className="max-w-md mx-auto flex justify-center gap-6">
          <button onClick={() => onReact('heart')} className="rounded-full bg-slate-50 p-4 text-rose-500 transition hover:bg-rose-50 hover:scale-110 active:scale-90">
            <Heart className="h-8 w-8 fill-current" />
          </button>
          <button onClick={() => onReact('thumb')} className="rounded-full bg-slate-50 p-4 text-blue-500 transition hover:bg-blue-50 hover:scale-110 active:scale-90">
            <ThumbsUp className="h-8 w-8 fill-current" />
          </button>
          <button onClick={() => onReact('question')} className="rounded-full bg-slate-50 p-4 text-amber-500 transition hover:bg-amber-50 hover:scale-110 active:scale-90">
            <HelpCircle className="h-8 w-8 fill-current" />
          </button>
        </div>
      </footer>
    </div>
  )
}

// O componente App principal permanece com a mesma lógica de estado do Firebase
export default function App() {
  const [role, setRole] = useState('landing')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [prefilledCode, setPrefilledCode] = useState('')

  const [session, setSession] = useState(null)
  const [responses, setResponses] = useState([])
  const [participants, setParticipants] = useState([])
  const [liveReactions, setLiveReactions] = useState([])
  const [sending, setSending] = useState(false)

  const participantId = useMemo(() => getParticipantId(), [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeFromUrl = params.get('code')?.trim().toUpperCase() ?? ''
    if (codeFromUrl) {
      setPrefilledCode(codeFromUrl)
    }
  }, [])

  useEffect(() => {
    if (!sessionCode) {
      setSession(null)
      setResponses([])
      setParticipants([])
      setLiveReactions([])
      return undefined
    }

    const sessionRef = doc(db, 'sessions', sessionCode)
    const unsubSession = onSnapshot(sessionRef, (snapshot) => {
      if (!snapshot.exists()) {
        setError('Sessão não encontrada ou finalizada.')
        setSession(null)
        setRole('landing')
        return
      }

      setSession(snapshot.data())
      setError('')
    })

    const responsesRef = query(collection(db, 'sessions', sessionCode, 'responses'), orderBy('createdAt', 'desc'))
    const unsubResponses = onSnapshot(responsesRef, (snapshot) => {
      setResponses(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        })),
      )
    })

    const participantsRef = collection(db, 'sessions', sessionCode, 'participants')
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      setParticipants(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        })),
      )
    })

    const reactionsRef = query(collection(db, 'sessions', sessionCode, 'reactions'), orderBy('createdAt', 'desc'))
    const unsubReactions = onSnapshot(reactionsRef, (snapshot) => {
      const now = Date.now()
      const active = snapshot.docs
        .map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }))
        .filter((item) => {
          const timestamp = item.createdAt?.toMillis?.() ?? now
          return now - timestamp < 4000 // Reações duram 4s na tela
        })
      setLiveReactions(active)
    })

    return () => {
      unsubSession()
      unsubResponses()
      unsubParticipants()
      unsubReactions()
    }
  }, [sessionCode])

  useEffect(() => {
    if (role !== 'participant' || !sessionCode) return undefined

    const participantRef = doc(db, 'sessions', sessionCode, 'participants', participantId)
    const participantDisplayName = getParticipantDisplayName(participantName)

    const syncPresence = async (includeJoinedAt = false) => {
      const payload = {
        participantId,
        participantName: participantDisplayName,
        lastSeenAt: serverTimestamp(),
      }

      if (includeJoinedAt) {
        payload.joinedAt = serverTimestamp()
      }

      try {
        await setDoc(participantRef, payload, { merge: true })
      } catch {
        setError('Não foi possível registrar sua presença na sessão.')
      }
    }

    syncPresence(true)

    const intervalId = window.setInterval(() => {
      syncPresence(false)
    }, PRESENCE_HEARTBEAT_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncPresence(false)
      }
    }

    const handleFocus = () => {
      syncPresence(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [participantId, participantName, role, sessionCode])

  const createSession = async (presentationDraft) => {
    setLoading(true)
    setError('')

    try {
      const title = normalizeText(presentationDraft?.title ?? '')
      const { slides, error: slidesError } = sanitizeSlides(presentationDraft?.slides)

      if (!title) {
        setError('Informe um título para a apresentação.')
        return
      }

      if (slidesError) {
        setError(slidesError)
        return
      }

      const code = generateCode()
      const payload = {
        code,
        title,
        status: 'live',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        currentSlideIndex: 0,
        slides,
      }

      await setDoc(doc(db, 'sessions', code), payload)
      setSessionCode(code)
      setRole('host')
    } catch {
      setError('Não foi possível criar a sessão agora. Confira seu Firebase/Firestore.')
    } finally {
      setLoading(false)
    }
  }

  const joinSession = async (name, codeInput) => {
    setLoading(true)
    setError('')

    try {
      const code = codeInput.trim().toUpperCase()
      const sessionRef = doc(db, 'sessions', code)
      const snapshot = await getDoc(sessionRef)

      if (!snapshot.exists()) {
        setError('Código inválido. Verifique e tente novamente.')
        return
      }

      setParticipantName(normalizeText(name))
      setSessionCode(code)
      setRole('participant')
    } catch {
      setError('Erro ao entrar na sessão. Verifique sua conexão e tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  const currentSlide = useMemo(() => {
    if (!session?.slides?.length) return null
    return session.slides[session.currentSlideIndex] ?? session.slides[0]
  }, [session])

  const currentSlideResponses = useMemo(() => {
    if (!currentSlide) return []
    return responses.filter((entry) => entry.slideId === currentSlide.id)
  }, [responses, currentSlide])

  const connectedParticipants = useMemo(() => {
    const now = Date.now()
    return participants.filter((entry) => {
      const timestamp = entry.lastSeenAt?.toMillis?.()
      return typeof timestamp === 'number' && now - timestamp <= PRESENCE_TTL_MS
    }).length
  }, [participants])

  const onNext = async () => {
    if (!session || session.currentSlideIndex >= session.slides.length - 1) return
    await updateDoc(doc(db, 'sessions', session.code), {
      currentSlideIndex: session.currentSlideIndex + 1,
      updatedAt: serverTimestamp(),
    })
  }

  const onPrevious = async () => {
    if (!session || session.currentSlideIndex <= 0) return
    await updateDoc(doc(db, 'sessions', session.code), {
      currentSlideIndex: session.currentSlideIndex - 1,
      updatedAt: serverTimestamp(),
    })
  }

  const submitResponse = async (value) => {
    const finalValue = normalizeText(value ?? '')
    if (!finalValue || !session || !currentSlide) return

    setSending(true)
    setError('')

    try {
      await addDoc(collection(db, 'sessions', session.code, 'responses'), {
        participantId,
        participantName: getParticipantDisplayName(participantName),
        slideId: currentSlide.id,
        type: currentSlide.type,
        value: finalValue,
        createdAt: serverTimestamp(),
      })
    } catch {
      setError('Não foi possível enviar sua resposta.')
    } finally {
      setSending(false)
    }
  }

  const sendReaction = async (type) => {
    if (!session) return

    try {
      await addDoc(collection(db, 'sessions', session.code, 'reactions'), {
        type,
        left: Math.round(Math.random() * 80 + 10),
        participantId,
        createdAt: serverTimestamp(),
      })
    } catch {
      setError('Falha ao enviar reação.')
    }
  }

  if (role === 'landing') {
    return (
      <>
        <Landing
          key={prefilledCode || 'landing'}
          onCreate={createSession}
          onJoin={joinSession}
          loading={loading}
          initialCode={prefilledCode}
        />
        {error && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-xl">{error}</div>}
      </>
    )
  }

  if (!session || !currentSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 font-sans">
        <LoaderCircle className="mr-3 h-6 w-6 animate-spin text-blue-600" /> 
        <span className="text-lg font-medium">Carregando sessão...</span>
      </div>
    )
  }

  return (
    <>
      {role === 'host' && (
        <HostView
          session={session}
          currentSlide={currentSlide}
          responses={currentSlideResponses}
          reactions={liveReactions}
          onNext={onNext}
          onPrevious={onPrevious}
          canGoBack={session.currentSlideIndex > 0}
          canGoForward={session.currentSlideIndex < session.slides.length - 1}
          connectedParticipants={connectedParticipants}
        />
      )}

      {role === 'participant' && (
        <ParticipantView
          key={currentSlide.id}
          session={session}
          currentSlide={currentSlide}
          onSubmit={submitResponse}
          onReact={sendReaction}
          sending={sending}
        />
      )}

      {error && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-xl">{error}</div>}
    </>
  )
}