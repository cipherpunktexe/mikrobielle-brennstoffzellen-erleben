const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

admin.initializeApp()

const db = admin.firestore()
const experimentImportToken = defineSecret('EXPERIMENT_IMPORT_TOKEN')

function isActiveEntity(status) {
  return status !== 'blocked' && status !== 'deleted'
}

function toMillis(timestamp) {
  if (!timestamp || typeof timestamp.toMillis !== 'function') {
    return 0
  }

  return timestamp.toMillis()
}

function applyCorsHeaders(res, methods = 'GET, OPTIONS') {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', methods)
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Experiment-Import-Token')
}

function getExperimentImportToken(req) {
  const authHeader = String(req.get('Authorization') || '')

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  return String(req.get('X-Experiment-Import-Token') || req.body?.apiKey || '').trim()
}

exports.leaderboard = onRequest({ region: 'europe-west1', invoker: 'public' }, async (req, res) => {
  applyCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' })
    return
  }

  const parsedLimit = Number.parseInt(String(req.query.limit ?? ''), 10)
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(parsedLimit, 500))
    : 100

  try {
    const [generatorsSnapshot, measurementsSnapshot] = await Promise.all([
      db.collection('generators').get(),
      db.collection('measurements').get(),
    ])

    const activeGenerators = new Map()

    generatorsSnapshot.docs.forEach((doc) => {
      const generator = doc.data() || {}

      if (!isActiveEntity(generator.status)) {
        return
      }

      activeGenerators.set(doc.id, {
        id: doc.id,
        code: generator.code || 'unbekannt',
        ownerName: (generator.ownerName || '').trim(),
      })
    })

    const maxByGenerator = new Map()

    measurementsSnapshot.docs.forEach((doc) => {
      const measurement = doc.data() || {}
      const generatorId = measurement.generatorId
      const generator = activeGenerators.get(generatorId)

      if (!generator) {
        return
      }

      const value = Number(measurement.value)

      if (!Number.isFinite(value)) {
        return
      }

      const createdAt = measurement.createdAt || null
      const current = maxByGenerator.get(generatorId)

      if (!current) {
        maxByGenerator.set(generatorId, {
          generatorId,
          code: generator.code,
          displayName: generator.ownerName || generator.code,
          maxValue: value,
          maxMeasuredAt: createdAt,
        })
        return
      }

      const currentMs = toMillis(current.maxMeasuredAt)
      const nextMs = toMillis(createdAt)

      if (value > current.maxValue || (value === current.maxValue && nextMs > currentMs)) {
        maxByGenerator.set(generatorId, {
          ...current,
          maxValue: value,
          maxMeasuredAt: createdAt,
        })
      }
    })

    const entries = Array.from(maxByGenerator.values())
      .sort((left, right) => {
        if (right.maxValue !== left.maxValue) {
          return right.maxValue - left.maxValue
        }

        return toMillis(right.maxMeasuredAt) - toMillis(left.maxMeasuredAt)
      })
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        generatorId: entry.generatorId,
        code: entry.code,
        displayName: entry.displayName,
        maxValue: entry.maxValue,
        maxMeasuredAt: entry.maxMeasuredAt ? entry.maxMeasuredAt.toDate().toISOString() : null,
      }))

    res.set('Cache-Control', 'public, max-age=60')
    res.status(200).json({
      generatedAt: new Date().toISOString(),
      count: entries.length,
      entries,
    })
  } catch (error) {
    console.error('Leaderboard API failed', error)
    res.status(500).json({ error: 'Leaderboard could not be loaded.' })
  }
})

exports.experimentMeasurement = onRequest({
  region: 'europe-west1',
  invoker: 'public',
  secrets: [experimentImportToken],
}, async (req, res) => {
  applyCorsHeaders(res, 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' })
    return
  }

  const expectedToken = experimentImportToken.value().trim()

  if (!expectedToken || getExperimentImportToken(req) !== expectedToken) {
    res.status(401).json({ error: 'Unauthorized.' })
    return
  }

  const valueMv = Number(req.body?.valueMv)
  const measuredAtInput = req.body?.measuredAt
  const deviceId = String(req.body?.deviceId || 'hauptversuch').trim()

  if (!Number.isFinite(valueMv) || valueMv < -1000 || valueMv > 5000) {
    res.status(400).json({ error: 'valueMv must be a number between -1000 and 5000.' })
    return
  }

  if (!deviceId || deviceId.length > 80) {
    res.status(400).json({ error: 'deviceId must be a non-empty string with at most 80 characters.' })
    return
  }

  const measuredAtDate = measuredAtInput ? new Date(measuredAtInput) : new Date()

  if (Number.isNaN(measuredAtDate.getTime())) {
    res.status(400).json({ error: 'measuredAt must be a valid ISO timestamp.' })
    return
  }

  try {
    const measurementRef = await db.collection('experimentMeasurements').add({
      valueMv,
      deviceId,
      source: 'arduino',
      measuredAt: admin.firestore.Timestamp.fromDate(measuredAtDate),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    res.status(201).json({
      id: measurementRef.id,
      valueMv,
      measuredAt: measuredAtDate.toISOString(),
      deviceId,
    })
  } catch (error) {
    console.error('Experiment measurement import failed', error)
    res.status(500).json({ error: 'Experiment measurement could not be saved.' })
  }
})
