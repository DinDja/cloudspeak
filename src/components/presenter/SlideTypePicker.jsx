import { BarChart3, Cloud, MessageSquareText, Users } from 'lucide-react'
import { SLIDE_TYPES, SLIDE_TYPE_ORDER } from '../../lib/constants'

const ICONS = {
  multiple_choice: BarChart3,
  word_cloud: Cloud,
  open_text: MessageSquareText,
  team_selection: Users,
}

export default function SlideTypePicker({ value, onChange, compact = false }) {
  return (
    <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-4'}>
      {SLIDE_TYPE_ORDER.map((typeId) => {
        const type = SLIDE_TYPES[typeId]
        const Icon = ICONS[typeId]
        const active = value === typeId
        return (
          <button
            key={typeId}
            type="button"
            onClick={() => onChange(typeId)}
            className={[
              'group flex flex-col items-start gap-2 rounded-2xl p-4 text-left ring-1 transition-all',
              active
                ? 'bg-brand-50 ring-2 ring-brand-500 shadow-soft'
                : 'bg-white ring-slate-200 hover:bg-slate-50 hover:ring-brand-200',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600',
              ].join(' ')}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className={['text-sm font-black tracking-tight', active ? 'text-brand-700' : 'text-slate-800'].join(' ')}>
              {type.label}
            </span>
            {!compact && <span className="text-xs font-medium leading-snug text-slate-500">{type.tagline}</span>}
          </button>
        )
      })}
    </div>
  )
}
