import { useEffect, useState } from 'react'
import { subscribeUserListeningForms } from '../lib/firebaseListening'

export function useListeningForms(ownerUid) {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(Boolean(ownerUid))
  const [error, setError] = useState('')
  const [previousOwner, setPreviousOwner] = useState(ownerUid)

  if (ownerUid !== previousOwner) {
    setPreviousOwner(ownerUid)
    setForms([])
    setLoading(Boolean(ownerUid))
    setError('')
  }

  useEffect(() => {
    if (!ownerUid) return undefined

    const unsubscribe = subscribeUserListeningForms(
      ownerUid,
      (nextForms) => {
        setForms(nextForms)
        setLoading(false)
      },
      (err) => {
        console.error('subscribeUserListeningForms failed', err)
        setError('Não foi possível carregar suas escutas.')
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [ownerUid])

  return { forms, loading, error }
}
