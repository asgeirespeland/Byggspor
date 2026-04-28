import { NavLink } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/react'
import { LayoutDashboard, Building2, Settings } from 'lucide-react'
import { useAppContext } from '@/shared/hooks/useAppContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organization', label: 'Organisasjon', icon: Building2 },
  { to: '/settings', label: 'Innstillinger', icon: Settings },
]

export default function Sidebar() {
  const { user } = useUser()
  const { organizationId } = useAppContext()
  const visibleNavItems = navItems.filter(
    (item) => item.to !== '/organization' || organizationId != null,
  )

  return (
    <div className="relative z-50 shrink-0 w-16 sm:w-16 sm:hover:w-48 md:w-48 transition-all duration-200">
      <aside className="group absolute min-[380px]:static inset-y-0 left-0 z-50 flex h-screen w-16 hover:w-48 md:w-48 flex-col items-center border-r bg-white py-4 overflow-hidden transition-all duration-200 hover:shadow-lg min-[380px]:hover:shadow-none">
        {/* Nav items */}
        <nav className="flex flex-col gap-1 w-full px-2">
          {/* Logo — same layout as nav items */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-4">
            <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-violet-600 text-white text-[10px] font-bold">
              B
            </div>
            <span className="opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-bold text-gray-900">
              Byggspor
            </span>
          </div>
          {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
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
                  <span className="opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User */}
        <div className="w-full px-2">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <UserButton />
            <span className="opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium text-gray-700 truncate">
              {user?.firstName ?? ''}
            </span>
          </div>
        </div>
      </aside>
    </div>
  )
}
