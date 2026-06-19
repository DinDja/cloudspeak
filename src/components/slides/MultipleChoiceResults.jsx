import { useMemo } from 'react'
import { CHART_PALETTE } from '../../lib/constants'

export default function MultipleChoiceResults({ slide, responses, responseCount }) {
  const stats = useMemo(() => {
    if (!slide || slide.type !== 'multiple_choice') return []
    const counts = new Map(slide.options.map((option) => [option, 0]))
    responses.forEach((entry) => {
      if (entry.value && counts.has(entry.value)) counts.set(entry.value, counts.get(entry.value) + 1)
    })
    return slide.options.map((option) => ({ option, count: counts.get(option) ?? 0 }))
  }, [slide, responses])

  return (
    <div className="flex w-full flex-col gap-6">
      {stats.map((entry, index) => {
        const percent = responseCount ? Math.round((entry.count / responseCount) * 100) : 0
        const color = CHART_PALETTE[index % CHART_PALETTE.length]
        return (
          <div key={entry.option} className="relative w-full">
            <div className="mb-3 flex justify-between px-2 text-xl font-bold text-slate-700">
              <span>{entry.option}</span>
              <span className="text-slate-400">{entry.count > 0 ? `${percent}% (${entry.count})` : ''}</span>
            </div>
            <div className="relative h-16 w-full overflow-hidden rounded-2xl bg-white/50 shadow-inner ring-1 ring-slate-200/50 backdrop-blur-sm">
              <div
                className="absolute bottom-0 left-0 top-0 rounded-2xl transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.max(percent, 1.5)}%`,
                  backgroundColor: color,
                  backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.05) 100%)',
                  boxShadow: `0 4px 14px 0 ${color}40`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
