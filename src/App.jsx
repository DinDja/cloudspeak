import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import { useReactions } from './hooks/useReactions'
import { usePresence } from './hooks/usePresence'
import { PRESENCE_TTL_MS, TEAM_SELECTION_TYPE } from './lib/constants'
import {
  createSlideDraft,
  getParticipantId,
  isValidSessionCode,
  normalizeText,
} from './lib/validators'
import { getSession, launchPresentationAsSession, submitResponse } from './lib/firebaseSessions'
import { deletePresentation, duplicatePresentation } from './lib/firebasePresentations'
import { FullPageLoader } from './components/ui/Spinner'
import PublicLanding from './views/PublicLanding'
import LoginView from './views/LoginView'
import RegisterView from './views/RegisterView'
import VerifyEmailView from './views/VerifyEmailView'
import PresenterDashboard from './views/PresenterDashboard'
import PresentationBuilder from './views/PresentationBuilder'
import HostView from './views/HostView'
import ParticipantView from './views/ParticipantView'

export default function App() {
  const { status, uid, email } = useAuth()

  const [route, setRoute] = useState('public')
  const [sessionCode, setSessionCode] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [editingPresentation, setEditingPresentation] = useState(null)
  const [prefilledCode, setPrefilledCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [sending, setSending] = useState(false)

  const participantId = useMemo(() => getParticipantId(), [])

  const { session, responses, participants, loading: sessionLoading, next, previous } = useSession(sessionCode)
  const { reactions, react } = useReactions(sessionCode)

  usePresence({
    enabled: route === 'participant' && Boolean(sessionCode),
    code: sessionCode,
    participantId,
    participantName,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeFromUrl = params.get('code')?.trim().toUpperCase() ?? ''
    if (codeFromUrl) setPrefilledCode(codeFromUrl)
  }, [])

  useEffect(() => {
    if (!globalError) return undefined
    const timeout = window.setTimeout(() => setGlobalError(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [globalError])

  useEffect(() => {
    if (sessionLoading || !sessionCode) return
    if (session) return
    if (route === 'participant') {
      setGlobalError('Sessão não encontrada ou finalizada.')
      setRoute('public')
      setSessionCode('')
    } else if (route === 'host') {
      setGlobalError('Sessão não encontrada ou finalizada.')
      setRoute('dashboard')
      setSessionCode('')
    }
  }, [session, sessionLoading, sessionCode, route])

  const currentSlide = useMemo(() => {
    if (!session?.slides?.length) return null
    return session.slides[session.currentSlideIndex] ?? session.slides[0]
  }, [session])

  const currentSlideResponses = useMemo(() => {
    if (!currentSlide) return []
    return responses.filter((entry) => entry.slideId === currentSlide.id)
  }, [responses, currentSlide])

  const currentParticipantResponse = useMemo(
    () => currentSlideResponses.find((entry) => entry.participantId === participantId) ?? null,
    [currentSlideResponses, participantId],
  )

  const connectedParticipants = useMemo(() => {
    const now = Date.now()
    return participants.filter((entry) => {
      const timestamp = entry.lastSeenAt?.toMillis?.()
      return typeof timestamp === 'number' && now - timestamp <= PRESENCE_TTL_MS
    }).length
  }, [participants])

  const goPublic = () => {
    setRoute('public')
    setSessionCode('')
    setJoinError('')
  }
  const goLogin = () => setRoute('login')
  const goRegister = () => setRoute('register')
  const goDashboard = () => {
    setRoute('dashboard')
    setSessionCode('')
  }
  const goBuilderNew = () => {
    setEditingPresentation({ id: null, title: '', slides: [createSlideDraft()] })
    setRoute('builder')
  }
  const goBuilderEdit = (presentation) => {
    setEditingPresentation(presentation)
    setRoute('builder')
  }
  const goHost = (code) => {
    setSessionCode(code)
    setRoute('host')
  }
  const goParticipant = (code) => {
    setSessionCode(code)
    setRoute('participant')
  }

  const handleJoin = async (name, codeInput) => {
    setJoinError('')
    const code = (codeInput ?? '').trim().toUpperCase()
    if (!isValidSessionCode(code)) {
      setJoinError('Código inválido. Verifique e tente novamente.')
      return
    }
    setJoining(true)
    try {
      const found = await getSession(code)
      if (!found) {
        setJoinError('Código inválido. Verifique e tente novamente.')
        return
      }
      setParticipantName(normalizeText(name))
      goParticipant(code)
    } catch {
      setJoinError('Erro ao entrar na sessão. Verifique sua conexão.')
    } finally {
      setJoining(false)
    }
  }

  const handlePresent = async (presentation) => {
    setGlobalError('')
    try {
      const code = await launchPresentationAsSession({ presentation, ownerUid: uid, ownerEmail: email })
      goHost(code)
    } catch (err) {
      setGlobalError(err.message || 'Não foi possível lançar a apresentação.')
    }
  }

  const handleDuplicate = async (presentation) => {
    setGlobalError('')
    try {
      await duplicatePresentation({ presentation, ownerUid: uid, ownerEmail: email })
    } catch (err) {
      setGlobalError(err.message || 'Não foi possível duplicar.')
    }
  }

  const handleDelete = async (presentation) => {
    await deletePresentation(presentation.id)
  }

  const handleSubmitResponse = async (value) => {
    if (!session || !currentSlide) return false
    setSending(true)
    setGlobalError('')
    try {
      const ok = await submitResponse({
        session,
        currentSlide,
        participantId,
        participantName,
        value,
      })
      return ok
    } catch (err) {
      const message =
        err.message === 'TEAM_FULL'
          ? `O clube acabou de lotar. Escolha outro.`
          : err.message === 'TEAM_ALREADY_SELECTED'
            ? 'Você já escolheu um clube nesta etapa.'
            : err.message === 'TEAM_UNAVAILABLE'
              ? 'Esse clube não está disponível no momento.'
              : err.code === 'permission-denied'
                ? 'Permissão negada. Tente novamente.'
                : 'Não foi possível enviar sua resposta.'
      setGlobalError(message)
      return false
    } finally {
      setSending(false)
    }
  }

  const handleReact = async (type) => {
    try {
      await react(type, participantId)
    } catch {
      setGlobalError('Falha ao enviar reação.')
    }
  }

  let view = route
  if (status === 'loading') view = 'loading'
  else if ((route === 'dashboard' || route === 'builder') && status !== 'verified') {
    view = status === 'anonymous' ? 'login' : 'verify'
  } else if (status === 'verified' && (route === 'login' || route === 'register' || route === 'verify')) {
    view = 'dashboard'
  } else if (status === 'unverified' && (route === 'login' || route === 'register')) {
    view = 'verify'
  }

  if (view === 'loading') return <FullPageLoader label="Carregando CloudSpeak..." />

  if (view === 'public') {
    return (
      <>
        <PublicLanding
          initialCode={prefilledCode}
          onJoin={handleJoin}
          onPresenterLogin={goLogin}
          loading={joining}
          error={joinError}
        />
        {globalError && <GlobalToast message={globalError} />}
      </>
    )
  }

  if (view === 'login') {
    return <LoginView onBack={goPublic} onGoRegister={goRegister} />
  }

  if (view === 'register') {
    return <RegisterView onBack={goPublic} onGoLogin={goLogin} />
  }

  if (view === 'verify') {
    return <VerifyEmailView onBackToPublic={goPublic} />
  }

  if (view === 'dashboard') {
    return (
      <PresenterDashboard
        onNew={goBuilderNew}
        onEdit={goBuilderEdit}
        onPresent={handlePresent}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onLogout={goPublic}
      />
    )
  }

  if (view === 'builder') {
    return (
      <PresentationBuilder
        initialPresentation={editingPresentation}
        onBack={goDashboard}
        onPresented={goHost}
      />
    )
  }

  if (view === 'host') {
    if (!session || !currentSlide) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
          <FullPageLoader label="Preparando a sala..." />
        </div>
      )
    }
    return (
      <>
        <HostView
          session={session}
          currentSlide={currentSlide}
          responses={currentSlideResponses}
          reactions={reactions}
          connectedParticipants={connectedParticipants}
          onNext={next}
          onPrevious={previous}
          canGoBack={session.currentSlideIndex > 0}
          canGoForward={session.currentSlideIndex < session.slides.length - 1}
          onExit={goDashboard}
        />
        {globalError && <GlobalToast message={globalError} />}
      </>
    )
  }

  if (view === 'participant') {
    if (!session || !currentSlide) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
          <FullPageLoader label="Conectando à sala..." />
        </div>
      )
    }
    return (
      <>
        <ParticipantView
          session={session}
          currentSlide={currentSlide}
          responses={currentSlideResponses}
          participantResponse={currentParticipantResponse}
          onSubmit={handleSubmitResponse}
          onReact={handleReact}
          sending={sending}
          onExit={goPublic}
        />
        {globalError && <GlobalToast message={globalError} />}
      </>
    )
  }

  return <PublicLanding initialCode={prefilledCode} onJoin={handleJoin} onPresenterLogin={goLogin} loading={joining} error={joinError} />
}

function GlobalToast({ message }) {
  return (
    <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-full bg-rose-600 px-6 py-3 text-sm font-black tracking-wide text-white shadow-float cs-slide-down">
      {message}
    </div>
  )
}
