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

function createExperimentDocumentId(measuredAtDate) {
  return createHashedExperimentDocumentId('measurement', measuredAtDate.toISOString())
}

function parseExperimentMeasurementRequest(body = {}) {
  return {
    valueMv: Number(body.valueMv),
    measuredAtInput: body.measuredAt,
    hasDeviceId: Object.prototype.hasOwnProperty.call(body, 'deviceId'),
    hasMeasurementId: Object.prototype.hasOwnProperty.call(body, 'measurementId'),
    dryRun: body.dryRun === true,
  }
}

function validateExperimentMeasurementInput(input) {
  if (input.hasDeviceId) {
    return {
      code: 'unsupported_field',
      error: 'deviceId is not accepted. The import API is configured for one fixed experiment device.',
      field: 'deviceId',
    }
  }

  if (input.hasMeasurementId) {
    return {
      code: 'unsupported_field',
      error: 'measurementId is not accepted. The API creates stable ids from measuredAt.',
      field: 'measurementId',
      details: {
        idSource: ['measuredAt'],
      },
    }
  }

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

  const measurementId = createExperimentDocumentId(measuredAtDate)

  return {
    input: {
      valueMv: input.valueMv,
      measuredAtDate,
      measurementId,
      dryRun: input.dryRun,
    },
  }
}

function buildExperimentMeasurementData(input, admin) {
  return {
    valueMv: input.valueMv,
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
    status,
  }
}

module.exports = {
  buildExperimentMeasurementData,
  buildExperimentMeasurementResponse,
  createExperimentDocumentId,
  getExperimentImportToken,
  parseExperimentMeasurementRequest,
  tokensMatch,
  validateExperimentMeasurementInput,
}
