import { useState } from 'react'
import { Settings2, Palette, Wand2, Eye, Type, Hash, Layers, Lock, Image as ImageIcon } from 'lucide-react'
import Badge from '../ui/Badge'
import { SLIDE_TYPES } from '../../lib/constants'

const TABS = [
  { id: 'content', label: 'Conteúdo', icon: Type },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'behavior', label: 'Comportamento', icon: Wand2 },
]

const COLOR_PRESETS = [
  { name: 'Azul', color: 'bg-blue-600' },
  { name: 'Violeta', color: 'bg-violet-600' },
  { name: 'Verde', color: 'bg-emerald-600' },
  { name: 'Âmbar', color: 'bg-amber-500' },
  { name: 'Vermelho', color: 'bg-red-600' },
  { name: 'Grafite', color: 'bg-slate-800' },
]

const ANIMATIONS = [
  { id: 'fade', label: 'Fade', description: 'Entrada suave' },
  { id: 'slide-up', label: 'Deslizar', description: 'Entrada vertical' },
  { id: 'scale', label: 'Escala', description: 'Aproximação sutil' },
  { id: 'flip', label: 'Virar', description: 'Entrada 3D' },
]

export default function PropertiesPanel({ slide }) {
  const [tab, setTab] = useState('content')
  const [preset, setPreset] = useState('Azul')
  const [animation, setAnimation] = useState('scale')
  const [reveal, setReveal] = useState('auto')
  const type = slide ? SLIDE_TYPES[slide.type] : null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={['flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors', active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'].join(' ')}><Icon className="h-3.5 w-3.5" />{item.label}</button>
        })}
      </div>

      {!slide ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"><Settings2 className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm text-slate-500">Selecione uma etapa para editar.</p></div>
      ) : tab === 'content' ? <ContentTab slide={slide} type={type} /> : tab === 'design' ? <DesignTab preset={preset} setPreset={setPreset} /> : <BehaviorTab animation={animation} setAnimation={setAnimation} reveal={reveal} setReveal={setReveal} />}

      <Section label="Status da sala">
        <div className="grid grid-cols-2 gap-2"><Stat color="blue" label="Pública" value="Ativa" icon={Eye} /><Stat color="green" label="Respostas" value="Abertas" icon={Lock} /></div>
      </Section>
    </div>
  )
}

function ContentTab({ slide, type }) {
  return (
    <>
      <Section label="Resumo da etapa">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Hash className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{slide.question || 'Sem pergunta'}</p><p className="mt-0.5 text-xs text-slate-500">{type?.label ?? 'Etapa'}</p></div></div></div>
      </Section>
      <Section label="Pré-visualização">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm"><div className="aspect-video rounded-lg border border-slate-200 bg-white p-3"><div className="flex h-full flex-col"><Badge tone="brand">{type?.label ?? 'Etapa'}</Badge><p className="mt-2 line-clamp-3 text-sm font-semibold leading-tight text-slate-800">{slide.question || 'Sua pergunta aparecerá aqui…'}</p><div className="mt-auto space-y-1.5">{(slide.options ?? []).filter(Boolean).slice(0, 3).map((option, index) => <div key={index} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600">{option || `Opção ${index + 1}`}</div>)}{slide.type === 'team_selection' && <div className="flex flex-wrap gap-1.5">{(slide.teams ?? []).slice(0, 3).map((team, index) => <span key={index} className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600">{team.name} · {team.capacity}</span>)}</div>}{slide.type === 'word_cloud' && <p className="text-xs text-slate-500">As palavras formam uma nuvem dinâmica.</p>}{slide.type === 'open_text' && <p className="text-xs text-slate-500">As respostas aparecem no mural ao vivo.</p>}</div></div></div></div>
      </Section>
    </>
  )
}

function DesignTab({ preset, setPreset }) {
  return (
    <>
      <Section label="Cor de destaque"><div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">{COLOR_PRESETS.map((item) => <button key={item.name} type="button" onClick={() => setPreset(item.name)} className={['flex flex-col items-center gap-2 rounded-lg p-2 transition-colors', preset === item.name ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-slate-50'].join(' ')}><span className={['h-7 w-7 rounded-full', item.color].join(' ')} /><span className="text-[11px] font-medium text-slate-600">{item.name}</span></button>)}</div></Section>
      <Section label="Fundo"><div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">{['Claro', 'Noite', 'Areia', 'Azul'].map((background) => <button key={background} type="button" className="overflow-hidden rounded-lg border border-slate-200 hover:border-blue-300"><div className={['h-12', background === 'Claro' ? 'bg-white' : background === 'Noite' ? 'bg-slate-800' : background === 'Areia' ? 'bg-amber-100' : 'bg-blue-100'].join(' ')} /><p className="bg-white py-1.5 text-xs text-slate-600">{background}</p></button>)}</div></Section>
      <Section label="Imagem de fundo"><div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><ImageIcon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-700">Imagem personalizada</p><p className="text-xs text-slate-500">PNG, JPG ou WEBP · até 2 MB</p></div><button type="button" className="rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">Selecionar</button></div></Section>
    </>
  )
}

function BehaviorTab({ animation, setAnimation, reveal, setReveal }) {
  const revealModes = [{ id: 'auto', label: 'Ao vivo', description: 'Resultados em tempo real' }, { id: 'manual', label: 'Sob controle', description: 'Você decide quando revelar' }, { id: 'staged', label: 'Por entrada', description: 'Revela após acumular respostas' }]
  return <><Section label="Animação de entrada"><div className="grid grid-cols-2 gap-2">{ANIMATIONS.map((item) => <button key={item.id} type="button" onClick={() => setAnimation(item.id)} className={['rounded-lg border p-3 text-left transition-colors', animation === item.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'].join(' ')}><p className="text-sm font-medium text-slate-800">{item.label}</p><p className="mt-0.5 text-xs text-slate-500">{item.description}</p></button>)}</div></Section><Section label="Revelar resultados"><div className="space-y-2">{revealModes.map((item) => <button key={item.id} type="button" onClick={() => setReveal(item.id)} className={['flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors', reveal === item.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'].join(' ')}><span className={['mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border', reveal === item.id ? 'border-blue-600' : 'border-slate-300'].join(' ')}><span className={['h-2 w-2 rounded-full', reveal === item.id ? 'bg-blue-600' : 'bg-transparent'].join(' ')} /></span><div><p className="text-sm font-medium text-slate-800">{item.label}</p><p className="text-xs text-slate-500">{item.description}</p></div></button>)}</div></Section></>
}

function Section({ label, children }) { return <div className="space-y-2"><p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Layers className="h-3.5 w-3.5 text-slate-400" />{label}</p>{children}</div> }

function Stat({ icon, label, value, color }) {
  const Icon = icon
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700' }
  return <div className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm"><span className={['mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-lg', colors[color]].join(' ')}><Icon className="h-3.5 w-3.5" /></span><p className="text-sm font-semibold text-slate-800">{value}</p><p className="mt-0.5 text-[11px] text-slate-500">{label}</p></div>
}
