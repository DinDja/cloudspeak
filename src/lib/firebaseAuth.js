import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  reload,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '../../firebase'
import { isSecEmail, describeAuthError } from './validators'
import { AUTH_DOMAIN_LABEL } from './constants'

const AUTH_ERROR_NOT_SEC = 'auth/not-sec-domain'
const AUTH_ERROR_NOT_VERIFIED = 'auth/email-not-verified'

export const AuthErrorCode = {
  NOT_SEC: AUTH_ERROR_NOT_SEC,
  NOT_VERIFIED: AUTH_ERROR_NOT_VERIFIED,
}

export const isAuthedSecUser = (user) =>
  Boolean(user) && isSecEmail(user.email) && user.emailVerified

export const signIn = async (email, password) => {
  const trimmedEmail = (email ?? '').trim().toLowerCase()
  if (!isSecEmail(trimmedEmail)) {
    const error = new Error(`Use um e-mail de um destes domínios: ${AUTH_DOMAIN_LABEL}.`)
    error.code = AUTH_ERROR_NOT_SEC
    throw error
  }
  try {
    const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password)
    return credential.user
  } catch (error) {
    error.message = describeAuthError(error.code)
    throw error
  }
}

export const signUp = async (email, password, displayName) => {
  const trimmedEmail = (email ?? '').trim().toLowerCase()
  if (!isSecEmail(trimmedEmail)) {
    const error = new Error(`Cadastre-se com um e-mail de um destes domínios: ${AUTH_DOMAIN_LABEL}.`)
    error.code = AUTH_ERROR_NOT_SEC
    throw error
  }
  if (!password || password.length < 6) {
    const error = new Error('A senha precisa ter ao menos 6 caracteres.')
    error.code = 'auth/weak-password'
    throw error
  }
  try {
    const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
    const cleanName = (displayName ?? '').trim().slice(0, 60)
    if (cleanName) {
      await updateProfile(credential.user, { displayName: cleanName })
    }
    await sendEmailVerification(credential.user)
    return credential.user
  } catch (error) {
    error.message = describeAuthError(error.code)
    throw error
  }
}

export const signOutUser = () => signOut(auth)

export const resendVerification = (user) => sendEmailVerification(user)

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  try {
    const credential = await signInWithPopup(auth, provider)
    const user = credential.user
    if (!isSecEmail(user.email)) {
      await signOut(auth)
      const error = new Error(`Use um e-mail de um destes domínios: ${AUTH_DOMAIN_LABEL}.`)
      error.code = AUTH_ERROR_NOT_SEC
      throw error
    }
    if (!user.emailVerified) {
      await signOut(auth)
      const error = new Error('Confirme seu e-mail antes de continuar.')
      error.code = AUTH_ERROR_NOT_VERIFIED
      throw error
    }
    return user
  } catch (error) {
    if (error.code !== AUTH_ERROR_NOT_SEC && error.code !== AUTH_ERROR_NOT_VERIFIED) {
      error.message = describeAuthError(error.code)
    }
    throw error
  }
}

export const reloadUser = async (user) => {
  await reload(user)
  return auth.currentUser
}
