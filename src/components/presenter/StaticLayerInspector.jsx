import { Eye, EyeOff, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { createCustomStaticLayer, getStaticSlideLayers, isHexColor } from '../../lib/staticSlideLayers'

const DEFAULTS = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, hidden: false }

export default function StaticLayerInspector({ slide, onChange, selectedLayerId, onSelectLayer, disabled = false }) {
  const layers = getStaticSlideLayers(slide)
  const selected = layers.find((layer) => layer.id === selectedLayerId)
  const custom = selected?.custom ? slide.customLayers?.find((layer) => layer.id === selectedLayerId) : null
  const values = custom || slide.layerOverrides?.[selectedLayerId] || DEFAULTS

  const updateSelected = (patch) => {
    if (!selected) return
    if (custom) onChange({ ...slide, customLayers: slide.customLayers.map((layer) => layer.id === selectedLayerId ? { ...layer, ...patch } : layer) })
    else onChange({ ...slide, layerOverrides: { ...slide.layerOverrides, [selectedLayerId]: { ...slide.layerOverrides?.[selectedLayerId], ...patch } } })
  }

  const addLayer = (kind) => {
    if ((slide.customLayers?.length || 0) >= 24) return
    const layer = createCustomStaticLayer(kind)
    onChange({ ...slide, customLayers: [...(slide.customLayers || []), layer] })
    onSelectLayer(layer.id)
  }

  return (
    <fieldset className="static-layer-inspector" disabled={disabled}>
      <div className="static-layer-inspector__head">
        <h2>Editar no canvas</h2>
        <p>Arraste para mover, dê dois cliques para editar o texto e use as setas para ajustes finos.</p>
      </div>
      <div className="static-layer-inspector__add" aria-label="Adicionar elemento">
        <button type="button" onClick={() => addLayer('text')} disabled={(slide.customLayers?.length || 0) >= 24}><Plus size={13} /> Texto</button>
        <button type="button" onClick={() => addLayer('shape')} disabled={(slide.customLayers?.length || 0) >= 24}><Plus size={13} /> Forma</button>
        <button type="button" onClick={() => addLayer('icon')} disabled={(slide.customLayers?.length || 0) >= 24}><Plus size={13} /> SVG</button>
      </div>
      <div className="static-layer-inspector__layers" aria-label="Camadas do slide">
        {layers.map((layer) => {
          const hidden = layer.custom
            ? slide.customLayers?.find((item) => item.id === layer.id)?.hidden
            : slide.layerOverrides?.[layer.id]?.hidden
          return (
            <button
              type="button"
              key={layer.id}
              className="static-layer-inspector__layer"
              aria-pressed={selectedLayerId === layer.id}
              onClick={() => onSelectLayer(layer.id)}
            >
              <span>{layer.label}</span>{hidden && <EyeOff size={13} />}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="static-layer-inspector__controls">
          <h3>{selected.label}</h3>
          {selected.field && (
            <label>
              Texto
              <textarea
                className="fala-input"
                rows={selected.field === 'question' ? 3 : 2}
                maxLength={selected.field === 'question' ? 220 : selected.field === 'body' ? 700 : 180}
                value={slide[selected.field] || ''}
                onChange={(event) => onChange({ ...slide, [selected.field]: event.target.value })}
              />
            </label>
          )}
          {custom?.kind === 'text' && (
            <label>Texto
              <textarea className="fala-input" rows={2} maxLength={240} value={custom.text} onChange={(event) => updateSelected({ text: event.target.value })} />
            </label>
          )}
          {custom?.kind === 'shape' && (
            <label>Forma
              <select className="fala-input" value={custom.shape} onChange={(event) => updateSelected({ shape: event.target.value })}>
                <option value="rectangle">Retângulo</option><option value="circle">Círculo</option><option value="line">Linha</option>
              </select>
            </label>
          )}
          {custom?.kind === 'icon' && (
            <label>Ícone SVG
              <select className="fala-input" value={custom.icon} onChange={(event) => updateSelected({ icon: event.target.value })}>
                <option value="star">Estrela</option><option value="arrow">Seta</option><option value="chat">Conversa</option><option value="spark">Brilho</option>
              </select>
            </label>
          )}
          <div className="static-layer-inspector__grid">
            <label>Horizontal
              <input className="fala-input" type="number" step="1" value={values.x ?? 0} onChange={(event) => updateSelected({ x: Number(event.target.value) })} />
            </label>
            <label>Vertical
              <input className="fala-input" type="number" step="1" value={values.y ?? 0} onChange={(event) => updateSelected({ y: Number(event.target.value) })} />
            </label>
            {custom && <>
              <label>Largura
                <input className="fala-input" type="number" min="2" max="90" value={custom.width} onChange={(event) => updateSelected({ width: Number(event.target.value) })} />
              </label>
              <label>Altura
                <input className="fala-input" type="number" min="1" max="55" value={custom.height} onChange={(event) => updateSelected({ height: Number(event.target.value) })} />
              </label>
            </>}
            <label>Escala
              <input className="fala-input" type="number" step="0.1" min="0.2" max="4" value={values.scale ?? 1} onChange={(event) => updateSelected({ scale: Number(event.target.value) })} />
            </label>
            <label>Rotação
              <input className="fala-input" type="number" step="1" min="-180" max="180" value={values.rotation ?? 0} onChange={(event) => updateSelected({ rotation: Number(event.target.value) })} />
            </label>
            <label>Opacidade
              <input className="fala-input" type="number" step="0.1" min="0" max="1" value={values.opacity ?? 1} onChange={(event) => updateSelected({ opacity: Number(event.target.value) })} />
            </label>
            {(selected.kind === 'text' || selected.kind === 'icon' || selected.kind === 'shape' || selected.id === 'blueprint' || selected.id.startsWith('metro-')) && (
              <label>{isHexColor(values.color) ? 'Cor' : 'Nova cor'}
                <input className="static-layer-inspector__color" type="color" value={isHexColor(values.color) ? values.color : '#d45a40'} onChange={(event) => updateSelected({ color: event.target.value })} />
              </label>
            )}
          </div>
          <div className="static-layer-inspector__actions">
            <button type="button" onClick={() => updateSelected({ hidden: !values.hidden })}>{values.hidden ? <Eye size={14} /> : <EyeOff size={14} />}{values.hidden ? 'Mostrar' : 'Ocultar'}</button>
            {custom ? (
              <button type="button" onClick={() => { onChange({ ...slide, customLayers: slide.customLayers.filter((layer) => layer.id !== selectedLayerId) }); onSelectLayer(null) }}><Trash2 size={14} /> Excluir</button>
            ) : (
              <button type="button" onClick={() => onChange({ ...slide, layerOverrides: Object.fromEntries(Object.entries(slide.layerOverrides || {}).filter(([id]) => id !== selectedLayerId)) })}><RotateCcw size={14} /> Restaurar</button>
            )}
          </div>
        </div>
      )}
      <label className="static-layer-inspector__background">{isHexColor(slide.canvasBackground) ? 'Fundo do slide' : 'Nova cor de fundo'}
        <span>
          <input type="color" value={isHexColor(slide.canvasBackground) ? slide.canvasBackground : '#f1ecdc'} onChange={(event) => onChange({ ...slide, canvasBackground: event.target.value })} />
          <button type="button" onClick={() => onChange({ ...slide, canvasBackground: undefined })}>Usar fundo do modelo</button>
        </span>
      </label>
    </fieldset>
  )
}
