import { Outlet } from 'react-router-dom'
import Sidebar from '@/shared/components/layout/Sidebar'

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
