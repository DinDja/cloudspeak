import { useEffect, useState } from 'react'
import { sendReaction, subscribeReactions } from '../lib/firebaseSessions'

export function useReactions(code) {
  const [reactions, setReactions] = useState([])
  const [prevCode, setPrevCode] = useState(code)

  if (code !== prevCode) {
    setPrevCode(code)
    setReactions([])
  }

  useEffect(() => {
    if (!code) return undefined
    const unsubscribe = subscribeReactions(code, setReactions)
    return () => unsubscribe()
  }, [code])

  const react = (type, participantId) => {
    if (!code) return Promise.resolve()
    return sendReaction({ code, participantId, type })
  }

  return { reactions, react }
}
