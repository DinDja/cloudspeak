export default function WaveBackground({ variant = 'light', className = '' }) {
  const isDark = variant === 'dark'
  return (
    <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className={isDark ? 'absolute inset-0 bg-slate-950' : 'absolute inset-0 bg-gradient-to-br from-brand-50/80 via-canvas to-violet-50/60'} />
      
      <div className="absolute -top-20 -left-20 h-[28rem] w-[28rem] rounded-full bg-brand-200/15 blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-20 -right-20 h-[32rem] w-[32rem] rounded-full bg-violet-200/15 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-ocean-200/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />
      
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[30vh] w-full opacity-30"
      >
        <defs>
          <linearGradient id="cs-wave-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2552F0" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path
          fill="url(#cs-wave-grad)"
          d="M0,192 C240,192 480,128 720,144 C960,160 1200,256 1440,224 L1440,320 L0,320 Z"
        />
        <path
          fill="url(#cs-wave-grad)"
          opacity="0.4"
          d="M0,240 C200,240 400,192 600,208 C800,224 1000,272 1200,256 C1320,248 1380,240 1440,240 L1440,320 L0,320 Z"
        />
      </svg>
    </div>
  )
}
