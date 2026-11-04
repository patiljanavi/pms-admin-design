import { useEffect, useState } from 'react';
import { FiCheck, FiDownload } from 'react-icons/fi';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Avatar, Drawer, StatusBadge, Tabs, Toggle, cx, initials } from '../../components/ui';
import { FiX } from 'react-icons/fi';
import { BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, downloadCsv, useSelection } from '../../components/TableSelection';
import { PLAN_PRICE, PLAN_SEATS } from '../../data/sampleData';
import TagChip from '../../components/TagChip';
import { useData } from '../../context/DataContext';
import { ACCOUNTS_PATH } from '../../config';

const BILLING_TABS = ['Invoices', 'Payment methods', 'Plan & usage'];
const SETTINGS_TABS = ['Profile', 'Security', 'Notifications'];

function BillingTabs({ value, onChange }) {   // amber palette
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 self-start rounded-md bg-warning-100 p-1">
      {BILLING_TABS.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}
          className={cx('min-h-[36px] rounded px-3.5 font-semibold', value === t ? 'bg-warning-700 text-white' : 'text-[#6B4200] hover:bg-warning-50')}>{t}</button>
      ))}
    </div>
  );
}
function SettingsTabs({ value, onChange }) {  // violet palette
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {SETTINGS_TABS.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}
          className={cx('min-h-[36px] rounded-full border px-4 font-semibold', value === t ? 'border-violet-600 bg-violet-600 text-white' : 'border-violet-200 bg-violet-50 text-violet-700')}>{t}</button>
      ))}
    </div>
  );
}

export default function AccountDrawer() {
  const { accountId } = useParams();
  const { accounts } = useOutletContext();
  const navigate = useNavigate();
  const { tagById } = useData();
  const [tab, setTab] = useState('Overview');
  const [bill, setBill] = useState('Invoices');
  const [sett, setSett] = useState('Profile');
  const [tg, setTg] = useState({ twofa: true, email: true, sms: false, weekly: true, product: false });
  const close = () => navigate(ACCOUNTS_PATH);

  // Invoice selection (Billing → Invoices)
  const invSel = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [paidNow, setPaidNow] = useState(() => new Set());
  useEffect(() => { if (invSel.count === 0) setSelectedOnly(false); }, [invSel.count]);
  useEffect(() => { invSel.clear(); setPaidNow(new Set()); }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const a = accounts.find((x) => x.id === accountId);
  if (!a) {
    return (
      <Drawer onClose={close} label="Account not found">
        <div className="flex flex-col items-start gap-4 p-6"><h2 className="text-xl font-semibold">Account not found</h2><p className="text-muted">No account has the ID {accountId}.</p><Link to={ACCOUNTS_PATH} className="btn-primary">Back to accounts</Link></div>
      </Drawer>
    );
  }
  const price = PLAN_PRICE[a.plan];
  const [used, limit] = PLAN_SEATS[a.plan];
  const invoices = ['Oct 1', 'Sep 1', 'Aug 1', 'Jul 1'].map((d, i) => {
    const no = `INV-${a.id.slice(3)}-${12 - i}`;
    return { no, date: `${d}, 2026`, amount: `$${price}.00`, status: paidNow.has(no) || !(i === 0 && a.status !== 'Active') ? 'Paid' : 'Due' };
  });
  const shownInvoices = invoices.filter((iv) => !selectedOnly || invSel.has(iv.no));
  const selectedInvoices = invoices.filter((iv) => invSel.has(iv.no));
  const flip = (k) => (v) => setTg((p) => ({ ...p, [k]: v }));

  return (
    <Drawer onClose={close} label={`${a.name} details`}>
      <div className="flex items-center gap-4 border-b border-line p-5 sm:p-6">
        <Avatar text={initials(a.name)} size="lg" tone="solid" />
        <div className="min-w-0 flex-1"><div className="truncate text-xl font-bold">{a.name}</div><div className="truncate text-muted">{a.email}</div></div>
        <StatusBadge value={a.status} />
        <button onClick={close} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>
      <Tabs tabs={['Overview', 'Billing', 'Activity', 'Settings']} value={tab} onChange={setTab} />

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {tab === 'Overview' && (<>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[['Account ID', a.id, 'font-mono'], ['Company', a.company], ['Role', a.role], ['Plan', `${a.plan} · $${price} / mo`]].map(([k, v, c]) => (
              <div key={k} className="rounded-md border border-line p-3.5"><div className="text-xs text-muted">{k}</div><div className={cx('mt-1 font-semibold', c)}>{v}</div></div>
            ))}
            <div className="rounded-md border border-line p-3.5 sm:col-span-2"><div className="text-xs text-muted">Member since</div><div className="mt-1 font-semibold">{a.joined}</div></div>
          </div>
          {(a.team?.length > 0 || a.tags?.length > 0) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {a.team?.length > 0 && (
                <div className="rounded-md border border-line p-3.5"><div className="mb-2 text-xs text-muted">Team members</div>
                  <div className="flex flex-wrap gap-1.5">{a.team.map((m) => <span key={m} className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 py-0.5 pl-0.5 pr-2.5 text-sm font-semibold text-brand-800"><Avatar text={initials(m)} size="sm" tone="solid" />{m}</span>)}</div></div>
              )}
              {a.tags?.length > 0 && (
                <div className="rounded-md border border-line p-3.5"><div className="mb-2 text-xs text-muted">Tags</div>
                  <div className="flex flex-wrap gap-1.5">{a.tags.map((id) => tagById.get(id)).filter(Boolean).map((t) => <TagChip key={t.value} tag={t} />)}</div></div>
              )}
            </div>
          )}
          {a.contacts?.length > 0 && (
            <div className="rounded-md border border-line">
              <div className="border-b border-line px-3.5 py-2.5 text-xs text-muted">Contacts</div>
              <ul className="divide-y divide-line-soft">{a.contacts.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                  <Avatar text={initials(`${c.firstName} ${c.lastName}`.trim() || '?')} size="sm" />
                  <div className="min-w-0 flex-1"><div className="font-semibold">{c.firstName} {c.lastName} {c.primary && <span className="pill ml-1 bg-brand-600 text-white">Primary</span>}</div>
                    <div className="truncate text-sm text-muted">{c.role} · {c.email}{c.phone ? ` · ${c.phone}` : ''}</div></div>
                </li>))}</ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2.5">
            <button className="btn-secondary">Send email</button>
            <button className="btn-secondary">Reset password</button>
            <button className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50">Suspend account</button>
          </div>
        </>)}

        {tab === 'Billing' && (<>
          <BillingTabs value={bill} onChange={setBill} />
          {bill === 'Invoices' && (
            <div className="overflow-hidden rounded-md border border-line">
              <BulkBar count={invSel.count} total={invoices.length}
                onSelectAll={() => invSel.setMany(invoices.map((iv) => iv.no), true)} onClear={invSel.clear}
                filters={<SelectedOnlyFilter checked={selectedOnly} onChange={setSelectedOnly} />}
                actions={<>
                  <button className={barButton} onClick={() => setPaidNow((p) => new Set([...p, ...invSel.ids]))}><FiCheck aria-hidden="true" /> Mark as paid</button>
                  <button className={barButton} onClick={() => downloadCsv(`${a.id}-invoices.csv`, [['Invoice', 'Date', 'Amount', 'Status'], ...selectedInvoices.map((iv) => [iv.no, iv.date, iv.amount, iv.status])])}><FiDownload aria-hidden="true" /> Download</button>
                </>}
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px]">
                  <thead><tr className="bg-subtle text-left text-xs text-muted">
                    <th className="w-10 py-2.5 pl-3.5 pr-1"><HeaderCheckbox selection={invSel} pageIds={shownInvoices.map((iv) => iv.no)} label="Select all invoices" /></th>
                    <th className="px-2.5 py-2.5">Invoice</th><th className="px-2.5">Date</th><th className="px-2.5">Amount</th><th className="px-2.5">Status</th></tr></thead>
                  <tbody>{shownInvoices.map((iv) => (
                    <tr key={iv.no} aria-selected={invSel.has(iv.no)} className={cx('border-t border-line-soft', invSel.has(iv.no) && 'bg-brand-50')}>
                      <td className="py-3 pl-3.5 pr-1"><SelectCheckbox label={`Select invoice ${iv.no}`} checked={invSel.has(iv.no)} onChange={() => invSel.toggle(iv.no)} /></td>
                      <td className="px-2.5 py-3 font-mono text-sm">{iv.no}</td><td className="px-2.5">{iv.date}</td><td className="px-2.5 font-semibold">{iv.amount}</td><td className="px-2.5"><StatusBadge value={iv.status} /></td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          {bill === 'Payment methods' && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3.5 rounded-md border border-warning-300 bg-[#FFFBF3] p-3.5"><span className="flex h-8 w-12 items-center justify-center rounded-sm bg-warning-700 text-[11px] font-bold text-white">CARD</span><div><div className="font-semibold">Card ending [0000]</div><div className="text-sm text-muted">Default · expires [MM/YY]</div></div></div>
              <div className="flex items-center gap-3.5 rounded-md border border-line p-3.5"><span className="flex h-8 w-12 items-center justify-center rounded-sm bg-line text-[11px] font-bold">BANK</span><div><div className="font-semibold">Bank transfer ending [0000]</div><div className="text-sm text-muted">Backup method</div></div></div>
              <button className="btn border border-dashed border-line-strong bg-surface text-warning-700 hover:bg-subtle">+ Add payment method</button>
            </div>
          )}
          {bill === 'Plan & usage' && (
            <div className="flex flex-col gap-3.5 rounded-lg bg-warning-100 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><div className="text-xl font-bold">{a.plan} plan</div><div className="font-semibold text-warning-700">${price} / mo</div></div>
              <div><div className="mb-1.5 flex justify-between text-sm"><span>Seats used</span><span>{used} of {a.plan === 'Enterprise' ? 'unlimited' : limit} seats</span></div>
                <div className="h-2 rounded-full bg-[#F2DDB4]"><div className="h-2 rounded-full bg-warning-700" style={{ width: `${Math.round((used / limit) * 100)}%` }} /></div></div>
              <div className="flex flex-wrap gap-2.5"><button className="btn bg-warning-700 text-white hover:bg-[#6B4200]">Change plan</button><button className="btn border border-warning-300">Cancel subscription</button></div>
            </div>
          )}
        </>)}

        {tab === 'Activity' && (
          <ol className="flex flex-col gap-4">
            {[['Signed in from a new device', 'Today, 09:14', true], ['Paid the latest invoice', 'Oct 1, 2026', true], ['Invited 2 team members', 'Sep 22, 2026'], ['Changed role permissions', 'Sep 10, 2026'], ['Account created', a.joined]].map(([t, d, recent]) => (
              <li key={t} className="flex gap-3.5"><span className={cx('mt-1.5 h-2.5 w-2.5 flex-none rounded-full', recent ? 'bg-brand-600' : 'bg-line-strong')} /><div><div className="font-semibold">{t}</div><div className="text-sm text-muted">{d}</div></div></li>
            ))}
          </ol>
        )}

        {tab === 'Settings' && (<>
          <SettingsTabs value={sett} onChange={setSett} />
          {sett === 'Profile' && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="field-label sm:col-span-2">Display name<input className="input" defaultValue={a.name} /></label>
              <label className="field-label">Email<input className="input" defaultValue={a.email} /></label>
              <label className="field-label">Time zone<select className="input"><option>UTC</option><option>Europe / Berlin</option><option>America / New York</option><option>Asia / Kolkata</option></select></label>
              <button className="btn justify-self-start bg-violet-600 text-white hover:bg-violet-700">Save profile</button>
            </div>
          )}
          {sett === 'Security' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 rounded-md border border-line p-3.5"><div><div className="font-semibold">Two-factor authentication</div><div className="text-sm text-muted">Require a code at sign in</div></div><Toggle label="Two-factor authentication" checked={tg.twofa} onChange={flip('twofa')} /></div>
              <div className="rounded-md border border-line p-3.5"><div className="mb-2 font-semibold">Active sessions</div>
                <div className="flex justify-between border-t border-line-soft py-2"><span>Chrome · macOS</span><span className="text-muted">Current</span></div>
                <div className="flex justify-between border-t border-line-soft py-2"><span>Safari · iPhone</span><span className="text-muted">2 days ago</span></div></div>
              <button className="btn self-start border border-violet-200 bg-violet-50 text-violet-600">Sign out all sessions</button>
            </div>
          )}
          {sett === 'Notifications' && (
            <div className="divide-y divide-line-soft rounded-md border border-line">
              {[['email', 'Email alerts'], ['sms', 'SMS alerts'], ['weekly', 'Weekly summary'], ['product', 'Product updates']].map(([k, l]) => (
                <div key={k} className="flex items-center justify-between gap-3 p-3.5"><span>{l}</span><Toggle label={l} checked={tg[k]} onChange={flip(k)} /></div>
              ))}
            </div>
          )}
        </>)}
      </div>
    </Drawer>
  );
}
