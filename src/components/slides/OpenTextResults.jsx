import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import { formatResponseValue } from '../../lib/validators'

const formatResponseDate = (createdAt) => {
  const timestamp = createdAt?.toMillis?.()
  if (typeof timestamp !== 'number') return 'Agora'

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

const formatParticipantHandle = (name) => {
  const normalizedName = String(name || 'Anônimo').trim()
  return `@${normalizedName || 'Anônimo'}`
}

const formatResponseDateTime = (createdAt) => {
  const timestamp = createdAt?.toMillis?.()
  if (typeof timestamp !== 'number') return 'Agora'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

const getResponseDateTimeValue = (createdAt) => {
  const timestamp = createdAt?.toMillis?.()
  return typeof timestamp === 'number' ? new Date(timestamp).toISOString() : undefined
}

const getParticipantInitials = (name) => {
  const normalizedName = String(name || 'Anônimo').trim() || 'Anônimo'
  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

export default function OpenTextResults({ responses, cardStyle = false }) {
  const [selectedResponse, setSelectedResponse] = useState(null)
  const [copyState, setCopyState] = useState('idle')

  const openResponse = (entry) => {
    setSelectedResponse(entry)
    setCopyState('idle')
  }

  const closeResponse = () => {
    setSelectedResponse(null)
    setCopyState('idle')
  }

  const copyResponse = async () => {
    if (!selectedResponse) return

    setCopyState('idle')
    try {
      await navigator.clipboard.writeText(formatResponseValue(selectedResponse.value))
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }

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
                onClick={() => openResponse(entry)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openResponse(entry)
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
        onClose={closeResponse}
        maxWidth="max-w-3xl"
        ariaLabel="Resposta completa"
      >
        {selectedResponse && (
          <div className="-mx-1">
            <div className="flex items-start gap-4 border-b border-slate-200 pb-5 pr-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="fala-eyebrow">RESPOSTA ABERTA</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Resposta completa</h2>
                <p className="mt-1 text-sm text-slate-500">Leia a contribuição com calma e sem cortes.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
                aria-hidden="true"
              >
                {getParticipantInitials(selectedResponse.participantName)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {formatParticipantHandle(selectedResponse.participantName)}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                  <time dateTime={getResponseDateTimeValue(selectedResponse.createdAt)}>
                    {formatResponseDateTime(selectedResponse.createdAt)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{formatResponseValue(selectedResponse.value).length} caracteres</span>
                </div>
              </div>
            </div>

            <div className="relative mt-5 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/60 px-6 py-7 sm:px-8 sm:py-9">
              <span className="absolute left-5 top-1 text-7xl font-serif leading-none text-violet-200" aria-hidden="true">
                “
              </span>
              <p className="relative max-h-[46dvh] overflow-y-auto whitespace-pre-wrap break-words pr-1 text-xl leading-9 text-slate-800 sm:text-2xl sm:leading-10">
                {formatResponseValue(selectedResponse.value)}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <p className="text-xs text-slate-500" aria-live="polite">
                {copyState === 'copied' && 'Resposta copiada para a área de transferência.'}
                {copyState === 'error' && 'Não foi possível copiar. Tente novamente.'}
              </p>
              <div className="ml-auto flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  className="fala-button fala-button--secondary"
                  onClick={copyResponse}
                >
                  {copyState === 'copied' ? <Check size={15} /> : <Copy size={15} />}
                  {copyState === 'copied' ? 'Copiada' : copyState === 'error' ? 'Tentar copiar' : 'Copiar resposta'}
                </button>
                <button type="button" className="fala-button" onClick={closeResponse}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
