import { normalizeSlideWatermark } from '../../lib/slideStyles'

export default function SlideWatermark({ slide, className = '', hidden = false }) {
  const watermark = normalizeSlideWatermark(slide?.watermark)
  if (hidden || !watermark.image) return null

  return (
    <div
      className={`slide-watermark slide-watermark--${watermark.position} ${className}`}
      style={{ opacity: watermark.opacity }}
      aria-hidden="true"
    >
      <span className={watermark.hasBackground ? 'slide-watermark__surface' : undefined}>
        <img src={watermark.image} alt="" />
      </span>
    </div>
  )
}
