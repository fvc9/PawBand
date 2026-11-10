import { useEffect } from 'react'
import { aplicarTema } from './theme'
import { lazy, Suspense } from 'react'
import { PawPrint, WifiOff } from 'lucide-react'
import { BottomNav } from './components/BottomNav'
import { NotificationBanner } from './components/NotificationBanner'
import { Simulator } from './components/Simulator'
import { AlertDetailScreen, AlertsScreen, HomeScreen } from './screens/HomeAlertsScreens'
import { CalibrationScreen, OnboardingScreen, PairingScreen } from './screens/SetupScreens'
import { PawBandProvider, usePawBandStore } from './store/PawBandStore'

const TrendsScreen = lazy(() =>
  import('./screens/TrendsSettingsScreens').then((module) => ({ default: module.TrendsScreen })),
)
const SettingsScreen = lazy(() =>
  import('./screens/TrendsSettingsScreens').then((module) => ({ default: module.SettingsScreen })),
)

function Header() {
  const { collar } = usePawBandStore()
  return (
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true">
        <PawPrint size={19} />
      </div>
      <span className="brand-name">PawBand</span>
      <span className={`connection-pill ${collar.status}`}>
        {collar.status === 'disconnected' && <WifiOff size={13} />}
        {collar.status === 'connected' ? 'En línea' : collar.status === 'calibrating' ? 'Aprendiendo' : 'Sin conexión'}
      </span>
    </header>
  )
}

function MainApp() {
  const { activeTab, selectedAlertId } = usePawBandStore()

  return (
    <div className="app-shell">
      <Header />
      <NotificationBanner />
      {selectedAlertId ? (
        <AlertDetailScreen />
      ) : activeTab === 'inicio' ? (
        <HomeScreen />
      ) : activeTab === 'alertas' ? (
        <AlertsScreen />
      ) : activeTab === 'tendencias' ? (
        <Suspense fallback={<ScreenSkeleton />}>
          <TrendsScreen />
        </Suspense>
      ) : (
        <Suspense fallback={<ScreenSkeleton />}>
          <SettingsScreen />
        </Suspense>
      )}
      {!selectedAlertId && <BottomNav />}
      <Simulator />
    </div>
  )
}

function ScreenSkeleton() {
  return (
    <main className="main-screen skeleton-screen" aria-label="Cargando">
      <span />
      <span />
      <span />
    </main>
  )
}

function PawBandApp() {
  useEffect(() => { try { const p=JSON.parse(localStorage.getItem('pawband_ui')||'{}'); aplicarTema(p.primary||'#ECB948',p.theme||'Miel') } catch { aplicarTema('#ECB948') } }, [])
  const { phase } = usePawBandStore()
  if (phase === 'app') return <MainApp />

  return (
    <div className="app-shell">
      {phase === 'onboarding' ? (
        <OnboardingScreen />
      ) : phase === 'pairing' ? (
        <PairingScreen />
      ) : (
        <CalibrationScreen />
      )}
    </div>
  )
}

export default function App() {
  return (
    <PawBandProvider>
      <PawBandApp />
    </PawBandProvider>
  )
}
