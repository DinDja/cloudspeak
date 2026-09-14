import { SLIDE_TYPES } from '../../lib/constants'
import { getSlideStyleClass, getSlideThemeVars } from '../../lib/slideStyles'
import EducationWatermark from './EducationWatermark'

export default function SlideThumbnail({
  slide,
  className = '',
  compact = false,
  index = 0,
  total = 1,
  eventKey = null,
  presentationTitle = '',
}) {
  return (
    <div
      className={`slide-print relative ${getSlideStyleClass(slide)} ${compact ? 'slide-print--compact' : ''} ${className}`}
      style={getSlideThemeVars(slide)}
    >
      <EducationWatermark eventKey={eventKey} presentationTitle={presentationTitle} />
      <div className="slide-print__inner relative z-10">
        <div className="slide-print__top">
          <span>Fala SEC</span>
          <span>{SLIDE_TYPES[slide?.type]?.label || 'Apresentação'}</span>
        </div>
        <p className="slide-print__question">{slide?.question || 'Escreva sua pergunta'}</p>
        <div className="slide-print__body">
          {slide?.type === 'multiple_choice' &&
            (slide.options || [])
              .filter(Boolean)
              .slice(0, 4)
              .map((option, i) => (
                <div key={i} className="slide-print__option">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <span>{option}</span>
                </div>
              ))}
          {slide?.type === 'team_selection' &&
            (slide.teams || []).slice(0, 4).map((team, i) => (
              <div key={team.id || i} className="slide-print__option">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span>
                  {team.name} · {team.capacity} vagas
                </span>
              </div>
            ))}
          {slide?.type === 'word_cloud' && (
            <p className="slide-print__empty">As palavras do público aparecem aqui.</p>
          )}
          {slide?.type === 'open_text' && (
            <p className="slide-print__empty">As perguntas do público aparecem aqui.</p>
          )}
        </div>
        <div className="slide-print__footer">
          <span>Prévia · aguardando respostas</span>
          <span>
            {index + 1} / {total}
          </span>
        </div>
      </div>
    </div>
  )
}
