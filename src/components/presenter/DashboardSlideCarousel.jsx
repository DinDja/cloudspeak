import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SlideThumbnail from './SlideThumbnail'

const MAX_PREVIEW_SLIDES = 5

export default function DashboardSlideCarousel({
  slides = [],
  total,
  presentationTitle,
  eventKey,
  onEdit,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [stageWidth, setStageWidth] = useState(0)
  const stageRef = useRef(null)
  const previewSlides = slides.slice(0, MAX_PREVIEW_SLIDES)
  const previewCount = previewSlides.length
  const angleStep = previewCount > 2 ? 360 / previewCount : 0
  const cardWidth = Math.min(stageWidth * (previewCount > 2 ? 0.56 : 0.62), previewCount > 2 ? 380 : 420)
  const staticScale = cardWidth > 0 ? cardWidth / 1080 : 0.35
  const depth = previewCount > 2
    ? cardWidth / (2 * Math.tan(Math.PI / previewCount))
    : 0

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined

    const measure = () => setStageWidth(stage.getBoundingClientRect().width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, previewCount - 1)))
  }, [previewCount])

  if (!previewCount) return null

  const goTo = (index) => {
    setActiveIndex((index + previewCount) % previewCount)
  }
  const move = (direction) => goTo(activeIndex + direction)
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
      event.currentTarget.focus()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
      event.currentTarget.focus()
    }
  }

  return (
    <section
      className={`deck-carousel ${previewCount > 2 ? 'deck-carousel--3d' : 'deck-carousel--flat'}`}
      aria-label={`Prévia dos slides de ${presentationTitle}`}
      aria-roledescription="carrossel"
    >
      <div className="deck-carousel__stage" ref={stageRef}>
        <div
          className="deck-carousel__spinner"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label="Use as setas esquerda e direita para navegar pelos slides"
          style={{ transform: `rotateY(${-activeIndex * angleStep}deg)` }}
        >
          {previewCount > 2 ? previewSlides.map((slide, index) => {
            const distance = Math.min(
              (index - activeIndex + previewCount) % previewCount,
              (activeIndex - index + previewCount) % previewCount,
            )
            return (
              <button
                key={slide?.id || index}
                type="button"
                className="deck-carousel__slide"
                style={{
                  '--slide-angle': `${index * angleStep}deg`,
                  '--slide-depth': `${depth}px`,
                  '--slide-opacity': distance === 0 ? 1 : distance === 1 ? 0.28 : 0.08,
                }}
                onClick={onEdit}
                aria-label={`Editar ${presentationTitle} — slide ${index + 1}`}
                aria-hidden={distance > 1}
                tabIndex={distance > 1 ? -1 : 0}
              >
                <SlideThumbnail
                  slide={slide}
                  index={index}
                  total={total}
                  slides={slides}
                  presentationTitle={presentationTitle}
                  eventKey={eventKey}
                  compact
                  staticScale={staticScale}
                />
              </button>
            )
          }) : (
            <button
              key={previewSlides[activeIndex]?.id || activeIndex}
              type="button"
              className="deck-carousel__slide deck-carousel__slide--flat"
              onClick={onEdit}
              aria-label={`Editar ${presentationTitle} — slide ${activeIndex + 1}`}
            >
              <SlideThumbnail
                slide={previewSlides[activeIndex]}
                index={activeIndex}
                total={total}
                slides={slides}
                presentationTitle={presentationTitle}
                eventKey={eventKey}
                compact
                staticScale={staticScale}
              />
            </button>
          )}
        </div>
        {previewCount > 1 && (
          <>
            <button
              type="button"
              className="deck-carousel__arrow deck-carousel__arrow--previous"
              onClick={() => move(-1)}
              aria-label="Slide anterior"
            >
              <ChevronLeft size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="deck-carousel__arrow deck-carousel__arrow--next"
              onClick={() => move(1)}
              aria-label="Próximo slide"
            >
              <ChevronRight size={19} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <div className="deck-carousel__caption">
        <span>Slide {activeIndex + 1} de {total}</span>
        {total > previewCount && <span>+{total - previewCount} slides</span>}
        <div className="deck-carousel__dots" aria-label="Escolher slide">
          {previewSlides.map((slide, index) => (
            <button
              key={slide?.id || index}
              type="button"
              className="deck-carousel__dot"
              aria-label={`Mostrar slide ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
