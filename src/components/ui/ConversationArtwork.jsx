import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

const WORDS = ['curiosidade', 'gente', 'perguntas', 'Bahia', 'pesquisa', 'troca', 'futuro']

export default function ConversationArtwork({ interactive = false }) {
  const [word, setWord] = useState('')
  const [answer, setAnswer] = useState('')
  const submit = (event) => {
    event.preventDefault()
    if (!word.trim()) return
    setAnswer(word.trim())
    setWord('')
  }

  return (
    <section
      className="conversation-print"
      aria-label={
        interactive ? 'Demonstração de nuvem de palavras' : 'Arte tipográfica sobre ciência e participação'
      }
    >
      <div className="conversation-print__heading">
        <span>EM UMA PALAVRA</span>
        <span>{interactive ? 'EXPERIMENTE ↓' : 'FALA / SEC'}</span>
      </div>
      <p className="conversation-print__question">
        O que move
        <br />a ciência?
      </p>
      <div className="conversation-print__words" aria-hidden="true">
        {WORDS.map((item, index) => (
          <span key={item} className={`print-word print-word--${index}`}>
            {index === 3 && answer ? answer : item}
          </span>
        ))}
        <svg className="print-line" viewBox="0 0 400 250" fill="none">
          <path
            d="M360 3C397 18 400 57 362 79C326 100 194 77 137 125C94 161 108 201 67 222L15 239M15 239L21 215M15 239L43 241"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
      {interactive ? (
        <form className="print-answer" onSubmit={submit}>
          <label className="sr-only" htmlFor="demo-word">
            Sua palavra para a demonstração
          </label>
          <input
            id="demo-word"
            value={word}
            onChange={(event) => setWord(event.target.value)}
            maxLength={18}
            placeholder="E para você? Escreva uma palavra."
            autoComplete="off"
          />
          <button type="submit" disabled={!word.trim()} aria-label="Adicionar palavra à demonstração">
            <ArrowUpRight size={22} />
          </button>
          <span className="sr-only" role="status">
            {answer ? `“${answer}” adicionada à demonstração local.` : ''}
          </span>
        </form>
      ) : (
        <p className="print-caption">ENQUETES · NUVENS DE PALAVRAS · PERGUNTAS</p>
      )}
      {interactive && <p className="print-caption">DEMONSTRAÇÃO LOCAL · SUA RESPOSTA NÃO É SALVA</p>}
    </section>
  )
}
