import { EDUCATION_EVENT_KEY } from '../../lib/eventData'

export default function EducationWatermark({ eventKey, presentationTitle = '', className = '' }) {
  const normalizedTitle = String(presentationTitle)
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const isEducationPresentation =
    eventKey === EDUCATION_EVENT_KEY ||
    (normalizedTitle.includes('educacao') &&
      (normalizedTitle.includes('desenvolver') || normalizedTitle.includes('integral')))

  if (!isEducationPresentation) return null

  return (
    <img
      src="/logo-mapa-educacao-integral.png"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.06] mix-blend-multiply ${className}`}
    />
  )
}
