export { CHART_PALETTE } from './colors'

export const PRESENCE_TTL_MS = 45000
export const PRESENCE_HEARTBEAT_MS = 15000
export const REACTION_LIFETIME_MS = 4200

export const TEAM_SELECTION_TYPE = 'team_selection'
export const SUMMARY_TYPE = 'summary'
export const EVIDENCE_BOARD_TYPE = 'evidence_board'
export const MAX_TEAM_CAPACITY = 50
export const MAX_SLIDES = 20
export const MAX_TEAM_PER_SLIDE = 12

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
}

export const SLIDE_TYPE_ORDER = ['multiple_choice', 'word_cloud', 'open_text', TEAM_SELECTION_TYPE, SUMMARY_TYPE]
