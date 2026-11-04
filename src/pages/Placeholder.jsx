import { Link, useSearchParams } from 'react-router-dom';
import { ACCOUNTS_PATH } from '../config';

/** Shown for menu pages that are routed but not built yet. */
const NEW_LABEL = { contact: 'Contact', job: 'Job', invoice: 'Invoice', chat: 'Chat', payment: 'Offline payment' };

export default function Placeholder({ title, section }) {
  const [params] = useSearchParams();
  const fromQuick = NEW_LABEL[params.get('new')];
  return (
    <div className="flex flex-col gap-6">
      {fromQuick && (
        <div role="status" className="rounded-md border border-brand-100 bg-brand-50 px-4 py-3 text-brand-800">
          <b>New {fromQuick.toLowerCase()}</b> was chosen in Quick create. Build its form on this page; the link already works.
        </div>
      )}
      <header>
        <div className="text-sm text-muted">{section === title ? 'Admin' : `Admin / ${section}`}</div>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
      </header>
      <section className="card flex flex-col items-start gap-3 p-6 sm:p-8">
        <h2 className="text-lg font-semibold">This page is ready for content</h2>
        <p className="max-w-[60ch] text-muted">The route and sidebar link work. Build the screen in <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-sm">src/pages</code> and add it to <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-sm">SCREENS</code> in <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-sm">src/App.js</code>.</p>
        <Link to={ACCOUNTS_PATH} className="btn-secondary">Open Accounts</Link>
      </section>
    </div>
  );
}
