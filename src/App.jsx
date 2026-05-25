import { useEffect, useMemo, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Heart,
  HelpCircle,
  LoaderCircle,
  Play,
  ThumbsUp,
  Users,
  WandSparkles,
  Sparkles,
  MessageSquareText,
  KeyRound,
  UserCircle,
  Plus,
  Trash2,
  MonitorPlay,
  History,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  FileDown,
  Mail,
  ClipboardList,
  Building2,
} from 'lucide-react'
import cloud from 'd3-cloud'
import { QRCodeSVG } from 'qrcode.react'
import { db } from '../firebase'

// Paleta estilo Mentimeter (Vibrante e com alto contraste)
const palette = ['#FF0055', '#0099FF', '#FFCC00', '#00CC66', '#9933FF', '#FF6600', '#00E6B8']
const PRESENCE_TTL_MS = 45000
const PRESENCE_HEARTBEAT_MS = 15000
const REACTION_LIFETIME_MS = 4200
const TEAM_SELECTION_TYPE = 'team_selection'
const MAX_TEAM_CAPACITY = 50

const createTeamDraft = (name = '', capacity = 8) => ({
  id: crypto.randomUUID(),
  name,
  capacity: String(capacity),
})

const getDefaultTeamSelectionTeams = () => [createTeamDraft('Clube X', 8), createTeamDraft('Clube Y', 7)]

const createSlideDraft = (type = 'multiple_choice') => ({
  id: crypto.randomUUID(),
  type,
  question: '',
  options: type === 'multiple_choice' ? ['', ''] : [],
  teams: type === TEAM_SELECTION_TYPE ? getDefaultTeamSelectionTeams() : [],
  minContributionLength: type === STRUCTURAL_FORM_TYPE ? STRUCTURAL_MIN_CONTRIBUTION_CHARS : undefined,
  transversalityOptions: type === STRUCTURAL_FORM_TYPE ? [...STRUCTURAL_TRANSVERSALITY_OPTIONS] : [],
  pillarOptions: type === STRUCTURAL_FORM_TYPE ? [...STRUCTURAL_PILLAR_OPTIONS] : [],
})

const generateCode = () =>
  Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()

const getParticipantId = () => {
  const existing = sessionStorage.getItem('cloudspeak-participant-id')
  if (existing) return existing
  const created = crypto.randomUUID()
  sessionStorage.setItem('cloudspeak-participant-id', created)
  return created
}

const normalizeText = (value) => value.trim().replace(/\s+/g, ' ')
const getParticipantDisplayName = (value) => normalizeText(value) || 'Anônimo'

const STRUCTURAL_FORM_TYPE = 'structural_form'
const STRUCTURAL_TRANSVERSALITY_OPTIONS = [
  'Planejamento Estratégico',
  'Gestão Orçamentária',
  'Inovação Tecnológica',
  'Articulação Interinstitucional',
]
const STRUCTURAL_PILLAR_OPTIONS = [
  'Governança',
  'Educação',
  'Infraestrutura',
  'Segurança',
  'Sustentabilidade',
  'Desenvolvimento Econômico',
]
const STRUCTURAL_TRANSVERSALITY_COUNT = 4
const STRUCTURAL_PILLAR_COUNT = 6
const STRUCTURAL_MIN_CONTRIBUTION_CHARS = 30
const STRUCTURAL_MAX_CONTRIBUTION_CHARS = 800

const getStructuralMinChars = (slide) => {
  const val = Number.parseInt(String(slide?.minContributionLength ?? STRUCTURAL_MIN_CONTRIBUTION_CHARS), 10)
  return Number.isInteger(val) && val >= 10 && val <= 600 ? val : STRUCTURAL_MIN_CONTRIBUTION_CHARS
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const normalizeSelections = (items) =>
  Array.from(new Set((Array.isArray(items) ? items : []).map((i) => normalizeText(String(i ?? ''))).filter(Boolean)))

const getStructuralTransversalityOptions = (slide) => {
  const options = normalizeSelections(slide?.transversalityOptions)
  return options.length > 0 ? options : [...STRUCTURAL_TRANSVERSALITY_OPTIONS]
}

const getStructuralPillarOptions = (slide) => {
  const options = normalizeSelections(slide?.pillarOptions)
  return options.length > 0 ? options : [...STRUCTURAL_PILLAR_OPTIONS]
}

const validateStructuralFormPayload = (raw, minChars, config = {}) => {
  const allowedTransversalities = normalizeSelections(
    config.transversalityOptions?.length ? config.transversalityOptions : STRUCTURAL_TRANSVERSALITY_OPTIONS,
  )
  const allowedPillars = normalizeSelections(
    config.pillarOptions?.length ? config.pillarOptions : STRUCTURAL_PILLAR_OPTIONS,
  )

  const name = normalizeText(raw?.name ?? '')
  if (!name) return { isValid: false, error: 'Nome é obrigatório.', payload: null }

  const email = normalizeText(raw?.email ?? '').toLowerCase()
  if (!email) return { isValid: false, error: 'Email é obrigatório.', payload: null }
  if (!isValidEmail(email)) return { isValid: false, error: 'Informe um email válido.', payload: null }

  const institution = normalizeText(raw?.institution ?? '')
  if (!institution) return { isValid: false, error: 'Instituição é obrigatória.', payload: null }

  const transversalities = normalizeSelections(raw?.transversalities)
    .filter((item) => allowedTransversalities.includes(item))
  if (transversalities.length === 0) return { isValid: false, error: 'Selecione ao menos uma transversalidade.', payload: null }

  const pillars = normalizeSelections(raw?.pillars)
    .filter((item) => allowedPillars.includes(item))
  if (pillars.length === 0) return { isValid: false, error: 'Selecione ao menos um pilar.', payload: null }

  const contributions = normalizeText(raw?.contributions ?? '')
  if (!contributions) return { isValid: false, error: 'Contribuição é obrigatória.', payload: null }
  if (contributions.length < minChars) return { isValid: false, error: `Contribuição deve ter no mínimo ${minChars} caracteres.`, payload: null }

  return {
    isValid: true,
    error: '',
    payload: { name, email, institution, transversalities, pillars, contributions },
  }
}

const getJoinUrl = (code) => {
  const configuredBaseUrl = import.meta.env.VITE_APP_URL
  const baseUrl = configuredBaseUrl || window.location.origin
  return `${baseUrl}/?code=${encodeURIComponent(code)}`
}

const getTeamSelectionResponseId = (slideId, participantId) => `${slideId}__${participantId}`

const buildTeamSelectionStats = (slide, responses = []) => {
  if (!slide || slide.type !== TEAM_SELECTION_TYPE) return []

  const teams = Array.isArray(slide.teams) ? slide.teams : []
  const membersByTeam = new Map(teams.map((team) => [team.name, []]))
  const assignedParticipants = new Set()

  responses.forEach((entry) => {
    if (entry?.type !== TEAM_SELECTION_TYPE) return

    const participantKey = normalizeText(entry.participantId ?? '')
    const teamName = normalizeText(entry.value ?? '')

    if (!participantKey || assignedParticipants.has(participantKey) || !membersByTeam.has(teamName)) {
      return
    }

    assignedParticipants.add(participantKey)
    membersByTeam.get(teamName).push({
      ...entry,
      participantName: getParticipantDisplayName(entry.participantName ?? ''),
    })
  })

  return teams.map((team) => {
    const capacity = Number(team.capacity) || 0
    const members = (membersByTeam.get(team.name) ?? []).sort((left, right) =>
      left.participantName.localeCompare(right.participantName, 'pt-BR'),
    )

    return {
      ...team,
      capacity,
      count: members.length,
      spotsLeft: Math.max(capacity - members.length, 0),
      isFull: members.length >= capacity,
      members,
    }
  })
}

const SLIDE_TYPE_LABELS = {
  multiple_choice: 'Múltipla Escolha',
  word_cloud: 'Nuvem de Palavras',
  open_text: 'Texto Livre',
  [TEAM_SELECTION_TYPE]: 'Seleção de Times',
  [STRUCTURAL_FORM_TYPE]: 'Formulário Estrutural',
}

const generateSessionReport = async (sessionCode, sessionData) => {
  const [responsesSnap, participantsSnap] = await Promise.all([
    getDocs(collection(db, 'sessions', sessionCode, 'responses')),
    getDocs(collection(db, 'sessions', sessionCode, 'participants')),
  ])

  const allResponses = responsesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const allParticipants = participantsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 14
  let cursorY = margin

  // ---- Header ----
  pdf.setFillColor(15, 23, 42) // slate-900
  pdf.rect(0, 0, pageWidth, 28, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Relatório de Apresentação', margin, 12)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const createdDate = sessionData.createdAt?.toDate
    ? sessionData.createdAt.toDate().toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR')
  pdf.text(`Código: ${sessionData.code}  |  Gerado em: ${new Date().toLocaleString('pt-BR')}  |  Criado em: ${createdDate}`, margin, 21)

  cursorY = 34

  pdf.setTextColor(15, 23, 42)
  pdf.setFontSize(15)
  pdf.setFont('helvetica', 'bold')
  pdf.text(sessionData.title || 'Sem título', margin, cursorY)
  cursorY += 10

  // ---- Participants section ----
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30, 64, 175) // blue-800
  pdf.text(`Participantes (${allParticipants.length})`, margin, cursorY)
  cursorY += 3

  const participantRows = allParticipants
    .sort((a, b) => (a.participantName ?? '').localeCompare(b.participantName ?? '', 'pt-BR'))
    .map((p, i) => [
      String(i + 1),
      p.participantName || 'Anônimo',
      p.joinedAt?.toDate ? p.joinedAt.toDate().toLocaleString('pt-BR') : '—',
    ])

  autoTable(pdf, {
    startY: cursorY,
    head: [['#', 'Nome', 'Entrou em']],
    body: participantRows.length > 0 ? participantRows : [['—', 'Nenhum participante registrado', '—']],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: margin, right: margin },
  })

  cursorY = pdf.lastAutoTable.finalY + 10

  // ---- Slides section ----
  const slides = sessionData.slides ?? []
  slides.forEach((slide, slideIndex) => {
    const slideResponses = allResponses.filter((r) => r.slideId === slide.id)

    if (cursorY > pdf.internal.pageSize.getHeight() - 40) {
      pdf.addPage()
      cursorY = margin
    }

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 116, 139) // slate-500
    pdf.text(`Slide ${slideIndex + 1} — ${SLIDE_TYPE_LABELS[slide.type] ?? slide.type}`, margin, cursorY)
    cursorY += 5

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    const questionLines = pdf.splitTextToSize(slide.question || '(sem pergunta)', pageWidth - margin * 2)
    pdf.text(questionLines, margin, cursorY)
    cursorY += questionLines.length * 6 + 2

    let tableRows = []

    if (slide.type === 'multiple_choice') {
      const counts = new Map((slide.options ?? []).map((o) => [o, 0]))
      slideResponses.forEach((r) => {
        if (r.value && counts.has(r.value)) counts.set(r.value, counts.get(r.value) + 1)
      })
      const total = slideResponses.length
      tableRows = (slide.options ?? []).map((opt) => {
        const count = counts.get(opt) ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return [opt, String(count), `${pct}%`]
      })
      autoTable(pdf, {
        startY: cursorY,
        head: [['Opção', 'Votos', '%']],
        body: tableRows.length > 0 ? tableRows : [['Sem respostas', '—', '—']],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
        margin: { left: margin, right: margin },
      })
    } else if (slide.type === TEAM_SELECTION_TYPE) {
      const membersByTeam = buildTeamSelectionStats(slide, slideResponses)
      tableRows = membersByTeam.flatMap((team) =>
        team.members.length > 0
          ? team.members.map((m, i) => [team.name, String(i + 1), m.participantName])
          : [[team.name, '—', 'Sem membros']],
      )
      autoTable(pdf, {
        startY: cursorY,
        head: [['Time', '#', 'Participante']],
        body: tableRows.length > 0 ? tableRows : [['—', '—', 'Sem respostas']],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: margin, right: margin },
      })
    } else if (slide.type === STRUCTURAL_FORM_TYPE) {
      const minChars = getStructuralMinChars(slide)
      const uniqueByParticipant = new Map()
      slideResponses.forEach((r) => {
        const validation = validateStructuralFormPayload(r.value ?? {}, minChars, {
          transversalityOptions: getStructuralTransversalityOptions(slide),
          pillarOptions: getStructuralPillarOptions(slide),
        })
        if (!validation.isValid) return
        uniqueByParticipant.set(r.participantId ?? r.id, validation.payload)
      })
      tableRows = Array.from(uniqueByParticipant.values()).map((item) => [
        item.name,
        item.email,
        item.institution,
        item.transversalities.join(', '),
        item.pillars.join(', '),
        item.contributions,
      ])
      autoTable(pdf, {
        startY: cursorY,
        head: [['Nome', 'Email', 'Instituição', 'Transversalidades', 'Pilares', 'Contribuição']],
        body: tableRows.length > 0 ? tableRows : [['—', '—', '—', '—', '—', 'Sem respostas']],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: margin, right: margin },
      })
    } else {
      // word_cloud and open_text: show per-participant rows
      const uniqueNames = new Set()
      tableRows = slideResponses
        .filter((r) => {
          if (slide.type === 'word_cloud') return true
          // For open_text deduplicate by participantId (last response wins)
          if (uniqueNames.has(r.participantId)) return false
          uniqueNames.add(r.participantId)
          return true
        })
        .map((r) => [r.participantName || 'Anônimo', r.value || '—'])
      autoTable(pdf, {
        startY: cursorY,
        head: [['Participante', 'Resposta']],
        body: tableRows.length > 0 ? tableRows : [['—', 'Sem respostas']],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        columnStyles: { 0: { cellWidth: 50 } },
        margin: { left: margin, right: margin },
      })
    }

    cursorY = pdf.lastAutoTable.finalY + 10
  })

  // ---- Page numbers ----
  const totalPages = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(148, 163, 184)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pdf.internal.pageSize.getHeight() - 8, { align: 'right' })
  }

  const safeTitle = (sessionData.title || 'apresentacao').replace(/[^a-z0-9_\-]/gi, '_').slice(0, 40)
  pdf.save(`relatorio_${safeTitle}_${sessionCode}.pdf`)
}

const deleteFirestoreSession = async (code) => {
  const subcollections = ['responses', 'participants', 'reactions']
  try {
    for (const sub of subcollections) {
      const snapshot = await getDocs(collection(db, 'sessions', code, sub))
      await Promise.all(snapshot.docs.map((docRef) => deleteDoc(docRef.ref)))
    }
    await deleteDoc(doc(db, 'sessions', code))
  } catch (error) {
    console.error('Failed to delete session', code, error)
    throw error
  }
}

function WordCloudCanvas({ words }) {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 960, height: 440 })
  const [layoutWords, setLayoutWords] = useState([])

  useEffect(() => {
    if (!containerRef.current) return undefined

    const updateDimensions = () => {
      const nextWidth = Math.max(containerRef.current?.clientWidth ?? 0, 320)
      const nextHeight = nextWidth < 640 ? 340 : 420
      setDimensions({ width: nextWidth, height: nextHeight })
    }

    updateDimensions()

    const observer = new ResizeObserver(() => {
      updateDimensions()
    })

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (words.length === 0) {
      setLayoutWords([])
      return undefined
    }

    let cancelled = false
    const layout = cloud()
      .size([dimensions.width, dimensions.height])
      .words(words.map((item) => ({ ...item })))
      .padding(4)
      .rotate((item) => item.rotate)
      .font('sans-serif')
      .fontWeight(800)
      .fontSize((item) => item.fontSize)
      .spiral('archimedean')
      .on('end', (computedWords) => {
        if (!cancelled) {
          setLayoutWords(computedWords)
        }
      })

    layout.start()

    return () => {
      cancelled = true
      layout.stop()
    }
  }, [dimensions.height, dimensions.width, words])

  return (
    <div
      ref={containerRef}
      className="relative min-h-[340px] w-full overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.98),_rgba(241,245,249,0.82)_58%,_transparent_100%)] p-4 md:min-h-[420px]"
    >
      {layoutWords.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
          <WandSparkles className="mb-4 h-12 w-12 opacity-50" />
          <p className="text-2xl font-bold">A nuvem está vazia.</p>
          <p className="text-lg font-medium opacity-75">Envie a primeira palavra!</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="h-full w-full">
          <g transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2})`}>
            {layoutWords.map((item) => (
              <text
                key={`${item.text}-${item.x}-${item.y}`}
                x={item.x}
                y={item.y}
                textAnchor="middle"
                transform={`rotate(${item.rotate}, ${item.x}, ${item.y})`}
                fill={item.color}
                fillOpacity={item.opacity}
                fontSize={item.size}
                fontWeight={800}
                style={{ cursor: 'default' }}
              >
                {item.text}
              </text>
            ))}
          </g>
        </svg>
      )}
    </div>
  )
}

const sanitizeSlides = (slides = []) => {
  let hasTeamSelectionError = false
  let hasStructuralFormError = false

  const normalizedSlides = slides
    .map((slide) => {
      const type = slide?.type
      const question = normalizeText(slide?.question ?? '')

      if (!question || !['multiple_choice', 'word_cloud', 'open_text', TEAM_SELECTION_TYPE, STRUCTURAL_FORM_TYPE].includes(type)) {
        return null
      }

      if (type === 'multiple_choice') {
        const options = (slide?.options ?? [])
          .map((option) => normalizeText(option ?? ''))
          .filter(Boolean)

        if (options.length < 2) return null

        return {
          id: slide.id || crypto.randomUUID(),
          type,
          question,
          options,
        }
      }

      if (type === TEAM_SELECTION_TYPE) {
        const teams = []
        const seenTeams = new Set()

        for (const team of slide?.teams ?? []) {
          const name = normalizeText(typeof team?.name === 'string' ? team.name : '')
          const capacity = Number.parseInt(String(team?.capacity ?? ''), 10)
          const normalizedKey = name.toLowerCase()

          if (!name || !Number.isInteger(capacity) || capacity < 1 || capacity > MAX_TEAM_CAPACITY || seenTeams.has(normalizedKey)) {
            hasTeamSelectionError = true
            return null
          }

          seenTeams.add(normalizedKey)
          teams.push({
            id: team.id || crypto.randomUUID(),
            name,
            capacity,
          })
        }

        if (teams.length < 2) {
          hasTeamSelectionError = true
          return null
        }

        return {
          id: slide.id || crypto.randomUUID(),
          type,
          question,
          teams,
        }
      }

      if (type === STRUCTURAL_FORM_TYPE) {
        const minChars = getStructuralMinChars(slide)
        const transversalityOptions = normalizeSelections(
          slide?.transversalityOptions?.length ? slide.transversalityOptions : STRUCTURAL_TRANSVERSALITY_OPTIONS,
        )
        const pillarOptions = normalizeSelections(
          slide?.pillarOptions?.length ? slide.pillarOptions : STRUCTURAL_PILLAR_OPTIONS,
        )

        if (
          transversalityOptions.length !== STRUCTURAL_TRANSVERSALITY_COUNT
          || pillarOptions.length !== STRUCTURAL_PILLAR_COUNT
        ) {
          hasStructuralFormError = true
          return null
        }

        return {
          id: slide.id || crypto.randomUUID(),
          type,
          question,
          minContributionLength: minChars,
          transversalityOptions,
          pillarOptions,
        }
      }

      return {
        id: slide.id || crypto.randomUUID(),
        type,
        question,
      }
    })
    .filter(Boolean)

  if (hasTeamSelectionError) {
    return {
      slides: [],
      error: `Na seleção de times, informe pergunta, pelo menos 2 clubes com nomes distintos e um limite entre 1 e ${MAX_TEAM_CAPACITY} vagas por clube.`,
    }
  }

  if (hasStructuralFormError) {
    return {
      slides: [],
      error: `No formulário estrutural, informe exatamente ${STRUCTURAL_TRANSVERSALITY_COUNT} opções de transversalidade e ${STRUCTURAL_PILLAR_COUNT} opções de pilares.`,
    }
  }

  if (normalizedSlides.length === 0) {
    return {
      slides: [],
      error: 'Adicione pelo menos um slide válido. Em múltipla escolha, informe pergunta e no mínimo 2 opções.',
    }
  }

  return { slides: normalizedSlides, error: '' }
}

function Landing({ onCreate, onJoin, onEnterSaved, onDeleteSaved, onExportSaved, sessions = [], loading, initialCode = '', isMobile = false }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState(initialCode)
  const [title, setTitle] = useState('')
  const [slides, setSlides] = useState([createSlideDraft()])

  const updateSlide = (slideId, updater) => {
    setSlides((previous) =>
      previous.map((slide) => {
        if (slide.id !== slideId) return slide
        return typeof updater === 'function' ? updater(slide) : { ...slide, ...updater }
      }),
    )
  }

  const addSlide = () => {
    setSlides((previous) => [...previous, createSlideDraft()])
  }

  const removeSlide = (slideId) => {
    setSlides((previous) => {
      if (previous.length <= 1) return previous
      return previous.filter((slide) => slide.id !== slideId)
    })
  }

  const addOption = (slideId) => {
    updateSlide(slideId, (slide) => ({
      ...slide,
      options: [...(slide.options ?? []), ''],
    }))
  }

  const addTeam = (slideId) => {
    updateSlide(slideId, (slide) => ({
      ...slide,
      teams: [...(slide.teams ?? []), createTeamDraft(`Clube ${(slide.teams?.length ?? 0) + 1}`, 8)],
    }))
  }

  const updateStructuralOption = (slideId, field, optionIndex, nextValue) => {
    updateSlide(slideId, (slide) => ({
      ...slide,
      [field]: (slide[field]?.length
        ? slide[field]
        : field === 'transversalityOptions'
          ? STRUCTURAL_TRANSVERSALITY_OPTIONS
          : STRUCTURAL_PILLAR_OPTIONS
      ).map((item, index) => (index === optionIndex ? nextValue : item)),
    }))
  }

  const removeOption = (slideId, optionIndex) => {
    updateSlide(slideId, (slide) => {
      const nextOptions = (slide.options ?? []).filter((_, index) => index !== optionIndex)
      return {
        ...slide,
        options: nextOptions.length > 0 ? nextOptions : ['', ''],
      }
    })
  }

  const removeTeam = (slideId, teamIndex) => {
    updateSlide(slideId, (slide) => {
      if ((slide.teams ?? []).length <= 2) return slide

      return {
        ...slide,
        teams: (slide.teams ?? []).filter((_, index) => index !== teamIndex),
      }
    })
  }

  const onCreatePresentation = () => {
    onCreate({ title, slides })
  }

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      {/* Fundo com linhas sutis + wave */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-slate-50" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf812_1px,transparent_1px),linear-gradient(to_bottom,#38bdf812_1px,transparent_1px)] bg-[size:28px_28px]" />
        <img
          src="/wave.svg"
          alt=""
          className="absolute inset-x-0 bottom-0 h-[] w-full object-cover opacity-70r"
          aria-hidden="true"
        />
      </div>

      <div className=" relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-12 lg:flex-row lg:items-center lg:gap-16 xl:gap-24">

        {/* Lado Esquerdo: Foco no Participante */}
        <section className="bg-white rounded-3xl  py-5 flex w-full flex-col justify-center lg:w-5/12 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="mb-10 text-center">
            <img
              src="/Secti_Vertical.png"
              alt="Secti logo"
              className="mx-auto mb-6 h-24 w-auto"
            />
            <h1 className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
              SECTI<span className="font-light text-slate-400">Speak</span>
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-500">Pronto para interagir?</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100 sm:p-8">
            <div className="space-y-4">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="Código da sala"
                  className="w-full rounded-2xl border-0 bg-slate-50 py-4 pl-12 pr-4 text-lg font-bold tracking-widest text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 hover:bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600"
                />
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <UserCircle className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome (opcional)"
                  className="w-full rounded-2xl border-0 bg-slate-50 py-4 pl-12 pr-4 text-base font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 hover:bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600"
                />
              </div>
              <button
                onClick={() => onJoin(name, code)}
                disabled={loading || code.trim().length < 6}
                className="mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 text-lg font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
                Entrar na Sessão
              </button>
            </div>
          </div>
        </section>

        {!isMobile && (
          <>
            {/* Separador Mobile */}
            <div className="my-16 flex items-center gap-4 lg:hidden">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ou crie uma</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            {/* Lado Direito: Dashboard do Host */}
            <section className="w-full lg:w-7/12 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/8">

                {/* Panel header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                      <LayoutTemplate className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight text-white">Criar Apresentação</h3>
                      <p className="text-xs font-medium text-slate-400">Configure seus slides interativos</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-black tracking-wide text-indigo-200 ring-1 ring-white/15">
                    {slides.length} slide{slides.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Panel body */}
                <div className="bg-slate-50 px-7 pt-6 pb-0">

                  {/* Title */}
                  <div className="relative mb-6">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Título</label>
                    <div className="relative">
                      <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Nome da sua apresentação"
                        className="w-full rounded-xl border-0 bg-white py-3.5 pl-11 pr-4 text-base font-bold text-slate-900 outline-none shadow-sm ring-1 ring-inset ring-slate-200 transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-500">Slides</label>

                  {/* Slide type color map */}
                  {(() => {
                    const TYPE_META = {
                      multiple_choice: { label: 'Múltipla Escolha', short: 'Múltipla', icon: '📊', accent: 'indigo' },
                      word_cloud:      { label: 'Nuvem de Palavras', short: 'Nuvem',    icon: '☁️', accent: 'sky'    },
                      open_text:       { label: 'Texto Livre',       short: 'Q&A',       icon: '💬', accent: 'emerald'},
                      [TEAM_SELECTION_TYPE]: { label: 'Times', short: 'Times', icon: '👥', accent: 'violet' },
                      [STRUCTURAL_FORM_TYPE]: { label: 'Formulário Estrutural', short: 'Estrutural', icon: '📋', accent: 'teal' },
                    }
                    const ACCENT_CLASSES = {
                      indigo:  { strip: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700', ring: 'focus:ring-indigo-500', btn: 'bg-indigo-600 text-white shadow-sm shadow-indigo-300', btnOff: 'bg-slate-100 text-slate-500 hover:bg-slate-200', hint: 'text-indigo-400' },
                      sky:     { strip: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-700',       ring: 'focus:ring-sky-500',    btn: 'bg-sky-500 text-white shadow-sm shadow-sky-300',    btnOff: 'bg-slate-100 text-slate-500 hover:bg-slate-200', hint: 'text-sky-400' },
                      emerald: { strip: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700',ring: 'focus:ring-emerald-500',btn: 'bg-emerald-600 text-white shadow-sm shadow-emerald-300',btnOff: 'bg-slate-100 text-slate-500 hover:bg-slate-200', hint: 'text-emerald-400' },
                      violet:  { strip: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700', ring: 'focus:ring-violet-500', btn: 'bg-violet-600 text-white shadow-sm shadow-violet-300', btnOff: 'bg-slate-100 text-slate-500 hover:bg-slate-200', hint: 'text-violet-400' },
                      teal:    { strip: 'bg-teal-500',    badge: 'bg-teal-100 text-teal-700',     ring: 'focus:ring-teal-500',   btn: 'bg-teal-600 text-white shadow-sm shadow-teal-300',   btnOff: 'bg-slate-100 text-slate-500 hover:bg-slate-200', hint: 'text-teal-400' },
                    }
                    const OPTION_LABELS = 'ABCDEFGHIJ'
                    return (
                      <div className="space-y-3">
                        {slides.map((slide, slideIndex) => {
                          const meta = TYPE_META[slide.type] ?? TYPE_META.multiple_choice
                          const ac = ACCENT_CLASSES[meta.accent]
                          return (
                            <article key={slide.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
                              {/* Colored accent strip */}
                              <div className={`h-1 w-full ${ac.strip}`} />

                              <div className="p-5">
                                {/* Card header */}
                                <div className="mb-3 flex items-center gap-2">
                                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-black ${ac.badge}`}>
                                    {slideIndex + 1}
                                  </span>

                                  {/* Type picker pills */}
                                  <div className="flex flex-1 flex-wrap gap-1">
                                    {Object.entries(TYPE_META).map(([value, t]) => {
                                      const tAc = ACCENT_CLASSES[t.accent]
                                      const isActive = slide.type === value
                                      return (
                                        <button
                                          key={value}
                                          type="button"
                                          onClick={() => updateSlide(slide.id, {
                                            type: value,
                                            options: value === 'multiple_choice' ? (slide.options?.length ? slide.options : ['', '']) : [],
                                            teams: value === TEAM_SELECTION_TYPE ? (slide.teams?.length ? slide.teams : getDefaultTeamSelectionTeams()) : [],
                                            minContributionLength: value === STRUCTURAL_FORM_TYPE ? (slide.minContributionLength ?? STRUCTURAL_MIN_CONTRIBUTION_CHARS) : undefined,
                                            transversalityOptions: value === STRUCTURAL_FORM_TYPE
                                              ? (slide.transversalityOptions?.length ? slide.transversalityOptions : [...STRUCTURAL_TRANSVERSALITY_OPTIONS])
                                              : [],
                                            pillarOptions: value === STRUCTURAL_FORM_TYPE
                                              ? (slide.pillarOptions?.length ? slide.pillarOptions : [...STRUCTURAL_PILLAR_OPTIONS])
                                              : [],
                                          })}
                                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${isActive ? tAc.btn : tAc.btnOff}`}
                                        >
                                          <span>{t.icon}</span>
                                          <span>{t.short}</span>
                                        </button>
                                      )
                                    })}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeSlide(slide.id)}
                                    disabled={slides.length <= 1}
                                    className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-25"
                                    title="Remover slide"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Question input */}
                                <textarea
                                  value={slide.question}
                                  onChange={(event) => updateSlide(slide.id, { question: event.target.value })}
                                  placeholder="Qual é a sua pergunta?"
                                  rows={2}
                                  className={`w-full resize-none rounded-lg border-0 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset ${ac.ring}`}
                                />

                                {/* Multiple choice options */}
                                {slide.type === 'multiple_choice' && (
                                  <div className="mt-3 space-y-1.5">
                                    {(slide.options ?? []).map((option, optionIndex) => (
                                      <div key={`${slide.id}-opt-${optionIndex}`} className="flex items-center gap-2">
                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-black ${ac.badge}`}>
                                          {OPTION_LABELS[optionIndex] ?? optionIndex + 1}
                                        </span>
                                        <input
                                          value={option}
                                          onChange={(event) => {
                                            updateSlide(slide.id, (s) => ({
                                              ...s,
                                              options: (s.options ?? []).map((item, i) => i === optionIndex ? event.target.value : item),
                                            }))
                                          }}
                                          placeholder={`Opção ${OPTION_LABELS[optionIndex] ?? optionIndex + 1}`}
                                          className={`w-full rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset ${ac.ring}`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeOption(slide.id, optionIndex)}
                                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-all hover:bg-rose-50 hover:text-rose-500"
                                          title="Remover opção"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => addOption(slide.id)}
                                      className={`mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${ac.badge} bg-opacity-60 hover:bg-opacity-100`}
                                    >
                                      <Plus className="h-3 w-3" /> Adicionar opção
                                    </button>
                                  </div>
                                )}

                                  {/* Team selection */}
                                  {slide.type === TEAM_SELECTION_TYPE && (
                                    <div className="mt-3 space-y-1.5">
                                      {(slide.teams ?? []).map((team, teamIndex) => (
                                        <div
                                          key={team.id ?? `${slide.id}-team-${teamIndex}`}
                                          className="grid grid-cols-[minmax(0,1fr)_96px_auto] items-center gap-2"
                                        >
                                          <input
                                            value={team.name}
                                            onChange={(event) => {
                                              updateSlide(slide.id, (s) => ({
                                                ...s,
                                                teams: (s.teams ?? []).map((item, i) => i === teamIndex ? { ...item, name: event.target.value } : item),
                                              }))
                                            }}
                                            placeholder={`Time ${teamIndex + 1}`}
                                            className={`w-full rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset ${ac.ring}`}
                                          />
                                          <div className="relative">
                                            <input
                                              type="number"
                                              min="1"
                                              max={MAX_TEAM_CAPACITY}
                                              inputMode="numeric"
                                              value={team.capacity}
                                              onChange={(event) => {
                                                updateSlide(slide.id, (s) => ({
                                                  ...s,
                                                  teams: (s.teams ?? []).map((item, i) => i === teamIndex ? { ...item, capacity: event.target.value } : item),
                                                }))
                                              }}
                                              placeholder="Vagas"
                                              className={`w-full rounded-lg border-0 bg-slate-50 px-3 py-2 pr-10 text-sm font-bold text-slate-700 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset ${ac.ring}`}
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[10px] font-bold text-slate-400">vgs</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removeTeam(slide.id, teamIndex)}
                                            disabled={(slide.teams ?? []).length <= 2}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-all hover:bg-rose-50 hover:text-rose-500 disabled:opacity-25 disabled:hover:bg-transparent"
                                            title="Remover time"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => addTeam(slide.id)}
                                        className={`mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${ac.badge} bg-opacity-60 hover:bg-opacity-100`}
                                      >
                                        <Plus className="h-3 w-3" /> Adicionar time
                                      </button>
                                    </div>
                                  )}

                                  {/* Structural form */}
                                  {slide.type === STRUCTURAL_FORM_TYPE && (
                                    <div className="mt-3 space-y-3">
                                      <div className="rounded-lg bg-teal-50 px-4 py-3 text-xs font-medium text-teal-700 ring-1 ring-teal-200/50">
                                        Os participantes preencherão nome, email, instituição, transversalidades, pilares e contribuição com mínimo de caracteres.
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                                          Transversalidades ({STRUCTURAL_TRANSVERSALITY_COUNT})
                                        </p>
                                        {(slide.transversalityOptions?.length
                                          ? slide.transversalityOptions
                                          : STRUCTURAL_TRANSVERSALITY_OPTIONS).map((option, optionIndex) => (
                                          <div key={`${slide.id}-transv-${optionIndex}`} className="flex items-center gap-2">
                                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-black ${ac.badge}`}>
                                              {optionIndex + 1}
                                            </span>
                                            <input
                                              value={option}
                                              onChange={(event) =>
                                                updateStructuralOption(slide.id, 'transversalityOptions', optionIndex, event.target.value)
                                              }
                                              placeholder={`Transversalidade ${optionIndex + 1}`}
                                              className={`w-full rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset ${ac.ring}`}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                                          Pilares ({STRUCTURAL_PILLAR_COUNT})
                                        </p>
                                        {(slide.pillarOptions?.length
                                          ? slide.pillarOptions
                                          : STRUCTURAL_PILLAR_OPTIONS).map((option, optionIndex) => (
                                          <div key={`${slide.id}-pillar-${optionIndex}`} className="flex items-center gap-2">
                                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-black ${ac.badge}`}>
                                              {optionIndex + 1}
                                            </span>
                                            <input
                                              value={option}
                                              onChange={(event) =>
                                                updateStructuralOption(slide.id, 'pillarOptions', optionIndex, event.target.value)
                                              }
                                              placeholder={`Pilar ${optionIndex + 1}`}
                                              className={`w-full rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset ${ac.ring}`}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Mín. caracteres (contribuição):</label>
                                        <input
                                          type="number"
                                          min="10"
                                          max="600"
                                          value={slide.minContributionLength ?? STRUCTURAL_MIN_CONTRIBUTION_CHARS}
                                          onChange={(event) => {
                                            updateSlide(slide.id, { minContributionLength: Number(event.target.value) })
                                          }}
                                          className="w-24 rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none ring-1 ring-inset ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-inset focus:ring-teal-500"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Hint for word cloud / open text */}
                                {(slide.type === 'word_cloud' || slide.type === 'open_text') && (
                                  <p className={`mt-2.5 text-xs font-medium ${ac.hint}`}>
                                    {slide.type === 'word_cloud'
                                      ? 'Os participantes enviam palavras que aparecem em nuvem ao vivo.'
                                      : 'Os participantes escrevem respostas livres visíveis em tempo real.'}
                                  </p>
                                )}
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    )
                  })()}

                  <div className="sticky bottom-0 -mx-7 mt-4 flex flex-col gap-2.5 bg-slate-50/95 px-7 py-5 shadow-[0_-1px_0_0_rgba(15,23,42,0.06)] backdrop-blur-sm sm:flex-row">
                    <button
                      type="button"
                      onClick={addSlide}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-white py-3 text-sm font-bold text-indigo-600 transition-all hover:border-indigo-400 hover:bg-indigo-50"
                    >
                      <Plus className="h-4 w-4" /> Novo Slide
                    </button>
                    <button
                      onClick={onCreatePresentation}
                      disabled={loading}
                      className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/50 disabled:pointer-events-none disabled:opacity-60"
                    >
                      {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <MonitorPlay className="h-5 w-5" />}
                      Lançar Apresentação
                    </button>
                  </div>
                </div>

                {sessions.length > 0 && (
                  <div className="bg-white px-7 py-6">
                    <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                      <History className="h-3.5 w-3.5" /> Apresentações salvas
                    </h4>
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {sessions.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition-all hover:bg-white hover:shadow-sm">
                          <div className="truncate pr-4">
                            <div className="truncate text-sm font-bold text-slate-800">{item.title || 'Sessão sem título'}</div>
                            <div className="mt-0.5 font-mono text-[11px] text-slate-400">#{item.code || item.id}</div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEnterSaved(item.code || item.id)}
                              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
                            >
                              Entrar
                            </button>
                            {onExportSaved && (
                              <button
                                type="button"
                                onClick={() => onExportSaved(item.code || item.id, item)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                                title="Exportar relatório PDF"
                              >
                                <FileDown className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteSaved(item.code || item.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Apagar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

const isMobileViewport = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 1023px)').matches
}

function HostView({
  session,
  currentSlide,
  responses,
  reactions,
  onNext,
  onPrevious,
  canGoBack,
  canGoForward,
  connectedParticipants,
  onExportReport,
}) {
  const joinUrl = useMemo(() => getJoinUrl(session.code), [session.code])
  const [teamReportModal, setTeamReportModal] = useState(null)
  const [showFullScreenQr, setShowFullScreenQr] = useState(false)
  const [copyStatus, setCopyStatus] = useState('Copiar link')

  const teamSelectionStats = useMemo(() => {
    if (!currentSlide || currentSlide.type !== TEAM_SELECTION_TYPE) return []
    return buildTeamSelectionStats(currentSlide, responses)
  }, [currentSlide, responses])

  const multipleChoiceStats = useMemo(() => {
    if (!currentSlide || currentSlide.type !== 'multiple_choice') return []
    const counts = new Map(currentSlide.options.map((option) => [option, 0]))
    responses.forEach((entry) => {
      if (entry.value && counts.has(entry.value)) {
        counts.set(entry.value, counts.get(entry.value) + 1)
      }
    })
    return currentSlide.options.map((option) => ({ option, count: counts.get(option) ?? 0 }))
  }, [currentSlide, responses])

  const wordCloudData = useMemo(() => {
    if (!currentSlide || currentSlide.type !== 'word_cloud') return { words: [] }

    const counts = {}
    responses.forEach((entry) => {
      const key = normalizeText(entry.value || '').toLowerCase()
      if (key) counts[key] = (counts[key] ?? 0) + 1
    })

    const topWords = Object.entries(counts)
      .map(([word, count]) => ({ text: word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40)

    if (topWords.length === 0) return { words: [] }

    const maxCount = topWords[0].count

    return {
      words: topWords.map((item, index) => {
        const ratio = item.count / maxCount
        const size = Math.round(18 + ratio * 26 + Math.min(item.count, 4))

        return {
          ...item,
          fontSize: Math.min(size, 52),
          rotate: index % 7 === 0 ? 90 : 0,
          color: palette[index % palette.length],
          opacity: 0.76 + ratio * 0.24,
          size,
        }
      }),
    }
  }, [currentSlide, responses])

  const structuralFormResponses = useMemo(() => {
    if (!currentSlide || currentSlide.type !== STRUCTURAL_FORM_TYPE) return []
    const minChars = getStructuralMinChars(currentSlide)
    const byParticipant = new Map()
    responses.forEach((entry) => {
      const validation = validateStructuralFormPayload(entry.value ?? {}, minChars, {
        transversalityOptions: getStructuralTransversalityOptions(currentSlide),
        pillarOptions: getStructuralPillarOptions(currentSlide),
      })
      if (!validation.isValid) return
      byParticipant.set(entry.participantId ?? entry.id, {
        id: entry.id,
        participantId: entry.participantId,
        ...validation.payload,
      })
    })
    return Array.from(byParticipant.values())
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [currentSlide, responses])

  const responseCount = currentSlide?.type === TEAM_SELECTION_TYPE
    ? teamSelectionStats.reduce((total, team) => total + team.count, 0)
    : currentSlide?.type === STRUCTURAL_FORM_TYPE
      ? structuralFormResponses.length
      : responses.length

  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-slate-900" style={{ backgroundColor: '#fafafa' }}>
      <div className="absolute left-0 right-0 top-1 z-10 flex justify-center px-4 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-5 rounded-[2rem] bg-white/80 p-3 pr-8 shadow-2xl shadow-blue-900/10 backdrop-blur-xl ring-1 ring-slate-900/5 transition-all hover:bg-white/95">
          <div className="relative flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-inner ring-1 ring-slate-100">
            <QRCodeSVG value={joinUrl} size={120} bgColor="transparent" fgColor="#0f172a" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Ao Vivo</span>
            </div>
            <div className="mt-1 text-slate-600">
              Acesse <strong className="font-bold text-slate-900">cloudspeak.netlify.app</strong> e use o código:
            </div>
            <div className="mt-0.5 text-3xl font-black tracking-[0.2em] text-blue-600 drop-shadow-sm">
              {session.code}
            </div>
          </div>
          <button
            onClick={() => setShowFullScreenQr(true)}
            className="ml-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
            title="Tela cheia do QR code"
            aria-label="Tela cheia do QR code"
          >
            <Maximize2 className="h-6 w-6" />
          </button>
        </div>
      </div>
      {showFullScreenQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6">
          <div className="relative flex h-full w-full max-h-[calc(100vh-3rem)] flex-col items-center overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-50 p-8 text-slate-900 shadow-[0_35px_80px_rgba(15,23,42,0.12)] sm:max-w-5xl">
            <button
              onClick={() => setShowFullScreenQr(false)}
              className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm transition hover:bg-slate-100"
              title="Fechar tela cheia"
              aria-label="Fechar tela cheia"
            >
              <Minimize2 className="h-6 w-6" />
            </button>
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 px-4 py-10 text-center">
              <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/80 ring-1 ring-slate-200">
                <QRCodeSVG value={joinUrl} size={260} bgColor="transparent" fgColor="#0f172a" />
              </div>
              <div className="max-w-2xl space-y-4">
                <div className="text-sm font-semibold uppercase tracking-[0.36em] text-slate-500">Participe agora</div>
                <div className="text-5xl font-black uppercase tracking-[0.35em] text-slate-900 sm:text-6xl">
                  {session.code}
                </div>
                <p className="text-lg leading-8 text-slate-600">
                  Abra <span className="font-semibold text-slate-900">cloudspeak.netlify.app</span>, digite o código acima e entre na sessão.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(joinUrl)
                      setCopyStatus('Link copiado!')
                      window.setTimeout(() => setCopyStatus('Copiar link'), 2000)
                    } catch {
                      setCopyStatus('Erro ao copiar')
                      window.setTimeout(() => setCopyStatus('Copiar link'), 2000)
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-base font-bold text-white transition hover:bg-slate-800"
                >
                  {copyStatus}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 pb-32 pt-40 text-center animate-in fade-in zoom-in-95 duration-500">
        <h1 className="mb-16 max-w-5xl text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl lg:text-7xl drop-shadow-sm">
          {currentSlide?.question}
        </h1>

        <div className="w-full max-w-4xl flex-1">
          {currentSlide?.type === 'multiple_choice' && (
            <div className="flex w-full flex-col gap-6">
              {multipleChoiceStats.map((entry, index) => {
                const percent = responseCount ? Math.round((entry.count / responseCount) * 100) : 0
                const color = palette[index % palette.length]
                return (
                  <div key={entry.option} className="relative w-full">
                    <div className="mb-3 flex justify-between px-2 text-xl font-bold text-slate-700">
                      <span>{entry.option}</span>
                      <span className="text-slate-400">{entry.count > 0 ? `${percent}% (${entry.count})` : ''}</span>
                    </div>
                    <div className="relative h-16 w-full overflow-hidden rounded-2xl bg-white/50 shadow-inner ring-1 ring-slate-200/50 backdrop-blur-sm">
                      <div
                        className="absolute bottom-0 left-0 top-0 rounded-2xl transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.max(percent, 1.5)}%`,
                          backgroundColor: color,
                          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.05) 100%)',
                          boxShadow: `0 4px 14px 0 ${color}40`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {currentSlide?.type === 'word_cloud' && (
            <WordCloudCanvas words={wordCloudData.words} />
          )}

          {currentSlide?.type === TEAM_SELECTION_TYPE && (
            <div className="grid gap-6 text-left md:grid-cols-2 xl:grid-cols-2">
              {teamSelectionStats.map((team, index) => {
                const fillPercent = team.capacity > 0 ? Math.min(Math.round((team.count / team.capacity) * 100), 100) : 0
                const color = palette[index % palette.length]

                return (
                  <article
                    key={team.id ?? team.name}
                    className="rounded-[2rem] border border-white/50 bg-white/75 p-7 shadow-xl shadow-slate-200/50 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">{team.name}</h3>
                        <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                          {team.count} de {team.capacity} vagas ocupadas
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 text-xs font-black uppercase tracking-[0.18em] d-flex flex"
                        style={{
                          color,
                          backgroundColor: `${color}18`,
                        }}
                      >
                        {team.isFull ? 'Lotado' : `${team.spotsLeft} vaga${team.spotsLeft === 1 ? '' : 's'}`}
                      </span>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(fillPercent, team.count > 0 ? 8 : 0)}%`,
                          backgroundColor: color,
                          boxShadow: `0 0 20px ${color}55`,
                        }}
                      />
                    </div>

                    {team.members.length > 0 && (
                      <button
                        onClick={() => setTeamReportModal(team)}
                        className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.15em] transition-colors"
                        style={{ color, backgroundColor: `${color}18` }}
                      >
                        Ver participantes ({team.count})
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {currentSlide?.type === STRUCTURAL_FORM_TYPE && (
            <div className="space-y-4 text-left">
              {structuralFormResponses.length === 0 && (
                <div className="mt-10 text-center text-2xl font-bold text-slate-400">
                  Aguardando respostas...
                </div>
              )}
              {structuralFormResponses.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[2rem] border border-white/50 bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-sm font-black text-white">
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-black text-slate-900">{entry.name}</p>
                        <p className="text-sm font-medium text-slate-500">{entry.email}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.institution}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-black uppercase tracking-wider text-teal-600">Transversalidades</p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.transversalities.map((t) => (
                          <span key={t} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 ring-1 ring-teal-200/50">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-black uppercase tracking-wider text-indigo-600">Pilares</p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.pillars.map((p) => (
                          <span key={p} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200/50">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/50">
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">{entry.contributions}</p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {currentSlide?.type === 'open_text' && (
            <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3 text-left">
              {responses.length === 0 && (
                <div className="col-span-full mt-10 text-center text-2xl font-bold text-slate-400">
                  Aguardando respostas...
                </div>
              )}
              {responses.map((entry) => (
                <article
                  key={entry.id}
                  className="break-inside-avoid rounded-[2rem] border border-white/50 bg-white/70 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white"
                >
                  <MessageSquareText className="mb-4 h-8 w-8 text-blue-400 opacity-50" />
                  <p className="text-2xl font-bold text-slate-800 leading-snug">{entry.value}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
                    <span className="text-sm font-black uppercase tracking-wider text-slate-400">
                      {entry.participantName || 'Anônimo'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900/90 p-2.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all hover:bg-slate-900">
        <button
          onClick={onPrevious}
          disabled={!canGoBack}
          className="group rounded-full p-3 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-7 w-7 transition-transform group-hover:-translate-x-1" />
        </button>
        <div className="flex h-10 items-center justify-center rounded-full bg-white/10 px-5 font-bold text-white shadow-inner">
          {session.currentSlideIndex + 1} / {session.slides.length}
        </div>
        <button
          onClick={onNext}
          disabled={!canGoForward}
          className="group rounded-full p-3 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-7 w-7 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="fixed bottom-10 left-10 flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 font-bold text-slate-600 shadow-lg backdrop-blur-md ring-1 ring-slate-900/5">
        <Users className="h-6 w-6 text-blue-500" />
        <span className="text-xl">{connectedParticipants}</span>
      </div>
      <div className="fixed bottom-10 right-10 flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 font-bold text-slate-600 shadow-lg backdrop-blur-md ring-1 ring-slate-900/5">
        <BarChart3 className="h-6 w-6 text-rose-500" />
        <span className="text-xl">{responseCount}</span>
      </div>

      {onExportReport && (
        <button
          onClick={onExportReport}
          title="Exportar relatório PDF"
          className="fixed bottom-28 right-10 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-700 ring-1 ring-white/10"
        >
          <FileDown className="h-5 w-5" />
          <span className="text-sm font-black tracking-wide">Exportar PDF</span>
        </button>
      )}

      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {reactions.map((reaction) => {
          const isHeart = reaction.type === 'heart'
          const isThumb = reaction.type === 'thumb'
          const iconClassName = isHeart
            ? 'h-16 w-16 fill-rose-500 text-rose-500 drop-shadow-xl'
            : isThumb
              ? 'h-16 w-16 fill-blue-500 text-blue-500 drop-shadow-xl'
              : 'h-16 w-16 fill-amber-400 text-slate-900 drop-shadow-xl'
          return (
            <div
              key={reaction.id}
              className="absolute bottom-0 animate-float-up opacity-0"
              style={{ left: `${reaction.left}%` }}
            >
              <div className="relative">
                {isHeart && <Heart className={iconClassName} />}
                {isThumb && <ThumbsUp className={iconClassName} />}
                {!isHeart && !isThumb && <HelpCircle className={iconClassName} />}
                <span className="reaction-pop-burst" />
                <span className="reaction-pop-spark reaction-pop-spark-1" />
                <span className="reaction-pop-spark reaction-pop-spark-2" />
                <span className="reaction-pop-spark reaction-pop-spark-3" />
                <span className="reaction-pop-spark reaction-pop-spark-4" />
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(100px) scale(0.5); opacity: 0; }
          12% { opacity: 1; transform: translateY(40px) scale(1.2); }
          38% { transform: translateY(-220px) scale(1) rotate(6deg); }
          62% { transform: translateY(-460px) scale(1.1) rotate(-6deg); }
          80% { transform: translateY(-620px) scale(1.2) rotate(10deg); opacity: 1; }
          88% { transform: translateY(-760px) scale(1.1) rotate(14deg); opacity: 1; }
          93% { transform: translateY(-780px) scale(1.9) rotate(16deg); opacity: 1; }
          100% { transform: translateY(-790px) scale(0.08) rotate(16deg); opacity: 0; }
        }

        @keyframes pop-burst {
          0%, 88% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          92% { opacity: 0.95; transform: translate(-50%, -50%) scale(1.15); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.85); }
        }

        @keyframes pop-spark {
          0%, 89% { opacity: 0; transform: translate(0, 0) scale(0.2); }
          93% { opacity: 1; transform: var(--spark-end) scale(1); }
          100% { opacity: 0; transform: var(--spark-fade) scale(0.2); }
        }

        .animate-float-up {
          animation: float-up 4.2s ease-out forwards;
        }

        .reaction-pop-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.95);
          border-radius: 9999px;
          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.8));
          animation: pop-burst 4.2s ease-out forwards;
        }

        .reaction-pop-spark {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 3px;
          margin-left: -4px;
          margin-top: -1.5px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.98);
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
          animation: pop-spark 4.2s ease-out forwards;
        }

        .reaction-pop-spark-1 {
          --spark-end: translate(-22px, -14px) rotate(-25deg);
          --spark-fade: translate(-34px, -22px) rotate(-25deg);
        }

        .reaction-pop-spark-2 {
          --spark-end: translate(20px, -17px) rotate(18deg);
          --spark-fade: translate(32px, -27px) rotate(18deg);
        }

        .reaction-pop-spark-3 {
          --spark-end: translate(-16px, 18px) rotate(148deg);
          --spark-fade: translate(-28px, 30px) rotate(148deg);
        }

        .reaction-pop-spark-4 {
          --spark-end: translate(18px, 16px) rotate(36deg);
          --spark-fade: translate(30px, 28px) rotate(36deg);
        }
      `}</style>

      {teamReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setTeamReportModal(null)}
        >
          <div
            className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{teamReportModal.name}</h2>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  {teamReportModal.count} de {teamReportModal.capacity} participantes
                </p>
              </div>
              <button
                onClick={() => setTeamReportModal(null)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {teamReportModal.members.map((member, idx) => (
                <div
                  key={`${teamReportModal.name}-${member.participantId}`}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ backgroundColor: palette[teamReportModal._colorIndex ?? 0] }}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-base font-bold text-slate-800">{member.participantName}</span>
                  <span className="ml-auto text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                    confirmado
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ParticipantView({ session, currentSlide, responses, participantResponse, onSubmit, onReact, sending, participantName: initialParticipantName = '' }) {
  const [value, setValue] = useState('')
  const [hasSubmittedThisSlide, setHasSubmittedThisSlide] = useState(false)
  const [submittedValue, setSubmittedValue] = useState('')
  const [localValidationError, setLocalValidationError] = useState('')

  const [structuralForm, setStructuralForm] = useState({
    name: '',
    email: '',
    institution: '',
    transversalities: [],
    pillars: [],
    contributions: '',
  })

  const teamSelectionStats = useMemo(() => {
    if (!currentSlide || currentSlide.type !== TEAM_SELECTION_TYPE) return []
    return buildTeamSelectionStats(currentSlide, responses)
  }, [currentSlide, responses])

  useEffect(() => {
    if (currentSlide?.type === 'word_cloud') {
      setHasSubmittedThisSlide(false)
      setSubmittedValue('')
      return
    }

    if (participantResponse) {
      setHasSubmittedThisSlide(true)
      if (currentSlide?.type === STRUCTURAL_FORM_TYPE) {
        const raw = participantResponse.value ?? {}
        setSubmittedValue(raw.name ?? '')
        setStructuralForm({
          name: raw.name ?? '',
          email: raw.email ?? '',
          institution: raw.institution ?? '',
          transversalities: Array.isArray(raw.transversalities) ? raw.transversalities : [],
          pillars: Array.isArray(raw.pillars) ? raw.pillars : [],
          contributions: raw.contributions ?? '',
        })
      } else {
        setSubmittedValue(participantResponse.value ?? '')
      }
      return
    }

    setHasSubmittedThisSlide(false)
    setSubmittedValue('')
    if (currentSlide?.type === STRUCTURAL_FORM_TYPE) {
      setStructuralForm({
        name: initialParticipantName || '',
        email: '',
        institution: '',
        transversalities: [],
        pillars: [],
        contributions: '',
      })
    }
    setLocalValidationError('')
  }, [currentSlide?.id, currentSlide?.type, participantResponse, initialParticipantName])

  const submit = async (event, predefinedValue) => {
    event?.preventDefault()

    if (currentSlide?.type === STRUCTURAL_FORM_TYPE) {
      const minChars = getStructuralMinChars(currentSlide)
      const validation = validateStructuralFormPayload(structuralForm, minChars, {
        transversalityOptions: getStructuralTransversalityOptions(currentSlide),
        pillarOptions: getStructuralPillarOptions(currentSlide),
      })
      if (!validation.isValid) {
        setLocalValidationError(validation.error)
        return
      }
      setLocalValidationError('')
      const didSubmit = await onSubmit(validation.payload)
      if (!didSubmit) return
      setHasSubmittedThisSlide(true)
      setSubmittedValue(validation.payload.name)
      return
    }

    const finalValue = predefinedValue ?? value
    if (!finalValue.trim()) return

    const didSubmit = await onSubmit(finalValue)
    if (!didSubmit) return

    setHasSubmittedThisSlide(true)
    setSubmittedValue(finalValue)
    if (!predefinedValue) setValue('')
  }

  const toggleStructuralOption = (field, option) => {
    setStructuralForm((prev) => {
      const current = prev[field]
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
      return { ...prev, [field]: next }
    })
    setLocalValidationError('')
  }

  const showSubmittedState = currentSlide?.type !== 'word_cloud' && hasSubmittedThisSlide

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/50 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center">
            <img
              src="/Secti_Vertical.png"
              alt="Secti logo"
              className="h-8 w-auto mt-2"
            />          </div>
          <h1 className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
            SECTI<span className="font-light text-slate-400">Speak</span>
          </h1>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black tracking-widest text-slate-500">
          SALA {session.code}
        </div>
      </header>

      <main className="flex-1 px-5 py-8 md:py-16">
        <div className="mx-auto w-full max-w-lg animate-in fade-in slide-in-from-bottom-4">
          <h1 className="mb-10 text-3xl font-black leading-tight tracking-tight text-slate-900 drop-shadow-sm md:text-4xl">
            {currentSlide?.question}
          </h1>

          {showSubmittedState ? (
            currentSlide?.type === TEAM_SELECTION_TYPE ? (
              <div className="mt-12 flex flex-col items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 p-10 text-center text-white shadow-xl shadow-cyan-500/25">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-100">vaga confirmada</p>
                <h3 className="mt-3 text-3xl font-black tracking-tight">{submittedValue}</h3>
                <p className="mt-3 text-lg font-medium text-cyan-50">
                  Sua escolha foi registrada. O apresentador já consegue ver em qual clube você está.
                </p>
              </div>
            ) : currentSlide?.type === STRUCTURAL_FORM_TYPE ? (
              <div className="mt-12 flex flex-col items-center justify-center rounded-[2rem] bg-gradient-to-br from-teal-500 to-emerald-600 p-10 text-center text-white shadow-xl shadow-teal-500/25">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                  <ClipboardList className="h-10 w-10 text-white" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-teal-100">formulário enviado</p>
                <h3 className="mt-3 text-3xl font-black tracking-tight">Obrigado, {submittedValue}!</h3>
                <p className="mt-3 text-lg font-medium text-teal-50">
                  Suas respostas foram registradas com sucesso.
                </p>
              </div>
            ) : (
              <div className="mt-12 flex flex-col items-center justify-center rounded-[2rem] bg-gradient-to-br from-green-400 to-emerald-600 p-10 text-center text-white shadow-xl shadow-green-500/20">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">Enviado!</h3>
                <p className="mt-3 text-lg font-medium text-green-50">Olhe para a tela principal para ver os resultados ao vivo.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {currentSlide?.type === 'multiple_choice' &&
                currentSlide.options.map((option) => (
                  <button
                    key={option}
                    onClick={(event) => submit(event, option)}
                    disabled={sending}
                    className="group relative w-full overflow-hidden rounded-[1.5rem] bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:ring-blue-500 active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className="relative z-10 text-xl font-bold text-slate-800 transition-colors group-hover:text-blue-700">
                      {option}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}

              {currentSlide?.type === TEAM_SELECTION_TYPE && (
                <div className="space-y-4">
                  {teamSelectionStats.map((team, index) => {
                    const color = palette[index % palette.length]
                    const isDisabled = sending || team.isFull

                    return (
                      <button
                        key={team.id ?? team.name}
                        onClick={(event) => submit(event, team.name)}
                        disabled={isDisabled}
                        className="group relative w-full overflow-hidden rounded-[1.75rem] bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:ring-blue-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                      >
                        <div className="relative z-10 flex items-start justify-between gap-4">
                          <div>
                            <span className="text-2xl font-black text-slate-800 transition-colors group-hover:text-blue-700">
                              {team.name}
                            </span>
                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              {team.isFull
                                ? 'Todas as vagas foram preenchidas.'
                                : `${team.spotsLeft} vaga${team.spotsLeft === 1 ? '' : 's'} restante${team.spotsLeft === 1 ? '' : 's'}`}
                            </p>
                          </div>
                          <div
                            className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]"
                            style={{
                              color,
                              backgroundColor: `${color}18`,
                            }}
                          >
                            {team.count}/{team.capacity}
                          </div>
                        </div>
                        <div className="relative z-10 mt-5 h-3 overflow-hidden rounded-full bg-slate-200/80">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${team.capacity > 0 ? Math.max(Math.round((team.count / team.capacity) * 100), team.count > 0 ? 8 : 0) : 0}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )
                  })}
                </div>
              )}

              {currentSlide?.type === 'word_cloud' && (
                <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                  <div className="relative">
                    <input
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      maxLength={25}
                      placeholder="Digite sua ideia..."
                      className="w-full rounded-2xl bg-slate-50 px-6 py-5 text-xl font-bold text-slate-800 outline-none ring-2 ring-transparent transition-all placeholder:text-slate-400 focus:bg-white focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !value.trim()}
                    className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-xl font-black text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {sending ? 'Enviando...' : 'Enviar Palavra'}
                  </button>
                  {hasSubmittedThisSlide && (
                    <p className="pt-2 text-center text-sm font-bold text-green-600">
                      ✓ Enviado! Mande mais palavras se quiser.
                    </p>
                  )}
                </form>
              )}

              {currentSlide?.type === 'open_text' && (
                <form onSubmit={submit} className="space-y-4">
                  <div className="relative rounded-[2rem] bg-white p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <textarea
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      maxLength={250}
                      placeholder="Escreva sua pergunta ou comentário aqui..."
                      className="h-40 w-full resize-none rounded-2xl bg-slate-50 px-6 py-5 text-xl font-medium text-slate-800 outline-none ring-2 ring-transparent transition-all placeholder:text-slate-400 focus:bg-white focus:ring-blue-500"
                    />
                    <div className="p-2">
                      <button
                        type="submit"
                        disabled={sending || !value.trim()}
                        className="w-full rounded-2xl bg-slate-900 px-6 py-5 text-xl font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                      >
                        {sending ? 'Enviando...' : 'Enviar Resposta'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {currentSlide?.type === STRUCTURAL_FORM_TYPE && (
                <form onSubmit={submit} className="space-y-4">
                  <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Nome <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <UserCircle className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input
                            value={structuralForm.name}
                            onChange={(e) => { setStructuralForm((p) => ({ ...p, name: e.target.value })); setLocalValidationError('') }}
                            placeholder="Seu nome completo"
                            className="w-full rounded-xl border-0 bg-slate-50 py-3.5 pl-12 pr-4 text-base font-semibold text-slate-800 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Email <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={structuralForm.email}
                            onChange={(e) => { setStructuralForm((p) => ({ ...p, email: e.target.value })); setLocalValidationError('') }}
                            placeholder="seu@email.com"
                            className="w-full rounded-xl border-0 bg-slate-50 py-3.5 pl-12 pr-4 text-base font-semibold text-slate-800 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Instituição <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input
                            value={structuralForm.institution}
                            onChange={(e) => { setStructuralForm((p) => ({ ...p, institution: e.target.value })); setLocalValidationError('') }}
                            placeholder="Nome da instituição"
                            className="w-full rounded-xl border-0 bg-slate-50 py-3.5 pl-12 pr-4 text-base font-semibold text-slate-800 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Transversalidade Estrutural <span className="text-rose-500">*</span>
                        </label>
                        <p className="mb-2 text-xs text-slate-400">Selecione uma ou mais opções</p>
                        <div className="space-y-2">
                          {getStructuralTransversalityOptions(currentSlide).map((opt) => {
                            const selected = structuralForm.transversalities.includes(opt)
                            return (
                              <label
                                key={opt}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                                  selected
                                    ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                                    : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-teal-50 hover:ring-teal-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleStructuralOption('transversalities', opt)}
                                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-teal-500"
                                />
                                <span>{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Pilares <span className="text-rose-500">*</span>
                        </label>
                        <p className="mb-2 text-xs text-slate-400">Selecione um ou mais pilares</p>
                        <div className="space-y-2">
                          {getStructuralPillarOptions(currentSlide).map((opt) => {
                            const selected = structuralForm.pillars.includes(opt)
                            return (
                              <label
                                key={opt}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                                  selected
                                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                                    : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-indigo-50 hover:ring-indigo-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleStructuralOption('pillars', opt)}
                                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-500"
                                />
                                <span>{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Contribuição <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={structuralForm.contributions}
                          onChange={(e) => { setStructuralForm((p) => ({ ...p, contributions: e.target.value })); setLocalValidationError('') }}
                          placeholder={`Escreva sua contribuição (mín. ${getStructuralMinChars(currentSlide)} caracteres)`}
                          maxLength={STRUCTURAL_MAX_CONTRIBUTION_CHARS}
                          rows={4}
                          className="h-36 w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 text-base font-medium text-slate-800 outline-none ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-teal-500"
                        />
                        <div className="mt-1 flex items-center justify-between text-xs font-medium text-slate-400">
                          <span>
                            {structuralForm.contributions.trim().length} / {getStructuralMinChars(currentSlide)} mín.
                          </span>
                          <span>{STRUCTURAL_MAX_CONTRIBUTION_CHARS} máx.</span>
                        </div>
                      </div>
                    </div>

                    {localValidationError && (
                      <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-200">
                        {localValidationError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
                    >
                      {sending ? 'Enviando...' : 'Enviar Formulário'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="sticky bottom-6 mt-auto px-6 pb-safe">
        <div className="mx-auto flex max-w-xs items-center justify-around rounded-full bg-white/90 p-3 shadow-2xl shadow-slate-300/50 backdrop-blur-xl ring-1 ring-slate-200">
          <button
            onClick={() => onReact('heart')}
            className="group rounded-full p-4 transition-all hover:bg-rose-50 active:scale-90"
          >
            <Heart className="h-8 w-8 fill-rose-100 text-rose-500 transition-transform group-hover:scale-110 group-hover:fill-rose-500" />
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            onClick={() => onReact('thumb')}
            className="group rounded-full p-4 transition-all hover:bg-blue-50 active:scale-90"
          >
            <ThumbsUp className="h-8 w-8 fill-blue-100 text-blue-500 transition-transform group-hover:scale-110 group-hover:fill-blue-500" />
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            onClick={() => onReact('question')}
            className="group rounded-full p-4 transition-all hover:bg-amber-50 active:scale-90"
          >
            <HelpCircle className="h-8 w-8 fill-amber-100 text-amber-500 transition-transform group-hover:scale-110 group-hover:fill-amber-400" />
          </button>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const [role, setRole] = useState('landing')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [prefilledCode, setPrefilledCode] = useState('')
  const [sessionsList, setSessionsList] = useState([])
  const [isMobile, setIsMobile] = useState(isMobileViewport)

  const [session, setSession] = useState(null)
  const [responses, setResponses] = useState([])
  const [participants, setParticipants] = useState([])
  const [liveReactions, setLiveReactions] = useState([])
  const [sending, setSending] = useState(false)

  const participantId = useMemo(() => getParticipantId(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isMobile || role !== 'host') return
    setRole('landing')
    setError('No celular, apenas participação em apresentações está disponível.')
  }, [isMobile, role])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeFromUrl = params.get('code')?.trim().toUpperCase() ?? ''
    if (codeFromUrl) {
      setPrefilledCode(codeFromUrl)
    }
  }, [])

  useEffect(() => {
    if (!sessionCode) {
      setSession(null)
      setResponses([])
      setParticipants([])
      setLiveReactions([])
      return undefined
    }

    const sessionRef = doc(db, 'sessions', sessionCode)
    const unsubSession = onSnapshot(sessionRef, (snapshot) => {
      if (!snapshot.exists()) {
        setError('Sessão não encontrada ou finalizada.')
        setSession(null)
        setRole('landing')
        return
      }

      setSession(snapshot.data())
      setError('')
    })

    const responsesRef = query(collection(db, 'sessions', sessionCode, 'responses'), orderBy('createdAt', 'desc'))
    const unsubResponses = onSnapshot(responsesRef, (snapshot) => {
      setResponses(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        })),
      )
    })

    const participantsRef = collection(db, 'sessions', sessionCode, 'participants')
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      setParticipants(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        })),
      )
    })

    const reactionsRef = query(collection(db, 'sessions', sessionCode, 'reactions'), orderBy('createdAt', 'desc'))
    const unsubReactions = onSnapshot(reactionsRef, (snapshot) => {
      const now = Date.now()
      const active = snapshot.docs
        .map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }))
        .filter((item) => {
          const timestamp = item.createdAt?.toMillis?.() ?? now
          return now - timestamp < REACTION_LIFETIME_MS
        })
      setLiveReactions(active)
    })

    return () => {
      unsubSession()
      unsubResponses()
      unsubParticipants()
      unsubReactions()
    }
  }, [sessionCode])

  useEffect(() => {
    if (role !== 'landing') return undefined

    const sessionsRef = query(
      collection(db, 'sessions'),
      orderBy('updatedAt', 'desc'),
      limit(20),
    )

    const unsub = onSnapshot(
      sessionsRef,
      (snapshot) => {
        setSessionsList(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        )
      },
      (err) => {
        console.error('Failed to load sessions list', err)
        setError('Não foi possível carregar as apresentações antigas.')
      },
    )

    return () => unsub()
  }, [role])

  useEffect(() => {
    if (role !== 'participant' || !sessionCode) return undefined

    const participantRef = doc(db, 'sessions', sessionCode, 'participants', participantId)
    const participantDisplayName = getParticipantDisplayName(participantName)

    const syncPresence = async (includeJoinedAt = false) => {
      const payload = {
        participantId,
        participantName: participantDisplayName,
        lastSeenAt: serverTimestamp(),
      }

      if (includeJoinedAt) {
        payload.joinedAt = serverTimestamp()
      }

      try {
        await setDoc(participantRef, payload, { merge: true })
      } catch {
        setError('Não foi possível registrar sua presença na sessão.')
      }
    }

    syncPresence(true)

    const intervalId = window.setInterval(() => {
      syncPresence(false)
    }, PRESENCE_HEARTBEAT_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncPresence(false)
      }
    }

    const handleFocus = () => {
      syncPresence(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [participantId, participantName, role, sessionCode])

  const createSession = async (presentationDraft) => {
    if (isMobile) {
      setError('Criação de apresentação disponível apenas no desktop.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const title = normalizeText(presentationDraft?.title ?? '')
      const { slides, error: slidesError } = sanitizeSlides(presentationDraft?.slides)

      if (!title) {
        setError('Informe um título para a apresentação.')
        return
      }

      if (slidesError) {
        setError(slidesError)
        return
      }

      const code = generateCode()
      const payload = {
        code,
        title,
        status: 'live',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        currentSlideIndex: 0,
        slides,
      }

      await setDoc(doc(db, 'sessions', code), payload)
      setSessionCode(code)
      setRole('host')
    } catch {
      setError('Não foi possível criar a sessão agora. Confira seu Firebase/Firestore.')
    } finally {
      setLoading(false)
    }
  }

  const joinSession = async (name, codeInput) => {
    setLoading(true)
    setError('')

    try {
      const code = codeInput.trim().toUpperCase()
      const sessionRef = doc(db, 'sessions', code)
      const snapshot = await getDoc(sessionRef)

      if (!snapshot.exists()) {
        setError('Código inválido. Verifique e tente novamente.')
        return
      }

      setParticipantName(normalizeText(name))
      setSessionCode(code)
      setRole('participant')
    } catch {
      setError('Erro ao entrar na sessão. Verifique sua conexão e tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  const enterSavedSession = async (code) => {
    if (isMobile) {
      setError('Abertura como apresentador disponível apenas no desktop.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const sessionRef = doc(db, 'sessions', code)
      const snapshot = await getDoc(sessionRef)

      if (!snapshot.exists()) {
        setError('Sessão não encontrada.')
        return
      }

      setSessionCode(code)
      setRole('host')
    } catch {
      setError('Erro ao carregar a apresentação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const [deleteTargetCode, setDeleteTargetCode] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const openDeleteModal = (code) => {
    if (isMobile) {
      setError('Exclusão de apresentação disponível apenas no desktop.')
      return
    }
    setDeleteTargetCode(code)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeleteTargetCode('')
  }

  const performDeleteSession = async () => {
    if (!deleteTargetCode) return

    setLoading(true)
    setError('')

    try {
      await deleteFirestoreSession(deleteTargetCode)
      setSessionsList((prev) => prev.filter((session) => session.id !== deleteTargetCode))

      if (sessionCode === deleteTargetCode) {
        setRole('landing')
        setSessionCode('')
      }
    } catch {
      setError('Não foi possível excluir a apresentação. Tente novamente.')
    } finally {
      setLoading(false)
      closeDeleteModal()
    }
  }

  const deleteSavedSession = (code) => {
    openDeleteModal(code)
  }

  const currentSlide = useMemo(() => {
    if (!session?.slides?.length) return null
    return session.slides[session.currentSlideIndex] ?? session.slides[0]
  }, [session])

  const currentSlideResponses = useMemo(() => {
    if (!currentSlide) return []
    return responses.filter((entry) => entry.slideId === currentSlide.id)
  }, [responses, currentSlide])

  const currentParticipantResponse = useMemo(() => {
    return currentSlideResponses.find((entry) => entry.participantId === participantId) ?? null
  }, [currentSlideResponses, participantId])

  const connectedParticipants = useMemo(() => {
    const now = Date.now()
    return participants.filter((entry) => {
      const timestamp = entry.lastSeenAt?.toMillis?.()
      return typeof timestamp === 'number' && now - timestamp <= PRESENCE_TTL_MS
    }).length
  }, [participants])

  const onNext = async () => {
    if (!session || session.currentSlideIndex >= session.slides.length - 1) return
    await updateDoc(doc(db, 'sessions', session.code), {
      currentSlideIndex: session.currentSlideIndex + 1,
      updatedAt: serverTimestamp(),
    })
  }

  const onPrevious = async () => {
    if (!session || session.currentSlideIndex <= 0) return
    await updateDoc(doc(db, 'sessions', session.code), {
      currentSlideIndex: session.currentSlideIndex - 1,
      updatedAt: serverTimestamp(),
    })
  }

  const submitResponse = async (value) => {
    if (!session || !currentSlide) return false

    if (currentSlide.type === STRUCTURAL_FORM_TYPE) {
      setSending(true)
      setError('')
      try {
        const minChars = getStructuralMinChars(currentSlide)
        const validation = validateStructuralFormPayload(value, minChars, {
          transversalityOptions: getStructuralTransversalityOptions(currentSlide),
          pillarOptions: getStructuralPillarOptions(currentSlide),
        })

        if (!validation.isValid) {
          setError(validation.error)
          return false
        }

        const payload = validation.payload
        await addDoc(collection(db, 'sessions', session.code, 'responses'), {
          participantId,
          participantName: payload.name,
          email: payload.email,
          slideId: currentSlide.id,
          type: currentSlide.type,
          value: payload,
          createdAt: serverTimestamp(),
        })
        return true
      } catch {
        setError('Não foi possível enviar o formulário.')
        return false
      } finally {
        setSending(false)
      }
    }

    const finalValue = normalizeText(value ?? '')
    if (!finalValue || !session || !currentSlide) return false

    setSending(true)
    setError('')

    try {
      if (currentSlide.type === TEAM_SELECTION_TYPE) {
        const selectedTeam = currentSlide.teams?.find((team) => team.name === finalValue)

        if (!selectedTeam) {
          setError('Esse clube não está disponível no momento.')
          return false
        }

        const responseRef = doc(
          db,
          'sessions',
          session.code,
          'responses',
          getTeamSelectionResponseId(currentSlide.id, participantId),
        )

        const slideResponsesQuery = query(
          collection(db, 'sessions', session.code, 'responses'),
          where('slideId', '==', currentSlide.id),
        )

        const slideResponsesSnapshot = await getDocs(slideResponsesQuery)
        const selectedTeamCount = slideResponsesSnapshot.docs.reduce((total, responseDoc) => {
          const responseData = responseDoc.data()

          if (responseData.type !== TEAM_SELECTION_TYPE) return total

          return normalizeText(responseData.value ?? '') === finalValue ? total + 1 : total
        }, 0)

        if (selectedTeamCount >= Number(selectedTeam.capacity)) {
          setError(`O clube ${finalValue} acabou de lotar. Escolha outro.`)
          return false
        }

        await runTransaction(db, async (transaction) => {
          const existingResponse = await transaction.get(responseRef)

          if (existingResponse.exists()) {
            throw new Error('TEAM_ALREADY_SELECTED')
          }

          transaction.set(responseRef, {
            participantId,
            participantName: getParticipantDisplayName(participantName),
            slideId: currentSlide.id,
            type: currentSlide.type,
            value: finalValue,
            createdAt: serverTimestamp(),
          })
        })

        return true
      }

      await addDoc(collection(db, 'sessions', session.code, 'responses'), {
        participantId,
        participantName: getParticipantDisplayName(participantName),
        slideId: currentSlide.id,
        type: currentSlide.type,
        value: finalValue,
        createdAt: serverTimestamp(),
      })
      return true
    } catch (submitError) {
      console.error('Team selection submit failed', submitError)

      if (submitError?.message === 'TEAM_FULL') {
        setError(`O clube ${finalValue} acabou de lotar. Escolha outro.`)
      } else if (submitError?.message === 'TEAM_ALREADY_SELECTED') {
        setError('Você já escolheu um clube nesta etapa.')
      } else if (submitError?.code === 'permission-denied') {
        setError('Permissão negada no Firestore. Atualize as regras ou tente novamente mais tarde.')
      } else {
        setError(
          currentSlide.type === TEAM_SELECTION_TYPE
            ? 'Não foi possível confirmar sua vaga no clube.'
            : 'Não foi possível enviar sua resposta.',
        )
      }
      return false
    } finally {
      setSending(false)
    }
  }

  const sendReaction = async (type) => {
    if (!session) return

    try {
      await addDoc(collection(db, 'sessions', session.code, 'reactions'), {
        type,
        left: Math.round(Math.random() * 80 + 10),
        participantId,
        createdAt: serverTimestamp(),
      })
    } catch {
      setError('Falha ao enviar reação.')
    }
  }

  const deleteConfirmationModal = isDeleteModalOpen ? (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <h3 className="text-lg font-black text-slate-900">Confirmar exclusão</h3>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Tem certeza que deseja apagar esta apresentação? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={closeDeleteModal}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={performDeleteSession}
            disabled={loading}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'Excluindo...' : 'Apagar apresentação'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  if (role === 'landing') {
    return (
      <>
        <Landing
          key={prefilledCode || 'landing'}
          onCreate={createSession}
          onJoin={joinSession}
          onEnterSaved={enterSavedSession}
          onDeleteSaved={deleteSavedSession}
          onExportSaved={(code, item) => generateSessionReport(code, item)}
          sessions={isMobile ? [] : sessionsList}
          loading={loading}
          initialCode={prefilledCode}
          isMobile={isMobile}
        />
        {deleteConfirmationModal}
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-xl">
            {error}
          </div>
        )}
      </>
    )
  }

  if (!session || !currentSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-slate-900">
        <LoaderCircle className="mr-3 h-8 w-8 animate-spin text-blue-600" />
        <span className="text-xl font-bold tracking-tight">Preparando a sala...</span>
      </div>
    )
  }

  return (
    <>
      {role === 'host' && (
        <HostView
          session={session}
          currentSlide={currentSlide}
          responses={currentSlideResponses}
          reactions={liveReactions}
          onNext={onNext}
          onPrevious={onPrevious}
          canGoBack={session.currentSlideIndex > 0}
          canGoForward={session.currentSlideIndex < session.slides.length - 1}
          connectedParticipants={connectedParticipants}
          onExportReport={() => generateSessionReport(session.code, session)}
        />
      )}

      {role === 'participant' && (
        <ParticipantView
          key={currentSlide.id}
          session={session}
          currentSlide={currentSlide}
          responses={currentSlideResponses}
          participantResponse={currentParticipantResponse}
          onSubmit={submitResponse}
          onReact={sendReaction}
          sending={sending}
          participantName={participantName}
        />
      )}

      {deleteConfirmationModal}
      {error && (
        <div className="fixed top-6 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-rose-600 px-8 py-4 text-sm font-black tracking-wide text-white shadow-2xl">
          {error}
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <h3 className="text-lg font-black text-slate-900">Confirmar exclusão</h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Tem certeza que deseja apagar esta apresentação? Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={performDeleteSession}
                disabled={loading}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? 'Excluindo...' : 'Apagar apresentação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
