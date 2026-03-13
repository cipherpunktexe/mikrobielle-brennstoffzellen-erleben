import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'user' | 'admin'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  generatorId?: string
  createdAt?: Timestamp | null
}

export interface Generator {
  id: string
  ownerUid: string
  code: string
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}

export interface Measurement {
  id: string
  generatorId: string
  value: number
  enteredBy: string
  createdAt?: Timestamp | null
}

export interface LeaderboardEntry {
  generatorId: string
  code: string
  displayName: string
  maxValue: number
  maxMeasuredAt?: Timestamp | null
}
