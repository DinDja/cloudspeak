import { useEffect, useMemo, useRef, useState } from 'react'
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
  Play,
  ThumbsUp,
  Users,
  WandSparkles,
  Sparkles,
  MessageSquareText
} from 'lucide-react'
import cloud from 'd3-cloud'
import { QRCodeSVG } from 'qrcode.react'
import { db } from '../firebase'

// Paleta estilo Mentimeter (Vibrante e com alto contraste)
const palette = ['#FF0055', '#0099FF', '#FFCC00', '#00CC66', '#9933FF', '#FF6600', '#00E6B8']
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

function WordCloudCanvas({ words }) {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 960, height: 440 })
  const [layoutWords, setLayoutWords] = useState([])

  useEffect(() => {
    if (!containerRef.current) return undefined

    const updateDimensions = () => {
      const nextWidth = Math.max(containerRef.current?.clientWidth ?? 0, 320)
      const nextHeight = nextWidth < 640 ? 340 : 420
      setDimensions({ width: nextWidth, height: nextHeight })
    }

    updateDimensions()

    const observer = new ResizeObserver(() => {
      updateDimensions()
    })

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (words.length === 0) {
      setLayoutWords([])
      return undefined
    }

    let cancelled = false
    const layout = cloud()
      .size([dimensions.width, dimensions.height])
      .words(words.map((item) => ({ ...item })))
      .padding(4)
      .rotate((item) => item.rotate)
      .font('sans-serif')
      .fontWeight(800)
      .fontSize((item) => item.fontSize)
      .spiral('archimedean')
      .on('end', (computedWords) => {
        if (!cancelled) {
          setLayoutWords(computedWords)
        }
      })

    layout.start()

    return () => {
      cancelled = true
      layout.stop()
    }
  }, [dimensions.height, dimensions.width, words])

  return (
    <div
      ref={containerRef}
      className="relative min-h-[340px] w-full overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.98),_rgba(241,245,249,0.82)_58%,_transparent_100%)] p-4 md:min-h-[420px]"
    >
      {layoutWords.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
          <WandSparkles className="mb-4 h-12 w-12 opacity-50" />
          <p className="text-2xl font-bold">A nuvem está vazia.</p>
          <p className="text-lg font-medium opacity-75">Envie a primeira palavra!</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="h-full w-full">
          <g transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2})`}>
            {layoutWords.map((item) => (
              <text
                key={`${item.text}-${item.x}-${item.y}`}
                x={item.x}
                y={item.y}
                textAnchor="middle"
                transform={`rotate(${item.rotate}, ${item.x}, ${item.y})`}
                fill={item.color}
                fillOpacity={item.opacity}
                fontSize={item.size}
                fontWeight={800}
                style={{ cursor: 'default' }}
              >
                {item.text}
              </text>
            ))}
          </g>
        </svg>
      )}
    </div>
  )
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
      error: 'Adicione pelo menos um slide válido. Em múltipla escolha, informe pergunta e no mínimo 2 opções.',
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
    onCreate({ title, slides })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-purple-50 font-sans text-slate-900 selection:bg-blue-200">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12 md:flex-row md:gap-20">

        {/* Lado do Participante */}
        <section className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl filter" />
          <div className="relative rounded-[2rem] bg-white/80 p-8 shadow-2xl shadow-blue-900/5 backdrop-blur-xl ring-1 ring-slate-900/5 md:p-12">
            <div className="mb-10 text-center">
              <img
                src="/Secti_Vertical.png"
                alt="Secti logo"
                className="mx-auto mb-6 h-24 w-auto"
              />
              <h1 className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
                SECTI<span className="font-light text-slate-400">Speak</span>
              </h1>
              <p className="mt-3 text-sm font-medium text-slate-500">Pronto para interagir?</p>
            </div>

            <div className="space-y-5">
              <div className="group relative">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="Código da sala"
                  className="peer w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 py-4 text-center text-xl font-bold tracking-widest text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome (opcional)"
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 py-4 text-center text-lg outline-none transition-all placeholder:text-slate-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <button
                onClick={() => onJoin(name, code)}
                disabled={loading || code.trim().length < 6}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/40 disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
                Participar
              </button>
            </div>
          </div>
        </section>

        {/* Separador Mobile */}
        <div className="my-16 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent md:hidden" />

        {/* Lado do Host */}
        <section className="w-full max-w-lg animate-in fade-in slide-in-from-right-8 duration-700 md:text-left text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-bold text-indigo-600 ring-1 ring-indigo-500/20 mb-6">
            <WandSparkles className="h-4 w-4" />
            Modo Apresentador
          </div>
          <h2 className="text-4xl font-black leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
            Crie engajamento <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">em tempo real.</span>
          </h2>
          <p className="mt-5 text-lg font-medium text-slate-500 leading-relaxed">
            Configure enquetes, nuvens de palavras e perguntas ao vivo em segundos e conecte-se com sua audiência.
          </p>

          <div className="mt-10 space-y-5 rounded-[2rem] border border-slate-100 bg-white/60 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-md md:p-8">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nome da sua apresentação..."
              className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-4 text-base font-bold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />

            <div className="space-y-4">
              {slides.map((slide, slideIndex) => (
                <article key={slide.id} className="relative space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-600">
                      {slideIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSlide(slide.id)}
                      disabled={slides.length <= 1}
                      className="text-xs font-bold text-slate-400 transition-colors hover:text-rose-500 disabled:opacity-30"
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
                    className="w-full appearance-none rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="multiple_choice">📊 Múltipla escolha</option>
                    <option value="word_cloud">☁️ Nuvem de palavras</option>
                    <option value="open_text">💬 Texto aberto (Q&A)</option>
                  </select>

                  <textarea
                    value={slide.question}
                    onChange={(event) => updateSlide(slide.id, { question: event.target.value })}
                    placeholder="Qual é a sua pergunta?"
                    className="h-20 w-full resize-none rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white"
                  />

                  {slide.type === 'multiple_choice' && (
                    <div className="space-y-3 pt-2">
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
                            className="w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(slide.id, optionIndex)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-100 bg-white text-xs font-bold text-slate-400 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(slide.id)}
                        className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide text-indigo-500 transition-all hover:border-indigo-300 hover:bg-indigo-50"
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
                className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-transparent px-4 py-4 text-sm font-bold uppercase tracking-wider text-slate-500 transition-all hover:border-slate-400 hover:text-slate-700"
              >
                + Novo Slide
              </button>
            </div>
          </div>

          <button
            onClick={onCreatePresentation}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-5 text-lg font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-60 md:w-auto"
          >
            {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <WandSparkles className="h-5 w-5" />}
            Lançar Apresentação
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
    return currentSlide.options.map((option) => ({ option, count: counts.get(option) ?? 0 }))
  }, [currentSlide, responses])

  // Nuvem de palavras com layout calculado por colisão real
  const wordCloudData = useMemo(() => {
    if (!currentSlide || currentSlide.type !== 'word_cloud') return { words: [] }

    const counts = {}
    responses.forEach((entry) => {
      const key = normalizeText(entry.value || '').toLowerCase()
      if (key) counts[key] = (counts[key] ?? 0) + 1
    })

    const topWords = Object.entries(counts)
      .map(([word, count]) => ({ text: word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40)

    if (topWords.length === 0) return { words: [] }

    const maxCount = topWords[0].count

    return {
      words: topWords.map((item, index) => {
        const ratio = item.count / maxCount
        const size = Math.round(18 + ratio * 26 + Math.min(item.count, 4))

        return {
          ...item,
          fontSize: Math.min(size, 52),
          rotate: index % 7 === 0 ? 90 : 0,
          color: palette[index % palette.length],
          opacity: 0.76 + ratio * 0.24,
          size,
        }
      }),
    }
  }, [currentSlide, responses])

  return (
    <div
      className="relative min-h-screen overflow-hidden font-sans text-slate-900"
      style={{
        backgroundColor: '#fafafa',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }}
    >
      {/* Banner Topo Moderno */}
      <div className="absolute left-0 right-0 top-1 z-10 flex justify-center px-4 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-5 rounded-[2rem] bg-white/80 p-3 pr-8 shadow-2xl shadow-blue-900/10 backdrop-blur-xl ring-1 ring-slate-900/5 transition-all hover:bg-white/95">
          <div className="relative flex  shrink-0 items-center justify-center rounded-2xl bg-white shadow-inner ring-1 ring-slate-100">
            <QRCodeSVG value={joinUrl} size={120} bgColor="transparent" fgColor="#0f172a" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Ao Vivo</span>
            </div>
            <div className="mt-1 text-slate-600">
              Acesse <strong className="font-bold text-slate-900">cloudspeak.netlify.app</strong> e use o código:
            </div>
            <div className="mt-0.5 text-3xl font-black tracking-[0.2em] text-blue-600 drop-shadow-sm">
              {session.code}
            </div>
          </div>
        </div>
      </div>

      {/* Área Central do Slide */}
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 pb-32 pt-40 text-center animate-in fade-in zoom-in-95 duration-500">

        <h1 className="mb-16 max-w-5xl text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl lg:text-7xl drop-shadow-sm">
          {currentSlide?.question}
        </h1>

        <div className="w-full max-w-4xl flex-1">

          {/* Gráfico de Barras com Visual 3D Suave */}
          {currentSlide?.type === 'multiple_choice' && (
            <div className="flex w-full flex-col gap-6">
              {multipleChoiceStats.map((entry, index) => {
                const percent = responseCount ? Math.round((entry.count / responseCount) * 100) : 0
                const color = palette[index % palette.length]
                return (
                  <div key={entry.option} className="relative w-full">
                    <div className="mb-3 flex justify-between px-2 text-xl font-bold text-slate-700">
                      <span>{entry.option}</span>
                      <span className="text-slate-400">{entry.count > 0 ? `${percent}% (${entry.count})` : ''}</span>
                    </div>
                    <div className="relative h-16 w-full overflow-hidden rounded-2xl bg-white/50 shadow-inner ring-1 ring-slate-200/50 backdrop-blur-sm">
                      <div
                        className="absolute bottom-0 left-0 top-0 rounded-2xl transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.max(percent, 1.5)}%`,
                          backgroundColor: color,
                          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.05) 100%)',
                          boxShadow: `0 4px 14px 0 ${color}40`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Nuvem de Palavras com colisão real */}
          {currentSlide?.type === 'word_cloud' && (
            <WordCloudCanvas words={wordCloudData.words} />
          )}

          {/* Q&A / Texto Aberto Cards */}
          {currentSlide?.type === 'open_text' && (
            <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3 text-left">
              {responses.length === 0 && (
                <div className="col-span-full mt-10 text-center text-2xl font-bold text-slate-400">
                  Aguardando respostas...
                </div>
              )}
              {responses.map((entry) => (
                <article
                  key={entry.id}
                  className="break-inside-avoid rounded-[2rem] border border-white/50 bg-white/70 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white"
                >
                  <MessageSquareText className="mb-4 h-8 w-8 text-blue-400 opacity-50" />
                  <p className="text-2xl font-bold text-slate-800 leading-snug">{entry.value}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
                    <span className="text-sm font-black uppercase tracking-wider text-slate-400">
                      {entry.participantName || 'Anônimo'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Controles do Host (Rodapé) */}
      <div className="fixed bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900/90 p-2.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all hover:bg-slate-900">
        <button
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
          onClick={onNext}
          disabled={!canGoForward}
          className="group rounded-full p-3 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-7 w-7 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Estatísticas Flutuantes */}
      <div className="fixed bottom-10 left-10 flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 font-bold text-slate-600 shadow-lg backdrop-blur-md ring-1 ring-slate-900/5">
        <Users className="h-6 w-6 text-blue-500" />
        <span className="text-xl">{connectedParticipants}</span>
      </div>
      <div className="fixed bottom-10 right-10 flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 font-bold text-slate-600 shadow-lg backdrop-blur-md ring-1 ring-slate-900/5">
        <BarChart3 className="h-6 w-6 text-rose-500" />
        <span className="text-xl">{responseCount}</span>
      </div>

      {/* Reações Animadas Otimizadas */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {reactions.map((reaction) => {
          const isHeart = reaction.type === 'heart'
          const isThumb = reaction.type === 'thumb'
          return (
            <div
              key={reaction.id}
              className="absolute bottom-0 animate-float-up opacity-0"
              style={{ left: `${reaction.left}%` }}
            >
              {isHeart && <Heart className="h-16 w-16 fill-rose-500 text-rose-500 drop-shadow-xl" />}
              {isThumb && <ThumbsUp className="h-16 w-16 fill-blue-500 text-blue-500 drop-shadow-xl" />}
              {!isHeart && !isThumb && <HelpCircle className="h-16 w-16 fill-amber-400 text-amber-400 drop-shadow-xl" />}
            </div>
          )
        })}
      </div>

      {/* CSS para Animação de Flutuação */}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(100px) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translateY(0) scale(1.2); }
          50% { transform: translateY(-300px) scale(1) rotate(15deg); }
          100% { transform: translateY(-800px) scale(1.5) rotate(-15deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 3.5s ease-out forwards;
        }
      `}</style>
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
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">

      {/* Header Mobile Clean */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/50 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-black tracking-tight text-slate-800">SECTI</span>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black tracking-widest text-slate-500">
          SALA {session.code}
        </div>
      </header>

      {/* Conteúdo Dinâmico */}
      <main className="flex-1 px-5 py-8 md:py-16">
        <div className="mx-auto w-full max-w-lg animate-in fade-in slide-in-from-bottom-4">
          <h1 className="mb-10 text-3xl font-black leading-tight tracking-tight text-slate-900 drop-shadow-sm md:text-4xl">
            {currentSlide?.question}
          </h1>

          {/* Feedback de Sucesso */}
          {hasSubmittedThisSlide && currentSlide?.type !== 'word_cloud' ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-[2rem] bg-gradient-to-br from-green-400 to-emerald-600 p-10 text-center text-white shadow-xl shadow-green-500/20">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-black tracking-tight">Enviado!</h3>
              <p className="mt-3 text-lg font-medium text-green-50">Olhe para a tela principal para ver os resultados ao vivo.</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Múltipla Escolha - Botões Táteis */}
              {currentSlide?.type === 'multiple_choice' &&
                currentSlide.options.map((option) => (
                  <button
                    key={option}
                    onClick={(event) => submit(event, option)}
                    disabled={sending}
                    className="group relative w-full overflow-hidden rounded-[1.5rem] bg-white p-6 text-left shadow-md ring-2 ring-transparent transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:ring-blue-500 active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className="relative z-10 text-xl font-bold text-slate-800 transition-colors group-hover:text-blue-700">
                      {option}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}

              {/* Input Nuvem de Palavras */}
              {currentSlide?.type === 'word_cloud' && (
                <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                  <div className="relative">
                    <input
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      maxLength={25}
                      placeholder="Digite sua ideia..."
                      className="w-full rounded-2xl bg-slate-50 px-6 py-5 text-xl font-bold text-slate-800 outline-none ring-2 ring-transparent transition-all placeholder:text-slate-400 focus:bg-white focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !value.trim()}
                    className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-xl font-black text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {sending ? 'Enviando...' : 'Enviar Palavra'}
                  </button>
                  {hasSubmittedThisSlide && (
                    <p className="pt-2 text-center text-sm font-bold text-green-600">
                      ✓ Enviado! Mande mais palavras se quiser.
                    </p>
                  )}
                </form>
              )}

              {/* Textarea Q&A */}
              {currentSlide?.type === 'open_text' && (
                <form onSubmit={submit} className="space-y-4">
                  <div className="relative rounded-[2rem] bg-white p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <textarea
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      maxLength={250}
                      placeholder="Escreva sua pergunta ou comentário aqui..."
                      className="h-40 w-full resize-none rounded-2xl bg-slate-50 px-6 py-5 text-xl font-medium text-slate-800 outline-none ring-2 ring-transparent transition-all placeholder:text-slate-400 focus:bg-white focus:ring-blue-500"
                    />
                    <div className="p-2">
                      <button
                        type="submit"
                        disabled={sending || !value.trim()}
                        className="w-full rounded-2xl bg-slate-900 px-6 py-5 text-xl font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                      >
                        {sending ? 'Enviando...' : 'Enviar Resposta'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Dock de Reações Flutuante (Bottom) */}
      <footer className="sticky bottom-6 mt-auto px-6 pb-safe">
        <div className="mx-auto flex max-w-xs items-center justify-around rounded-full bg-white/90 p-3 shadow-2xl shadow-slate-300/50 backdrop-blur-xl ring-1 ring-slate-200">
          <button
            onClick={() => onReact('heart')}
            className="group rounded-full p-4 transition-all hover:bg-rose-50 active:scale-90"
          >
            <Heart className="h-8 w-8 fill-rose-100 text-rose-500 transition-transform group-hover:scale-110 group-hover:fill-rose-500" />
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            onClick={() => onReact('thumb')}
            className="group rounded-full p-4 transition-all hover:bg-blue-50 active:scale-90"
          >
            <ThumbsUp className="h-8 w-8 fill-blue-100 text-blue-500 transition-transform group-hover:scale-110 group-hover:fill-blue-500" />
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            onClick={() => onReact('question')}
            className="group rounded-full p-4 transition-all hover:bg-amber-50 active:scale-90"
          >
            <HelpCircle className="h-8 w-8 fill-amber-100 text-amber-500 transition-transform group-hover:scale-110 group-hover:fill-amber-400" />
          </button>
        </div>
      </footer>
    </div>
  )
}

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
          return now - timestamp < 4000
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
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-xl">
            {error}
          </div>
        )}
      </>
    )
  }

  if (!session || !currentSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-slate-900">
        <LoaderCircle className="mr-3 h-8 w-8 animate-spin text-blue-600" />
        <span className="text-xl font-bold tracking-tight">Preparando a sala...</span>
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

      {error && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-rose-600 px-8 py-4 text-sm font-black tracking-wide text-white shadow-2xl">
          {error}
        </div>
      )}
    </>
  )
}