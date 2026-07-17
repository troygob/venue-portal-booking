import { useState } from 'react';
import { Building2, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/roles';

const DEMO_ROLES = ['student', 'dept_head', 'school_admin', 'facilities'];

const ROLE_META: Record<string, { color: string; label: string; subtitle: string }> = {
  student:      { color: '#22C55E', label: 'Student Leader',    subtitle: 'Submit & track proposals' },
  dept_head:    { color: '#3B82F6', label: 'Department Head',   subtitle: 'Review & approve events' },
  school_admin: { color: '#A855F7', label: 'School Admin',      subtitle: 'System-wide oversight' },
  facilities:   { color: '#F97316', label: 'Facilities Manager', subtitle: 'Venue confirmations' },
};

export default function Login() {
  const { enterDemo } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error } =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (error) setError((error as any).message);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#0A0F1C' }}
    >
      {/* Left panel — hero */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0F2755 0%, #091F3A 50%, #0A0F1C 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Decorative arcs */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ border: '60px solid #C9981F' }} aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ border: '80px solid #C9981F' }} aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #C9981F 0%, #E8AE23 100%)' }}
            >
              <Building2 className="w-5 h-5 text-ink" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Venue &amp; Event Portal</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#C9981F' }}>
                Saint Mary&apos;s University
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white mb-6">
            From proposal<br />
            to <span style={{ color: '#C9981F' }}>confirmation</span>,<br />
            in one place.
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Four roles. One workflow. Submit, review, approve, and confirm campus events with full traceability.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-2.5">
          {DEMO_ROLES.map((r) => (
            <div key={r} className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ROLE_META[r].color }} aria-hidden="true" />
              <span className="text-[13px] font-semibold text-white/60">{ROLE_META[r].label}</span>
              <span className="text-[12px] text-white/30">— {ROLE_META[r].subtitle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9981F 0%, #E8AE23 100%)' }}>
            <Building2 className="w-4.5 h-4.5 text-ink" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">Venue &amp; Event Portal</div>
            <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#C9981F' }}>SMU Philippines</div>
          </div>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Sign-in card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
            <div className="p-7">
              <h2 className="font-display text-2xl font-bold text-ink tracking-tight mb-1">
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-muted mb-6">
                {mode === 'signin'
                  ? 'Sign in with your university email address.'
                  : 'Use your university email to register.'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-describedby={error ? 'auth-error' : undefined}>
                <div>
                  <label htmlFor="email" className="block text-[12px] font-bold tracking-wide uppercase text-muted mb-1.5">
                    University email
                  </label>
                  <input
                    id="email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@students.smu.edu.ph"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-[12px] font-bold tracking-wide uppercase text-muted mb-1.5">
                    Password
                  </label>
                  <input
                    id="password" type="password" required minLength={8}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="field-input"
                  />
                </div>

                {error && (
                  <p id="auth-error" role="alert" className="text-[13px] font-semibold rounded-xl px-4 py-3" style={{ background: '#FDEAEE', color: '#C0334F' }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={busy} className="btn-primary w-full mt-1">
                  {busy ? 'Please wait…' : (
                    <>
                      {mode === 'signin' ? 'Sign in' : 'Create account'}
                      <ArrowRight className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-[13px] font-semibold text-navy text-center hover:underline underline-offset-2 mt-1"
                >
                  {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </form>
            </div>

            {/* Demo section */}
            <div className="px-7 pb-7">
              <div className="border-t border-line pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" strokeWidth={2} aria-hidden="true" />
                  <span className="text-[12px] font-bold tracking-wide uppercase text-muted">Try the demo</span>
                </div>
                <p className="text-[12px] text-muted mb-4 leading-relaxed">
                  No account needed — explore all four roles with sample data.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => enterDemo(r)}
                      className="group relative rounded-xl p-3 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: '#F2F5FB',
                        border: `1.5px solid #E0E7EF`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = ROLE_META[r].color + '60';
                        (e.currentTarget as HTMLElement).style.background = ROLE_META[r].color + '0A';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#E0E7EF';
                        (e.currentTarget as HTMLElement).style.background = '#F2F5FB';
                      }}
                    >
                      <span
                        className="block w-2 h-2 rounded-full mb-2"
                        style={{ background: ROLE_META[r].color }}
                        aria-hidden="true"
                      />
                      <span className="block text-[12.5px] font-bold text-ink leading-tight">{ROLE_META[r].label}</span>
                      <span className="block text-[11px] text-muted mt-0.5 leading-tight">{ROLE_META[r].subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
