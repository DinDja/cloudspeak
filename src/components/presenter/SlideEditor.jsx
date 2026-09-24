import { useId, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ImagePlus, Palette, Plus, Trash2, X } from 'lucide-react'
import { isStaticSlideType, MAX_TEAM_CAPACITY, MAX_TEAM_PER_SLIDE, MAX_WATERMARK_DATA_URL_LENGTH, MAX_WATERMARK_DIMENSION, MAX_WATERMARK_FILE_SIZE, MIN_WATERMARK_DIMENSION, SUMMARY_TYPE, TEAM_SELECTION_TYPE, SLIDE_TYPES } from '../../lib/constants'
import { createTeamDraft } from '../../lib/validators'
import {
  normalizeSlideStyle,
  normalizeSlideWatermark,
  SLIDE_FONT_OPTIONS,
  SLIDE_LAYOUT_OPTIONS,
  SLIDE_STYLE_OPTIONS,
  SLIDE_WATERMARK_POSITION_OPTIONS,
  SLIDE_TITLE_CASE_OPTIONS,
  SLIDE_TITLE_ALIGN_OPTIONS,
  SLIDE_TITLE_SIZE_OPTIONS,
  SLIDE_TITLE_WIDTH_OPTIONS,
} from '../../lib/slideStyles'

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
      question: type === SUMMARY_TYPE ? slide.question || 'Sumário da apresentação' : slide.question,
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
        <label htmlFor={fieldId + '-type'}>Tipo de slide</label>
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
        <label htmlFor={fieldId + '-question'}>{slide.type === SUMMARY_TYPE ? 'Título do sumário' : isStaticSlideType(slide.type) ? 'Título da página' : 'Sua pergunta'}</label>
        <textarea
          id={fieldId + '-question'}
          className="fala-input"
          value={slide.question}
          onChange={(event) => update({ question: event.target.value })}
          placeholder={slide.type === SUMMARY_TYPE ? 'Ex.: Sumário da apresentação' : isStaticSlideType(slide.type) ? 'Ex.: Aprendizagem em movimento' : 'O que você quer perguntar ao público?'}
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
      <SlideStyleControls
        style={normalizeSlideStyle(slide.style)}
        onChange={(style) => update({ style })}
      />
      <SlideWatermarkControls
        watermark={normalizeSlideWatermark(slide.watermark)}
        onChange={(watermark) => update({ watermark })}
      />
      <p className="editor-hint">
        {slide.type === SUMMARY_TYPE
          ? 'O sumário lista os slides automaticamente. Durante a apresentação, clique em um item para ir direto até ele.'
          : isStaticSlideType(slide.type)
          ? 'Página informativa: não recebe respostas e avança junto com a apresentação.'
          : slide.type === 'word_cloud'
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

function SlideWatermarkControls({ watermark, onChange }) {
  const [uploadError, setUploadError] = useState('')

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      setUploadError('')
      const image = await readWatermarkFile(file)
      onChange({ ...watermark, image })
    } catch (error) {
      setUploadError(error.message || 'Não foi possível carregar essa imagem.')
    }
  }

  return (
    <div className="editor-field slide-watermark-controls">
      <p className="flex items-center gap-1.5">
        <ImagePlus size={14} />
        Marca d’água
      </p>
      <p className="editor-hint mt-0">
        A imagem é reduzida automaticamente e aparece na prévia e na apresentação.
      </p>
      <label className="watermark-upload">
        <ImagePlus size={16} />
        <span>{watermark.image ? 'Trocar logo' : 'Escolher logo'}</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleUpload}
        />
      </label>
      {watermark.image && (
        <div className="watermark-upload-preview">
          <img src={watermark.image} alt="Prévia da marca d’água" />
          <button type="button" className="fala-link" onClick={() => onChange({ ...watermark, image: '' })}>
            Remover logo
          </button>
        </div>
      )}
      {uploadError && <p className="fala-error" role="alert">{uploadError}</p>}
      <div className="watermark-control-grid">
        <label>
          Posição
          <select
            className="fala-input"
            value={watermark.position}
            onChange={(event) => onChange({ ...watermark, position: event.target.value })}
          >
            {SLIDE_WATERMARK_POSITION_OPTIONS.map((position) => (
              <option key={position.id} value={position.id}>{position.label}</option>
            ))}
          </select>
        </label>
        <label>
          Opacidade <span className="watermark-range-value">{Math.round(watermark.opacity * 100)}%</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(watermark.opacity * 100)}
            onChange={(event) => onChange({ ...watermark, opacity: Number(event.target.value) / 100 })}
          />
        </label>
      </div>
      <label className="watermark-background-toggle">
        <input
          type="checkbox"
          checked={watermark.hasBackground}
          onChange={(event) => onChange({ ...watermark, hasBackground: event.target.checked })}
        />
        <span>
          <strong>Adicionar fundo</strong>
          <small>Usa a superfície do tema atrás da logo.</small>
        </span>
      </label>
    </div>
  )
}

const readWatermarkFile = (file) => {
  if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
    return Promise.reject(new Error('Escolha uma imagem PNG, JPG ou WebP.'))
  }
  if (file.size > MAX_WATERMARK_FILE_SIZE) {
    return Promise.reject(new Error('A imagem deve ter no máximo 2 MB.'))
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    const finish = (callback, value) => {
      URL.revokeObjectURL(objectUrl)
      callback(value)
    }

    image.onload = () => {
      try {
        const sourceWidth = image.naturalWidth || image.width
        const sourceHeight = image.naturalHeight || image.height
        if (!sourceWidth || !sourceHeight) {
          finish(reject, new Error('Não foi possível carregar essa imagem.'))
          return
        }

        const canvas = document.createElement('canvas')
        const longestSide = Math.max(sourceWidth, sourceHeight)
        const initialLongestSide = Math.min(longestSide, MAX_WATERMARK_DIMENSION)
        const minimumLongestSide = Math.min(initialLongestSide, MIN_WATERMARK_DIMENSION)
        const qualitySteps = [0.78, 0.62, 0.48, 0.36, 0.28]

        for (let currentLongestSide = initialLongestSide; currentLongestSide >= minimumLongestSide; currentLongestSide = Math.floor(currentLongestSide * 0.78)) {
          const scale = currentLongestSide / longestSide
          const width = Math.max(1, Math.round(sourceWidth * scale))
          const height = Math.max(1, Math.round(sourceHeight * scale))
          canvas.width = width
          canvas.height = height

          const context = canvas.getContext('2d')
          if (!context) break
          context.clearRect(0, 0, width, height)
          context.drawImage(image, 0, 0, width, height)

          for (const quality of qualitySteps) {
            const encoded = canvas.toDataURL('image/webp', quality)
            const output = encoded.startsWith('data:image/webp')
              ? encoded
              : canvas.toDataURL('image/png')

            if (output.length <= MAX_WATERMARK_DATA_URL_LENGTH) {
              finish(resolve, output)
              return
            }
          }
        }

        finish(reject, new Error('Não foi possível reduzir essa imagem. Escolha uma imagem menor ou com menos detalhes.'))
      } catch {
        finish(reject, new Error('Não foi possível preparar essa imagem.'))
      }
    }
    image.onerror = () => finish(reject, new Error('Não foi possível carregar essa imagem.'))
    image.src = objectUrl
  })
}

function SlideStyleControls({ style, onChange }) {
  return (
    <div className="editor-field slide-style-controls">
      <p className="flex items-center gap-1.5">
        <Palette size={14} />
        Estilo visual
      </p>
      <div className="slide-style-grid">
        {SLIDE_STYLE_OPTIONS.map((theme) => (
          <button
            key={theme.id}
            type="button"
            aria-pressed={style.theme === theme.id}
            className={`slide-style-card${style.theme === theme.id ? ' slide-style-card--active' : ''}`}
            onClick={() => onChange({ ...style, theme: theme.id })}
          >
            <span className={`slide-style-swatch slide-style-swatch--${theme.id}`} />
            <span className="slide-style-card__label">{theme.label}</span>
            <span className="slide-style-card__description">{theme.description}</span>
          </button>
        ))}
      </div>
      <div className="slide-layout-grid">
        {SLIDE_LAYOUT_OPTIONS.map((layout) => {
          const Icon = layout.id === 'centered' ? AlignCenter : AlignLeft
          return (
            <button
              key={layout.id}
              type="button"
              aria-pressed={style.layout === layout.id}
              className={`slide-layout-card${style.layout === layout.id ? ' slide-layout-card--active' : ''}`}
              onClick={() => onChange({ ...style, layout: layout.id })}
            >
              <Icon size={14} />
              <span>
                <strong>{layout.label}</strong>
                <small>{layout.description}</small>
              </span>
            </button>
          )
        })}
      </div>
      <div className="slide-typography-section">
        <span className="slide-style-label">Fonte do título</span>
        <div className="slide-font-grid">
          {SLIDE_FONT_OPTIONS.map((font) => (
            <button
              key={font.id}
              type="button"
              aria-pressed={style.font === font.id}
              className={`slide-font-card${style.font === font.id ? ' slide-font-card--active' : ''}`}
              onClick={() => onChange({ ...style, font: font.id })}
              style={{ fontFamily: font.family }}
            >
              <strong>Aa</strong>
              <span>{font.label}</span>
              <small>{font.description}</small>
            </button>
          ))}
        </div>
        <div className="slide-type-options">
          <div>
            <span className="slide-style-label">Tamanho</span>
            <div className="slide-type-option-list">
              {SLIDE_TITLE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  aria-pressed={style.titleSize === size.id}
                  className={style.titleSize === size.id ? 'slide-type-option--active' : ''}
                  onClick={() => onChange({ ...style, titleSize: size.id })}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="slide-style-label">Largura da pergunta</span>
            <div className="slide-type-option-list">
              {SLIDE_TITLE_WIDTH_OPTIONS.map((width) => (
                <button
                  key={width.id}
                  type="button"
                  aria-pressed={style.titleWidth === width.id}
                  className={style.titleWidth === width.id ? 'slide-type-option--active' : ''}
                  onClick={() => onChange({ ...style, titleWidth: width.id })}
                >
                  {width.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="slide-style-label">Alinhamento do texto</span>
            <div className="slide-type-option-list">
              {SLIDE_TITLE_ALIGN_OPTIONS.map((align) => {
                const Icon = align.id === 'center' ? AlignCenter : align.id === 'right' ? AlignRight : AlignLeft
                return (
                  <button
                    key={align.id}
                    type="button"
                    aria-label={align.label}
                    title={align.label}
                    aria-pressed={style.titleAlign === align.id}
                    className={style.titleAlign === align.id ? 'slide-type-option--active' : ''}
                    onClick={() => onChange({ ...style, titleAlign: align.id })}
                  >
                    <Icon size={13} />
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <span className="slide-style-label">Caixa</span>
            <div className="slide-type-option-list">
              {SLIDE_TITLE_CASE_OPTIONS.map((titleCase) => (
                <button
                  key={titleCase.id}
                  type="button"
                  aria-pressed={style.titleCase === titleCase.id}
                  className={style.titleCase === titleCase.id ? 'slide-type-option--active' : ''}
                  onClick={() => onChange({ ...style, titleCase: titleCase.id })}
                >
                  {titleCase.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
