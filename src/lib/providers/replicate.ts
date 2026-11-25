import 'server-only';
import type { Provider } from './types';

const API = 'https://api.replicate.com/v1';
const headers = () => ({ Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' });

async function call(url: string, init: RequestInit, attempts = 3): Promise<any> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, { ...init, signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (res.status === 429 || res.status >= 500) { last = new Error(`Provider responded ${res.status}`); await new Promise((r) => setTimeout(r, 800 * (i + 1))); continue; }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.detail || `Provider responded ${res.status}`);
      return body;
    } catch (e) { last = e; if (i === attempts - 1) break; await new Promise((r) => setTimeout(r, 800 * (i + 1))); }
  }
  throw last instanceof Error ? last : new Error('Provider request failed');
}

export const replicate: Provider = {
  id: 'replicate',
  configured: () => Boolean(process.env.REPLICATE_API_TOKEN),
  async submit(providerModel, input) {
    const body = await call(`${API}/models/${providerModel}/predictions`, { method: 'POST', headers: headers(), body: JSON.stringify({ input }) });
    return { jobId: body.id as string };
  },
  async poll(jobId) {
    const b = await call(`${API}/predictions/${jobId}`, { headers: headers() });
    const out: string[] = Array.isArray(b.output) ? b.output : b.output ? [b.output] : [];
    if (b.status === 'succeeded') return { status: 'completed', outputs: out };
    if (b.status === 'failed') return { status: 'failed', outputs: [], error: String(b.error || 'Generation failed') };
    if (b.status === 'canceled') return { status: 'cancelled', outputs: [] };
    return { status: 'processing', outputs: [] };
  },
  async cancel(jobId) { await call(`${API}/predictions/${jobId}/cancel`, { method: 'POST', headers: headers() }, 1); },
};
