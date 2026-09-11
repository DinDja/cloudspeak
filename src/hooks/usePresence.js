import { useEffect, useState } from 'react'
import { PRESENCE_HEARTBEAT_MS } from '../lib/constants'
import { describeFirebaseError } from '../lib/validators'
import { syncPresenceWithRetry } from '../lib/firebaseSessions'

export function usePresence({
  enabled,
  code,
  participantId,
  participantName,
  participantInstitution = '',
  attendance = false,
}) {
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (!enabled || !code || !participantId) {
      return undefined
    }

    let active = true

    const run = async (includeJoinedAt) => {
      if (!active) return
      try {
        await syncPresenceWithRetry({
          code,
          participantId,
          participantName,
          participantInstitution,
          attendance,
          includeJoinedAt,
        })
        if (active) setError('')
      } catch (presenceError) {
        console.error('syncPresence failed', presenceError)
        if (active) setError(describeFirebaseError(presenceError, 'Não foi possível confirmar sua presença.'))
      }
    }

    run(true)

    const intervalId = window.setInterval(() => run(false), PRESENCE_HEARTBEAT_MS)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') run(false)
    }
    const handleFocus = () => run(false)

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      active = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, code, participantId, participantName, participantInstitution, attendance, retryToken])

  return {
    error,
    retry: () => setRetryToken((current) => current + 1),
  }
}
