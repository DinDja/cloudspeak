import { CLOSING_TYPE, COVER_TYPE, INTRODUCTION_TYPE, normalizeStaticSlideVariant } from '../../lib/constants'
import { ArrowUpRight, MessageCircle, Sparkles, Star } from 'lucide-react'

const CUSTOM_ICONS = { star: Star, arrow: ArrowUpRight, chat: MessageCircle, spark: Sparkles }

export default function StaticSlide({ slide, compact = false, mode = 'stage', editing = false, selectedLayerId = null, editingTextId = null, articleRef, onLayerPointerDown, onLayerPointerMove, onLayerPointerUp, onLayerDoubleClick, onInlineTextBlur, onLayerKeyDown }) {
  const type = slide?.type
  const isCover = type === COVER_TYPE
  const isClosing = type === CLOSING_TYPE
  const isIntroduction = type === INTRODUCTION_TYPE
  const variant = normalizeStaticSlideVariant(type, slide?.variant)
  const points = Array.isArray(slide?.points) ? slide.points : []
  const contentClass = isCover
    ? 'static-slide__cover-content'
    : isClosing
      ? 'static-slide__closing-content'
      : 'static-slide__intro-content'
  const layerProps = (id) => {
    const item = slide?.layerOverrides?.[id] || {}
    return {
      'data-static-layer-id': id,
      'data-static-selected': editing && selectedLayerId === id ? 'true' : undefined,
      style: {
        translate: `${Number(item.x) || 0}cqw ${Number(item.y) || 0}cqw`,
        rotate: `${Number(item.rotation) || 0}deg`,
        scale: Number(item.scale) || 1,
        opacity: item.opacity ?? undefined,
        color: item.color || undefined,
        '--static-art-color': item.color || undefined,
        display: item.hidden ? 'none' : undefined,
      },
    }
  }
  const inlineTextProps = (id) => ({
    contentEditable: editing && editingTextId === id,
    suppressContentEditableWarning: true,
    onBlur: onInlineTextBlur,
  })

  return (
    <article
      ref={articleRef}
      className={`static-slide static-slide--${isCover ? 'cover' : isClosing ? 'closing' : 'introduction'} static-slide--template-${variant} ${compact ? 'static-slide--compact' : ''} static-slide--${mode}`}
      data-static-editing={editing ? 'true' : undefined}
      onPointerDown={onLayerPointerDown}
      onPointerMove={onLayerPointerMove}
      onPointerUp={onLayerPointerUp}
      onPointerCancel={onLayerPointerUp}
      onDoubleClick={onLayerDoubleClick}
      onKeyDown={onLayerKeyDown}
      tabIndex={editing ? 0 : undefined}
      style={slide?.canvasBackground ? { background: slide.canvasBackground } : undefined}
    >
      {variant === 'notebook' && (
        <>
          <div className="static-slide__notebook-margin" aria-hidden="true" {...layerProps('notebook-margin')} />
          <div className="static-slide__spiral" aria-hidden="true" {...layerProps('spiral')}>
            {Array.from({ length: compact ? 7 : 11 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
        </>
      )}
      {variant === 'computer' && (
        <div className="static-slide__computer" aria-hidden="true" {...layerProps('computer')}>
          <div className="static-slide__computer-frame" {...layerProps('computer-frame')}>
            <div className="static-slide__computer-camera" />
            <div className="static-slide__computer-screen" />
            <div className="static-slide__computer-power" />
          </div>
          <div className="static-slide__computer-stand" {...layerProps('computer-stand')} />
          <div className="static-slide__computer-base" {...layerProps('computer-base')} />
        </div>
      )}
      {variant === 'spotlight' && <div className="static-slide__spotlight" aria-hidden="true" {...layerProps('spotlight')} />}
      {variant === 'blueprint' && (
        <svg className="static-slide__blueprint-drawing" viewBox="0 0 420 340" fill="none" aria-hidden="true" {...layerProps('blueprint')}>
          <circle cx="210" cy="170" r="132" />
          <circle cx="210" cy="170" r="83" />
          <path d="M36 170h348M210 15v310M98 65l224 210M322 65 98 275" />
          <path d="M111 124 222 73l111 51-111 51-111-51Zm0 0v94l111 51v-94m111-51v94l-111 51" />
          <path d="M75 42h51m-51 0v49m271 207h-52m52 0v-49" />
          <circle cx="210" cy="170" r="7" />
          <circle cx="210" cy="38" r="4" />
          <circle cx="342" cy="170" r="4" />
        </svg>
      )}
      {variant === 'zine' && (
        <div className="static-slide__zine-art" aria-hidden="true" {...layerProps('zine')}>
          <span /><span /><span />
        </div>
      )}
      {variant === 'folder' && <div className="static-slide__folder-clip" aria-hidden="true" {...layerProps('folder-clip')} />}
      {variant === 'credits' && <div className="static-slide__credits-mark" aria-hidden="true" {...layerProps('credits-mark')}>FIM.</div>}
      {variant === 'receipt' && <div className="static-slide__receipt-barcode" aria-hidden="true" {...layerProps('receipt-barcode')} />}
      {variant === 'editorial' && <div className="static-slide__editorial-block" aria-hidden="true" {...layerProps('editorial-block')} />}
      {variant === 'newspaper' && (
        <div className="static-slide__newspaper-top" aria-hidden="true" {...layerProps('newspaper-top')}>
          <span>EDIÇÃO Nº 01</span><span>NOTÍCIAS & IDEIAS</span><span>ABERTURA</span>
        </div>
      )}
      {variant === 'newspaper' && <div className="static-slide__newspaper-art" aria-hidden="true" {...layerProps('newspaper-art')} />}
      {variant === 'contact_sheet' && (
        <div className="static-slide__contact-sheet" aria-hidden="true" {...layerProps('contact-sheet')}>
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className={`static-slide__contact-frame static-slide__contact-frame--${index + 1}`} {...layerProps(`contact-frame-${index + 1}`)}>
              <i>{String(index + 1).padStart(2, '0')}</i>
            </span>
          ))}
        </div>
      )}
      {variant === 'metro' && (
        <svg className="static-slide__metro-map" viewBox="0 0 500 350" fill="none" aria-hidden="true" {...layerProps('metro-map')}>
          <g className="static-slide__metro-route--red" {...layerProps('metro-red')}>
            <path d="M20 292H155L216 231H345L445 131V28" strokeWidth="12" strokeLinejoin="round" />
            <circle cx="216" cy="231" r="11" fill="#fff" strokeWidth="7" />
            <circle cx="345" cy="231" r="12" fill="#fff" strokeWidth="7" />
            <circle cx="445" cy="131" r="11" fill="#fff" strokeWidth="7" />
          </g>
          <g className="static-slide__metro-route--blue" {...layerProps('metro-blue')}>
            <path d="M20 90H149L247 188V300H460" strokeWidth="12" strokeLinejoin="round" />
            <circle cx="149" cy="90" r="11" fill="#fff" strokeWidth="7" />
            <circle cx="247" cy="188" r="12" fill="#fff" strokeWidth="7" />
          </g>
          <g className="static-slide__metro-route--yellow" {...layerProps('metro-yellow')}>
            <path d="M76 331L190 217H350L470 97" strokeWidth="10" strokeLinejoin="round" />
          </g>
        </svg>
      )}
      {variant === 'postcard' && (
        <div className="static-slide__postcard-stamp" aria-hidden="true" {...layerProps('postcard-stamp')}><span>CS</span><small>01</small></div>
      )}

      <div className={contentClass} {...layerProps('content')}>
        <p className="static-slide__eyebrow" {...layerProps('eyebrow')} {...inlineTextProps('eyebrow')}>
          {slide.eyebrow || (isCover ? 'Caderno de diálogo' : isClosing ? 'A conversa continua' : 'Introdução')}
        </p>
        <h1 {...layerProps('title')} {...inlineTextProps('title')}>{slide.question}</h1>
        {slide.subtitle && <p className="static-slide__subtitle" {...layerProps('subtitle')} {...inlineTextProps('subtitle')}>{slide.subtitle}</p>}
        {slide.body && <p className="static-slide__body" {...layerProps('body')} {...inlineTextProps('body')}>{slide.body}</p>}
        {points.length > 0 && (
          <ul className="static-slide__points" {...layerProps('points')}>
            {points.map((point, index) => (
              <li key={`${point}-${index}`}>{point}</li>
            ))}
          </ul>
        )}
        {isIntroduction && slide.footer && <p className="static-slide__footer" {...layerProps('footer')} {...inlineTextProps('footer')}>{slide.footer}</p>}
      </div>

      {(slide?.customLayers || []).map((layer) => {
        const Icon = CUSTOM_ICONS[layer.icon] || Star
        return (
          <div
            key={layer.id}
            className={`static-slide__custom-layer static-slide__custom-layer--${layer.kind} static-slide__custom-layer--${layer.shape || 'plain'}`}
            data-static-layer-id={layer.id}
            data-static-selected={editing && selectedLayerId === layer.id ? 'true' : undefined}
            contentEditable={editing && editingTextId === layer.id && layer.kind === 'text'}
            suppressContentEditableWarning
            onBlur={onInlineTextBlur}
            style={{
              left: `${layer.x}cqw`, top: `${layer.y}cqw`, width: `${layer.width}cqw`, height: `${layer.height}cqw`,
              rotate: `${layer.rotation || 0}deg`, scale: layer.scale ?? 1, opacity: layer.opacity ?? 1,
              color: layer.color, background: layer.kind === 'shape' ? layer.color : undefined,
              display: layer.hidden ? 'none' : undefined,
            }}
          >
            {layer.kind === 'text' ? layer.text : layer.kind === 'icon' ? <Icon size="100%" strokeWidth={1.8} /> : null}
          </div>
        )
      })}

      {isCover && (
        <div className="static-slide__cover-footer" {...layerProps('footer')}>
          <span>{slide.footer || 'Escuta · reflexão · próximos passos'}</span>
          <span className="static-slide__page-mark">01</span>
        </div>
      )}
      {isClosing && (
        <div className="static-slide__closing-footer" {...layerProps('footer')}>
          <span>{slide.footer || 'Obrigado por participar'}</span>
          <span aria-hidden="true">✳</span>
        </div>
      )}
    </article>
  )
}
