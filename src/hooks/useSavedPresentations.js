import { useCallback, useEffect, useRef, useState } from 'react'
import { getUserPresentationsPage } from '../lib/firebasePresentations'

export function useSavedPresentations(ownerUid) {
  const [presentations, setPresentations] = useState([])
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
    setPresentations([])
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
      const page = await getUserPresentationsPage(ownerUid, cursor)
      if (requestId !== requestIdRef.current || ownerRef.current !== ownerUid) return

      cursorRef.current = page.cursor
      setHasMore(page.hasMore)
      setPresentations((current) => append
        ? [...current, ...page.presentations]
        : page.presentations)
    } catch (err) {
      if (requestId !== requestIdRef.current || ownerRef.current !== ownerUid) return
      console.error('getUserPresentationsPage failed', err)
      if (append) {
        setPaginationError('Não foi possível carregar mais apresentações.')
      } else {
        setError('Não foi possível carregar suas apresentações.')
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
      setPresentations([])
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

  const refresh = useCallback(() => {
    cursorRef.current = null
    return requestPage({ cursor: null })
  }, [requestPage])

  const removePresentation = useCallback((id) => {
    setPresentations((current) => current.filter((presentation) => presentation.id !== id))
  }, [])

  return {
    presentations,
    loading,
    loadingMore,
    hasMore,
    error,
    paginationError,
    loadMore,
    refresh,
    removePresentation,
  }
}
