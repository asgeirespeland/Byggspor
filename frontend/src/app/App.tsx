import { AuthProvider } from '../shared/auth/AuthProvider'
import AppShell from './AppShell'

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

export default App
