import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './AppShell'
import { AuthLayout, ProtectedRoute } from '../features/auth'
import { InvoiceUpload } from '../features/invoice'
import { OrgSettings } from '../features/organization'
import { TransportUpload } from '../features/transport'
import { UserProfile } from '../features/user'
import GlobalDashboard from '@/features/dashboard/components/GlobalDashboard'
import OnboardingPage from '@/features/onboarding/components/OnboardingPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<AuthLayout />} />
      <Route path="/sign-up/*" element={<AuthLayout />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<AppShell />}>
          <Route index element={<GlobalDashboard />} />
          <Route path="projects/:projectId" element={<InvoiceUpload />} />
          <Route path="transport" element={<TransportUpload />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="organization" element={<OrgSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
