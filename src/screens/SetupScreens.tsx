import {
  BellRing,
  Bluetooth,
  Check,
  ChevronLeft,
  PawPrint,
  Radar,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { usePawBandStore } from '../store/PawBandStore'

const onboarding = [
  {
    eyebrow: 'Bienvenido a PawBand',
    title: 'Sabrás cuando Luna te necesite.',
    copy: 'Sin cámaras ni revisiones constantes. PawBand te avisa solo ante algo atípico.',
    icon: ShieldCheck,
    action: 'Continuar',
  },
  {
    eyebrow: 'Alertas con sentido',
    title: 'Solo lo importante.',
    copy: 'Permite las notificaciones para recibir ladridos persistentes, picos de estrés o movimiento inusual.',
    icon: BellRing,
    action: 'Permitir notificaciones',
  },
  {
    eyebrow: 'Conexión cercana',
    title: 'Conecta el collar.',
    copy: 'Bluetooth ayuda a vincular PawBand y Wi-Fi mantiene a Luna conectada cuando sales.',
    icon: Bluetooth,
    action: 'Permitir Bluetooth',
  },
]

export function OnboardingScreen() {
  const { onboardingStep, setOnboardingStep, completeOnboarding } = usePawBandStore()
  const item = onboarding[onboardingStep]
  const Icon = item.icon

  return (
    <main className="setup-screen">
      <div className="setup-top">
        {onboardingStep > 0 ? (
          <button
            type="button"
            className="icon-button ghost-button"
            aria-label="Volver"
            onClick={() => setOnboardingStep(onboardingStep - 1)}
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="brand-lockup">
            <span className="brand-mark">
              <PawPrint size={20} />
            </span>
            <strong>PawBand</strong>
          </div>
        )}
        <span className="step-count">{onboardingStep + 1} de 3</span>
      </div>

      <div className="setup-hero">
        <div className="hero-orbit">
          <span className="hero-orbit-inner">
            <Icon size={42} strokeWidth={1.7} />
          </span>
        </div>
        <p className="eyebrow">{item.eyebrow}</p>
        <h1>{item.title}</h1>
        <p>{item.copy}</p>
      </div>

      <div className="setup-actions">
        <div className="step-dots" aria-label={`Paso ${onboardingStep + 1} de 3`}>
          {onboarding.map((_, index) => (
            <span key={index} data-active={index === onboardingStep} />
          ))}
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            onboardingStep < 2
              ? setOnboardingStep(onboardingStep + 1)
              : completeOnboarding()
          }
        >
          {item.action}
        </button>
        {onboardingStep > 0 && (
          <button
            type="button"
            className="text-button"
            onClick={() =>
              onboardingStep < 2
                ? setOnboardingStep(onboardingStep + 1)
                : completeOnboarding()
            }
          >
            Ahora no
          </button>
        )}
      </div>
    </main>
  )

}

export function PairingScreen() {
  const { pairingSearching, beginPairing, connectCollar, updateSettings, dog } = usePawBandStore()

  return (
    <main className="setup-screen pairing-screen">
      <div className="brand-lockup">
        <span className="brand-mark">
          <PawPrint size={20} />
        </span>
        <strong>PawBand</strong>
      </div>

      <div className="setup-hero compact">
        <div className={`device-search ${pairingSearching ? 'is-searching' : ''}`}>
          <span className="search-wave wave-one" />
          <span className="search-wave wave-two" />
          <span className="device-core">
            {pairingSearching ? <Radar size={34} /> : <Smartphone size={34} />}
          </span>
        </div>
        <p className="eyebrow">Vincular collar</p>
        <h1>{pairingSearching ? 'Buscando cerca…' : 'Acerca el collar.'}</h1>
        <p>
          {pairingSearching
            ? 'Encontraremos tu PawBand por Bluetooth.'
            : 'Enciéndelo y mantenlo a menos de un metro de tu teléfono.'}
        </p>
      </div>

      <div className="setup-actions">
        {!pairingSearching ? (
          <button type="button" className="primary-button" onClick={beginPairing}>
            Buscar dispositivo
          </button>
        ) : (
          <button type="button" className="primary-button is-loading" disabled>
            <span className="button-spinner" />
            Buscando…
          </button>
        )}
        {!pairingSearching && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              updateSettings((settings) => ({ ...settings }))
              connectCollar()
            }}
          >
            Conectar PawBand 024
          </button>
        )}
        <p className="microcopy">{dog.name} · Tamaño mediano</p>
      </div>
    </main>
  )
}

export function CalibrationScreen() {
  const { calibrationProgress, finishCalibration, dog } = usePawBandStore()

  return (
    <main className="setup-screen calibration-screen">
      <div className="setup-top">
        <div className="brand-lockup">
          <span className="brand-mark">
            <PawPrint size={20} />
          </span>
          <strong>PawBand</strong>
        </div>
        <span className="connected-label">
          <Check size={14} /> Conectado
        </span>
      </div>

      <div className="setup-hero compact">
        <div className="calibration-ring" aria-label={`Calibración ${calibrationProgress}%`}>
          <strong>{calibrationProgress}%</strong>
          <span>aprendiendo</span>
        </div>
        <p className="eyebrow">Calibración</p>
        <h1>Conociendo a {dog.name}.</h1>
        <p>
          Durante 24 h, el collar aprenderá su nivel normal de actividad para detectar cambios
          reales.
        </p>
      </div>

      <div className="setup-actions">
        <div className="progress-track">
          <span style={{ width: `${calibrationProgress}%` }} />
        </div>
        <p className="microcopy">Puedes usar PawBand mientras aprende.</p>
        <button type="button" className="secondary-button" onClick={finishCalibration}>
          Omitir calibración (demo)
        </button>
      </div>
    </main>
  )
}
