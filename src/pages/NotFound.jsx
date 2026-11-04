import { Link } from 'react-router-dom';
import { HOME_PATH } from '../config';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted">The link may be old or mistyped.</p>
      <Link to={HOME_PATH} className="btn-primary">Go to accounts</Link>
    </div>
  );
}
