import { useEffect } from 'react'
import { PRESENCE_HEARTBEAT_MS } from '../lib/constants'
import { syncPresence } from '../lib/firebaseSessions'

export function usePresence({ enabled, code, participantId, participantName }) {
  useEffect(() => {
    if (!enabled || !code || !participantId) return undefined

    let active = true

    const run = async (includeJoinedAt) => {
      if (!active) return
      try {
        await syncPresence({ code, participantId, participantName, includeJoinedAt })
      } catch (error) {
        console.error('syncPresence failed', error)
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
  }, [enabled, code, participantId, participantName])
}
