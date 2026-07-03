import {
  BarChart3,
  Cloud,
  MessageSquareText,
  Users,
  Plus,
  Layers,
  Box,
} from 'lucide-react'
import { SLIDE_TYPES, SLIDE_TYPE_ORDER } from '../../lib/constants'

const ICONS = {
  multiple_choice: BarChart3,
  word_cloud: Cloud,
  open_text: MessageSquareText,
  team_selection: Users,
}

const GRADIENTS = {
  multiple_choice: 'from-brand-500 to-brand-700',
  word_cloud: 'from-violet-500 to-violet-700',
  open_text: 'from-ocean-500 to-ocean-700',
  team_selection: 'from-sunset-500 to-sunset-700',
}

export default function ComponentPalette() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Box} title="Componentes" subtitle="Arraste para a etapa" />
      <div className="grid grid-cols-2 gap-2.5">
        {SLIDE_TYPE_ORDER.map((typeId) => {
          const type = SLIDE_TYPES[typeId]
          const Icon = ICONS[typeId]
          return (
            <button
              key={typeId}
              type="button"
              className="group relative flex flex-col items-start gap-2.5 border-[3px] border-[#09090B] bg-white p-3.5 shadow-[4px_4px_0px_0px_#09090B] transition-all duration-100 hover:shadow-[6px_6px_0px_0px_#09090B] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            >
              <span className={`flex h-10 w-10 items-center justify-center border-2 border-[#09090B] bg-[#09090B] text-white transition-transform group-hover:rotate-6`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-black tracking-tight text-slate-900">{type.label}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{type.tagline}</p>
              </div>
              <span className="absolute right-2 top-2 transition-opacity">
                <Plus className="h-3.5 w-3.5 text-[#09090B]" strokeWidth={3} />
              </span>
            </button>
          )
        })}
      </div>

      <SectionHeader icon={Layers} title="Camadas" subtitle="Ordem da etapa" />
      <div className="space-y-1.5">
        {['Pergunta principal', 'Componente interativo', 'Fundo'].map((label, i) => (
          <div
            key={label}
            className="flex items-center justify-between border-2 border-[#09090B] bg-white px-3 py-2.5 shadow-[2px_2px_0px_0px_#09090B]"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border-2 border-[#09090B] bg-slate-200 text-xs font-black text-[#09090B]">
                0{i + 1}
              </span>
              <span className="text-xs font-bold text-slate-700">{label}</span>
            </div>
            <span className="flex h-2 w-2 border border-[#09090B] bg-emerald-400" />
          </div>
        ))}
      </div>

      <SectionHeader icon={Layers} title="Templates rápidos" />
      <div className="border-[3px] border-[#09090B] bg-white p-4 shadow-[4px_4px_0px_0px_#09090B]">
        <p className="text-xs font-bold leading-relaxed text-slate-700">
          Precisa de estrutura? Aplique um template na etapa atual para preencher opções automaticamente.
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1.5 border-2 border-[#09090B] bg-[#09090B] px-3 py-2 text-xs font-black text-white shadow-[3px_3px_0px_0px_#09090B] hover:shadow-[2px_2px_0px_0px_#09090B] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        >
          <Layers className="h-3.5 w-3.5" /> Aplicar template
        </button>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3 w-3" />
        {title}
      </p>
      {subtitle && <p className="mt-0.5 text-[11px] font-bold text-slate-500">{subtitle}</p>}
    </div>
  )
}
