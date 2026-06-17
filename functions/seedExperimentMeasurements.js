const { applicationDefault, initializeApp } = require('firebase-admin/app')
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore')

const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  'mikrobielle-brennstoffzellen'

const appOptions = process.env.FIRESTORE_EMULATOR_HOST
  ? { projectId }
  : { credential: applicationDefault(), projectId }

initializeApp(appOptions)

const db = getFirestore()
const deviceId = process.env.EXPERIMENT_SEED_DEVICE_ID || 'seed-hauptversuch'
const pointCount = Number.parseInt(process.env.EXPERIMENT_SEED_POINTS || '48', 10)
const intervalMinutes = Number.parseInt(process.env.EXPERIMENT_SEED_INTERVAL_MINUTES || '10', 10)

function getSeedValue(index) {
  const trend = index * 4.4
  const wave = Math.sin(index / 4.2) * 46
  const smallerWave = Math.cos(index / 2.7) * 18

  return Math.round(420 + trend + wave + smallerWave)
}

async function seedExperimentMeasurements() {
  const now = new Date()
  const batch = db.batch()
  const collection = db.collection('experimentMeasurements')

  for (let index = 0; index < pointCount; index += 1) {
    const minutesAgo = (pointCount - index - 1) * intervalMinutes
    const measuredAt = new Date(now.getTime() - minutesAgo * 60_000)
    const documentId = `${deviceId}-${String(index).padStart(3, '0')}`

    batch.set(collection.doc(documentId), {
      valueMv: getSeedValue(index),
      deviceId,
      source: 'arduino',
      quality: 'normal',
      seed: true,
      measuredAt: Timestamp.fromDate(measuredAt),
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()

  console.log(
    `Seeded ${pointCount} experiment measurements for ${deviceId} in project ${projectId}.`,
  )
}

seedExperimentMeasurements().catch((error) => {
  if (!process.env.FIRESTORE_EMULATOR_HOST && /default credentials/i.test(String(error.message))) {
    console.error(
      'Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service account JSON file or run against the Firestore emulator.',
    )
  }

  console.error('Could not seed experiment measurements.', error)
  process.exitCode = 1
})
