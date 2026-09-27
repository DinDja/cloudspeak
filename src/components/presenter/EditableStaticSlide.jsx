import { useEffect, useRef, useState } from 'react'
import StaticSlide from './StaticSlide'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function EditableStaticSlide({ slide, onChange, selectedLayerId, onSelectLayer, disabled = false }) {
  const drag = useRef(null)
  const slideRef = useRef(slide)
  const articleRef = useRef(null)
  const [editingTextId, setEditingTextId] = useState(null)
  useEffect(() => { slideRef.current = slide }, [slide])
  useEffect(() => {
    if (!editingTextId) return
    const node = articleRef.current?.querySelector(`[data-static-layer-id="${editingTextId}"]`)
    node?.focus()
  }, [editingTextId])

  const updateLayer = (id, patch) => {
    const current = slideRef.current
    const custom = current.customLayers?.some((layer) => layer.id === id)
    const next = custom
      ? { ...current, customLayers: current.customLayers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer) }
      : { ...current, layerOverrides: { ...current.layerOverrides, [id]: { ...current.layerOverrides?.[id], ...patch } } }
    slideRef.current = next
    onChange(next)
  }

  const handlePointerDown = (event) => {
    if (disabled || event.button !== 0) return
    const target = event.target.closest('[data-static-layer-id]')
    if (!target || !event.currentTarget.contains(target)) {
      onSelectLayer(null)
      return
    }
    const id = target.dataset.staticLayerId
    if (editingTextId === id) return
    const current = slideRef.current.customLayers?.find((layer) => layer.id === id)
      || slideRef.current.layerOverrides?.[id] || {}
    drag.current = {
      id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: Number(current.x) || 0, y: Number(current.y) || 0,
    }
    onSelectLayer(id)
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
  }

  const handlePointerMove = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return
    const width = event.currentTarget.getBoundingClientRect().width || 1
    const x = drag.current.x + ((event.clientX - drag.current.startX) / width) * 100
    const y = drag.current.y + ((event.clientY - drag.current.startY) / width) * 100
    const isCustom = slideRef.current.customLayers?.some((layer) => layer.id === drag.current.id)
    updateLayer(drag.current.id, {
      x: Math.round(clamp(x, isCustom ? -30 : -120, isCustom ? 100 : 120) * 10) / 10,
      y: Math.round(clamp(y, isCustom ? -30 : -120, isCustom ? 60 : 120) * 10) / 10,
    })
  }

  const handlePointerUp = (event) => {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleKeyDown = (event) => {
    if (editingTextId) {
      if (event.key === 'Escape') event.target.blur()
      return
    }
    if (disabled || !selectedLayerId) return
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const current = slideRef.current.customLayers?.find((layer) => layer.id === selectedLayerId)
      || slideRef.current.layerOverrides?.[selectedLayerId] || {}
    const step = event.shiftKey ? 5 : 1
    updateLayer(selectedLayerId, {
      x: (Number(current.x) || 0) + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
      y: (Number(current.y) || 0) + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0),
    })
  }

  const handleDoubleClick = (event) => {
    if (disabled) return
    const id = event.target.closest('[data-static-layer-id]')?.dataset.staticLayerId
    const editable = ['eyebrow', 'title', 'subtitle', 'body'].includes(id)
      || (id === 'footer' && slideRef.current.type === 'introduction')
      || slideRef.current.customLayers?.some((layer) => layer.id === id && layer.kind === 'text')
    if (!editable) return
    onSelectLayer(id)
    setEditingTextId(id)
  }

  const handleInlineTextBlur = (event) => {
    const id = event.currentTarget.dataset.staticLayerId
    if (editingTextId !== id) return
    const text = event.currentTarget.innerText.trim()
    const field = { title: 'question', eyebrow: 'eyebrow', subtitle: 'subtitle', body: 'body', footer: 'footer' }[id]
    if (field && slideRef.current[field] !== text) {
      const next = { ...slideRef.current, [field]: text }
      slideRef.current = next
      onChange(next)
    } else if (!field) updateLayer(id, { text })
    setEditingTextId(null)
  }

  return (
    <StaticSlide
      slide={slide}
      mode="stage"
      editing
      selectedLayerId={selectedLayerId}
      editingTextId={editingTextId}
      articleRef={articleRef}
      onLayerPointerDown={handlePointerDown}
      onLayerPointerMove={handlePointerMove}
      onLayerPointerUp={handlePointerUp}
      onLayerDoubleClick={handleDoubleClick}
      onInlineTextBlur={handleInlineTextBlur}
      onLayerKeyDown={handleKeyDown}
    />
  )
}
