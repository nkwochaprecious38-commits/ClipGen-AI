import Link from 'next/link';
import { getContext } from '@/lib/context';
import { PageHeader, Notice, fmtBytes } from '@/components/ui';
import { updateProfile, updateWorkspace, updateNotificationPrefs } from '../actions';
import { PasswordForm } from '@/components/PasswordForm';
import { replicate } from '@/lib/providers/replicate';

export const metadata = { title: 'Settings' };
const TABS = [['profile', 'Profile'], ['account', 'Account'], ['workspace', 'Workspace'], ['notifications', 'Notifications'], ['security', 'Security'], ['plan', 'Billing and credits'], ['storage', 'Storage'], ['integrations', 'Integrations'], ['api', 'API']];

export default async function Settings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab ?? 'profile'; const ctx = await getContext(); const sb = ctx.supabase;
  const [{ data: prof }, { data: set }, { data: ws }, { data: assets }] = await Promise.all([
    sb.from('profiles').select('full_name').eq('id', ctx.user.id).maybeSingle(), sb.from('user_settings').select('*').eq('user_id', ctx.user.id).maybeSingle(),
    sb.from('workspaces').select('name, owner_id, storage_limit_bytes').eq('id', ctx.workspaceId!).single(), sb.from('assets').select('size_bytes, kind'),
  ]);
  const used = (assets ?? []).reduce((n, a) => n + Number(a.size_bytes), 0); const limit = Number(ws?.storage_limit_bytes ?? 1);
  const isOwner = ws?.owner_id === ctx.user.id;
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Settings sections">{TABS.map(([k, l]) => <Link key={k} href={`?tab=${k}`} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${tab === k ? 'bg-accent/15 text-ink' : 'text-mute hover:bg-card hover:text-ink'}`}>{l}</Link>)}</nav>
        <div className="card max-w-2xl p-6">
          {tab === 'profile' && <form action={updateProfile} className="space-y-4"><h2 className="font-bold">Personal profile</h2><div><label className="label" htmlFor="n">Full name</label><input id="n" name="name" className="input" defaultValue={prof?.full_name} required /></div><div><label className="label">Email</label><input className="input" value={ctx.user.email ?? ''} readOnly /></div><button className="btn-primary">Save profile</button></form>}
          {tab === 'account' && <div className="space-y-3 text-sm"><h2 className="font-bold">Account</h2><dl className="space-y-3"><div className="flex justify-between"><dt className="text-mute">Email</dt><dd>{ctx.user.email}</dd></div><div className="flex justify-between"><dt className="text-mute">Created</dt><dd>{new Date(ctx.user.created_at).toLocaleDateString()}</dd></div><div className="flex justify-between"><dt className="text-mute">User ID</dt><dd className="truncate pl-6 text-xs">{ctx.user.id}</dd></div></dl>
            <form action="/auth/signout" method="post"><button className="btn-danger mt-3">Sign out</button></form></div>}
          {tab === 'workspace' && <form action={updateWorkspace} className="space-y-4"><h2 className="font-bold">Workspace</h2><div><label className="label" htmlFor="w">Workspace name</label><input id="w" name="name" className="input" defaultValue={ws?.name} disabled={!isOwner} required /></div>{isOwner ? <button className="btn-primary">Save workspace</button> : <p className="text-xs text-mute">Only the owner can rename the workspace.</p>}<p className="text-xs text-mute">Team invitations are not available yet.</p></form>}
          {tab === 'notifications' && <form action={updateNotificationPrefs} className="space-y-4"><h2 className="font-bold">Notification preferences</h2>{[['generation', 'Generation results', set?.notify_generation], ['projects', 'Project updates', set?.notify_projects], ['billing', 'Credits and billing', set?.notify_billing], ['system', 'System updates', set?.notify_system]].map(([k, l, v]) => <label key={k as string} className="flex items-center gap-3 text-sm"><input type="checkbox" name={k as string} defaultChecked={!!v} className="accent-[#8B5CF6]" />{l}</label>)}<button className="btn-primary">Save preferences</button><p className="text-xs text-mute">Preferences are stored. Email delivery is not connected, so notifications appear in the app only.</p></form>}
          {tab === 'security' && <div className="space-y-4"><h2 className="font-bold">Security</h2><PasswordForm /></div>}
          {tab === 'plan' && <div className="space-y-3 text-sm"><h2 className="font-bold">Billing and credits</h2><p className="text-mute">Manage your plan on the billing page and review credit usage on the credits page.</p><div className="flex gap-2"><Link href="/app/billing" className="btn-primary">Billing</Link><Link href="/app/credits" className="btn-ghost">Credits</Link></div></div>}
          {tab === 'storage' && <div className="space-y-3 text-sm"><h2 className="font-bold">Storage usage</h2><div className="h-2 rounded bg-line"><div className="h-2 rounded bg-accent" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} /></div><p className="text-mute">{fmtBytes(used)} of {fmtBytes(limit)} used across {assets?.length ?? 0} files.</p></div>}
          {tab === 'integrations' && <div className="space-y-4 text-sm"><h2 className="font-bold">Connected integrations</h2>
            <div className="flex items-center justify-between rounded-lg border border-line p-4"><div><p className="font-medium">Replicate</p><p className="text-xs text-mute">Video and image generation models</p></div><span className={`chip ${replicate.configured() ? 'text-ok' : 'text-warn'}`}>{replicate.configured() ? 'Connected' : 'Not configured'}</span></div>
            {!replicate.configured() && <Notice tone="warn"><p>Set REPLICATE_API_TOKEN in the server environment. Keys are read only on the server and are never sent to the browser.</p></Notice>}
            <div className="flex items-center justify-between rounded-lg border border-line p-4"><div><p className="font-medium">Selar</p><p className="text-xs text-mute">Subscription checkout</p></div><span className="chip text-warn">Checkout only</span></div></div>}
          {tab === 'api' && <div className="space-y-2 text-sm"><h2 className="font-bold">API settings</h2><p className="text-mute">Public API access for workspaces is not available yet. Provider API keys are configured server side through environment variables.</p></div>}
        </div>
      </div>
    </>
  );
}
