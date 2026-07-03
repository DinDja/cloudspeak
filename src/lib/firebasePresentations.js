import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { MAX_SLIDES } from './constants'
import { sanitizeSlides, sanitizeTitle } from './validators'

const presentationsCol = () => collection(db, 'presentations')
const presentationRef = (id) => doc(db, 'presentations', id)

export const createPresentation = async ({ ownerUid, ownerEmail, title, slides }) => {
  const titleResult = sanitizeTitle(title)
  if (titleResult.error) throw new Error(titleResult.error)

  const slidesResult = sanitizeSlides(slides)
  if (slidesResult.error) throw new Error(slidesResult.error)

  const payload = {
    title: titleResult.title,
    slides: slidesResult.slides,
    ownerUid,
    ownerEmail,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(presentationsCol(), payload)
  return { id: ref.id, ...payload }
}

export const updatePresentation = async ({ id, ownerUid, ownerEmail, title, slides }) => {
  const titleResult = sanitizeTitle(title)
  if (titleResult.error) throw new Error(titleResult.error)

  const slidesResult = sanitizeSlides(slides)
  if (slidesResult.error) throw new Error(slidesResult.error)

  await updateDoc(presentationRef(id), {
    title: titleResult.title,
    slides: slidesResult.slides,
    ownerUid,
    ownerEmail,
    updatedAt: serverTimestamp(),
  })
}

export const duplicatePresentation = async ({ presentation, ownerUid, ownerEmail }) => {
  return createPresentation({
    ownerUid,
    ownerEmail,
    title: `${presentation.title} (cópia)`.slice(0, 120),
    slides: presentation.slides ?? [],
  })
}

export const deletePresentation = async (id) => {
  await deleteDoc(presentationRef(id))
}

export const getPresentation = async (id) => {
  const snapshot = await getDoc(presentationRef(id))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const subscribeUserPresentations = (ownerUid, onNext, onError) => {
  const q = query(presentationsCol(), where('ownerUid', '==', ownerUid), orderBy('updatedAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      onNext(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        })),
      )
    },
    onError,
  )
}

export const buildEditableDraft = (presentation) => {
  const slides = (presentation?.slides ?? []).slice(0, MAX_SLIDES).map((slide) => ({
    ...slide,
    id: slide.id || crypto.randomUUID(),
    options: Array.isArray(slide.options) ? [...slide.options] : [],
    teams: Array.isArray(slide.teams) ? slide.teams.map((t) => ({ ...t })) : [],
  }))
  return {
    id: presentation?.id ?? null,
    title: presentation?.title ?? '',
    slides: slides.length > 0 ? slides : [],
  }
}
