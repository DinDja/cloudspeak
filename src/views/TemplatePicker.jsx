import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  Rocket,
  Flag,
  BookOpen,
  Wrench,
  Repeat2,
  Megaphone,
  Trophy,
} from 'lucide-react'
import Logo from '../components/ui/Logo'
import Badge from '../components/ui/Badge'
import { TEMPLATES } from '../lib/templates'
import { SLIDE_TYPES } from '../lib/constants'

const ICONS = {
  sparkles: Sparkles,
  rocket: Rocket,
  flag: Flag,
  book: BookOpen,
  wrench: Wrench,
  cycle: Repeat2,
  megaphone: Megaphone,
  trophy: Trophy,
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
}

export default function TemplatePicker({ onBack, onConfirm, initialTitle = '' }) {
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id)
  const [title, setTitle] = useState(initialTitle)

  const selected = TEMPLATES.find((t) => t.id === selectedId) ?? TEMPLATES[0]
  const slides = selected.build()

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-yellow-50 font-sans text-slate-900">
      <BackgroundDecor />

      <header className="sticky top-0 z-30 border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-sm border-2 border-black bg-white p-2 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-slate-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Logo size="sm" />
          </div>
          <div className="rounded-sm border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase text-white">
            Estúdio · Template
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Comece com um template{' '}
              <span className="text-blue-600">premium</span>
            </h1>
            <p className="mt-2 max-w-xl text-base font-bold text-slate-700">
              Escolha um ponto de partida profissional. Vamos pré-preencher as etapas —
              você personaliza tudo antes de apresentar.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
            <span className="flex h-3 w-3 border border-black bg-green-400" />
            Template salvo em rascunho
          </div>
        </motion.div>

        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
          initial="hidden"
          animate="visible"
        >
          {TEMPLATES.map((template) => {
            const Icon = ICONS[template.icon] ?? Sparkles
            const isActive = template.id === selectedId
            return (
              <motion.button
                key={template.id}
                type="button"
                variants={cardVariants}
                onClick={() => setSelectedId(template.id)}
                className={[
                  'group relative flex h-full flex-col overflow-hidden rounded-sm bg-white p-6 text-left border-2 border-black transition-all duration-100',
                  isActive
                    ? 'bg-yellow-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                    : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
                ].join(' ')}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm border-2 border-black bg-blue-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black uppercase tracking-tight text-black">{template.name}</h3>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-black bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className="mt-1.5 text-sm font-bold leading-relaxed text-slate-700">{template.summary}</p>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="rounded-sm border border-black bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-black">
                    {template.badge}
                  </span>
                  <span className="text-xs font-black text-black">
                    {template.build().length} {template.build().length === 1 ? 'slide' : 'slides'}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.section
            key={selected.id + '-preview'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="mt-12 overflow-hidden rounded-sm border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-10"
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Pré-visualização</p>
                <h2 className="mt-1.5 text-2xl font-black uppercase tracking-tight text-black">{selected.name}</h2>
                <p className="mt-1 text-sm font-bold text-slate-700">{selected.summary}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Dê um título para sua apresentação"
                  maxLength={120}
                  className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] placeholder:text-slate-400 focus:outline-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:w-80"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                {slides.map((slide, index) => {
                  const slideType = SLIDE_TYPES[slide.type]
                  return (
                    <div
                      key={slide.id}
                      className="group flex items-start gap-4 rounded-sm border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-slate-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-black bg-yellow-200 text-sm font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-sm border border-black bg-blue-200 px-2 py-0.5 text-[10px] font-black uppercase text-black">
                            {slideType?.label ?? 'Slide'}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-black text-slate-900">
                          {slide.question || 'Sem pergunta definida'}
                        </p>
                        {slide.type === 'multiple_choice' && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {slide.options.slice(0, 4).map((option, i) => (
                              <span key={i} className="rounded-sm border border-black bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-black">
                                {option || '—'}
                              </span>
                            ))}
                          </div>
                        )}
                        {slide.type === 'team_selection' && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {slide.teams.slice(0, 4).map((team, i) => (
                              <span key={i} className="rounded-sm border border-black bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-black">
                                {team.name} · {team.capacity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="relative overflow-hidden rounded-sm border-2 border-black bg-slate-100 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="relative">
                  <div className="mb-4 inline-block rounded-sm border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase text-white">
                    Projeção ao vivo
                  </div>
                  <div className="aspect-video w-full overflow-hidden rounded-sm border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex h-full flex-col bg-yellow-50 p-5">
                      <span className="self-start rounded-sm border border-black bg-blue-200 px-2 py-0.5 text-[10px] font-black uppercase text-black">
                        {SLIDE_TYPES[slides[0]?.type]?.label}
                      </span>
                      <p className="mt-3 line-clamp-3 text-base font-black uppercase leading-tight text-black">
                        {slides[0]?.question || 'Sua pergunta aparecerá aqui...'}
                      </p>
                      <div className="mt-auto space-y-2">
                        {(slides[0]?.options ?? []).filter(Boolean).slice(0, 3).map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-sm border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-blue-400 text-[10px] font-black text-black">
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-black text-black">
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-3 w-3 border border-black bg-green-400" />
                      Ao vivo · público conecta pelo celular
                    </span>
                    <span className="bg-slate-200 px-2 py-0.5 border border-black">Sala #{Math.floor(Math.random() * 900000) + 100000}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 rounded-sm border-2 border-black bg-white px-5 py-2.5 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-slate-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
              </button>
              <button
                type="button"
                onClick={() => onConfirm({ templateId: selected.id, title: title.trim() || selected.name })}
                disabled={!title.trim() && selected.id !== 'blank'}
                className="inline-flex items-center justify-center gap-2 rounded-sm border-2 border-black bg-green-400 px-5 py-2.5 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                Personalizar apresentação <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  )
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-yellow-50" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:32px_32px]" />
    </>
  )
}