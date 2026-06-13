import { describe, expect, test } from 'vitest'
import {
  buildGeneratorQrValue,
  extractGeneratorCodeFromQrValue,
  getQrBadgeLabel,
  QR_BACKGROUND_COLOR,
  QR_FOREGROUND_COLOR,
} from './qr'

describe('qr utils', () => {
  test('builds and parses user page registration links for newly generated qr codes', () => {
    const value = buildGeneratorQrValue('00AF')

    expect(value).toBe(
      'https://mikrobielle-brennstoffzellen.web.app/user?register=00af',
    )
    expect(extractGeneratorCodeFromQrValue(value)).toBe('00af')
  })

  test('rejects every payload outside the current qr format', () => {
    expect(extractGeneratorCodeFromQrValue('https://example.com/user?register=00b0')).toBe('')
    expect(extractGeneratorCodeFromQrValue('/user?register=station-008')).toBe('')
    expect(extractGeneratorCodeFromQrValue('https://mikrobielle-brennstoffzellen.web.app/register/00b0')).toBe('')
    expect(extractGeneratorCodeFromQrValue('https://mikrobielle-brennstoffzellen.web.app/user?code=00b0')).toBe('')
    expect(extractGeneratorCodeFromQrValue('https://mikrobielle-brennstoffzellen.web.app/user?register=00b0&source=camera')).toBe('')
    expect(extractGeneratorCodeFromQrValue('https://mikrobielle-brennstoffzellen.web.app/user?register=00b0#scan')).toBe('')
    expect(extractGeneratorCodeFromQrValue('https://mikrobielle-brennstoffzellen-erleben.web.app/user?register=00b0')).toBe('')
    expect(extractGeneratorCodeFromQrValue('https://mikrobielle-brennstoffzellen.web.app/user?register=station-008')).toBe('')
    expect(extractGeneratorCodeFromQrValue('mbz:generator:station-009')).toBe('')
    expect(extractGeneratorCodeFromQrValue('station-010')).toBe('')
    expect(buildGeneratorQrValue('station-010')).toBe('')
  })

  test('uses the actual code as uppercase badge label', () => {
    expect(getQrBadgeLabel('000a')).toBe('000A')
    expect(getQrBadgeLabel('000a')).toBe(getQrBadgeLabel('000A'))
  })

  test('uses only black on white for qr rendering', () => {
    expect(QR_FOREGROUND_COLOR).toBe('#000000')
    expect(QR_BACKGROUND_COLOR).toBe('#FFFFFF')
  })
})
