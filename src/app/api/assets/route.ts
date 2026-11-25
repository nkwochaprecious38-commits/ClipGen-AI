import { NextResponse } from 'next/server';
import { apiContext, ALLOWED_MIME, MAX_UPLOAD_BYTES } from '@/lib/context';
import { serviceConfigured } from '@/lib/env';
import { adminClient } from '@/lib/supabase/admin';

// Registers an object the browser already uploaded to the private "media" bucket.
export async function POST(req: Request) {
  const ctx = await apiContext();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || typeof b.path !== 'string' || typeof b.name !== 'string') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const kind = ALLOWED_MIME[b.mime];
  if (!kind) return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  if (!b.path.startsWith(`${ctx.workspaceId}/`) || b.path.includes('..')) return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });

  // Verify the object really exists and measure its true size server side.
  const folder = b.path.split('/').slice(0, -1).join('/');
  const file = b.path.split('/').pop()!;
  const db = serviceConfigured() ? adminClient() : null;
  const store = (db ?? ctx.supabase).storage.from('clipgen-media');
  const { data: listed } = await store.list(folder, { search: file, limit: 5 });
  const obj: any = listed?.find((o) => o.name === file);
  if (!obj) return NextResponse.json({ error: 'Upload not found in storage' }, { status: 400 });
  const size = Number(obj.metadata?.size ?? 0);
  if (size > MAX_UPLOAD_BYTES) { await store.remove([b.path]); return NextResponse.json({ error: 'File exceeds the 500 MB limit' }, { status: 413 }); }

  const { data: ws } = await ctx.supabase.from('workspaces').select('storage_limit_bytes').eq('id', ctx.workspaceId).single();
  const { data: used } = await ctx.supabase.from('assets').select('size_bytes').eq('workspace_id', ctx.workspaceId);
  const total = (used || []).reduce((n, a) => n + Number(a.size_bytes), 0) + size;
  if (ws && total > Number(ws.storage_limit_bytes)) { await store.remove([b.path]); return NextResponse.json({ error: 'Workspace storage limit reached' }, { status: 413 }); }

  const { data: asset, error } = await ctx.supabase.from('assets').insert({
    workspace_id: ctx.workspaceId, uploaded_by: ctx.user.id, kind, origin: 'uploaded', name: b.name.slice(0, 200), storage_path: b.path,
    mime_type: b.mime, size_bytes: size, project_id: b.projectId || null, folder_id: b.folderId || null,
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await ctx.supabase.from('notifications').insert({ user_id: ctx.user.id, workspace_id: ctx.workspaceId, category: 'assets', title: 'Asset uploaded', body: asset.name, link: '/app/assets' });
  return NextResponse.json({ asset });
}
