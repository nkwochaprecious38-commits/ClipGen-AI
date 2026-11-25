// Model catalog: the single source of truth for what the UI may offer and what the server accepts.
// Capabilities below are declared per provider model and must be verified against the provider's
// current documentation before launch. If a setting is not listed here, the UI will not show it and
// the API will reject it. Costs are ClipGen credit prices (business configuration), not provider prices.
export type GenKind = 'text_to_video' | 'image_to_video' | 'image';
export type ModelDef = {
  id: string; name: string; provider: 'replicate'; providerModel: string; kind: GenKind[];
  inputs: ('text' | 'image')[]; outputs: ('video' | 'image')[];
  aspectRatios: string[]; durations: number[]; resolutions: string[];
  negativePrompt: boolean; seed: boolean; maxImages: number;
  cost: { base: number; perSecond?: number; perImage?: number };
  note?: string;
};

export const MODELS: ModelDef[] = [
  {
    id: 'minimax-video-01', name: 'MiniMax Video 01', provider: 'replicate', providerModel: 'minimax/video-01',
    kind: ['text_to_video', 'image_to_video'], inputs: ['text', 'image'], outputs: ['video'],
    aspectRatios: [], durations: [], resolutions: [], negativePrompt: false, seed: false, maxImages: 1,
    cost: { base: 50 }, note: 'Fixed output format. Aspect ratio and duration are not adjustable on this model.',
  },
  {
    id: 'kling-v1-6-standard', name: 'Kling 1.6 Standard', provider: 'replicate', providerModel: 'kwaivgi/kling-v1.6-standard',
    kind: ['text_to_video', 'image_to_video'], inputs: ['text', 'image'], outputs: ['video'],
    aspectRatios: ['16:9', '9:16', '1:1'], durations: [5, 10], resolutions: [], negativePrompt: true, seed: false, maxImages: 1,
    cost: { base: 0, perSecond: 10 },
  },
  {
    id: 'flux-schnell', name: 'FLUX Schnell', provider: 'replicate', providerModel: 'black-forest-labs/flux-schnell',
    kind: ['image'], inputs: ['text'], outputs: ['image'],
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'], durations: [], resolutions: [], negativePrompt: false, seed: true, maxImages: 4,
    cost: { base: 0, perImage: 2 },
  },
];

export const modelsFor = (kind: GenKind) => MODELS.filter((m) => m.kind.includes(kind));
export const getModel = (id: string) => MODELS.find((m) => m.id === id);
export function estimateCost(m: ModelDef, s: { duration?: number; count?: number }) {
  return Math.ceil(m.cost.base + (m.cost.perSecond ?? 0) * (s.duration ?? 0) + (m.cost.perImage ?? 0) * (s.count ?? 1));
}

// Tools that have no connected model. The UI shows the full interface but marks it as requiring integration.
export const PENDING_TOOLS = {
  video_to_video: 'Video to Video', video_edit: 'AI Video Editing', video_extension: 'Video Extension', upscale: 'Video Upscaling',
} as const;
