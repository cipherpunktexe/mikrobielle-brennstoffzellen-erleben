import { describe, expect, test } from 'vitest'
import { buildGeneratorQrValue, extractGeneratorCodeFromQrValue, getQrBadgeLabel } from './qr'

describe('qr utils', () => {
  test('builds and parses register links for newly generated qr codes', () => {
    const value = buildGeneratorQrValue('Station-007')

    expect(value).toBe('https://mikrobielle-brennstoffzellen.web.app/register/station-007')
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

  test('uses the actual code as uppercase badge label', () => {
    expect(getQrBadgeLabel('000a')).toBe('000A')
    expect(getQrBadgeLabel('000a')).toBe(getQrBadgeLabel('000A'))
  })
})
