import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  DEMO_PROFILES,
  DEMO_VENUES,
  INITIAL_DEMO_PROPOSALS,
  INITIAL_DEMO_NOTIFICATIONS,
} from '../lib/demoData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ---- Demo mode state -------------------------------------------------
  // Demo mode never touches Supabase or the backend. All "data" lives here
  // in memory for the duration of the session, shared across whichever
  // demo role you're currently viewing as — so switching roles mid-demo
  // shows a consistent, connected picture (e.g. submit as the demo student,
  // then switch to Department Head and see it waiting in the queue).
  const [demoRole, setDemoRole] = useState(null)
  const [demoVenues, setDemoVenues] = useState(DEMO_VENUES)
  const [demoProposals, setDemoProposals] = useState(INITIAL_DEMO_PROPOSALS)
  const [demoNotifications, setDemoNotifications] = useState(INITIAL_DEMO_NOTIFICATIONS)
  const isDemo = demoRole !== null

  function enterDemo(role) {
    // Fresh sample data every time you start a new demo session.
    setDemoVenues(DEMO_VENUES)
    setDemoProposals(INITIAL_DEMO_PROPOSALS)
    setDemoNotifications(INITIAL_DEMO_NOTIFICATIONS)
    setDemoRole(role)
  }
  function switchDemoRole(role) {
    // Change perspective without resetting the shared demo data.
    setDemoRole(role)
  }
  function exitDemo() {
    setDemoRole(null)
  }

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session)
        if (session) await loadProfile(session.user.id)
      })
      .catch((err) => {
        console.error('Failed to load Supabase session — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY:', err)
      })
      .finally(() => setLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) await loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Role always comes from the `profiles` row written server-side at
  // signup (see the Supabase trigger) — never from anything the client
  // sets — UNLESS we're in demo mode, where there's no real account at all.
  const value = {
    session,
    profile: isDemo ? DEMO_PROFILES[demoRole] : profile,
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
