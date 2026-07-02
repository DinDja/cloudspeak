import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  ChevronUp,
  ChevronDown,
  Loader2,
  LayoutGrid,
  Eye,
  Sparkles,
  Check,
  MonitorPlay,
  Smartphone,
  Cpu,
  XCircle,
} from 'lucide-react'
import Logo from '../components/ui/Logo'
import Badge from '../components/ui/Badge'
import SlideEditor from '../components/presenter/SlideEditor'
import SlideCanvas from '../components/presenter/SlideCanvas'
import PropertiesPanel from '../components/presenter/PropertiesPanel'
import ComponentPalette from '../components/presenter/ComponentPalette'
import { useAuth } from '../hooks/useAuth'
import { SLIDE_TYPES, MAX_SLIDES } from '../lib/constants'
import { createSlideDraft, sanitizeSlides, sanitizeTitle } from '../lib/validators'
import {
  buildEditableDraft,
  createPresentation,
  updatePresentation,
} from '../lib/firebasePresentations'
import { launchPresentationAsSession } from '../lib/firebaseSessions'

function slideSnippet(slide) {
  const question = (slide?.question ?? '').trim()
  if (question) return question
  return 'Sem pergunta'
}

const PREVIEW_MODES = [
  { id: 'live', label: 'Sala', icon: MonitorPlay },
  { id: 'desktop', label: 'Desktop', icon: Eye },
  { id: 'mobile', label: 'Público', icon: Smartphone },
]

export default function PresentationBuilder({ initialPresentation, onBack, onPresented }) {
  const { uid, email } = useAuth()
  const [draft, setDraft] = useState(() => buildEditableDraft(initialPresentation))
  const [selectedId, setSelectedId] = useState(null)
  const [rightTab, setRightTab] = useState('properties')
  const [previewMode, setPreviewMode] = useState('live')
  const [saving, setSaving] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    const next = buildEditableDraft(initialPresentation)
    setDraft(next)
    setSelectedId(next.slides[0]?.id ?? null)
  }, [initialPresentation])

  useEffect(() => {
    if (!selectedId && draft.slides[0]) setSelectedId(draft.slides[0].id)
  }, [draft.slides, selectedId])

  const selectedIndex = useMemo(
    () => draft.slides.findIndex((slide) => slide.id === selectedId),
    [draft.slides, selectedId],
  )
  const selectedSlide = selectedIndex >= 0 ? draft.slides[selectedIndex] : null

  const setTitle = (title) => setDraft((prev) => ({ ...prev, title }))

  const updateSlide = (slideId, next) => {
    setDraft((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) => (slide.id === slideId ? next : slide)),
    }))
  }

  const addSlide = () => {
    if (draft.slides.length >= MAX_SLIDES) {
      setError(`Uma apresentação possui no máximo ${MAX_SLIDES} slides.`)
      return
    }
    const newSlide = createSlideDraft()
    setDraft((prev) => ({ ...prev, slides: [...prev.slides, newSlide] }))
    setSelectedId(newSlide.id)
    setError('')
  }

  const removeSlide = (slideId) => {
    setDraft((prev) => {
      if (prev.slides.length <= 1) return prev
      const next = prev.slides.filter((slide) => slide.id !== slideId)
      if (selectedId === slideId) setSelectedId(next[next.length - 1]?.id ?? null)
      return { ...prev, slides: next }
    })
  }

  const moveSlide = (slideId, direction) => {
    setDraft((prev) => {
      const index = prev.slides.findIndex((slide) => slide.id === slideId)
      if (index < 0) return prev
      const target = index + direction
      if (target < 0 || target >= prev.slides.length) return prev
      const slides = [...prev.slides]
      ;[slides[index], slides[target]] = [slides[target], slides[index]]
      return { ...prev, slides }
    })
  }

  const persist = async () => {
    const titleResult = sanitizeTitle(draft.title)
    if (titleResult.error) {
      setError(titleResult.error)
      return null
    }
    const slidesResult = sanitizeSlides(draft.slides)
    if (slidesResult.error) {
      setError(slidesResult.error)
      return null
    }

    setSaving(true)
    setError('')
    try {
      let savedId = draft.id
      if (draft.id) {
        await updatePresentation({
          id: draft.id,
          ownerUid: uid,
          ownerEmail: email,
          title: draft.title,
          slides: draft.slides,
        })
      } else {
        const created = await createPresentation({
          ownerUid: uid,
          ownerEmail: email,
          title: draft.title,
          slides: draft.slides,
        })
        savedId = created.id
        setDraft((prev) => ({ ...prev, id: created.id }))
      }
      setSavedAt(Date.now())
      return savedId
    } catch (err) {
      setError(err.message || 'Não foi possível salvar a apresentação.')
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    await persist()
  }

  const handlePresent = async () => {
    setLaunching(true)
    setError('')
    try {
      const savedId = await persist()
      if (!savedId) return

      const presentationForLaunch = {
        id: savedId,
        title: draft.title,
        slides: draft.slides,
      }
      const code = await launchPresentationAsSession({ presentation: presentationForLaunch, ownerUid: uid, ownerEmail: email })
      onPresented(code)
    } catch (err) {
      setError(err.message || 'Não foi possível lançar a apresentação.')
    } finally {
      setLaunching(false)
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-yellow-50 font-sans text-slate-900 border-t-2 border-l-2 border-r-2 border-black">
      <BuilderHeader
        draft={draft}
        setTitle={setTitle}
        savedAt={savedAt}
        onBack={onBack}
        saving={saving}
        launching={launching}
        onSave={handleSave}
        onPresent={handlePresent}
        error={error}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <BackgroundGrid />
        <aside className="relative z-10 hidden w-[260px] shrink-0 flex-col gap-4 overflow-y-auto border-r-2 border-black bg-blue-100 px-4 py-5 cs-scroll-thin lg:flex">
          <SlidesRail
            slides={draft.slides}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={moveSlide}
            onAdd={addSlide}
            onRemove={removeSlide}
          />
        </aside>

        <section className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 py-5 lg:px-8 cs-scroll-thin">
          <StudioToolbar previewMode={previewMode} setPreviewMode={setPreviewMode} draft={draft} />

          <div className="mt-4 flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={addSlide}
              disabled={draft.slides.length >= MAX_SLIDES}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-none border-2 border-black bg-blue-200 px-4 py-2.5 text-sm font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <Plus className="h-4 w-4" /> Nova etapa
            </button>
            <button
              type="button"
              onClick={() => setRightTab(rightTab === 'properties' ? 'editor' : 'properties')}
              className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-black bg-black px-4 py-2.5 text-sm font-black uppercase text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              Editar
            </button>
          </div>

          <motion.div
            key={`canvas-wrap-${selectedSlide?.id ?? 'empty'}`}
            layout
            className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedSlide?.id ?? 'canvas-empty'}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  <SlideCanvas slide={selectedSlide} index={selectedIndex} total={draft.slides.length} />
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 hidden lg:block">
                <AnimatePresence mode="wait">
                  {selectedSlide ? (
                    <motion.div
                      key={selectedSlide.id + '-editor'}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <SlideEditor
                        slide={selectedSlide}
                        index={selectedIndex}
                        total={draft.slides.length}
                        onChange={(next) => updateSlide(selectedSlide.id, next)}
                        onRemove={() => removeSlide(selectedSlide.id)}
                        canRemove={draft.slides.length > 1}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <aside className="hidden flex-col gap-5 lg:flex">
              <RightPanelSwitch
                value={rightTab}
                onChange={setRightTab}
              />
              <div className="flex-1 cs-scroll-thin overflow-y-auto pr-1">
                {rightTab === 'properties' ? (
                  <PropertiesPanel slide={selectedSlide} />
                ) : (
                  <ComponentPalette />
                )}
              </div>
            </aside>
          </motion.div>

          <div className="mt-6 lg:hidden">
            {selectedSlide && (
              <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <SlideEditor
                  slide={selectedSlide}
                  index={selectedIndex}
                  total={draft.slides.length}
                  onChange={(next) => updateSlide(selectedSlide.id, next)}
                  onRemove={() => removeSlide(selectedSlide.id)}
                  canRemove={draft.slides.length > 1}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function BuilderHeader({ draft, setTitle, savedAt, onBack, saving, launching, onSave, onPresent, error }) {
  return (
    <header className="relative z-30 border-b-2 border-black bg-white">
      <div className="flex items-center gap-3 px-5 py-3.5 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="rounded-none border-2 border-black bg-white p-2 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-slate-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          title="Voltar ao dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Logo size="sm" withWordmark={false} />
        <div className="min-w-0 flex-1">
          <input
            value={draft.title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título da apresentação"
            maxLength={120}
            className="w-full max-w-md truncate border-0 border-b-4 border-black bg-transparent text-base font-black uppercase tracking-tight text-black outline-none placeholder:font-bold placeholder:text-slate-400 focus:ring-0"
          />
          <p className="flex items-center gap-1.5 text-xs font-black text-slate-600">
            <Badge tone="brand" className="hidden sm:inline-flex border-2 border-black bg-black text-white">Estúdio</Badge>
            <span className="text-black">
              {draft.slides.length} {draft.slides.length === 1 ? 'etapa' : 'etapas'}
            </span>
            {savedAt ? (
              <span className="flex items-center gap-1 text-green-700">
                <Check className="h-3 w-3" /> salvo agora
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || launching}
            className="h-10 gap-2 rounded-none border-2 border-black bg-white px-4 text-sm font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-slate-100 disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">Salvar</span>
          </button>
          <button
            type="button"
            onClick={onPresent}
            disabled={launching || saving}
            className="h-10 gap-2 rounded-none border-2 border-black bg-green-400 px-5 text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-green-500 disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            <span>Apresentar</span>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            className="mx-auto max-w-7xl px-5 pb-3 lg:px-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="flex items-center gap-2 rounded-none border-2 border-black bg-rose-400 px-4 py-2 text-sm font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <XCircle className="h-4 w-4" />
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function SlidesRail({ slides, selectedId, onSelect, onMove, onAdd, onRemove }) {
  return (
    <>
      <div>
        <p className="flex items-center gap-1.5 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">
          <LayoutGrid className="h-3 w-3" />
          Etapas
        </p>
        <div className="mt-3 space-y-2">
          {slides.map((slide, index) => {
            const active = slide.id === selectedId
            const type = SLIDE_TYPES[slide.type]
            return (
              <motion.div
                key={slide.id}
                layout
                onClick={() => onSelect(slide.id)}
                className={[
                  'group relative flex cursor-pointer items-start gap-3 rounded-none p-3 border-2 transition-all duration-100',
                  active 
                    ? 'border-black bg-yellow-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                    : 'border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]',
                ].join(' ')}
              >
                <span className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-none border-2 border-black text-xs font-black',
                  active
                    ? 'bg-black text-white'
                    : 'bg-slate-200 text-black',
                ].join(' ')}>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[10px] font-black uppercase tracking-wider text-black">
                    {type?.label ?? 'Etapa'}
                  </p>
                  <p className="truncate text-xs font-bold text-slate-800">{slideSnippet(slide)}</p>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); onMove(slide.id, -1) }}
                    disabled={index === 0}
                    className="rounded-none border border-black bg-white p-0.5 text-black hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); onMove(slide.id, 1) }}
                    disabled={index === slides.length - 1}
                    className="rounded-none border border-black bg-white p-0.5 text-black hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={slides.length >= MAX_SLIDES}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-none border-2 border-black bg-blue-200 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-blue-300 disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus className="h-4 w-4" /> Nova etapa
        </button>
        <button
          type="button"
          onClick={() => onRemove(slides[slides.length - 1]?.id)}
          disabled={slides.length <= 1}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-none border-2 border-black bg-rose-300 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-rose-400 disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          Remover última
        </button>
      </div>

      <div className="mt-4 rounded-none border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-[10px] font-black uppercase tracking-wider text-black">Atalhos</p>
        <ul className="mt-2 space-y-1 text-[11px] font-bold text-slate-700">
          <li>· Clique numa etapa para editar</li>
          <li>· Reordene com as setas do card</li>
          <li>· Adicione novas etapas à direita</li>
          <li>· Aperte “Apresentar“ para ir ao vivo</li>
        </ul>
      </div>
    </>
  )
}

function StudioToolbar({ previewMode, setPreviewMode, draft }) {
  return (
    <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <Badge tone="brand" dot className="border-2 border-black bg-black text-white">Modo estúdio</Badge>
        <span className="hidden text-sm font-black text-black lg:inline">
          {draft.slides.length} {draft.slides.length === 1 ? 'etapa' : 'etapas'} prontas ·
          {' '}tempo estimado: ~{Math.max(draft.slides.length * 2, 2)} min
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-black">Visualizar</span>
        <div className="flex items-center rounded-none border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          {PREVIEW_MODES.map((mode) => {
            const Icon = mode.icon
            const active = previewMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPreviewMode(mode.id)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all',
                  active
                    ? 'bg-black text-white border-r-2 border-black last:border-r-0'
                    : 'bg-white text-black border-r-2 border-black last:border-r-0 hover:bg-slate-100',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RightPanelSwitch({ value, onChange }) {
  return (
    <div className="flex items-center rounded-none border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      {[
        { id: 'properties', label: 'Propriedades', icon: Sparkles },
        { id: 'editor', label: 'Componentes', icon: Cpu },
      ].map((opt) => {
        const Icon = opt.icon
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-black uppercase transition-all',
              active
                ? 'bg-violet-400 text-black border-r-2 border-black last:border-r-0'
                : 'bg-white text-black border-r-2 border-black last:border-r-0 hover:bg-slate-100',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function BackgroundGrid() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-yellow-50" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:24px_24px]" />
    </>
  )
}