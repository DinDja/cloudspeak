import { useState } from 'react'
import { ArrowLeft, ArrowUp, ArrowDown, Save, Play, Plus, Monitor, Smartphone } from 'lucide-react'
import Logo from '../components/ui/Logo'
import Modal from '../components/ui/Modal'
import SlideEditor from '../components/presenter/SlideEditor'
import SlideCanvas from '../components/presenter/SlideCanvas'
import SlideThumbnail from '../components/presenter/SlideThumbnail'
import { useAuth } from '../hooks/useAuth'
import { MAX_SLIDES } from '../lib/constants'
import { createSlideDraft, sanitizeSlides, sanitizeTitle } from '../lib/validators'
import { buildEditableDraft, createPresentation, updatePresentation } from '../lib/firebasePresentations'
import { launchPresentationAsSession } from '../lib/firebaseSessions'

const fingerprint = (draft) => JSON.stringify({ title: draft.title, slides: draft.slides, eventKey: draft.eventKey ?? null })

export default function PresentationBuilder({ initialPresentation, onBack, onPresented }) {
  const { uid, email } = useAuth()
  const [draft, setDraft] = useState(() => {
    const next = buildEditableDraft(initialPresentation)
    return next.slides.length ? next : { ...next, slides: [createSlideDraft()] }
  })
  const [selectedId, setSelectedId] = useState(draft.slides[0]?.id)
  const [savedSnapshot, setSavedSnapshot] = useState(() => (draft.id ? fingerprint(draft) : ''))
  const [previewMode, setPreviewMode] = useState('stage')
  const [saving, setSaving] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)
  const selectedIndex = Math.max(
    0,
    draft.slides.findIndex((slide) => slide.id === selectedId),
  )
  const selectedSlide = draft.slides[selectedIndex]
  const dirty = fingerprint(draft) !== savedSnapshot
  const busy = saving || launching

  const updateSlide = (next) =>
    setDraft((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) => (slide.id === next.id ? next : slide)),
    }))
  const addSlide = () => {
    if (draft.slides.length >= MAX_SLIDES) return
    const slide = createSlideDraft()
    setDraft((prev) => ({ ...prev, slides: [...prev.slides, slide] }))
    setSelectedId(slide.id)
  }
  const removeSlide = () => {
    if (draft.slides.length <= 1) return
    const slides = draft.slides.filter((slide) => slide.id !== selectedSlide.id)
    setSelectedId(slides[Math.min(selectedIndex, slides.length - 1)].id)
    setDraft((prev) => ({ ...prev, slides }))
  }
  const moveSlide = (id, direction) => {
    const index = draft.slides.findIndex((slide) => slide.id === id)
    const target = index + direction
    if (target < 0 || target >= draft.slides.length) return
    const slides = [...draft.slides]
    ;[slides[index], slides[target]] = [slides[target], slides[index]]
    setDraft((prev) => ({ ...prev, slides }))
  }
  const persist = async () => {
    setError('')
    const titleResult = sanitizeTitle(draft.title)
    if (titleResult.error) {
      setError(titleResult.error)
      return null
    }
    // Point to incomplete slides before sanitization can omit them.
    const invalidIndex = draft.slides.findIndex((slide) => {
      const result = sanitizeSlides([slide])
      return Boolean(result.error) || result.slides.length !== 1
    })
    if (invalidIndex >= 0) {
      setSelectedId(draft.slides[invalidIndex].id)
      setError(`Revise o slide ${invalidIndex + 1}: preencha a pergunta e as alternativas ou times.`)
      return null
    }
    setSaving(true)
    try {
      const snapshot = fingerprint(draft)
      const payload = {
        ownerUid: uid,
        ownerEmail: email,
        title: draft.title,
        slides: draft.slides,
        eventKey: draft.eventKey ?? null,
      }
      let id = draft.id
      if (id) await updatePresentation({ ...payload, id })
      else {
        const created = await createPresentation(payload)
        id = created.id
        setDraft((prev) => ({ ...prev, id }))
      }
      setSavedSnapshot(snapshot)
      return { id, title: draft.title, slides: draft.slides, eventKey: draft.eventKey ?? null }
    } catch (err) {
      setError(err.message || 'Não foi possível salvar. Tente novamente.')
      return null
    } finally {
      setSaving(false)
    }
  }
  const present = async () => {
    setLaunching(true)
    try {
      const saved = await persist()
      if (!saved) return
      const code = await launchPresentationAsSession({
        presentation: saved,
        ownerUid: uid,
        ownerEmail: email,
      })
      onPresented(code)
    } catch (err) {
      setError(err.message || 'Não foi possível abrir a apresentação.')
    } finally {
      setLaunching(false)
    }
  }

  return (
    <div className="fala-app builder-page">
      <header className="builder-header">
        <button
          type="button"
          className="fala-icon-button"
          disabled={busy}
          onClick={() => (dirty ? setLeaving(true) : onBack())}
          aria-label="Voltar às apresentações"
        >
          <ArrowLeft size={17} />
        </button>
        <Logo size="sm" />
        <div className="builder-title">
          <input
            aria-label="Título da apresentação"
            value={draft.title}
            maxLength={120}
            disabled={busy}
            placeholder="Título da apresentação"
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          />
          <p role="status">
            {saving ? 'Salvando…' : dirty ? 'Alterações não salvas' : 'Todas as alterações salvas'}
          </p>
        </div>
        <div className="builder-actions">
          <button
            type="button"
            className="fala-button fala-button--secondary"
            disabled={busy}
            onClick={persist}
          >
            <Save size={15} />
            <span>Salvar</span>
          </button>
          <button type="button" className="fala-button" disabled={busy} onClick={present}>
            <Play size={15} />
            {launching ? 'Abrindo…' : 'Apresentar'}
          </button>
        </div>
      </header>
      {error && (
        <p className="fala-error px-6" role="alert">
          {error}
        </p>
      )}
      <div className="builder-body">
        <aside className="builder-rail" aria-label="Sequência de slides">
          <div className="builder-rail__heading">
            <span>Slides / {draft.slides.length}</span>
            <button
              type="button"
              onClick={addSlide}
              disabled={busy || draft.slides.length >= MAX_SLIDES}
              aria-label="Adicionar slide"
            >
              <Plus size={17} />
            </button>
          </div>
          {draft.slides.map((slide, index) => (
            <div className="builder-rail__slide" key={slide.id}>
              <button
                type="button"
                className="builder-rail__select"
                aria-pressed={slide.id === selectedSlide.id}
                aria-label={`Selecionar slide ${index + 1}`}
                onClick={() => setSelectedId(slide.id)}
              >
                <SlideThumbnail slide={slide} compact />
                <span className="builder-rail__label">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span>{slide.id === selectedSlide.id ? 'Em edição' : 'Slide'}</span>
                </span>
              </button>
              <div className="builder-rail__move">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  aria-label={`Mover slide ${index + 1} para cima`}
                  onClick={() => moveSlide(slide.id, -1)}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  disabled={busy || index === draft.slides.length - 1}
                  aria-label={`Mover slide ${index + 1} para baixo`}
                  onClick={() => moveSlide(slide.id, 1)}
                >
                  <ArrowDown size={12} />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="fala-link"
            onClick={addSlide}
            disabled={busy || draft.slides.length >= MAX_SLIDES}
          >
            <Plus size={14} />
            Novo slide
          </button>
        </aside>
        <section className="builder-stage" aria-label="Pré-visualização do slide">
          <div className="builder-stage__toolbar">
            <span>
              Slide {selectedIndex + 1} de {draft.slides.length}
            </span>
            <div className="builder-stage__view">
              <button
                type="button"
                aria-pressed={previewMode === 'stage'}
                onClick={() => setPreviewMode('stage')}
              >
                <Monitor size={13} />
                Projeção
              </button>
              <button
                type="button"
                aria-pressed={previewMode === 'audience'}
                onClick={() => setPreviewMode('audience')}
              >
                <Smartphone size={13} />
                Celular
              </button>
            </div>
          </div>
          <div className="builder-stage__canvas">
            <SlideCanvas
              slide={selectedSlide}
              index={selectedIndex}
              total={draft.slides.length}
              mode={previewMode}
            />
            <p className="builder-stage__caption">
              Prévia do conteúdo · As respostas chegam ao abrir a apresentação.
            </p>
          </div>
        </section>
        <aside className="builder-inspector" aria-label="Edição do conteúdo">
          <SlideEditor
            slide={selectedSlide}
            index={selectedIndex}
            total={draft.slides.length}
            onChange={updateSlide}
            onRemove={removeSlide}
            canRemove={draft.slides.length > 1}
            disabled={busy}
          />
        </aside>
      </div>
      <Modal open={leaving} onClose={() => setLeaving(false)}>
        <h2 className="text-xl font-semibold">Você tem alterações não salvas.</h2>
        <p className="mt-3 text-sm text-stone-600">
          Salve a apresentação antes de sair para continuar depois.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="fala-link" onClick={() => setLeaving(false)}>
            Continuar editando
          </button>
          <button type="button" className="fala-button fala-button--secondary" onClick={onBack}>
            Sair sem salvar
          </button>
          <button
            type="button"
            className="fala-button"
            disabled={busy}
            onClick={async () => {
              const saved = await persist()
              setLeaving(false)
              if (saved) onBack()
            }}
          >
            Salvar e sair
          </button>
        </div>
      </Modal>
    </div>
  )
}
