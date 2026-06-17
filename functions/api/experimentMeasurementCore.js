const crypto = require('node:crypto')

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

function createHashedExperimentDocumentId(prefix, value) {
  const hash = crypto
    .createHash('sha256')
    .update(value)
    .digest('hex')
    .slice(0, 32)

  return `${prefix}-${hash}`
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

function createExperimentDocumentId(deviceId, measuredAtDate) {
  return createHashedExperimentDocumentId('measurement', `${deviceId}|${measuredAtDate.toISOString()}`)
}

function getMeasurementQuality(valueMv) {
  return Math.abs(valueMv) <= maxNormalExperimentValueMv ? 'normal' : 'outlier'
}

function parseExperimentMeasurementRequest(body = {}) {
  return {
    valueMv: Number(body.valueMv),
    measuredAtInput: body.measuredAt,
    deviceId: String(body.deviceId || 'hauptversuch').trim(),
    requestedMeasurementId: body.measurementId,
  }
}

function validateExperimentMeasurementInput(input) {
  if (
    !Number.isFinite(input.valueMv) ||
    input.valueMv < minExperimentValueMv ||
    input.valueMv > maxExperimentValueMv
  ) {
    return {
      code: 'invalid_value',
      error: `valueMv must be a number between ${minExperimentValueMv} and ${maxExperimentValueMv}.`,
    }
  }

  if (!input.deviceId || input.deviceId.length > 80) {
    return {
      code: 'invalid_device_id',
      error: 'deviceId must be a non-empty string with at most 80 characters.',
    }
  }

  if (!input.measuredAtInput) {
    return {
      code: 'missing_measured_at',
      error: 'measuredAt is required.',
    }
  }

  const measuredAtDate = new Date(input.measuredAtInput)

  if (Number.isNaN(measuredAtDate.getTime())) {
    return {
      code: 'invalid_timestamp',
      error: 'measuredAt must be a valid ISO timestamp.',
    }
  }

  const providedMeasurementId = input.requestedMeasurementId
    ? normalizeExperimentDocumentId(input.requestedMeasurementId)
    : null

  if (input.requestedMeasurementId && !providedMeasurementId) {
    return {
      code: 'invalid_measurement_id',
      error: 'measurementId must not be empty, "." or "..".',
    }
  }

  const measurementId =
    providedMeasurementId ?? createExperimentDocumentId(input.deviceId, measuredAtDate)

  return {
    input: {
      valueMv: input.valueMv,
      measuredAtDate,
      deviceId: input.deviceId,
      measurementId,
      quality: getMeasurementQuality(input.valueMv),
    },
  }
}

function buildExperimentMeasurementData(input, admin) {
  return {
    valueMv: input.valueMv,
    deviceId: input.deviceId,
    source: 'arduino',
    quality: input.quality,
    measuredAt: admin.firestore.Timestamp.fromDate(input.measuredAtDate),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }
}

function buildExperimentMeasurementResponse({ measurementId, data, fallbackMeasuredAtDate, status, timestampToIso }) {
  return {
    id: measurementId,
    valueMv: data.valueMv,
    measuredAt: timestampToIso(data.measuredAt) ?? fallbackMeasuredAtDate.toISOString(),
    deviceId: data.deviceId,
    quality: data.quality ?? getMeasurementQuality(data.valueMv),
    status,
  }
}

module.exports = {
  buildExperimentMeasurementData,
  buildExperimentMeasurementResponse,
  createExperimentDocumentId,
  getExperimentImportToken,
  getMeasurementQuality,
  normalizeExperimentDocumentId,
  parseExperimentMeasurementRequest,
  tokensMatch,
  validateExperimentMeasurementInput,
}
