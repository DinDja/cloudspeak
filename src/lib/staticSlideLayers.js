const DECORATIONS = {
  notebook: [['notebook-margin', 'Margem'], ['spiral', 'Espiral']],
  computer: [['computer', 'Computador'], ['computer-frame', 'Monitor'], ['computer-stand', 'Haste'], ['computer-base', 'Base do monitor']],
  editorial: [['editorial-block', 'Bloco de cor']],
  blueprint: [['blueprint', 'Desenho técnico']],
  zine: [['zine', 'Recortes']],
  folder: [['folder-clip', 'Clipe']],
  timeline: [],
  spotlight: [['spotlight', 'Luz do palco']],
  credits: [['credits-mark', 'Marca FIM']],
  receipt: [['receipt-barcode', 'Código de barras']],
  newspaper: [['newspaper-top', 'Cabeçalho do jornal'], ['newspaper-art', 'Imagem do jornal']],
  contact_sheet: [['contact-sheet', 'Folha de contatos'], ...Array.from({ length: 6 }, (_, index) => [`contact-frame-${index + 1}`, `Quadro ${index + 1}`])],
  metro: [['metro-map', 'Mapa SVG'], ['metro-red', 'Rota vermelha'], ['metro-blue', 'Rota azul'], ['metro-yellow', 'Rota amarela']],
  catalog: [],
  postcard: [['postcard-stamp', 'Selo']],
}

const TEXT_FIELDS = {
  eyebrow: 'Linha de abertura',
  title: 'Título',
  subtitle: 'Subtítulo',
  body: 'Texto',
  points: 'Lista de pontos',
  footer: 'Rodapé',
}

const BASE_LAYER_IDS = new Set([
  'content', ...Object.keys(TEXT_FIELDS),
  ...Object.values(DECORATIONS).flat().map(([id]) => id),
])

const clamp = (value, min, max, fallback) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

export const isHexColor = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)

export const getStaticSlideLayers = (slide) => {
  const type = slide?.type
  const variant = slide?.variant
  const layers = [{ id: 'content', label: 'Área de conteúdo', kind: 'group' }]
  layers.push({ id: 'eyebrow', label: TEXT_FIELDS.eyebrow, kind: 'text', field: 'eyebrow' })
  layers.push({ id: 'title', label: TEXT_FIELDS.title, kind: 'text', field: 'question' })
  if (slide?.subtitle) layers.push({ id: 'subtitle', label: TEXT_FIELDS.subtitle, kind: 'text', field: 'subtitle' })
  if (slide?.body) layers.push({ id: 'body', label: TEXT_FIELDS.body, kind: 'text', field: 'body' })
  if (slide?.points?.length) layers.push({ id: 'points', label: TEXT_FIELDS.points, kind: 'group' })
  if (type !== 'introduction' || slide?.footer) layers.push({ id: 'footer', label: TEXT_FIELDS.footer, kind: 'text', field: 'footer' })
  for (const [id, label] of DECORATIONS[variant] || []) layers.push({ id, label, kind: 'art' })
  for (const layer of slide?.customLayers || []) layers.push({ id: layer.id, label: layer.kind === 'text' ? (layer.text || 'Novo texto').slice(0, 28) : layer.kind === 'icon' ? 'Ícone SVG' : 'Forma', kind: layer.kind, custom: true })
  return layers
}

export const normalizeStaticLayerOverrides = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result = {}
  for (const [id, entry] of Object.entries(value)) {
    if (!BASE_LAYER_IDS.has(id) || !entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    result[id] = {
      x: clamp(entry.x, -120, 120, 0),
      y: clamp(entry.y, -120, 120, 0),
      scale: clamp(entry.scale, 0.2, 4, 1),
      rotation: clamp(entry.rotation, -180, 180, 0),
      opacity: clamp(entry.opacity, 0, 1, 1),
      hidden: entry.hidden === true,
      ...(isHexColor(entry.color) ? { color: entry.color } : {}),
    }
  }
  return result
}

export const normalizeCustomStaticLayers = (value) => {
  if (!Array.isArray(value)) return []
  const seen = new Set(BASE_LAYER_IDS)
  return value.slice(0, 24).flatMap((entry) => {
    if (!entry || !['text', 'shape', 'icon'].includes(entry.kind)) return []
    const candidate = typeof entry.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(entry.id) ? entry.id : null
    const id = candidate && !seen.has(candidate) ? candidate : crypto.randomUUID()
    seen.add(id)
    return [{
      id,
      kind: entry.kind,
      text: typeof entry.text === 'string' ? entry.text.slice(0, 240) : '',
      shape: ['rectangle', 'circle', 'line'].includes(entry.shape) ? entry.shape : 'rectangle',
      icon: ['star', 'arrow', 'chat', 'spark'].includes(entry.icon) ? entry.icon : 'star',
      x: clamp(entry.x, -30, 100, 20),
      y: clamp(entry.y, -30, 60, 20),
      width: clamp(entry.width, 2, 90, 24),
      height: clamp(entry.height, 1, 55, 9),
      scale: clamp(entry.scale, 0.2, 4, 1),
      rotation: clamp(entry.rotation, -180, 180, 0),
      opacity: clamp(entry.opacity, 0, 1, 1),
      hidden: entry.hidden === true,
      color: isHexColor(entry.color) ? entry.color : '#d45a40',
    }]
  })
}

export const createCustomStaticLayer = (kind) => ({
  id: crypto.randomUUID(),
  kind,
  text: kind === 'text' ? 'Novo texto' : '',
  shape: 'rectangle',
  icon: 'star',
  x: 22,
  y: 20,
  width: kind === 'text' ? 38 : 12,
  height: kind === 'text' ? 10 : 12,
  scale: 1,
  rotation: 0,
  opacity: 1,
  hidden: false,
  color: '#d45a40',
})
