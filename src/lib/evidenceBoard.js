import { EVIDENCE_BOARD_TYPE } from './constants'
import { formatResponseValue, normalizeText } from './validators'

const WORD_STOP_LIST = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'entre', 'essa',
  'esse', 'esta', 'este', 'eu', 'foi', 'isso', 'isto', 'mais', 'mas', 'na', 'nas', 'no', 'nos', 'nossa',
  'nossas', 'nosso', 'nossos', 'o', 'os', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos', 'por', 'que',
  'qual', 'quando', 'se', 'sem', 'ser', 'seu', 'seus', 'sua', 'suas', 'tem', 'têm', 'ter', 'um', 'uma',
  'umas', 'uns', 'você', 'vocês', 'sobre', 'também', 'muito', 'muita', 'muitos', 'muitas', 'pode',
  'podem', 'como', 'cada', 'entre', 'onde', 'tem', 'voce', 'voces', 'tambem',
])

const toMillis = (value) => {
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(value ?? '')
  return Number.isNaN(parsed) ? 0 : parsed
}

const normalizeKeyword = (value) =>
  value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const orderedResponses = (responses = []) =>
  responses
    .filter((entry) => normalizeText(entry?.value ?? ''))
    .map((entry, index) => ({ ...entry, _sourceIndex: index }))
    .sort((left, right) => {
      const dateDifference = toMillis(left.createdAt) - toMillis(right.createdAt)
      if (dateDifference !== 0) return dateDifference
      const idDifference = String(left.id ?? '').localeCompare(String(right.id ?? ''), 'pt-BR')
      return idDifference || left._sourceIndex - right._sourceIndex
    })

const buildKeywordStats = (responses) => {
  const keywords = new Map()

  responses.forEach((entry) => {
    const rawTokens = formatResponseValue(entry.value ?? '').match(/[\p{L}\p{N}]{3,}/gu) ?? []
    const uniqueTokens = new Map()

    rawTokens.forEach((token) => {
      const key = normalizeKeyword(token)
      if (!key || WORD_STOP_LIST.has(key) || /^\d+$/.test(key)) return
      uniqueTokens.set(key, token.toLocaleLowerCase('pt-BR'))
    })

    uniqueTokens.forEach((display, key) => {
      const current = keywords.get(key)
      if (current) {
        current.count += 1
        return
      }
      keywords.set(key, { key, term: display, count: 1 })
    })
  })

  return [...keywords.values()]
    .sort((left, right) => right.count - left.count || left.term.localeCompare(right.term, 'pt-BR'))
    .slice(0, 14)
}

const buildTimeline = (responses) => {
  const buckets = new Map()
  const bucketMinutes = 15

  responses.forEach((entry) => {
    const timestamp = toMillis(entry.createdAt)
    if (!timestamp) return
    const date = new Date(timestamp)
    date.setMinutes(Math.floor(date.getMinutes() / bucketMinutes) * bucketMinutes, 0, 0)
    const key = date.getTime()
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  })

  return [...buckets.entries()]
    .sort(([left], [right]) => left - right)
    .map(([timestamp, count]) => ({ timestamp, count }))
}

export const createEvidenceBoardSlide = () => ({
  id: crypto.randomUUID(),
  type: EVIDENCE_BOARD_TYPE,
  question: 'Quadro de evidências',
  style: {
    theme: 'avanca',
    layout: 'editorial',
    font: 'ibm-plex-sans',
    titleSize: 'large',
    titleWidth: 'full',
    titleAlign: 'left',
    titleCase: 'sentence',
  },
})

export const buildEvidenceSnapshot = ({ slides = [], responses = [], participants = [] } = {}) => {
  const contentSlides = slides.filter((slide) => slide?.type !== EVIDENCE_BOARD_TYPE)
  const validSlideIds = new Set(contentSlides.map((slide) => slide.id))
  const ordered = orderedResponses(responses).filter((entry) => validSlideIds.has(entry.slideId))
  const responsesBySlide = new Map()

  ordered.forEach((entry) => {
    const entries = responsesBySlide.get(entry.slideId) ?? []
    entries.push(entry)
    responsesBySlide.set(entry.slideId, entries)
  })

  const questionStats = contentSlides.map((slide, index) => {
    const slideResponses = responsesBySlide.get(slide.id) ?? []
    return {
      id: slide.id,
      index,
      question: slide.question,
      count: slideResponses.length,
      firstResponse: slideResponses[0] ?? null,
    }
  })

  const answeredQuestions = questionStats.filter((entry) => entry.count > 0).length
  const uniqueContributors = new Set(ordered.map((entry) => normalizeText(entry.participantId ?? '')).filter(Boolean))
  const topQuestion = [...questionStats].sort((left, right) => right.count - left.count || left.index - right.index)[0] ?? null
  const timeline = buildTimeline(ordered)

  return {
    totalResponses: ordered.length,
    contributorCount: uniqueContributors.size,
    presenceCount: participants.length,
    attendanceCount: participants.filter((entry) => entry?.attendance === true).length,
    questionCount: contentSlides.length,
    answeredQuestions,
    unansweredQuestions: Math.max(contentSlides.length - answeredQuestions, 0),
    averageResponses: contentSlides.length ? Math.round((ordered.length / contentSlides.length) * 10) / 10 : 0,
    topQuestion,
    questionStats,
    keywords: buildKeywordStats(ordered),
    timeline,
    excerpts: questionStats
      .filter((entry) => entry.firstResponse)
      .slice(0, 6)
      .map((entry) => ({
        questionIndex: entry.index,
        question: entry.question,
        value: formatResponseValue(entry.firstResponse.value),
        createdAt: entry.firstResponse.createdAt,
      })),
  }
}
