import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { supabaseConfigured } from './env';

export async function getContext() {
  if (!supabaseConfigured()) redirect('/login');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: member } = await supabase.from('workspace_members').select('workspace_id, workspaces:clipgen_workspaces(name)').eq('user_id', user.id).order('created_at').limit(1).maybeSingle();
  if (!member) {
    // Account exists (for example created elsewhere in this Supabase project) but has no ClipGen workspace yet.
    const { error } = await supabase.rpc('ensure_workspace');
    if (!error) {
      const { data: again } = await supabase.from('workspace_members').select('workspace_id, workspaces:clipgen_workspaces(name)').eq('user_id', user.id).limit(1).maybeSingle();
      if (again) { const w: any = again.workspaces; return { supabase, user, workspaceId: again.workspace_id as string, workspaceName: (Array.isArray(w) ? w[0]?.name : w?.name) as string }; }
    }
    return { supabase, user, workspaceId: null as string | null, workspaceName: '' };
  }
  const ws: any = member.workspaces;
  return { supabase, user, workspaceId: member.workspace_id as string, workspaceName: (Array.isArray(ws) ? ws[0]?.name : ws?.name) as string };
}

export async function apiContext() {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).order('created_at').limit(1).maybeSingle();
  if (!member) {
    const { data: ws } = await supabase.rpc('ensure_workspace');
    return ws ? { supabase, user, workspaceId: ws as string } : null;
  }
  return { supabase, user, workspaceId: member.workspace_id as string };
}

export const ALLOWED_MIME: Record<string, 'video' | 'image' | 'audio'> = {
  'video/mp4': 'video', 'video/quicktime': 'video', 'video/webm': 'video',
  'image/png': 'image', 'image/jpeg': 'image', 'image/webp': 'image', 'image/gif': 'image',
  'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/mp4': 'audio', 'audio/ogg': 'audio',
};
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
export const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80) || 'file';
