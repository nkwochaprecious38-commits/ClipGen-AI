'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Download, RefreshCw, FolderPlus, X, AlertTriangle, Zap } from 'lucide-react';
import { estimateCost, type GenKind, type ModelDef } from '@/lib/models';
import { Uploader, ACCEPT } from './Uploader';
import { saveGenerationToProject } from '@/app/app/actions';

type M = ModelDef & { available: boolean };
type Out = { id: string; kind: string; url: string | null };
type Gen = { id: string; status: string; error?: string | null; credit_cost: number };
export type SocialPreset = { platform: string; formats: { name: string; ratio: string }[] };

const GUIDANCE = ['Name the subject and what it is doing', 'Describe the camera: aerial, tracking, close up, handheld', 'Set the environment, time of day and light', 'State the style: cinematic, documentary, animated'];

export function Generator(props: {
  kind: GenKind; models: M[]; workspaceId: string; credits: number; projects: { id: string; title: string }[];
  initialPrompt?: string; initialProject?: string; type?: string; social?: SocialPreset[]; variations?: { id: string; prompt: string }[];
}) {
  const { kind, models, projects } = props;
  const router = useRouter();
  const [modelId, setModelId] = useState(models.find((m) => m.available)?.id ?? models[0]?.id);
  const model = models.find((m) => m.id === modelId)!;
  const [prompt, setPrompt] = useState(props.initialPrompt ?? '');
  const [negative, setNegative] = useState('');
  const [motion, setMotion] = useState('');
  const [ratio, setRatio] = useState('');
  const [duration, setDuration] = useState(0);
  const [count, setCount] = useState(1);
  const [seed, setSeed] = useState('');
  const [projectId, setProjectId] = useState(props.initialProject ?? '');
  const [image, setImage] = useState<{ id: string; preview: string; name: string } | null>(null);
  const [platform, setPlatform] = useState(props.social?.[0]?.platform ?? '');
  const [format, setFormat] = useState(0);
  const [gen, setGen] = useState<Gen | null>(null);
  const [outputs, setOutputs] = useState<Out[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const key = useRef<string>('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const social = props.social?.find((s) => s.platform === platform);
  const wantRatio = social ? social.formats[format]?.ratio : undefined;
  useEffect(() => {
    if (!model) return;
    const pref = wantRatio && model.aspectRatios.includes(wantRatio) ? wantRatio : model.aspectRatios[0] ?? '';
    setRatio(pref); setDuration(model.durations[0] ?? 0); setCount(1);
  }, [modelId, wantRatio]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const cost = useMemo(() => (model ? estimateCost(model, { duration: duration || undefined, count }) : 0), [model, duration, count]);
  const running = gen && ['queued', 'processing'].includes(gen.status);
  const fullPrompt = [prompt.trim(), motion.trim() && `Motion: ${motion.trim()}`].filter(Boolean).join('. ');

  async function poll(id: string) {
    try {
      const r = await fetch(`/api/generations/${id}`); const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setGen(b.generation); setOutputs(b.outputs || []);
      if (['queued', 'processing'].includes(b.generation.status)) timer.current = setTimeout(() => poll(id), 3000);
      else { setBusy(false); router.refresh(); }
    } catch (e: any) { setError(e.message || 'Lost connection to the job. Refresh to check its status.'); setBusy(false); }
  }

  async function submit(regenerate = false) {
    setError(''); setSaved(false);
    if (!prompt.trim()) return setError('Enter a prompt first.');
    if (kind === 'image_to_video' && !image) return setError('Upload a source image first.');
    if (!model?.available) return setError(`${model?.name ?? 'This model'} requires provider integration.`);
    if (cost > props.credits) return setError(`This generation costs ${cost} credits but you have ${props.credits}.`);
    if (regenerate || !key.current) key.current = crypto.randomUUID();
    setBusy(true); setOutputs([]); setGen({ id: '', status: 'queued', credit_cost: cost });
    try {
      const r = await fetch('/api/generations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        type: kind, modelId, prompt: fullPrompt, negativePrompt: negative || undefined, aspectRatio: ratio || undefined, duration: duration || undefined, count: model.outputs[0] === 'image' ? count : undefined,
        seed: seed !== '' ? Number(seed) : undefined, imageAssetId: image?.id, projectId: projectId || undefined, idempotencyKey: key.current }) });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || 'Generation failed');
      setGen(b.generation); router.refresh();
      if (b.generation.status === 'failed') { setError(b.generation.error || 'Generation failed. Credits were refunded.'); setBusy(false); }
      else poll(b.generation.id);
    } catch (e: any) { setError(e.message); setBusy(false); setGen(null); }
    finally { if (!regenerate) key.current = key.current; }
  }
  async function cancel() { if (!gen?.id) return; await fetch(`/api/generations/${gen.id}/cancel`, { method: 'POST' }); if (timer.current) clearTimeout(timer.current); poll(gen.id); }
  async function save() {
    if (!gen?.id || !projectId) return setError('Choose a project to save to.');
    const r = await saveGenerationToProject(gen.id, projectId); if (r.error) setError(r.error); else { setSaved(true); router.refresh(); }
  }

  if (!models.length) return null;
  const isImg = model.outputs[0] === 'image';
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-5">
        {!model.available && (
          <div className="flex gap-3 rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm text-mute" role="alert"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
            <p><strong className="text-ink">{model.name}</strong> requires provider integration. Set REPLICATE_API_TOKEN on the server to enable generation. The controls below are previewed but cannot run yet.</p></div>
        )}
        <div>
          <label className="label" htmlFor="model">Model</label>
          <select id="model" className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}{m.available ? '' : ' (integration required)'}</option>)}
          </select>
          <p className="mt-1.5 text-xs text-mute">Input: {model.inputs.join(' and ')}. Output: {model.outputs.join(', ')}. {model.note}</p>
        </div>
        {props.social && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="platform">Platform</label><select id="platform" className="input" value={platform} onChange={(e) => { setPlatform(e.target.value); setFormat(0); }}>{props.social.map((s) => <option key={s.platform}>{s.platform}</option>)}</select></div>
            <div><label className="label" htmlFor="format">Content format</label><select id="format" className="input" value={format} onChange={(e) => setFormat(Number(e.target.value))}>{social?.formats.map((f, i) => <option key={f.name} value={i}>{f.name} ({f.ratio})</option>)}</select></div>
            {wantRatio && !model.aspectRatios.includes(wantRatio) && <p className="col-span-2 text-xs text-warn">{model.aspectRatios.length ? `${wantRatio} is not supported by this model. ${ratio} will be used.` : 'This model uses a fixed format. Crop to the platform format after download.'}</p>}
          </div>
        )}
        {props.variations && props.variations.length > 0 && (
          <div><label className="label" htmlFor="src">Start from a past generation</label>
            <select id="src" className="input" defaultValue="" onChange={(e) => { const v = props.variations!.find((x) => x.id === e.target.value); if (v) setPrompt(v.prompt); }}>
              <option value="">Choose an original</option>{props.variations.map((v) => <option key={v.id} value={v.id}>{v.prompt.slice(0, 60)}</option>)}</select>
            <div className="mt-2 flex flex-wrap gap-1.5">{['different background', 'different visual style', 'different time of day', 'different camera angle', 'different product scene'].map((m) => (
              <button type="button" key={m} className="chip hover:border-accent hover:text-ink" onClick={() => setPrompt((p) => `${p.replace(/, variation:.*$/, '')}, variation: ${m}`)}>{m}</button>))}</div></div>
        )}
        {kind === 'image_to_video' && (
          <div>
            <p className="label">Source image</p>
            {image ? (
              <div className="relative overflow-hidden rounded-xl border border-line"><img src={image.preview} alt="Source preview" className="max-h-56 w-full object-contain bg-bg2" />
                <button className="absolute right-2 top-2 rounded-full bg-bg/80 p-1.5" aria-label="Remove image" onClick={() => setImage(null)}><X size={14} /></button></div>
            ) : <Uploader workspaceId={props.workspaceId} accept={ACCEPT.image} label="Upload an image" compact onDone={(a, f) => setImage({ id: a.id, preview: URL.createObjectURL(f), name: a.name })} />}
          </div>
        )}
        <div>
          <label className="label" htmlFor="prompt">Prompt</label>
          <textarea id="prompt" className="input min-h-28" maxLength={2000} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={kind === 'image' ? 'Describe the image you want' : 'Describe the scene, motion, camera and style'} />
          <details className="mt-2 text-xs text-mute"><summary className="cursor-pointer text-accent2">Prompt guidance</summary><ul className="mt-2 list-disc space-y-1 pl-4">{GUIDANCE.map((g) => <li key={g}>{g}</li>)}</ul></details>
        </div>
        {kind === 'image_to_video' && <div><label className="label" htmlFor="motion">Motion guidance</label><input id="motion" className="input" value={motion} onChange={(e) => setMotion(e.target.value)} placeholder="Slow push in, hair moves in the wind" /></div>}
        {model.negativePrompt && <div><label className="label" htmlFor="neg">Negative prompt</label><input id="neg" className="input" value={negative} onChange={(e) => setNegative(e.target.value)} placeholder="Blurry, distorted, text overlays" /></div>}
        <div className="grid grid-cols-2 gap-3">
          {model.aspectRatios.length > 0 && <div><label className="label" htmlFor="ratio">Aspect ratio</label><select id="ratio" className="input" value={ratio} onChange={(e) => setRatio(e.target.value)}>{model.aspectRatios.map((r) => <option key={r}>{r}</option>)}</select></div>}
          {model.durations.length > 0 && <div><label className="label" htmlFor="dur">Duration</label><select id="dur" className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{model.durations.map((d) => <option key={d} value={d}>{d} seconds</option>)}</select></div>}
          {isImg && model.maxImages > 1 && <div><label className="label" htmlFor="count">Image count</label><select id="count" className="input" value={count} onChange={(e) => setCount(Number(e.target.value))}>{Array.from({ length: model.maxImages }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}</select></div>}
          {model.seed && <div><label className="label" htmlFor="seed">Seed (optional)</label><input id="seed" className="input" inputMode="numeric" value={seed} onChange={(e) => setSeed(e.target.value.replace(/\D/g, ''))} /></div>}
        </div>
        {model.aspectRatios.length === 0 && model.durations.length === 0 && !isImg && <p className="text-xs text-mute">This model has no adjustable aspect ratio, resolution or duration.</p>}
        <div>
          <label className="label" htmlFor="project">Save to project (optional)</label>
          <select id="project" className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">No project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line bg-bg2 px-3.5 py-2.5 text-sm"><span className="flex items-center gap-1.5 text-mute"><Zap size={14} className="text-accent2" />Estimated cost</span><span className="font-medium">{cost} credits</span></div>
        <button className="btn-primary w-full py-3" disabled={busy || !model.available} onClick={() => submit(false)}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}{busy ? 'Generating' : 'Generate'}</button>
        <p className="text-xs text-mute">Balance: {props.credits.toLocaleString()} credits. Credits are deducted on the server and refunded automatically if a generation fails or is cancelled.</p>
      </div>

      <div>
        <div className="card flex min-h-[320px] flex-col overflow-hidden">
          <div className="flex flex-1 items-center justify-center bg-bg2 p-4">
            {outputs.length > 0 ? (
              <div className={`grid w-full gap-3 ${outputs.length > 1 ? 'sm:grid-cols-2' : ''}`}>{outputs.map((o) => o.url && (o.kind === 'video'
                ? <video key={o.id} src={o.url} controls loop className="max-h-[480px] w-full rounded-lg bg-black" />
                : <img key={o.id} src={o.url} alt="Generated output" className="max-h-[480px] w-full rounded-lg object-contain" />))}</div>
            ) : running ? (
              <div className="text-center"><Loader2 size={28} className="mx-auto animate-spin text-accent2" /><p className="mt-3 text-sm font-medium capitalize">{gen?.status}</p><p className="mt-1 text-xs text-mute">Videos can take a few minutes. You can leave this page; the result will appear in History.</p></div>
            ) : (
              <div className="text-center text-sm text-mute"><Sparkles size={26} className="mx-auto mb-3 text-accent2/70" />Your {isImg ? 'images' : 'video'} will appear here.</div>
            )}
          </div>
          {gen && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line p-3 text-sm">
              <span className={`chip ${gen.status === 'completed' ? 'text-ok' : gen.status === 'failed' ? 'text-bad' : 'text-accent2'}`}>{gen.status.replace(/^\w/, (c) => c.toUpperCase())}</span>
              <span className="text-xs text-mute">{gen.credit_cost} credits</span>
              <div className="ml-auto flex flex-wrap gap-2">
                {running && gen.id && <button className="btn-ghost btn-sm" onClick={cancel}>Cancel</button>}
                {gen.status === 'completed' && outputs.map((o) => o.url && <a key={o.id} href={o.url} download className="btn-ghost btn-sm"><Download size={14} />Download</a>)}
                {gen.status === 'completed' && <button className="btn-ghost btn-sm" onClick={save} disabled={saved}><FolderPlus size={14} />{saved ? 'Saved' : 'Save to project'}</button>}
                {['completed', 'failed', 'cancelled'].includes(gen.status) && <button className="btn-ghost btn-sm" onClick={() => submit(true)} disabled={busy}><RefreshCw size={14} />Regenerate</button>}
              </div>
            </div>
          )}
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}{error.includes('credits') && <> <Link href="/app/billing" className="underline">View plans</Link></>}</p>}
        {gen?.status === 'completed' && <p className="mt-3 text-xs text-mute">Saved to your <Link href="/app/assets" className="text-accent2 hover:underline">asset library</Link> and <Link href="/app/history" className="text-accent2 hover:underline">history</Link>.</p>}
      </div>
    </div>
  );
}
