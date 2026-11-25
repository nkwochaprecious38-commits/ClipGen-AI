import 'server-only';
import { adminClient } from './supabase/admin';
import { getProvider, buildInput } from './providers';
import { getModel, type ModelDef } from './models';
import { safeName } from './context';

async function notify(userId: string, workspaceId: string, category: string, title: string, body: string, link: string) {
  await adminClient().from('notifications').insert({ user_id: userId, workspace_id: workspaceId, category, title, body, link });
}

export async function failGeneration(gen: any, message: string, jobPatch: Record<string, unknown> = {}) {
  const db = adminClient();
  await db.from('scenes').update({ status: 'failed' }).eq('generation_id', gen.id);
  await db.from('generations').update({ status: 'failed', error: message, updated_at: new Date().toISOString() }).eq('id', gen.id);
  await db.from('generation_jobs').update({ status: 'failed', last_error: message, updated_at: new Date().toISOString(), ...jobPatch }).eq('generation_id', gen.id);
  const { data: bal } = await db.rpc('refund_credits', { p_generation: gen.id, p_reason: 'Refund for failed generation' });
  await notify(gen.user_id, gen.workspace_id, 'generation', 'Generation failed', `${message}${bal !== null ? ' Credits were refunded.' : ''}`, '/app/history');
}

export async function submitGeneration(args: {
  userId: string; workspaceId: string; type: string; model: ModelDef; prompt: string; negativePrompt?: string; aspectRatio?: string;
  duration?: number; count?: number; seed?: number; imageUrl?: string; projectId?: string | null; sceneId?: string | null; cost: number; key: string; settings: Record<string, unknown>;
}) {
  const db = adminClient();
  const { data: existing } = await db.from('generations').select('*').eq('workspace_id', args.workspaceId).eq('idempotency_key', args.key).maybeSingle();
  if (existing) return { generation: existing, duplicate: true };

  const { data: gen, error } = await db.from('generations').insert({
    workspace_id: args.workspaceId, user_id: args.userId, project_id: args.projectId ?? null, type: args.type, model_id: args.model.id,
    provider: args.model.provider, prompt: args.prompt, negative_prompt: args.negativePrompt ?? null, settings: args.settings,
    status: 'queued', credit_cost: args.cost, idempotency_key: args.key,
  }).select('*').single();
  if (error || !gen) throw new Error(error?.message || 'Could not create generation');

  const { error: rErr } = await db.rpc('reserve_credits', {
    p_workspace: args.workspaceId, p_user: args.userId, p_amount: args.cost, p_generation: gen.id, p_key: `reserve:${gen.id}`, p_reason: `${args.type} with ${args.model.name}`,
  });
  if (rErr) {
    await db.from('generations').delete().eq('id', gen.id);
    if (rErr.message.includes('insufficient_credits')) throw Object.assign(new Error('Insufficient credits'), { code: 'insufficient_credits' });
    throw new Error('Could not reserve credits');
  }

  if (args.sceneId) await db.from('scenes').update({ generation_id: gen.id, status: 'queued', updated_at: new Date().toISOString() }).eq('id', args.sceneId);
  const provider = getProvider(args.model.provider);
  try {
    const input = buildInput(args.model, args);
    const { jobId } = await provider.submit(args.model.providerModel, input);
    await db.from('generation_jobs').insert({ generation_id: gen.id, provider: provider.id, provider_job_id: jobId, status: 'processing', attempts: 1 });
    await db.from('generations').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', gen.id);
    if (args.sceneId) await db.from('scenes').update({ status: 'processing' }).eq('id', args.sceneId);
    gen.status = 'processing';
  } catch (e: any) {
    await db.from('generation_jobs').insert({ generation_id: gen.id, provider: provider.id, status: 'failed', attempts: 1, last_error: e.message });
    await failGeneration(gen, e.message || 'Provider request failed');
    gen.status = 'failed'; gen.error = e.message;
  }
  return { generation: gen, duplicate: false };
}

// Polls the provider and finalizes the generation exactly once.
export async function refreshGeneration(genId: string) {
  const db = adminClient();
  const { data: gen } = await db.from('generations').select('*').eq('id', genId).single();
  if (!gen || !['queued', 'processing'].includes(gen.status)) return gen;
  const { data: job } = await db.from('generation_jobs').select('*').eq('generation_id', genId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!job?.provider_job_id) return gen;
  const provider = getProvider(job.provider);
  let result;
  try { result = await provider.poll(job.provider_job_id); }
  catch (e: any) {
    await db.from('generation_jobs').update({ last_error: e.message, attempts: job.attempts + 1, updated_at: new Date().toISOString() }).eq('id', job.id);
    return gen; // transient: keep polling
  }
  if (result.status === 'processing') return gen;

  // Claim finalization so concurrent polls cannot duplicate assets or refunds.
  const { data: claimed } = await db.from('generation_jobs').update({ status: 'finalizing', updated_at: new Date().toISOString() }).eq('id', job.id).eq('status', 'processing').select('id');
  if (!claimed?.length) return (await db.from('generations').select('*').eq('id', genId).single()).data;

  if (result.status === 'failed') { await failGeneration(gen, result.error || 'Generation failed'); return (await db.from('generations').select('*').eq('id', genId).single()).data; }
  if (result.status === 'cancelled') {
    await db.from('generations').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', genId);
    await db.from('generation_jobs').update({ status: 'cancelled' }).eq('id', job.id);
    await db.rpc('refund_credits', { p_generation: genId, p_reason: 'Refund for cancelled generation' });
    return (await db.from('generations').select('*').eq('id', genId).single()).data;
  }

  try {
    const model = getModel(gen.model_id);
    const ids: string[] = [];
    for (let i = 0; i < result.outputs.length; i++) {
      const res = await fetch(result.outputs[i]);
      if (!res.ok) throw new Error('Could not download generated output');
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = (res.headers.get('content-type') || '').split(';')[0] || (model?.outputs[0] === 'video' ? 'video/mp4' : 'image/png');
      const kind = mime.startsWith('video') ? 'video' : 'image';
      const ext = mime.split('/')[1]?.replace('quicktime', 'mov') || 'bin';
      const path = `${gen.workspace_id}/${crypto.randomUUID()}-${safeName(`generated-${i + 1}.${ext}`)}`;
      const up = await db.storage.from('clipgen-media').upload(path, buf, { contentType: mime });
      if (up.error) throw new Error(up.error.message);
      const { data: asset, error } = await db.from('assets').insert({
        workspace_id: gen.workspace_id, uploaded_by: gen.user_id, project_id: gen.project_id, kind, origin: 'generated',
        name: `${gen.prompt.slice(0, 40)}${gen.prompt.length > 40 ? '...' : ''}`, storage_path: path, mime_type: mime, size_bytes: buf.length, generation_id: gen.id,
      }).select('id').single();
      if (error) throw new Error(error.message);
      ids.push(asset.id);
    }
    await db.from('scenes').update({ status: 'completed' }).eq('generation_id', genId);
    await db.from('generations').update({ status: 'completed', output_asset_ids: ids, updated_at: new Date().toISOString() }).eq('id', genId);
    await db.from('generation_jobs').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', job.id);
    await notify(gen.user_id, gen.workspace_id, 'generation', gen.type === 'image' ? 'Image generation complete' : 'Video generation complete', gen.prompt.slice(0, 80), '/app/history');
  } catch (e: any) {
    await failGeneration(gen, e.message || 'Could not store output');
  }
  return (await db.from('generations').select('*').eq('id', genId).single()).data;
}
