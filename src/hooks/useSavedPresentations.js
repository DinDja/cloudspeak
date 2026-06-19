import { useEffect, useState } from 'react'
import { subscribeUserPresentations } from '../lib/firebasePresentations'

export function useSavedPresentations(ownerUid) {
  const [presentations, setPresentations] = useState([])
  const [loading, setLoading] = useState(Boolean(ownerUid))
  const [error, setError] = useState('')
  const [prevOwner, setPrevOwner] = useState(ownerUid)

  if (ownerUid !== prevOwner) {
    setPrevOwner(ownerUid)
    setPresentations([])
    setLoading(Boolean(ownerUid))
    setError('')
  }

  useEffect(() => {
    if (!ownerUid) return undefined

    const unsubscribe = subscribeUserPresentations(
      ownerUid,
      (next) => {
        setPresentations(next)
        setLoading(false)
      },
      (err) => {
        console.error('subscribeUserPresentations failed', err)
        setError('Não foi possível carregar suas apresentações.')
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [ownerUid])

  return { presentations, loading, error }
}
