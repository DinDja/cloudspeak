export { CHART_PALETTE } from './colors'

export const PRESENCE_TTL_MS = 45000
export const PRESENCE_HEARTBEAT_MS = 15000
export const REACTION_LIFETIME_MS = 4200

export const TEAM_SELECTION_TYPE = 'team_selection'
export const SUMMARY_TYPE = 'summary'
export const EVIDENCE_BOARD_TYPE = 'evidence_board'
export const COVER_TYPE = 'cover'
export const INTRODUCTION_TYPE = 'introduction'
export const CLOSING_TYPE = 'closing'
export const STATIC_SLIDE_TYPES = [COVER_TYPE, INTRODUCTION_TYPE, CLOSING_TYPE]

export const STATIC_SLIDE_VARIANTS = {
  [COVER_TYPE]: [
    { id: 'notebook', label: 'Caderno criativo' },
    { id: 'computer', label: 'Computador 3D' },
    { id: 'editorial', label: 'Cartaz tipográfico' },
    { id: 'blueprint', label: 'Prancha técnica' },
    { id: 'zine', label: 'Fanzine de recortes' },
    { id: 'newspaper', label: 'Primeira página de jornal' },
    { id: 'contact_sheet', label: 'Folha de contatos' },
  ],
  [INTRODUCTION_TYPE]: [
    { id: 'notebook', label: 'Caderno de ideias' },
    { id: 'computer', label: 'Tela de computador' },
    { id: 'editorial', label: 'Página tipográfica' },
    { id: 'folder', label: 'Pasta de projeto' },
    { id: 'timeline', label: 'Roteiro em etapas' },
    { id: 'metro', label: 'Mapa de rotas' },
    { id: 'catalog', label: 'Ficha de catálogo' },
  ],
  [CLOSING_TYPE]: [
    { id: 'spotlight', label: 'Palco de encerramento' },
    { id: 'computer', label: 'Tela de próximos passos' },
    { id: 'notebook', label: 'Última página do caderno' },
    { id: 'credits', label: 'Cartela de créditos' },
    { id: 'receipt', label: 'Recibo de ideias' },
    { id: 'postcard', label: 'Cartão-postal' },
  ],
}

export const getDefaultStaticSlideVariant = (type) =>
  STATIC_SLIDE_VARIANTS[type]?.[0]?.id ?? 'editorial'

export const normalizeStaticSlideVariant = (type, variant) =>
  STATIC_SLIDE_VARIANTS[type]?.some((option) => option.id === variant)
    ? variant
    : getDefaultStaticSlideVariant(type)

export const isStaticSlideType = (type) => STATIC_SLIDE_TYPES.includes(type)
export const MAX_TEAM_CAPACITY = 50
export const MAX_SLIDES = 20
export const MAX_TEAM_PER_SLIDE = 12
export const MAX_WATERMARK_DATA_URL_LENGTH = 40000
export const MAX_WATERMARK_FILE_SIZE = 2000000
export const MAX_WATERMARK_DIMENSION = 1024
export const MIN_WATERMARK_DIMENSION = 320
export const MAX_SERIALIZED_SLIDES_LENGTH = 850000

export const ALLOWED_AUTH_DOMAIN = 'secti.ba.gov.br'
export const ALLOWED_AUTH_DOMAINS = [
  ALLOWED_AUTH_DOMAIN,
  'enova.educacao.ba.gov.br',
  'gmail.com',
]
export const AUTH_DOMAIN_LABEL = ALLOWED_AUTH_DOMAINS.map((domain) => `@${domain}`).join(', ')

export const REACTION_TYPES = ['heart', 'thumb', 'question']

export const SESSION_CODE_REGEX = /^[A-Z0-9]{6}$/

export const SLIDE_TYPES = {
  multiple_choice: {
    id: 'multiple_choice',
    label: 'Enquete',
    tagline: 'Votação com barras ao vivo',
    emoji: 'bar',
    tone: 'brand',
    accent: 'from-brand-500 to-brand-600',
    icon: 'chart',
  },
  word_cloud: {
    id: 'word_cloud',
    label: 'Nuvem de palavras',
    tagline: 'Termos livres agrupados por frequência',
    emoji: 'cloud',
    tone: 'violet',
    accent: 'from-violet-500 to-violet-600',
    icon: 'cloud',
  },
  open_text: {
    id: 'open_text',
    label: 'Perguntas abertas',
    tagline: 'Perguntas e comentários sem roteiro',
    emoji: 'chat',
    tone: 'ocean',
    accent: 'from-ocean-500 to-ocean-600',
    icon: 'chat',
  },
  [TEAM_SELECTION_TYPE]: {
    id: TEAM_SELECTION_TYPE,
    label: 'Seleção de times',
    tagline: 'Inscrição em clubes com limite de vagas',
    emoji: 'users',
    tone: 'sunset',
    accent: 'from-sunset-500 to-sunset-600',
    icon: 'users',
  },
  [SUMMARY_TYPE]: {
    id: SUMMARY_TYPE,
    label: 'Sumário',
    tagline: 'Navegação rápida entre os slides',
    emoji: 'list',
    tone: 'ocean',
    accent: 'from-ocean-500 to-ocean-600',
    icon: 'list',
  },
  [COVER_TYPE]: {
    id: COVER_TYPE,
    label: 'Capa',
    tagline: 'Abertura visual da apresentação',
    emoji: 'book',
    tone: 'sunset',
    accent: 'from-sunset-500 to-sunset-600',
    icon: 'book',
  },
  [INTRODUCTION_TYPE]: {
    id: INTRODUCTION_TYPE,
    label: 'Introdução',
    tagline: 'Contexto antes da conversa',
    emoji: 'text',
    tone: 'ocean',
    accent: 'from-ocean-500 to-ocean-600',
    icon: 'text',
  },
  [CLOSING_TYPE]: {
    id: CLOSING_TYPE,
    label: 'Capa de fechamento',
    tagline: 'Feche o encontro com uma mensagem',
    emoji: 'sparkles',
    tone: 'violet',
    accent: 'from-violet-500 to-violet-600',
    icon: 'sparkles',
  },
}

export const SLIDE_TYPE_ORDER = [
  'multiple_choice',
  'word_cloud',
  'open_text',
  TEAM_SELECTION_TYPE,
  SUMMARY_TYPE,
  COVER_TYPE,
  INTRODUCTION_TYPE,
  CLOSING_TYPE,
]
