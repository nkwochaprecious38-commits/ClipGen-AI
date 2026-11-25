import { NextResponse } from 'next/server';
import { apiContext } from '@/lib/context';
import { refreshGeneration } from '@/lib/generation-service';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await apiContext();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: own } = await ctx.supabase.from('generations').select('id').eq('id', id).maybeSingle(); // RLS enforced
  if (!own) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const gen = await refreshGeneration(id);
  let outputs: { id: string; kind: string; url: string | null }[] = [];
  if (gen?.status === 'completed' && gen.output_asset_ids?.length) {
    const { data: assets } = await ctx.supabase.from('assets').select('id, kind, storage_path').in('id', gen.output_asset_ids);
    outputs = await Promise.all((assets || []).map(async (a) => {
      const { data } = await ctx.supabase.storage.from('clipgen-media').createSignedUrl(a.storage_path, 3600);
      return { id: a.id, kind: a.kind, url: data?.signedUrl ?? null };
    }));
  }
  return NextResponse.json({ generation: gen, outputs });
}
