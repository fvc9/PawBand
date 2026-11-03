import { Bell, ChartNoAxesColumnIncreasing, House, Settings2 } from 'lucide-react'
import { usePawBandStore, type TabId } from '../store/PawBandStore'

const tabs = [
  { id: 'inicio', label: 'Inicio', icon: House },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'tendencias', label: 'Tendencias', icon: ChartNoAxesColumnIncreasing },
  { id: 'ajustes', label: 'Ajustes', icon: Settings2 },
] satisfies Array<{ id: TabId; label: string; icon: typeof House }>

export function BottomNav() {
  const { activeTab, setActiveTab } = usePawBandStore()

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id

        return (
          <button
            key={id}
            type="button"
            className="nav-item"
            data-active={active}
            aria-current={active ? 'page' : undefined}
            onClick={() => setActiveTab(id)}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
