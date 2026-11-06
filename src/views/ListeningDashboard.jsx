import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Check, ClipboardCopy, Edit2, MessageCircle, Plus, Sprout, Trash2, Users, Vote } from 'lucide-react'
import Modal from '../components/ui/Modal'
import WorkspaceShell from '../components/ui/WorkspaceShell'
import SCHOOL_UNITS from '../data/schoolUnits.json'
import { useAuth } from '../hooks/useAuth'
import { useListeningForms, useSharedListeningForms } from '../hooks/useListeningForms'
import {
  AUTH_DOMAIN_LABEL,
  DEFAULT_VOTE_TITLE_SELECTION_LIMIT,
  MAX_VOTE_TITLE_SELECTION_LIMIT,
} from '../lib/constants'
import { isSecEmail } from '../lib/validators'
import {
  createListeningForm,
  deleteListeningForm,
  getListeningEntriesPage,
  getListeningEntrySummary,
  LISTENING_ENTRIES_PAGE_SIZE,
  LISTENING_OCCUPATIONS,
  normalizeListeningCollaboratorEmail,
  parseListeningOptions,
  setListeningFormStatus,
  subscribeLatestListeningEntry,
  updateListeningCollaborators,
  updateListeningForm,
} from '../lib/firebaseListening'

const INITIAL_TITLE = 'Mapa de Vozes — Jornada Pedagógica 2027'
const INITIAL_INTRODUCTION = 'A Jornada começa antes do encontro: com as perguntas que atravessam o cotidiano de cada escola. Deixe uma ideia para construirmos esse caminho juntos.'
const INITIAL_TOPIC_PROMPT = 'Que tema você gostaria de ver na Jornada Pedagógica 2027?'
const INITIAL_CONSULTATION_PERIOD = 'A consulta está disponível de 4 a 8 de novembro.'
const VOTE_INTRODUCTION = 'A Jornada Pedagógica começa antes do encontro. Escolha o tema que considera mais importante e, dentro dele, o título que melhor expressa essa construção coletiva.'
const VOTE_TOPIC_PROMPT = 'Qual tema gerador você considera prioritário para a Jornada Pedagógica 2027?'
const JOURNEY_VOTE_OPTIONS = [
  {
    label: '200 anos da escola pública',
    titles: [
      'Resgatar a História para Construir o Amanhã: A Trajetória da Escola Pública Baiana.',
      '200 Anos de Resistência e Saberes: O Legado e os Desafios da Educação Pública na Bahia.',
      'Duas Décadas de História: Tradição, mudança e futuro.',
      'Escola Pública na Bahia: Construção Histórica, Democracia e Retratos de um Povo.',
      'Da Memória à Ação: Celebrando 200 Anos da Escola Pública com Inovação e Compromisso.',
      'Bicentenário da Escola Pública na Bahia: Memórias, Conquistas e os Caminhos para o Futuro da Educação',
      '200 anos da escola que avança, cuida e transforma',
    ],
  },
  {
    label: 'Aprendizagem e equidade',
    titles: [
      'Caminhos para a aprendizagem com equidade na educação baiana',
      'Pedagogia da Equidade: Garantindo Direitos no Cotidiano Escolar.',
      'Práticas Pedagógicas para uma Aprendizagem Plural.',
      'Aprendizagem e equidade na Sala de Aula: Estratégias Pedagógicas para a justiça curricular',
      'Avaliar para Incluir: Diagnóstico, Intervenção e Equidade no Processo de Ensino.',
      'Equidade em Ação: Estratégias Pedagógicas para Garantir Direitos a Aprendizagem',
    ],
  },
  {
    label: 'Plano Estadual de Educação',
    titles: [
      'Diretrizes que Mobilizam: O PEE como Bússola do Planejamento Escolar.',
      'Do Documento à Prática: Consolidando as Metas do PEE na Rede Estadual.',
      'Compromisso Coletivo: Gestão democrática, PEE e Fortalecimento da Escola Pública baiana.',
      'Monitorar, Avaliar e Avançar: O Papel da Comunidade Escolar na Efetivação do PEE.',
      'O PEE no Cotidiano: Unindo Políticas Públicas e Projeto Político Pedagógico.',
      'PEE em Foco: Planejamento, Metas Coletivas e o Compromisso com uma Educação Pública de Qualidade social',
      'A Bahia nos próximos 10 anos: aprendizagem efetiva, equitativa e de qualidade social',
    ],
  },
  {
    label: 'Educação e territorialidade',
    titles: [
      'Saberes da Terra, Culturas do Povo: A Territorialidade como Eixo do Currículo.',
      'A Escola e seus Territórios: Diálogos entre Identidades e aprendizagem',
      'Pedagogia Contextualizada: Valorizando o Território de Identidade na Construção do Conhecimento.',
      'Territórios de Afeto e Aprendizagem: Conectando a Escola com a Comunidade Baiana.',
      'Diversidade Territorial na Bahia: Desafios e Riquezas da Prática Educativo-Regional.',
      'Territórios que Educam: Saberes Locais, Identidade Baiana e a Diversidade nos Processos de Ensino',
      'Educação e territorialidade: aprender para transformar a Bahia',
    ],
  },
  {
    label: 'Aprendizagem, inclusão e democracia',
    titles: [
      'Democracia se Aprende na Prática: Inclusão, Acessibilidade e Participação Ativa.',
      'Acessibilidade Atitudinal e Pedagógica: Garantindo que Todos Aprendam Juntos.',
      'Vozes da Escola: Gestão Democrática, Diversidade e Inclusão Plena.',
      'Estratégias Inclusivas para uma Aprendizagem Democrática.',
      'Diversidade como Potência: Diálogo, Respeito e Aprendizagem para Todos.',
      'Escola Democrática e Inclusiva: Garantindo o Acesso, a Permanência e a conclusão da educação básica',
      'Aprendizagem, inclusão e democracia: a escola que constrói o futuro da Bahia',
    ],
  },
  {
    label: 'Escola que forma, juventude que transforma',
    titles: [
      'Juventudes Baianas: Sonhos, projetos e Protagonismo na Sociedade.',
      'A Escola como Espaço de Possibilidades: Formação Cidadã e Transformação Social.',
      'Engajar para Transformar: O Papel dos Jovens no Presente e no Futuro da Bahia.',
      'Educação e Juventudes: Escuta Ativa, Autonomia e Construção do Conhecimento.',
      'Cultivando Autores do Próprio Futuro: Formação Integral e Juventude Consciente.',
      'Protagonismo Juvenil e Formação Integral: A Escola como Espaço de Transformação Social',
      'Escola que forma, estudantes que transformam: formação integral, mundo do trabalho e democracia',
    ],
  },
  {
    label: 'A Práxis Docente: Formação Permanente e Consciência Crítica na Escola',
    titles: [
      'A Práxis Docente, a Consciência Crítica e o Papel do Educador na Reconstrução Social.',
      'O Educador como Agente Político e Transformador da Sociedade Baiana.',
      'A Importância da Formação Permanente na Construção de uma Sociedade Justa.',
      'A Dimensão Humana e a Formação Contínua como Pilares do Compromisso Social da Docência.',
      'Formação em Serviço, Autonomia Docente e o Impacto do Educador no Futuro da Sociedade.',
      'A Formação em Serviço e a Conscientização Crítica do Educador como Sujeito da História.',
    ],
  },
]
const SCHOOL_BY_CODE = new Map(SCHOOL_UNITS.map((unit) => [unit.codSec, unit]))
const OCCUPATION_COLORS = ['#8062a8', '#d28a55', '#6c9b82', '#cf6b66', '#6388ae', '#b69b4c']
const getVoteOptionLabel = (option) => (typeof option === 'string' ? option : option.label)
const getVoteOptionTitles = (option) => (Array.isArray(option?.titles) ? option.titles : [])
const getEntrySubChoiceIndexes = (entry) => (
  Array.isArray(entry.subChoiceIndexes)
    ? entry.subChoiceIndexes
    : Number.isInteger(entry.subChoiceIndex)
      ? [entry.subChoiceIndex]
      : []
)
const getOccupationLabel = (entry) => (
  entry.occupation === 'Outro' && entry.otherOccupation
    ? `Outro: ${entry.otherOccupation}`
    : entry.occupation
)
const isVoteMode = (mode) => mode === 'vote' || mode === 'vote_simple'

const makePublicUrl = (formId) => {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('escuta', formId)
  return url.toString()
}

export default function ListeningDashboard({ onBack, onTemplates, onLogout }) {
  const { displayName, email, uid, logout } = useAuth()
  const { forms, loading, error: formsError } = useListeningForms(uid)
  const { forms: receivedForms, loading: sharedLoading, error: sharedError } = useSharedListeningForms(email)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingFormId, setEditingFormId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [title, setTitle] = useState(INITIAL_TITLE)
  const [introduction, setIntroduction] = useState(INITIAL_INTRODUCTION)
  const [topicPrompt, setTopicPrompt] = useState(INITIAL_TOPIC_PROMPT)
  const [consultationPeriod, setConsultationPeriod] = useState(INITIAL_CONSULTATION_PERIOD)
  const [mode, setMode] = useState('open')
  const [maxTitleSelections, setMaxTitleSelections] = useState(DEFAULT_VOTE_TITLE_SELECTION_LIMIT)
  const [voteOptions, setVoteOptions] = useState(() => JOURNEY_VOTE_OPTIONS.map((option) => ({
    ...option,
    titlesText: option.titles.join('\n'),
    hasTitles: true,
  })))
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [entriesError, setEntriesError] = useState('')
  const [entriesHasMore, setEntriesHasMore] = useState(false)
  const [entriesCursor, setEntriesCursor] = useState(null)
  const [nextEntriesCursor, setNextEntriesCursor] = useState(null)
  const [entriesPage, setEntriesPage] = useState(1)
  const [previousEntriesCursors, setPreviousEntriesCursors] = useState([])
  const [occupationFilter, setOccupationFilter] = useState('')
  const [choiceIndexFilter, setChoiceIndexFilter] = useState('')
  const [entriesRefreshKey, setEntriesRefreshKey] = useState(0)
  // Chave da consulta de contribuições em exibição. Serve para distinguir a
  // atualização ao vivo (mesma consulta) de uma troca real de escuta, filtro
  // ou página — só esta última limpa a lista na tela.
  const entriesQueryKeyRef = useRef('')
  // Marca de qual consulta (escuta + filtros + página) os dados já carregados
  // pertencem. Quando difere da consulta em exibição, os dados ainda estão em
  // trânsito → painel mostra esqueleto animado em vez de dados de outra escuta
  // ou de mensagens enganosas de "sem dados".
  const [entriesReadyKey, setEntriesReadyKey] = useState('')
  const [summaryReadyKey, setSummaryReadyKey] = useState('')
  const [filteredEntryTotal, setFilteredEntryTotal] = useState(0)
  const [entrySummary, setEntrySummary] = useState({
    total: 0,
    occupationCounts: [],
    optionCounts: [],
    subOptionCounts: [],
  })
  const [copiedId, setCopiedId] = useState('')
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [formToDelete, setFormToDelete] = useState('')
  const [shareFormId, setShareFormId] = useState('')
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('viewer')
  const [shareSaving, setShareSaving] = useState(false)
  const [shareError, setShareError] = useState('')

  // Escutas de donos já aparecem na lista principal; evita cartão duplicado.
  const sharedForms = useMemo(
    () => receivedForms.filter((form) => form.ownerUid !== uid),
    [receivedForms, uid],
  )
  // A escuta selecionada pode estar na lista do dono OU na compartilhada.
  const selectedForm = useMemo(
    () => forms.find((form) => form.id === selectedId)
      ?? sharedForms.find((form) => form.id === selectedId)
      ?? null,
    [forms, sharedForms, selectedId],
  )
  const collaborationEmail = (email ?? '').toLowerCase()

  const resolveFormRole = (form) => {
    if (!form) return ''
    if (form.ownerUid === uid) return 'owner'
    if (form.role) return form.role
    if (form.editorEmails?.includes(collaborationEmail)) return 'editor'
    if (form.viewerEmails?.includes(collaborationEmail)) return 'viewer'
    return ''
  }

  const selectedFormRole = resolveFormRole(selectedForm)
  const canManageSelectedForm = ['owner', 'editor'].includes(selectedFormRole)
  const shareForm = useMemo(
    () => forms.find((form) => form.id === shareFormId) ?? null,
    [forms, shareFormId],
  )
  const shareEditors = shareForm?.editorEmails ?? []
  const shareViewers = shareForm?.viewerEmails ?? []
  const shareCollaborators = [
    ...shareEditors.map((entry) => ({ email: entry, role: 'editor' })),
    ...shareViewers.map((entry) => ({ email: entry, role: 'viewer' })),
  ]
  const optionCounts = entrySummary.optionCounts
  const subOptionCounts = entrySummary.subOptionCounts
  const totalVotes = entrySummary.total
  const occupationTotal = entrySummary.occupationCounts.reduce((total, item) => total + item.count, 0)
  const occupationChartStyle = occupationTotal
    ? {
      background: `conic-gradient(${entrySummary.occupationCounts
        .map((item, index, occupations) => {
          const before = occupations
            .slice(0, index)
            .reduce((total, occupation) => total + occupation.count, 0)
          const after = before + item.count
          const start = (before / occupationTotal) * 100
          const end = (after / occupationTotal) * 100
          return `${OCCUPATION_COLORS[index % OCCUPATION_COLORS.length]} ${start}% ${end}%`
        })
        .join(', ')})`,
    }
    : { background: '#e8e4ed' }
  const winningTheme = useMemo(() => {
    if (!selectedForm || !isVoteMode(selectedForm.mode) || totalVotes === 0) return null
    return optionCounts.reduce((best, current) => (
      !best || current.count > best.count ? current : best
    ), null)
  }, [optionCounts, selectedForm, totalVotes])
  const winningTitle = useMemo(() => {
    if (!selectedForm || selectedForm.mode !== 'vote' || totalVotes === 0) return null

    let best = null
    selectedForm.options.forEach((option, choiceIndex) => {
      const titles = subOptionCounts[choiceIndex] ?? []
      titles.forEach((title) => {
        const candidate = {
          theme: getVoteOptionLabel(option),
          label: title.label,
          count: title.count,
        }
        if (!best || candidate.count > best.count) {
          best = candidate
        }
      })
    })

    return best
  }, [selectedForm, subOptionCounts, totalVotes])
  const optionsLocked = Boolean(
    editingFormId
      && isVoteMode(mode)
      && (summaryLoading || entriesError || totalVotes > 0),
  )

  // Identidade da consulta exibida (escuta + filtros + página), compartilhada
  // pelo efeito de carregamento e pelo cálculo de pendência do painel.
  const resultsQueryKey = `${selectedId}|${occupationFilter}|${choiceIndexFilter}|${entriesCursor?.id ?? 'none'}`

  useEffect(() => {
    if (!selectedId) {
      entriesQueryKeyRef.current = ''
      setEntriesReadyKey('')
      setEntries([])
      setEntriesLoading(false)
      setEntriesError('')
      setEntrySummary({ total: 0, occupationCounts: [], optionCounts: [], subOptionCounts: [] })
      setSummaryLoading(false)
      return undefined
    }

    // Na atualização ao vivo (novo voto/ideia) a mesma consulta é refeita; só
    // limpa a lista quando a consulta em si muda (outra escuta, filtro ou página).
    const queryKey = resultsQueryKey
    const sameQuery = entriesQueryKeyRef.current === queryKey
    entriesQueryKeyRef.current = queryKey

    if (!sameQuery) {
      setEntries([])
    }
    setEntriesLoading(true)
    setEntriesError('')
    let active = true
    getListeningEntriesPage(selectedId, {
      occupation: occupationFilter,
      choiceIndex: choiceIndexFilter,
      cursor: entriesCursor,
    })
      .then((page) => {
        if (!active) return
        setEntries(page.entries)
        setEntriesHasMore(page.hasMore)
        setNextEntriesCursor(page.cursor)
        setFilteredEntryTotal(page.totalCount)
        setEntriesReadyKey(queryKey)
        setEntriesLoading(false)
      })
      .catch((error) => {
        if (!active) return
        console.error('getListeningEntriesPage failed', error)
        setEntriesError('Não foi possível carregar esta página de contribuições.')
        setEntriesReadyKey(queryKey)
        setEntriesLoading(false)
      })
    return () => {
      active = false
    }
  }, [resultsQueryKey, selectedId, occupationFilter, choiceIndexFilter, entriesCursor, entriesRefreshKey])

  useEffect(() => {
    if (!selectedId || !selectedForm) {
      setSummaryReadyKey('')
      setEntrySummary({ total: 0, occupationCounts: [], optionCounts: [], subOptionCounts: [] })
      setSummaryLoading(false)
      return undefined
    }

    let active = true
    setSummaryLoading(true)
    getListeningEntrySummary(selectedId, selectedForm.options ?? [], selectedForm.mode ?? 'open')
      .then((summary) => {
        if (!active) return
        setEntrySummary(summary)
        setSummaryReadyKey(selectedId)
      })
      .catch((error) => {
        if (!active) return
        console.error('getListeningEntrySummary failed', error)
        setEntriesError('Não foi possível calcular os resultados desta escuta.')
        setSummaryReadyKey(selectedId)
      })
      .finally(() => {
        if (active) setSummaryLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedId, selectedForm, entriesRefreshKey])

  // Pendência do painel de resultados: os dados exibidos ainda não correspondem
  // à consulta atual (clicou em outra escuta, mudou filtro/página ou é a
  // primeira carga) → esqueleto animado no lugar do conteúdo. Refresh ao vivo
  // da mesma consulta NÃO pendência: mantém o conteúdo e marca "atualizando…".
  const resultsPending = Boolean(selectedForm)
    && (entriesReadyKey !== resultsQueryKey
      || summaryReadyKey !== selectedId
      || ((entriesLoading || summaryLoading) && !entries.length))

  useEffect(() => {
    if (!selectedId) return undefined
    const unsubscribe = subscribeLatestListeningEntry(
      selectedId,
      () => {
        setEntriesCursor(null)
        setPreviousEntriesCursors([])
        setEntriesPage(1)
        setEntriesRefreshKey((current) => current + 1)
      },
      (error) => {
        console.error('subscribeLatestListeningEntry failed', error)
        setEntriesError('Não foi possível acompanhar as novas contribuições.')
      },
    )
    return () => unsubscribe()
  }, [selectedId])

  const resetEntryPagination = () => {
    setEntriesCursor(null)
    setNextEntriesCursor(null)
    setEntriesPage(1)
    setPreviousEntriesCursors([])
  }

  const selectForm = (formId) => {
    setOccupationFilter('')
    setChoiceIndexFilter('')
    resetEntryPagination()
    setSelectedId(formId)
  }

  const goToNextEntriesPage = () => {
    if (!entriesHasMore || !nextEntriesCursor || entriesLoading) return
    setPreviousEntriesCursors((cursors) => [...cursors, entriesCursor])
    setEntriesCursor(nextEntriesCursor)
    setEntriesPage((page) => page + 1)
  }

  const goToPreviousEntriesPage = () => {
    if (!previousEntriesCursors.length || entriesLoading) return
    const cursor = previousEntriesCursors[previousEntriesCursors.length - 1]
    setPreviousEntriesCursors((cursors) => cursors.slice(0, -1))
    setEntriesCursor(cursor)
    setEntriesPage((page) => page - 1)
  }

  const resetCreateForm = () => {
    setEditingFormId('')
    setTitle(INITIAL_TITLE)
    setIntroduction(INITIAL_INTRODUCTION)
    setTopicPrompt(INITIAL_TOPIC_PROMPT)
    setConsultationPeriod(INITIAL_CONSULTATION_PERIOD)
    setMode('open')
    setMaxTitleSelections(DEFAULT_VOTE_TITLE_SELECTION_LIMIT)
    setVoteOptions(JOURNEY_VOTE_OPTIONS.map((option) => ({
      ...option,
      titlesText: option.titles.join('\n'),
      hasTitles: true,
    })))
    setActionError('')
  }

  const startEditingForm = (form) => {
    selectForm(form.id)
    setEditingFormId(form.id)
    setTitle(form.title ?? '')
    setIntroduction(form.introduction ?? '')
    setTopicPrompt(form.topicPrompt ?? '')
    setConsultationPeriod(form.consultationPeriod ?? INITIAL_CONSULTATION_PERIOD)
    setMode(form.mode ?? 'open')
    setMaxTitleSelections(form.maxTitleSelections ?? DEFAULT_VOTE_TITLE_SELECTION_LIMIT)
    setVoteOptions((form.options ?? []).map((option) => ({
      label: getVoteOptionLabel(option),
      titlesText: getVoteOptionTitles(option).join('\n'),
      hasTitles: Array.isArray(option?.titles),
    })))
    setActionError('')
    setCreateOpen(true)
  }

  const chooseMode = (nextMode) => {
    setMode(nextMode)
    if (isVoteMode(nextMode)) {
      if (introduction === INITIAL_INTRODUCTION) setIntroduction(VOTE_INTRODUCTION)
      if (topicPrompt === INITIAL_TOPIC_PROMPT) setTopicPrompt(VOTE_TOPIC_PROMPT)
      return
    }
    if (introduction === VOTE_INTRODUCTION) setIntroduction(INITIAL_INTRODUCTION)
    if (topicPrompt === VOTE_TOPIC_PROMPT) setTopicPrompt(INITIAL_TOPIC_PROMPT)
  }

  const updateVoteOption = (index, key, value) => {
    setVoteOptions((current) => current.map((option, optionIndex) => (
      optionIndex === index ? { ...option, [key]: value } : option
    )))
  }

  const addVoteOption = () => {
    setVoteOptions((current) => (
      current.length < 10
        ? [...current, { label: '', titlesText: '', hasTitles: true }]
        : current
    ))
  }

  const removeVoteOption = (index) => {
    setVoteOptions((current) => (
      current.length > 2
        ? current.filter((_, optionIndex) => optionIndex !== index)
        : current
    ))
  }

  const saveForm = async (event) => {
    event.preventDefault()
    setSaving(true)
    setActionError('')
    try {
      const options = isVoteMode(mode)
        ? voteOptions.map(({ label, titlesText }) => {
          if (mode === 'vote') {
            const titles = parseListeningOptions(titlesText)
            return titles.length ? { label, titles } : label
          }
          return label
        })
        : []

      if (editingFormId) {
        await updateListeningForm(editingFormId, {
          title,
          introduction,
          topicPrompt,
          consultationPeriod,
          mode,
          maxTitleSelections,
          ...(optionsLocked ? {} : { options }),
        })
      } else {
        const created = await createListeningForm({
          ownerUid: uid,
          title,
          introduction,
          topicPrompt,
          consultationPeriod,
          mode,
          maxTitleSelections,
          options,
        })
        setSelectedId(created.id)
      }

      setCreateOpen(false)
      resetCreateForm()
    } catch (error) {
      console.error(editingFormId ? 'updateListeningForm failed' : 'createListeningForm failed', error)
      setActionError(error.message || (editingFormId
        ? 'Não foi possível salvar as alterações.'
        : 'Não foi possível criar a escuta.'))
    } finally {
      setSaving(false)
    }
  }

  const copyLink = async (formId) => {
    setActionError('')
    try {
      await navigator.clipboard.writeText(makePublicUrl(formId))
      setCopiedId(formId)
      window.setTimeout(() => setCopiedId(''), 1800)
    } catch (error) {
      console.error('Copy listening link failed', error)
      setActionError('Não foi possível copiar o link. Abra-o e copie o endereço da página.')
    }
  }

  const toggleStatus = async (form) => {
      setActionError('')
      try {
        await setListeningFormStatus(form.id, form.status === 'open' ? 'closed' : 'open')
      } catch (error) {
        console.error('setListeningFormStatus failed', error)
        setActionError('Não foi possível atualizar o estado desta escuta.')
      }
    }

    const requestDeleteForm = (formId) => {
      setFormToDelete(formId)
      setDeleteConfirmOpen(true)
    }

    const confirmDeleteForm = async () => {
      if (!formToDelete) return
      setActionError('')
      try {
        await deleteListeningForm(formToDelete)
        if (selectedId === formToDelete) {
          setSelectedId('')
        }
      } catch (error) {
        console.error('deleteListeningForm failed', error)
        setActionError('Não foi possível apagar a escuta.')
      } finally {
        setDeleteConfirmOpen(false)
        setFormToDelete('')
      }
    }

    const cancelDeleteForm = () => {
      setDeleteConfirmOpen(false)
      setFormToDelete('')
    }

  const openSharePanel = (form) => {
    setShareFormId(form.id)
    setShareEmail('')
    setShareRole('viewer')
    setShareError('')
  }

  const closeSharePanel = () => {
    if (shareSaving) return
    setShareFormId('')
    setShareError('')
  }

  const saveSharedAccess = async (nextEditors, nextViewers) => {
    setShareSaving(true)
    setShareError('')
    try {
      await updateListeningCollaborators(shareFormId, {
        editorEmails: nextEditors,
        viewerEmails: nextViewers,
      })
    } catch (error) {
      console.error('updateListeningCollaborators failed', error)
      setShareError(error.message || 'Não foi possível atualizar o compartilhamento.')
    } finally {
      setShareSaving(false)
    }
  }

  const addListeningCollaborator = async (event) => {
    event.preventDefault()
    if (!shareFormId || shareSaving) return
    const normalizedEmail = normalizeListeningCollaboratorEmail(shareEmail)
    setShareError('')
    if (!isSecEmail(normalizedEmail)) {
      setShareError(`Use um e-mail de um destes domínios: ${AUTH_DOMAIN_LABEL}.`)
      return
    }
    if (shareEditors.includes(normalizedEmail) || shareViewers.includes(normalizedEmail)) {
      setShareError('Essa pessoa já tem acesso a esta escuta.')
      return
    }
    await saveSharedAccess(
      shareRole === 'editor' ? [...shareEditors, normalizedEmail] : shareEditors,
      shareRole === 'editor' ? shareViewers : [...shareViewers, normalizedEmail],
    )
    setShareEmail('')
  }

  const removeListeningCollaborator = async (collaborator) => {
    if (!shareFormId || shareSaving) return
    setShareError('')
    await saveSharedAccess(
      collaborator.role === 'editor'
        ? shareEditors.filter((entry) => entry !== collaborator.email)
        : shareEditors,
      collaborator.role === 'viewer'
        ? shareViewers.filter((entry) => entry !== collaborator.email)
        : shareViewers,
    )
  }

    return (
    <WorkspaceShell
      name={displayName || email?.split('@')[0]}
      email={email}
      active="listening"
      onPresentations={onBack}
      onListening={() => setSelectedId('')}
      onTemplates={onTemplates}
      onLogout={async () => {
        await logout()
        onLogout()
      }}
    >
      <div className="workspace-title-row">
        <div>
          <p className="fala-eyebrow">IDEIAS QUE COMEÇAM EM CADA ESCOLA</p>
          <h1 className="workspace-title">Escutas</h1>
          <p className="workspace-subtitle">Convites para reunir ideias ou escolher, em conjunto, os próximos temas.</p>
        </div>
        <button type="button" className="fala-button" onClick={() => {
          setActionError('')
          setCreateOpen(true)
        }}>
          <Plus size={17} /> Nova escuta
        </button>
      </div>

      {actionError && !createOpen && <p className="fala-error" role="alert">{actionError}</p>}
      {formsError && <p className="fala-error" role="alert">{formsError}</p>}
      {sharedError && <p className="fala-error" role="alert">{sharedError}</p>}

      {loading || sharedLoading ? (
        <p className="workspace-empty" role="status">Carregando suas escutas…</p>
      ) : forms.length || sharedForms.length ? (
        <div className="voice-admin-layout">
          <section className="voice-admin-list" aria-label="Suas escutas e compartilhadas com você">
            <div className="voice-admin-list__heading">
              <h2>Seus espaços de escuta</h2>
              <span>{forms.length}</span>
            </div>
            {!forms.length && (
              <p className="workspace-empty">Crie sua primeira escuta com o botão “Nova escuta”.</p>
            )}
            {forms.map((form) => (
              <article className={`voice-admin-card${form.id === selectedId ? ' is-selected' : ''}`} key={form.id}>
                <button
                  type="button"
                  className="voice-admin-card__main"
                  onClick={() => selectForm(form.id)}
                  aria-pressed={form.id === selectedId}
                >
                  <span className={`voice-status${form.status === 'open' ? ' is-open' : ''}`}>
                    {form.status === 'open' ? 'Recebendo ideias' : 'Encerrada'}
                  </span>
                  <strong>{form.title}</strong>
                  <span>{form.mode === 'vote'
                    ? `Votação com temas · ${form.options?.length ?? 0} temas`
                    : form.mode === 'vote_simple'
                      ? `Votação simples · ${form.options?.length ?? 0} opções`
                      : `Ideias abertas · ${form.schoolIds?.length ?? 0} unidades`}</span>
                </button>
                <div className="voice-admin-card__actions">
                  <button type="button" className="voice-small-action" onClick={() => startEditingForm(form)}>
                    <Edit2 size={15} /> Editar escuta
                  </button>
                  <button
                    type="button"
                    className="voice-small-action"
                    onClick={() => openSharePanel(form)}
                    aria-label={`Compartilhar a escuta ${form.title} com a equipe`}
                  >
                    <Users size={15} /> Compartilhar
                  </button>
                  <button type="button" className="voice-small-action" onClick={() => copyLink(form.id)}>
                    {copiedId === form.id ? <Check size={15} /> : <ClipboardCopy size={15} />}
                    {copiedId === form.id ? 'Copiado' : 'Copiar link'}
                  </button>
                  <a
                    className="voice-small-action"
                    href={makePublicUrl(form.id)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir link público da escuta ${form.title}`}
                  >
                    <ArrowUpRight size={15} /> Abrir link
                  </a>
                  <button
                    type="button"
                    className="voice-small-action voice-small-action--danger"
                                      onClick={() => requestDeleteForm(form.id)}
                    aria-label={`Apagar escuta ${form.title}`}
                  >
                    <Trash2 size={15} /> Apagar
                  </button>
                </div>
              </article>
            ))}

            {sharedForms.length > 0 && (
              <div className="voice-admin-list__heading voice-admin-list__heading--shared">
                <h2>Compartilhadas com você</h2>
                <span>{sharedForms.length}</span>
              </div>
            )}

            {sharedForms.map((form) => (
              <article className={`voice-admin-card${form.id === selectedId ? ' is-selected' : ''}`} key={form.id}>
                <button
                  type="button"
                  className="voice-admin-card__main"
                  onClick={() => selectForm(form.id)}
                  aria-pressed={form.id === selectedId}
                >
                  <span className="voice-share-badges">
                    <span className={`voice-status${form.status === 'open' ? ' is-open' : ''}`}>
                      {form.status === 'open' ? 'Recebendo ideias' : 'Encerrada'}
                    </span>
                    <span className="voice-status voice-status--role">{form.role === 'editor' ? 'Editor' : 'Leitor'}</span>
                  </span>
                  <strong>{form.title}</strong>
                  <span>{form.mode === 'vote'
                    ? `Votação com temas · ${form.options?.length ?? 0} temas`
                    : form.mode === 'vote_simple'
                      ? `Votação simples · ${form.options?.length ?? 0} opções`
                    : `Ideias abertas · ${form.schoolIds?.length ?? 0} unidades`}</span>
                </button>
                <div className="voice-admin-card__actions">
                  {form.role === 'editor' && (
                    <button type="button" className="voice-small-action" onClick={() => startEditingForm(form)}>
                      <Edit2 size={15} /> Editar escuta
                    </button>
                  )}
                  <button type="button" className="voice-small-action" onClick={() => copyLink(form.id)}>
                    {copiedId === form.id ? <Check size={15} /> : <ClipboardCopy size={15} />}
                    {copiedId === form.id ? 'Copiado' : 'Copiar link'}
                  </button>
                  <a
                    className="voice-small-action"
                    href={makePublicUrl(form.id)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir link público da escuta ${form.title}`}
                  >
                    <ArrowUpRight size={15} /> Abrir link
                  </a>
                </div>
              </article>
            ))}
          </section>

          <section className="voice-admin-results" aria-live="polite">
            {!selectedForm ? (
              <div className="voice-admin-placeholder">
                <Sprout size={24} />
                <h2>Escolha uma escuta</h2>
                <p>As ideias e os resultados das votações aparecem aqui para a equipe organizadora.</p>
              </div>
            ) : (
              <>
                <div className="voice-results-heading">
                  <div>
                    <p className="fala-eyebrow">{selectedForm.mode === 'vote' || selectedForm.mode === 'vote_simple'
                      ? 'APURAÇÃO DA VOTAÇÃO'
                      : 'MURAL DE CONTRIBUIÇÕES'}</p>
                    <h2>{selectedForm.title}</h2>
                    <p>
                      {resultsPending ? (
                        <span className="voice-skeleton voice-skeleton--count" />
                      ) : (
                        <>
                          {selectedForm.mode === 'vote' || selectedForm.mode === 'vote_simple'
                            ? `${totalVotes} ${totalVotes === 1 ? 'voto registrado' : 'votos registrados'}`
                            : `${entrySummary.total} ${entrySummary.total === 1 ? 'ideia recebida' : 'ideias recebidas'}`}
                          {(entriesLoading || summaryLoading) && (
                            <span className="voice-refresh-note"> · atualizando…</span>
                          )}
                        </>
                      )}
                    </p>
                    {selectedFormRole === 'editor' && (
                      <p className="fala-eyebrow voice-role-note">ACESSO DE EDITOR · VOCÊ PODE AJUSTAR ESTA ESCUTA</p>
                    )}
                    {selectedFormRole === 'viewer' && (
                      <p className="fala-eyebrow voice-role-note">ACESSO DE LEITOR · SOMENTE ACOMPANHAMENTO</p>
                    )}
                  </div>
                  {canManageSelectedForm ? (
                    <button
                      type="button"
                      className="fala-button fala-button--secondary"
                      onClick={() => toggleStatus(selectedForm)}
                    >
                      {selectedForm.status === 'open' ? 'Encerrar escuta' : 'Reabrir escuta'}
                    </button>
                  ) : (
                    <span className="voice-status voice-status--role">
                      {selectedFormRole === 'editor' ? 'Editor' : 'Leitor'}
                    </span>
                  )}
                </div>

                {entriesError ? (
                  <p className="fala-error" role="alert">{entriesError}</p>
                ) : resultsPending ? (
                  <div className="voice-results-skeleton" role="status" aria-label="Carregando os resultados desta escuta">
                    <div className="voice-results-skeleton__row">
                      <span className="voice-skeleton voice-skeleton--chip" />
                      <span className="voice-skeleton voice-skeleton--chip voice-skeleton--chip--short" />
                    </div>
                    <span className="voice-skeleton voice-skeleton--bar voice-skeleton--bar--long" />
                    <span className="voice-skeleton voice-skeleton--bar" />
                    <span className="voice-skeleton voice-skeleton--bar voice-skeleton--bar--short" />
                    <div className="voice-results-skeleton__row voice-results-skeleton__row--cards">
                      <span className="voice-skeleton voice-skeleton--card" />
                      <span className="voice-skeleton voice-skeleton--card" />
                      <span className="voice-skeleton voice-skeleton--card" />
                    </div>
                  </div>
                ) : selectedForm.mode === 'vote' || selectedForm.mode === 'vote_simple' ? (
                  <>
                    {totalVotes > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: selectedForm.mode === 'vote' ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr',
                        gap: '12px',
                        marginBottom: '18px',
                      }}>
                        {selectedForm.mode === 'vote' && winningTheme && winningTitle && (
                          <>
                            <div style={{ border: '1px solid #e9d5ff', borderRadius: '12px', background: '#faf5ff', padding: '14px 16px' }}>
                              <p className="fala-eyebrow" style={{ marginBottom: '6px' }}>TEMA VENCEDOR</p>
                              <strong style={{ display: 'block', fontSize: '1.12rem' }}>{winningTheme.label}</strong>
                              <span style={{ color: '#5b21b6' }}>{winningTheme.count} voto{winningTheme.count === 1 ? '' : 's'}</span>
                            </div>
                            <div style={{ border: '1px solid #dbeafe', borderRadius: '12px', background: '#eff6ff', padding: '14px 16px' }}>
                              <p className="fala-eyebrow" style={{ marginBottom: '6px' }}>TÍTULO VENCEDOR</p>
                              <strong style={{ display: 'block', fontSize: '1.12rem' }}>{winningTitle.label}</strong>
                              <span style={{ color: '#1d4ed8' }}>Tema: {winningTitle.theme} · {winningTitle.count} voto{winningTitle.count === 1 ? '' : 's'}</span>
                            </div>
                          </>
                        )}
                        {selectedForm.mode === 'vote_simple' && winningTheme && (
                          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f8fafc', padding: '14px 16px' }}>
                            <p className="fala-eyebrow" style={{ marginBottom: '6px' }}>VENCEDOR</p>
                            <strong style={{ display: 'block', fontSize: '1.12rem' }}>{winningTheme.label}</strong>
                            <span style={{ color: '#475569' }}>{winningTheme.count} voto{winningTheme.count === 1 ? '' : 's'}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="vote-results">
                      {!totalVotes && (
                        <p className="voice-results-empty">A votação ainda não recebeu votos. Compartilhe o link para iniciar.</p>
                      )}
                      {optionCounts.map((option, index) => {
                        const percentage = totalVotes ? Math.round((option.count / totalVotes) * 100) : 0
                        const titles = selectedForm.mode === 'vote' ? subOptionCounts[index] ?? [] : []
                        const selectedThemeCount = option.count
                        return (
                          <article className="vote-result" key={`${index}-${option.label}`}>
                            <div className="vote-result__heading">
                              <span className="vote-result__rank">{String(index + 1).padStart(2, '0')}</span>
                              <strong>{option.label}</strong>
                              <span className="vote-result__count">{option.count} · {percentage}%</span>
                            </div>
                            <div className="vote-result__track" aria-label={`${option.label}: ${option.count} votos, ${percentage}%`}>
                              <span style={{ width: `${percentage}%` }} />
                            </div>
                            {selectedForm.mode === 'vote' && titles.length > 0 && (
                              <div className="vote-subresults">
                                <p className="vote-subresults__note">
                                  Percentual de quem escolheu este tema; cada participante pode marcar até {selectedForm.maxTitleSelections ?? DEFAULT_VOTE_TITLE_SELECTION_LIMIT} propostas.
                                </p>
                                {titles.map((title, titleIndex) => {
                                  const titlePercentage = selectedThemeCount
                                    ? Math.round((title.count / selectedThemeCount) * 100)
                                    : 0
                                  return (
                                    <div className="vote-subresult" key={`${titleIndex}-${title.label}`}>
                                      <div className="vote-subresult__heading">
                                        <span>{title.label}</span>
                                        <small>{title.count} · {titlePercentage}%</small>
                                      </div>
                                      <div className="vote-subresult__track">
                                        <span style={{ width: `${titlePercentage}%` }} />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </article>
                        )
                      })}
                    </div>
                    {totalVotes > 0 && (
                      <section className="vote-voters" aria-labelledby="vote-voters-title">
                        <div className="vote-voters__heading">
                          <div>
                            <p className="fala-eyebrow">TRANSPARÊNCIA DA ESCUTA</p>
                            <h3 id="vote-voters-title">Quem votou e em quê</h3>
                          </div>
                          <span>{totalVotes} {totalVotes === 1 ? 'participante' : 'participantes'}</span>
                        </div>
                        <div className="vote-voters__insights">
                          <div className="vote-occupation">
                            <div>
                              <p className="fala-eyebrow">PERFIL DE QUEM PARTICIPOU</p>
                              <h4>Ocupação dos participantes</h4>
                            </div>
                            <div className="vote-occupation__content">
                              <div
                                className="vote-occupation__pie"
                                style={occupationChartStyle}
                                role="img"
                                aria-label={occupationTotal
                                  ? `Distribuição por ocupação entre ${occupationTotal} participantes`
                                  : 'Sem votos registrados por ocupação'}
                              />
                              <ul className="vote-occupation__legend">
                                {entrySummary.occupationCounts.map((item, index) => {
                                  const percentage = occupationTotal
                                    ? Math.round((item.count / occupationTotal) * 100)
                                    : 0
                                  return (
                                    <li key={item.occupation}>
                                      <button
                                        type="button"
                                        className="vote-occupation__filter"
                                        onClick={() => {
                                          setOccupationFilter((current) => (
                                            current === item.occupation ? '' : item.occupation
                                          ))
                                          resetEntryPagination()
                                        }}
                                        aria-pressed={occupationFilter === item.occupation}
                                      >
                                        <span
                                          className="vote-occupation__swatch"
                                          style={{ backgroundColor: OCCUPATION_COLORS[index % OCCUPATION_COLORS.length] }}
                                          aria-hidden="true"
                                        />
                                        <span>{item.occupation}</span>
                                        <strong>{item.count}</strong>
                                        <small>{percentage}%</small>
                                      </button>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          </div>
                          <div className="vote-voters__filters">
                            <label className="voice-field">
                              <span>Filtrar por ocupação</span>
                              <select
                                value={occupationFilter}
                                onChange={(event) => {
                                  setOccupationFilter(event.target.value)
                                  resetEntryPagination()
                                }}
                              >
                                <option value="">Todas as ocupações</option>
                                {LISTENING_OCCUPATIONS.map((occupation) => (
                                  <option key={occupation} value={occupation}>{occupation}</option>
                                ))}
                              </select>
                            </label>
                            <label className="voice-field">
                              <span>Filtrar por opção votada</span>
                              <select
                                value={choiceIndexFilter}
                                onChange={(event) => {
                                  setChoiceIndexFilter(event.target.value)
                                  resetEntryPagination()
                                }}
                              >
                                <option value="">Todas as opções</option>
                                {(selectedForm.options ?? []).map((option, index) => (
                                  <option key={`${index}-${getVoteOptionLabel(option)}`} value={index}>
                                    {getVoteOptionLabel(option)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <p>{filteredEntryTotal} {filteredEntryTotal === 1 ? 'participante corresponde' : 'participantes correspondem'} aos filtros.</p>
                          </div>
                        </div>
                        {!entries.length ? (
                          <p className="voice-results-empty">Nenhum participante corresponde aos filtros selecionados.</p>
                        ) : (
                        <ol className="vote-voters__list">
                          {entries.map((entry) => {
                              const school = SCHOOL_BY_CODE.get(entry.schoolId)
                              const selectedOption = selectedForm.options[entry.choiceIndex]
                              const choice = selectedOption
                                ? getVoteOptionLabel(selectedOption)
                                : 'Opção não identificada'
                              const subChoices = selectedForm.mode === 'vote'
                                ? getEntrySubChoiceIndexes(entry)
                                  .map((subChoiceIndex) => getVoteOptionTitles(selectedOption)[subChoiceIndex])
                                  .filter(Boolean)
                                : []
                              return (
                                <li className="vote-voter" key={entry.id}>
                                  <div className="vote-voter__identity">
                                    <strong>{entry.name}</strong>
                                    {getOccupationLabel(entry) && <span>{getOccupationLabel(entry)}</span>}
                                    {school && (
                                      <span>{school.name} · {school.municipality}</span>
                                    )}
                                  </div>
                                  <div className="vote-voter__choice">
                                    <span>VOTOU EM</span>
                                    <strong>{choice}</strong>
                                    {subChoices.map((subChoice) => <span key={subChoice}>{subChoice}</span>)}
                                  </div>
                                </li>
                              )
                            })}
                        </ol>
                        )}
                        <div className="vote-voters__pagination" aria-label="Paginação dos participantes">
                          <button
                            type="button"
                            className="fala-button fala-button--secondary"
                            onClick={goToPreviousEntriesPage}
                            disabled={entriesPage === 1 || entriesLoading}
                          >
                            Página anterior
                          </button>
                          <span>Página {entriesPage} · {entries.length} nesta página</span>
                          <button
                            type="button"
                            className="fala-button fala-button--secondary"
                            onClick={goToNextEntriesPage}
                            disabled={!entriesHasMore || entriesLoading}
                          >
                            Próxima página
                          </button>
                        </div>
                      </section>
                    )}
                  </>
                ) : entries.length ? (
                  <div className="voice-entry-grid">
                    {entries.map((entry, index) => {
                      const school = SCHOOL_BY_CODE.get(entry.schoolId)
                      return (
                        <article className="voice-entry-card" key={entry.id}>
                          <span className="voice-entry-card__number">
                            {String((entriesPage - 1) * LISTENING_ENTRIES_PAGE_SIZE + entries.length - index).padStart(2, '0')}
                          </span>
                          <h3>{entry.theme}</h3>
                          <p className="voice-entry-card__importance">{entry.importance}</p>
                          {entry.question && (
                            <blockquote>
                              <span>PARA LEVAR À RODA</span>
                              {entry.question}
                            </blockquote>
                          )}
                          <footer>
                            <strong>{entry.name}</strong>
                            {getOccupationLabel(entry) && (
                              <>
                                <span>·</span>
                                {getOccupationLabel(entry)}
                              </>
                            )}
                            {school && (
                              <>
                                <span>·</span>
                                {school.name}
                                <small>
                                  {school.municipality} · SEC {school.codSec}
                                  {school.codInep ? ` · MEC/INEP ${school.codInep}` : ' · INEP não informado'}
                                </small>
                              </>
                            )}
                          </footer>
                        </article>
                      )
                    })}
                    <div className="vote-voters__pagination" aria-label="Paginação das contribuições">
                      <button
                        type="button"
                        className="fala-button fala-button--secondary"
                        onClick={goToPreviousEntriesPage}
                        disabled={entriesPage === 1 || entriesLoading}
                      >
                        Página anterior
                      </button>
                      <span>
                        Página {entriesPage} · {entries.length} de {filteredEntryTotal} contribuições
                      </span>
                      <button
                        type="button"
                        className="fala-button fala-button--secondary"
                        onClick={goToNextEntriesPage}
                        disabled={!entriesHasMore || entriesLoading}
                      >
                        Próxima página
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="voice-results-empty">
                    <MessageCircle size={23} />
                    <p>Ainda não chegaram ideias. Compartilhe o link e abra espaço para a conversa.</p>
                    <button type="button" className="fala-button fala-button--secondary" onClick={() => copyLink(selectedForm.id)}>
                      <ClipboardCopy size={15} /> Copiar link da escuta
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      ) : (
        <div className="voice-admin-empty">
          <span><Sprout size={26} /></span>
          <p className="fala-eyebrow">UM ESPAÇO DIFERENTE DE APRESENTAÇÃO</p>
          <h2>Escutar também é construir.</h2>
          <p>Crie um convite aberto, escolha as unidades escolares e reúna as ideias em um mural vivo.</p>
          <button type="button" className="fala-button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Criar minha primeira escuta
          </button>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          if (!saving) {
            setCreateOpen(false)
            resetCreateForm()
          }
        }}
        maxWidth="max-w-2xl"
        ariaLabel="Criar nova escuta"
      >
        <form className="voice-create-form" onSubmit={saveForm}>
          <p className="fala-eyebrow">UM CONVITE À PARTICIPAÇÃO</p>
          <h2>{editingFormId ? 'Editar escuta' : 'Criar uma escuta'}</h2>
          <p className="voice-create-form__intro">
            {editingFormId
              ? 'Atualize as informações da escuta. As respostas e o link público serão mantidos.'
              : 'Cada link abre uma página pública própria. Escolha entre reunir propostas abertas ou consultar a preferência por meio de uma votação.'}
          </p>
          {!editingFormId && (
            <fieldset className="voice-mode-picker">
              <legend>Como será esta escuta?</legend>
              <button type="button" className={mode === 'open' ? 'is-selected' : ''} aria-pressed={mode === 'open'} onClick={() => chooseMode('open')}>
                <MessageCircle size={18} />
                <strong>Ideias abertas</strong>
                <span>Uma proposta com contexto de cada unidade.</span>
              </button>
              <button type="button" className={mode === 'vote_simple' ? 'is-selected' : ''} aria-pressed={mode === 'vote_simple'} onClick={() => chooseMode('vote_simple')}>
                <Vote size={18} />
                <strong>Votação simples</strong>
                <span>Escolha uma opção entre várias alternativas.</span>
              </button>
              <button type="button" className={mode === 'vote' ? 'is-selected' : ''} aria-pressed={mode === 'vote'} onClick={() => chooseMode('vote')}>
                <Vote size={18} />
                <strong>Votação com tema e propostas</strong>
                <span>Um tema e várias propostas para priorizar.</span>
              </button>
            </fieldset>
          )}
          <label className="voice-field">
            <span>Nome da escuta <b>obrigatório</b></span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={120} />
          </label>
          <label className="voice-field">
                      <span>Texto de abertura</span>
                      <textarea
                        value={introduction}
                        onChange={(event) => setIntroduction(event.target.value)}
                        rows={5}
              placeholder="Conte por que esta conversa está sendo aberta."
            />
          </label>
          <label className="voice-field">
            <span>{isVoteMode(mode) ? 'Pergunta da votação' : 'Pergunta principal'} <b>obrigatória</b></span>
            <input
              value={topicPrompt}
              onChange={(event) => setTopicPrompt(event.target.value)}
              required
              minLength={5}
              maxLength={180}
              placeholder="O que você quer convidar o público a propor?"
            />
          </label>
          <label className="voice-field">
            <span>Período da consulta</span>
            <input
              value={consultationPeriod}
              onChange={(event) => setConsultationPeriod(event.target.value)}
              maxLength={180}
              placeholder="Ex.: A consulta está disponível de 4 a 8 de novembro."
            />
          </label>
          {mode === 'vote' && (
            <label className="voice-field">
              <span>Limite de títulos por participante</span>
              <input
                type="number"
                min={1}
                max={MAX_VOTE_TITLE_SELECTION_LIMIT}
                step={1}
                required
                value={maxTitleSelections}
                disabled={optionsLocked}
                onChange={(event) => setMaxTitleSelections(Number(event.target.value))}
              />
              <small>
                Cada participante poderá selecionar de 1 a {maxTitleSelections} títulos, respeitando a quantidade disponível no tema.
                {optionsLocked && ' O limite fica bloqueado depois do primeiro voto.'}
              </small>
            </label>
          )}
          {mode === 'vote_simple' && !optionsLocked && (
            <section className="voice-vote-editor" aria-label="Opções da votação simples">
              <div className="voice-vote-editor__heading">
                <div>
                  <span>OPÇÕES DE VOTO</span>
                  <p>Adicione alternativas que o público pode escolher diretamente.</p>
                </div>
                <span>{voteOptions.length}/10 opções</span>
              </div>
              {voteOptions.map((option, index) => (
                <fieldset className="voice-vote-editor__theme" key={`vote-simple-${index}`}>
                  <legend>Opção {String(index + 1).padStart(2, '0')}</legend>
                  <label className="voice-field">
                    <span>Nome da opção <b>obrigatório</b></span>
                    <input
                      value={option.label}
                      onChange={(event) => updateVoteOption(index, 'label', event.target.value)}
                      required
                      maxLength={180}
                      placeholder="Ex.: Forte investimento na formação docente"
                    />
                  </label>
                  {voteOptions.length > 2 && (
                    <button
                      type="button"
                      className="voice-vote-editor__remove"
                      onClick={() => removeVoteOption(index)}
                    >
                      Remover opção
                    </button>
                  )}
                </fieldset>
              ))}
              <button
                type="button"
                className="fala-button fala-button--secondary"
                onClick={addVoteOption}
                disabled={voteOptions.length >= 10}
              >
                <Plus size={15} /> Adicionar opção
              </button>
            </section>
          )}
          {mode === 'vote' && !optionsLocked && (
            <section className="voice-vote-editor" aria-label="Temas e títulos da votação">
              <div className="voice-vote-editor__heading">
                <div>
                  <span>OPÇÕES DE VOTO</span>
                  <p>Adicione os temas e os títulos que poderão ser escolhidos em cada tema.</p>
                </div>
                <span>{voteOptions.length}/10 temas</span>
              </div>
              {voteOptions.map((option, index) => (
                <fieldset className="voice-vote-editor__theme" key={`vote-theme-${index}`}>
                  <legend>Tema {String(index + 1).padStart(2, '0')}</legend>
                  <label className="voice-field">
                    <span>Nome do tema <b>obrigatório</b></span>
                    <input
                      value={option.label}
                      onChange={(event) => updateVoteOption(index, 'label', event.target.value)}
                      required
                      maxLength={180}
                      placeholder="Ex.: Aprendizagem e equidade"
                    />
                  </label>
                  <label className="voice-field">
                    <span>Títulos deste tema <b>um por linha</b></span>
                    <textarea
                      value={option.titlesText}
                      onChange={(event) => updateVoteOption(index, 'titlesText', event.target.value)}
                      required={option.hasTitles}
                      rows={Math.min(7, Math.max(3, option.titlesText.split('\n').length))}
                      placeholder="Digite cada título em uma linha."
                    />
                  </label>
                  {voteOptions.length > 2 && (
                    <button
                      type="button"
                      className="voice-vote-editor__remove"
                      onClick={() => removeVoteOption(index)}
                    >
                      Remover tema
                    </button>
                  )}
                </fieldset>
              ))}
              <button
                type="button"
                className="fala-button fala-button--secondary"
                onClick={addVoteOption}
                disabled={voteOptions.length >= 10}
              >
                <Plus size={15} /> Adicionar tema
              </button>
            </section>
          )}
          {mode === 'vote_simple' && optionsLocked && (
            <div className="voice-vote-locked" role="note">
              <strong>Opções bloqueadas</strong>
              <span>Esta votação já tem respostas. As opções não podem ser alteradas para preservar a apuração dos votos.</span>
              <ul>
                {voteOptions.map((option, index) => (
                  <li key={`${index}-${option.label}`}>
                    <strong>{option.label}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {mode === 'vote' && optionsLocked && (
            <div className="voice-vote-locked" role="note">
              <strong>Temas e títulos bloqueados</strong>
              <span>Esta votação já tem respostas. Os temas e títulos não podem ser alterados para preservar a apuração dos votos.</span>
              <ul>
                {voteOptions.map((option, index) => (
                  <li key={`${index}-${option.label}`}>
                    <strong>{option.label}</strong>
                    {option.titlesText && <span>{parseListeningOptions(option.titlesText).join(' · ')}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="voice-school-catalog">
            <p className="fala-eyebrow">CATÁLOGO DAS UNIDADES EM ATIVIDADE</p>
            <strong>{SCHOOL_UNITS.length.toLocaleString('pt-BR')} unidades escolares</strong>
            <span>Na página pública, a busca aceita nome da unidade, código SEC ou código MEC/INEP.</span>
          </div>
          {actionError && <p className="fala-error" role="alert">{actionError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="fala-button fala-button--secondary" disabled={saving} onClick={() => {
              setCreateOpen(false)
              resetCreateForm()
            }}>
              Cancelar
            </button>
            <button type="submit" className="fala-button" disabled={saving}>
              {saving
                ? (editingFormId ? 'Salvando…' : 'Criando…')
                : editingFormId
                  ? <>Salvar alterações <Check size={16} /></>
                  : <>Criar escuta <Sprout size={16} /></>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(shareFormId)}
        onClose={closeSharePanel}
        maxWidth="max-w-xl"
        ariaLabel="Compartilhar escuta com a equipe"
      >
        <form className="voice-create-form" onSubmit={addListeningCollaborator}>
          <p className="fala-eyebrow">ACESSO DA EQUIPE</p>
          <h2>Compartilhar escuta</h2>
          <p className="voice-create-form__intro">
            Convide colegas pelo e-mail institucional para acompanhar esta escuta. Editores podem ajustar textos,
            opções e encerrar/reabrir; leitores apenas acompanham os resultados. Somente você, dono da escuta,
            gerencia acessos e pode apagá-la.
          </p>
          <div className="voice-share-row">
            <label className="voice-field">
              <span>E-mail da pessoa <b>obrigatório</b></span>
              <input
                type="email"
                value={shareEmail}
                onChange={(event) => setShareEmail(event.target.value)}
                placeholder="nome@secti.ba.gov.br"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </label>
            <label className="voice-field">
              <span>Permissão</span>
              <select value={shareRole} onChange={(event) => setShareRole(event.target.value)}>
                <option value="viewer">Acompanhar (leitor)</option>
                <option value="editor">Acompanhar e editar (editor)</option>
              </select>
            </label>
          </div>
          <button type="submit" className="fala-button fala-button--secondary" disabled={shareSaving}>
            <Users size={15} /> Adicionar pessoa
          </button>
          {shareError && <p className="fala-error" role="alert">{shareError}</p>}
          <div className="voice-share-list">
            {shareCollaborators.length ? (
              shareCollaborators.map((collaborator) => (
                <div className="voice-share-item" key={`${collaborator.role}-${collaborator.email}`}>
                  <div>
                    <strong>{collaborator.email}</strong>
                    <span>{collaborator.role === 'editor' ? 'Editor' : 'Leitor'}</span>
                  </div>
                  <button
                    type="button"
                    className="voice-small-action voice-small-action--danger"
                    disabled={shareSaving}
                    onClick={() => removeListeningCollaborator(collaborator)}
                    aria-label={`Remover acesso de ${collaborator.email}`}
                  >
                    Remover
                  </button>
                </div>
              ))
            ) : (
              <p className="voice-share-item voice-share-item--empty">Ninguém compartilhado ainda.</p>
            )}
          </div>
          <div className="flex justify-end">
            <button type="button" className="fala-button" onClick={closeSharePanel} disabled={shareSaving}>
              Fechar <Check size={16} />
            </button>
          </div>
        </form>
      </Modal>

      <Modal
              open={deleteConfirmOpen}
              onClose={cancelDeleteForm}
              ariaLabel="Apagar escuta"
              maxWidth="max-w-sm"
            >
              <h2 className="text-lg font-semibold mb-4">Apagar escuta</h2>
              <p className="mb-4">Tem certeza que deseja apagar esta escuta? Esta ação não pode ser desfeita.</p>
              <p className="text-sm text-muted-foreground mb-6">Todas as contribuições e votações associadas serão removidas permanentemente.</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="fala-button fala-button--secondary"
                  onClick={cancelDeleteForm}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="fala-button fala-button--danger"
                  onClick={confirmDeleteForm}
                >
                  Apagar permanentemente
                </button>
              </div>
            </Modal>
    </WorkspaceShell>
  )
}
