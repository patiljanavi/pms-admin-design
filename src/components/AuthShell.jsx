import { useState } from 'react';
import { CircleAlert, Eye, EyeOff, KanbanSquare, ShieldCheck, Table2 } from 'lucide-react';
import { cn } from 'lib/utils';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SimpleTooltip } from './ui/tooltip';

/* ---------- Small building blocks shared by the auth screens ---------- */

/** Label + control + hint / inline error. `error` replaces the hint when set. */
export function AuthField({ id, label, required, hint, error, action, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}{required && <span className="text-muted-foreground"> *</span>}</Label>
        {action}
      </div>
      {children}
      {error
        ? <p id={id ? `${id}-error` : undefined} className="flex items-center gap-1.5 text-xs text-danger-700"><CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{error}</p>
        : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Password input with a show / hide icon button inside it. Pass `shown` + `onShownChange` to control it. */
export function PasswordInput({ shown, onShownChange, className, ...props }) {
  const [own, setOwn] = useState(false);
  const visible = shown ?? own;
  const toggle = () => (onShownChange ? onShownChange(!visible) : setOwn((v) => !v));
  const label = visible ? 'Hide password' : 'Show password';
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <SimpleTooltip label={label}>
        <button type="button" onClick={toggle} aria-label={label} aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 focus-visible:ring-offset-0">
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </SimpleTooltip>
    </div>
  );
}

/** Google "G" in its brand colours (lucide has no brand icons). */
export function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}

const HIGHLIGHTS = [
  { icon: Table2, text: 'Tables with filters, search and pagination' },
  { icon: KanbanSquare, text: 'Kanban boards for every team' },
  { icon: ShieldCheck, text: 'Role-based access and audit history' },
];

function Mark({ className = 'size-8 text-sm' }) {
  return (
    <span className={`relative flex flex-none items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 font-bold text-white shadow-xs ring-1 ring-inset ring-white/15 ${className}`}>
      H
    </span>
  );
}

/** Split layout used by Login and Register: brand panel + form area. */
export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden border-r bg-subtle lg:flex lg:w-[44%] lg:max-w-[600px] lg:flex-none lg:flex-col">
        <div className="absolute inset-0 bg-grid [-webkit-mask-image:radial-gradient(ellipse_at_top_left,black_10%,transparent_70%)] [mask-image:radial-gradient(ellipse_at_top_left,black_10%,transparent_70%)]" aria-hidden="true" />
        <div className="absolute -left-32 -top-32 size-[420px] rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 right-[-120px] size-[360px] rounded-full bg-violet-600/10 blur-3xl" aria-hidden="true" />

        <div className="relative flex flex-1 flex-col gap-10 px-10 py-10 xl:px-14 xl:py-12">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="text-md font-semibold tracking-tight">Harbor Admin</span>
          </div>

          <div className="mt-auto flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-card/80 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur">
                <span className="size-1.5 rounded-full bg-success-500" aria-hidden="true" />
                Practice management for accounting firms
              </span>
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-balance">Run accounts, billing and projects from one place.</h1>
            </div>

            <ul className="flex flex-col gap-3">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-base text-muted-foreground">
                  <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-card text-primary shadow-xs">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <figure className="rounded-xl border bg-card/80 p-5 shadow-card backdrop-blur">
              <blockquote className="text-base leading-relaxed text-foreground">
                “We moved every client, job and invoice into Harbor in a weekend. Month-end close went from five days to two.”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700" aria-hidden="true">PR</span>
                <span className="leading-tight">
                  <span className="block text-sm font-medium">Priya Raman</span>
                  <span className="block text-xs text-muted-foreground">Managing partner, Raman &amp; Co.</span>
                </span>
              </figcaption>
            </figure>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>© 2026 Harbor</span>
            <span>Privacy · Terms</span>
          </div>
        </div>
      </aside>

      {/* Form side */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center gap-2.5 border-b px-5 py-4 sm:px-8 lg:hidden">
          <Mark className="size-7 text-[13px]" />
          <span className="font-semibold tracking-tight">Harbor Admin</span>
        </div>
        <div className="flex flex-1 justify-center px-5 py-10 sm:px-8 lg:items-center lg:py-14">{children}</div>
      </main>
    </div>
  );
}
