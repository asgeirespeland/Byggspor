import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organization', label: 'Organisasjon', icon: Building2 },
  { to: '/settings', label: 'Innstillinger', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-48 flex-col items-center border-r bg-white py-4">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center w-full px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white text-sm font-bold">
          B
        </div>
        <span className="ml-3 text-sm font-bold text-gray-900 whitespace-nowrap">
          Byggspor
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 w-full px-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={cn(
                    'shrink-0',
                    isActive ? 'text-violet-600' : 'text-gray-400',
                  )}
                />
                <span className="whitespace-nowrap">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
