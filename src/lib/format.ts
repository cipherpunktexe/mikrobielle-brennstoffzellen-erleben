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

  return `${value.toFixed(2)} V`
}

export function formatCode(code: string) {
  return code.trim().toLowerCase()
}
