import {
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { Generator } from './domain'
import { formatCode } from '../common/format'
import type { AdminGeneratorUpdateInput, ReservedGeneratorCodes } from './firebaseData.types'
import {
  db,
  formatSequentialGeneratorCode,
  generatorsCollection,
  getNextGeneratorSequence,
  isActiveEntity,
  qrExportCounterRef,
} from './firebaseData.shared'

export async function getNextGeneratorCodePreview(digits = 4) {
  const snapshot = await getDoc(qrExportCounterRef)
  const nextSequence = getNextGeneratorSequence(snapshot.data()?.nextSequence)
  return {
    code: formatSequentialGeneratorCode(nextSequence, digits),
    sequence: nextSequence,
  }
}

export async function reserveNextGeneratorCodes(
  count: number,
  digits = 4,
): Promise<ReservedGeneratorCodes> {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('Die Anzahl der QR-Codes muss mindestens 1 sein.')
  }

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(qrExportCounterRef)
    const startSequence = getNextGeneratorSequence(snapshot.data()?.nextSequence)
    const codes = Array.from(
      { length: count },
      (_, index) => formatSequentialGeneratorCode(startSequence + index, digits),
    )
    const nextSequence = startSequence + count
    const nextCode = formatSequentialGeneratorCode(nextSequence, digits)

    transaction.set(
      qrExportCounterRef,
      {
        nextSequence,
        updatedAt: serverTimestamp(),
        ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true },
    )

    return {
      codes,
      startCode: codes[0],
      endCode: codes[codes.length - 1],
      nextCode,
      startSequence,
      endSequence: nextSequence - 1,
      nextSequence,
    }
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

    const generator = {
      id: snapshot.id,
      ...snapshot.data(),
    } as Generator

    callback(isActiveEntity(generator) ? generator : null)
  })
}

export async function getGeneratorByCode(code: string, options?: { includeInactive?: boolean }) {
  const normalizedCode = formatCode(code)
  const generatorQuery = query(generatorsCollection, where('code', '==', normalizedCode))
  const snapshot = await getDocs(generatorQuery)
  const match = snapshot.docs[0]

  if (!match) {
    return null
  }

  const generator = {
    id: match.id,
    ...match.data(),
  } as Generator

  if (!options?.includeInactive && !isActiveEntity(generator)) {
    return null
  }

  return generator
}

export async function findGeneratorForAdmin(identifier: string) {
  const trimmedIdentifier = identifier.trim()

  if (!trimmedIdentifier) {
    return null
  }

  const directSnapshot = await getDoc(doc(generatorsCollection, trimmedIdentifier))

  if (directSnapshot.exists()) {
    return {
      id: directSnapshot.id,
      ...directSnapshot.data(),
    } as Generator
  }

  return getGeneratorByCode(trimmedIdentifier, { includeInactive: true })
}

export async function listGeneratorsForAdmin() {
  const snapshot = await getDocs(generatorsCollection)

  return snapshot.docs
    .map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        }) as Generator,
    )
    .sort((left, right) => {
      const leftLabel = `${left.ownerName ?? ''} ${left.code}`.trim().toLocaleLowerCase('de-DE')
      const rightLabel = `${right.ownerName ?? ''} ${right.code}`.trim().toLocaleLowerCase('de-DE')
      return leftLabel.localeCompare(rightLabel, 'de-DE')
    })
}

export async function updateGeneratorAsAdmin(generatorId: string, input: AdminGeneratorUpdateInput) {
  const normalizedCode = formatCode(input.code)
  const trimmedOwnerUid = input.ownerUid.trim()
  const trimmedOwnerName = input.ownerName.trim()

  if (!normalizedCode || !trimmedOwnerUid) {
    throw new Error('Code und Owner UID müssen ausgefüllt sein.')
  }

  await updateDoc(doc(generatorsCollection, generatorId), {
    code: normalizedCode,
    ownerUid: trimmedOwnerUid,
    ownerName: trimmedOwnerName,
    updatedAt: serverTimestamp(),
  })
}
