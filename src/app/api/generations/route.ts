import { NextResponse } from 'next/server';
import { apiContext } from '@/lib/context';
import { serviceConfigured } from '@/lib/env';
import { getModel, estimateCost, type GenKind } from '@/lib/models';
import { modelAvailable } from '@/lib/providers';
import { submitGeneration } from '@/lib/generation-service';
import { adminClient } from '@/lib/supabase/admin';

const KINDS: GenKind[] = ['text_to_video', 'image_to_video', 'image'];
const rate = new Map<string, number[]>();
function limited(uid: string) {
  const now = Date.now(); const hits = (rate.get(uid) || []).filter((t) => now - t < 60_000);
  hits.push(now); rate.set(uid, hits); return hits.length > 10;
}

export async function POST(req: Request) {
  const ctx = await apiContext();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!serviceConfigured()) return NextResponse.json({ error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 503 });
  if (limited(ctx.user.id)) return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });

  const b = await req.json().catch(() => null);
  if (!b || typeof b.prompt !== 'string' || !b.prompt.trim() || b.prompt.length > 2000) return NextResponse.json({ error: 'A prompt of up to 2000 characters is required' }, { status: 400 });
  if (!KINDS.includes(b.type)) return NextResponse.json({ error: 'Unsupported generation type' }, { status: 400 });
  const model = getModel(b.modelId);
  if (!model || !model.kind.includes(b.type)) return NextResponse.json({ error: 'Model does not support this workflow' }, { status: 400 });
  if (!modelAvailable(model)) return NextResponse.json({ error: `${model.name} requires provider integration. Set REPLICATE_API_TOKEN on the server.` }, { status: 503 });
  if (typeof b.idempotencyKey !== 'string' || b.idempotencyKey.length < 8) return NextResponse.json({ error: 'Missing idempotency key' }, { status: 400 });

  // Validate every setting against the catalog.
  if (model.aspectRatios.length) { if (!model.aspectRatios.includes(b.aspectRatio)) return NextResponse.json({ error: 'Unsupported aspect ratio for this model' }, { status: 400 }); }
  else if (b.aspectRatio) b.aspectRatio = undefined;
  if (model.durations.length) { if (!model.durations.includes(Number(b.duration))) return NextResponse.json({ error: 'Unsupported duration for this model' }, { status: 400 }); }
  else b.duration = undefined;
  const count = model.outputs[0] === 'image' ? Math.min(Math.max(parseInt(b.count) || 1, 1), model.maxImages) : undefined;
  const negativePrompt = model.negativePrompt && typeof b.negativePrompt === 'string' && b.negativePrompt.trim() ? b.negativePrompt.slice(0, 1000) : undefined;
  const seed = model.seed && Number.isInteger(b.seed) && b.seed >= 0 ? b.seed : undefined;

  let imageUrl: string | undefined;
  if (b.type === 'image_to_video') {
    if (!b.imageAssetId) return NextResponse.json({ error: 'Upload a source image first' }, { status: 400 });
    const { data: asset } = await ctx.supabase.from('assets').select('storage_path, kind, workspace_id').eq('id', b.imageAssetId).maybeSingle();
    if (!asset || asset.workspace_id !== ctx.workspaceId || asset.kind !== 'image') return NextResponse.json({ error: 'Source image not found' }, { status: 400 });
    const { data: signed } = await adminClient().storage.from('clipgen-media').createSignedUrl(asset.storage_path, 3600);
    imageUrl = signed?.signedUrl;
  }
  let projectId: string | null = null;
  if (b.projectId) {
    const { data: p } = await ctx.supabase.from('projects').select('id').eq('id', b.projectId).maybeSingle();
    projectId = p?.id ?? null;
  }

  let sceneId: string | null = null;
  if (b.sceneId) {
    if (b.type !== 'text_to_video') return NextResponse.json({ error: 'Scenes use text to video' }, { status: 400 });
    const { data: sc } = await ctx.supabase.from('scenes').select('id').eq('id', b.sceneId).maybeSingle();
    if (!sc) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    sceneId = sc.id;
  }
  const cost = estimateCost(model, { duration: b.duration, count });
  try {
    const { generation, duplicate } = await submitGeneration({
      userId: ctx.user.id, workspaceId: ctx.workspaceId, type: sceneId ? 'multi_scene' : b.type, sceneId, model, prompt: b.prompt.trim(), negativePrompt, aspectRatio: b.aspectRatio,
      duration: b.duration, count, seed, imageUrl, projectId, cost, key: b.idempotencyKey, settings: { aspectRatio: b.aspectRatio, duration: b.duration, count, seed },
    });
    return NextResponse.json({ generation, duplicate });
  } catch (e: any) {
    if (e.code === 'insufficient_credits') return NextResponse.json({ error: 'Insufficient credits for this generation', cost }, { status: 402 });
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
