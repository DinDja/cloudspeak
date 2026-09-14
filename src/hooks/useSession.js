import { useCallback, useEffect, useState } from 'react'
import {
  goNextSlide,
  goPreviousSlide,
  subscribeParticipants,
  subscribeResponses,
  subscribeSession,
} from '../lib/firebaseSessions'
import { describeFirebaseError } from '../lib/validators'

export function useSession(code, {
  includeResponses = true,
  includeParticipants = true,
  responseSlideId = '',
  responsesScope = 'all',
} = {}) {
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

  const handleSubscriptionError = useCallback((subscriptionError) => {
    console.error('session subscription failed', subscriptionError)
    setError(describeFirebaseError(subscriptionError, 'Não foi possível atualizar a apresentação.'))
    setLoading(false)
  }, [])
  const scopedResponseSlideId = responsesScope === 'current-slide'
    ? responseSlideId || session?.slides?.[session.currentSlideIndex]?.id || ''
    : ''

  useEffect(() => {
    if (!code) return undefined

    const unsubSession = subscribeSession(
      code,
      (next) => {
        setSession(next)
        setError('')
        setLoading(false)
      },
      handleSubscriptionError,
    )
    return () => {
      unsubSession()
    }
  }, [code, retryToken, handleSubscriptionError])

  useEffect(() => {
    if (!code || !includeResponses) return undefined
    if (responsesScope === 'current-slide' && !scopedResponseSlideId) return undefined
    return subscribeResponses(code, setResponses, handleSubscriptionError, scopedResponseSlideId)
  }, [code, includeResponses, responsesScope, scopedResponseSlideId, retryToken, handleSubscriptionError])

  useEffect(() => {
    if (!code || !includeParticipants) return undefined
    return subscribeParticipants(code, setParticipants, handleSubscriptionError)
  }, [code, includeParticipants, retryToken, handleSubscriptionError])

  const next = () => goNextSlide(session)
  const previous = () => goPreviousSlide(session)

  return {
    session,
    responses: includeResponses && (responsesScope !== 'current-slide' || scopedResponseSlideId)
      ? responses.filter((entry) => !scopedResponseSlideId || entry.slideId === scopedResponseSlideId)
      : [],
    participants: includeParticipants ? participants : [],
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
