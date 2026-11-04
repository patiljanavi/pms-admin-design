import { useEffect } from 'react';
import { FiCheck, FiRotateCcw } from 'react-icons/fi';
import { Avatar, Toggle, cx, initials } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAppearance, loadFont } from '../context/AppearanceContext';
import { DEFAULT_FONT, FONTS } from '../config';

export default function MyAccount() {
  const { user } = useAuth();
  const { fontId, font, setFont, tabular, setTabular, reset } = useAppearance();

  // Load every option so each card can preview its own font.
  useEffect(() => { FONTS.forEach(loadFont); }, []);

  const changed = fontId !== DEFAULT_FONT || !tabular;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="text-sm text-muted">Settings / My Account</div>
        <h1 className="mt-1 text-3xl font-bold">My Account</h1>
      </header>

      {/* Profile summary */}
      <section className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar text={initials(user?.name || user?.email || '?')} size="lg" tone="solid" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold capitalize">{user?.name || 'Your profile'}</div>
          <div className="truncate text-muted">{user?.email}</div>
        </div>
      </section>

      {/* Appearance */}
      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Font</h2>
            <p className="mt-1 max-w-[62ch] text-muted">Changes the typeface across the whole app straight away. Saved on this device.</p>
          </div>
          {changed && <button onClick={reset} className="btn-secondary min-h-[40px]"><FiRotateCcw aria-hidden="true" /> Reset to default</button>}
        </div>

        <div role="radiogroup" aria-label="App font" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {FONTS.map((f) => {
            const on = f.id === fontId;
            return (
              <button key={f.id} type="button" role="radio" aria-checked={on} onClick={() => setFont(f.id)}
                className={cx('flex flex-col gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                  on ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-line-strong')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{f.name}{f.id === DEFAULT_FONT && <span className="ml-2 text-sm font-normal text-muted">Default</span>}</div>
                    <div className="text-sm text-muted">{f.feel}</div>
                  </div>
                  <span className={cx('flex h-6 w-6 flex-none items-center justify-center rounded-full', on ? 'bg-brand-600 text-white' : 'border-2 border-line-strong')}>
                    {on && <FiCheck size={14} aria-hidden="true" />}
                  </span>
                </div>
                {/* Sample in the font itself */}
                <div style={{ fontFamily: f.sans }} className="rounded-md border border-line bg-surface p-3">
                  <div className="text-2xl font-bold leading-tight">Aa Bb 0123</div>
                  <div className="mt-1 text-base">Bennett Group · Northwind</div>
                  <div className="mt-0.5 text-sm font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>$12,480.00 · 1,111.11</div>
                  <div className="mt-1 text-sm text-muted" style={{ fontFamily: f.monoStack }}>INV-1041-12</div>
                </div>
                <div className="text-sm text-muted">Best for: {f.bestFor} · Mono: {f.mono}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Numbers + live preview in the active font */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Line up numbers in tables</h2>
            <p className="mt-1 max-w-[62ch] text-muted">Gives every digit the same width so amounts align in columns.</p>
          </div>
          <Toggle label="Line up numbers in tables" checked={tabular} onChange={setTabular} />
        </div>

        <div className="mt-5 overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[480px]">
            <caption className="bg-subtle px-4 py-2.5 text-left text-sm text-muted">Preview in {font.name}</caption>
            <thead><tr className="border-t border-line text-left text-xs uppercase tracking-wide text-muted"><th className="px-4 py-2.5">Invoice</th><th className="px-4 py-2.5">Account</th><th className="px-4 py-2.5 text-right">Amount</th></tr></thead>
            <tbody>
              {[['INV-1041-12', 'Bennett Group', '$1,111.00'], ['INV-1050-12', 'Chen Partners', '$499.00'], ['INV-1063-12', 'Laurent & Co', '$12,480.00']].map(([n, a, amt]) => (
                <tr key={n} className="border-t border-line-soft"><td className="px-4 py-2.5 font-mono text-sm">{n}</td><td className="px-4 py-2.5 font-semibold">{a}</td><td className="px-4 py-2.5 text-right font-semibold">{amt}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
