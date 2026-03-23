import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Sidebar from '@/shared/components/layout/Sidebar'
import { AuthLayout, ProtectedRoute } from '../features/auth'
import { OrgSettings } from '../features/organization'
import { UserProfile } from '../features/user'
import GlobalDashboard from '@/features/dashboard/components/GlobalDashboard'
import OnboardingPage from '@/features/onboarding/components/OnboardingPage'
import ProjectDashboard from '@/features/dashboard/components/ProjectDashboard'
import SettingsPage from '@/features/settings/components/SettingsPage'

function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<AuthLayout />} />
      <Route path="/sign-up/*" element={<AuthLayout />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<AppShell />}>
          <Route index element={<GlobalDashboard />} />
          <Route path="projects/:projectId" element={<ProjectDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="organization" element={<OrgSettings />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
