import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import PageTransition from './components/PageTransition';
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
      <div
        className="min-h-screen flex items-center justify-center flex-col gap-5 anim-fade-in"
        style={{ background: '#07090F' }}
        aria-live="polite"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#C8961A,#E4AA20)', boxShadow: '0 0 32px rgba(200,150,26,0.35)' }}
          aria-hidden="true"
        >
          <Building2SVG />
        </div>
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(200,150,26,0.25)', borderTopColor: '#C8961A' }}
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!session && !isDemo) return <Login />;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Sidebar />
      <main id="main" tabIndex={-1} className="flex-1 min-w-0 overflow-auto" style={{ background: '#F5F4F1' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          <PageTransition>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/calendar" element={<VenueCalendar />} />
              <Route path="/notifications" element={<Notifications />} />
              {role === 'student' && <Route path="/submit" element={<SubmitProposal />} />}
              {role !== 'student' && <Route path="/queue" element={<ApprovalQueue />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

function Building2SVG() {
  return (
    <svg width="22" height="22" fill="none" stroke="#07090F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}
