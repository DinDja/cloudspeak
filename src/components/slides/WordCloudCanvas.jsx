import { useEffect, useRef, useState } from 'react'
import cloud from 'd3-cloud'
import { WandSparkles } from 'lucide-react'

export default function WordCloudCanvas({ words }) {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 960, height: 440 })
  const [layoutWords, setLayoutWords] = useState([])
  const [prevWords, setPrevWords] = useState(words)

  if (words !== prevWords) {
    setPrevWords(words)
    if (words.length === 0) setLayoutWords([])
  }

  useEffect(() => {
    if (!containerRef.current) return undefined

    const updateDimensions = () => {
      const nextWidth = Math.max(containerRef.current?.clientWidth ?? 0, 320)
      const nextHeight = nextWidth < 640 ? 340 : 420
      setDimensions({ width: nextWidth, height: nextHeight })
    }

    updateDimensions()
    const observer = new ResizeObserver(updateDimensions)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (words.length === 0) return undefined

    let cancelled = false
    const layout = cloud()
      .size([dimensions.width, dimensions.height])
      .words(words.map((item) => ({ ...item })))
      .padding(4)
      .rotate((item) => item.rotate)
      .font('sans-serif')
      .fontWeight(800)
      .fontSize((item) => item.fontSize)
      .spiral('archimedean')
      .on('end', (computedWords) => {
        if (!cancelled) setLayoutWords(computedWords)
      })

    layout.start()
    return () => {
      cancelled = true
      layout.stop()
    }
  }, [dimensions.height, dimensions.width, words])

  return (
    <div
      ref={containerRef}
      className="relative min-h-[340px] w-full overflow-hidden border-[3px] border-[#09090B] bg-[#F4F4F0] p-4 shadow-[6px_6px_0px_0px_#09090B] md:min-h-[420px]"
    >
      {layoutWords.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <WandSparkles className="mb-4 h-12 w-12 opacity-70" />
          <p className="text-2xl font-black uppercase tracking-tight">A nuvem está vazia.</p>
          <p className="text-lg font-bold">Envie a primeira palavra!</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="h-full w-full">
          <g transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2})`}>
            {layoutWords.map((item) => (
              <text
                key={`${item.text}-${item.x}-${item.y}`}
                x={item.x}
                y={item.y}
                textAnchor="middle"
                transform={`rotate(${item.rotate}, ${item.x}, ${item.y})`}
                fill={item.color}
                fillOpacity={item.opacity}
                fontSize={item.size}
                fontWeight={800}
                style={{ cursor: 'default' }}
              >
                {item.text}
              </text>
            ))}
          </g>
        </svg>
      )}
    </div>
  )
}
