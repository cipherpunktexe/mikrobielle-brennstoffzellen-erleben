import { limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { ExperimentMeasurement } from './domain'
import { experimentMeasurementsCollection } from './firebaseData.shared'

const defaultExperimentMeasurementLimit = 500

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
