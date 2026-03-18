import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAUiHBbzkgxL-G2DtEkK9JUGJtZzyMkdlA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'cloudspeak-172f7.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'cloudspeak-172f7',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'cloudspeak-172f7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '941328194884',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:941328194884:web:661c448a79b77cc7cc8b11',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-5K843ZG9FF',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)