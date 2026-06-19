import { MAX_TEAM_CAPACITY, MAX_TEAM_PER_SLIDE, MAX_SLIDES, SESSION_CODE_REGEX, ALLOWED_AUTH_DOMAIN, TEAM_SELECTION_TYPE } from './constants'

export const normalizeText = (value) => value.trim().replace(/\s+/g, ' ')
export const getParticipantDisplayName = (value) => normalizeText(value) || 'Anônimo'

export const isSectiEmail = (email) => {
  if (typeof email !== 'string') return false
  const at = email.lastIndexOf('@')
  if (at < 1) return false
  return email.slice(at + 1).toLowerCase() === ALLOWED_AUTH_DOMAIN
}

export const isValidSessionCode = (code) =>
  typeof code === 'string' && SESSION_CODE_REGEX.test(code)

export const generateCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase()

export const getParticipantId = () => {
  const existing = sessionStorage.getItem('cloudspeak-participant-id')
  if (existing) return existing
  const created = crypto.randomUUID()
  sessionStorage.setItem('cloudspeak-participant-id', created)
  return created
}

export const getJoinUrl = (code) => {
  const configuredBaseUrl = import.meta.env.VITE_APP_URL
  const baseUrl = configuredBaseUrl || window.location.origin
  return `${baseUrl}/?code=${encodeURIComponent(code)}`
}

export const getTeamSelectionResponseId = (slideId, participantId) => `${slideId}__${participantId}`

export const createTeamDraft = (name = '', capacity = 8) => ({
  id: crypto.randomUUID(),
  name,
  capacity: String(capacity),
})

export const getDefaultTeamSelectionTeams = () => [
  createTeamDraft('Clube X', 8),
  createTeamDraft('Clube Y', 7),
]

export const createSlideDraft = (type = 'multiple_choice') => ({
  id: crypto.randomUUID(),
  type,
  question: '',
  options: type === 'multiple_choice' ? ['', ''] : [],
  teams: type === TEAM_SELECTION_TYPE ? getDefaultTeamSelectionTeams() : [],
})

export const buildTeamSelectionStats = (slide, responses = []) => {
  if (!slide || slide.type !== TEAM_SELECTION_TYPE) return []

  const teams = Array.isArray(slide.teams) ? slide.teams : []
  const membersByTeam = new Map(teams.map((team) => [team.name, []]))
  const assignedParticipants = new Set()

  responses.forEach((entry) => {
    if (entry?.type !== TEAM_SELECTION_TYPE) return

    const participantKey = normalizeText(entry.participantId ?? '')
    const teamName = normalizeText(entry.value ?? '')

    if (!participantKey || assignedParticipants.has(participantKey) || !membersByTeam.has(teamName)) {
      return
    }

    assignedParticipants.add(participantKey)
    membersByTeam.get(teamName).push({
      ...entry,
      participantName: getParticipantDisplayName(entry.participantName ?? ''),
    })
  })

  return teams.map((team, index) => {
    const capacity = Number(team.capacity) || 0
    const members = (membersByTeam.get(team.name) ?? []).sort((left, right) =>
      left.participantName.localeCompare(right.participantName, 'pt-BR'),
    )

    return {
      ...team,
      _colorIndex: index,
      capacity,
      count: members.length,
      spotsLeft: Math.max(capacity - members.length, 0),
      isFull: members.length >= capacity,
      members,
    }
  })
}

export const sanitizeSlides = (slides = []) => {
  let hasTeamSelectionError = false

  const normalizedSlides = slides
    .map((slide) => {
      const type = slide?.type
      const question = normalizeText(slide?.question ?? '')

      if (!question || !['multiple_choice', 'word_cloud', 'open_text', TEAM_SELECTION_TYPE].includes(type)) {
        return null
      }

      if (type === 'multiple_choice') {
        const options = (slide?.options ?? [])
          .map((option) => normalizeText(option ?? ''))
          .filter(Boolean)

        if (options.length < 2) return null

        return { id: slide.id || crypto.randomUUID(), type, question, options }
      }

      if (type === TEAM_SELECTION_TYPE) {
        const teams = []
        const seenTeams = new Set()

        if ((slide?.teams ?? []).length > MAX_TEAM_PER_SLIDE) {
          hasTeamSelectionError = true
          return null
        }

        for (const team of slide?.teams ?? []) {
          const name = normalizeText(typeof team?.name === 'string' ? team.name : '')
          const capacity = Number.parseInt(String(team?.capacity ?? ''), 10)
          const normalizedKey = name.toLowerCase()

          if (!name || !Number.isInteger(capacity) || capacity < 1 || capacity > MAX_TEAM_CAPACITY || seenTeams.has(normalizedKey)) {
            hasTeamSelectionError = true
            return null
          }

          seenTeams.add(normalizedKey)
          teams.push({ id: team.id || crypto.randomUUID(), name, capacity })
        }

        if (teams.length < 2) {
          hasTeamSelectionError = true
          return null
        }

        return { id: slide.id || crypto.randomUUID(), type, question, teams }
      }

      return { id: slide.id || crypto.randomUUID(), type, question }
    })
    .filter(Boolean)

  if (hasTeamSelectionError) {
    return {
      slides: [],
      error: `Na seleção de times, informe pergunta, pelo menos 2 clubes com nomes distintos e um limite entre 1 e ${MAX_TEAM_CAPACITY} vagas por clube.`,
    }
  }

  if (normalizedSlides.length === 0) {
    return {
      slides: [],
      error: 'Adicione pelo menos um slide válido. Em enquete, informe pergunta e no mínimo 2 opções.',
    }
  }

  if (normalizedSlides.length > MAX_SLIDES) {
    return { slides: [], error: `Uma apresentação possui no máximo ${MAX_SLIDES} slides.` }
  }

  return { slides: normalizedSlides, error: '' }
}

export const sanitizeTitle = (value) => {
  const title = normalizeText(value ?? '')
  if (!title) return { title: '', error: 'Informe um título para a apresentação.' }
  if (title.length > 120) return { title: '', error: 'O título deve ter no máximo 120 caracteres.' }
  return { title, error: '' }
}

export const describeAuthError = (code) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.'
    case 'auth/user-disabled':
      return 'Esta conta foi desativada.'
    case 'auth/user-not-found':
      return 'Não encontramos uma conta com este e-mail.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.'
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com este e-mail.'
    case 'auth/weak-password':
      return 'A senha precisa ter ao menos 6 caracteres.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um momento e tente novamente.'
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique sua internet e tente de novo.'
    default:
      return 'Algo deu errado. Tente novamente.'
  }
}
