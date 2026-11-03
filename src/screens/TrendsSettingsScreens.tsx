import {
  BatteryMedium,
  Bell,
  BellRing,
  Bluetooth,
  ChevronLeft,
  Clock3,
  Contact,
  Dog,
  Info,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Unlink,
  Vibrate,
  Volume2,
  Wifi,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, ListItem, SegmentedControl, Slider, Toggle } from '../components/ui'
import { formatTime } from '../domain/presentation'
import type { Sensitivity } from '../domain/models'
import { usePawBandStore } from '../store/PawBandStore'

const sensitivityValue: Record<Sensitivity, number> = { low: 20, medium: 50, high: 80 }

export function TrendsScreen() {
  const { readings, trendRange, setTrendRange } = usePawBandStore()
  const source = trendRange === 'today' ? readings.slice(-96) : readings
  const bucketSize = trendRange === 'today' ? 4 : 12
  const data = source
    .filter((_, index) => index % bucketSize === 0)
    .map((reading) => ({
      time:
        trendRange === 'today'
          ? formatTime(reading.timestamp)
          : new Intl.DateTimeFormat('es-PE', { weekday: 'short' }).format(reading.timestamp),
      activity: reading.activity,
      stress: reading.stressIndex,
    }))
  const peaks = data.filter((item) => item.stress > 65)
  const restless = data.reduce((max, item) => (item.stress > max.stress ? item : max), data[0])

  return (
    <main className="main-screen trends-screen">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Patrones</p>
          <h1>Tendencias</h1>
        </div>
      </div>

      <SegmentedControl
        label="Rango de tendencias"
        value={trendRange}
        onChange={setTrendRange}
        options={[
          { value: 'today', label: 'Hoy' },
          { value: 'week', label: 'Semana' },
        ]}
      />

      <section className="trend-summary">
        <strong>{peaks.length || 2}</strong>
        <span>picos de estrés</span>
        <p>Hoy hubo {peaks.length || 2} picos, principalmente entre 1 y 3 pm.</p>
      </section>

      <Card className="chart-card trend-chart-card">
        <div className="chart-legend">
          <span className="legend-activity">Actividad</span>
          <span className="legend-stress">Estrés</span>
        </div>
        <div className="trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 14, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF0F2" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="activity"
                stroke="#3FA796"
                strokeWidth={2}
                dot={false}
              />
              <Line type="monotone" dataKey="stress" stroke="#2F5BFF" strokeWidth={2} dot={false} />
              {peaks.slice(0, 3).map((peak, index) => (
                <ReferenceDot
                  key={`${peak.time}-${index}`}
                  x={peak.time}
                  y={peak.stress}
                  r={4}
                  fill="#E5484D"
                  stroke="#FFFFFF"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="restless-card">
        <Clock3 size={21} />
        <div>
          <span>Hora más inquieta</span>
          <strong>{restless?.time ?? '2:00 pm'}</strong>
        </div>
        <small>Estrés {restless?.stress ?? 72}</small>
      </Card>
    </main>
  )
}

export function SettingsScreen() {
  const { settingsPage, setSettingsPage, collar, dog } = usePawBandStore()

  if (settingsPage === 'alerts') return <AlertSettings />
  if (settingsPage === 'collar') return <CollarSettings />
  if (settingsPage === 'notifications') return <NotificationShowcase />

  return (
    <main className="main-screen settings-screen">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PawBand</p>
          <h1>Ajustes</h1>
        </div>
      </div>

      <Card className="profile-card">
        <span className="dog-avatar">
          <Dog size={26} />
        </span>
        <div>
          <strong>{dog.name}</strong>
          <span>{dog.breed} · Mediana</span>
        </div>
        <span className="collar-online">
          <i /> {collar.battery}%
        </span>
      </Card>

      <section className="settings-group">
        <p className="group-label">Preferencias</p>
        <Card className="list-card">
          <ListItem
            icon={BellRing}
            title="Alertas"
            description="Sensibilidad, horarios y canales"
            onClick={() => setSettingsPage('alerts')}
          />
          <div className="list-divider" />
          <ListItem
            icon={Dog}
            title="Collar y Luna"
            description="Batería, sincronización y firmware"
            onClick={() => setSettingsPage('collar')}
          />
          <div className="list-divider" />
          <ListItem
            icon={Smartphone}
            title="Vista de notificaciones"
            description="Push, banners y agrupación"
            onClick={() => setSettingsPage('notifications')}
          />
        </Card>
      </section>

      <div className="privacy-note">
        <ShieldCheck size={18} />
        <p>
          Tus datos se guardan en este dispositivo. PawBand no usa cámara ni graba audio.
        </p>
      </div>
    </main>
  )
}

function SettingsHeader({ title }: { title: string }) {
  const { setSettingsPage } = usePawBandStore()
  return (
    <div className="subpage-header">
      <button type="button" className="back-button" onClick={() => setSettingsPage('main')}>
        <ChevronLeft size={20} /> Ajustes
      </button>
      <h1>{title}</h1>
    </div>
  )
}

function AlertSettings() {
  const { settings, updateSettings } = usePawBandStore()
  const set = (patch: Partial<typeof settings>) =>
    updateSettings((current) => ({ ...current, ...patch }))

  return (
    <main className="main-screen settings-subpage">
      <SettingsHeader title="Alertas" />

      <Card className="settings-card">
        <Slider
          label="Sensibilidad"
          value={sensitivityValue[settings.sensitivity]}
          min={0}
          max={100}
          onChange={(value) =>
            set({ sensitivity: value < 34 ? 'low' : value > 66 ? 'high' : 'medium' })
          }
        />
        <div className="slider-labels">
          <span>Baja</span>
          <span>Media</span>
          <span>Alta</span>
        </div>
      </Card>

      <section className="settings-group">
        <p className="group-label">Detección</p>
        <Card className="settings-card">
          <label className="select-row">
            <span>
              <strong>Ladridos persistentes</strong>
              <small>Alertar después de</small>
            </span>
            <select
              value={settings.barkPersistSec}
              onChange={(event) => set({ barkPersistSec: Number(event.target.value) })}
            >
              <option value={30}>30 s</option>
              <option value={60}>1 min</option>
              <option value={120}>2 min</option>
              <option value={300}>5 min</option>
            </select>
          </label>
          <div className="divider compact" />
          <label className="select-row">
            <span>
              <strong>Movimiento inusual</strong>
              <small>Sobre la línea base</small>
            </span>
            <select
              value={settings.movementFactor}
              onChange={(event) => set({ movementFactor: Number(event.target.value) })}
            >
              <option value={1.5}>1.5×</option>
              <option value={2}>2×</option>
              <option value={3}>3×</option>
            </select>
          </label>
        </Card>
      </section>

      <section className="settings-group">
        <p className="group-label">Modo ausencia</p>
        <Card className="settings-card">
          <Toggle
            label="Activar manualmente"
            description="Luna está sola ahora"
            checked={settings.absenceSchedule.manual}
            onChange={(manual) =>
              set({ absenceSchedule: { ...settings.absenceSchedule, manual } })
            }
          />
          <div className="divider compact" />
          <Toggle
            label="Horario automático"
            description="Lun–vie · 8:00 a 18:00"
            checked={settings.absenceSchedule.enabled}
            onChange={(enabled) =>
              set({ absenceSchedule: { ...settings.absenceSchedule, enabled } })
            }
          />
        </Card>
      </section>

      <section className="settings-group">
        <p className="group-label">Canales y silencio</p>
        <Card className="settings-card stack-card">
          <Toggle label="Push" checked={settings.push} onChange={(push) => set({ push })} />
          <Toggle label="Sonido" checked={settings.sound} onChange={(sound) => set({ sound })} />
          <Toggle
            label="Vibración"
            checked={settings.vibration}
            onChange={(vibration) => set({ vibration })}
          />
          <Toggle
            label="Horas de silencio"
            description={`${settings.quietHours.start} a ${settings.quietHours.end}`}
            checked={settings.quietHours.enabled}
            onChange={(enabled) =>
              set({ quietHours: { ...settings.quietHours, enabled } })
            }
          />
        </Card>
      </section>

      <section className="settings-group">
        <p className="group-label">Contacto de confianza</p>
        <Card className="contact-card">
          <span className="contact-avatar">
            <Contact size={20} />
          </span>
          <div>
            <strong>{settings.trustedContacts[0]?.name}</strong>
            <span>{settings.trustedContacts[0]?.phone}</span>
          </div>
        </Card>
      </section>
    </main>
  )
}

function CollarSettings() {
  const { collar, dog, recalibrate, unlinkCollar } = usePawBandStore()
  return (
    <main className="main-screen settings-subpage">
      <SettingsHeader title="Collar y perro" />

      <Card className="collar-hero">
        <span className="collar-illustration">
          <Wifi size={28} />
        </span>
        <div>
          <strong>PawBand 024</strong>
          <span className="connected-label">
            <i /> Conectado
          </span>
        </div>
        <b>{collar.battery}%</b>
      </Card>

      <Card className="info-list">
        <div>
          <span>Perro</span>
          <strong>{dog.name} · {dog.breed}</strong>
        </div>
        <div>
          <span>Última sincronización</span>
          <strong>Ahora · {formatTime(collar.lastSync)}</strong>
        </div>
        <div>
          <span>Firmware</span>
          <strong>{collar.firmware}</strong>
        </div>
      </Card>

      <button type="button" className="secondary-button wide-button" onClick={recalibrate}>
        <RefreshCw size={18} /> Recalibrar
      </button>
      <button type="button" className="danger-text-button" onClick={unlinkCollar}>
        <Unlink size={18} /> Desvincular collar
      </button>
    </main>
  )
}

function NotificationShowcase() {
  return (
    <main className="main-screen settings-subpage">
      <SettingsHeader title="Notificaciones" />
      <p className="subpage-copy">Mensajes breves, solo cuando algo cambia.</p>

      <div className="lock-screen-mock">
        <div className="mock-status">
          <span>9:41</span>
          <span>
            <Wifi size={13} /> <BatteryMedium size={15} />
          </span>
        </div>
        <div className="mock-time">
          <strong>2:14</strong>
          <span>Martes, 18 de junio</span>
        </div>
        <div className="push-card">
          <div className="push-app">
            <span><Bell size={13} /></span>
            PAWBAND <small>ahora</small>
          </div>
          <strong>Luna lleva 2 min ladrando</strong>
          <p>Actividad atípica detectada. Toca para ver.</p>
        </div>
        <div className="push-card grouped">
          <div className="push-app">
            <span><Bell size={13} /></span>
            PAWBAND <small>2 alertas más</small>
          </div>
          <p>Las alertas similares se agrupan para evitar ruido.</p>
        </div>
      </div>

      <div className="inline-banner showcase-banner">
        <Info size={18} />
        <span>Dentro de la app, la alerta aparece arriba y desaparece sola.</span>
      </div>
    </main>
  )
}
