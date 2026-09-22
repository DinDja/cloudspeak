import { useState } from 'react'
import Modal from '../ui/Modal'
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
  const [selectedResponse, setSelectedResponse] = useState(null)

  if (!responses.length) return <p className="result-empty">Aguardando a primeira resposta.</p>

  return (
    <>
      {cardStyle ? (
        <div className="response-wall response-wall--cards">
          {responses.map((entry, index) => (
            <div className="response-card-wrapper" key={entry.id ?? `${entry.participantId}-${index}`}>
              <article
                className="response-card"
                role="button"
                tabIndex={0}
                aria-label={`Abrir resposta de ${formatParticipantHandle(entry.participantName)}`}
                onClick={() => setSelectedResponse(entry)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedResponse(entry)
                  }
                }}
              >
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
      ) : (
        <div className="response-wall">
          {responses.map((entry) => (
            <article key={entry.id}>
              <p>{formatResponseValue(entry.value)}</p>
              <span>{entry.participantName || 'Anônimo'}</span>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selectedResponse)}
        onClose={() => setSelectedResponse(null)}
        maxWidth="max-w-2xl"
      >
        {selectedResponse && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Resposta completa</p>
            <p className="mt-4 whitespace-pre-wrap break-words text-lg leading-8 text-slate-900">
              {formatResponseValue(selectedResponse.value)}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
              <span className="font-semibold">{formatParticipantHandle(selectedResponse.participantName)}</span>
              <time>{formatResponseDate(selectedResponse.createdAt)}</time>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
