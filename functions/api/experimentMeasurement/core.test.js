import { describe, expect, test } from 'vitest'
import {
  buildExperimentMeasurementResponse,
  createExperimentDocumentId,
  getExperimentImportToken,
  normalizeExperimentDocumentId,
  parseExperimentMeasurementRequest,
  tokensMatch,
  validateExperimentMeasurementInput,
} from './core.js'

const measuredAt = '2026-06-17T12:30:00.000Z'

function requestWithHeaders(headers) {
  return {
    get: (name) => headers[name] ?? '',
  }
}

describe('experiment measurement import core', () => {
  test('extracts bearer and fallback header tokens', () => {
    expect(
      getExperimentImportToken(requestWithHeaders({ Authorization: 'Bearer import-token' })),
    ).toBe('import-token')
    expect(
      getExperimentImportToken(requestWithHeaders({ 'X-Experiment-Import-Token': 'legacy-token' })),
    ).toBe('legacy-token')
  })

  test('compares tokens without accepting missing or different values', () => {
    expect(tokensMatch('secret-token', 'secret-token')).toBe(true)
    expect(tokensMatch('secret-token', 'other-token')).toBe(false)
    expect(tokensMatch('', 'secret-token')).toBe(false)
    expect(tokensMatch('secret-token', '')).toBe(false)
  })

  test('keeps relaxed firestore-safe measurement ids', () => {
    expect(normalizeExperimentDocumentId('hauptversuch-2026-06-17T12:30:00.000Z')).toBe(
      'hauptversuch-2026-06-17T12:30:00.000Z',
    )
    expect(normalizeExperimentDocumentId('  custom id with spaces  ')).toBe('custom id with spaces')
  })

  test('hashes firestore-incompatible measurement ids deterministically', () => {
    const hashedId = normalizeExperimentDocumentId('hauptversuch/2026-06-17T12:30:00+00:00')

    expect(hashedId).toMatch(/^custom-[a-f0-9]{32}$/)
    expect(hashedId).toBe(normalizeExperimentDocumentId('hauptversuch/2026-06-17T12:30:00+00:00'))
  })

  test('rejects only empty and reserved measurement ids', () => {
    expect(normalizeExperimentDocumentId('')).toBeNull()
    expect(normalizeExperimentDocumentId('.')).toBeNull()
    expect(normalizeExperimentDocumentId('..')).toBeNull()
  })

  test('creates stable ids from device and timestamp', () => {
    const measuredAtDate = new Date(measuredAt)

    expect(createExperimentDocumentId('hauptversuch', measuredAtDate)).toBe(
      createExperimentDocumentId('hauptversuch', measuredAtDate),
    )
    expect(createExperimentDocumentId('hauptversuch', measuredAtDate)).toMatch(/^measurement-[a-f0-9]{32}$/)
  })

  test('parses request bodies with defaults', () => {
    expect(parseExperimentMeasurementRequest({ valueMv: '742', measuredAt })).toEqual({
      valueMv: 742,
      measuredAtInput: measuredAt,
      deviceId: 'hauptversuch',
      requestedMeasurementId: undefined,
      dryRun: false,
    })
  })

  test('requires measuredAt even when measurementId is provided', () => {
    const result = validateExperimentMeasurementInput(
      parseExperimentMeasurementRequest({
        valueMv: 742,
        measurementId: 'custom-measurement',
      }),
    )

    expect(result).toMatchObject({
      code: 'missing_measured_at',
      error: 'measuredAt is required.',
      field: 'measuredAt',
      details: {
        expectedFormat: 'ISO 8601 timestamp',
      },
    })
  })

  test('validates values and device ids', () => {
    expect(
      validateExperimentMeasurementInput(
        parseExperimentMeasurementRequest({
          valueMv: 'kein-wert',
          measuredAt,
        }),
      ),
    ).toMatchObject({
      code: 'invalid_value',
      field: 'valueMv',
      details: {
        unit: 'mV',
        rule: 'finite_number',
      },
    })

    expect(
      validateExperimentMeasurementInput(
        parseExperimentMeasurementRequest({
          valueMv: 742,
          measuredAt,
          deviceId: ' '.repeat(2),
        }),
      ),
    ).toMatchObject({
      code: 'invalid_device_id',
      field: 'deviceId',
      details: {
        maxLength: 80,
      },
    })
  })

  test('returns normalized input for valid requests', () => {
    const result = validateExperimentMeasurementInput(
      parseExperimentMeasurementRequest({
        valueMv: 742,
        measuredAt,
        deviceId: 'hauptversuch',
      }),
    )

    expect(result.code).toBeUndefined()
    expect(result.input).toMatchObject({
      valueMv: 742,
      deviceId: 'hauptversuch',
      dryRun: false,
    })
    expect(result.input?.measuredAtDate.toISOString()).toBe(measuredAt)
    expect(result.input?.measurementId).toMatch(/^measurement-[a-f0-9]{32}$/)
  })

  test('accepts finite values without a configured range', () => {
    expect(
      validateExperimentMeasurementInput(
        parseExperimentMeasurementRequest({
          valueMv: 1_000_001,
          measuredAt,
        }),
      ).input,
    ).toMatchObject({ valueMv: 1_000_001 })
  })

  test('preserves dry run requests in normalized input', () => {
    const result = validateExperimentMeasurementInput(
      parseExperimentMeasurementRequest({
        valueMv: 742,
        measuredAt,
        dryRun: true,
      }),
    )

    expect(result.input).toMatchObject({ dryRun: true })
  })

  test('builds api responses', () => {
    const response = buildExperimentMeasurementResponse({
      measurementId: 'measurement-123',
      data: {
        valueMv: 5_001,
        deviceId: 'hauptversuch',
        measuredAt: null,
      },
      fallbackMeasuredAtDate: new Date(measuredAt),
      status: 'created',
      timestampToIso: () => null,
    })

    expect(response).toEqual({
      id: 'measurement-123',
      valueMv: 5_001,
      measuredAt,
      deviceId: 'hauptversuch',
      status: 'created',
    })
  })
})
