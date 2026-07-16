import { useState } from 'react'
import { Building2 } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy-deep px-4 py-10 relative overflow-hidden">
      {/* Subtle decorative arcs, evoking the university seal, kept behind all content */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[16px] border-gold" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full border-[16px] border-gold" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center mb-4 shadow-raised" aria-hidden="true">
          <Building2 className="w-7 h-7 text-navy-deep" strokeWidth={2.25} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-white">Venue &amp; Event Portal</h1>
        <p className="text-gold text-sm font-medium mt-1">Saint Mary&apos;s University</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm bg-card border border-line rounded-2xl p-7 flex flex-col gap-4 shadow-raised"
        aria-describedby={error ? 'auth-error' : undefined}
      >
        <h2 className="text-sm font-semibold text-ink -mb-1">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </h2>

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
            className="field-input"
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
            className="field-input"
          />
        </div>

        {error && (
          <p id="auth-error" role="alert" className="text-sm bg-rose-soft text-rose rounded-lg px-3.5 py-2.5">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-xs text-muted underline underline-offset-2 self-center hover:text-navy"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>

        <p className="text-[11px] text-muted text-center leading-relaxed">
          Your role (student leader, department head, school admin, or facilities) is assigned
          automatically from your university email — there&apos;s nothing to select.
        </p>
      </form>

      <div className="relative w-full max-w-sm mt-4 bg-card border border-line rounded-2xl p-5 shadow-card">
        <div className="text-xs font-semibold text-ink mb-1">Just want to look around?</div>
        <p className="text-xs text-muted mb-3">
          Try the demo — no account needed. Sample data only; nothing here is saved or sent anywhere.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => enterDemo(r)}
              className="text-xs font-semibold border border-line rounded-lg px-3 py-2.5 hover:bg-navy-light hover:border-navy/30 text-left transition-colors"
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
