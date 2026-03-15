import { describe, expect, test } from 'vitest'
import { buildGeneratorQrValue, extractGeneratorCodeFromQrValue, getQrBadgeHex } from './qr'

describe('qr utils', () => {
  test('builds and parses register links for newly generated qr codes', () => {
    const value = buildGeneratorQrValue('Station-007')

    expect(value).toBe('http://localhost:3000/register/station-007')
    expect(extractGeneratorCodeFromQrValue(value)).toBe('station-007')
  })

  test('continues to parse legacy internal qr payloads', () => {
    expect(extractGeneratorCodeFromQrValue('mbz:generator:station-007')).toBe('station-007')
  })

  test('continues to parse legacy register links', () => {
    expect(
      extractGeneratorCodeFromQrValue('https://example.com/register/station-008'),
    ).toBe('station-008')
  })

  test('continues to parse legacy admin links', () => {
    expect(
      extractGeneratorCodeFromQrValue('https://example.com/admin/generator/station-009'),
    ).toBe('station-009')
  })

  test('falls back to plain generator codes', () => {
    expect(extractGeneratorCodeFromQrValue('station-010')).toBe('station-010')
  })

  test('builds a deterministic three-digit hex badge from the code', () => {
    expect(getQrBadgeHex('station-010')).toMatch(/^[0-9A-F]{3}$/)
    expect(getQrBadgeHex('station-010')).toBe(getQrBadgeHex('Station-010'))
  })
})
