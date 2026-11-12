import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Building2, Check, CircleAlert, CircleCheck, Info, MailCheck, Minus, Plus, User, Users,
} from 'lucide-react';
import AuthShell, { AuthField, PasswordInput } from '../components/AuthShell';
import OtpInput from '../components/OtpInput';
import { Checkbox, RadioDot, Segmented, Toggle, cx } from '../components/ui';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea';

const STEPS = ['Email', 'Verify', 'Details', 'About you', 'Preferences', 'Password'];
const STEP_COPY = [
  ["What's your work email?", "We'll send a 6-digit code to this address to confirm it's yours."],
  ['Verify your email', null],
  ['Your details', 'Tell us who you are and where your practice is based.'],
  ['About you', 'Helps us set Harbor up the right way for your team.'],
  ['Preferences', 'Pick what you want to see first. You can change all of this later.'],
  ['Set a password', 'Use at least 8 characters. A mix of letters, numbers and symbols is best.'],
];
const TYPES = [['Personal', 'Just me, for my own work', User], ['Team', 'A small team, up to 50', Users], ['Enterprise', 'A large organisation', Building2]];
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
const STR = [['bg-muted', 'Use 8+ characters with a number and a symbol'], ['bg-danger-600', 'Weak'], ['bg-warning-500', 'Fair'], ['bg-brand-600', 'Good'], ['bg-success-600', 'Strong']];

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

// Which field each validation message belongs to, so the error shows inline next to it.
const ERROR_FIELD = {
  'Please enter a valid email address.': 'email',
  'Enter all 6 digits of the code.': 'code',
  'Please enter your full name.': 'name',
  'Please enter your company name.': 'company',
  'Please enter your address.': 'address',
  'Pick at least one area you are interested in.': 'interests',
  'Password needs at least 8 characters.': 'password',
  'The two passwords do not match.': 'confirm',
  'Please accept the terms to continue.': 'terms',
};

function InlineError({ children }) {
  if (!children) return null;
  return <p role="alert" className="flex items-center gap-1.5 text-xs text-danger-700"><CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{children}</p>;
}

function Stepper({ step }) {
  return (
    <ol aria-label="Progress" className="flex items-start">
      {STEPS.map((label, i) => {
        const done = i < step; const current = i === step;
        return (
          <li key={label} className={cx('flex flex-col gap-2', i < STEPS.length - 1 && 'flex-1')} aria-current={current ? 'step' : undefined}>
            <div className="flex items-center">
              <span className={cx('flex size-7 flex-none items-center justify-center rounded-full text-xs font-semibold transition-colors',
                done && 'bg-primary text-primary-foreground',
                current && 'bg-primary/10 text-primary ring-2 ring-primary',
                !done && !current && 'border bg-card text-muted-foreground')}>
                {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
                <span className="sr-only">{done ? ' (completed)' : ''}</span>
              </span>
              {i < STEPS.length - 1 && (
                <span className="mx-1.5 h-0.5 flex-1 overflow-hidden rounded-full bg-border sm:mx-2" aria-hidden="true">
                  <span className={cx('block h-full rounded-full bg-primary transition-[width] duration-300', done ? 'w-full' : 'w-0')} />
                </span>
              )}
            </div>
            <span className={cx('hidden whitespace-nowrap text-xs font-medium sm:block', current ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
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
  const errField = error ? ERROR_FIELD[error] || 'form' : null;
  const errFor = (k) => (errField === k ? error : '');
  const [title, subtitle] = STEP_COPY[step];

  return (
    <AuthShell>
      <section className="flex w-full max-w-[640px] flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-3xl font-semibold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground">Step {step + 1} of {STEPS.length} · {step} of {STEPS.length} completed</p>
          </div>
          <Link to="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">I have an account</Link>
        </div>

        <div className="flex flex-col gap-4">
          <Stepper step={step} />
          <Progress value={(step / STEPS.length) * 100} className="h-1 sm:hidden" aria-label="Sign-up progress" />
        </div>

        <form noValidate onSubmit={(e) => { e.preventDefault(); next(); }}
          className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="flex min-h-[340px] flex-col gap-5 p-5 sm:p-7">
            {step !== 1 && (
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            )}

            {errField === 'form' && (
              <Alert variant="destructive"><CircleAlert aria-hidden="true" /><AlertDescription>{error}</AlertDescription></Alert>
            )}

            {step === 0 && (
              <div className="flex max-w-[440px] flex-col gap-4">
                <AuthField id="reg-email" label="Work email" required error={errFor('email')}>
                  <Input id="reg-email" type="email" autoComplete="email" value={f.email} aria-invalid={!!errFor('email')}
                    onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" />
                </AuthField>
              </div>
            )}

            {step === 1 && (
              <div className="flex max-w-[440px] flex-col gap-5">
                <span className="flex size-11 items-center justify-center rounded-xl border bg-brand-50 text-brand-700 shadow-xs"><MailCheck className="size-5" aria-hidden="true" /></span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold tracking-tight">Verify your email</h3>
                  <p className="text-sm text-muted-foreground">Enter the 6-digit code we sent to <b className="font-medium text-foreground">{masked}</b>.</p>
                </div>
                {note && <Alert variant="info" role="status"><Info aria-hidden="true" /><AlertDescription>{note}</AlertDescription></Alert>}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Verification code</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{code.length} of 6 entered</span>
                  </div>
                  <OtpInput value={code} invalid={!!errFor('code')} onChange={(v) => { setCode(v); setError(''); }} />
                  <InlineError>{errFor('code')}</InlineError>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <Button type="button" variant="link" className="h-auto px-0" onClick={() => { setStep(0); setError(''); }}>Change email</Button>
                  {resendIn > 0
                    ? <span>Resend in <b className="font-medium tabular-nums text-foreground">0:{String(resendIn).padStart(2, '0')}</b></span>
                    : <Button type="button" variant="link" className="h-auto px-0" onClick={() => { setCode(''); setResendIn(30); setNote('A new code was sent to your email.'); }}>Resend code</Button>}
                </div>
                <p className="rounded-md border border-dashed bg-subtle px-3 py-2 text-xs text-muted-foreground">Demo: any 6 digits will verify.</p>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AuthField id="reg-name" label="Full name" required error={errFor('name')}>
                  <Input id="reg-name" autoComplete="name" value={f.name} aria-invalid={!!errFor('name')} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe" />
                </AuthField>
                <AuthField id="reg-company" label="Company name" required error={errFor('company')}>
                  <Input id="reg-company" autoComplete="organization" value={f.company} aria-invalid={!!errFor('company')} onChange={(e) => set('company', e.target.value)} placeholder="Company name" />
                </AuthField>
                <AuthField id="reg-address" label="Address" required error={errFor('address')} className="sm:col-span-2">
                  <Textarea id="reg-address" autoComplete="street-address" value={f.address} aria-invalid={!!errFor('address')}
                    className={cx('min-h-[96px]', errFor('address') && 'border-destructive ring-[3px] ring-destructive/20')}
                    onChange={(e) => set('address', e.target.value)} placeholder="Street, city, postcode, country" />
                </AuthField>
                <div className="sm:col-span-2">
                  <Badge variant="success" className="gap-1.5 py-1 text-sm"><CircleCheck className="!size-3.5" aria-hidden="true" />{f.email} verified</Badge>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-6">
                <fieldset>
                  <legend className="mb-2.5 text-sm font-medium">Account type <span className="font-normal text-muted-foreground">(choose one)</span></legend>
                  <div role="radiogroup" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {TYPES.map(([t, hint, Icon]) => {
                      const on = f.type === t;
                      return (
                        <button key={t} type="button" role="radio" aria-checked={on} onClick={() => set('type', t)}
                          className={cx('group relative flex flex-col gap-3 rounded-lg border p-4 text-left transition-[border-color,background-color,box-shadow]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                            on ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/30' : 'bg-card hover:border-line-strong hover:bg-accent/50')}>
                          <div className="flex items-center justify-between">
                            <span className={cx('inline-flex size-8 items-center justify-center rounded-lg border', on ? 'border-primary/30 bg-primary/10 text-primary' : 'bg-subtle text-muted-foreground')}>
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <RadioDot on={on} />
                          </div>
                          <span>
                            <span className="block font-medium">{t}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <fieldset>
                    <legend className="mb-2.5 text-sm font-medium">Your role</legend>
                    <div role="radiogroup" className="flex flex-col overflow-hidden rounded-lg border">
                      {ROLES.map((r) => (
                        <button key={r} type="button" role="radio" aria-checked={f.role === r} onClick={() => set('role', r)}
                          className={cx('flex h-10 items-center gap-2.5 border-b px-3 text-left text-sm transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
                            f.role === r ? 'bg-primary/[0.05] font-medium text-foreground' : 'hover:bg-accent/60')}>
                          <RadioDot on={f.role === r} />{r}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="seats">Team seats</Label>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" aria-label="Decrease seats" disabled={f.seats <= 1} onClick={() => set('seats', Math.max(1, f.seats - 1))}><Minus /></Button>
                      <Input id="seats" type="number" min="1" max="500" value={f.seats}
                        onChange={(e) => set('seats', Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)))}
                        className="w-20 text-center text-md font-semibold tabular-nums" />
                      <Button type="button" variant="outline" size="icon" aria-label="Increase seats" disabled={f.seats >= 500} onClick={() => set('seats', Math.min(500, f.seats + 1))}><Plus /></Button>
                    </div>
                    <input type="range" min="1" max="500" value={f.seats} aria-label="Seats slider" onChange={(e) => set('seats', Number(e.target.value))} className="w-full accent-primary" />
                    <div className="flex justify-between text-xs tabular-nums text-muted-foreground"><span>1</span><span>250</span><span>500</span></div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between gap-2 text-sm font-medium">
                    <span>What will you use Harbor for? <span className="font-normal text-muted-foreground">(choose any)</span></span>
                    <span className="tabular-nums text-primary">{f.interests.length} selected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((it) => {
                      const on = f.interests.includes(it);
                      return (
                        <button key={it} type="button" aria-pressed={on} onClick={() => set('interests', on ? f.interests.filter((x) => x !== it) : [...f.interests, it])}
                          className={cx('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                            on ? 'border-primary/40 bg-primary/10 text-primary' : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground')}>
                          {on ? <Check className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}{it}
                        </button>
                      );
                    })}
                  </div>
                  <InlineError>{errFor('interests')}</InlineError>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-medium"><span>Notifications</span><span className="font-normal tabular-nums text-muted-foreground">{Object.values(f.notify).filter(Boolean).length} of 3 on</span></div>
                  <div className="divide-y rounded-lg border">
                    {NOTIFY.map(([k, label]) => (
                      <label key={k} className="flex cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-sm">
                        {label}
                        <Toggle label={label} checked={f.notify[k]} onChange={(v) => set('notify', { ...f.notify, [k]: v })} />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">Theme</span>
                  <Segmented label="Theme" options={['Light', 'Dark', 'System']} value={f.theme} onChange={(v) => set('theme', v)} />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AuthField id="reg-password" label="Password" required error={errFor('password')}>
                    <PasswordInput id="reg-password" autoComplete="new-password" value={f.password} shown={showPw} onShownChange={setShowPw}
                      aria-invalid={!!errFor('password')} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" />
                  </AuthField>
                  <AuthField id="reg-confirm" label="Confirm password" required error={errFor('confirm')}>
                    <PasswordInput id="reg-confirm" autoComplete="new-password" value={f.confirm} shown={showPw} onShownChange={setShowPw}
                      aria-invalid={!!errFor('confirm')} onChange={(e) => set('confirm', e.target.value)} placeholder="Repeat password" />
                  </AuthField>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((n) => <span key={n} className={cx('h-1 rounded-full transition-colors', f.password && sc >= n ? STR[sc][0] : 'bg-muted')} />)}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground" aria-live="polite">
                    <span>{f.password ? <>Strength: <span className="font-medium text-foreground">{STR[sc][1]}</span></> : STR[0][1]}</span>
                    {f.confirm && f.confirm === f.password && <span className="inline-flex items-center gap-1 text-success-700"><Check className="size-3.5" aria-hidden="true" />Passwords match</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border bg-subtle px-3.5 py-2">
                  <Checkbox checked={f.terms} onChange={(v) => set('terms', v)}>I agree to the Terms of Service and Privacy Policy *</Checkbox>
                  <Checkbox checked={f.news} onChange={(v) => set('news', v)}>Send me the monthly product newsletter</Checkbox>
                </div>
                <InlineError>{errFor('terms')}</InlineError>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2.5 border-t bg-subtle px-5 py-3.5 sm:px-7">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0}><ArrowLeft />Back</Button>
            {step === 1 && <Button type="submit">Verify email<ArrowRight /></Button>}
            {step !== 1 && step < 5 && <Button type="submit">Continue<ArrowRight /></Button>}
            {step === 5 && <Button type="submit"><Check />Create account</Button>}
          </div>
        </form>
      </section>
    </AuthShell>
  );
}
