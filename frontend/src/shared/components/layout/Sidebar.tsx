import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/react'
import {
  LayoutDashboard,
  Building2,
  Settings,
  BookOpen,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { articleDefs } from '@/pages/information/articles/articleDefs'

const topNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/organization', label: 'Organisasjon', icon: Building2 },
]

const bottomNavItems = [
  { to: '/settings', label: 'Innstillinger', icon: Settings },
]

export default function Sidebar() {
  const { user } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const onWiki = location.pathname.startsWith('/wiki')
  const [manualOverride, setManualOverride] = useState<boolean | null>(null)
  const wikiOpen = manualOverride ?? onWiki

  function toggleWiki() {
    if (!wikiOpen) navigate('/wiki/intro')
    setManualOverride(!(manualOverride ?? onWiki))
  }

  return (
    <div className="relative z-50 shrink-0 hidden md:block w-16 md:w-16 md:hover:w-48 lg:w-48 transition-all duration-200">
      <aside className="group absolute md:static inset-y-0 left-0 z-50 flex h-screen w-16 hover:w-48 lg:w-48 flex-col items-center border-r bg-card py-4 overflow-hidden transition-all duration-200 hover:shadow-lg md:hover:shadow-none">
        <nav className="flex flex-col gap-1 w-full px-2">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-4">
            <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-violet-600 text-white text-[10px] font-bold">
              B
            </div>
            <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-bold text-foreground">
              Byggspor
            </span>
          </div>

          {topNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-violet-600' : 'text-muted-foreground',
                    )}
                  />
                  <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Wiki collapsible section */}
          <button
            type="button"
            onClick={toggleWiki}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full text-left cursor-pointer',
              onWiki
                ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <BookOpen
              size={18}
              className={cn(
                'shrink-0',
                onWiki ? 'text-violet-600' : 'text-muted-foreground',
              )}
            />
            <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap flex-1">
              Wiki
            </span>
            <ChevronDown
              size={14}
              className={cn(
                'opacity-0 lg:opacity-100 group-hover:opacity-100 transition-all duration-200 shrink-0',
                wikiOpen ? 'rotate-180' : '',
              )}
            />
          </button>

          {wikiOpen && (
            <div className="flex flex-col gap-0.5 pl-3">
              {articleDefs.map((def) => (
                <NavLink
                  key={def.id}
                  to={`/wiki/${def.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'shrink-0',
                          isActive
                            ? 'text-violet-600'
                            : 'text-muted-foreground',
                        )}
                      >
                        {def.icon}
                      </span>
                      <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity duration-200 leading-tight">
                        {def.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          {bottomNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-violet-600' : 'text-muted-foreground',
                    )}
                  />
                  <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="w-full px-2">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <UserButton />
            <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium text-muted-foreground truncate">
              {user?.firstName ?? ''}
            </span>
          </div>
        </div>
      </aside>
    </div>
  )
}

export function BottomNav() {
  const allItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/organization', label: 'Organisasjon', icon: Building2 },
    { to: '/wiki/intro', label: 'Wiki', icon: BookOpen, matchPrefix: '/wiki' },
    { to: '/settings', label: 'Innstillinger', icon: Settings },
  ]
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-card md:hidden">
      {allItems.map(({ to, label, icon: Icon, end, matchPrefix }) => {
        const isActive = matchPrefix
          ? location.pathname.startsWith(matchPrefix)
          : end
            ? location.pathname === to
            : location.pathname.startsWith(to)

        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              isActive
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-muted-foreground',
            )}
          >
            <Icon
              size={20}
              className={cn(
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-muted-foreground',
              )}
            />
            {label}
          </NavLink>
        )
      })}
      <div className="flex flex-1 flex-col items-center justify-center py-3">
        <UserButton />
      </div>
    </nav>
  )
}
