import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  ChevronUp,
  ChevronDown,
  Eye,
  Loader2,
  Layers,
} from 'lucide-react'
import Logo from '../components/ui/Logo'
import Badge from '../components/ui/Badge'
import SlideEditor from '../components/presenter/SlideEditor'
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

export default function PresentationBuilder({ initialPresentation, onBack, onPresented }) {
  const { uid, email } = useAuth()
  const [draft, setDraft] = useState(() => buildEditableDraft(initialPresentation))
  const [selectedId, setSelectedId] = useState(null)
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
    <div className="flex min-h-[100dvh] flex-col bg-canvas font-sans text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200"
              title="Voltar ao dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Logo size="sm" withWordmark={false} />
            <div className="min-w-0">
              <input
                value={draft.title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Título da apresentação"
                maxLength={120}
                className="w-full max-w-xs truncate border-0 bg-transparent text-base font-black tracking-tight text-slate-900 outline-none placeholder:font-bold placeholder:text-slate-400 focus:ring-0"
              />
              <p className="text-xs font-medium text-slate-400">
                {draft.slides.length} {draft.slides.length === 1 ? 'slide' : 'slides'}
                {savedAt && <span className="ml-2 text-ocean-700">• salvo</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || launching}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={handlePresent}
              disabled={launching || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-black text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float disabled:opacity-50"
            >
              {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              Apresentar
            </button>
          </div>
        </div>
        {error && (
          <div className="mx-auto max-w-7xl px-5 pb-3">
            <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600">{error}</p>
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-5 py-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24">
            <p className="mb-3 px-1 text-xs font-black uppercase tracking-wider text-slate-400">Slides</p>
            <div className="space-y-2 cs-scroll-thin overflow-y-auto pr-1" style={{ maxHeight: 'calc(100dvh - 16rem)' }}>
              {draft.slides.map((slide, index) => {
                const active = slide.id === selectedId
                const type = SLIDE_TYPES[slide.type]
                return (
                  <div
                    key={slide.id}
                    className={[
                      'group flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 transition-all',
                      active ? 'bg-white ring-brand-400 shadow-soft' : 'bg-white/60 ring-slate-200 hover:bg-white hover:ring-slate-300',
                    ].join(' ')}
                    onClick={() => setSelectedId(slide.id)}
                  >
                    <span className={[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black',
                      active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
                    ].join(' ')}>
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-700">{type?.label ?? 'Slide'}</p>
                      <p className="truncate text-xs font-medium text-slate-400">{slideSnippet(slide)}</p>
                    </div>
                    <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); moveSlide(slide.id, -1) }}
                        disabled={index === 0}
                        className="rounded p-0.5 text-slate-400 hover:text-brand-600 disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); moveSlide(slide.id, 1) }}
                        disabled={index === draft.slides.length - 1}
                        className="rounded p-0.5 text-slate-400 hover:text-brand-600 disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              type="button"
              onClick={addSlide}
              disabled={draft.slides.length >= MAX_SLIDES}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Novo slide
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {selectedSlide ? (
            <SlideEditor
              slide={selectedSlide}
              index={selectedIndex}
              total={draft.slides.length}
              onChange={(next) => updateSlide(selectedSlide.id, next)}
              onRemove={() => removeSlide(selectedSlide.id)}
              canRemove={draft.slides.length > 1}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-4xl bg-white ring-1 ring-slate-200">
              <p className="text-sm font-bold text-slate-400">Selecione ou crie um slide.</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between md:hidden">
            <button
              type="button"
              onClick={addSlide}
              disabled={draft.slides.length >= MAX_SLIDES}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-600"
            >
              <Plus className="h-4 w-4" /> Novo slide
            </button>
          </div>
        </section>

        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24">
            <p className="mb-3 flex items-center gap-1.5 px-1 text-xs font-black uppercase tracking-wider text-slate-400">
              <Eye className="h-3.5 w-3.5" /> Pré-visualização
            </p>
            <PreviewCard slide={selectedSlide} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function PreviewCard({ slide }) {
  if (!slide) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-4xl bg-white ring-1 ring-slate-200">
        <Layers className="h-8 w-8 text-slate-300" />
      </div>
    )
  }
  const type = SLIDE_TYPES[slide.type]
  return (
    <div className="overflow-hidden rounded-4xl bg-white ring-1 ring-slate-200 shadow-soft">
      <div className="flex aspect-video flex-col bg-canvas p-5">
        <Badge tone="brand" className="self-start">{type?.label}</Badge>
        <p className="mt-3 line-clamp-3 text-base font-black leading-snug text-slate-800">
          {slide.question?.trim() || 'Sua pergunta aparecerá aqui...'}
        </p>
        <div className="mt-auto space-y-2">
          {slide.type === 'multiple_choice' &&
            (slide.options ?? []).filter(Boolean).slice(0, 4).map((option, i) => (
              <div key={i} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                {option}
              </div>
            ))}
          {slide.type === 'team_selection' &&
            (slide.teams ?? []).slice(0, 4).map((team, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                <span className="truncate">{team.name || `Clube ${i + 1}`}</span>
                <span className="text-slate-400">{team.capacity}</span>
              </div>
            ))}
          {slide.type === 'word_cloud' && (
            <p className="text-xs font-medium text-slate-400">As palavras enviadas formam uma nuvem dinâmica.</p>
          )}
          {slide.type === 'open_text' && (
            <p className="text-xs font-medium text-slate-400">As respostas aparecem em cards no mural ao vivo.</p>
          )}
        </div>
      </div>
    </div>
  )
}
