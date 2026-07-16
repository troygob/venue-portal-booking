import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SubmitProposal from './pages/SubmitProposal'
import ApprovalQueue from './pages/ApprovalQueue'
import Venues from './pages/Venues'
import Notifications from './pages/Notifications'

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}

function Shell() {
  const { session, role, loading, isDemo } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted" aria-live="polite">Loading…</div>
  }
  if (!session && !isDemo) return <Login />

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Sidebar />
      <main id="main" className="flex-1 p-8 max-w-5xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/notifications" element={<Notifications />} />
          {role === 'student' && <Route path="/submit" element={<SubmitProposal />} />}
          {role !== 'student' && <Route path="/queue" element={<ApprovalQueue />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
