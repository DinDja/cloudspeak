import SlideThumbnail from './SlideThumbnail'
import { isStaticSlideType, SUMMARY_TYPE } from '../../lib/constants'
import { getSlideStyleClass, getSlideThemeVars } from '../../lib/slideStyles'
import StaticSlide from './StaticSlide'
import SlideWatermark from './SlideWatermark'

export default function SlideCanvas({ slide, index, total, slides = [], mode = 'stage', eventKey = null, presentationTitle = '' }) {
  if (!slide)
    return (
      <div className="slide-print">
        <p className="p-8 text-sm">Adicione um slide para começar.</p>
      </div>
    )
  if (isStaticSlideType(slide.type)) return <StaticSlide slide={slide} mode={mode === 'audience' ? 'audience' : 'stage'} />
  if (mode === 'audience')
    return (
      <div className={`phone-preview relative ${getSlideStyleClass(slide)}`} style={getSlideThemeVars(slide)}>
        <SlideWatermark slide={slide} hidden />
        <p>Fala SEC / Prévia do público</p>
        <h2>{slide.question || 'Sua pergunta'}</h2>
        {slide.type === 'multiple_choice' &&
          (slide.options || []).map((option, i) => (
            <div className="phone-preview__option" key={i}>
              {option || `Alternativa ${i + 1}`}
            </div>
          ))}
        {slide.type === 'team_selection' &&
          (slide.teams || []).map((team) => (
            <div className="phone-preview__option" key={team.id}>
              {team.name}
              <p>{team.capacity} vagas disponíveis</p>
            </div>
            ))}
        {slide.type === SUMMARY_TYPE && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Clique em um tópico para navegar durante a apresentação.</p>
            {(slides.length ? slides : [{ question: 'Slide 1' }, { question: 'Slide 2' }, { question: 'Slide 3' }])
              .filter((entry) => entry.id !== slide.id)
              .slice(0, 5)
              .map((entry, i) => (
                <div className="phone-preview__option" key={entry.id || i}>
                  {entry.question || `Slide ${i + 1}`}
                </div>
              ))}
          </div>
        )}
        {(slide.type === 'word_cloud' || slide.type === 'open_text') && (
          <textarea
            aria-label="Campo de resposta demonstrativo"
            placeholder={slide.type === 'word_cloud' ? 'Escreva uma palavra' : 'Escreva sua resposta'}
            disabled
          />
        )}
      </div>
    )
  return (
    <SlideThumbnail
      slide={slide}
      index={index}
      total={total}
      slides={slides}
      eventKey={eventKey}
      presentationTitle={presentationTitle}
    />
  )
}
