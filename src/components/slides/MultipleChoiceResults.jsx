import { useMemo } from 'react'

export default function MultipleChoiceResults({ slide, responses, responseCount, cardStyle = false }) {
  const stats = useMemo(() => {
    if (!slide || slide.type !== 'multiple_choice') return []
    const counts = new Map(slide.options.map((option) => [option, 0]))
    responses.forEach((entry) => {
      if (counts.has(entry.value)) counts.set(entry.value, counts.get(entry.value) + 1)
    })
    return slide.options.map((option) => ({ option, count: counts.get(option) || 0 }))
  }, [slide, responses])

  return (
    <div className={`result-chart${cardStyle ? ' result-chart--cards' : ''}`}>
      {stats.map((entry, index) => {
        const percent = responseCount ? Math.round((entry.count / responseCount) * 100) : 0
        return (
          <div key={entry.option} className="result-chart__row">
            <div className="result-chart__label">
              <span>
                <small>{String(index + 1).padStart(2, '0')}</small>
                {entry.option}
              </span>
              <span>
                {percent}% <small>· {entry.count}</small>
              </span>
            </div>
            <div
              className="result-chart__track"
              role="meter"
              aria-label={entry.option}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
