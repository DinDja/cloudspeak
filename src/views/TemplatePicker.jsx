import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import WorkspaceShell from '../components/ui/WorkspaceShell'
import TemplateCover from '../components/presenter/TemplateCover'
import { TEMPLATES } from '../lib/templates'
import { useAuth } from '../hooks/useAuth'

const FILTERS = [
  { id: 'all', label: 'Todos', templates: null },
  {
    id: 'special',
    label: 'Evento especial',
    templates: ['educacao-integral-integrada-bahia', 'avanca-mais-bahia'],
  },
  { id: 'meetings', label: 'Reuniões', templates: ['blank', 'kickoff', 'retro', 'townhall'] },
  { id: 'learning', label: 'Aulas e oficinas', templates: ['lecture', 'workshop'] },
  { id: 'projects', label: 'Projetos', templates: ['pitch', 'demo'] },
]

export default function TemplatePicker({
  onBack,
  onConfirm,
  initialTitle = '',
  initialTemplateId = 'blank',
}) {
  const { displayName, email } = useAuth()
  const [selectedId, setSelectedId] = useState(initialTemplateId)
  const [title, setTitle] = useState(initialTitle)
  const [filter, setFilter] = useState('all')
  const detailRef = useRef(null)
  const selected = TEMPLATES.find((item) => item.id === selectedId) || TEMPLATES[0]
  const slides = useMemo(() => selected.build(), [selected])
  const visible = TEMPLATES.filter(
    (item) =>
      !FILTERS.find((entry) => entry.id === filter)?.templates ||
      FILTERS.find((entry) => entry.id === filter).templates.includes(item.id),
  )
  const select = (id) => {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 600px)').matches)
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const submit = (event) => {
    event.preventDefault()
    onConfirm({
      templateId: selected.id,
      eventKey: selected.eventKey ?? null,
      title: title.trim() || (selected.id === 'blank' ? 'Nova apresentação' : selected.name),
    })
  }

  return (
    <WorkspaceShell
      active="templates"
      name={displayName || email?.split('@')[0]}
      email={email}
      onPresentations={onBack}
      onTemplates={() => setFilter('all')}
    >
      <div className="workspace-title-row">
        <div>
          <button type="button" className="fala-link" onClick={onBack}>
            <ArrowLeft size={15} />
            Apresentações
          </button>
          <h1 className="workspace-title">Comece com uma pergunta.</h1>
          <p className="workspace-subtitle">
            Escolha um roteiro para o seu encontro. Depois, deixe com a sua cara.
          </p>
        </div>
      </div>
      <nav className="template-filter" aria-label="Categorias de modelos">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="template-layout">
        <div className="template-grid">
          {visible.map((template) => (
            <TemplateCover
              key={template.id}
              template={template}
              index={TEMPLATES.indexOf(template)}
              selected={template.id === selectedId}
              onClick={() => select(template.id)}
            />
          ))}
        </div>
        <section className="template-detail" ref={detailRef} aria-label="Modelo selecionado">
          <p className="fala-eyebrow">MODELO SELECIONADO / {slides.length} SLIDES</p>
          <h2>{selected.name}</h2>
          <p>{selected.summary}</p>
          <ol>
            {slides.map((slide, index) => (
              <li key={slide.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{slide.question}</p>
              </li>
            ))}
          </ol>
          <form onSubmit={submit}>
            <label htmlFor="presentation-title">Nome da apresentação</label>
            <input
              id="presentation-title"
              className="fala-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={selected.id === 'blank' ? 'Nova apresentação' : selected.name}
              maxLength={120}
            />
            <button type="submit" className="fala-button">
              Usar este modelo
              <ArrowRight size={17} />
            </button>
          </form>
        </section>
      </div>
    </WorkspaceShell>
  )
}
