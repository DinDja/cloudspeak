import { motion as Motion } from 'framer-motion'
import { IconSpinner } from '../icons/Icons'

export default function Spinner({ size = 'md', label, className = '' }) {
  const dim = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  return (
    <span className={['inline-flex items-center gap-3 text-[#09090B]', className].join(' ')}>
      <IconSpinner className={`${dim} text-[#09090B]`} />
      {label && <span className="font-medium text-[#09090B]">{label}</span>}
    </span>
  )
}

export function FullPageLoader({ label = 'Carregando...' }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f4ef]">
      <Motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative mx-auto h-8 w-8">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-stone-300 border-t-violet-700" />
        </div>
        {label && <p className="mt-5 text-base font-medium text-[#09090B]">{label}</p>}
      </Motion.div>
    </div>
  )
}

export { IconSpinner }
