const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { admin, db } = require('../../shared/firebase')
const { applyCorsHeaders, sendApiError } = require('../../shared/http')
const { timestampToIso } = require('../../shared/time')
const {
  buildExperimentMeasurementData,
  buildExperimentMeasurementResponse,
  getExperimentImportToken,
  parseExperimentMeasurementRequest,
  tokensMatch,
  validateExperimentMeasurementInput,
} = require('./core')

const experimentImportToken = defineSecret('EXPERIMENT_IMPORT_TOKEN')

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
    sendApiError(res, 405, 'method_not_allowed', 'Method not allowed. Use POST.', {
      field: 'method',
      details: {
        allowedMethods: ['POST', 'OPTIONS'],
      },
    })
    return
  }

  const expectedToken = experimentImportToken.value().trim()

  if (!tokensMatch(getExperimentImportToken(req), expectedToken)) {
    sendApiError(res, 401, 'unauthorized', 'Missing or invalid import token.', {
      field: 'Authorization',
      details: {
        acceptedHeaders: ['Authorization', 'X-Experiment-Import-Token'],
      },
    })
    return
  }

  const validationResult = validateExperimentMeasurementInput(
    parseExperimentMeasurementRequest(req.body),
  )

  if (validationResult.code) {
    sendApiError(res, 400, validationResult.code, validationResult.error, {
      field: validationResult.field,
      details: validationResult.details,
    })
    return
  }

  const input = validationResult.input
  const measurementId = input.measurementId

  if (input.dryRun) {
    res.status(200).json(
      buildExperimentMeasurementResponse({
        measurementId,
        data: {
          valueMv: input.valueMv,
          measuredAt: null,
          deviceId: input.deviceId,
        },
        fallbackMeasuredAtDate: input.measuredAtDate,
        status: 'dry_run',
        timestampToIso,
      }),
    )
    return
  }

  const measurementRef = db.collection('experimentMeasurements').doc(measurementId)

  try {
    const result = await db.runTransaction(async (transaction) => {
      const existingMeasurement = await transaction.get(measurementRef)

      if (existingMeasurement.exists) {
        const existingData = existingMeasurement.data() || {}
        const existingMeasuredAt = timestampToIso(existingData.measuredAt)
        const nextMeasuredAt = input.measuredAtDate.toISOString()

        if (
          existingData.valueMv !== input.valueMv ||
          existingData.deviceId !== input.deviceId ||
          existingMeasuredAt !== nextMeasuredAt
        ) {
          return { status: 'conflict', data: existingData }
        }

        return { status: 'existing', data: existingData }
      }

      const nextData = buildExperimentMeasurementData(input, admin)

      transaction.set(measurementRef, nextData)

      return { status: 'created', data: nextData }
    })

    if (result.status === 'conflict') {
      sendApiError(
        res,
        409,
        'measurement_conflict',
        'A measurement for this deviceId and measuredAt already exists with different data.',
        {
          field: 'measuredAt',
          details: {
            idSource: ['deviceId', 'measuredAt'],
            conflictingFields: ['valueMv', 'deviceId', 'measuredAt'],
          },
        },
      )
      return
    }

    const responseStatus = result.status === 'created' ? 201 : 200

    res.status(responseStatus).json(
      buildExperimentMeasurementResponse({
        measurementId,
        data: result.data,
        fallbackMeasuredAtDate: input.measuredAtDate,
        status: result.status,
        timestampToIso,
      }),
    )
  } catch (error) {
    console.error('Experiment measurement import failed', error)
    sendApiError(res, 500, 'server_error', 'Experiment measurement could not be saved.')
  }
})
