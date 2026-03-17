import type { Timestamp } from 'firebase/firestore'

export function formatTimestamp(timestamp?: Timestamp | null) {
  if (!timestamp) {
    return 'Noch kein Zeitstempel'
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp.toDate())
}

export function formatElapsedTime(timestamp?: Timestamp | null, now = new Date()) {
  if (!timestamp) {
    return 'unbekannt'
  }

  const elapsedMs = Math.max(0, now.getTime() - timestamp.toDate().getTime())
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60_000))

  if (elapsedMinutes < 10) {
    return `${elapsedMinutes}min`
  }

  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}:${minutes.toString().padStart(2, '0')}h`
}

function trimTrailingMantissaZeros(mantissa: string) {
  if (!mantissa.includes('.')) {
    return mantissa
  }

  return mantissa.replace(/\.?0+$/, '')
}

function formatScientificMeasurement(value: number, fractionDigits: number) {
  const [mantissa, exponent] = value.toExponential(fractionDigits).split('e')
  const normalizedMantissa = trimTrailingMantissaZeros(mantissa).replace('.', ',')

  return `${normalizedMantissa}e${exponent}`
}

function normalizeDecimalInput(value: string) {
  const compact = value.trim().replace(/\s+/g, '')
  const lastCommaIndex = compact.lastIndexOf(',')
  const lastDotIndex = compact.lastIndexOf('.')

  if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
    if (lastCommaIndex > lastDotIndex) {
      return compact.replace(/\./g, '').replace(',', '.')
    }

    return compact.replace(/,/g, '')
  }

  if (lastCommaIndex !== -1) {
    return compact.replace(',', '.')
  }

  return compact
}

function formatDecimalMeasurement(value: number, decimals: number) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
  }).format(value)
}

export function formatDecimalInput(value: number) {
  if (!Number.isFinite(value)) {
    return ''
  }

  return value.toString().replace('.', ',')
}

export function parseDecimalInput(value: string) {
  if (!value.trim()) {
    return Number.NaN
  }

  const normalizedValue = normalizeDecimalInput(value)
  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN
}

/**
 * Formats a measurement value in a human-readable format.
 * Returns 'Noch kein Messwert' if the value is null or undefined.
 * If the absolute value of the measurement is less than 0.01, formats it as a scientific notation with 3 significant digits.
 * Otherwise, formats it as a fixed-point number with 2 decimal places.
 * @param value The measurement value to format.
 * @returns A human-readable string representation of the measurement value.
 */
export function formatMeasurement(value?: number | null) {
  if (value === undefined || value === null) {
    return 'Noch kein Messwert'
  }

  if (value !== 0 && Math.abs(value) < 0.01) {
    return `${formatScientificMeasurement(value, 3)} V`
  }

  return `${formatDecimalMeasurement(value, 2)} V`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculates the number of decimal places required to accurately represent the given values.
 * If there are less than 2 finite values, returns 2.
 * Otherwise, returns the maximum of the following two values:
 * 1. The number of decimal places required to represent the full range of values.
 * 2. The number of decimal places required to represent the minimum difference between two adjacent values.
 * The result is clamped to a minimum of 2 and a maximum of 10.
 * @param values The values for which to calculate the required decimal places.
 * @returns The number of decimal places required to accurately represent the given values.
 */
function getContextDecimals(values: number[]) {
  const finiteValues = values.filter((value) => Number.isFinite(value))

  if (finiteValues.length < 2) {
    return 2
  }

  const sortedUniqueValues = Array.from(new Set(finiteValues)).sort((left, right) => left - right)

  if (sortedUniqueValues.length < 2) {
    return 2
  }

  const range = sortedUniqueValues[sortedUniqueValues.length - 1] - sortedUniqueValues[0]
  let minDelta = Number.POSITIVE_INFINITY

  for (let index = 1; index < sortedUniqueValues.length; index += 1) {
    const delta = sortedUniqueValues[index] - sortedUniqueValues[index - 1]

    if (delta > 0 && delta < minDelta) {
      minDelta = delta
    }
  }

  const normalizedRange = range > 0 ? Number(range.toPrecision(10)) : 0
  const normalizedMinDelta =
    Number.isFinite(minDelta) && minDelta > 0 ? Number(minDelta.toPrecision(10)) : 0

  const decimalsFromRange =
    normalizedRange > 0 ? Math.max(2, Math.ceil(-Math.log10(normalizedRange))) : 2
  const decimalsFromDelta =
    normalizedMinDelta > 0
      ? Math.max(2, Math.ceil(-Math.log10(normalizedMinDelta)))
      : 2

  return clamp(Math.max(decimalsFromRange, decimalsFromDelta), 2, 10)
}

export function createContextMeasurementFormatter(values: number[]) {
  const decimals = getContextDecimals(values)

  return (value?: number | null) => {
    if (value === undefined || value === null) {
      return 'Noch kein Messwert'
    }

    if (value !== 0 && Math.abs(value) < 0.01) {
      return `${formatScientificMeasurement(value, 3)} V`
    }

    return `${formatDecimalMeasurement(value, decimals)} V`
  }
}

export function formatCode(code: string) {
  return code.trim().toLowerCase()
}
