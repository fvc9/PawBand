import {
  Activity,
  BatteryLow,
  BellRing,
  BluetoothOff,
  Gauge,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Timer,
} from 'lucide-react'
import { BottomSheet, Toggle } from './ui'
import { usePawBandStore, type SimulationType } from '../store/PawBandStore'

const simulations: Array<{
  type: SimulationType
  label: string
  icon: typeof Activity
  tone?: string
}> = [
  { type: 'barking', label: 'Ladridos persistentes', icon: BellRing },
  { type: 'movement', label: 'Movimiento inusual', icon: Activity },
  { type: 'stress', label: 'Pico de estrés', icon: Gauge },
  { type: 'disconnected', label: 'Collar desconectado', icon: BluetoothOff },
  { type: 'battery', label: 'Batería baja', icon: BatteryLow },
  { type: 'calm', label: 'Volver a tranquilo', icon: Sparkles, tone: 'calm' },
]

export function Simulator() {
  const {
    simulatorOpen,
    setSimulatorOpen,
    acceleratedTime,
    setAcceleratedTime,
    simulate,
    resetDemo,
  } = usePawBandStore()

  return (
    <>
      <button
        type="button"
        className="simulator-fab"
        aria-label="Abrir simulador"
        onClick={() => setSimulatorOpen(true)}
      >
        <SlidersHorizontal size={20} />
      </button>
      <BottomSheet
        open={simulatorOpen}
        title="Simulador"
        onClose={() => setSimulatorOpen(false)}
      >
        <p className="sheet-intro">Prueba PawBand sin hardware.</p>
        <div className="simulation-grid">
          {simulations.map(({ type, label, icon: Icon, tone }) => (
            <button
              type="button"
              key={type}
              className="simulation-button"
              data-tone={tone}
              onClick={() => {
                simulate(type)
                setSimulatorOpen(false)
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="simulator-time">
          <Timer size={20} />
          <Toggle
            label="Acelerar tiempo (×30)"
            description="Un día en cerca de 1 minuto"
            checked={acceleratedTime}
            onChange={setAcceleratedTime}
          />
        </div>
        <button type="button" className="reset-button" onClick={resetDemo}>
          <RotateCcw size={17} /> Reiniciar demo
        </button>
      </BottomSheet>
    </>
  )
}
