const crypto = require('node:crypto')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { admin, db } = require('./firebase')
const { applyCorsHeaders, sendApiError } = require('./http')
const { timestampToIso } = require('./time')

const experimentImportToken = defineSecret('EXPERIMENT_IMPORT_TOKEN')
const minExperimentValueMv = -1_000_000
const maxExperimentValueMv = 1_000_000
const maxNormalExperimentValueMv = 5_000

function getExperimentImportToken(req) {
  const authHeader = String(req.get('Authorization') || '')

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  return String(req.get('X-Experiment-Import-Token') || '').trim()
}

function tokensMatch(actualToken, expectedToken) {
  if (!actualToken || !expectedToken) {
    return false
  }

  const actualBuffer = Buffer.from(actualToken)
  const expectedBuffer = Buffer.from(expectedToken)

  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer)
}

function normalizeExperimentDocumentId(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return null
  }

  if (normalizedValue === '.' || normalizedValue === '..') {
    return null
  }

  if (/^[^/]{1,240}$/.test(normalizedValue) && !/^__.*__$/.test(normalizedValue)) {
    return normalizedValue
  }

  return createHashedExperimentDocumentId('custom', normalizedValue)
}

function createHashedExperimentDocumentId(prefix, value) {
  const hash = crypto
    .createHash('sha256')
    .update(value)
    .digest('hex')
    .slice(0, 32)

  return `${prefix}-${hash}`
}

function createExperimentDocumentId(deviceId, measuredAtDate) {
  return createHashedExperimentDocumentId('measurement', `${deviceId}|${measuredAtDate.toISOString()}`)
}

function getMeasurementQuality(valueMv) {
  return Math.abs(valueMv) <= maxNormalExperimentValueMv ? 'normal' : 'outlier'
}

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

  if (!tokensMatch(getExperimentImportToken(req), expectedToken)) {
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

  if (!measuredAtInput) {
    sendApiError(res, 400, 'missing_measured_at', 'measuredAt is required.')
    return
  }

  const measuredAtDate = new Date(measuredAtInput)

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
      'measurementId must not be empty, "." or "..".',
    )
    return
  }

  const measurementId = providedMeasurementId ?? createExperimentDocumentId(deviceId, measuredAtDate)
  const measurementRef = db.collection('experimentMeasurements').doc(measurementId)
  const quality = getMeasurementQuality(valueMv)

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
          existingMeasuredAt !== nextMeasuredAt
        ) {
          return { status: 'conflict', data: existingData }
        }

        return { status: 'existing', data: existingData }
      }

      const nextData = {
        valueMv,
        deviceId,
        source: 'arduino',
        quality,
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
      quality: result.data.quality ?? getMeasurementQuality(result.data.valueMv),
      status: result.status,
    })
  } catch (error) {
    console.error('Experiment measurement import failed', error)
    sendApiError(res, 500, 'server_error', 'Experiment measurement could not be saved.')
  }
})
