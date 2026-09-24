import { COVER_TYPE } from '../../lib/constants'

export default function StaticSlide({ slide, compact = false, mode = 'stage' }) {
  const isCover = slide?.type === COVER_TYPE
  const points = Array.isArray(slide?.points) ? slide.points : []

  return (
    <article
      className={`static-slide static-slide--${isCover ? 'cover' : 'introduction'} ${compact ? 'static-slide--compact' : ''} static-slide--${mode}`}
    >
      {isCover ? (
        <>
          <div className="static-slide__notebook-margin" aria-hidden="true" />
          <div className="static-slide__spiral" aria-hidden="true">
            {Array.from({ length: compact ? 7 : 11 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className="static-slide__cover-content">
            <p className="static-slide__eyebrow">{slide.eyebrow || 'Caderno de diálogo'}</p>
            <h1>{slide.question}</h1>
            {slide.subtitle && <p className="static-slide__subtitle">{slide.subtitle}</p>}
          </div>
          <div className="static-slide__cover-footer">
            <span>{slide.footer || 'Escuta · reflexão · próximos passos'}</span>
            <span className="static-slide__page-mark">01</span>
          </div>
        </>
      ) : (
        <div className="static-slide__intro-content">
          <p className="static-slide__eyebrow">{slide.eyebrow || 'Introdução'}</p>
          <h1>{slide.question}</h1>
          {slide.subtitle && <p className="static-slide__subtitle">{slide.subtitle}</p>}
          {slide.body && <p className="static-slide__body">{slide.body}</p>}
          {points.length > 0 && (
            <ul className="static-slide__points">
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}
          {slide.footer && <p className="static-slide__footer">{slide.footer}</p>}
        </div>
      )}
    </article>
  )
}
