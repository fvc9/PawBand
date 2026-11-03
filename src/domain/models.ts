export type DogSize = 'small' | 'medium' | 'large'
export type CollarStatus = 'connected' | 'disconnected' | 'calibrating'
export type AlertType = 'barking' | 'movement' | 'stress' | 'disconnected' | 'battery'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type Sensitivity = 'low' | 'medium' | 'high'

export interface Dog {
  id: string
  name: string
  breed: string
  size: DogSize
  photo: string
}

export interface Collar {
  status: CollarStatus
  battery: number
  lastSync: Date
  firmware: string
}

export interface Reading {
  timestamp: Date
  activity: number
  stressIndex: number
  barking: boolean
}

export interface PawAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  start: Date
  durationSec: number
  seen: boolean
  falsePositive: boolean
  notificationSuppressed?: boolean
  groupCount?: number
}

export interface AbsenceSchedule {
  enabled: boolean
  manual: boolean
  weekdays: number[]
  start: string
  end: string
}

export interface QuietHours {
  enabled: boolean
  start: string
  end: string
}

export interface TrustedContact {
  id: string
  name: string
  phone: string
}

export interface Settings {
  sensitivity: Sensitivity
  barkPersistSec: number
  movementFactor: number
  absenceSchedule: AbsenceSchedule
  quietHours: QuietHours
  trustedContacts: TrustedContact[]
  push: boolean
  sound: boolean
  vibration: boolean
  mutedUntil: Date | null
}
