import { describe, expect, test } from 'vitest'
import {
  formatMutedDecimal,
  formatScientificVolts,
  getGeneratorScanError,
  getLifecycleStatusLabel,
} from './utils'

describe('admin utils', () => {
  test('describes inactive generator scan errors', () => {
    expect(getGeneratorScanError('00af', 'blocked')).toBe('Code 00AF ist gesperrt.')
    expect(getGeneratorScanError('00af', 'deleted')).toBe('Code 00AF wurde gelöscht.')
    expect(getGeneratorScanError('00af', 'active')).toBe('')
  })

  test('formats sequence as decimal string', () => {
    expect(formatMutedDecimal(26)).toBe('26')
  })

  test('formats scientific volts output', () => {
    expect(formatScientificVolts(1.42)).toBe('1,42e+0 V')
  })

  test('maps lifecycle labels', () => {
    expect(getLifecycleStatusLabel('blocked')).toBe('Gesperrt')
    expect(getLifecycleStatusLabel('deleted')).not.toBe('Gesperrt')
  })
})
