const admin = require('firebase-admin')
const crypto = require('node:crypto')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

admin.initializeApp()

const db = admin.firestore()
const experimentImportToken = defineSecret('EXPERIMENT_IMPORT_TOKEN')
const minExperimentValueMv = -1_000_000
const maxExperimentValueMv = 1_000_000

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
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Experiment-Import-Token')
}

function getExperimentImportToken(req) {
  const authHeader = String(req.get('Authorization') || '')

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  return String(req.get('X-Experiment-Import-Token') || '').trim()
}

function sendApiError(res, status, code, error) {
  res.status(status).json({ code, error })
}

function normalizeExperimentDocumentId(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return null
  }

  if (!/^[a-zA-Z0-9._:-]{1,120}$/.test(normalizedValue)) {
    return null
  }

  return normalizedValue
}

function createExperimentDocumentId(deviceId, measuredAtDate) {
  const hash = crypto
    .createHash('sha256')
    .update(`${deviceId}|${measuredAtDate.toISOString()}`)
    .digest('hex')
    .slice(0, 32)

  return `measurement-${hash}`
}

function timestampToIso(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return null
  }

  return timestamp.toDate().toISOString()
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
    sendApiError(res, 405, 'method_not_allowed', 'Method not allowed. Use POST.')
    return
  }

  const expectedToken = experimentImportToken.value().trim()

  if (!expectedToken || getExperimentImportToken(req) !== expectedToken) {
    sendApiError(res, 401, 'unauthorized', 'Unauthorized.')
    return
  }

  const valueMv = Number(req.body?.valueMv)
  const measuredAtInput = req.body?.measuredAt
  const deviceId = String(req.body?.deviceId || 'hauptversuch').trim()
  const requestedMeasurementId = req.body?.measurementId

  if (!Number.isFinite(valueMv) || valueMv < minExperimentValueMv || valueMv > maxExperimentValueMv) {
    sendApiError(
      res,
      400,
      'invalid_value',
      `valueMv must be a number between ${minExperimentValueMv} and ${maxExperimentValueMv}.`,
    )
    return
  }

  if (!deviceId || deviceId.length > 80) {
    sendApiError(
      res,
      400,
      'invalid_device_id',
      'deviceId must be a non-empty string with at most 80 characters.',
    )
    return
  }

  if (!measuredAtInput && !requestedMeasurementId) {
    sendApiError(
      res,
      400,
      'missing_idempotency_key',
      'measuredAt or measurementId is required for idempotent imports.',
    )
    return
  }

  const measuredAtDate = measuredAtInput ? new Date(measuredAtInput) : new Date()

  if (Number.isNaN(measuredAtDate.getTime())) {
    sendApiError(res, 400, 'invalid_timestamp', 'measuredAt must be a valid ISO timestamp.')
    return
  }

  const providedMeasurementId = requestedMeasurementId
    ? normalizeExperimentDocumentId(requestedMeasurementId)
    : null

  if (requestedMeasurementId && !providedMeasurementId) {
    sendApiError(
      res,
      400,
      'invalid_measurement_id',
      'measurementId must contain only letters, numbers, dots, underscores, colons or hyphens and be at most 120 characters.',
    )
    return
  }

  const measurementId = providedMeasurementId ?? createExperimentDocumentId(deviceId, measuredAtDate)
  const measurementRef = db.collection('experimentMeasurements').doc(measurementId)

  try {
    const result = await db.runTransaction(async (transaction) => {
      const existingMeasurement = await transaction.get(measurementRef)

      if (existingMeasurement.exists) {
        const existingData = existingMeasurement.data() || {}
        const existingMeasuredAt = timestampToIso(existingData.measuredAt)
        const nextMeasuredAt = measuredAtDate.toISOString()

        if (
          existingData.valueMv !== valueMv ||
          existingData.deviceId !== deviceId ||
          (measuredAtInput && existingMeasuredAt !== nextMeasuredAt)
        ) {
          return { status: 'conflict', data: existingData }
        }

        return { status: 'existing', data: existingData }
      }

      const nextData = {
        valueMv,
        deviceId,
        source: 'arduino',
        measuredAt: admin.firestore.Timestamp.fromDate(measuredAtDate),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      transaction.set(measurementRef, nextData)

      return { status: 'created', data: nextData }
    })

    if (result.status === 'conflict') {
      sendApiError(
        res,
        409,
        'measurement_conflict',
        'A measurement with this id already exists with different data.',
      )
      return
    }

    const responseStatus = result.status === 'created' ? 201 : 200

    res.status(responseStatus).json({
      id: measurementId,
      valueMv: result.data.valueMv,
      measuredAt: timestampToIso(result.data.measuredAt) ?? measuredAtDate.toISOString(),
      deviceId: result.data.deviceId,
      status: result.status,
    })
  } catch (error) {
    console.error('Experiment measurement import failed', error)
    sendApiError(res, 500, 'server_error', 'Experiment measurement could not be saved.')
  }
})
