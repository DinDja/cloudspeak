import { AVANCA_EVENT_KEY, EDUCATION_EVENT_KEY } from '../../lib/eventData'

const AVANCA_LOGO_URL = new URL('../../../Avança+/LOGO SEM FUNDO.png', import.meta.url).href

export default function EducationWatermark({ eventKey, presentationTitle = '', className = '' }) {
  const normalizedTitle = String(presentationTitle)
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const isEducationPresentation =
    eventKey === EDUCATION_EVENT_KEY ||
    (normalizedTitle.includes('educacao') &&
      (normalizedTitle.includes('desenvolver') || normalizedTitle.includes('integral')))

  const isAvancaPresentation =
    eventKey === AVANCA_EVENT_KEY ||
    normalizedTitle.includes('avanca')

  if (!isEducationPresentation && !isAvancaPresentation) return null

  if (isAvancaPresentation) {
    return (
      <img
        src={AVANCA_LOGO_URL}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.06] mix-blend-multiply"
      />
    )
  }

  return (
    <img
      src="/logo-mapa-educacao-integral.png"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.06] mix-blend-multiply ${className}`}
    />
  )
}
