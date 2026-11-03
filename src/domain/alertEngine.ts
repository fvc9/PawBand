import type { AlertSeverity, AlertType, PawAlert, Reading, Settings } from './models'

export type DogState = 'tranquilo' | 'inquieto' | 'alerta'

export interface EngineInput {
  readings: Reading[]
  settings: Settings
  existingAlerts: PawAlert[]
  baselineActivity: number
  now?: Date
}

const COOLDOWN_MS = 10 * 60 * 1000

export function getDogState(stressIndex: number): DogState {
  if (stressIndex < 35) return 'tranquilo'
  if (stressIndex <= 65) return 'inquieto'
  return 'alerta'
}

function secondsBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000))
}

function timeInRange(date: Date, start: string, end: string) {
  const minutes = date.getHours() * 60 + date.getMinutes()
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  const from = startHour * 60 + startMinute
  const to = endHour * 60 + endMinute
  return from <= to ? minutes >= from && minutes <= to : minutes >= from || minutes <= to
}

export function isAbsenceActive(settings: Settings, now: Date) {
  const schedule = settings.absenceSchedule
  if (schedule.manual) return true
  return (
    schedule.enabled &&
    schedule.weekdays.includes(now.getDay()) &&
    timeInRange(now, schedule.start, schedule.end)
  )
}

export function isQuietTime(settings: Settings, now: Date) {
  return settings.quietHours.enabled && timeInRange(now, settings.quietHours.start, settings.quietHours.end)
}

function getContinuousTail(readings: Reading[], predicate: (reading: Reading) => boolean) {
  const ordered = [...readings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  const tail: Reading[] = []
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    if (!predicate(ordered[index])) break
    tail.unshift(ordered[index])
  }
  return tail
}

function buildAlert(
  type: AlertType,
  severity: AlertSeverity,
  start: Date,
  durationSec: number,
  settings: Settings,
  now: Date,
): PawAlert {
  const outsideAbsence = !isAbsenceActive(settings, now)
  const notificationSuppressed =
    isQuietTime(settings, now) ||
    (outsideAbsence && severity !== 'critical') ||
    (settings.mutedUntil ? settings.mutedUntil > now : false)

  return {
    id: `${type}-${now.getTime()}`,
    type,
    severity,
    start,
    durationSec,
    seen: false,
    falsePositive: false,
    notificationSuppressed,
    groupCount: 1,
  }
}

function isCoolingDown(type: AlertType, alerts: PawAlert[], now: Date) {
  return alerts.some(
    (alert) => alert.type === type && now.getTime() - alert.start.getTime() < COOLDOWN_MS,
  )
}

export function runAlertEngine({
  readings,
  settings,
  existingAlerts,
  baselineActivity,
  now = readings.at(-1)?.timestamp ?? new Date(),
}: EngineInput): PawAlert[] {
  if (!readings.length) return []

  const created: PawAlert[] = []
  const sensitivityScale =
    settings.sensitivity === 'high' ? 0.8 : settings.sensitivity === 'low' ? 1.25 : 1
  const barkThreshold = settings.barkPersistSec * sensitivityScale
  const movementThreshold = baselineActivity * settings.movementFactor * sensitivityScale
  const barking = getContinuousTail(readings, (reading) => reading.barking)
  if (barking.length >= 2) {
    const duration = secondsBetween(barking[0].timestamp, now)
    if (duration >= barkThreshold && !isCoolingDown('barking', existingAlerts, now)) {
      created.push(
        buildAlert(
          'barking',
          duration >= barkThreshold * 2 ? 'critical' : 'warning',
          barking[0].timestamp,
          duration,
          settings,
          now,
        ),
      )
    }
  }

  const movement = readings.slice(-3)
  if (
    movement.length === 3 &&
    movement.every((reading) => reading.activity > movementThreshold) &&
    !isCoolingDown('movement', existingAlerts, now)
  ) {
    created.push(
      buildAlert(
        'movement',
        movement.some((reading) => reading.activity > 90) ? 'critical' : 'warning',
        movement[0].timestamp,
        secondsBetween(movement[0].timestamp, now),
        settings,
        now,
      ),
    )
  }

  const stress = getContinuousTail(readings, (reading) => reading.stressIndex > 65)
  if (stress.length >= 2) {
    const duration = secondsBetween(stress[0].timestamp, now)
    if (duration >= 120 && !isCoolingDown('stress', existingAlerts, now)) {
      created.push(
        buildAlert(
          'stress',
          stress.some((reading) => reading.stressIndex > 88) ? 'critical' : 'warning',
          stress[0].timestamp,
          duration,
          settings,
          now,
        ),
      )
    }
  }

  return created
}

export function reduceSensitivity(settings: Settings): Settings {
  const next = settings.sensitivity === 'high' ? 'medium' : 'low'
  return {
    ...settings,
    sensitivity: next,
    movementFactor: Math.min(3, Number((settings.movementFactor + 0.25).toFixed(2))),
    barkPersistSec: Math.min(300, settings.barkPersistSec + 30),
  }
}
