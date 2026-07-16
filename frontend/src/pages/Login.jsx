import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS } from '../lib/roles'

const DEMO_ROLES = ['student', 'dept_head', 'school_admin', 'facilities']

export default function Login() {
  const { enterDemo } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { error } =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password })
      // On signup, the database trigger matches this email against
      // email_role_policies and assigns the role — there is no role
      // field on this form for the person to fill in or tamper with.
      if (error) setError(error.message)
    } catch (err) {
      console.error('Auth request failed:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ledger px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card border border-line rounded-xl p-7 flex flex-col gap-4"
        aria-describedby={error ? 'auth-error' : undefined}
      >
        <div>
          <h1 className="font-display text-2xl font-semibold">Venue &amp; Event Portal</h1>
          <p className="text-muted text-sm mt-1">Saint Mary&apos;s University</p>
        </div>

        <div>
          <label htmlFor="email" className="text-xs font-semibold text-muted block mb-1">
            University email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-xs font-semibold text-muted block mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p id="auth-error" role="alert" className="text-sm bg-clay-soft text-clay rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="bg-forest hover:bg-forest-deep text-white font-semibold text-sm rounded-md py-2.5 disabled:opacity-60"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-xs text-muted underline underline-offset-2 self-center"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>

        <p className="text-[11px] text-muted text-center leading-relaxed">
          Your role (student leader, department head, school admin, or facilities) is assigned
          automatically from your university email — there's nothing to select.
        </p>
      </form>

      <div className="w-full max-w-sm mt-4 bg-card border border-line rounded-xl p-5">
        <div className="text-xs font-semibold text-muted mb-1">Just want to look around?</div>
        <p className="text-xs text-muted mb-3">
          Try the demo — no account needed. Sample data only; nothing here is saved or sent anywhere.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => enterDemo(r)}
              className="text-xs font-semibold border border-line rounded-md px-3 py-2 hover:bg-ledger text-left"
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
