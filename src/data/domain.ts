import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'user' | 'admin'
export type EntityLifecycleStatus = 'active' | 'blocked' | 'deleted'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  status?: EntityLifecycleStatus
  generatorId?: string
  createdAt?: Timestamp | null
  archivedAt?: Timestamp | null
  archivedBy?: string | null
}

export interface Generator {
  id: string
  ownerUid: string
  code: string
  ownerName?: string
  status?: EntityLifecycleStatus
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
  archivedAt?: Timestamp | null
  archivedBy?: string | null
}

export interface Measurement {
  id: string
  generatorId: string
  value: number
  enteredBy: string
  createdAt?: Timestamp | null
}

export interface ExperimentMeasurement {
  id: string
  valueMv: number
  deviceId: string
  source: 'arduino'
  measuredAt?: Timestamp | null
  createdAt?: Timestamp | null
}

export interface LeaderboardEntry {
  generatorId: string
  code: string
  displayName: string
  maxValue: number
  maxMeasuredAt?: Timestamp | null
}
