import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import OtpInput from '../components/OtpInput';
import { FiLock } from 'react-icons/fi';
import { Checkbox, RadioDot, Segmented, cx } from '../components/ui';

const STEPS = ['Email', 'Verify', 'Details', 'About you', 'Preferences', 'Password'];
const TYPES = [['Personal', 'Just me, for my own work'], ['Team', 'A small team, up to 50'], ['Enterprise', 'A large organisation']];
const ROLES = ['Founder', 'Manager', 'Developer', 'Designer', 'Other'];
const INTERESTS = ['Analytics', 'Billing', 'CRM', 'Projects', 'Support', 'Marketing', 'Inventory', 'Reports'];
const NOTIFY = [['email', 'Product updates by email'], ['sms', 'Security alerts by SMS'], ['weekly', 'Weekly summary report']];

const initial = {
  email: '', name: '', company: '', address: '', type: 'Team', role: 'Founder', seats: 5,
  interests: ['Analytics', 'Projects'], notify: { email: true, sms: false, weekly: true }, theme: 'System',
  password: '', confirm: '', terms: false, news: false,
};

function strength(p) {
  let s = 0;
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const STR = [['bg-line', 'Use 8+ characters with a number and a symbol'], ['bg-danger-700', 'Weak'], ['bg-[#B86E00]', 'Fair'], ['bg-brand-600', 'Good'], ['bg-success-700', 'Strong']];

function validate(step, f, code) {
  if (step === 0 && !/^\S+@\S+\.\S+$/.test(f.email)) return 'Please enter a valid email address.';
  if (step === 1 && code.length < 6) return 'Enter all 6 digits of the code.';
  if (step === 2) {
    if (!f.name.trim()) return 'Please enter your full name.';
    if (!f.company.trim()) return 'Please enter your company name.';
    if (!f.address.trim()) return 'Please enter your address.';
  }
  if (step === 4 && f.interests.length === 0) return 'Pick at least one area you are interested in.';
  if (step === 5) {
    if (f.password.length < 8) return 'Password needs at least 8 characters.';
    if (f.password !== f.confirm) return 'The two passwords do not match.';
    if (!f.terms) return 'Please accept the terms to continue.';
  }
  return '';
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState(initial);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [showPw, setShowPw] = useState(false);

  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setError(''); };

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const next = () => {
    const e = validate(step, f, code);
    if (e) { setError(e); return; }
    setError(''); setNote('');
    if (step === 0) { setCode(''); setResendIn(30); }   // demo: a real app would call the API to send the code here
    if (step === 5) { navigate('/login', { state: { created: true, email: f.email } }); return; }
    setStep((s) => s + 1);
  };
  const back = () => { setError(''); setStep((s) => (s === 2 ? 0 : Math.max(0, s - 1))); };

  const sc = strength(f.password);
  const masked = f.email.includes('@') ? `${f.email[0]}•••${f.email.slice(f.email.indexOf('@'))}` : f.email;

  return (
    <AuthShell>
      <section className="flex w-full max-w-[640px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold">Create your account</h2>
            <p className="mt-1.5 text-muted">Step {step + 1} of {STEPS.length} · {step} of {STEPS.length} completed</p>
          </div>
          <Link to="/login" className="btn-link">I have an account</Link>
        </div>

        {/* Stepper */}
        <ol aria-label="Progress" className="flex items-start">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col gap-2" aria-current={i === step ? 'step' : undefined}>
              <div className="flex items-center">
                <span className={cx('flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold',
                  i < step ? 'bg-success-700 text-white' : i === step ? 'bg-brand-600 text-white' : 'border-2 border-line-strong text-muted')}>
                  {i < step ? '✓' : i + 1}
                </span>
                {i < STEPS.length - 1 && <span className={cx('mx-1.5 h-0.5 flex-1 sm:mx-2', i < step ? 'bg-success-700' : 'bg-line')} />}
              </div>
              <span className={cx('hidden text-sm font-semibold sm:block', i === step ? 'text-ink' : 'text-muted')}>{label}</span>
            </li>
          ))}
        </ol>

        {error && <div role="alert" className="rounded bg-danger-50 px-3.5 py-3 font-semibold text-danger-700">{error}</div>}

        <div className="card min-h-[320px] p-5 sm:p-6">
          {step === 0 && (
            <div className="flex max-w-[460px] flex-col gap-3.5">
              <h3 className="text-xl font-semibold">What's your work email?</h3>
              <label className="field-label">Work email *<input className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" /></label>
              <p className="text-muted">We'll send a 6-digit code to this address to confirm it's yours.</p>
            </div>
          )}

          {step === 1 && (
            <div className="flex max-w-[440px] flex-col gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><FiLock size={22} /></span>
              <div>
                <h3 className="text-xl font-semibold">Verify your email</h3>
                <p className="mt-1 text-muted">Enter the 6-digit code we sent to <b className="text-ink">{masked}</b>.</p>
              </div>
              {note && <div role="status" className="rounded bg-brand-100 px-3.5 py-3 font-semibold text-brand-800">{note}</div>}
              <div>
                <div className="mb-2 text-sm font-semibold">Verification code <span className="font-normal text-muted">· {code.length} of 6 entered</span></div>
                <OtpInput value={code} onChange={(v) => { setCode(v); setError(''); }} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-muted">
                <button type="button" className="btn-link" onClick={() => { setStep(0); setError(''); }}>Change email</button>
                {resendIn > 0
                  ? <span>Resend in <b className="text-ink">0:{String(resendIn).padStart(2, '0')}</b></span>
                  : <button type="button" className="btn-link" onClick={() => { setCode(''); setResendIn(30); setNote('A new code was sent to your email.'); }}>Resend code</button>}
              </div>
              <p className="text-xs text-muted">Demo: any 6 digits will verify.</p>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="field-label">Full name *<input className="input" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe" /></label>
              <label className="field-label">Company name *<input className="input" autoComplete="organization" value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="Company name" /></label>
              <label className="field-label sm:col-span-2">Address *<textarea className="input min-h-[96px] py-2.5" autoComplete="street-address" value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, city, postcode, country" /></label>
              <div className="flex items-center gap-2 font-semibold text-success-700 sm:col-span-2">✓ {f.email} verified</div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">Account type <span className="font-normal text-muted">(choose one)</span></legend>
                <div role="radiogroup" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {TYPES.map(([t, hint]) => (
                    <button key={t} type="button" role="radio" aria-checked={f.type === t} onClick={() => set('type', t)}
                      className={cx('rounded-md border-2 p-4 text-left', f.type === t ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-line-strong')}>
                      <RadioDot on={f.type === t} />
                      <span className="mt-2.5 block font-bold">{t}</span>
                      <span className="mt-0.5 block text-xs text-muted">{hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Your role</legend>
                  <div role="radiogroup" className="flex flex-col gap-1">
                    {ROLES.map((r) => (
                      <button key={r} type="button" role="radio" aria-checked={f.role === r} onClick={() => set('role', r)}
                        className={cx('flex min-h-[40px] items-center gap-2.5 rounded px-2.5 text-left', f.role === r ? 'bg-brand-50 font-semibold' : 'hover:bg-subtle')}>
                        <RadioDot on={f.role === r} />{r}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="flex flex-col gap-3">
                  <label htmlFor="seats" className="text-sm font-semibold">Team seats</label>
                  <div className="flex items-center self-start overflow-hidden rounded border border-line-strong">
                    <button type="button" aria-label="Decrease seats" disabled={f.seats <= 1} onClick={() => set('seats', Math.max(1, f.seats - 1))} className="h-11 w-11 bg-subtle text-xl font-bold disabled:text-line-strong">−</button>
                    <input id="seats" type="number" min="1" max="500" value={f.seats}
                      onChange={(e) => set('seats', Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)))}
                      className="h-11 w-16 border-x border-line-strong text-center text-lg font-bold" />
                    <button type="button" aria-label="Increase seats" disabled={f.seats >= 500} onClick={() => set('seats', Math.min(500, f.seats + 1))} className="h-11 w-11 bg-subtle text-xl font-bold disabled:text-line-strong">+</button>
                  </div>
                  <input type="range" min="1" max="500" value={f.seats} aria-label="Seats slider" onChange={(e) => set('seats', Number(e.target.value))} className="w-full accent-brand-600" />
                  <div className="flex justify-between text-xs text-muted"><span>1</span><span>250</span><span>500</span></div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <div className="mb-2.5 flex justify-between gap-2 text-sm font-semibold"><span>What will you use Harbor for? <span className="font-normal text-muted">(choose any)</span></span><span className="text-brand-600">{f.interests.length} selected</span></div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((it) => {
                    const on = f.interests.includes(it);
                    return (
                      <button key={it} type="button" aria-pressed={on} onClick={() => set('interests', on ? f.interests.filter((x) => x !== it) : [...f.interests, it])}
                        className={cx('min-h-[38px] rounded-full border px-3.5', on ? 'border-brand-600 bg-brand-600 font-semibold text-white' : 'border-line-strong bg-surface hover:bg-subtle')}>
                        {on ? '✓' : '+'} {it}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm font-semibold"><span>Notifications</span><span className="font-normal text-muted">{Object.values(f.notify).filter(Boolean).length} of 3 on</span></div>
                {NOTIFY.map(([k, label]) => (
                  <Checkbox key={k} checked={f.notify[k]} onChange={(v) => set('notify', { ...f.notify, [k]: v })}>{label}</Checkbox>
                ))}
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Theme</div>
                <Segmented label="Theme" options={['Light', 'Dark', 'System']} value={f.theme} onChange={(v) => set('theme', v)} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="field-label">Password *<input className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" /></label>
                <label className="field-label">Confirm password *<input className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={f.confirm} onChange={(e) => set('confirm', e.target.value)} placeholder="Repeat password" /></label>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-1.5 rounded-full bg-line"><div className={cx('h-1.5 rounded-full transition-all', STR[sc][0])} style={{ width: `${sc * 25}%` }} /></div>
                <div className="flex justify-between text-xs text-muted"><span>{f.password ? STR[sc][1] : STR[0][1]}</span><button type="button" className="btn-link" onClick={() => setShowPw((s) => !s)}>{showPw ? 'Hide' : 'Show'} passwords</button></div>
              </div>
              <Checkbox checked={f.terms} onChange={(v) => set('terms', v)}>I agree to the Terms of Service and Privacy Policy *</Checkbox>
              <Checkbox checked={f.news} onChange={(v) => set('news', v)}>Send me the monthly product newsletter</Checkbox>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2.5">
          <button type="button" className="btn-secondary" onClick={back} disabled={step === 0}>Back</button>
          {step === 1 && <button type="button" className="btn-primary" onClick={next}>Verify email</button>}
          {step !== 1 && step < 5 && <button type="button" className="btn-primary" onClick={next}>Continue</button>}
          {step === 5 && <button type="button" className="btn-success" onClick={next}>Create account</button>}
        </div>
      </section>
    </AuthShell>
  );
}
