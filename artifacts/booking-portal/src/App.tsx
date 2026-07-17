import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitProposal from './pages/SubmitProposal';
import ApprovalQueue from './pages/ApprovalQueue';
import Venues from './pages/Venues';
import VenueCalendar from './pages/VenueCalendar';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

function Shell() {
  const { session, role, loading, isDemo } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1C' }} aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9981F, #E8AE23)' }}
            aria-hidden="true"
          >
            <svg className="w-6 h-6 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-gold/30 border-t-gold animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold text-white/40 tracking-wide">Loading…</span>
        </div>
      </div>
    );
  }

  if (!session && !isDemo) return <Login />;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Sidebar />
      <main
        id="main"
        tabIndex={-1}
        className="flex-1 min-w-0 overflow-auto"
        style={{ background: '#F2F5FB' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/calendar" element={<VenueCalendar />} />
            <Route path="/notifications" element={<Notifications />} />
            {role === 'student' && <Route path="/submit" element={<SubmitProposal />} />}
            {role !== 'student' && <Route path="/queue" element={<ApprovalQueue />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
