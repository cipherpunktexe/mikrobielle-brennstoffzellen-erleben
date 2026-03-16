import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { LoginInput } from './firebaseData.types'
import { auth, googleProvider, usersCollection } from './firebaseData.shared'

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

async function ensureUserProfileDocument(user: User) {
  const userRef = doc(usersCollection, user.uid)
  const userSnapshot = await getDoc(userRef)

  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      name: user.displayName ?? user.email?.split('@')[0] ?? 'Google-Nutzer',
      email: user.email ?? '',
      role: 'user',
      status: 'active',
      createdAt: serverTimestamp(),
    })
    return
  }

  await setDoc(
    userRef,
    {
      name: user.displayName ?? userSnapshot.data().name ?? 'Google-Nutzer',
      email: user.email ?? userSnapshot.data().email ?? '',
    },
    { merge: true },
  )
}

export async function login(input: LoginInput) {
  const credentials = await signInWithEmailAndPassword(auth, input.email, input.password)
  return credentials.user
}

export async function signInWithGoogle() {
  const credentials = await signInWithPopup(auth, googleProvider)
  await ensureUserProfileDocument(credentials.user)
  return credentials.user
}

export async function logout() {
  await signOut(auth)
}
