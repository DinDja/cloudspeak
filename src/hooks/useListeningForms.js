import { useEffect, useState } from 'react'
import { subscribeSharedListeningForms, subscribeUserListeningForms } from '../lib/firebaseListening'

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

export function useSharedListeningForms(email) {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(Boolean(email))
  const [error, setError] = useState('')
  const [previousEmail, setPreviousEmail] = useState(email)

  if (email !== previousEmail) {
    setPreviousEmail(email)
    setForms([])
    setLoading(Boolean(email))
    setError('')
  }

  useEffect(() => {
    if (!email) return undefined

    return subscribeSharedListeningForms(
      email,
      (nextForms) => {
        setForms(nextForms)
        setLoading(false)
      },
      (err) => {
        console.error('subscribeSharedListeningForms failed', err)
        setError('Não foi possível carregar as escutas compartilhadas com você.')
        setLoading(false)
      },
    )
  }, [email])

  return { forms, loading, error }
}
