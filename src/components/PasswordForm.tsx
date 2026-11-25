'use client';
import { useActionState } from 'react';
import { changePassword } from '@/app/app/actions';
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as { error?: string; ok?: boolean });
  return (
    <form action={action} className="space-y-4">
      <div><label className="label" htmlFor="pw">New password</label><input id="pw" name="password" type="password" className="input" autoComplete="new-password" required /></div>
      <div><label className="label" htmlFor="pc">Confirm new password</label><input id="pc" name="confirm" type="password" className="input" autoComplete="new-password" required /></div>
      {state.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}{state.ok && <p role="status" className="text-sm text-ok">Password updated.</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Updating' : 'Update password'}</button>
    </form>
  );
}
