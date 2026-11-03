import {
  AlertTriangle,
  Check,
  ChevronRight,
  Minus,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { severityLabel } from '../domain/presentation'
import type { AlertSeverity } from '../domain/models'
import type { Severity } from '../store/PawBandStore'

const severityConfig: Record<
  Severity,
  { label: string; icon: LucideIcon; chipClass: string; ringClass: string }
> = {
  tranquilo: {
    label: 'Tranquilo',
    icon: Check,
    chipClass: 'severity-calm',
    ringClass: 'ring-calm',
  },
  inquieto: {
    label: 'Inquieto',
    icon: Minus,
    chipClass: 'severity-restless',
    ringClass: 'ring-restless',
  },
  alerta: {
    label: 'Alerta',
    icon: AlertTriangle,
    chipClass: 'severity-alert',
    ringClass: 'ring-alert',
  },
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`card ${className}`}>{children}</div>
}

export function SeverityChip({ severity }: { severity: Severity }) {
  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <span className={`severity-chip ${config.chipClass}`}>
      <Icon aria-hidden="true" size={14} strokeWidth={2.5} />
      {config.label}
    </span>
  )
}

export function AlertChip({ severity }: { severity: AlertSeverity }) {
  return (
    <span className={`severity-chip alert-chip-${severity}`}>
      <span className="chip-dot" aria-hidden="true" />
      {severityLabel[severity]}
    </span>
  )
}

export function StatusRing({
  value,
  severity,
  label = 'Nivel de estrés',
}: {
  value: number
  severity: Severity
  label?: string
}) {
  const config = severityConfig[severity]
  const progress = Math.max(0, Math.min(value, 100))

  return (
    <div
      className={`status-ring ${config.ringClass} ${severity === 'alerta' ? 'is-alert' : ''}`}
      role="img"
      aria-label={`${label}: ${progress} de 100, ${config.label}`}
    >
      <svg viewBox="0 0 152 152" aria-hidden="true">
        <circle className="ring-track" cx="76" cy="76" r="66" />
        <circle
          className="ring-progress"
          cx="76"
          cy="76"
          r="66"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - progress}
        />
      </svg>
      <div className="ring-content">
        <strong>{progress}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}) {
  const progress = ((value - min) / (max - min)) * 100

  return (
    <label className="control-stack">
      <span className="control-heading">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        value={value}
        style={{ '--slider-progress': `${progress}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="toggle-row">
      <div>
        <p className="item-title">{label}</p>
        {description && <p className="item-description">{description}</p>}
      </div>
      <button
        className="toggle"
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  )
}

export function ListItem({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon
  title: string
  description?: string
  onClick?: () => void
}) {
  return (
    <button className="list-item" type="button" onClick={onClick}>
      <span className="list-icon">
        <Icon aria-hidden="true" size={20} />
      </span>
      <span className="list-copy">
        <span className="item-title">{title}</span>
        {description && <span className="item-description">{description}</span>}
      </span>
      <ChevronRight className="list-chevron" aria-hidden="true" size={20} />
    </button>
  )
}

export function BottomSheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2 id="sheet-title">{title}</h2>
          <button className="icon-button" type="button" aria-label="Cerrar" onClick={onClose}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
