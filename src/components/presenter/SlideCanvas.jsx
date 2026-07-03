import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Maximize2 } from 'lucide-react'
import Badge from '../ui/Badge'
import { SLIDE_TYPES } from '../../lib/constants'

export default function SlideCanvas({ slide, index, total }) {
  const type = slide ? SLIDE_TYPES[slide.type] : null

  return (
    <div className="relative overflow-hidden border-[3px] border-[#09090B] bg-white p-1.5 shadow-[6px_6px_0px_0px_#09090B]">
      <div className="absolute inset-x-6 top-4 z-10 flex items-center justify-between text-xs font-bold text-slate-600">
        <span className="flex items-center gap-1.5 border-2 border-[#09090B] bg-white px-2.5 py-1 shadow-[2px_2px_0px_0px_#09090B]">
          <Eye className="h-3 w-3" /> Live preview
        </span>
        <span className="border-2 border-[#09090B] bg-white px-2.5 py-1 shadow-[2px_2px_0px_0px_#09090B]">
          {Math.max(index + 1, 1)} / {total}
        </span>
        <span className="flex items-center gap-1.5 border-2 border-[#09090B] bg-white px-2.5 py-1 shadow-[2px_2px_0px_0px_#09090B]">
          <Maximize2 className="h-3 w-3" /> 16:9
        </span>
      </div>

      <AnimatePresence mode="wait">
        {slide ? (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-video w-full overflow-hidden bg-[#F4F4F0]"
          >
            <div className="absolute inset-0 cs-grid bg-[size:36px_36px] opacity-50 cs-mask-radial" />

            <div className="relative flex h-full flex-col p-10 pt-12">
              <Badge tone="brand" className="self-start">{type?.label ?? 'Etapa'}</Badge>
              <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-premium text-slate-900 cs-text-balance">
                {slide.question || 'Sua pergunta aparecerá aqui...'}
              </h2>

              <div className="mt-auto">
                <SlideMock slide={slide} />
              </div>

              <div className="mt-6 flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 bg-emerald-400 border border-[#09090B]" />
                  Ao vivo · público responde pelo celular
                </span>
                <span className="border-2 border-[#09090B] bg-[#09090B] px-2.5 py-1 font-black tracking-widest text-white">
                  SALA 7G2K9P
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex aspect-video items-center justify-center border-2 border-[#09090B] bg-[#F4F4F0] text-slate-500">
            <p className="text-sm font-black uppercase tracking-wider">Selecione ou crie uma etapa</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SlideMock({ slide }) {
  if (slide.type === 'multiple_choice') {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {(slide.options ?? []).filter(Boolean).slice(0, 4).map((opt, i) => (
          <div key={i} className="flex items-center justify-between border-2 border-[#09090B] bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-[2px_2px_0px_0px_#09090B]">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center border-2 border-[#09090B] bg-[#E2FF32] text-[11px] font-black text-[#09090B]">
                {String.fromCharCode(65 + i)}
              </span>
              {opt || `Opção ${i + 1}`}
            </span>
            <span className="text-xs font-black text-slate-500">–%</span>
          </div>
        ))}
      </div>
    )
  }
  if (slide.type === 'team_selection') {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(slide.teams ?? []).slice(0, 4).map((team, i) => (
          <div key={i} className="border-2 border-[#09090B] bg-white p-3 shadow-[2px_2px_0px_0px_#09090B]">
            <div className="flex items-center justify-between text-sm font-black text-[#09090B]">
              <span className="truncate">{team.name}</span>
              <span className="text-xs font-bold text-slate-500">0/{team.capacity}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden border border-[#09090B] bg-white">
              <div className="h-full w-1/4 bg-[#09090B]" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (slide.type === 'word_cloud') {
    return (
      <div className="relative h-32 overflow-hidden border-2 border-[#09090B] bg-white shadow-[2px_2px_0px_0px_#09090B]">
        {['incrível', 'time', 'energia', 'foco', 'fluxo', 'claro', 'ousado', 'leve'].map((word, i) => (
          <span
            key={word}
            className="absolute font-black tracking-tight"
            style={{
              top: `${10 + (i * 23) % 70}%`,
              left: `${5 + (i * 19) % 80}%`,
              fontSize: `${14 + (i % 4) * 6}px`,
              color: ['#2552F0', '#7C3AED', '#10B981', '#F59E0B'][i % 4],
              transform: `rotate(${i % 2 ? -4 : 4}deg)`,
            }}
          >
            {word}
          </span>
        ))}
      </div>
    )
  }
  if (slide.type === 'open_text') {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          'Como podemos engajar mais pessoas?',
          'Posso sugerir uma leitura antes?',
          'Adorei o formato curto!',
          'Qual o próximo evento?',
          'Pode compartilhar os slides?',
        ].map((text, i) => (
          <div key={i} className="border-2 border-[#09090B] bg-white p-3 shadow-[2px_2px_0px_0px_#09090B]">
            <p className="text-xs font-bold text-slate-700 line-clamp-3">{text}</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Resposta #{i + 1}</p>
          </div>
        ))}
      </div>
    )
  }
  return null
}
