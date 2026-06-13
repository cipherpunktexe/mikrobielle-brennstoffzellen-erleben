import type { EntityLifecycleStatus } from '../data/domain'

export function getGeneratorScanError(code: string, status?: EntityLifecycleStatus) {
  if (status === 'blocked') {
    return `Code ${code.toUpperCase()} ist gesperrt.`
  }

  if (status === 'deleted') {
    return `Code ${code.toUpperCase()} wurde gelöscht.`
  }

  return ''
}

export function formatMutedDecimal(sequence: number) {
  return sequence.toString(10)
}

export function formatScientificVolts(value: number) {
  const [mantissa, exponent] = value.toExponential(3).split('e')
  const normalizedMantissa = mantissa.replace(/\.?0+$/, '').replace('.', ',')

  return `${normalizedMantissa}e${exponent} V`
}

export function getLifecycleStatusLabel(status: Exclude<EntityLifecycleStatus, 'active'>) {
  return status === 'blocked' ? 'Gesperrt' : 'Gelöscht'
}
