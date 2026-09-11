import { ArrowUpRight } from 'lucide-react'

const COVER_TITLES = {
  'educacao-integral-integrada-bahia': (
    <>
      Educação para
      <br />
      desenvolver.
    </>
  ),
  blank: (
    <>
      Sua próxima
      <br />
      pergunta.
    </>
  ),
  pitch: (
    <>
      Uma ideia.
      <br />
      Outros olhares.
    </>
  ),
  kickoff: (
    <>
      Antes de
      <br />
      começar.
    </>
  ),
  lecture: (
    <>
      Aprender
      <br />
      em conjunto.
    </>
  ),
  workshop: (
    <>
      Mãos à obra.
      <br />
      Ideias à mesa.
    </>
  ),
  retro: (
    <>
      O que ficou
      <br />
      deste ciclo?
    </>
  ),
  townhall: (
    <>
      A conversa
      <br />é de todos.
    </>
  ),
  demo: (
    <>
      Projetos
      <br />
      em pauta.
    </>
  ),
}

export default function TemplateCover({ template, index = 0, selected, onClick }) {
  return (
    <button
      type="button"
      className={`template-cover template-cover--${index % 3}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="template-cover__art" aria-hidden="true">
        <span>
          {String(index + 1).padStart(2, '0')} / {template.badge.toUpperCase()}
        </span>
        <strong>{COVER_TITLES[template.id] || template.name}</strong>
        <svg viewBox="0 0 280 42" fill="none" preserveAspectRatio="xMinYMid meet">
          {index % 3 === 0 ? (
            <path
              d="M1 34V24H36V34M46 34V12H81V34M91 34V3H126V34M136 34V18H171V34M181 34V8H216V34M1 38H265"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          ) : index % 3 === 1 ? (
            <path
              d="M1 12H76V25H62L51 35V25H1V12ZM93 3H168V20H128L115 31V20H93V3ZM185 15H260V29H239L226 40V29H185V15Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          ) : (
            <path
              d="M0 22C30-3 50-3 75 22S120 47 147 22S197-3 221 22S256 39 279 18M0 30C30 5 50 5 75 30S120 55 147 30S197 5 221 30S256 47 279 26"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          )}
        </svg>
      </div>
      <span className="template-cover__name">
        {template.name}
        <ArrowUpRight size={16} />
      </span>
      <p className="template-cover__summary">{template.summary}</p>
    </button>
  )
}
