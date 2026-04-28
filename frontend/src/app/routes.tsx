/**
 * Top-level React Router route tree.
 * Public routes (/sign-in, /sign-up) render AuthLayout; everything else is
 * wrapped in ProtectedRoute. Signed-in routes render inside AppShell
 * (Sidebar + scrolling main area). Unknown paths redirect to "/".
 *
 * Exports: default AppRoutes. Also declares the local AppShell layout.
 * Coupling: imports every top-level page module and the auth wrappers.
 */
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Sidebar, { BottomNav } from '@/shared/components/layout/Sidebar'
import AuthLayout from './auth/AuthLayout'
import ProtectedRoute from './auth/ProtectedRoute'
import OrgSettings from '@/pages/organization/OrgSettings'
import UserProfile from '@/pages/profile/UserProfile'
import GlobalDashboard from '@/pages/global-dashboard/GlobalDashboard'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import ProjectDashboard from '@/pages/project-dashboard/ProjectDashboard'
import SettingsPage from '@/pages/settings/SettingsPage'

function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto scrollbar-hide p-6 pb-20 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
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
