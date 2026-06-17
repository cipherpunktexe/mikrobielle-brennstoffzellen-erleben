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

export type ExperimentMeasurementDeleteRange = '1h' | '6h' | '24h' | '7d' | 'all'

function getExperimentMeasurementRangeStart(range: ExperimentMeasurementDeleteRange, now = new Date()) {
  switch (range) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000)
    case '6h':
      return new Date(now.getTime() - 6 * 60 * 60 * 1000)
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'all':
      return null
  }
}

function buildExperimentMeasurementRangeQuery(range: ExperimentMeasurementDeleteRange) {
  const rangeStart = getExperimentMeasurementRangeStart(range)

  if (!rangeStart) {
    return experimentMeasurementsCollection
  }

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
