import type { Collar, Dog, PawAlert, Reading, Settings } from './models'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

export const dogMock: Dog = {
  id: 'dog-luna',
  name: 'Luna',
  breed: 'Mestiza',
  size: 'medium',
  photo: '',
}

export const defaultSettings: Settings = {
  sensitivity: 'medium',
  barkPersistSec: 120,
  movementFactor: 2,
  absenceSchedule: {
    enabled: true,
    manual: true,
    weekdays: [1, 2, 3, 4, 5],
    start: '08:00',
    end: '18:00',
  },
  quietHours: { enabled: true, start: '22:00', end: '07:00' },
  trustedContacts: [{ id: 'contact-1', name: 'Camila', phone: '+51 999 123 456' }],
  push: true,
  sound: false,
  vibration: true,
  mutedUntil: null,
}

export function createMockReadings(now = new Date()): Reading[] {
  return Array.from({ length: 96 }, (_, index) => {
    const timestamp = new Date(now.getTime() - (95 - index) * 15 * 60 * 1000)
    const hour = timestamp.getHours()
    const afternoonPeak = hour >= 13 && hour <= 15 ? 24 : 0
    const wave = Math.sin(index / 4) * 9
    const activity = clamp(25 + wave + afternoonPeak + (index % 17 === 0 ? 28 : 0))
    const stressIndex = clamp(20 + wave / 2 + afternoonPeak * 1.4)
    return { timestamp, activity, stressIndex, barking: false }
  })
}

export function createMockAlerts(now = new Date()): PawAlert[] {
  const specs: Array<[PawAlert['type'], PawAlert['severity'], number, number, boolean]> = [
    ['barking', 'warning', 38, 142, false],
    ['stress', 'critical', 180, 210, true],
    ['movement', 'warning', 310, 75, true],
    ['battery', 'info', 620, 0, true],
    ['barking', 'warning', 1_140, 184, true],
    ['disconnected', 'critical', 1_320, 380, true],
  ]
  return specs.map(([type, severity, minutesAgo, durationSec, seen], index) => ({
    id: `mock-${index}`,
    type,
    severity,
    start: new Date(now.getTime() - minutesAgo * 60 * 1000),
    durationSec,
    seen,
    falsePositive: false,
    groupCount: 1,
  }))
}

export function createInitialData(now = new Date()) {
  const readings = createMockReadings(now)
  readings[readings.length - 1] = {
    timestamp: now,
    activity: 18,
    stressIndex: 24,
    barking: false,
  }
  const collar: Collar = {
    status: 'connected',
    battery: 78,
    lastSync: now,
    firmware: '2.4.1',
  }
  return { dog: dogMock, collar, readings, alerts: createMockAlerts(now), settings: defaultSettings }
}
