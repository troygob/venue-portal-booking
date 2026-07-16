import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SubmitProposal from './pages/SubmitProposal'
import ApprovalQueue from './pages/ApprovalQueue'
import Venues from './pages/Venues'
import VenueCalendar from './pages/VenueCalendar'
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
    return (
      <div className="min-h-screen flex items-center justify-center text-muted gap-2" aria-live="polite">
        <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Loading…
      </div>
    )
  }
  if (!session && !isDemo) return <Login />

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Sidebar />
      <main id="main" tabIndex={-1} className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/calendar" element={<VenueCalendar />} />
          <Route path="/notifications" element={<Notifications />} />
          {role === 'student' && <Route path="/submit" element={<SubmitProposal />} />}
          {role !== 'student' && <Route path="/queue" element={<ApprovalQueue />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
