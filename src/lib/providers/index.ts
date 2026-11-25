import 'server-only';
import { replicate } from './replicate';
import type { Provider } from './types';
import { MODELS, type ModelDef } from '../models';

const providers: Record<string, Provider> = { replicate };
export const getProvider = (id: string) => providers[id];
export const modelAvailable = (m: ModelDef) => providers[m.provider]?.configured() ?? false;
export const catalogWithAvailability = () => MODELS.map((m) => ({ ...m, available: modelAvailable(m) }));

// Maps validated ClipGen settings to the provider's input schema, per model.
export function buildInput(m: ModelDef, r: { prompt: string; negativePrompt?: string; aspectRatio?: string; duration?: number; count?: number; seed?: number; imageUrl?: string }) {
  switch (m.id) {
    case 'minimax-video-01': return { prompt: r.prompt, ...(r.imageUrl ? { first_frame_image: r.imageUrl } : {}) };
    case 'kling-v1-6-standard': return {
      prompt: r.prompt, duration: r.duration, aspect_ratio: r.aspectRatio,
      ...(r.negativePrompt ? { negative_prompt: r.negativePrompt } : {}), ...(r.imageUrl ? { start_image: r.imageUrl } : {}),
    };
    case 'flux-schnell': return {
      prompt: r.prompt, aspect_ratio: r.aspectRatio, num_outputs: r.count ?? 1, output_format: 'png',
      ...(r.seed !== undefined ? { seed: r.seed } : {}),
    };
    default: throw new Error('Unknown model');
  }
}
