import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Checkbox } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { HOME_PATH } from '../config';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!email.includes('@') || !password) { setError('Enter a valid email and your password.'); return; }
    signIn(email);
    navigate(state?.from || HOME_PATH, { replace: true });
  };

  return (
    <AuthShell>
      <form onSubmit={submit} noValidate className="flex w-full max-w-[420px] flex-col gap-5 lg:mt-20">
        <div>
          <h2 className="text-3xl font-bold">Sign in</h2>
          <p className="mt-1.5 text-muted">Welcome back. Enter your details to continue.</p>
        </div>
        {state?.created && <div role="status" className="rounded bg-success-50 px-3.5 py-3 font-semibold text-success-700">Account created. Sign in with your email and new password.</div>}
        {error && <div role="alert" className="rounded bg-danger-50 px-3.5 py-3 font-semibold text-danger-700">{error}</div>}
        <label className="field-label">Email
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@company.com" />
        </label>
        <label className="field-label">Password
          <span className="flex gap-2">
            <input className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Your password" />
            <button type="button" className="btn-secondary px-3.5" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</button>
          </span>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox checked={remember} onChange={setRemember}>Remember me</Checkbox>
          <button type="button" className="btn-link">Forgot password?</button>
        </div>
        <button type="submit" className="btn-primary w-full">Sign in</button>
        <div className="flex items-center gap-3 text-sm text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button type="button" className="btn-secondary">Continue with Google</button>
          <button type="button" className="btn-secondary">Continue with SSO</button>
        </div>
        <p className="text-center text-muted">New to Harbor? <Link to="/register" className="btn-link">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
