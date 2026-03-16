import type { EntityLifecycleStatus } from './domain'

export function getEntityLifecycleStatus(value: unknown): EntityLifecycleStatus {
  if (value === 'blocked' || value === 'deleted') {
    return value
  }

  return 'active'
}

export function isActiveEntity(value: { status?: EntityLifecycleStatus } | null | undefined) {
  return getEntityLifecycleStatus(value?.status) === 'active'
}

export function formatSequentialGeneratorCode(sequence: number, digits = 4) {
  const safeDigits = Math.max(1, Math.floor(digits))
  return sequence.toString(16).toUpperCase().padStart(safeDigits, '0')
}

export function getNextGeneratorSequence(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) {
    return 1
  }

  return Math.floor(value)
}
