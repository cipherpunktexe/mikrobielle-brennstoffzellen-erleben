const crypto = require('node:crypto')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { admin, db } = require('./firebase')
const { applyCorsHeaders, sendApiError } = require('./http')
const { timestampToIso } = require('./time')

const experimentImportToken = defineSecret('EXPERIMENT_IMPORT_TOKEN')
const minExperimentValueMv = -1_000_000
const maxExperimentValueMv = 1_000_000

function getExperimentImportToken(req) {
  const authHeader = String(req.get('Authorization') || '')

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  return String(req.get('X-Experiment-Import-Token') || '').trim()
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
