import { describe, expect, test } from 'vitest'
import { formatMutedDecimal, formatScientificVolts, getLifecycleStatusLabel } from './utils'

describe('admin utils', () => {
  test('formats sequence as decimal string', () => {
    expect(formatMutedDecimal(26)).toBe('26')
  })

  test('formats scientific volts output', () => {
    expect(formatScientificVolts(1.42)).toBe('1.420e+0 V')
  })

  test('maps lifecycle labels', () => {
    expect(getLifecycleStatusLabel('blocked')).toBe('Gesperrt')
    expect(getLifecycleStatusLabel('deleted')).not.toBe('Gesperrt')
  })
})
