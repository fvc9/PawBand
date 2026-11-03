import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { reduceSensitivity, runAlertEngine } from '../domain/alertEngine'
import { createInitialData } from '../domain/mockData'
import type {
  AlertType,
  Collar,
  Dog,
  PawAlert,
  Reading,
  Settings,
} from '../domain/models'

export type TabId = 'inicio' | 'alertas' | 'tendencias' | 'ajustes'
export type Severity = 'tranquilo' | 'inquieto' | 'alerta'
export type AppPhase = 'onboarding' | 'pairing' | 'calibrating' | 'app'
export type AlertFilter = 'all' | 'unseen' | 'critical'
export type TrendRange = 'today' | 'week'
export type SettingsPage = 'main' | 'alerts' | 'collar' | 'notifications'
export type SimulationType = AlertType | 'calm'

interface PersistedState {
  phase: AppPhase
  dog: Dog
  collar: Collar
  readings: Reading[]
  alerts: PawAlert[]
  settings: Settings
}

interface PawBandStore extends PersistedState {
  onboardingStep: number
  pairingSearching: boolean
  calibrationProgress: number
  activeTab: TabId
  alertFilter: AlertFilter
  trendRange: TrendRange
  settingsPage: SettingsPage
  selectedAlertId: string | null
  simulatorOpen: boolean
  acceleratedTime: boolean
  notification: PawAlert | null
  setOnboardingStep: (step: number) => void
  completeOnboarding: () => void
  beginPairing: () => void
  connectCollar: () => void
  finishCalibration: () => void
  setActiveTab: (tab: TabId) => void
  setAlertFilter: (filter: AlertFilter) => void
  setTrendRange: (range: TrendRange) => void
  setSettingsPage: (page: SettingsPage) => void
  updateSettings: (updater: Settings | ((current: Settings) => Settings)) => void
  openAlert: (id: string) => void
  closeAlert: () => void
  markAlertSeen: (id: string) => void
  markFalsePositive: (id: string) => void
  muteForHour: () => void
  setSimulatorOpen: (open: boolean) => void
  setAcceleratedTime: (enabled: boolean) => void
  simulate: (type: SimulationType) => void
  clearNotification: () => void
  resetDemo: () => void
  recalibrate: () => void
  unlinkCollar: () => void
}

const STORAGE_KEY = 'pawband-demo-v2'
const StoreContext = createContext<PawBandStore | null>(null)

function hydrateState(): PersistedState {
  const fallback = { phase: 'onboarding' as AppPhase, ...createInitialData() }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return {
      ...parsed,
      collar: { ...parsed.collar, lastSync: new Date(parsed.collar.lastSync) },
      readings: parsed.readings.map((reading: Reading) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      })),
      alerts: parsed.alerts.map((alert: PawAlert) => ({ ...alert, start: new Date(alert.start) })),
      settings: {
        ...parsed.settings,
        mutedUntil: parsed.settings.mutedUntil ? new Date(parsed.settings.mutedUntil) : null,
      },
    }
  } catch {
    return fallback
  }
}

function makeDeviceAlert(type: 'disconnected' | 'battery', now: Date, settings: Settings): PawAlert {
  return {
    id: `${type}-${now.getTime()}`,
    type,
    severity: type === 'disconnected' ? 'critical' : 'info',
    start: now,
    durationSec: 0,
    seen: false,
    falsePositive: false,
    notificationSuppressed: Boolean(settings.mutedUntil && settings.mutedUntil > now),
    groupCount: 1,
  }
}

export function PawBandProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedState>(hydrateState)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [pairingSearching, setPairingSearching] = useState(false)
  const [calibrationProgress, setCalibrationProgress] = useState(12)
  const [activeTab, setActiveTabState] = useState<TabId>('inicio')
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all')
  const [trendRange, setTrendRange] = useState<TrendRange>('today')
  const [settingsPage, setSettingsPage] = useState<SettingsPage>('main')
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [acceleratedTime, setAcceleratedTime] = useState(false)
  const [notification, setNotification] = useState<PawAlert | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      // The demo remains usable when storage is blocked or full.
    }
  }, [persisted])

  useEffect(() => {
    if (persisted.phase !== 'calibrating') return
    const timer = window.setInterval(
      () => setCalibrationProgress((progress) => Math.min(100, progress + 2)),
      700,
    )
    return () => window.clearInterval(timer)
  }, [persisted.phase])

  const appendReadings = useCallback((newReadings: Reading[]) => {
    setPersisted((current) => {
      const readings = [...current.readings, ...newReadings].slice(-672)
      const created = runAlertEngine({
        readings,
        settings: current.settings,
        existingAlerts: current.alerts,
        baselineActivity: 30,
        now: newReadings.at(-1)?.timestamp,
      })
      if (created[0]) setNotification(created[0])
      return {
        ...current,
        readings,
        alerts: [...created, ...current.alerts],
        collar: { ...current.collar, lastSync: newReadings.at(-1)?.timestamp ?? new Date() },
      }
    })
  }, [])

  useEffect(() => {
    if (!acceleratedTime || persisted.phase !== 'app') return
    const timer = window.setInterval(() => {
      const last = persisted.readings.at(-1) ?? {
        timestamp: new Date(),
        activity: 20,
        stressIndex: 20,
        barking: false,
      }
      const timestamp = new Date(last.timestamp.getTime() + 30 * 60 * 1000)
      const hour = timestamp.getHours()
      const peak = hour >= 13 && hour <= 15
      appendReadings([
        {
          timestamp,
          activity: Math.round(peak ? 55 + Math.random() * 25 : 15 + Math.random() * 25),
          stressIndex: Math.round(peak ? 48 + Math.random() * 28 : 14 + Math.random() * 24),
          barking: peak && Math.random() > 0.72,
        },
      ])
    }, 2000)
    return () => window.clearInterval(timer)
  }, [acceleratedTime, appendReadings, persisted.phase, persisted.readings])

  const beginPairing = () => {
    setPairingSearching(true)
    window.setTimeout(() => setPairingSearching(false), 1500)
  }

  const connectCollar = () => {
    setPersisted((current) => ({
      ...current,
      phase: 'calibrating',
      collar: { ...current.collar, status: 'calibrating', lastSync: new Date() },
    }))
    setCalibrationProgress(12)
  }

  const finishCalibration = () =>
    setPersisted((current) => ({
      ...current,
      phase: 'app',
      collar: { ...current.collar, status: 'connected', lastSync: new Date() },
    }))

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab)
    setSelectedAlertId(null)
    if (tab !== 'ajustes') setSettingsPage('main')
  }

  const updateSettings = (updater: Settings | ((current: Settings) => Settings)) =>
    setPersisted((current) => ({
      ...current,
      settings: typeof updater === 'function' ? updater(current.settings) : updater,
    }))

  const openAlert = (id: string) => {
    setSelectedAlertId(id)
    setActiveTabState('alertas')
  }

  const markAlertSeen = (id: string) =>
    setPersisted((current) => ({
      ...current,
      alerts: current.alerts.map((alert) => (alert.id === id ? { ...alert, seen: true } : alert)),
    }))

  const markFalsePositive = (id: string) =>
    setPersisted((current) => ({
      ...current,
      settings: reduceSensitivity(current.settings),
      alerts: current.alerts.map((alert) =>
        alert.id === id ? { ...alert, seen: true, falsePositive: true } : alert,
      ),
    }))

  const muteForHour = () => {
    updateSettings((settings) => ({
      ...settings,
      mutedUntil: new Date(Date.now() + 60 * 60 * 1000),
    }))
    if (selectedAlertId) markAlertSeen(selectedAlertId)
  }

  const simulate = (type: SimulationType) => {
    const now = new Date()
    if (type === 'calm') {
      setPersisted((current) => ({
        ...current,
        collar: { ...current.collar, status: 'connected', lastSync: now },
        readings: [
          ...current.readings,
          { timestamp: now, activity: 16, stressIndex: 18, barking: false },
        ].slice(-672),
      }))
      setNotification(null)
      return
    }

    if (type === 'disconnected' || type === 'battery') {
      setPersisted((current) => {
        const recent = current.alerts.find(
          (alert) =>
            alert.type === type && now.getTime() - alert.start.getTime() < 10 * 60 * 1000,
        )
        if (recent) {
          const grouped = { ...recent, groupCount: (recent.groupCount ?? 1) + 1 }
          setNotification(grouped)
          return {
            ...current,
            alerts: current.alerts.map((alert) => (alert.id === recent.id ? grouped : alert)),
          }
        }
        const alert = makeDeviceAlert(type, now, current.settings)
        setNotification(alert)
        return {
          ...current,
          collar: {
            ...current.collar,
            status: type === 'disconnected' ? 'disconnected' : current.collar.status,
            battery: type === 'battery' ? 8 : current.collar.battery,
          },
          alerts: [alert, ...current.alerts],
        }
      })
      return
    }

    setPersisted((current) => {
      const duration = type === 'barking' ? current.settings.barkPersistSec + 10 : 130
      const sequence: Reading[] =
        type === 'movement'
          ? [2, 1, 0].map((offset) => ({
              timestamp: new Date(now.getTime() - offset * 30_000),
              activity: 88,
              stressIndex: 58,
              barking: false,
            }))
          : [duration, Math.round(duration / 2), 0].map((secondsAgo) => ({
              timestamp: new Date(now.getTime() - secondsAgo * 1000),
              activity: type === 'barking' ? 62 : 74,
              stressIndex: type === 'stress' ? 82 : 61,
              barking: type === 'barking',
            }))
      const readings = [...current.readings, ...sequence].slice(-672)
      const created = runAlertEngine({
        readings,
        settings: current.settings,
        existingAlerts: current.alerts,
        baselineActivity: 30,
        now,
      })
      if (created[0]) {
        setNotification(created[0])
      } else {
        const recent = current.alerts.find(
          (alert) =>
            alert.type === type && now.getTime() - alert.start.getTime() < 10 * 60 * 1000,
        )
        if (recent) {
          const grouped = { ...recent, groupCount: (recent.groupCount ?? 1) + 1 }
          setNotification(grouped)
          return {
            ...current,
            readings,
            alerts: current.alerts.map((alert) => (alert.id === recent.id ? grouped : alert)),
            collar: { ...current.collar, status: 'connected', lastSync: now },
          }
        }
      }
      return {
        ...current,
        readings,
        alerts: [...created, ...current.alerts],
        collar: { ...current.collar, status: 'connected', lastSync: now },
      }
    })
  }

  const resetDemo = () => {
    const fresh = createInitialData()
    setPersisted({ phase: 'app', ...fresh })
    setActiveTabState('inicio')
    setSelectedAlertId(null)
    setNotification(null)
    setAcceleratedTime(false)
    setSimulatorOpen(false)
  }

  const store = useMemo<PawBandStore>(
    () => ({
      ...persisted,
      onboardingStep,
      pairingSearching,
      calibrationProgress,
      activeTab,
      alertFilter,
      trendRange,
      settingsPage,
      selectedAlertId,
      simulatorOpen,
      acceleratedTime,
      notification,
      setOnboardingStep,
      completeOnboarding: () =>
        setPersisted((current) => ({ ...current, phase: 'pairing' })),
      beginPairing,
      connectCollar,
      finishCalibration,
      setActiveTab,
      setAlertFilter,
      setTrendRange,
      setSettingsPage,
      updateSettings,
      openAlert,
      closeAlert: () => setSelectedAlertId(null),
      markAlertSeen,
      markFalsePositive,
      muteForHour,
      setSimulatorOpen,
      setAcceleratedTime,
      simulate,
      clearNotification: () => setNotification(null),
      resetDemo,
      recalibrate: () => {
        setPersisted((current) => ({
          ...current,
          phase: 'calibrating',
          collar: { ...current.collar, status: 'calibrating' },
        }))
        setCalibrationProgress(12)
      },
      unlinkCollar: () =>
        setPersisted((current) => ({
          ...current,
          phase: 'pairing',
          collar: { ...current.collar, status: 'disconnected' },
        })),
    }),
    [
      persisted,
      onboardingStep,
      pairingSearching,
      calibrationProgress,
      activeTab,
      alertFilter,
      trendRange,
      settingsPage,
      selectedAlertId,
      simulatorOpen,
      acceleratedTime,
      notification,
    ],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function usePawBandStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('usePawBandStore debe usarse dentro de PawBandProvider')
  return store
}
