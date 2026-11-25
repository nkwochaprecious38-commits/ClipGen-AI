import { NextResponse } from 'next/server';
import { apiContext } from '@/lib/context';
import { adminClient } from '@/lib/supabase/admin';
import { getProvider } from '@/lib/providers';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await apiContext();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: gen } = await ctx.supabase.from('generations').select('*').eq('id', id).maybeSingle();
  if (!gen) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!['queued', 'processing'].includes(gen.status)) return NextResponse.json({ error: 'Generation already finished' }, { status: 409 });
  const db = adminClient();
  const { data: job } = await db.from('generation_jobs').select('*').eq('generation_id', id).limit(1).maybeSingle();
  try { if (job?.provider_job_id) await getProvider(job.provider).cancel(job.provider_job_id); } catch { /* provider may have finished */ }
  const { data: won } = await db.from('generations').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id).in('status', ['queued', 'processing']).select('id');
  if (won?.length) { await db.from('generation_jobs').update({ status: 'cancelled' }).eq('generation_id', id); await db.rpc('refund_credits', { p_generation: id, p_reason: 'Refund for cancelled generation' }); }
  return NextResponse.json({ ok: true });
}
