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
            <div className="mb-3 flex justify-between px-2 text-xl font-black uppercase tracking-tight text-[#09090B]">
              <span>{entry.option}</span>
              <span className="text-slate-400">{entry.count > 0 ? `${percent}% (${entry.count})` : ''}</span>
            </div>
            <div className="relative h-16 w-full overflow-hidden border-[3px] border-[#09090B] bg-white shadow-[4px_4px_0px_0px_#09090B]">
              <div
                className="absolute bottom-0 left-0 top-0 transition-all duration-1000 ease-out border-r-[3px] border-[#09090B]"
                style={{
                  width: `${Math.max(percent, 1.5)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
