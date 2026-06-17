import {
  Timestamp,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import type { ExperimentMeasurement } from './domain'
import { db, experimentMeasurementsCollection } from './firebaseData.shared'

const defaultExperimentMeasurementLimit = 500
const firestoreBatchLimit = 500

export type ExperimentMeasurementDeleteRange = '5m' | '15m' | '30m' | '1h' | '3h' | '6h' | '12h' | '24h'

function getExperimentMeasurementRangeStart(range: ExperimentMeasurementDeleteRange, now = new Date()) {
  switch (range) {
    case '5m':
      return new Date(now.getTime() - 5 * 60 * 1000)
    case '15m':
      return new Date(now.getTime() - 15 * 60 * 1000)
    case '30m':
      return new Date(now.getTime() - 30 * 60 * 1000)
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000)
    case '3h':
      return new Date(now.getTime() - 3 * 60 * 60 * 1000)
    case '6h':
      return new Date(now.getTime() - 6 * 60 * 60 * 1000)
    case '12h':
      return new Date(now.getTime() - 12 * 60 * 60 * 1000)
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }
}

function buildExperimentMeasurementRangeQuery(range: ExperimentMeasurementDeleteRange) {
  const rangeStart = getExperimentMeasurementRangeStart(range)

  return query(
    experimentMeasurementsCollection,
    where('measuredAt', '>=', Timestamp.fromDate(rangeStart)),
    orderBy('measuredAt', 'asc'),
  )
}

export function subscribeToExperimentMeasurements(
  callback: (measurements: ExperimentMeasurement[]) => void,
  limitCount = defaultExperimentMeasurementLimit,
) {
  const measurementsQuery = query(
    experimentMeasurementsCollection,
    orderBy('measuredAt', 'desc'),
    limit(limitCount),
  )

  return onSnapshot(measurementsQuery, (snapshot) => {
    const measurements = snapshot.docs
      .map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as ExperimentMeasurement,
      )
      .sort((left, right) => {
        const leftMs = left.measuredAt?.toMillis() ?? 0
        const rightMs = right.measuredAt?.toMillis() ?? 0
        return leftMs - rightMs
      })

    callback(measurements)
  })
}

export async function countExperimentMeasurementsForAdmin(range: ExperimentMeasurementDeleteRange) {
  const snapshot = await getDocs(buildExperimentMeasurementRangeQuery(range))

  return snapshot.size
}

export async function deleteExperimentMeasurementsForAdmin(range: ExperimentMeasurementDeleteRange) {
  const snapshot = await getDocs(buildExperimentMeasurementRangeQuery(range))
  let deletedCount = 0
  let batch = writeBatch(db)
  let batchSize = 0

  for (const documentSnapshot of snapshot.docs) {
    batch.delete(documentSnapshot.ref)
    batchSize += 1
    deletedCount += 1

    if (batchSize === firestoreBatchLimit) {
      await batch.commit()
      batch = writeBatch(db)
      batchSize = 0
    }
  }

  if (batchSize > 0) {
    await batch.commit()
  }

  return deletedCount
}
