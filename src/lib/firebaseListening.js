import {
  addDoc,
  collection,
  documentId,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../firebase'
import SCHOOL_UNITS from '../data/schoolUnits.json'
import {
  AUTH_DOMAIN_LABEL,
  DEFAULT_VOTE_TITLE_SELECTION_LIMIT,
  MAX_LISTENING_COLLABORATORS,
  MAX_VOTE_TITLE_SELECTION_LIMIT,
} from './constants'
import { isSecEmail } from './validators'

const formsCol = () => collection(db, 'listeningForms')
const formRef = (id) => doc(db, 'listeningForms', id)
const entriesCol = (id) => collection(db, 'listeningForms', id, 'entries')

const cleanText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')
const SCHOOL_IDS = SCHOOL_UNITS.map((unit) => unit.codSec)
const LISTENING_MODES = ['open', 'vote', 'vote_simple']
export const LISTENING_OCCUPATIONS = [
  'Estudante',
  'Professor da educação básica',
  'Professor Ensino Médio por Intermediação Tecnológica (EMITec)',
  'Professor universitário',
  'Gestor',
  'Coordenação Pedagógica',
  'Outro',
]
export const LISTENING_ENTRIES_PAGE_SIZE = 20
const isVoteMode = (mode) => mode === 'vote' || mode === 'vote_simple'

const normalizeOptions = (options) => Array.isArray(options)
  ? options.map((option) => (
    typeof option === 'string'
      ? cleanText(option)
      : {
        label: cleanText(option?.label),
        titles: Array.isArray(option?.titles) ? option.titles.map(cleanText).filter(Boolean) : [],
      }
  ))
  : []

const validateOptions = (options, mode = 'vote') => {
  if (options.length < 2 || options.length > 10) {
    throw new Error(mode === 'vote_simple'
      ? 'A votação simples precisa ter entre 2 e 10 opções.'
      : 'A votação precisa ter entre 2 e 10 temas.')
  }

  if (mode === 'vote') {
    if (options.some((option) => (
      typeof option === 'string'
        ? !option || option.length > 180
        : !option.label || option.label.length > 180
          || option.titles.length < 1
          || option.titles.length > 30
          || option.titles.some((entry) => entry.length > 180)
    ))) {
      throw new Error('Cada tema deve ter um nome e entre 1 e 30 títulos, com no máximo 180 caracteres cada.')
    }

    for (const option of options) {
      if (typeof option === 'string') continue
      const normalizedTitles = option.titles.map((entry) => entry.toLocaleLowerCase('pt-BR'))
      if (new Set(normalizedTitles).size !== normalizedTitles.length) {
        throw new Error(`Remova os títulos repetidos do tema “${option.label}”.`)
      }
    }
  } else {
    if (options.some((option) => (
      typeof option === 'string'
        ? !option || option.length > 180
        : !option.label || option.label.length > 180
    ))) {
      throw new Error('Cada opção de votação deve ter um nome com até 180 caracteres.')
    }
  }

  const normalizedOptions = options.map((option) => (
    (typeof option === 'string' ? option : option.label).toLocaleLowerCase('pt-BR')
  ))
  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    throw new Error(mode === 'vote_simple'
      ? 'Remova as opções repetidas da votação simples.'
      : 'Remova os temas repetidos da votação.')
  }
}

export const parseListeningOptions = (value) => String(value ?? '')
  .split(/\r?\n/)
  .map(cleanText)
  .filter(Boolean)

const getVoterId = (formId) => {
  const key = `cloudspeak-listening-vote-${formId}`
  try {
    let voterId = window.sessionStorage.getItem(key)
    if (!voterId) {
      voterId = crypto.randomUUID()
      window.sessionStorage.setItem(key, voterId)
    }
    return voterId
  } catch (error) {
    console.error('Unable to access session storage for vote id', error)
    throw new Error('Este navegador não permite manter o registro do voto nesta aba. Habilite o armazenamento da sessão e tente novamente.')
  }
}

export const getSubmittedVoterName = (formId) => {
  try {
    return window.sessionStorage.getItem(`cloudspeak-listening-submitted-${formId}`) ?? ''
  } catch (error) {
    console.error('Unable to access session storage for vote status', error)
    return ''
  }
}

export const createListeningForm = async ({
  ownerUid,
  title,
  introduction,
  topicPrompt,
  consultationPeriod,
  mode = 'open',
  options = [],
  maxTitleSelections = DEFAULT_VOTE_TITLE_SELECTION_LIMIT,
}) => {
  const cleanTitle = cleanText(title)
  const cleanIntroduction = String(introduction ?? '').trim()
  const cleanTopicPrompt = cleanText(topicPrompt)
  const cleanConsultationPeriod = String(consultationPeriod ?? '').trim()
  const cleanOptions = normalizeOptions(options)

  if (!ownerUid) throw new Error('É necessário estar conectado para criar uma escuta.')
  if (!LISTENING_MODES.includes(mode)) throw new Error('Formato de escuta inválido.')
  if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      throw new Error('O título deve ter entre 3 e 120 caracteres.')
    }
    if (cleanTopicPrompt.length < 5 || cleanTopicPrompt.length > 180) {
      throw new Error('A pergunta principal deve ter entre 5 e 180 caracteres.')
    }
    if (cleanConsultationPeriod.length > 180) {
      throw new Error('O período da consulta pode ter no máximo 180 caracteres.')
    }
    if (!Number.isInteger(maxTitleSelections)
      || maxTitleSelections < 1
      || maxTitleSelections > MAX_VOTE_TITLE_SELECTION_LIMIT) {
      throw new Error(`O limite de títulos deve ser um número entre 1 e ${MAX_VOTE_TITLE_SELECTION_LIMIT}.`)
    }
    if (isVoteMode(mode)) validateOptions(cleanOptions, mode)

    const payload = {
      title: cleanTitle,
      introduction: cleanIntroduction,
      topicPrompt: cleanTopicPrompt,
      consultationPeriod: cleanConsultationPeriod || 'A consulta está disponível de 4 a 8 de novembro.',
      mode,
      maxTitleSelections,
      options: isVoteMode(mode) ? cleanOptions : [],
      schoolIds: SCHOOL_IDS,
      status: 'open',
      ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const reference = await addDoc(formsCol(), payload)
    return { id: reference.id, ...payload }
  }

  export const updateListeningForm = async (id, {
    title,
    introduction,
    topicPrompt,
    consultationPeriod,
    mode = 'open',
    options,
    maxTitleSelections = DEFAULT_VOTE_TITLE_SELECTION_LIMIT,
  }) => {
    const cleanTitle = cleanText(title)
    const cleanIntroduction = String(introduction ?? '').trim()
    const cleanTopicPrompt = cleanText(topicPrompt)
    const cleanConsultationPeriod = String(consultationPeriod ?? '').trim()

    if (cleanTitle.length < 3 || cleanTitle.length > 120) {
      throw new Error('O título deve ter entre 3 e 120 caracteres.')
    }
    if (cleanTopicPrompt.length < 5 || cleanTopicPrompt.length > 180) {
      throw new Error('A pergunta principal deve ter entre 5 e 180 caracteres.')
    }
    if (cleanConsultationPeriod.length > 180) {
      throw new Error('O período da consulta pode ter no máximo 180 caracteres.')
    }
    if (!LISTENING_MODES.includes(mode)) throw new Error('Formato de escuta inválido.')
    if (!Number.isInteger(maxTitleSelections)
      || maxTitleSelections < 1
      || maxTitleSelections > MAX_VOTE_TITLE_SELECTION_LIMIT) {
      throw new Error(`O limite de títulos deve ser um número entre 1 e ${MAX_VOTE_TITLE_SELECTION_LIMIT}.`)
    }

  const payload = {
    title: cleanTitle,
    introduction: cleanIntroduction,
    topicPrompt: cleanTopicPrompt,
    consultationPeriod: cleanConsultationPeriod || 'A consulta está disponível de 4 a 8 de novembro.',
    mode,
    maxTitleSelections,
    updatedAt: serverTimestamp(),
  }
  if (options !== undefined) {
    const cleanOptions = normalizeOptions(options)
    if (mode === 'open' && cleanOptions.length > 0) {
      throw new Error('Escutas abertas não podem ter opções de votação.')
    }
    if (isVoteMode(mode)) validateOptions(cleanOptions, mode)
    payload.options = cleanOptions
  }
  await updateDoc(formRef(id), payload)
}

export const getListeningForm = async (id) => {
  const snapshot = await getDoc(formRef(id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export const subscribeUserListeningForms = (ownerUid, onNext, onError) => {
  const q = query(formsCol(), where('ownerUid', '==', ownerUid))
  return onSnapshot(
    q,
    (snapshot) => {
      const forms = snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() }))
        .sort((left, right) => (right.createdAt?.toMillis?.() ?? 0) - (left.createdAt?.toMillis?.() ?? 0))
      onNext(forms)
    },
    onError,
  )
}

export const normalizeListeningCollaboratorEmail = (value) => cleanText(value).toLowerCase()

const normalizeCollaboratorList = (value) => Array.isArray(value)
  ? [...new Set(value.map(normalizeListeningCollaboratorEmail))]
  : []

const assertCollaboratorList = (list, label) => {
  if (list.length > MAX_LISTENING_COLLABORATORS) {
    throw new Error(`A lista de ${label} pode ter no máximo ${MAX_LISTENING_COLLABORATORS} e-mails.`)
  }
  const invalid = list.find((email) => !isSecEmail(email))
  if (invalid) {
    throw new Error(`O e-mail “${invalid}” não é permitido. Use e-mails de um destes domínios: ${AUTH_DOMAIN_LABEL}.`)
  }
}

export const subscribeSharedListeningForms = (email, onNext, onError) => {
  const normalizedEmail = normalizeListeningCollaboratorEmail(email)
  if (!isSecEmail(normalizedEmail)) {
    onNext([])
    return () => {}
  }

  const state = { editors: [], viewers: [] }
  const emit = () => {
    const merged = new Map()
    state.editors.forEach((entry) => merged.set(entry.id, { ...entry, role: 'editor' }))
    state.viewers.forEach((entry) => {
      if (!merged.has(entry.id)) merged.set(entry.id, { ...entry, role: 'viewer' })
    })
    const forms = [...merged.values()]
      .sort((left, right) => (right.createdAt?.toMillis?.() ?? 0) - (left.createdAt?.toMillis?.() ?? 0))
    onNext(forms)
  }
  const subscribeTeamQuery = (field, stateKey) => onSnapshot(
    query(formsCol(), where(field, 'array-contains', normalizedEmail)),
    (snapshot) => {
      state[stateKey] = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
      emit()
    },
    onError,
  )
  const cancelEditors = subscribeTeamQuery('editorEmails', 'editors')
  const cancelViewers = subscribeTeamQuery('viewerEmails', 'viewers')
  return () => {
    cancelEditors()
    cancelViewers()
  }
}

export const updateListeningCollaborators = async (id, { editorEmails = [], viewerEmails = [] } = {}) => {
  const editors = normalizeCollaboratorList(editorEmails)
  const viewers = normalizeCollaboratorList(viewerEmails)
  assertCollaboratorList(editors, 'editores')
  assertCollaboratorList(viewers, 'leitores')
  // Edição vence leitura: remove das listas de leitura quem também é editor.
  const viewersOnly = viewers.filter((email) => !editors.includes(email))
  await updateDoc(formRef(id), {
    editorEmails: editors,
    viewerEmails: viewersOnly,
    updatedAt: serverTimestamp(),
  })
}

export const getListeningEntriesPage = async (
  id,
  { occupation = '', choiceIndex = '', cursor = null } = {},
) => {
  const filters = []
  if (occupation) filters.push(where('occupation', '==', occupation))
  if (choiceIndex !== '') filters.push(where('choiceIndex', '==', Number(choiceIndex)))
  const constraints = [...filters]
  constraints.push(orderBy('createdAt', 'desc'), orderBy(documentId(), 'desc'))
  if (cursor) constraints.push(startAfter(cursor))
  constraints.push(limit(LISTENING_ENTRIES_PAGE_SIZE + 1))

  const [snapshot, totalCount] = await Promise.all([
    getDocs(query(entriesCol(id), ...constraints)),
    countListeningEntries(id, ...filters),
  ])
  const pageDocs = snapshot.docs.slice(0, LISTENING_ENTRIES_PAGE_SIZE)

  return {
    entries: pageDocs.map((entry) => ({ id: entry.id, ...entry.data() })),
    cursor: pageDocs.length ? pageDocs[pageDocs.length - 1] : null,
    hasMore: snapshot.docs.length > LISTENING_ENTRIES_PAGE_SIZE,
    totalCount,
  }
}

const countListeningEntries = async (id, ...constraints) => {
  const result = await getCountFromServer(query(entriesCol(id), ...constraints))
  return result.data().count
}

export const getListeningEntrySummary = async (id, options = [], mode = 'open') => {
  const countQueries = [[]]
  const addCountQuery = (...constraints) => {
    countQueries.push(constraints)
    return countQueries.length - 1
  }
  const totalIndex = 0
  const occupationIndexes = isVoteMode(mode)
    ? LISTENING_OCCUPATIONS.map((occupation) => ({
      occupation,
      countIndex: addCountQuery(where('occupation', '==', occupation)),
    }))
    : []
  const optionIndexes = isVoteMode(mode)
    ? options.map((option, choiceIndex) => ({
      label: typeof option === 'string' ? option : option?.label ?? '',
      countIndex: addCountQuery(where('choiceIndex', '==', choiceIndex)),
      subOptions: mode === 'vote' && Array.isArray(option?.titles)
        ? option.titles.map((label, subChoiceIndex) => ({
          label,
          arrayCountIndex: addCountQuery(
            where('choiceIndex', '==', choiceIndex),
            where('subChoiceIndexes', 'array-contains', subChoiceIndex),
          ),
          legacyCountIndex: addCountQuery(
            where('choiceIndex', '==', choiceIndex),
            where('subChoiceIndex', '==', subChoiceIndex),
          ),
        }))
        : [],
    }))
    : []

  const counts = new Array(countQueries.length)
  let nextQueryIndex = 0
  const workerCount = Math.min(10, countQueries.length)
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextQueryIndex < countQueries.length) {
      const index = nextQueryIndex
      nextQueryIndex += 1
      counts[index] = await countListeningEntries(id, ...countQueries[index])
    }
  }))

  return {
    total: counts[totalIndex],
    occupationCounts: occupationIndexes.map(({ occupation, countIndex }) => ({
      occupation,
      count: counts[countIndex],
    })),
    optionCounts: optionIndexes.map(({ label, countIndex }) => ({
      label,
      count: counts[countIndex],
    })),
    subOptionCounts: optionIndexes.map(({ subOptions }) => subOptions.map((item) => ({
      label: item.label,
      count: counts[item.arrayCountIndex] + counts[item.legacyCountIndex],
    }))),
  }
}

export const subscribeLatestListeningEntry = (id, onChange, onError) => {
  const q = query(
    entriesCol(id),
    orderBy('createdAt', 'desc'),
    orderBy(documentId(), 'desc'),
    limit(1),
  )
  let initialized = false
  return onSnapshot(
    q,
    () => {
      if (initialized) onChange()
      initialized = true
    },
    onError,
  )
}

export const setListeningFormStatus = async (id, status) => {
  if (!['open', 'closed'].includes(status)) throw new Error('Status de escuta inválido.')
  await updateDoc(formRef(id), { status, updatedAt: serverTimestamp() })
}

export const submitListeningEntry = async ({
  formId,
  mode = 'open',
  name,
  occupation,
  otherOccupation,
  schoolId,
  options = [],
  theme,
  importance,
  question,
  choiceIndex,
  subChoiceIndexes = [],
  maxTitleSelections = DEFAULT_VOTE_TITLE_SELECTION_LIMIT,
}) => {
  const cleanName = cleanText(name)
  const cleanSchoolId = cleanText(schoolId)
  const cleanOccupation = cleanText(occupation)
  const cleanOtherOccupation = cleanText(otherOccupation)

  if (cleanName.length < 2 || cleanName.length > 80) throw new Error('Informe seu nome (de 2 a 80 caracteres).')
  if (!LISTENING_OCCUPATIONS.includes(cleanOccupation)) {
    throw new Error('Selecione sua ocupação.')
  }
  if (cleanOccupation === 'Outro' && (cleanOtherOccupation.length < 2 || cleanOtherOccupation.length > 80)) {
    throw new Error('Descreva sua ocupação (de 2 a 80 caracteres).')
  }
  if (cleanOccupation !== 'Outro' && cleanOtherOccupation) {
    throw new Error('Remova a descrição adicional da ocupação selecionada.')
  }
  if (cleanSchoolId && !SCHOOL_IDS.includes(cleanSchoolId)) {
    throw new Error('Selecione sua unidade escolar na lista ou deixe o campo em branco.')
  }

  if (isVoteMode(mode)) {
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= options.length || choiceIndex > 9) {
      throw new Error(mode === 'vote_simple'
        ? 'Selecione uma opção antes de enviar seu voto.'
        : 'Selecione um dos temas antes de enviar seu voto.')
    }

    const voterId = getVoterId(formId)

    if (mode === 'vote') {
      if (!Number.isInteger(maxTitleSelections)
        || maxTitleSelections < 1
        || maxTitleSelections > MAX_VOTE_TITLE_SELECTION_LIMIT) {
        throw new Error(`O limite de títulos deve ser um número entre 1 e ${MAX_VOTE_TITLE_SELECTION_LIMIT}.`)
      }

      const selectedOption = options[choiceIndex]
      const titles = Array.isArray(selectedOption?.titles) ? selectedOption.titles : []
      if (!Array.isArray(subChoiceIndexes)) {
        throw new Error('Selecione as propostas do tema escolhido.')
      }
      const selectedTitles = [...new Set(subChoiceIndexes)]
      if (titles.length && (selectedTitles.length < 1 || selectedTitles.length > maxTitleSelections)) {
        throw new Error(`Selecione de uma a ${maxTitleSelections} propostas para o tema escolhido.`)
      }
      if (selectedTitles.some((index) => !Number.isInteger(index) || index < 0 || index >= titles.length)) {
        throw new Error('Uma das propostas selecionadas não pertence ao tema escolhido.')
      }
      if (!titles.length && selectedTitles.length > 0) {
        throw new Error('O tema escolhido não possui títulos adicionais.')
      }

      await setDoc(doc(entriesCol(formId), voterId), {
        name: cleanName,
        occupation: cleanOccupation,
        otherOccupation: cleanOtherOccupation,
        schoolId: cleanSchoolId,
        choiceIndex,
        ...(titles.length ? { subChoiceIndexes: selectedTitles } : {}),
        createdAt: serverTimestamp(),
      })
    } else {
      await setDoc(doc(entriesCol(formId), voterId), {
        name: cleanName,
        occupation: cleanOccupation,
        otherOccupation: cleanOtherOccupation,
        schoolId: cleanSchoolId,
        choiceIndex,
        createdAt: serverTimestamp(),
      })
    }

    window.sessionStorage.setItem(`cloudspeak-listening-submitted-${formId}`, cleanName)
    return
  }

  if (mode !== 'open') throw new Error('Formato de escuta inválido.')
  const cleanTheme = cleanText(theme)
  const cleanImportance = String(importance ?? '').trim()
  const cleanQuestion = String(question ?? '').trim()

  if (cleanTheme.length < 5 || cleanTheme.length > 180) {
    throw new Error('O tema deve ter entre 5 e 180 caracteres.')
  }
  if (cleanImportance.length < 10 || cleanImportance.length > 1200) {
    throw new Error('Conte por que esse tema importa (de 10 a 1.200 caracteres).')
  }
  if (cleanQuestion.length > 800) throw new Error('A pergunta pode ter no máximo 800 caracteres.')

  await addDoc(entriesCol(formId), {
    name: cleanName,
    occupation: cleanOccupation,
    otherOccupation: cleanOtherOccupation,
    schoolId: cleanSchoolId,
    theme: cleanTheme,
    importance: cleanImportance,
    question: cleanQuestion,
    createdAt: serverTimestamp(),
  })
}

  export const deleteListeningForm = async (id) => {
    const entriesSnapshot = await getDocs(entriesCol(id))
    await Promise.all(entriesSnapshot.docs.map((entryDoc) => deleteDoc(entryDoc.ref)))
    await deleteDoc(formRef(id))
  }
