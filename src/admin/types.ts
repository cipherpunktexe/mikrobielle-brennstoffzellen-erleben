import type { Generator, UserProfile, UserRole, EntityLifecycleStatus } from '../app/domain'

export type AdminTabValue = 'qr' | 'scan' | 'moderation'
export type MeasurementUnit = 'uV' | 'mV' | 'V' | 'kV'
export type QrExportStepKey = 'count' | 'layout' | 'number' | 'export'

export interface UserFormState {
  name: string
  email: string
  role: UserRole
}

export interface MeasurementFormState {
  value: string
  enteredBy: string
}

export interface ModerationListEntry {
  user: UserProfile
  generator: Generator | null
  status: EntityLifecycleStatus
}
