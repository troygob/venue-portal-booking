import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  DEMO_PROFILES,
  DEMO_VENUES,
  INITIAL_DEMO_PROPOSALS,
  INITIAL_DEMO_NOTIFICATIONS,
} from '../lib/demoData';

interface AuthContextValue {
  session: any;
  profile: any;
  role: string | null;
  loading: boolean;
  signOut: () => void;
  isDemo: boolean;
  enterDemo: (role: string) => void;
  switchDemoRole: (role: string) => void;
  exitDemo: () => void;
  demoVenues: any[];
  setDemoVenues: React.Dispatch<React.SetStateAction<any[]>>;
  demoProposals: any[];
  setDemoProposals: React.Dispatch<React.SetStateAction<any[]>>;
  demoNotifications: any[];
  setDemoNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Demo mode state — shared across role switches so data stays consistent.
  const [demoRole, setDemoRole] = useState<string | null>(null);
  const [demoVenues, setDemoVenues] = useState<any[]>(DEMO_VENUES);
  const [demoProposals, setDemoProposals] = useState<any[]>(INITIAL_DEMO_PROPOSALS);
  const [demoNotifications, setDemoNotifications] = useState<any[]>(INITIAL_DEMO_NOTIFICATIONS);
  const isDemo = demoRole !== null;

  function enterDemo(role: string) {
    setDemoVenues(DEMO_VENUES);
    setDemoProposals(INITIAL_DEMO_PROPOSALS);
    setDemoNotifications(INITIAL_DEMO_NOTIFICATIONS);
    setDemoRole(role);
  }
  function switchDemoRole(role: string) {
    setDemoRole(role);
  }
  function exitDemo() {
    setDemoRole(null);
  }

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }

  useEffect(() => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) setLoading(false);
    }, 8000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }: any) => {
        setSession(session);
        if (session) await loadProfile(session.user.id);
      })
      .catch(() => {})
      .finally(() => {
        settled = true;
        clearTimeout(timeoutId);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        setSession(session);
        if (session) await loadProfile(session.user.id);
        else setProfile(null);
      }
    );
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const value: AuthContextValue = {
    session,
    profile: isDemo ? DEMO_PROFILES[demoRole!] : profile,
    role: isDemo ? demoRole : profile?.role ?? null,
    loading,
    signOut: () => (isDemo ? exitDemo() : supabase.auth.signOut()),
    isDemo,
    enterDemo,
    switchDemoRole,
    exitDemo,
    demoVenues,
    setDemoVenues,
    demoProposals,
    setDemoProposals,
    demoNotifications,
    setDemoNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
