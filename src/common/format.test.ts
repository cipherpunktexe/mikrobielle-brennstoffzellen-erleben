import { describe, expect, test } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import {
  createContextMeasurementFormatter,
  formatCode,
  formatMeasurement,
  formatTimestamp,
} from './format'

describe('format utils', () => {
  test('formats empty timestamp and measurement placeholders', () => {
    expect(formatTimestamp()).toBe('Noch kein Zeitstempel')
    expect(formatMeasurement()).toBe('Noch kein Messwert')
  })

  test('formats measurement with 2 decimals', () => {
    expect(formatMeasurement(1.234)).toBe('1.23 V')
    expect(formatMeasurement(1)).toBe('1.00 V')
  })

  test('formats very small measurements in scientific notation', () => {
    expect(formatMeasurement(0.0000123)).toBe('1.230e-5 V')
    expect(formatMeasurement(-0.0000123)).toBe('-1.230e-5 V')
  })

  test('uses context-aware precision for close values', () => {
    const formatInContext = createContextMeasurementFormatter([1.2341, 1.2342, 1.2343])

    expect(formatInContext(1.2341)).toBe('1.2341 V')
    expect(formatInContext(1.2342)).toBe('1.2342 V')
  })

  test('keeps scientific notation for very small context values', () => {
    const formatInContext = createContextMeasurementFormatter([0.00001231, 0.00001239])

    expect(formatInContext(0.00001231)).toBe('1.231e-5 V')
  })

  test('normalizes generator codes', () => {
    expect(formatCode('  A1B2  ')).toBe('a1b2')
  })

  test('formats timestamp via german locale formatter', () => {
    const fakeTimestamp = {
      toDate: () => new Date('2024-01-01T12:00:00.000Z'),
    } as Timestamp

    const formatted = formatTimestamp(fakeTimestamp)

    expect(formatted).not.toBe('Noch kein Zeitstempel')
    expect(formatted).toContain('2024')
  })
})
