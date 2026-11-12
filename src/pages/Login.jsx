import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CircleAlert, CircleCheck, KeyRound } from 'lucide-react';
import AuthShell, { AuthField, GoogleIcon, PasswordInput } from '../components/AuthShell';
import { Checkbox } from '../components/ui';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
  const [submitted, setSubmitted] = useState(false);

  // Inline hints appear only after the first submit attempt, then update as the user types.
  const emailError = submitted && !email.includes('@') ? 'Enter a valid email address.' : '';
  const passwordError = submitted && !password ? 'Enter your password.' : '';

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!email.includes('@') || !password) { setError('Enter a valid email and your password.'); return; }
    signIn(email);
    navigate(state?.from || HOME_PATH, { replace: true });
  };

  return (
    <AuthShell>
      <form onSubmit={submit} noValidate className="flex w-full max-w-[400px] flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
          <p className="text-muted-foreground">Welcome back. Enter your details to continue.</p>
        </div>

        {state?.created && (
          <Alert variant="success" role="status">
            <CircleCheck aria-hidden="true" />
            <AlertDescription>Account created. Sign in with your email and new password.</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-4">
          <AuthField id="login-email" label="Email" error={emailError}>
            <Input id="login-email" type="email" autoComplete="email" autoFocus={!email} value={email}
              aria-invalid={!!emailError} aria-describedby={emailError ? 'login-email-error' : undefined}
              onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@company.com" />
          </AuthField>
          <AuthField id="login-password" label="Password" error={passwordError}
            action={<button type="button" className="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline">Forgot password?</button>}>
            <PasswordInput id="login-password" autoComplete="current-password" value={password} shown={show} onShownChange={setShow}
              aria-invalid={!!passwordError} aria-describedby={passwordError ? 'login-password-error' : undefined}
              onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Your password" />
          </AuthField>
          <Checkbox checked={remember} onChange={setRemember} className="self-start">Remember me</Checkbox>
        </div>

        <Button type="submit" size="lg" className="w-full">Sign in<ArrowRight /></Button>

        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Button type="button" variant="outline"><GoogleIcon className="size-4" />Continue with Google</Button>
          <Button type="button" variant="outline"><KeyRound />Continue with SSO</Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          New to Harbor? <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
