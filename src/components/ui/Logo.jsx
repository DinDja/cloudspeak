import { COLORS } from '../../lib/colors'

export default function Logo({ size = 'md', withWordmark = true, className = '', onDark = false }) {
  const mark = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-xl' : 'text-2xl'
  return (
    <span className={['inline-flex items-center gap-3', className].join(' ')}>
      <span className={`relative inline-flex ${mark} items-center justify-center`}>
        <svg viewBox="0 0 48 48" fill="none" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="cs-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor={COLORS.brand[600]} />
              <stop offset="1" stopColor={COLORS.ocean[600]} />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="42" height="42" rx="14" fill="url(#cs-logo-grad)" />
          <path
            d="M14 27c2.5 0 3-4 6-4s3.5 4 6 4 3-4 6-4"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d="M14 21c2.5 0 3-4 6-4s3.5 4 6 4 3-4 6-4"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </span>
      {withWordmark && (
        <span className={`font-display font-black tracking-tight ${text} ${onDark ? 'text-white' : 'text-slate-900'}`}>
          Cloud<span className="font-light text-brand-500">Speak</span>
        </span>
      )}
    </span>
  )
}
