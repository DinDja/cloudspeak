import { COLORS } from '../../lib/colors'

export default function WaveBackground({ variant = 'light', className = '' }) {
  const isDark = variant === 'dark'
  return (
    <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className={isDark ? 'absolute inset-0 bg-slate-950' : 'absolute inset-0 bg-canvas'} />
      <div className="absolute inset-0 bg-grid-soft bg-[size:32px_32px] opacity-60" />
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-[28rem] w-[28rem] rounded-full bg-ocean-200/25 blur-3xl" />
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[40vh] w-full opacity-70"
      >
        <defs>
          <linearGradient id="cs-wave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.brand[600]} stopOpacity="0.10" />
          <stop offset="100%" stopColor={COLORS.ocean[500]} stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <path
          fill="url(#cs-wave)"
          d="M0,224 C180,160 360,288 540,256 C720,224 900,96 1080,112 C1260,128 1380,224 1440,224 L1440,320 L0,320 Z"
        />
        <path
          fill="url(#cs-wave)"
          opacity="0.5"
          d="M0,272 C160,240 320,304 500,272 C680,240 860,176 1040,192 C1220,208 1360,256 1440,256 L1440,320 L0,320 Z"
        />
      </svg>
    </div>
  )
}
