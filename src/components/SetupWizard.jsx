import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Checkbox, Modal, RadioDot, Segmented, cx } from './ui';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const emptyAccount = { name: '', email: '', company: '', role: 'Editor', status: 'Active', plan: 'Pro', size: '11–50', phone: '' };
const STEPS = ['Account', 'Company', 'Access', 'Review'];
const PLANS = [['Starter', '$29 / mo', 'Up to 5 seats'], ['Pro', '$99 / mo', 'Up to 25 seats'], ['Enterprise', '$499 / mo', 'Unlimited seats']];
const PERMS = [['billing', 'Billing', 'View invoices and change plans'], ['users', 'User management', 'Invite and remove members'], ['reports', 'Reports', 'Export analytics and reports'], ['api', 'API keys', 'Create and revoke API tokens']];

function Field({ id, label, hint, children, required }) {
  return (
    <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[160px_1fr] sm:gap-6">
      <Label htmlFor={id} className="sm:pt-2.5">{label}{required && <span className="text-danger-700"> *</span>}</Label>
      <div className="flex min-w-0 flex-col gap-1.5">
        {children}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export default function SetupWizard({ onClose, onFinish }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState(emptyAccount);
  const [perms, setPerms] = useState({ billing: true, users: false, reports: true, api: false });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Modal title="Guided account setup" subtitle={`Step ${step + 1} of 4`} onClose={onClose} width="max-w-[760px]"
      footer={<div className="flex w-full items-center justify-between gap-2">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft />Back</Button>
        {step < 3 ? <Button onClick={() => setStep((s) => s + 1)}>Continue<ArrowRight /></Button>
          : <Button onClick={() => onFinish(f)}><Check />Create account</Button>}
      </div>}>
      {/* Stepper */}
      <ol aria-label="Progress" className="mb-6 grid grid-cols-4 gap-3">
        {STEPS.map((l, i) => {
          const done = i < step; const current = i === step;
          return (
            <li key={l} className="flex flex-col gap-2" aria-current={current ? 'step' : undefined}>
              <div className={cx('h-1 rounded-full transition-colors', done ? 'bg-primary' : current ? 'bg-primary/60' : 'bg-muted')} />
              <div className="flex items-center gap-2 text-sm">
                <span className={cx('inline-flex size-5 flex-none items-center justify-center rounded-full text-[11px] font-semibold',
                  done ? 'bg-primary text-primary-foreground' : current ? 'border border-primary text-primary' : 'border text-muted-foreground')}>
                  {done ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                <span className={cx('truncate font-medium', current || done ? 'text-foreground' : 'text-muted-foreground')}>{l}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="min-h-[260px]">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Field id="wiz-name" label="Full name" required><Input id="wiz-name" value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="Jane Doe" /></Field>
            <Field id="wiz-email" label="Work email" required><Input id="wiz-email" type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} placeholder="jane@company.com" /></Field>
            <Field id="wiz-phone" label="Phone" hint="Used only for account recovery"><Input id="wiz-phone" value={f.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="[Phone number]" /></Field>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <Field id="wiz-company" label="Company"><Input id="wiz-company" value={f.company} onChange={(e) => set('company')(e.target.value)} placeholder="Company name" /></Field>
            <Field label="Team size"><div><Segmented label="Team size" options={['1–10', '11–50', '51–200', '200+']} value={f.size} onChange={set('size')} /></div></Field>
            <Field label="Plan">
              <div role="radiogroup" aria-label="Plan" className="flex flex-col gap-2">
                {PLANS.map(([name, price, note]) => {
                  const on = f.plan === name;
                  return (
                    <button key={name} type="button" role="radio" aria-checked={on} onClick={() => set('plan')(name)}
                      className={cx('flex items-center gap-3 rounded-lg border p-3.5 text-left transition-[border-color,background-color,box-shadow]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                        on ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/30' : 'bg-card hover:border-line-strong hover:bg-accent/50')}>
                      <RadioDot on={on} />
                      <span className="flex-1">
                        <span className="block font-medium">{name}</span>
                        <span className="block text-sm text-muted-foreground">{note}</span>
                      </span>
                      <span className="min-w-[90px] text-right font-semibold tabular-nums">{price}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <Field label="Role"><div><Segmented label="Role" options={['Admin', 'Editor', 'Viewer']} value={f.role} onChange={set('role')} /></div></Field>
            <Field label="Permissions">
              <div className="divide-y rounded-lg border bg-card px-3.5">
                {PERMS.map(([k, label, hint]) => (
                  <Checkbox key={k} checked={perms[k]} onChange={(v) => setPerms((p) => ({ ...p, [k]: v }))} className="w-full py-2.5">
                    <span className="font-medium">{label}</span> <span className="text-sm text-muted-foreground">— {hint}</span>
                  </Checkbox>
                ))}
              </div>
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Check the details below. You can change any of them later from the account page.</p>
            <dl className="grid grid-cols-[140px_1fr] overflow-hidden rounded-lg border text-sm">
              {[['Name', f.name], ['Email', f.email], ['Company', `${f.company} · ${f.size}`], ['Plan · Role', `${f.plan} · ${f.role}`], ['Permissions', PERMS.filter(([k]) => perms[k]).map(([, l]) => l).join(', ') || 'None']].map(([k, v], i, arr) => (
                <div key={k} className="contents">
                  <dt className={cx('bg-subtle px-4 py-3 text-muted-foreground', i < arr.length - 1 && 'border-b')}>{k}</dt>
                  <dd className={cx('px-4 py-3 font-medium', i < arr.length - 1 && 'border-b')}>{v || <span className="text-muted-foreground/60">—</span>}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </Modal>
  );
}
