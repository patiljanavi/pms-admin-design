import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, House } from 'lucide-react';
import { HOME_PATH } from '../config';
import { EmptyState } from '../components/page';
import { Button } from '../components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="absolute inset-0 bg-grid [-webkit-mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" aria-hidden="true" />
      <div className="relative flex w-full max-w-md flex-col items-center gap-2">
        <span className="font-mono text-sm font-medium tracking-widest text-muted-foreground">404</span>
        <EmptyState icon={Compass} className="py-6"
          title={<span className="text-2xl font-semibold tracking-tight">Page not found</span>}
          description="The link may be old or mistyped."
          action={<>
            <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft />Go back</Button>
            <Button asChild><Link to={HOME_PATH}><House />Go to accounts</Link></Button>
          </>} />
      </div>
    </div>
  );
}
