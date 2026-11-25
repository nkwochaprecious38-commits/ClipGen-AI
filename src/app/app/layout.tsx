import type { Metadata } from 'next';
import { getContext } from '@/lib/context';
import { AppShell } from '@/components/AppShell';
import { getPlan } from '@/lib/plans';

export const metadata: Metadata = { title: 'Workspace', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, workspaceId, workspaceName } = await getContext();
  if (!workspaceId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Workspace setup is incomplete</h1>
        <p className="mt-3 text-sm text-mute">Your account exists but no workspace was found. The ClipGen database schema may not be installed or exposed. Run supabase/migrations/0001_init.sql, then add clipgen under Settings, API, Exposed schemas, and reload this page.</p>
        <form action="/auth/signout" method="post"><button className="btn-ghost mt-6">Sign out</button></form>
      </div>
    );
  }
  const [{ data: bal }, { data: sub }, { count }, { data: prof }] = await Promise.all([
    supabase.from('credit_balances').select('balance').eq('workspace_id', workspaceId).maybeSingle(),
    supabase.from('subscriptions').select('plan_key, status').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ]);
  const plan = sub?.status === 'active' ? getPlan(sub.plan_key)?.name ?? 'Active plan' : sub ? 'Payment pending' : 'No plan';
  return <AppShell name={prof?.full_name || user.email || ''} workspace={workspaceName} credits={bal?.balance ?? 0} plan={plan} unread={count ?? 0}>{children}</AppShell>;
}
