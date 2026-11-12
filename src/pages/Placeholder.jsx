import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Construction, Sparkles } from 'lucide-react';
import { ACCOUNTS_PATH } from '../config';
import { EmptyState, PageHeader } from '../components/page';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';

/** Shown for menu pages that are routed but not built yet. */
const NEW_LABEL = { contact: 'Contact', job: 'Job', invoice: 'Invoice', chat: 'Chat', payment: 'Offline payment' };

const Code = ({ children }) => <code className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{children}</code>;

export default function Placeholder({ title, section }) {
  const [params] = useSearchParams();
  const fromQuick = NEW_LABEL[params.get('new')];
  return (
    <div className="page">
      <PageHeader title={title} eyebrow={section === title ? undefined : section} />

      {fromQuick && (
        <Alert variant="info" role="status">
          <Sparkles aria-hidden="true" />
          <AlertTitle>New {fromQuick.toLowerCase()} was chosen in Quick create</AlertTitle>
          <AlertDescription>Build its form on this page; the link already works.</AlertDescription>
        </Alert>
      )}

      <section className="relative overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="absolute inset-0 bg-grid opacity-60 [-webkit-mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden="true" />
        <EmptyState icon={Construction} className="relative"
          title="This page is ready for content"
          description={<>The route and sidebar link work. Build the screen in <Code>src/pages</Code> and add it to <Code>SCREENS</Code> in <Code>src/App.js</Code>.</>}
          action={<Button variant="outline" asChild><Link to={ACCOUNTS_PATH}>Open Accounts<ArrowRight /></Link></Button>} />
      </section>
    </div>
  );
}
