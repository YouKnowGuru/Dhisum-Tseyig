import { useState, useMemo } from 'react';
import {
  UserPlus, Loader2, CheckCircle, AlertCircle,
  User, Lock, Mail, UserCircle, ArrowLeft, LogIn, Eye, EyeOff,
  ShieldCheck, Zap, Globe
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { AuthService } from '../services/AuthService';
import { useAppVersion } from '../hooks/use-app-version';

interface SetupAccountPageProps {
  onAccountCreated: (username: string, password: string, email: string) => void;
  onBack?: () => void;
  onShowLogin?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PWD_REQS = [
  { label: 'At least 8 characters',           test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',             test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',             test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0-9)',                 test: (p: string) => /\d/.test(p) },
  { label: 'One special character',            test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function pwdScore(pw: string) {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/\d/.test(pw))    s++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) s++;
  return s;
}

function StrengthBar({ pw }: { pw: string }) {
  const s = pwdScore(pw);
  const label = s <= 2 ? 'Weak' : s <= 4 ? 'Fair' : s === 5 ? 'Good' : 'Strong';
  const colours = [
    'bg-red-500', 'bg-red-400', 'bg-amber-400',
    'bg-amber-400', 'bg-lime-400', 'bg-emerald-400',
  ];
  const col = colours[Math.max(0, s - 1)] ?? 'bg-white/10';
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= s ? col : 'bg-white/8'}`} />
        ))}
      </div>
      {pw && <span className={`text-[10px] font-black tabular-nums ${
        label === 'Strong' ? 'text-emerald-400' : label === 'Good' ? 'text-lime-400' :
        label === 'Fair' ? 'text-amber-400' : 'text-red-400'}`}>{label}</span>}
    </div>
  );
}

// ── Animated decorative rings ─────────────────────────────────────────────────
function Rings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[320, 460, 600, 750].map((s, i) => (
        <div key={s} className="absolute rounded-full border border-white/[0.025]"
          style={{ width: s, height: s, animationDelay: `${i * 0.8}s` }} />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function SetupAccountPage({ onAccountCreated, onBack, onShowLogin }: SetupAccountPageProps) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', fullName: '' });
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [showCpw, setShowCpw]   = useState(false);
  const appVersion = useAppVersion();
  const [touched, setTouched]   = useState<Record<string, boolean>>({});

  const patch = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setTouched(p => ({ ...p, [k]: true }));
  };

  const valid = useMemo(() => ({
    email:           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    fullName:        form.fullName.trim().length >= 2 && /^[a-zA-Z\s\-']+$/.test(form.fullName),
    username:        form.username.trim().length >= 2,
    password:        PWD_REQS.every(r => r.test(form.password)),
    confirmPassword: form.confirmPassword === form.password && form.confirmPassword.length > 0,
  }), [form]);

  const allValid = Object.values(valid).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.username || !form.password || !form.fullName || !form.email) { setErr('Please fill in all fields.'); return; }
    if (!/^[a-zA-Z\s\-']+$/.test(form.fullName))  { setErr('Full name: letters, spaces, hyphens, apostrophes only.'); return; }
    if (form.fullName.trim().length < 2)           { setErr('Full name must be at least 2 characters.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Please enter a valid email address.'); return; }
    if (form.password !== form.confirmPassword)    { setErr('Passwords do not match.'); return; }
    if (!PWD_REQS.every(r => r.test(form.password))) { setErr('Password does not meet all requirements.'); return; }

    setBusy(true);
    try {
      let deviceId: string | undefined;
      let licenseKey: string | undefined;
      if (window.electronSecureAPI) {
        try { deviceId = await window.electronSecureAPI.app.getDeviceId(); } catch { /* empty */ }
        try {
          const ls = await window.electronSecureAPI.license.getStatus();
          licenseKey = ls?.licenseKey;
          if (!deviceId) deviceId = ls?.deviceId;
        } catch { /* empty */ }
      }

      const srv = await AuthService.register(form.username, form.email, form.password, { deviceId, licenseKey });
      if (!srv.success) {
        const msg = srv.message || '';
        const isNet = msg.includes('Unable to reach') || msg.includes('fetch') || msg.includes('network');
        if (!isNet) {
          let em = msg || 'Registration failed.';
          if (msg.toLowerCase().includes('email') && (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')))
            em = 'This email is already registered. Try logging in instead.';
          else if (msg.toLowerCase().includes('username') && (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('taken')))
            em = 'This username is taken. Please choose a different one.';
          else if (msg.toLowerCase().includes('account') && msg.toLowerCase().includes('lock'))
            em = 'Account temporarily locked. Please try again later.';
          else if (msg.toLowerCase().includes('suspended') || msg.toLowerCase().includes('disabled'))
            em = 'Account access has been restricted. Contact support.';
          setErr(em); setBusy(false); return;
        }
      }

      if (window.electronSecureAPI) {
        const loc = await window.electronSecureAPI.settings.createInitialUser({
          username: form.username, email: form.email, password: form.password,
          fullName: form.fullName, role: 'admin',
        });
        if (!loc.success) { setErr(loc.message || 'Failed to create local account.'); setBusy(false); return; }
      }
      setSuccess(true);
      setTimeout(() => onAccountCreated(form.username, form.password, form.email), 1500);
    } catch { setErr('An unexpected error occurred. Please try again.'); }
    finally   { setBusy(false); }
  };

  // ── Input helpers ──────────────────────────────────────────────────────────
  const borderFor = (key: keyof typeof valid) => {
    if (!touched[key] || !form[key]) return 'border-white/[0.08] focus-within:border-bhutan-gold/40';
    return valid[key]
      ? 'border-emerald-500/50 focus-within:border-emerald-400/70'
      : 'border-red-500/50   focus-within:border-red-400/70';
  };

  const renderInputWrap = (fieldKey: keyof typeof valid, children: React.ReactNode) => (
    <div className={`relative flex items-center rounded-2xl border bg-white/[0.03] transition-all duration-200 focus-within:bg-white/[0.06] focus-within:ring-1 ${borderFor(fieldKey)} ${
      touched[fieldKey] && form[fieldKey] && valid[fieldKey] ? 'focus-within:ring-emerald-500/20' :
      touched[fieldKey] && form[fieldKey] && !valid[fieldKey] ? 'focus-within:ring-red-500/20' :
      'focus-within:ring-bhutan-gold/15'
    }`}>{children}</div>
  );

  const inputCls = 'w-full h-[3.25rem] bg-transparent text-white placeholder:text-white/20 text-[0.9rem] font-medium focus:outline-none';

  return (
    <div className="min-h-screen flex overflow-hidden font-sans" style={{ background: '#06050f' }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          LEFT — Brand panel
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative flex-col overflow-hidden">
        {/* Rich layered background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(128,0,0,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(255,215,0,0.07) 0%, transparent 70%), #0a0208'
        }} />

        {/* Animated concentric rings */}
        <Rings />

        {/* Subtle dot-grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />

        {/* Top fade */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#0a0208] to-transparent z-10" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0a0208] to-transparent z-10" />

        {/* Content */}
        <div className="relative z-20 flex flex-col h-full px-12 py-14 justify-between">


          {/* Centre: Hero */}
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            {/* Giant logo */}
            <div className="relative mb-10">
              {/* Glow behind logo */}
              <div className="absolute inset-[-20px] bg-bhutan-maroon/30 rounded-full blur-3xl" />
              <div className="absolute inset-[-4px] rounded-full border border-bhutan-gold/20 animate-spin" style={{ animationDuration: '12s' }} />
              <div className="absolute inset-[-12px] rounded-full border border-bhutan-gold/10 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
              <Logo size="2xl" animate={true} />
            </div>

            <h1 className="text-5xl xl:text-6xl font-black text-white leading-none tracking-tight mb-3">
              Jinda
            </h1>
            <p className="text-bhutan-gold text-xs font-black uppercase tracking-[0.35em] mb-6">
              Premium · Bhutan · Trusted
            </p>
            <p className="text-white/40 text-sm leading-relaxed font-medium max-w-[280px]">
              Your all-in-one accounting and point-of-sale platform, built for businesses across Bhutan.
            </p>
          </div>

          {/* Bottom: Feature list */}
          <div className="space-y-3">
            {[
              { icon: ShieldCheck, text: 'Military-grade local encryption', sub: 'Your data never leaves your device without consent' },
              { icon: Zap,         text: 'Lightning-fast offline mode',     sub: 'Full functionality even without internet' },
              { icon: Globe,       text: 'Bhutan-local compliance',         sub: 'GST, TPN, and PIT reporting built-in' },
            ].map(({ icon: I, text, sub }) => (
              <div key={text} className="flex items-start gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm group hover:bg-white/[0.07] transition-all">
                <div className="w-8 h-8 rounded-xl bg-bhutan-gold/10 border border-bhutan-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                  <I className="w-4 h-4 text-bhutan-gold" />
                </div>
                <div>
                  <div className="text-white/90 text-xs font-bold mb-0.5">{text}</div>
                  <div className="text-white/30 text-[10px] leading-tight">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          RIGHT — Form panel
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center relative overflow-y-auto p-6 lg:p-10">
        {/* Subtle background texture */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 50% at 70% 30%, rgba(255,215,0,0.03) 0%, transparent 70%)' }} />

        <div className="relative z-10 w-full max-w-[480px]">

          {/* Mobile logo (only shows on < lg) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Logo size="lg" animate className="mb-4" />
            <h1 className="text-3xl font-black text-white">Jinda <span className="text-bhutan-gold">Setup</span></h1>
            <p className="text-white/30 text-xs uppercase tracking-widest font-bold mt-1">Administrator Registration</p>
          </div>

          {/* Card header */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-5">
              {onBack && !success && (
                <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white/40 hover:text-white transition-all group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Create Account</h2>
                <p className="text-white/35 text-[0.8rem] mt-0.5">Administrator registration for Jinda workspace</p>
              </div>
              {/* Step pill */}
              <div className="ml-auto hidden sm:flex items-center gap-1.5 bg-bhutan-gold/10 border border-bhutan-gold/20 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-bhutan-gold animate-pulse" />
                <span className="text-bhutan-gold text-[10px] font-black uppercase tracking-wider">Step 1 of 2</span>
              </div>
            </div>

            {/* Progress track */}
            <div className="flex gap-1.5">
              <div className="h-0.5 flex-1 rounded-full bg-bhutan-gold" />
              <div className="h-0.5 flex-1 rounded-full bg-white/10" />
            </div>
          </div>

          {/* ── Success state ── */}
          {success ? (
            <div className="py-20 text-center">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute w-36 h-36 bg-emerald-500/10 rounded-full animate-ping" />
                <div className="absolute w-28 h-28 bg-emerald-500/15 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                <div className="relative w-24 h-24 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mb-2">All Set!</h3>
              <p className="text-white/40 text-sm">Redirecting to email verification…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── Full Name (full width) ─────────────────────────── */}
              <div className="space-y-2">
                <Label icon={UserCircle} text="Full Name" valid={touched.fullName ? valid.fullName : null} />
                {renderInputWrap('fullName', (
                  <>
                    <UserCircle className="absolute left-4 w-4 h-4 text-white/25 pointer-events-none" />
                    <input id="fullName" type="text" autoFocus required placeholder="e.g. Tashi Dorji"
                      value={form.fullName}
                      onChange={e => { if (e.target.value === '' || /^[a-zA-Z\s\-']*$/.test(e.target.value)) patch('fullName', e.target.value); }}
                      className={`${inputCls} pl-11 pr-4`} />
                    {touched.fullName && form.fullName && (
                      <div className="absolute right-3">
                        {valid.fullName
                          ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                          : <AlertCircle className="w-4 h-4 text-red-400/70" />}
                      </div>
                    )}
                  </>
                ))}
              </div>

              {/* ── Username + Email row ───────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label icon={User} text="Login ID" valid={touched.username ? valid.username : null} />
                  {renderInputWrap('username', (
                    <>
                      <User className="absolute left-4 w-4 h-4 text-white/25 pointer-events-none" />
                      <input id="username" type="text" required placeholder="admin"
                        value={form.username} onChange={e => patch('username', e.target.value)}
                        className={`${inputCls} pl-11 pr-4`} />
                    </>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label icon={Mail} text="Email" valid={touched.email ? valid.email : null} />
                  {renderInputWrap('email', (
                    <>
                      <Mail className="absolute left-4 w-4 h-4 text-white/25 pointer-events-none" />
                      <input id="email" type="email" required placeholder="you@example.com"
                        value={form.email} onChange={e => patch('email', e.target.value)}
                        className={`${inputCls} pl-11 pr-4`} />
                    </>
                  ))}
                </div>
              </div>

              {/* ── Password ──────────────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label icon={Lock} text="Password" valid={touched.password ? valid.password : null} />
                </div>
                {renderInputWrap('password', (
                  <>
                    <Lock className="absolute left-4 w-4 h-4 text-white/25 pointer-events-none" />
                    <input id="password" type={showPw ? 'text' : 'password'} required placeholder="Create a strong password"
                      value={form.password} onChange={e => patch('password', e.target.value)}
                      className={`${inputCls} pl-11 pr-10`} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 text-white/25 hover:text-white/70 transition-colors p-1">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </>
                ))}
                {/* Strength bar */}
                {form.password && <StrengthBar pw={form.password} />}
                {/* Requirements checklist */}
                {touched.password && form.password && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-white/[0.025] border border-white/[0.05] rounded-xl px-4 py-3 mt-0.5">
                    {PWD_REQS.map((r, i) => {
                      const met = r.test(form.password);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${met ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                            {met
                              ? <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                              : <div className="w-1 h-1 bg-white/20 rounded-full" />}
                          </div>
                          <span className={`text-[10px] font-medium ${met ? 'text-emerald-400' : 'text-white/25'}`}>{r.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Confirm Password ──────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label icon={Lock} text="Confirm Password" valid={touched.confirmPassword ? valid.confirmPassword : null} />
                  {touched.confirmPassword && form.confirmPassword && (
                    <span className={`text-[10px] font-black ${valid.confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                      {valid.confirmPassword ? '✓ Matches' : '✗ No match'}
                    </span>
                  )}
                </div>
                {renderInputWrap('confirmPassword', (
                  <>
                    <Lock className="absolute left-4 w-4 h-4 text-white/25 pointer-events-none" />
                    <input id="confirmPassword" type={showCpw ? 'text' : 'password'} required placeholder="Repeat your password"
                      value={form.confirmPassword} onChange={e => patch('confirmPassword', e.target.value)}
                      className={`${inputCls} pl-11 pr-10`} />
                    <button type="button" onClick={() => setShowCpw(!showCpw)}
                      className="absolute right-3 text-white/25 hover:text-white/70 transition-colors p-1">
                      {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </>
                ))}
              </div>

              {/* ── Error ─────────────────────────────────────────── */}
              {err && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[0.82rem] text-red-300 font-semibold leading-snug">{err}</p>
                </div>
              )}

              {/* ── Submit ────────────────────────────────────────── */}
              <button type="submit" id="setup-submit-btn" disabled={busy}
                className="relative w-full h-[3.5rem] mt-1 rounded-2xl font-black text-[0.8rem] uppercase tracking-[0.2em] overflow-hidden transition-all duration-200 flex items-center justify-center gap-3 group
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: allValid && !busy ? 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)' : 'linear-gradient(135deg, #B8860B 0%, #c97700 100%)' }}>
                {/* Shine sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className={`absolute inset-0 rounded-2xl transition-all duration-200 ${!busy && allValid ? 'shadow-[0_0_40px_-8px_rgba(255,215,0,0.5)]' : ''}`} />
                <span className="relative flex items-center gap-3 text-[#1a0a00]">
                  {busy
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account…</>
                    : <><UserPlus className="w-5 h-5" /> Create Admin Account</>}
                </span>
              </button>

              {/* ── Switch to login ───────────────────────────────── */}
              {onShowLogin && (
                <div className="flex items-center justify-center gap-3 pt-3">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/25 font-medium">Have an account?</span>
                    <button type="button" id="switch-to-login-btn" onClick={onShowLogin}
                      className="inline-flex items-center gap-1.5 text-bhutan-gold hover:text-bhutan-gold-light font-black uppercase tracking-widest transition-colors text-[10px]">
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In
                    </button>
                  </div>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>
              )}
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-[10px] text-white/15 font-bold uppercase tracking-[0.25em] mt-8">
            Jinda v{appVersion} &nbsp;·&nbsp; Secure &nbsp;·&nbsp; Local-first
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Label sub-component ───────────────────────────────────────────────────────
function Label({ icon: Icon, text, valid }: { icon: React.ElementType; text: string; valid: boolean | null }) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em]">
      <Icon className={`w-3 h-3 transition-colors ${valid === true ? 'text-emerald-400' : valid === false ? 'text-red-400' : 'text-bhutan-gold/70'}`} />
      <span className={`transition-colors ${valid === true ? 'text-emerald-400/80' : valid === false ? 'text-red-400/80' : 'text-white/40'}`}>{text}</span>
    </label>
  );
}
