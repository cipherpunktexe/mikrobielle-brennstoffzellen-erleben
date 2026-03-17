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

export function formatMeasurement(value?: number | null) {
  if (value === undefined || value === null) {
    return 'Noch kein Messwert'
  }

  if (value !== 0 && Math.abs(value) < 0.01) {
    return `${value.toExponential(3)} V`
  }

  return `${value.toFixed(2)} V`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

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
      return `${value.toExponential(3)} V`
    }

    return `${value.toFixed(decimals)} V`
  }
}

export function formatCode(code: string) {
  return code.trim().toLowerCase()
}
