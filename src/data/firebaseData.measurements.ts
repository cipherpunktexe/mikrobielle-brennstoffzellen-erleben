import {
  Timestamp,
  addDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { Generator, LeaderboardEntry, Measurement } from './domain'
import { getGeneratorByCode } from './firebaseData.generators'
import type {
  AddMeasurementByCodeInput,
  AdminMeasurementUpdateInput,
  AdminRecentMeasurementItem,
} from './firebaseData.types'
import {
  generatorsCollection,
  isActiveEntity,
  measurementsCollection,
} from './firebaseData.shared'

export function subscribeToMeasurements(
  generatorId: string,
  callback: (measurements: Measurement[]) => void,
) {
  const measurementsQuery = query(measurementsCollection, where('generatorId', '==', generatorId))

  return onSnapshot(measurementsQuery, async (snapshot) => {
    const generatorSnapshot = await getDoc(doc(generatorsCollection, generatorId))

    if (!generatorSnapshot.exists() || !isActiveEntity(generatorSnapshot.data() as Generator)) {
      callback([])
      return
    }

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
      generatorSnapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }) as Generator)
        .filter((generator) => isActiveEntity(generator))
        .map((generator) => [generator.id, generator]),
    )

    const maxByGenerator = new Map<string, Measurement>()

    measurementSnapshot.docs.forEach((item) => {
      const measurement = {
        id: item.id,
        ...item.data(),
      } as Measurement
      const current = maxByGenerator.get(measurement.generatorId)

      if (!current) {
        maxByGenerator.set(measurement.generatorId, measurement)
        return
      }

      const currentMs = current.createdAt?.toMillis() ?? 0
      const nextMs = measurement.createdAt?.toMillis() ?? 0

      if (measurement.value > current.value) {
        maxByGenerator.set(measurement.generatorId, measurement)
        return
      }

      if (measurement.value === current.value && nextMs > currentMs) {
        maxByGenerator.set(measurement.generatorId, measurement)
      }
    })

    const entries = Array.from(maxByGenerator.values())
      .reduce<LeaderboardEntry[]>((items, measurement) => {
        const generator = generatorMap.get(measurement.generatorId)

        if (!generator) {
          return items
        }

        const code = generator.code ?? 'unbekannt'
        items.push({
          generatorId: measurement.generatorId,
          code,
          displayName: generator.ownerName?.trim() || code,
          maxValue: measurement.value,
          maxMeasuredAt: measurement.createdAt ?? null,
        })
        return items
      }, [])
      .sort((left, right) => {
        if (right.maxValue !== left.maxValue) {
          return right.maxValue - left.maxValue
        }

        const rightMs = right.maxMeasuredAt?.toMillis() ?? 0
        const leftMs = left.maxMeasuredAt?.toMillis() ?? 0
        return rightMs - leftMs
      })

    callback(entries)
  })
}

export async function getMeasurementsForAdmin(generatorId: string) {
  const measurementsSnapshot = await getDocs(
    query(measurementsCollection, where('generatorId', '==', generatorId)),
  )

  return measurementsSnapshot.docs
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
}

export async function getRecentMeasurementsEnteredBy(enteredBy: string, limitCount = 8) {
  const trimmedEnteredBy = enteredBy.trim()

  if (!trimmedEnteredBy) {
    return [] as AdminRecentMeasurementItem[]
  }

  const measurementsSnapshot = await getDocs(
    query(measurementsCollection, where('enteredBy', '==', trimmedEnteredBy)),
  )
  const generatorSnapshot = await getDocs(generatorsCollection)
  const generatorMap = new Map(
    generatorSnapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }) as Generator)
      .filter((generator) => isActiveEntity(generator))
      .map((generator) => [generator.id, generator]),
  )

  return measurementsSnapshot.docs
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
    .slice(0, limitCount)
    .map((measurement) => {
      const generator = generatorMap.get(measurement.generatorId)

      if (!generator) {
        return null
      }

      return {
        ...measurement,
        generatorCode: generator.code ?? 'unbekannt',
        ownerName: generator.ownerName?.trim() ?? '',
      } satisfies AdminRecentMeasurementItem
    })
    .filter((item): item is AdminRecentMeasurementItem => Boolean(item))
}

export async function updateMeasurementAsAdmin(
  measurementId: string,
  input: AdminMeasurementUpdateInput,
) {
  const trimmedEnteredBy = input.enteredBy.trim()

  if (Number.isNaN(input.value) || !trimmedEnteredBy) {
    throw new Error('Messwert und Eingetragen-von müssen gültig sein.')
  }

  await updateDoc(doc(measurementsCollection, measurementId), {
    value: input.value,
    enteredBy: trimmedEnteredBy,
  })
}

export async function addMeasurementByCode(input: AddMeasurementByCodeInput) {
  const generator = await getGeneratorByCode(input.code)

  if (!generator) {
    throw new Error('Für diesen QR-Code wurde noch keine Brennstoffzelle angelegt.')
  }

  await addDoc(measurementsCollection, {
    generatorId: generator.id,
    value: input.value,
    enteredBy: input.enteredBy,
    createdAt: input.createdAt ? Timestamp.fromDate(input.createdAt) : serverTimestamp(),
  })

  await updateDoc(doc(generatorsCollection, generator.id), {
    updatedAt: serverTimestamp(),
  })

  return generator
}
