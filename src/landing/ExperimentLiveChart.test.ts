import { describe, expect, test } from 'vitest'
import {
  createExperimentVoltageFormatter,
  filterExperimentMeasurementsByTimeRange,
} from './ExperimentLiveChart'

describe('experiment live chart voltage formatter', () => {
  test('keeps millivolts for regular experiment values', () => {
    const formatVoltage = createExperimentVoltageFormatter([742, 815.5])

    expect(formatVoltage(742)).toBe('742 mV')
    expect(formatVoltage(815.5)).toBe('815,5 mV')
  })

  test('uses volts when the context reaches at least one volt', () => {
    const formatVoltage = createExperimentVoltageFormatter([742, 1240])

    expect(formatVoltage(742)).toBe('0,742 V')
    expect(formatVoltage(1240)).toBe('1,24 V')
  })

  test('uses microvolts for sub-millivolt values', () => {
    const formatVoltage = createExperimentVoltageFormatter([0.42, 0.8])

    expect(formatVoltage(0.42)).toBe('420 µV')
    expect(formatVoltage(0.8)).toBe('800 µV')
  })

  test('formats missing values with a readable placeholder', () => {
    const formatVoltage = createExperimentVoltageFormatter([])

    expect(formatVoltage()).toBe('Noch kein Messwert')
  })
})

describe('experiment live chart time range filter', () => {
  function measurement(id: string, measuredAtMs: number) {
    return {
      id,
      measuredAt: {
        toMillis: () => measuredAtMs,
      },
    }
  }

  test('filters measurements by short minute windows', () => {
    const nowMs = Date.parse('2026-06-17T12:00:00.000Z')
    const measurements = [
      measurement('old', nowMs - 8 * 60 * 1000),
      measurement('recent', nowMs - 3 * 60 * 1000),
    ]

    expect(filterExperimentMeasurementsByTimeRange(measurements, '5m', nowMs).map(({ id }) => id)).toEqual([
      'recent',
    ])
    expect(filterExperimentMeasurementsByTimeRange(measurements, '15m', nowMs).map(({ id }) => id)).toEqual([
      'old',
      'recent',
    ])
  })

  test('keeps every measurement for the all range', () => {
    const nowMs = Date.parse('2026-06-17T12:00:00.000Z')
    const measurements = [
      measurement('old', nowMs - 48 * 60 * 60 * 1000),
      measurement('recent', nowMs - 3 * 60 * 1000),
    ]

    expect(filterExperimentMeasurementsByTimeRange(measurements, 'all', nowMs)).toEqual(measurements)
  })

  test('filters measurements by hour windows up to 24 hours', () => {
    const nowMs = Date.parse('2026-06-17T12:00:00.000Z')
    const measurements = [
      measurement('outside', nowMs - 25 * 60 * 60 * 1000),
      measurement('old', nowMs - 2 * 60 * 60 * 1000),
      measurement('recent', nowMs - 20 * 60 * 1000),
    ]

    expect(filterExperimentMeasurementsByTimeRange(measurements, '1h', nowMs).map(({ id }) => id)).toEqual([
      'recent',
    ])
    expect(filterExperimentMeasurementsByTimeRange(measurements, '6h', nowMs).map(({ id }) => id)).toEqual([
      'old',
      'recent',
    ])
    expect(filterExperimentMeasurementsByTimeRange(measurements, '24h', nowMs).map(({ id }) => id)).toEqual([
      'old',
      'recent',
    ])
  })
})
