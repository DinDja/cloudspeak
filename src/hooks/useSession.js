import { useEffect, useState } from 'react'
import {
  goNextSlide,
  goPreviousSlide,
  subscribeParticipants,
  subscribeResponses,
  subscribeSession,
} from '../lib/firebaseSessions'
import { describeFirebaseError } from '../lib/validators'

export function useSession(code) {
  const [session, setSession] = useState(null)
  const [responses, setResponses] = useState([])
  const [participants, setParticipants] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(code))
  const [prevCode, setPrevCode] = useState(code)
  const [retryToken, setRetryToken] = useState(0)

  if (code !== prevCode) {
    setPrevCode(code)
    setSession(null)
    setResponses([])
    setParticipants([])
    setError('')
    setLoading(Boolean(code))
  }

  useEffect(() => {
    if (!code) return undefined

    const handleSubscriptionError = (subscriptionError) => {
      console.error('session subscription failed', subscriptionError)
      setError(describeFirebaseError(subscriptionError, 'Não foi possível atualizar a apresentação.'))
      setLoading(false)
    }

    const unsubSession = subscribeSession(
      code,
      (next) => {
        setSession(next)
        setError('')
        setLoading(false)
      },
      handleSubscriptionError,
    )
    const unsubResponses = subscribeResponses(code, setResponses, handleSubscriptionError)
    const unsubParticipants = subscribeParticipants(code, setParticipants, handleSubscriptionError)

    return () => {
      unsubSession()
      unsubResponses()
      unsubParticipants()
    }
  }, [code, retryToken])

  const next = () => goNextSlide(session)
  const previous = () => goPreviousSlide(session)

  return {
    session,
    responses,
    participants,
    error,
    loading,
    next,
    previous,
    setSession,
    retry: () => {
      setError('')
      setLoading(Boolean(code))
      setRetryToken((current) => current + 1)
    },
  }
}
