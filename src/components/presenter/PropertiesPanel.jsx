import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings2,
  Palette,
  Wand2,
  Eye,
  Type,
  Hash,
  Layers,
  Lock,
  Image as ImageIcon,
} from 'lucide-react'
import { SLIDE_TYPES } from '../../lib/constants'

const TABS = [
  { id: 'content', label: 'Conteúdo', icon: Type },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'behavior', label: 'Comportamento', icon: Wand2 },
]

const COLOR_PRESETS = [
  { name: 'Brand', gradient: 'from-brand-500 to-brand-700' },
  { name: 'Violet', gradient: 'from-violet-500 to-violet-700' },
  { name: 'Ocean', gradient: 'from-ocean-500 to-ocean-700' },
  { name: 'Sunset', gradient: 'from-sunset-500 to-sunset-700' },
  { name: 'Coral', gradient: 'from-coral-500 to-coral-700' },
  { name: 'Slate', gradient: 'from-slate-700 to-slate-900' },
]

const ANIMATIONS = [
  { id: 'fade', label: 'Fade' },
  { id: 'slide-up', label: 'Slide up' },
  { id: 'scale', label: 'Scale in' },
  { id: 'flip', label: 'Flip 3D' },
]

export default function PropertiesPanel({ slide }) {
  const [tab, setTab] = useState('content')
  const [preset, setPreset] = useState('Brand')
  const [animation, setAnimation] = useState('scale')
  const [reveal, setReveal] = useState('auto')

  const type = slide ? SLIDE_TYPES[slide.type] : null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 border-[3px] border-[#09090B] bg-white p-1 shadow-[4px_4px_0px_0px_#09090B]">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-black transition-all duration-100',
                active
                  ? 'bg-[#09090B] text-white border-2 border-[#09090B]'
                  : 'text-slate-600 border-2 border-transparent hover:border-[#09090B] hover:bg-[#F4F4F0]',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {!slide ? (
        <div className="border-[3px] border-[#09090B] bg-white p-6 text-center shadow-[4px_4px_0px_0px_#09090B]">
          <Settings2 className="mx-auto h-7 w-7 text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-500">Selecione uma etapa para editar.</p>
        </div>
      ) : tab === 'content' ? (
        <ContentTab slide={slide} type={type} />
      ) : tab === 'design' ? (
        <DesignTab preset={preset} setPreset={setPreset} />
      ) : (
        <BehaviorTab animation={animation} setAnimation={setAnimation} reveal={reveal} setReveal={setReveal} />
      )}

      <Section label="Status da sala">
        <div className="grid grid-cols-2 gap-2.5 text-center">
          <Stat color="brand" label="Pública" value="Ativa" icon={Eye} />
          <Stat color="ocean" label="Bloqueio" value="Aberto" icon={Lock} />
        </div>
      </Section>
    </div>
  )
}

function ContentTab({ slide, type }) {
  return (
    <>
      <Section label="Resumo da etapa">
        <div className="border-[3px] border-[#09090B] bg-white p-4 shadow-[4px_4px_0px_0px_#09090B]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-[#09090B] bg-[#09090B] text-white shadow-[2px_2px_0px_0px_#09090B]">
              <Hash className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#09090B]">{slide.question || 'Sem pergunta'}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{type?.label ?? 'Etapa'}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section label="Pré-visualização ao vivo">
        <div className="overflow-hidden border-[3px] border-[#09090B] bg-[#F4F4F0] p-4 shadow-[4px_4px_0px_0px_#09090B]">
          <div className="aspect-video border-2 border-[#09090B] bg-white shadow-[2px_2px_0px_0px_#09090B]">
            <div className="flex h-full flex-col bg-[#F4F4F0] p-4">
              <Badge tone="brand" className="self-start">{type?.label ?? 'Etapa'}</Badge>
              <p className="mt-2 line-clamp-3 text-sm font-black leading-tight text-[#09090B]">
                {slide.question || 'Sua pergunta aparecerá aqui...'}
              </p>
              <div className="mt-auto space-y-1.5">
                {(slide.options ?? []).filter(Boolean).slice(0, 3).map((opt, i) => (
                  <div key={i} className="border border-[#09090B] bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-[1px_1px_0px_0px_#09090B]">
                    {opt || `Opção ${i + 1}`}
                  </div>
                ))}
                {slide.type === 'team_selection' && (
                  <div className="flex flex-wrap gap-1.5">
                    {(slide.teams ?? []).slice(0, 3).map((team, i) => (
                      <span key={i} className="border border-[#09090B] bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-[1px_1px_0px_0px_#09090B]">
                        {team.name} · {team.capacity}
                      </span>
                    ))}
                  </div>
                )}
                {slide.type === 'word_cloud' && (
                  <p className="text-xs font-bold text-slate-500">As palavras enviadas formam uma nuvem dinâmica.</p>
                )}
                {slide.type === 'open_text' && (
                  <p className="text-xs font-bold text-slate-500">As respostas aparecem em cards no mural ao vivo.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}

function DesignTab({ preset, setPreset }) {
  return (
    <>
      <Section label="Cor de destaque">
        <div className="grid grid-cols-3 gap-2 border-[3px] border-[#09090B] bg-white p-3 shadow-[4px_4px_0px_0px_#09090B]">
          {COLOR_PRESETS.map((p) => {
            const active = preset === p.name
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setPreset(p.name)}
                className={[
                  'flex flex-col items-center gap-2 border-2 p-2.5 transition-all duration-100',
                  active
                    ? 'border-[#09090B] bg-[#E2FF32] shadow-[2px_2px_0px_0px_#09090B]'
                    : 'border-[#09090B] bg-white hover:bg-[#F4F4F0] hover:shadow-[2px_2px_0px_0px_#09090B]',
                ].join(' ')}
              >
                <span className={`h-8 w-8 border-2 border-[#09090B] bg-[#09090B]`} />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#09090B]">{p.name}</span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section label="Fundo">
        <div className="grid grid-cols-2 gap-2 border-[3px] border-[#09090B] bg-white p-3 shadow-[4px_4px_0px_0px_#09090B]">
          {['Slate', 'Noite', 'Sunset', 'Brand'].map((bg) => (
            <button
              key={bg}
              type="button"
              className="group relative overflow-hidden border-2 border-[#09090B] transition-all duration-100 hover:shadow-[2px_2px_0px_0px_#09090B]"
            >
              <div className={`h-16 ${bg === 'Slate' ? 'bg-slate-100' : bg === 'Noite' ? 'bg-slate-800' : bg === 'Sunset' ? 'bg-orange-500' : 'bg-blue-500'}`} />
              <p className="bg-white py-1.5 text-[11px] font-black uppercase tracking-wider text-[#09090B]">
                {bg}
              </p>
            </button>
          ))}
        </div>
      </Section>

      <Section label="Imagem de fundo">
        <div className="flex items-center gap-3 border-[3px] border-[#09090B] bg-white p-3 shadow-[4px_4px_0px_0px_#09090B]">
          <span className="flex h-10 w-10 items-center justify-center border-2 border-[#09090B] bg-[#F4F4F0] text-slate-500">
            <ImageIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#09090B]">Carregar imagem personalizada</p>
            <p className="text-xs font-bold text-slate-500">PNG, JPG ou WEBP · até 2 MB</p>
          </div>
          <button type="button" className="border-2 border-[#09090B] bg-white px-3 py-1.5 text-xs font-black text-[#09090B] hover:bg-[#E2FF32] hover:shadow-[2px_2px_0px_0px_#09090B]">
            Selecionar
          </button>
        </div>
      </Section>
    </>
  )
}

function BehaviorTab({ animation, setAnimation, reveal, setReveal }) {
  const revealModes = [
    { id: 'auto', label: 'Ao vivo', desc: 'Resultados aparecem em tempo real' },
    { id: 'manual', label: 'Sob controle', desc: 'Você decide quando revelar' },
    { id: 'staged', label: 'Por entrada', desc: 'Acumula até N entradas, então revela' },
  ]
  return (
    <>
      <Section label="Animação de entrada">
        <div className="grid grid-cols-2 gap-2 border-[3px] border-[#09090B] bg-white p-3 shadow-[4px_4px_0px_0px_#09090B]">
          {ANIMATIONS.map((a) => {
            const active = animation === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAnimation(a.id)}
                className={[
                  'border-2 px-3 py-2.5 text-left transition-all duration-100',
                  active
                    ? 'border-[#09090B] bg-[#E2FF32] shadow-[2px_2px_0px_0px_#09090B]'
                    : 'border-[#09090B] bg-white hover:bg-[#F4F4F0] hover:shadow-[2px_2px_0px_0px_#09090B]',
                ].join(' ')}
              >
                <p className="text-sm font-black text-[#09090B]">{a.label}</p>
                <p className="text-[11px] font-bold text-slate-500">Curva {a.id === 'fade' ? 'linear' : 'spring'}</p>
              </button>
            )
          })}
        </div>
      </Section>

      <Section label="Revelar resultados">
        <div className="space-y-2">
          {revealModes.map((m) => {
            const active = reveal === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setReveal(m.id)}
                className={[
                  'flex w-full items-start gap-3 p-3 text-left transition-all duration-100 border-2',
                  active
                    ? 'border-[#09090B] bg-[#E2FF32] shadow-[2px_2px_0px_0px_#09090B]'
                    : 'border-[#09090B] bg-white hover:bg-[#F4F4F0] hover:shadow-[2px_2px_0px_0px_#09090B]',
                ].join(' ')}
              >
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center border-2 border-[#09090B]">
                  <span className={['h-2.5 w-2.5 transition-all', active ? 'bg-[#09090B]' : 'bg-transparent'].join(' ')} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">{m.label}</p>
                  <p className="text-xs font-medium text-slate-500">{m.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Section>
    </>
  )
}

function Section({ label, children }) {
  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        <Layers className="h-3 w-3" />
        {label}
      </p>
      {children}
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }) {
  const bgColors = {
    brand: 'bg-[#09090B]',
    ocean: 'bg-[#0055FF]',
    violet: 'bg-[#7C3AED]',
  }
  return (
    <div className="border-[3px] border-[#09090B] bg-white p-3 shadow-[4px_4px_0px_0px_#09090B]">
      <span className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center border-2 border-[#09090B] ${bgColors[color]} text-white`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-black text-[#09090B]">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  )
}

function Badge({ tone, children, className }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border-2 border-[#09090B] bg-[#E2FF32] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#09090B] shadow-[2px_2px_0px_0px_#09090B] ${className}`}>
      {children}
    </span>
  )
}
