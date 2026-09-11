import { BarChart3, Cloud, MessageSquareText, Users } from 'lucide-react'
import { SLIDE_TYPES, SLIDE_TYPE_ORDER } from '../../lib/constants'

const ICONS = { multiple_choice: BarChart3, word_cloud: Cloud, open_text: MessageSquareText, team_selection: Users }

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
            aria-pressed={active}
            className={[
              'group flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
              active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
            ].join(' ')}
          >
            <span className={['flex h-8 w-8 items-center justify-center rounded-lg', active ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'].join(' ')}><Icon className="h-4 w-4" /></span>
            <span className="text-sm font-medium text-slate-800">{type.label}</span>
            {!compact && <span className="text-xs leading-4 text-slate-500">{type.tagline}</span>}
          </button>
        )
      })}
    </div>
  )
}
