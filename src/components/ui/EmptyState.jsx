import { motion as Motion } from 'framer-motion'
import { IconEmpty } from '../icons/Icons'

export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <Motion.div
      className={[
        'flex flex-col items-center justify-center border-[3px] border-[#09090B] bg-white px-6 py-20 text-center shadow-[6px_6px_0px_0px_#09090B]',
        className,
      ].join(' ')}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center border-2 border-[#09090B] bg-[#E2FF32] text-[#09090B] shadow-[3px_3px_0px_0px_#09090B]">
        {Icon ? <Icon className="h-10 w-10" /> : <IconEmpty className="h-10 w-10" />}
      </div>
      <h3 className="text-lg font-black uppercase tracking-wider text-[#09090B]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm font-bold leading-relaxed text-slate-600">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Motion.div>
  )
}
