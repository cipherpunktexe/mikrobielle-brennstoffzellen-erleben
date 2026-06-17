import { describe, expect, test } from 'vitest'
import { createExperimentVoltageFormatter } from './ExperimentLiveChart'

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
