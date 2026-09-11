import { useId } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { MAX_TEAM_CAPACITY, MAX_TEAM_PER_SLIDE, TEAM_SELECTION_TYPE, SLIDE_TYPES } from '../../lib/constants'
import { createTeamDraft } from '../../lib/validators'

export default function SlideEditor({
  slide,
  index,
  total,
  onChange,
  onRemove,
  canRemove,
  disabled = false,
}) {
  const fieldId = useId()
  const update = (patch) => onChange({ ...slide, ...patch })
  const changeType = (type) =>
    update({
      type,
      options: type === 'multiple_choice' ? (slide.options?.length ? slide.options : ['', '']) : [],
      teams:
        type === TEAM_SELECTION_TYPE
          ? slide.teams?.length
            ? slide.teams
            : [createTeamDraft('Time 1', 8), createTeamDraft('Time 2', 8)]
          : [],
    })
  return (
    <fieldset className="fala-slide-editor" disabled={disabled}>
      <header>
        <h2>Conteúdo do slide {index + 1}</h2>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove || disabled}
          title="Remover slide"
          aria-label="Remover slide"
        >
          <Trash2 size={15} />
        </button>
      </header>
      <div className="editor-field">
        <label htmlFor={fieldId + '-type'}>Tipo de interação</label>
        <select
          id={fieldId + '-type'}
          className="fala-input"
          value={slide.type}
          onChange={(event) => changeType(event.target.value)}
        >
          {Object.values(SLIDE_TYPES).map((type) => (
            <option value={type.id} key={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="editor-field">
        <label htmlFor={fieldId + '-question'}>Sua pergunta</label>
        <textarea
          id={fieldId + '-question'}
          className="fala-input"
          value={slide.question}
          onChange={(event) => update({ question: event.target.value })}
          placeholder="O que você quer perguntar ao público?"
          rows={4}
        />
      </div>
      {slide.type === 'multiple_choice' && (
        <div className="editor-field">
          <p>Alternativas</p>
          {(slide.options || []).map((option, i) => (
            <div key={i} className="editor-option">
              <span>{i + 1}</span>
              <input
                aria-label={`Alternativa ${i + 1}`}
                className="fala-input"
                value={option}
                placeholder={`Alternativa ${i + 1}`}
                onChange={(event) =>
                  update({ options: slide.options.map((value, j) => (i === j ? event.target.value : value)) })
                }
              />
              <button
                type="button"
                disabled={slide.options.length <= 2}
                aria-label={`Remover alternativa ${i + 1}`}
                onClick={() => update({ options: slide.options.filter((_, j) => j !== i) })}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="fala-link"
            onClick={() => update({ options: [...slide.options, ''] })}
          >
            <Plus size={14} />
            Adicionar alternativa
          </button>
        </div>
      )}
      {slide.type === TEAM_SELECTION_TYPE && (
        <div className="editor-field">
          <p>Times e vagas</p>
          {(slide.teams || []).map((team, i) => (
            <div key={team.id} className="editor-team">
              <div className="editor-option">
                <input
                  className="fala-input"
                  value={team.name}
                  aria-label={`Nome do time ${i + 1}`}
                  onChange={(event) =>
                    update({
                      teams: slide.teams.map((value, j) =>
                        i === j ? { ...value, name: event.target.value } : value,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  disabled={slide.teams.length <= 2}
                  aria-label={`Remover time ${i + 1}`}
                  onClick={() => update({ teams: slide.teams.filter((_, j) => j !== i) })}
                >
                  <X size={14} />
                </button>
              </div>
              <label>
                Vagas
                <input
                  className="fala-input"
                  type="number"
                  min={1}
                  max={MAX_TEAM_CAPACITY}
                  value={team.capacity}
                  onChange={(event) =>
                    update({
                      teams: slide.teams.map((value, j) =>
                        i === j ? { ...value, capacity: event.target.value } : value,
                      ),
                    })
                  }
                />
              </label>
            </div>
          ))}
          <button
            type="button"
            className="fala-link"
            disabled={slide.teams.length >= MAX_TEAM_PER_SLIDE}
            onClick={() =>
              update({ teams: [...slide.teams, createTeamDraft(`Time ${slide.teams.length + 1}`, 8)] })
            }
          >
            <Plus size={14} />
            Adicionar time
          </button>
        </div>
      )}
      <p className="editor-hint">
        {slide.type === 'word_cloud'
          ? 'O público pode enviar mais de uma palavra. Termos repetidos ganham destaque.'
          : slide.type === 'open_text'
            ? 'Cada pessoa envia uma resposta. As mensagens aparecem na projeção.'
            : slide.type === TEAM_SELECTION_TYPE
              ? 'Cada pessoa escolhe um time. Ao atingir a lotação, novas inscrições são bloqueadas.'
              : 'Cada pessoa escolhe uma alternativa. Os votos aparecem em tempo real.'}
      </p>
      <p className="editor-hint">
        Slide {index + 1} de {total}
      </p>
    </fieldset>
  )
}
