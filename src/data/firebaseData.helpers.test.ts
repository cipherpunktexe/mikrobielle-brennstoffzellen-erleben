import { describe, expect, test } from 'vitest'
import {
  formatSequentialGeneratorCode,
  getEntityLifecycleStatus,
  getNextGeneratorSequence,
  isActiveEntity,
} from './firebaseData.helpers'

describe('firebase data helpers', () => {
  test('normalizes lifecycle status values', () => {
    expect(getEntityLifecycleStatus('blocked')).toBe('blocked')
    expect(getEntityLifecycleStatus('deleted')).toBe('deleted')
    expect(getEntityLifecycleStatus('x')).toBe('active')
    expect(getEntityLifecycleStatus(undefined)).toBe('active')
  })

  test('checks active entity flag', () => {
    expect(isActiveEntity({ status: 'active' })).toBe(true)
    expect(isActiveEntity({ status: 'blocked' })).toBe(false)
    expect(isActiveEntity({ status: 'deleted' })).toBe(false)
    expect(isActiveEntity({})).toBe(true)
    expect(isActiveEntity(null)).toBe(true)
  })

  test('formats sequential code in upper-case hex with padding', () => {
    expect(formatSequentialGeneratorCode(10, 4)).toBe('000A')
    expect(formatSequentialGeneratorCode(255, 2)).toBe('FF')
    expect(formatSequentialGeneratorCode(255, 1.8)).toBe('FF')
  })

  test('normalizes next sequence values', () => {
    expect(getNextGeneratorSequence(12.8)).toBe(12)
    expect(getNextGeneratorSequence(1)).toBe(1)
    expect(getNextGeneratorSequence(0)).toBe(1)
    expect(getNextGeneratorSequence(-5)).toBe(1)
    expect(getNextGeneratorSequence(NaN)).toBe(1)
    expect(getNextGeneratorSequence('8')).toBe(1)
  })
})
