export { CHART_PALETTE } from './colors'

export const PRESENCE_TTL_MS = 45000
export const PRESENCE_HEARTBEAT_MS = 15000
export const REACTION_LIFETIME_MS = 4200

export const TEAM_SELECTION_TYPE = 'team_selection'
export const MAX_TEAM_CAPACITY = 50
export const MAX_SLIDES = 20
export const MAX_TEAM_PER_SLIDE = 12

export const ALLOWED_AUTH_DOMAIN = 'secti.ba.gov.br'

export const REACTION_TYPES = ['heart', 'thumb', 'question']

export const SESSION_CODE_REGEX = /^[A-Z0-9]{6}$/

export const SLIDE_TYPES = {
  multiple_choice: {
    id: 'multiple_choice',
    label: 'Enquete',
    tagline: 'Votação com barras ao vivo',
    emoji: 'bar',
  },
  word_cloud: {
    id: 'word_cloud',
    label: 'Nuvem de palavras',
    tagline: 'Termos livres agrupados por frequência',
    emoji: 'cloud',
  },
  open_text: {
    id: 'open_text',
    label: 'Q&A aberto',
    tagline: 'Perguntas e comentários sem roteiro',
    emoji: 'chat',
  },
  [TEAM_SELECTION_TYPE]: {
    id: TEAM_SELECTION_TYPE,
    label: 'Seleção de times',
    tagline: 'Inscrição em clubes com limite de vagas',
    emoji: 'users',
  },
}

export const SLIDE_TYPE_ORDER = ['multiple_choice', 'word_cloud', 'open_text', TEAM_SELECTION_TYPE]
