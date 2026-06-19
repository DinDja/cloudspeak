import { useEffect, useState } from 'react'
import {
  goNextSlide,
  goPreviousSlide,
  subscribeParticipants,
  subscribeResponses,
  subscribeSession,
} from '../lib/firebaseSessions'

export function useSession(code) {
  const [session, setSession] = useState(null)
  const [responses, setResponses] = useState([])
  const [participants, setParticipants] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(code))
  const [prevCode, setPrevCode] = useState(code)

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

    const unsubSession = subscribeSession(
      code,
      (next) => {
        setSession(next)
        setError('')
        setLoading(false)
      },
      (err) => {
        console.error('subscribeSession failed', err)
        setError('Não foi possível conectar à sessão.')
        setLoading(false)
      },
    )
    const unsubResponses = subscribeResponses(code, setResponses)
    const unsubParticipants = subscribeParticipants(code, setParticipants)

    return () => {
      unsubSession()
      unsubResponses()
      unsubParticipants()
    }
  }, [code])

  const next = () => goNextSlide(session)
  const previous = () => goPreviousSlide(session)

  return { session, responses, participants, error, loading, next, previous, setSession }
}
