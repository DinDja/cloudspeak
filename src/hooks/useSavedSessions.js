import { useCallback, useEffect, useRef, useState } from 'react'
import { getUserSessionsPage } from '../lib/firebaseSessions'

export function useSavedSessions(ownerUid) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(Boolean(ownerUid))
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [paginationError, setPaginationError] = useState('')
  const [prevOwner, setPrevOwner] = useState(ownerUid)
  const cursorRef = useRef(null)
  const requestIdRef = useRef(0)
  const ownerRef = useRef(ownerUid)
  ownerRef.current = ownerUid

  if (ownerUid !== prevOwner) {
    setPrevOwner(ownerUid)
    setSessions([])
    setLoading(Boolean(ownerUid))
    setLoadingMore(false)
    setHasMore(false)
    setError('')
    setPaginationError('')
    cursorRef.current = null
    requestIdRef.current += 1
  }

  const requestPage = useCallback(async ({ cursor = null, append = false } = {}) => {
    if (!ownerUid) return

    const requestId = ++requestIdRef.current
    if (append) {
      setLoadingMore(true)
      setPaginationError('')
    } else {
      setLoading(true)
      setLoadingMore(false)
      setError('')
      setPaginationError('')
    }

    try {
      const page = await getUserSessionsPage(ownerUid, cursor)
      if (requestId !== requestIdRef.current || ownerRef.current !== ownerUid) return

      cursorRef.current = page.cursor
      setHasMore(page.hasMore)
      setSessions((current) => append
        ? [...current, ...page.sessions]
        : page.sessions)
    } catch (err) {
      if (requestId !== requestIdRef.current || ownerRef.current !== ownerUid) return
      console.error('getUserSessionsPage failed', err)
      if (append) {
        setPaginationError('Não foi possível carregar mais seções.')
      } else {
        setError('Não foi possível carregar suas seções.')
      }
    } finally {
      if (requestId === requestIdRef.current && ownerRef.current === ownerUid) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [ownerUid])

  useEffect(() => {
    cursorRef.current = null
    if (!ownerUid) {
      setSessions([])
      setLoading(false)
      setHasMore(false)
      return undefined
    }

    void requestPage({ cursor: null })
    return () => {
      requestIdRef.current += 1
    }
  }, [ownerUid, requestPage])

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || !cursorRef.current) return Promise.resolve()
    return requestPage({ cursor: cursorRef.current, append: true })
  }, [hasMore, loadingMore, requestPage])

  const removeSessions = useCallback((codes) => {
    const removedCodes = new Set(codes)
    setSessions((current) => current.filter((session) => !removedCodes.has(session.code)))
  }, [])

  const updateSession = useCallback((code, updates) => {
    setSessions((current) => current.map((session) => session.code === code
      ? { ...session, ...updates }
      : session))
  }, [])

  return {
    sessions,
    loading,
    loadingMore,
    hasMore,
    error,
    paginationError,
    loadMore,
    removeSessions,
    updateSession,
  }
}
