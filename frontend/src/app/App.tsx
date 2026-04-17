/**
 * Root application component.
 * Wires the global provider tree: Clerk auth, React Query, BrowserRouter,
 * Tooltip, and the Sonner toast container. Renders AppRoutes inside them.
 *
 * Exports: default App.
 * Coupling: reads VITE_CLERK_PUBLISHABLE_KEY; depends on shared/api/queryClient
 * and app/routes.
 */
import { ClerkProvider } from '@clerk/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/shared/api/queryClient'
import AppRoutes from './routes'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in frontend env')
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
