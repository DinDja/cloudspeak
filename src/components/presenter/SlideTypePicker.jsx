import { BarChart3, Cloud, MessageSquareText, Users } from 'lucide-react'
import { SLIDE_TYPES, SLIDE_TYPE_ORDER } from '../../lib/constants'

const ICONS = {
  multiple_choice: BarChart3,
  word_cloud: Cloud,
  open_text: MessageSquareText,
  team_selection: Users,
}

const GRADIENTS = {
  multiple_choice: 'from-brand-500 to-brand-600',
  word_cloud: 'from-violet-500 to-violet-600',
  open_text: 'from-ocean-500 to-ocean-600',
  team_selection: 'from-sunset-500 to-sunset-600',
}

export default function SlideTypePicker({ value, onChange, compact = false }) {
  return (
    <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-4'}>
      {SLIDE_TYPE_ORDER.map((typeId) => {
        const type = SLIDE_TYPES[typeId]
        const Icon = ICONS[typeId]
        const active = value === typeId
        const gradient = GRADIENTS[typeId]
        return (
          <button
            key={typeId}
            type="button"
            onClick={() => onChange(typeId)}
            className={[
              'group flex flex-col items-start gap-2 p-4 text-left border-2 border-[#09090B] transition-all duration-100',
              active
                ? 'bg-[#E2FF32] shadow-[3px_3px_0px_0px_#09090B]'
                : 'bg-white shadow-[2px_2px_0px_0px_#09090B] hover:shadow-[4px_4px_0px_0px_#09090B] hover:-translate-x-[1px] hover:-translate-y-[1px]',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-10 w-10 items-center justify-center border-2 border-[#09090B] transition-all duration-100',
                active
                  ? 'bg-[#09090B] text-white'
                  : 'bg-white text-[#09090B] group-hover:bg-[#F4F4F0]',
              ].join(' ')}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className={['text-sm font-black tracking-tight', active ? 'text-[#09090B]' : 'text-[#09090B]'].join(' ')}>
              {type.label}
            </span>
            {!compact && <span className="text-xs font-medium leading-snug text-slate-500">{type.tagline}</span>}
          </button>
        )
      })}
    </div>
  )
}
