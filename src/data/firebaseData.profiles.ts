import { createUserWithEmailAndPassword } from 'firebase/auth'
import {
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { EntityLifecycleStatus, Generator, UserProfile } from './domain'
import { formatCode } from '../common/format'
import type {
  AdminUserProfileUpdateInput,
  RegisterUserInput,
} from './firebaseData.types'
import {
  auth,
  generatorsCollection,
  isActiveEntity,
  usersCollection,
} from './firebaseData.shared'

export async function registerUserWithGenerator(input: RegisterUserInput) {
  const code = formatCode(input.code)
  const generatorQuery = query(generatorsCollection, where('code', '==', code))
  const existingGenerator = await getDocs(generatorQuery)

  if (!existingGenerator.empty) {
    throw new Error('Dieser QR-Code ist bereits mit einer Brennstoffzelle verknüpft.')
  }

  const credentials = await createUserWithEmailAndPassword(auth, input.email, input.password)
  const generatorRef = doc(generatorsCollection)

  await setDoc(generatorRef, {
    ownerUid: credentials.user.uid,
    code,
    ownerName: input.name,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await setDoc(doc(usersCollection, credentials.user.uid), {
    name: input.name,
    email: input.email,
    role: 'user',
    status: 'active',
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
    throw new Error('Der gescannte QR-Code enthält keinen gültigen Brennstoffzellen-Code.')
  }

  const userRef = doc(usersCollection, currentUser.uid)
  const userSnapshot = await getDoc(userRef)

  if (!userSnapshot.exists()) {
    throw new Error('Zum angemeldeten Konto wurde kein Nutzerprofil gefunden.')
  }

  const profile = userSnapshot.data() as UserProfile

  if (!isActiveEntity(profile)) {
    throw new Error('Dieses Konto ist nicht mehr aktiv.')
  }

  const ownerName =
    profile.name?.trim() ||
    currentUser.displayName?.trim() ||
    currentUser.email?.split('@')[0] ||
    normalizedCode

  if (profile.generatorId) {
    throw new Error('Dieses Konto ist bereits mit einer Brennstoffzelle verknüpft.')
  }

  const generatorQuery = query(generatorsCollection, where('code', '==', normalizedCode))
  const generatorSnapshot = await getDocs(generatorQuery)
  const existingGenerator = generatorSnapshot.docs[0]

  if (existingGenerator) {
    const existingData = existingGenerator.data() as Generator

    if (!isActiveEntity(existingData)) {
      throw new Error('Dieser QR-Code ist nicht mehr aktiv.')
    }

    if (existingData.ownerUid && existingData.ownerUid !== currentUser.uid) {
      throw new Error('Dieser QR-Code ist bereits mit einem anderen Konto verknüpft.')
    }

    await updateDoc(doc(generatorsCollection, existingGenerator.id), {
      ownerUid: currentUser.uid,
      ownerName,
      updatedAt: serverTimestamp(),
    })
    await updateDoc(userRef, {
      generatorId: existingGenerator.id,
    })

    return {
      ...existingData,
      id: existingGenerator.id,
      ownerUid: currentUser.uid,
      ownerName,
    } as Generator
  }

  const generatorRef = doc(generatorsCollection)

  await setDoc(generatorRef, {
    ownerUid: currentUser.uid,
    code: normalizedCode,
    ownerName,
    status: 'active',
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
    ownerName,
  } as Generator
}

export async function updateCurrentUserDisplayName(name: string) {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('Bitte zuerst anmelden.')
  }

  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error('Bitte einen Anzeigenamen eingeben.')
  }

  const userRef = doc(usersCollection, currentUser.uid)
  const userSnapshot = await getDoc(userRef)

  if (!userSnapshot.exists()) {
    throw new Error('Zum angemeldeten Konto wurde kein Nutzerprofil gefunden.')
  }

  const profile = {
    id: userSnapshot.id,
    ...userSnapshot.data(),
  } as UserProfile

  if (!isActiveEntity(profile)) {
    throw new Error('Dieses Konto ist nicht mehr aktiv.')
  }

  await updateDoc(userRef, {
    name: trimmedName,
  })

  if (profile.generatorId) {
    await updateDoc(doc(generatorsCollection, profile.generatorId), {
      ownerName: trimmedName,
      updatedAt: serverTimestamp(),
    })
  }
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

export async function findUserProfileForAdmin(identifier: string) {
  const trimmedIdentifier = identifier.trim()

  if (!trimmedIdentifier) {
    return null
  }

  const directSnapshot = await getDoc(doc(usersCollection, trimmedIdentifier))

  if (directSnapshot.exists()) {
    return {
      id: directSnapshot.id,
      ...directSnapshot.data(),
    } as UserProfile
  }

  const emailSnapshot = await getDocs(
    query(usersCollection, where('email', '==', trimmedIdentifier.toLowerCase()), limit(1)),
  )
  const match = emailSnapshot.docs[0]

  if (!match) {
    return null
  }

  return {
    id: match.id,
    ...match.data(),
  } as UserProfile
}

export async function findUserProfileByEmailForAdmin(email: string) {
  const trimmedEmail = email.trim().toLowerCase()

  if (!trimmedEmail) {
    return null
  }

  const emailSnapshot = await getDocs(
    query(usersCollection, where('email', '==', trimmedEmail), limit(1)),
  )
  const match = emailSnapshot.docs[0]

  if (!match) {
    return null
  }

  return {
    id: match.id,
    ...match.data(),
  } as UserProfile
}

export async function listUserProfilesForAdmin() {
  const snapshot = await getDocs(usersCollection)

  return snapshot.docs
    .map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        }) as UserProfile,
    )
    .sort((left, right) => {
      const leftLabel = `${left.name} ${left.email}`.trim().toLocaleLowerCase('de-DE')
      const rightLabel = `${right.name} ${right.email}`.trim().toLocaleLowerCase('de-DE')
      return leftLabel.localeCompare(rightLabel, 'de-DE')
    })
}

async function findLinkedGeneratorForUser(user: UserProfile) {
  if (user.generatorId) {
    const directSnapshot = await getDoc(doc(generatorsCollection, user.generatorId))

    if (directSnapshot.exists()) {
      return {
        id: directSnapshot.id,
        ...directSnapshot.data(),
      } as Generator
    }
  }

  const ownerSnapshot = await getDocs(
    query(generatorsCollection, where('ownerUid', '==', user.id), limit(1)),
  )
  const match = ownerSnapshot.docs[0]

  if (!match) {
    return null
  }

  return {
    id: match.id,
    ...match.data(),
  } as Generator
}

export async function getAdminProfiles() {
  const snapshot = await getDocs(query(usersCollection, where('role', '==', 'admin')))

  return snapshot.docs
    .map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        }) as UserProfile,
    )
    .sort((left, right) => {
      const leftLabel = `${left.name} ${left.email}`.trim().toLocaleLowerCase('de-DE')
      const rightLabel = `${right.name} ${right.email}`.trim().toLocaleLowerCase('de-DE')
      return leftLabel.localeCompare(rightLabel, 'de-DE')
    })
}

export async function updateUserProfileAsAdmin(userId: string, input: AdminUserProfileUpdateInput) {
  const trimmedName = input.name.trim()
  const trimmedEmail = input.email.trim().toLowerCase()

  if (!trimmedName || !trimmedEmail) {
    throw new Error('Name und E-Mail müssen ausgefüllt sein.')
  }

  await updateDoc(doc(usersCollection, userId), {
    name: trimmedName,
    email: trimmedEmail,
    role: input.role,
  })
}

export async function setUserLifecycleStatusAsAdmin(
  user: UserProfile,
  status: EntityLifecycleStatus,
) {
  const archivedBy = status === 'active' ? null : auth.currentUser?.uid ?? null
  const archivedAt = status === 'active' ? null : serverTimestamp()
  const linkedGenerator = await findLinkedGeneratorForUser(user)

  await updateDoc(doc(usersCollection, user.id), {
    status,
    archivedAt,
    archivedBy,
  })

  if (linkedGenerator) {
    await updateDoc(doc(generatorsCollection, linkedGenerator.id), {
      status,
      archivedAt,
      archivedBy,
      updatedAt: serverTimestamp(),
    })
  }
}

export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
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
