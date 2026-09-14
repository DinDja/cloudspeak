import { useEffect, useState } from 'react'
import { subscribeUserSessions } from '../lib/firebaseSessions'

export function useSavedSessions(ownerUid) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(Boolean(ownerUid))
  const [error, setError] = useState('')
  const [prevOwner, setPrevOwner] = useState(ownerUid)

  if (ownerUid !== prevOwner) {
    setPrevOwner(ownerUid)
    setSessions([])
    setLoading(Boolean(ownerUid))
    setError('')
  }

  useEffect(() => {
    if (!ownerUid) return undefined

    const unsubscribe = subscribeUserSessions(
      ownerUid,
      (next) => {
        setSessions(next)
        setLoading(false)
      },
      (err) => {
        console.error('subscribeUserSessions failed', err)
        setError('NÃ£o foi possÃ­vel carregar suas seÃ§Ãµes.')
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [ownerUid])

  return { sessions, loading, error }
}
