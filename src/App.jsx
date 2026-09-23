import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import { useReactions } from './hooks/useReactions'
import { usePresence } from './hooks/usePresence'
import { EVIDENCE_BOARD_TYPE, PRESENCE_TTL_MS, SUMMARY_TYPE, TEAM_SELECTION_TYPE, AUTH_DOMAIN_LABEL } from './lib/constants'
import {
  createSlideDraft,
  getParticipantId,
  isValidSessionCode,
  normalizeText,
  describeFirebaseError,
} from './lib/validators'
import { isValidAttendanceReportId } from './lib/attendanceReports'
import {
  getSessionWithRetry,
  deleteSession,
  launchPresentationAsSession,
  submitResponse,
  syncPresenceWithRetry,
  setSessionStatus,
  updateSessionLabel,
} from './lib/firebaseSessions'
import { deletePresentation, duplicatePresentation } from './lib/firebasePresentations'
import { TEMPLATE_BY_ID } from './lib/templates'
import { isAttendanceInstitution, OTHER_ATTENDANCE_INSTITUTION } from './lib/eventData'
import { FullPageLoader } from './components/ui/Spinner'
import Logo from './components/ui/Logo'
import ConversationArtwork from './components/ui/ConversationArtwork'
import PublicLanding from './views/PublicLanding'
import LoginView from './views/LoginView'
import RegisterView from './views/RegisterView'
import VerifyEmailView from './views/VerifyEmailView'
import PresenterDashboard from './views/PresenterDashboard'
import TemplatePicker from './views/TemplatePicker'
import PresentationBuilder from './views/PresentationBuilder'
import HostView from './views/HostView'
import ParticipantView from './views/ParticipantView'
import AttendanceVerificationView from './views/AttendanceVerificationView'

const ACTIVE_SESSION_STORAGE_KEY = 'cloudspeak-active-session'

const clearActiveSession = () => {
  try {
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts.
  }
}

const saveActiveSession = (value) => {
  try {
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // The live session still works when persistence is unavailable.
  }
}

const readActiveSession = () => {
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw)
    return isValidSessionCode(value?.code) ? value : null
  } catch {
    return null
  }
}

export default function App() {
  const { status, uid, email } = useAuth()

  const [route, setRoute] = useState('public')
  const [sessionCode, setSessionCode] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [participantInstitution, setParticipantInstitution] = useState('')
  const [participantContact, setParticipantContact] = useState('')
  const [participantCpf, setParticipantCpf] = useState('')
  const [editingPresentation, setEditingPresentation] = useState(null)
  const [pendingTitle, setPendingTitle] = useState('')
  const [pendingTemplateId, setPendingTemplateId] = useState('blank')
  const [prefilledCode, setPrefilledCode] = useState('')
  const [prefilledAttendance, setPrefilledAttendance] = useState(false)
  const [verificationReportId, setVerificationReportId] = useState('')
  const [requestedSlideId, setRequestedSlideId] = useState('')
  const [attendanceMode, setAttendanceMode] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [sending, setSending] = useState(false)

  const participantId = useMemo(() => getParticipantId(), [])

  const {
    session,
    responses,
    participants,
    error: sessionError,
    loading: sessionLoading,
    next,
    previous,
    jumpTo,
    retry: retrySession,
  } = useSession(sessionCode, {
    includeResponses: route === 'host' || route === 'participant',
    includeParticipants: route === 'host',
    responseSlideId: route === 'participant' ? requestedSlideId : '',
    responsesScope: route === 'participant' ? 'current-slide' : 'all',
  })
  const { reactions } = useReactions(route === 'host' ? sessionCode : '')

  const { error: presenceError, retry: retryPresence } = usePresence({
    enabled: route === 'participant' && Boolean(sessionCode),
    code: sessionCode,
    participantId,
    participantName,
    participantInstitution,
    participantContact,
    participantCpf,
    attendance: attendanceMode,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeFromUrl = params.get('code')?.trim().toUpperCase() ?? ''
    const slideFromUrl = params.get('slide')?.trim() ?? ''
    const reportFromUrl = params.get('verify')?.trim() ?? ''
    if (codeFromUrl) setPrefilledCode(codeFromUrl)
    if (slideFromUrl) setRequestedSlideId(slideFromUrl)
    if (isValidAttendanceReportId(reportFromUrl)) setVerificationReportId(reportFromUrl)
    setPrefilledAttendance(params.get('mode') === 'attendance' || params.get('presence') === '1')
  }, [])

  useEffect(() => {
    if (route !== 'public') return
    const saved = readActiveSession()
    if (!saved) return

    if (saved.route === 'host') {
      if (status !== 'verified') return
      setSessionCode(saved.code)
      setRoute('host')
      return
    }

    if (saved.route === 'participant') {
      setSessionCode(saved.code)
      setParticipantName(saved.participantName ?? '')
      setParticipantInstitution(saved.participantInstitution ?? '')
      setParticipantContact(saved.participantContact ?? '')
      setParticipantCpf(saved.participantCpf ?? '')
      setRequestedSlideId(saved.requestedSlideId ?? '')
      setRoute('participant')
    }
  }, [route, status])

  useEffect(() => {
    if (!globalError) return undefined
    const timeout = window.setTimeout(() => setGlobalError(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [globalError])

  useEffect(() => {
    if (sessionLoading || !sessionCode) return
    if (sessionError) return
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
  }, [session, sessionError, sessionLoading, sessionCode, route])

  const currentSlide = useMemo(() => {
    if (!session?.slides?.length) return null
    if (route === 'participant' && requestedSlideId) {
      const requestedSlide = session.slides.find((slide) => slide.id === requestedSlideId)
      if (requestedSlide) return requestedSlide
    }
    return session.slides[session.currentSlideIndex] ?? session.slides[0]
  }, [session, requestedSlideId, route])

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
    clearActiveSession()
    setRoute('public')
    setSessionCode('')
    setPrefilledCode('')
    setPrefilledAttendance(false)
    setVerificationReportId('')
    setRequestedSlideId('')
    setAttendanceMode(false)
    setJoinError('')
  }
  const goLogin = () => setRoute('login')
  const goRegister = () => setRoute('register')
  const goDashboard = () => {
    clearActiveSession()
    setRoute('dashboard')
    setSessionCode('')
    setRequestedSlideId('')
    setAttendanceMode(false)
  }
  const leaveHost = () => {
    clearActiveSession()
    setRoute('dashboard')
    setSessionCode('')
    setRequestedSlideId('')
    setAttendanceMode(false)
    setJoinError('')
  }
  const goTemplatePicker = (templateId = 'blank') => {
    setEditingPresentation(null)
    setPendingTitle('')
    setPendingTemplateId(templateId)
    setRoute('templates')
  }
  const goBuilderEdit = (presentation) => {
    setEditingPresentation(presentation)
    setRoute('builder')
  }
  const goHost = (code) => {
    saveActiveSession({ route: 'host', code })
    setSessionCode(code)
    setRoute('host')
  }
  const goParticipant = (code) => {
    saveActiveSession({
      route: 'participant',
      code,
      participantName,
      participantInstitution,
      requestedSlideId,
    })
    setSessionCode(code)
    setRoute('participant')
  }

  const handleJoin = async (name, codeInput, metadata = {}) => {
    setJoinError('')
    const code = (codeInput ?? '').trim().toUpperCase()
    if (!isValidSessionCode(code)) {
      setJoinError('Código inválido. Verifique e tente novamente.')
      return
    }
    setJoining(true)
    try {
      const found = await getSessionWithRetry(code)
      if (!found || found.status !== 'live') {
        setJoinError('A apresentação foi encerrada ou o código não está mais disponível.')
        return
      }
      const normalizedName = normalizeText(name)
      const normalizedInstitution = normalizeText(metadata.institution ?? '')
      const normalizedOtherInstitution = normalizeText(metadata.institutionOther ?? '')
      const isOtherInstitution = normalizedInstitution === OTHER_ATTENDANCE_INSTITUTION
      const finalInstitution = isOtherInstitution ? normalizedOtherInstitution : normalizedInstitution
      const normalizedContact = normalizeText(metadata.contact ?? '').slice(0, 120)
      const normalizedCpf = String(metadata.cpf ?? '').replace(/\D/g, '').slice(0, 11)
      if (metadata.attendance && normalizedName.length < 3) {
        setJoinError('Informe seu nome completo para registrar a presença.')
        return
      }
      if (metadata.attendance && isOtherInstitution && !finalInstitution) {
        setJoinError('Informe qual é o outro órgão, escola ou instituição.')
        return
      }
      if (metadata.attendance && !isAttendanceInstitution(normalizedInstitution)) {
        setJoinError('Selecione seu órgão, escola ou instituição na lista.')
        return
      }
      if (metadata.attendance && normalizedContact.length < 5) {
        setJoinError('Informe um e-mail ou telefone para comprovar sua presença.')
        return
      }
      if (metadata.attendance && normalizedCpf.length !== 11) {
        setJoinError('Informe um CPF válido com 11 dígitos.')
        return
      }
      if (metadata.attendance) {
        await syncPresenceWithRetry({
          code,
          participantId,
          participantName: normalizedName,
          participantInstitution: finalInstitution,
          participantContact: normalizedContact,
          participantCpf: normalizedCpf,
          attendance: true,
          includeJoinedAt: true,
        })
        setSessionCode(code)
        setParticipantName(normalizedName)
        setParticipantInstitution(finalInstitution)
        setParticipantContact(normalizedContact)
        setParticipantCpf(normalizedCpf)
        saveActiveSession({
          route: 'participant',
          code,
          participantName: normalizedName,
          participantInstitution: finalInstitution,
          participantContact: normalizedContact,
          participantCpf: normalizedCpf,
          requestedSlideId,
        })
        setAttendanceMode(false)
        setRoute('attendance')
        return
      }
      if (requestedSlideId && !found.slides?.some((slide) => slide.id === requestedSlideId)) {
        setRequestedSlideId('')
      }
      setAttendanceMode(Boolean(metadata.attendance))
      setParticipantName(normalizedName)
      setParticipantInstitution(finalInstitution)
      setParticipantContact(normalizedContact)
      setParticipantCpf(normalizedCpf)
      saveActiveSession({
        route: 'participant',
        code,
        participantName: normalizedName,
        participantInstitution: finalInstitution,
        participantContact: normalizedContact,
        participantCpf: normalizedCpf,
        requestedSlideId,
      })
      goParticipant(code)
    } catch (error) {
      console.error('Join session error', error)
      setJoinError(describeFirebaseError(error, 'Erro ao entrar na sessão. Verifique sua conexão e tente novamente.'))
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
      console.error('Launch presentation error:', err)
      const message = err.code === 'permission-denied'
        ? `Permissão negada. Verifique se você está logado com e-mail autorizado: ${AUTH_DOMAIN_LABEL}.`
        : err.message === 'AVANCA_EVIDENCE_BOARD_LIMIT'
          ? 'O AvanÃ§a precisa de uma posiÃ§Ã£o livre para o quadro de evidÃªncias. Remova um slide antes de apresentar.'
        : err.message?.includes('ERR_BLOCKED_BY_CLIENT') || err.code === 'unavailable'
          ? 'Conexão bloqueada. Desative adblockers ou verifique seu firewall/antivírus.'
          : err.message || 'Não foi possível lançar a apresentação.'
      setGlobalError(message)
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

  const handleEndProjection = async (code) => {
    setGlobalError('')
    try {
      await setSessionStatus(code, 'ended')
    } catch (err) {
      setGlobalError(err.message || 'Não foi possível encerrar a projeção.')
    }
  }

  const handleSubmitResponse = async (value) => {
    if (!session || !currentSlide) return false
    if (currentSlide.type === EVIDENCE_BOARD_TYPE || currentSlide.type === SUMMARY_TYPE) return false
    if (session.status !== 'live') {
      setGlobalError('A sessão foi encerrada e não aceita novas respostas.')
      return false
    }
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

  let view = verificationReportId ? 'attendance-verification' : route
  if (!verificationReportId && status === 'loading') view = 'loading'
  else if (!verificationReportId && (route === 'dashboard' || route === 'builder' || route === 'templates') && status !== 'verified') {
    view = status === 'anonymous' ? 'login' : 'verify'
  } else if (!verificationReportId && status === 'verified' && (route === 'login' || route === 'register' || route === 'verify')) {
    view = 'dashboard'
  } else if (!verificationReportId && status === 'unverified' && (route === 'login' || route === 'register')) {
    view = 'verify'
  }

  if (view === 'loading') return <FullPageLoader label="Carregando Fala SEC..." />

  if (view === 'public') {
    return (
      <>
        <PublicLanding
          initialCode={prefilledCode}
          initialAttendance={prefilledAttendance}
          onJoin={handleJoin}
          onPresenterLogin={goLogin}
          loading={joining}
          error={joinError}
        />
        {globalError && <GlobalToast message={globalError} />}
      </>
    )
  }

  if (view === 'attendance-verification') {
    return <AttendanceVerificationView key={verificationReportId} reportId={verificationReportId} onBack={goPublic} />
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
        onNew={goTemplatePicker}
        onEdit={goBuilderEdit}
        onPresent={handlePresent}
        onResumeSession={goHost}
        onSetSessionStatus={setSessionStatus}
        onRenameSession={updateSessionLabel}
        onDeleteSession={(session) => deleteSession(session.code)}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onLogout={goPublic}
      />
    )
  }

  if (view === 'templates') {
    return (
      <TemplatePicker
        initialTitle={pendingTitle}
        initialTemplateId={pendingTemplateId}
        onBack={goDashboard}
        onConfirm={({ templateId, title, eventKey }) => {
          const template = TEMPLATE_BY_ID[templateId]
          const slides = template ? template.build() : [createSlideDraft()]
          setPendingTitle(title)
          setEditingPresentation({ id: null, title, slides, eventKey })
          setRoute('builder')
        }}
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
        <>
          <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f4ef]">
            <FullPageLoader label="Preparando a sala..." />
          </div>
          {sessionError && (
            <ConnectionToast
              messages={[sessionError]}
              onBack={leaveHost}
              onRetry={retrySession}
            />
          )}
        </>
      )
    }
    return (
      <>
        <HostView
          session={session}
          ownerUid={uid}
          ownerEmail={email}
          currentSlide={currentSlide}
          currentSlideIndex={session.currentSlideIndex ?? 0}
          responses={currentSlideResponses}
          reactions={reactions}
          connectedParticipants={connectedParticipants}
          onNext={next}
          onPrevious={previous}
          onGoToSlide={jumpTo}
          onEndProjection={handleEndProjection}
          canGoBack={session.currentSlideIndex > 0}
          canGoForward={session.currentSlideIndex < session.slides.length - 1}
          onExit={leaveHost}
          allResponses={responses}
          participants={participants}
        />
        {globalError && <GlobalToast message={globalError} />}
        {(sessionError || presenceError) && (
          <ConnectionToast
            messages={[sessionError, presenceError].filter(Boolean)}
            onBack={leaveHost}
            onRetry={() => {
              retrySession()
              retryPresence()
            }}
          />
        )}
      </>
    )
  }

  if (view === 'participant') {
    if (sessionError && (!session || !currentSlide)) {
      return (
        <>
          <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f4ef]">
            <FullPageLoader label="Conectando..." />
          </div>
          <ConnectionToast
            messages={[sessionError]}
            onBack={goPublic}
            onRetry={retrySession}
          />
        </>
      )
    }
    if (!session || !currentSlide) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f4ef]">
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
          sending={sending}
          onExit={goPublic}
        />
        {globalError && <GlobalToast message={globalError} />}
        {(sessionError || presenceError) && (
          <ConnectionToast
            messages={[sessionError, presenceError].filter(Boolean)}
            onBack={goPublic}
            onRetry={() => {
              retrySession()
              retryPresence()
            }}
          />
        )}
      </>
    )
  }

  if (view === 'attendance') {
    return <AttendanceConfirmation name={participantName} onExit={goPublic} />
  }

  return (
    <PublicLanding
      initialCode={prefilledCode}
      initialAttendance={prefilledAttendance}
      onJoin={handleJoin}
      onPresenterLogin={goLogin}
      loading={joining}
      error={joinError}
    />
  )
}

function AttendanceConfirmation({ name, onExit }) {
  return (
    <div className="fala-app public-page">
      <header className="public-header">
        <Logo />
      </header>
      <main className="public-main">
        <section className="public-entry" aria-labelledby="attendance-confirmed-title">
          <p className="fala-eyebrow">PRESENÇA REGISTRADA</p>
          <h1 id="attendance-confirmed-title" className="public-title">
            Obrigado,
            <br />
            <span>{name || 'participante'}.</span>
          </h1>
          <p className="public-intro">
            Sua presença foi registrada com sucesso na lista do evento.
          </p>
          <button type="button" className="fala-button join-submit" onClick={onExit}>
            Concluir
          </button>
        </section>
        <ConversationArtwork />
      </main>
    </div>
  )
}

function GlobalToast({ message }) {
  return (
    <div role="alert" className="fixed left-1/2 top-6 z-[9999] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 border border-red-200 bg-white px-5 py-4 text-sm leading-6 text-red-800 shadow-lg">
      {message}
    </div>
  )
}

function ConnectionToast({ messages, onBack, onRetry }) {
  return (
    <div role="alert" className="fixed bottom-4 left-1/2 z-[10001] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 rounded-xl border border-amber-200 bg-white p-4 text-sm text-amber-950 shadow-xl">
      <p className="font-bold">Problema de conexão</p>
      <div className="mt-1 space-y-1 text-xs leading-5">
        {messages.map((message) => <p key={message}>{message}</p>)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onBack} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50">
          Voltar ao início
        </button>
        <button type="button" onClick={onRetry} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800">
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
