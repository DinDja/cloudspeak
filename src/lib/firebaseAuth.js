import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  reload,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../../firebase'
import { isSectiEmail, describeAuthError } from './validators'

const AUTH_ERROR_NOT_SECTI = 'auth/not-secti-domain'
const AUTH_ERROR_NOT_VERIFIED = 'auth/email-not-verified'

export const AuthErrorCode = {
  NOT_SECTI: AUTH_ERROR_NOT_SECTI,
  NOT_VERIFIED: AUTH_ERROR_NOT_VERIFIED,
}

export const isAuthedSectiUser = (user) =>
  Boolean(user) && isSectiEmail(user.email) && user.emailVerified

export const signIn = async (email, password) => {
  const trimmedEmail = (email ?? '').trim().toLowerCase()
  if (!isSectiEmail(trimmedEmail)) {
    const error = new Error('Use um e-mail @secti.ba.gov.br.')
    error.code = AUTH_ERROR_NOT_SECTI
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
  if (!isSectiEmail(trimmedEmail)) {
    const error = new Error('Cadastre-se apenas com e-mail @secti.ba.gov.br.')
    error.code = AUTH_ERROR_NOT_SECTI
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

export const reloadUser = async (user) => {
  await reload(user)
  return auth.currentUser
}
