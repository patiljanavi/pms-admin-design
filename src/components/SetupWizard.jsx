import { useState } from 'react';
import { Checkbox, Modal, Segmented, cx } from './ui';

const emptyAccount = { name: '', email: '', company: '', role: 'Editor', status: 'Active', plan: 'Pro', size: '11–50', phone: '' };
const STEPS = ['Account', 'Company', 'Access', 'Review'];
const PLANS = [['Starter', '$29 / mo', 'Up to 5 seats'], ['Pro', '$99 / mo', 'Up to 25 seats'], ['Enterprise', '$499 / mo', 'Unlimited seats']];
const PERMS = [['billing', 'Billing', 'View invoices and change plans'], ['users', 'User management', 'Invite and remove members'], ['reports', 'Reports', 'Export analytics and reports'], ['api', 'API keys', 'Create and revoke API tokens']];

export default function SetupWizard({ onClose, onFinish }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState(emptyAccount);
  const [perms, setPerms] = useState({ billing: true, users: false, reports: true, api: false });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const row = 'grid grid-cols-1 items-start gap-2 sm:grid-cols-[170px_1fr] sm:gap-5';

  return (
    <Modal title="Guided account setup" subtitle={`Step ${step + 1} of 4`} onClose={onClose} width="max-w-[760px]"
      footer={<div className="flex w-full justify-between">
        <button className="btn-secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
        {step < 3 ? <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Continue</button>
          : <button className="btn-success" onClick={() => onFinish(f)}>Create account</button>}
      </div>}>
      <ol className="mb-6 flex gap-2">
        {STEPS.map((l, i) => (
          <li key={l} className="flex flex-1 flex-col gap-2">
            <div className={cx('h-1 rounded', i < step ? 'bg-success-700' : i === step ? 'bg-brand-600' : 'bg-line')} />
            <div className="text-sm font-semibold">{i < step ? '✓' : i + 1} · {l}</div>
          </li>
        ))}
      </ol>
      <div className="min-h-[260px]">
        {step === 0 && (
          <div className="flex flex-col gap-3.5">
            <label className={row}><span className="pt-2.5 font-semibold">Full name *</span><input className="input" value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="Jane Doe" /></label>
            <label className={row}><span className="pt-2.5 font-semibold">Work email *</span><input className="input" type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} placeholder="jane@company.com" /></label>
            <label className={row}><span className="pt-2.5 font-semibold">Phone</span><span><input className="input" value={f.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="[Phone number]" /><span className="mt-1 block text-xs text-muted">Used only for account recovery</span></span></label>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <label className={row}><span className="pt-2.5 font-semibold">Company</span><input className="input" value={f.company} onChange={(e) => set('company')(e.target.value)} placeholder="Company name" /></label>
            <div className={row}><span className="pt-2.5 font-semibold">Team size</span><Segmented label="Team size" options={['1–10', '11–50', '51–200', '200+']} value={f.size} onChange={set('size')} /></div>
            <div className={row}><span className="pt-2.5 font-semibold">Plan</span>
              <div role="radiogroup" className="flex flex-col gap-2">
                {PLANS.map(([name, price, note]) => (
                  <button key={name} type="button" role="radio" aria-checked={f.plan === name} onClick={() => set('plan')(name)}
                    className={cx('flex items-center gap-3 rounded-md border-2 p-3.5 text-left', f.plan === name ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-line-strong')}>
                    <span className="flex-1 font-bold">{name}</span><span className="text-sm text-muted">{note}</span><span className="min-w-[90px] text-right font-bold">{price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className={row}><span className="pt-2.5 font-semibold">Role</span><Segmented label="Role" options={['Admin', 'Editor', 'Viewer']} value={f.role} onChange={set('role')} /></div>
            <div className={row}><span className="pt-2.5 font-semibold">Permissions</span>
              <div className="rounded-md border border-line px-3.5 py-1">
                {PERMS.map(([k, label, hint]) => (
                  <Checkbox key={k} checked={perms[k]} onChange={(v) => setPerms((p) => ({ ...p, [k]: v }))}>
                    <span className="font-semibold">{label}</span> <span className="text-sm text-muted">— {hint}</span>
                  </Checkbox>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <dl className="grid grid-cols-[140px_1fr] overflow-hidden rounded-md border border-line">
            {[['Name', f.name], ['Email', f.email], ['Company', `${f.company} · ${f.size}`], ['Plan · Role', `${f.plan} · ${f.role}`], ['Permissions', PERMS.filter(([k]) => perms[k]).map(([, l]) => l).join(', ') || 'None']].map(([k, v]) => (
              <div key={k} className="contents"><dt className="border-b border-line-soft bg-subtle px-4 py-3 text-muted">{k}</dt><dd className="border-b border-line-soft px-4 py-3 font-semibold">{v || '—'}</dd></div>
            ))}
          </dl>
        )}
      </div>
    </Modal>
  );
}
