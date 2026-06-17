const crypto = require('node:crypto')

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

function parseExperimentMeasurementRequest(body = {}) {
  return {
    valueMv: Number(body.valueMv),
    measuredAtInput: body.measuredAt,
    deviceId: String(body.deviceId || 'hauptversuch').trim(),
    requestedMeasurementId: body.measurementId,
    dryRun: body.dryRun === true,
  }
}

function validateExperimentMeasurementInput(input) {
  if (!Number.isFinite(input.valueMv)) {
    return {
      code: 'invalid_value',
      error: 'valueMv must be a finite number in millivolts.',
      field: 'valueMv',
      details: {
        unit: 'mV',
        rule: 'finite_number',
      },
    }
  }

  if (!input.deviceId || input.deviceId.length > 80) {
    return {
      code: 'invalid_device_id',
      error: 'deviceId must be a non-empty string with at most 80 characters.',
      field: 'deviceId',
      details: {
        maxLength: 80,
      },
    }
  }

  if (!input.measuredAtInput) {
    return {
      code: 'missing_measured_at',
      error: 'measuredAt is required.',
      field: 'measuredAt',
      details: {
        expectedFormat: 'ISO 8601 timestamp',
      },
    }
  }

  const measuredAtDate = new Date(input.measuredAtInput)

  if (Number.isNaN(measuredAtDate.getTime())) {
    return {
      code: 'invalid_timestamp',
      error: 'measuredAt must be a valid ISO timestamp.',
      field: 'measuredAt',
      details: {
        expectedFormat: 'ISO 8601 timestamp',
        example: '2026-06-17T12:30:00.000Z',
      },
    }
  }

  const providedMeasurementId = input.requestedMeasurementId
    ? normalizeExperimentDocumentId(input.requestedMeasurementId)
    : null

  if (input.requestedMeasurementId && !providedMeasurementId) {
    return {
      code: 'invalid_measurement_id',
      error: 'measurementId must not be empty, "." or "..".',
      field: 'measurementId',
      details: {
        disallowedValues: ['', '.', '..'],
      },
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
      dryRun: input.dryRun,
    },
  }
}

function buildExperimentMeasurementData(input, admin) {
  return {
    valueMv: input.valueMv,
    deviceId: input.deviceId,
    source: 'arduino',
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
    status,
  }
}

module.exports = {
  buildExperimentMeasurementData,
  buildExperimentMeasurementResponse,
  createExperimentDocumentId,
  getExperimentImportToken,
  normalizeExperimentDocumentId,
  parseExperimentMeasurementRequest,
  tokensMatch,
  validateExperimentMeasurementInput,
}
