import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../firebase'
import SCHOOL_UNITS from '../data/schoolUnits.json'

const formsCol = () => collection(db, 'listeningForms')
const formRef = (id) => doc(db, 'listeningForms', id)
const entriesCol = (id) => collection(db, 'listeningForms', id, 'entries')

const cleanText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')
const SCHOOL_IDS = SCHOOL_UNITS.map((unit) => unit.codSec)
const LISTENING_MODES = ['open', 'vote']

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

export const createListeningForm = async ({ ownerUid, title, introduction, topicPrompt, mode = 'open', options = [] }) => {
  const cleanTitle = cleanText(title)
  const cleanIntroduction = String(introduction ?? '').trim()
  const cleanTopicPrompt = cleanText(topicPrompt)
  const cleanOptions = Array.isArray(options) ? options.map(cleanText).filter(Boolean) : []

  if (!ownerUid) throw new Error('É necessário estar conectado para criar uma escuta.')
  if (!LISTENING_MODES.includes(mode)) throw new Error('Formato de escuta inválido.')
  if (cleanTitle.length < 3 || cleanTitle.length > 120) {
    throw new Error('O título deve ter entre 3 e 120 caracteres.')
  }
  if (cleanIntroduction.length > 800) {
    throw new Error('A apresentação da escuta pode ter no máximo 800 caracteres.')
  }
  if (cleanTopicPrompt.length < 5 || cleanTopicPrompt.length > 180) {
    throw new Error('A pergunta principal deve ter entre 5 e 180 caracteres.')
  }
  if (mode === 'vote' && (cleanOptions.length < 2 || cleanOptions.length > 10)) {
    throw new Error('A votação precisa ter entre 2 e 10 opções.')
  }
  if (cleanOptions.some((option) => option.length > 180)) {
    throw new Error('Cada opção pode ter no máximo 180 caracteres.')
  }
  const normalizedOptions = cleanOptions.map((option) => option.toLocaleLowerCase('pt-BR'))
  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    throw new Error('Remova as opções repetidas da votação.')
  }

  const payload = {
    title: cleanTitle,
    introduction: cleanIntroduction,
    topicPrompt: cleanTopicPrompt,
    mode,
    options: mode === 'vote' ? cleanOptions : [],
    schoolIds: SCHOOL_IDS,
    status: 'open',
    ownerUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const reference = await addDoc(formsCol(), payload)
  return { id: reference.id, ...payload }
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

export const subscribeListeningEntries = (id, onNext, onError) => {
  const q = query(entriesCol(id), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      onNext(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
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
  theme,
  importance,
  question,
  choiceIndex,
}) => {
  const cleanName = cleanText(name)
  const cleanSchoolId = cleanText(schoolId)
  const cleanOccupation = cleanText(occupation)
  const cleanOtherOccupation = cleanText(otherOccupation)

  if (cleanName.length < 2 || cleanName.length > 80) throw new Error('Informe seu nome (de 2 a 80 caracteres).')
  if (!['Estudante', 'Professor da educação básica', 'Professor universitário', 'Gestor', 'Coordenação Pedagógica', 'Outro'].includes(cleanOccupation)) {
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

  if (mode === 'vote') {
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex > 9) {
      throw new Error('Selecione um dos temas antes de enviar seu voto.')
    }
    const voterId = getVoterId(formId)
    await setDoc(doc(entriesCol(formId), voterId), {
      name: cleanName,
      occupation: cleanOccupation,
      otherOccupation: cleanOtherOccupation,
      schoolId: cleanSchoolId,
      choiceIndex,
      createdAt: serverTimestamp(),
    })
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
