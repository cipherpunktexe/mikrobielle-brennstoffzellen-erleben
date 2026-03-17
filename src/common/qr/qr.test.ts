import { describe, expect, test } from 'vitest'
import { buildGeneratorQrValue, extractGeneratorCodeFromQrValue, getQrBadgeLabel } from './qr'

describe('qr utils', () => {
  test('builds and parses register links for newly generated qr codes', () => {
    const value = buildGeneratorQrValue('Station-007')

    expect(value).toBe('https://mikrobielle-brennstoffzellen.web.app/register/station-007')
    expect(extractGeneratorCodeFromQrValue(value)).toBe('station-007')
  })

  test('parses register links from any origin', () => {
    expect(
      extractGeneratorCodeFromQrValue('https://example.com/register/station-008'),
    ).toBe('station-008')
  })

  test('parses register links without protocol and with query params', () => {
    expect(
      extractGeneratorCodeFromQrValue('mikrobielle-brennstoffzellen.web.app/register/001C?source=camera'),
    ).toBe('001c')
  })

  test('rejects legacy payload formats', () => {
    expect(extractGeneratorCodeFromQrValue('mbz:generator:station-009')).toBe('')
    expect(extractGeneratorCodeFromQrValue('https://example.com/admin/generator/station-009')).toBe('')
  })

  test('parses admin scan links and query based qr payloads', () => {
    expect(extractGeneratorCodeFromQrValue('https://example.com/admin/scan/generator/00AF')).toBe('00af')
    expect(extractGeneratorCodeFromQrValue('https://example.com/scan?code=00B1')).toBe('00b1')
    expect(extractGeneratorCodeFromQrValue('https://example.com/scan?generator=00B2')).toBe('00b2')
  })

  test('falls back to plain generator codes', () => {
    expect(extractGeneratorCodeFromQrValue('station-010')).toBe('station-010')
  })

  test('uses the actual code as uppercase badge label', () => {
    expect(getQrBadgeLabel('000a')).toBe('000A')
    expect(getQrBadgeLabel('000a')).toBe(getQrBadgeLabel('000A'))
  })
})
