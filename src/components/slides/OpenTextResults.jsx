import { formatResponseValue } from '../../lib/validators'

const formatResponseDate = (createdAt) => {
  const timestamp = createdAt?.toMillis?.()
  if (typeof timestamp !== 'number') return 'Agora'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

const formatParticipantHandle = (name) => {
  const normalizedName = String(name || 'Anônimo').trim()
  return `@${normalizedName || 'Anônimo'}`
}

export default function OpenTextResults({ responses, cardStyle = false }) {
  if (!responses.length) return <p className="result-empty">Aguardando a primeira resposta.</p>

  if (cardStyle) {
    return (
      <div className="response-wall response-wall--cards">
        {responses.map((entry, index) => (
          <div className="response-card-wrapper" key={entry.id ?? `${entry.participantId}-${index}`}>
            <article className="response-card">
              <div className="response-card__account">
                <span className="response-card__stars" aria-label="Cinco estrelas">
                  ★★★★★
                </span>
                <span>{formatParticipantHandle(entry.participantName)}</span>
              </div>
              <p className="response-card__content">{formatResponseValue(entry.value)}</p>
              <time className="response-card__date">{formatResponseDate(entry.createdAt)}</time>
            </article>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="response-wall">
      {responses.map((entry) => (
        <article key={entry.id}>
          <p>{formatResponseValue(entry.value)}</p>
          <span>{entry.participantName || 'Anônimo'}</span>
        </article>
      ))}
    </div>
  )
}
