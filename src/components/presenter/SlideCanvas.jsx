import SlideThumbnail from './SlideThumbnail'

export default function SlideCanvas({ slide, index, total, mode = 'stage' }) {
  if (!slide)
    return (
      <div className="slide-print">
        <p className="p-8 text-sm">Adicione um slide para começar.</p>
      </div>
    )
  if (mode === 'audience')
    return (
      <div className="phone-preview">
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
        {(slide.type === 'word_cloud' || slide.type === 'open_text') && (
          <textarea
            aria-label="Campo de resposta demonstrativo"
            placeholder={slide.type === 'word_cloud' ? 'Escreva uma palavra' : 'Escreva sua resposta'}
            disabled
          />
        )}
      </div>
    )
  return <SlideThumbnail slide={slide} index={index} total={total} />
}
