import { useEffect } from 'react';
import { Check, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { Avatar, Toggle, cx, initials } from '../components/ui';
import { PageHeader, SectionHeading } from '../components/page';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuth } from '../context/AuthContext';
import { useAppearance, loadFont } from '../context/AppearanceContext';
import { DEFAULT_FONT, FONTS } from '../config';

const THEMES = [
  { id: 'light', label: 'Light', hint: 'Always use the light theme', icon: Sun },
  { id: 'dark', label: 'Dark', hint: 'Easier on the eyes at night', icon: Moon },
  { id: 'system', label: 'System', hint: 'Follows your device setting', icon: Monitor },
];

// Theme previews intentionally use fixed palette colours: they show what each theme looks like,
// whichever theme is active right now.
const MINI = {
  light: { bg: 'bg-slate-100', side: 'bg-slate-200/60 border-slate-200', card: 'bg-slate-50 border-slate-200', line: 'bg-slate-200', strong: 'bg-slate-300', accent: 'bg-blue-600' },
  dark: { bg: 'bg-slate-950', side: 'bg-slate-900 border-slate-800', card: 'bg-slate-900 border-slate-800', line: 'bg-slate-800', strong: 'bg-slate-700', accent: 'bg-blue-500' },
};

function MiniApp({ tone }) {
  const t = MINI[tone];
  return (
    <div className={cx('flex size-full gap-1.5 p-2', t.bg)}>
      <div className={cx('flex w-[26%] flex-col gap-1 rounded border p-1.5', t.side)}>
        <span className={cx('mb-1 size-2.5 rounded-sm', t.accent)} />
        <span className={cx('h-1 w-4/5 rounded-full', t.strong)} />
        <span className={cx('h-1 w-3/5 rounded-full', t.line)} />
        <span className={cx('h-1 w-2/3 rounded-full', t.line)} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <span className={cx('h-1.5 w-1/2 rounded-full', t.strong)} />
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => <span key={i} className={cx('h-5 rounded border', t.card)} />)}
        </div>
        <div className={cx('flex flex-1 flex-col gap-1 rounded border p-1.5', t.card)}>
          <span className={cx('h-1 w-full rounded-full', t.line)} />
          <span className={cx('h-1 w-5/6 rounded-full', t.line)} />
          <span className={cx('h-1 w-2/3 rounded-full', t.line)} />
          <span className={cx('mt-auto h-2 w-6 rounded-sm', t.accent)} />
        </div>
      </div>
    </div>
  );
}

function ThemePreview({ id }) {
  if (id !== 'system') return <MiniApp tone={id} />;
  return (
    <div className="relative size-full">
      <MiniApp tone="light" />
      <div className="absolute inset-0 [clip-path:polygon(55%_0,100%_0,100%_100%,45%_100%)]"><MiniApp tone="dark" /></div>
    </div>
  );
}

function SelectedDot({ on }) {
  return (
    <span className={cx('flex size-5 flex-none items-center justify-center rounded-full transition-colors', on ? 'bg-primary text-primary-foreground' : 'border border-line-strong bg-card')}>
      {on && <Check className="size-3" strokeWidth={3} aria-hidden="true" />}
    </span>
  );
}

const optionCard = (on) => cx('group rounded-xl border bg-card text-left shadow-xs transition-[border-color,box-shadow,background-color]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  on ? 'border-primary ring-1 ring-primary/30' : 'hover:border-line-strong hover:shadow-raised');

export default function MyAccount() {
  const { user } = useAuth();
  const { fontId, font, setFont, tabular, setTabular, theme, resolvedTheme, setTheme, reset } = useAppearance();

  // Load every option so each card can preview its own font.
  useEffect(() => { FONTS.forEach(loadFont); }, []);

  const changed = fontId !== DEFAULT_FONT || !tabular;

  return (
    <div className="page max-w-[1200px]">
      <PageHeader title="My Account" description="Your profile and how Harbor looks on this device." />

      {/* Profile summary */}
      <section className="relative flex flex-wrap items-center gap-4 overflow-hidden rounded-xl border bg-card p-5 shadow-card sm:p-6">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-brand-50 via-violet-50 to-transparent" aria-hidden="true" />
        <span className="relative rounded-full ring-4 ring-card"><Avatar text={initials(user?.name || user?.email || '?')} size="lg" tone="solid" /></span>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-lg font-semibold capitalize">{user?.name || 'Your profile'}</span>
            <Badge variant="success" dot shape="pill">Signed in</Badge>
          </div>
          <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
        </div>
      </section>

      {/* Theme */}
      <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-card sm:p-6">
        <SectionHeading title="Theme" description="Choose how Harbor looks. Saved on this device and applied before the page paints." />
        <div role="radiogroup" aria-label="Colour theme" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => {
            const on = theme === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => setTheme(t.id)} className={cx(optionCard(on), 'flex flex-col overflow-hidden p-0')}>
                <div className="aspect-[16/9] w-full overflow-hidden border-b">
                  <ThemePreview id={t.id} />
                </div>
                <div className="flex items-center gap-3 p-3.5">
                  <Icon className={cx('size-4 flex-none', on ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t.id === 'system' && on ? `Currently ${resolvedTheme}` : t.hint}
                    </div>
                  </div>
                  <SelectedDot on={on} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Font */}
      <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-card sm:p-6">
        <SectionHeading title="Font" description="Changes the typeface across the whole app straight away. Saved on this device."
          action={changed && <Button variant="outline" size="sm" onClick={() => { reset(); toast.success('Appearance reset to default'); }}><RotateCcw />Reset to default</Button>} />

        <div role="radiogroup" aria-label="App font" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {FONTS.map((f) => {
            const on = f.id === fontId;
            return (
              <button key={f.id} type="button" role="radio" aria-checked={on} onClick={() => setFont(f.id)} className={cx(optionCard(on), 'flex flex-col gap-3 p-4')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      {f.name}
                      {f.id === DEFAULT_FONT && <Badge variant="neutral">Default</Badge>}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{f.feel}</div>
                  </div>
                  <SelectedDot on={on} />
                </div>
                {/* Sample in the font itself */}
                <div style={{ fontFamily: f.sans }} className={cx('rounded-lg border p-3 transition-colors', on ? 'bg-primary/[0.03]' : 'bg-subtle')}>
                  <div className="text-2xl font-semibold leading-tight tracking-tight">Aa Bb 0123</div>
                  <div className="mt-1 text-base">Bennett Group · Northwind</div>
                  <div className="mt-0.5 text-sm font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>$12,480.00 · 1,111.11</div>
                  <div className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: f.monoStack }}>INV-1041-12</div>
                </div>
                <div className="text-xs text-muted-foreground">Best for: {f.bestFor} · Mono: {f.mono}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Numbers + live preview in the active font */}
      <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-card sm:p-6">
        <SectionHeading title="Line up numbers in tables" description="Gives every digit the same width so amounts align in columns."
          action={<Toggle label="Line up numbers in tables" checked={tabular} onChange={setTabular} />} />

        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b bg-subtle px-5 py-2.5 text-xs text-muted-foreground">
            <span>Preview in <span className="font-medium text-foreground">{font.name}</span></span>
            <Badge variant={tabular ? 'info' : 'neutral'}>{tabular ? 'Tabular numbers' : 'Proportional numbers'}</Badge>
          </div>
          <Table className="min-w-[480px]">
            <TableHeader>
              <TableRow><TableHead>Invoice</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {[['INV-1041-12', 'Bennett Group', '$1,111.00'], ['INV-1050-12', 'Chen Partners', '$499.00'], ['INV-1063-12', 'Laurent & Co', '$12,480.00']].map(([n, a, amt]) => (
                <TableRow key={n}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{n}</TableCell>
                  <TableCell className="font-medium">{a}</TableCell>
                  <TableCell className="text-right font-medium">{amt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
