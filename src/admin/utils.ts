import type { EntityLifecycleStatus } from '../common/domain'

export function formatMutedDecimal(sequence: number) {
  return sequence.toString(10)
}

export function formatScientificVolts(value: number) {
  return `${value.toExponential(3)} V`
}

export function getLifecycleStatusLabel(status: Exclude<EntityLifecycleStatus, 'active'>) {
  return status === 'blocked' ? 'Gesperrt' : 'Gelöscht'
}
