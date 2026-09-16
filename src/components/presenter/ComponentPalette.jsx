import { BarChart3, Cloud, MessageSquareText, Users, Plus, Layers, Box } from 'lucide-react'
import { SLIDE_TYPES, SLIDE_TYPE_ORDER } from '../../lib/constants'

const ICONS = { multiple_choice: BarChart3, word_cloud: Cloud, open_text: MessageSquareText, team_selection: Users }

export default function ComponentPalette() {
  return (
    <div className="space-y-6">
      <SEConHeader icon={Box} title="Componentes" subtitle="Escolha um tipo de interação" />
      <div className="grid grid-cols-2 gap-2">
        {SLIDE_TYPE_ORDER.map((typeId) => {
          const type = SLIDE_TYPES[typeId]
          const Icon = ICONS[typeId]
          return (
            <button key={typeId} type="button" className="group relative flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-900"><Icon className="h-4 w-4" /></span>
              <div><p className="text-sm font-medium text-slate-800">{type.label}</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">{type.tagline}</p></div>
              <Plus className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 group-hover:text-violet-900" />
            </button>
          )
        })}
      </div>

      <SEConHeader icon={Layers} title="Camadas" subtitle="Ordem da etapa" />
      <div className="space-y-1.5">
        {['Pergunta principal', 'Componente interativo', 'Fundo'].map((label, index) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-center gap-2.5"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-medium text-slate-500">0{index + 1}</span><span className="text-xs text-slate-600">{label}</span></div>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Templates rápidos</p>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">Precisa de estrutura? Você pode aplicar um template ao criar a apresentação.</p>
      </div>
    </div>
  )
}

function SEConHeader({ icon, title, subtitle }) {
  const Icon = icon
  return <div><p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"><Icon className="h-4 w-4 text-slate-400" />{title}</p>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}</div>
}
