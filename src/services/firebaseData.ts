import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, db } from '../firebase'
import { formatCode } from '../lib/format'
import type {
  Generator,
  LeaderboardEntry,
  Measurement,
  UserProfile,
} from '../types/domain'

const usersCollection = collection(db, 'users')
const generatorsCollection = collection(db, 'generators')
const measurementsCollection = collection(db, 'measurements')
const googleProvider = new GoogleAuthProvider()

export interface RegisterUserInput {
  name: string
  email: string
  password: string
  code: string
}

export interface LoginInput {
  email: string
  password: string
}

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

export async function registerUserWithGenerator(input: RegisterUserInput) {
  const code = formatCode(input.code)
  const generatorQuery = query(generatorsCollection, where('code', '==', code))
  const existingGenerator = await getDocs(generatorQuery)

  if (!existingGenerator.empty) {
    throw new Error('Dieser QR-Code ist bereits mit einem Generator verknüpft.')
  }

  const credentials = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password,
  )
  const generatorRef = doc(generatorsCollection)

  await setDoc(generatorRef, {
    ownerUid: credentials.user.uid,
    code,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await setDoc(doc(usersCollection, credentials.user.uid), {
    name: input.name,
    email: input.email,
    role: 'user',
    generatorId: generatorRef.id,
    createdAt: serverTimestamp(),
  })

  return credentials.user
}

export async function linkCurrentUserToGeneratorByCode(code: string) {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('Bitte zuerst anmelden.')
  }

  const normalizedCode = formatCode(code)

  if (!normalizedCode) {
    throw new Error('Der gescannte QR-Code enthaelt keinen gueltigen Generatorcode.')
  }

  const userRef = doc(usersCollection, currentUser.uid)
  const userSnapshot = await getDoc(userRef)

  if (!userSnapshot.exists()) {
    throw new Error('Zum angemeldeten Konto wurde kein Nutzerprofil gefunden.')
  }

  const profile = userSnapshot.data() as UserProfile

  if (profile.generatorId) {
    throw new Error('Dieses Konto ist bereits mit einer Brennstoffzelle verknuepft.')
  }

  const generatorQuery = query(generatorsCollection, where('code', '==', normalizedCode))
  const generatorSnapshot = await getDocs(generatorQuery)
  const existingGenerator = generatorSnapshot.docs[0]

  if (existingGenerator) {
    const existingData = existingGenerator.data() as Generator

    if (existingData.ownerUid && existingData.ownerUid !== currentUser.uid) {
      throw new Error('Dieser QR-Code ist bereits mit einem anderen Konto verknuepft.')
    }

    await updateDoc(doc(generatorsCollection, existingGenerator.id), {
      ownerUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    })
    await updateDoc(userRef, {
      generatorId: existingGenerator.id,
    })

    return {
      ...existingData,
      id: existingGenerator.id,
      ownerUid: currentUser.uid,
    } as Generator
  }

  const generatorRef = doc(generatorsCollection)

  await setDoc(generatorRef, {
    ownerUid: currentUser.uid,
    code: normalizedCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await updateDoc(userRef, {
    generatorId: generatorRef.id,
  })

  return {
    id: generatorRef.id,
    ownerUid: currentUser.uid,
    code: normalizedCode,
  } as Generator
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

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(usersCollection, uid))

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as UserProfile
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
) {
  return onSnapshot(doc(usersCollection, uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    } as UserProfile)
  })
}

export function subscribeToGenerator(
  generatorId: string,
  callback: (generator: Generator | null) => void,
) {
  return onSnapshot(doc(generatorsCollection, generatorId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    } as Generator)
  })
}

export function subscribeToMeasurements(
  generatorId: string,
  callback: (measurements: Measurement[]) => void,
) {
  const measurementsQuery = query(
    measurementsCollection,
    where('generatorId', '==', generatorId),
  )

  return onSnapshot(measurementsQuery, (snapshot) => {
    const measurements = snapshot.docs
      .map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as Measurement,
      )
      .sort((left, right) => {
        const leftMs = left.createdAt?.toMillis() ?? 0
        const rightMs = right.createdAt?.toMillis() ?? 0
        return rightMs - leftMs
      })

    callback(measurements)
  })
}

export function subscribeToLeaderboard(callback: (entries: LeaderboardEntry[]) => void) {
  return onSnapshot(measurementsCollection, async (measurementSnapshot) => {
    const generatorSnapshot = await getDocs(generatorsCollection)
    const generatorMap = new Map(
      generatorSnapshot.docs.map((item) => [
        item.id,
        {
          id: item.id,
          ...item.data(),
        } as Generator,
      ]),
    )

    const latestByGenerator = new Map<string, Measurement>()

    measurementSnapshot.docs.forEach((item) => {
      const measurement = {
        id: item.id,
        ...item.data(),
      } as Measurement
      const current = latestByGenerator.get(measurement.generatorId)

      if (!current) {
        latestByGenerator.set(measurement.generatorId, measurement)
        return
      }

      const currentMs = current.createdAt?.toMillis() ?? 0
      const nextMs = measurement.createdAt?.toMillis() ?? 0

      if (nextMs > currentMs) {
        latestByGenerator.set(measurement.generatorId, measurement)
      }
    })

    const entries = Array.from(latestByGenerator.values())
      .map((measurement) => ({
        generatorId: measurement.generatorId,
        code: generatorMap.get(measurement.generatorId)?.code ?? 'unbekannt',
        latestValue: measurement.value,
        measuredAt: measurement.createdAt ?? null,
      }))
      .sort((left, right) => right.latestValue - left.latestValue)

    callback(entries)
  })
}

export async function getGeneratorByCode(code: string) {
  const normalizedCode = formatCode(code)
  const generatorQuery = query(generatorsCollection, where('code', '==', normalizedCode))
  const snapshot = await getDocs(generatorQuery)
  const match = snapshot.docs[0]

  if (!match) {
    return null
  }

  return {
    id: match.id,
    ...match.data(),
  } as Generator
}

export async function addMeasurementByCode(code: string, value: number, enteredBy: string) {
  const generator = await getGeneratorByCode(code)

  if (!generator) {
    throw new Error('Für diesen QR-Code wurde noch kein Generator angelegt.')
  }

  await addDoc(measurementsCollection, {
    generatorId: generator.id,
    value,
    enteredBy,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(generatorsCollection, generator.id), {
    updatedAt: serverTimestamp(),
  })

  return generator
}
