import type { Measurement, UserRole } from './domain'

export interface RegisterUserInput {
  name: string
  email: string
  password: string
  code: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AdminUserProfileUpdateInput {
  name: string
  email: string
  role: UserRole
}

export interface AdminGeneratorUpdateInput {
  code: string
  ownerUid: string
  ownerName: string
}

export interface AdminMeasurementUpdateInput {
  value: number
  enteredBy: string
}

export interface AddMeasurementByCodeInput {
  code: string
  value: number
  enteredBy: string
  createdAt?: Date
}

export interface AdminRecentMeasurementItem extends Measurement {
  generatorCode: string
  ownerName: string
}

export interface ReservedGeneratorCodes {
  codes: string[]
  startCode: string
  endCode: string
  nextCode: string
  startSequence: number
  endSequence: number
  nextSequence: number
}
