'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function AuthForm({ mode, configured }: { mode: Mode; configured: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const plan = sp.get('plan');
  const next = sp.get('next');
  const dest = plan ? `/app/billing?plan=${encodeURIComponent(plan)}` : next && next.startsWith('/app') ? next : '/app';

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setInfo('');
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '').trim();
    const password = String(f.get('password') || '');
    const name = String(f.get('name') || '').trim();
    if (mode !== 'reset' && !emailOk(email)) return setError('Enter a valid email address.');
    if ((mode === 'signup' || mode === 'reset') && password.length < 8) return setError('Password must be at least 8 characters.');
    if ((mode === 'signup' || mode === 'reset') && !/[A-Za-z]/.test(password) || (mode === 'signup' || mode === 'reset') && !/\d/.test(password)) return setError('Password must include a letter and a number.');
    if ((mode === 'signup' || mode === 'reset') && password !== String(f.get('confirm'))) return setError('Passwords do not match.');
    if (mode === 'signup' && !name) return setError('Enter your full name.');
    if (mode === 'signup' && !f.get('terms')) return setError('Accept the terms to continue.');
    setBusy(true);
    const sb = createClient();
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(dest); router.refresh();
      } else if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name, app: 'clipgen' }, emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(dest)}` } });
        if (error) throw error;
        if (data.session) { router.replace(dest); router.refresh(); }
        else setInfo('Check your email to confirm your account, then log in.');
      } else if (mode === 'forgot') {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setInfo('If an account exists for that email, a reset link is on its way.');
      } else {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        router.replace('/app'); router.refresh();
      }
    } catch (err: any) { setError(err?.message || 'Something went wrong. Try again.'); }
    setBusy(false);
  }

  const titles = { login: 'Log in to ClipGen AI', signup: 'Create your account', forgot: 'Reset your password', reset: 'Choose a new password' };
  return (
    <form onSubmit={submit} className="card space-y-4 p-7" noValidate>
      <h1 className="text-2xl font-extrabold">{titles[mode]}</h1>
      {mode === 'signup' && <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" className="input" autoComplete="name" required /></div>}
      {mode !== 'reset' && <div><label className="label" htmlFor="email">Email address</label><input id="email" name="email" type="email" className="input" autoComplete="email" required /></div>}
      {mode !== 'forgot' && (
        <div><label className="label" htmlFor="password">{mode === 'reset' ? 'New password' : 'Password'}</label>
          <input id="password" name="password" type="password" className="input" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
          {(mode === 'signup' || mode === 'reset') && <p className="mt-1.5 text-xs text-mute">At least 8 characters with a letter and a number.</p>}</div>
      )}
      {(mode === 'signup' || mode === 'reset') && <div><label className="label" htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" required /></div>}
      {mode === 'signup' && <label className="flex items-start gap-2 text-xs text-mute"><input type="checkbox" name="terms" className="mt-0.5 accent-[#8B5CF6]" />I agree to the terms of service and privacy policy.</label>}
      {mode === 'login' && <div className="text-right"><Link href="/forgot-password" className="text-xs text-accent2 hover:underline">Forgot password</Link></div>}
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {info && <p role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{info}</p>}
      <button className="btn-primary w-full" disabled={busy || !configured}>
        {busy && <Loader2 size={16} className="animate-spin" />}
        {{ login: 'Login', signup: 'Create account', forgot: 'Send reset link', reset: 'Update password' }[mode]}
      </button>
      <p className="text-center text-sm text-mute">
        {mode === 'login' && <>New to ClipGen AI? <Link href="/signup" className="text-accent2 hover:underline">Create an account</Link></>}
        {mode === 'signup' && <>Already have an account? <Link href="/login" className="text-accent2 hover:underline">Login</Link></>}
        {mode === 'forgot' && <Link href="/login" className="text-accent2 hover:underline">Back to login</Link>}
      </p>
    </form>
  );
}
