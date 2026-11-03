import {
  AlertTriangle,
  BatteryLow,
  BellRing,
  BluetoothOff,
  Gauge,
  type LucideIcon,
} from 'lucide-react'
import type { AlertSeverity, AlertType, PawAlert } from './models'

export const alertTypeConfig: Record<
  AlertType,
  { title: string; short: string; icon: LucideIcon; explanation: string; suggestion: string }
> = {
  barking: {
    title: 'Ladridos persistentes',
    short: 'Ladridos',
    icon: BellRing,
    explanation: 'Luna ladró de forma continua por más tiempo del habitual.',
    suggestion: 'Prueba con música relajante o pide a alguien que la visite.',
  },
  movement: {
    title: 'Movimiento inusual',
    short: 'Movimiento',
    icon: Gauge,
    explanation: 'La actividad de Luna superó su línea base durante varios minutos.',
    suggestion: 'Revisa si hubo algún ruido o cambio inesperado en casa.',
  },
  stress: {
    title: 'Pico de estrés',
    short: 'Estrés',
    icon: AlertTriangle,
    explanation: 'El índice de estrés se mantuvo alto durante más de 2 minutos.',
    suggestion: 'Si se repite, considera una caminata antes de dejarla sola.',
  },
  disconnected: {
    title: 'Collar desconectado',
    short: 'Sin conexión',
    icon: BluetoothOff,
    explanation: 'PawBand dejó de recibir datos del collar de Luna.',
    suggestion: 'Verifica que el collar tenga carga y esté dentro del alcance de Wi-Fi.',
  },
  battery: {
    title: 'Batería baja',
    short: 'Batería',
    icon: BatteryLow,
    explanation: 'La batería del collar está por debajo del 10%.',
    suggestion: 'Carga el collar cuando regreses a casa.',
  },
}

export const severityLabel: Record<AlertSeverity, string> = {
  info: 'Info',
  warning: 'Atención',
  critical: 'Crítica',
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit' }).format(date)
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return remaining ? `${minutes} min ${remaining} s` : `${minutes} min`
}

export function notificationText(alert: PawAlert, dogName = 'Luna') {
  if (alert.type === 'barking') return `${dogName} lleva ${formatDuration(alert.durationSec)} ladrando`
  if (alert.type === 'stress') return `Detectamos un pico de estrés en ${dogName}`
  if (alert.type === 'movement') return `${dogName} tiene movimiento inusual`
  if (alert.type === 'disconnected') return `El collar de ${dogName} se desconectó`
  return `La batería del collar está baja`
}
