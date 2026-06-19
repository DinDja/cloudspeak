import { useMemo } from 'react'
import WordCloudCanvas from './WordCloudCanvas'
import { CHART_PALETTE } from '../../lib/constants'
import { normalizeText } from '../../lib/validators'

export default function WordCloudResults({ responses }) {
  const words = useMemo(() => {
    const counts = {}
    responses.forEach((entry) => {
      const key = normalizeText(entry.value || '').toLowerCase()
      if (key) counts[key] = (counts[key] ?? 0) + 1
    })

    const topWords = Object.entries(counts)
      .map(([word, count]) => ({ text: word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40)

    if (topWords.length === 0) return []

    const maxCount = topWords[0].count
    return topWords.map((item, index) => {
      const ratio = item.count / maxCount
      const size = Math.round(18 + ratio * 26 + Math.min(item.count, 4))
      return {
        ...item,
        fontSize: Math.min(size, 52),
        rotate: index % 7 === 0 ? 90 : 0,
        color: CHART_PALETTE[index % CHART_PALETTE.length],
        opacity: 0.76 + ratio * 0.24,
        size,
      }
    })
  }, [responses])

  return <WordCloudCanvas words={words} />
}
