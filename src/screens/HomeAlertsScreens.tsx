import { useRef, useState } from 'react'
import {
  Activity,
  BatteryMedium,
  BellOff,
  Check,
  ChevronLeft,
  Clock3,
  Eye,
  Info,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react'
import { getDogState } from '../domain/alertEngine'
import { alertTypeConfig, formatDuration, formatTime } from '../domain/presentation'
import type { PawAlert } from '../domain/models'
import {
  AlertChip,
  BottomSheet,
  Card,
  SegmentedControl,
  SeverityChip,
  StatusRing,
} from '../components/ui'
import { usePawBandStore } from '../store/PawBandStore'

function chartData(readings: ReturnType<typeof usePawBandStore>['readings']) {
  return readings.map((reading) => ({
    time: formatTime(reading.timestamp),
    activity: reading.activity,
    stress: reading.stressIndex,
  }))
}

function SimpleLineChart({
  values,
  color = '#3FA796',
}: {
  values: number[]
  color?: string
}) {
  const points = values
    .map((value, index) => {
      const x = values.length > 1 ? (index / (values.length - 1)) * 100 : 0
      const y = 52 - (value / 100) * 48
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className="simple-line-chart" viewBox="0 0 100 56" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2="100" y1="37.6" y2="37.6" className="chart-baseline" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Activity
  value: string
  label: string
}) {
  return (
    <div className="metric">
      <Icon size={17} aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export function HomeScreen() {
  const { dog, collar, readings, alerts, openAlert } = usePawBandStore()
  const current = readings.at(-1) ?? {
    stressIndex: 0,
    activity: 0,
    timestamp: new Date(),
    barking: false,
  }
  const state = collar.status === 'disconnected' ? 'alerta' : getDogState(current.stressIndex)
  const lastAlert = alerts[0]
  const lastSixHours = readings.slice(-24)

  return (
    <main className="main-screen home-screen">
      <div className="page-heading home-heading">
        <div>
          <p className="eyebrow">Ahora</p>
          <h1>
            {collar.status === 'disconnected'
              ? 'Collar sin conexión'
              : `${dog.name} está ${state === 'alerta' ? 'en alerta' : state}`}
          </h1>
        </div>
        <SeverityChip severity={state} />
      </div>

      <section className="hero-status">
        <StatusRing value={current.stressIndex} severity={state} label="índice de estrés" />
        <p>
          {state === 'tranquilo'
            ? `${dog.name} lleva 2 h 15 min tranquila`
            : state === 'inquieto'
              ? 'Actividad por encima de lo habitual'
              : 'Revisa la alerta más reciente'}
        </p>
      </section>

      <section className="metrics-row" aria-label="Resumen actual">
        <Metric icon={Activity} value={`${current.activity}%`} label="actividad" />
        <Metric icon={Clock3} value="4 h 32" label="sola hoy" />
        <Metric icon={BatteryMedium} value={`${collar.battery}%`} label="batería" />
      </section>

      <Card className="chart-card mini-chart-card">
        <div className="card-title-row">
          <div>
            <p className="section-title">Últimas 6 horas</p>
            <p className="microcopy">Actividad vs. línea habitual</p>
          </div>
          <span className="baseline-key">Base</span>
        </div>
        <div className="mini-chart">
          <SimpleLineChart values={lastSixHours.map((reading) => reading.activity)} />
        </div>
      </Card>

      {lastAlert ? (
        <button type="button" className="last-alert-card" onClick={() => openAlert(lastAlert.id)}>
          <span className={`alert-icon severity-${lastAlert.severity}`}>
            {(() => {
              const Icon = alertTypeConfig[lastAlert.type].icon
              return <Icon size={20} />
            })()}
          </span>
          <span>
            <small>Última alerta · {formatTime(lastAlert.start)}</small>
            <strong>{alertTypeConfig[lastAlert.type].title}</strong>
          </span>
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      ) : (
        <Card className="calm-empty">
          <Check size={22} />
          <div>
            <strong>Todo en calma.</strong>
            <span>No hay alertas.</span>
          </div>
        </Card>
      )}
    </main>
  )
}

function AlertRow({ alert }: { alert: PawAlert }) {
  const { openAlert, markAlertSeen } = usePawBandStore()
  const startX = useRef(0)
  const config = alertTypeConfig[alert.type]
  const Icon = config.icon

  return (
    <button
      type="button"
      className="alert-row"
      data-seen={alert.seen}
      onClick={() => openAlert(alert.id)}
      onTouchStart={(event) => {
        startX.current = event.touches[0].clientX
      }}
      onTouchEnd={(event) => {
        if (startX.current - event.changedTouches[0].clientX > 52) markAlertSeen(alert.id)
      }}
    >
      <span className={`alert-icon severity-${alert.severity}`}>
        <Icon size={20} />
      </span>
      <span className="alert-row-copy">
        <span className="alert-row-title">
          <strong>{config.title}</strong>
          {!alert.seen && <i aria-label="Sin ver" />}
        </span>
        <span>
          {formatTime(alert.start)}
          {alert.durationSec > 0 ? ` · ${formatDuration(alert.durationSec)}` : ''}
        </span>
      </span>
      <AlertChip severity={alert.severity} />
    </button>
  )
}

export function AlertsScreen() {
  const { alerts, alertFilter, setAlertFilter, settings } = usePawBandStore()
  const filtered = alerts.filter((alert) => {
    if (alertFilter === 'unseen') return !alert.seen
    if (alertFilter === 'critical') return alert.severity === 'critical'
    return true
  })

  return (
    <main className="main-screen">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Actividad atípica</p>
          <h1>Alertas</h1>
        </div>
        <span className="count-badge">{alerts.filter((alert) => !alert.seen).length} nuevas</span>
      </div>

      {settings.mutedUntil && settings.mutedUntil > new Date() && (
        <div className="inline-banner">
          <BellOff size={18} />
          <span>Silenciadas hasta las {formatTime(settings.mutedUntil)}</span>
        </div>
      )}

      <SegmentedControl
        label="Filtrar alertas"
        value={alertFilter}
        onChange={setAlertFilter}
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'unseen', label: 'Sin ver' },
          { value: 'critical', label: 'Críticas' },
        ]}
      />

      <section className="alerts-list" aria-live="polite">
        {filtered.length ? (
          filtered.map((alert) => <AlertRow key={alert.id} alert={alert} />)
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <Check size={28} />
            </span>
            <h2>Todo en calma.</h2>
            <p>No hay alertas en este filtro.</p>
          </div>
        )}
      </section>
      <p className="swipe-hint">Desliza una alerta a la izquierda para marcarla como vista.</p>
    </main>
  )
}

export function AlertDetailScreen() {
  const [moreOpen, setMoreOpen] = useState(false)
  const {
    alerts,
    readings,
    selectedAlertId,
    closeAlert,
    markAlertSeen,
    markFalsePositive,
    muteForHour,
    settings,
  } = usePawBandStore()
  const alert = alerts.find((item) => item.id === selectedAlertId)
  if (!alert) return null
  const config = alertTypeConfig[alert.type]
  const Icon = config.icon
  const eventData = chartData(readings.slice(-16)).map((item, index) => ({
    ...item,
    activity: index > 7 && index < 12 ? Math.min(96, item.activity + 45) : item.activity,
  }))

  return (
    <main className="main-screen detail-screen">
      <button type="button" className="back-button" onClick={closeAlert}>
        <ChevronLeft size={20} />
        Alertas
      </button>

      <section className="detail-title">
        <span className={`alert-icon large severity-${alert.severity}`}>
          <Icon size={26} />
        </span>
        <AlertChip severity={alert.severity} />
        <h1>{config.title}</h1>
        <p>{config.explanation}</p>
      </section>

      <div className="detail-facts">
        <span>
          <small>Inicio</small>
          <strong>{formatTime(alert.start)}</strong>
        </span>
        <span>
          <small>Duración</small>
          <strong>{formatDuration(alert.durationSec)}</strong>
        </span>
      </div>

      <Card className="chart-card detail-chart-card">
        <div className="card-title-row">
          <div>
            <p className="section-title">Ventana del evento</p>
            <p className="microcopy">Actividad sobre la línea base</p>
          </div>
        </div>
        <div className="detail-chart">
          <SimpleLineChart
            values={eventData.map((reading) => reading.activity)}
            color="#E5484D"
          />
        </div>
      </Card>

      <Card className="suggestion-card">
        <Sparkles size={19} />
        <p>{config.suggestion}</p>
      </Card>

      <section className="detail-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            markAlertSeen(alert.id)
            closeAlert()
          }}
        >
          <Eye size={18} /> Marcar como vista
        </button>
        <button type="button" className="secondary-button" onClick={() => setMoreOpen(true)}>
          <MoreHorizontal size={18} /> Más acciones
        </button>
      </section>

      <BottomSheet open={moreOpen} title="Más acciones" onClose={() => setMoreOpen(false)}>
        <div className="sheet-action-list">
          <button
            type="button"
            className="action-row"
            onClick={() => {
              markFalsePositive(alert.id)
              setMoreOpen(false)
            }}
          >
            <Info size={19} />
            <span>
              <strong>No fue importante</strong>
              <small>Ajusta ligeramente la sensibilidad</small>
            </span>
          </button>
          <button
            type="button"
            className="action-row"
            onClick={() => {
              muteForHour()
              setMoreOpen(false)
            }}
          >
            <BellOff size={19} />
            <span>
              <strong>Silenciar 1 h</strong>
              <small>Evita nuevas notificaciones por una hora</small>
            </span>
          </button>
          <button
            type="button"
            className="action-row"
            onClick={() =>
              window.alert(
                `Aviso preparado para ${settings.trustedContacts[0]?.name ?? 'tu contacto'}.`,
              )
            }
          >
            <MessageCircle size={19} />
            <span>
              <strong>Avisar a mi contacto</strong>
              <small>{settings.trustedContacts[0]?.name ?? 'Agrega un contacto en Ajustes'}</small>
            </span>
          </button>
        </div>
      </BottomSheet>
    </main>
  )
}
