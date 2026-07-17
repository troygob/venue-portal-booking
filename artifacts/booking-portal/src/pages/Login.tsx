import { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/roles';

const DEMO_ROLES = ['student', 'dept_head', 'school_admin', 'facilities'];
const ROLE_META: Record<string, { color: string; subtitle: string }> = {
  student:      { color: '#4ADE80', subtitle: 'Submit & track proposals' },
  dept_head:    { color: '#60A5FA', subtitle: 'Review & approve events'  },
  school_admin: { color: '#C084FC', subtitle: 'System-wide oversight'    },
  facilities:   { color: '#FB923C', subtitle: 'Venue confirmations'      },
};

export default function Login() {
  const { enterDemo } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const { error } = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (error) setError((error as any).message);
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#07090F' }}>

      {/* ── Left hero panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 relative overflow-hidden p-12"
        style={{
          background: 'linear-gradient(155deg, #0D2248 0%, #081629 40%, #07090F 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Decorative rings */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full" style={{ border: '1px solid rgba(200,150,26,0.12)' }} />
          <div className="absolute -top-20 -right-20 w-[320px] h-[320px] rounded-full" style={{ border: '1px solid rgba(200,150,26,0.08)' }} />
          <div className="absolute -bottom-60 -left-60 w-[640px] h-[640px] rounded-full" style={{ border: '1px solid rgba(200,150,26,0.07)' }} />
        </div>

        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#C8961A,#E4AA20)' }}>
            <Building2 className="w-4.5 h-4.5" style={{ color: '#07090F' }} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[12px] font-bold text-white tracking-tight">Venue &amp; Event Portal</div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5" style={{ color: '#C8961A' }}>Saint Mary's University</div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <div
            className="w-10 h-px mb-6"
            style={{ background: 'linear-gradient(90deg,#C8961A,transparent)' }}
            aria-hidden="true"
          />
          <h1 className="font-display text-[3.5rem] leading-[1.0] font-bold tracking-[-0.04em] text-white">
            From proposal<br />
            to{' '}
            <span style={{
              background: 'linear-gradient(135deg, #E4AA20 0%, #C8961A 50%, #A87215 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              confirmation
            </span>
            ,<br />
            in one place.
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>
            Four roles. One workflow. Full traceability from idea to event.
          </p>
        </div>

        {/* Role list */}
        <div className="relative z-10 flex flex-col gap-3">
          {DEMO_ROLES.map((r) => (
            <div key={r} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ROLE_META[r].color }} aria-hidden="true" />
              <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {ROLE_LABELS[r]}
              </span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                — {ROLE_META[r].subtitle}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-12 overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#C8961A,#E4AA20)' }}>
            <Building2 className="w-4.5 h-4.5" style={{ color: '#07090F' }} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">Venue &amp; Event Portal</div>
            <div className="text-[9.5px] font-bold tracking-widest uppercase mt-0.5" style={{ color: '#C8961A' }}>SMU Philippines</div>
          </div>
        </div>

        <div className="w-full max-w-[380px]">
          {/* Card */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: '#FEFCF9',
              border: '1px solid rgba(224,217,207,0.8)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.38), 0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            {/* Gold top bar */}
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#C8961A,#E4AA20,#C8961A)' }} aria-hidden="true" />

            <div className="p-8">
              <h2 className="font-display text-[1.75rem] font-bold text-[#0C111D] tracking-[-0.04em] mb-1">
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-[#6B7385] mb-8">
                {mode === 'signin' ? 'Sign in with your university email.' : 'Use your university email to register.'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6" aria-describedby={error ? 'auth-error' : undefined}>
                <div>
                  <label htmlFor="email" className="block text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#6B7385] mb-2">
                    University email
                  </label>
                  <input id="email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@students.smu.edu.ph"
                    className="field-input w-full" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#6B7385] mb-2">
                    Password
                  </label>
                  <input id="password" type="password" required minLength={8}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="field-input w-full" />
                </div>

                {error && (
                  <p id="auth-error" role="alert" className="text-[13px] font-semibold rounded-2xl px-4 py-3" style={{ background: '#FCEAEE', color: '#BD2F4A' }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
                  {busy ? 'Please wait…' : <>{mode === 'signin' ? 'Sign in' : 'Create account'}<ArrowRight className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" /></>}
                </button>

                <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-[12.5px] font-semibold text-center hover:underline underline-offset-2" style={{ color: '#103F7A' }}>
                  {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </form>
            </div>

            {/* Demo section */}
            <div style={{ borderTop: '1px solid #E0D9CF', background: '#F8F5F0', padding: '1.5rem 2rem 2rem' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8961A] animate-pulse shrink-0" aria-hidden="true" />
                <span className="text-[9.5px] font-black tracking-[0.18em] uppercase text-[#C8961A]">Try the demo</span>
              </div>
              <p className="text-[12px] text-[#6B7385] mb-4 leading-relaxed">
                No account needed — explore all four roles with live sample data.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => enterDemo(r)}
                    className="group rounded-2xl p-3 text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{ background: '#FEFCF9', border: '1px solid #E0D9CF', boxShadow: '0 1px 3px rgba(12,17,29,0.05)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = ROLE_META[r].color + '50';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${ROLE_META[r].color}18`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#E0D9CF';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(12,17,29,0.05)';
                    }}
                  >
                    <span className="block w-2 h-2 rounded-full mb-2" style={{ background: ROLE_META[r].color }} aria-hidden="true" />
                    <span className="block text-[12px] font-bold text-[#0C111D] leading-tight">{ROLE_LABELS[r]}</span>
                    <span className="block text-[10.5px] text-[#6B7385] mt-0.5 leading-tight">{ROLE_META[r].subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
