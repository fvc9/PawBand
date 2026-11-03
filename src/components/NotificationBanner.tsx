import { Bell, X } from 'lucide-react'
import { alertTypeConfig, notificationText } from '../domain/presentation'
import { usePawBandStore } from '../store/PawBandStore'

export function NotificationBanner() {
  const { notification, dog, clearNotification, openAlert } = usePawBandStore()
  if (!notification) return null
  const config = alertTypeConfig[notification.type]

  return (
    <div className="notification-banner" role="status">
      <button
        type="button"
        className="notification-content"
        onClick={() => {
          openAlert(notification.id)
          clearNotification()
        }}
      >
        <span className="notification-app-icon">
          <Bell size={17} />
        </span>
        <span>
          <small>PawBand · ahora</small>
          <strong>{notificationText(notification, dog.name)}</strong>
          <em>{config.title}</em>
        </span>
      </button>
      <button
        type="button"
        className="notification-close"
        aria-label="Cerrar notificación"
        onClick={clearNotification}
      >
        <X size={17} />
      </button>
    </div>
  )
}
