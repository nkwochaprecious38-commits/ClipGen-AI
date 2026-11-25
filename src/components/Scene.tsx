// Illustrative frames composed in SVG. They represent the kind of scene a prompt describes
// and are not generated output. Always paired with a caption or a "Sample frame" label.
const SCENES: Record<string, { sky: [string, string]; sun?: string; layers: string[]; label: string }> = {
  mountain: { sky: ['#1b1440', '#f0a37a'], sun: '#ffd9a8', layers: ['#3b2a63', '#2a1d4a', '#171230'], label: 'Mountain valley at dawn' },
  city: { sky: ['#0b1026', '#4b2a7a'], sun: '#EC4899', layers: ['#1a1840', '#12122e', '#0a0a1c'], label: 'City skyline at night' },
  ocean: { sky: ['#12203f', '#5b8fb9'], sun: '#fde7c4', layers: ['#2c5a86', '#1f4268', '#142c49'], label: 'Coastline at dusk' },
  studio: { sky: ['#202127', '#3a3b46'], sun: '#8B5CF6', layers: ['#2b2c35', '#1c1d24', '#14151a'], label: 'Product studio set' },
  forest: { sky: ['#0f2a24', '#5aa58a'], sun: '#d6f5e4', layers: ['#1f5a48', '#154236', '#0c2a22'], label: 'Forest in morning light' },
  desert: { sky: ['#3a1f3f', '#e8935f'], sun: '#ffe2b5', layers: ['#a45a45', '#7a3f3a', '#4a2630'], label: 'Desert at golden hour' },
};
export function Scene({ variant = 'mountain', className = '' }: { variant?: keyof typeof SCENES | string; className?: string }) {
  const s = SCENES[variant] || SCENES.mountain;
  const id = `g-${variant}`;
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={`block h-full w-full ${className}`} role="img" aria-label={`Sample frame: ${s.label}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s.sky[0]} /><stop offset="1" stopColor={s.sky[1]} /></linearGradient>
        <radialGradient id={`${id}-s`}><stop offset="0" stopColor={s.sun} stopOpacity=".9" /><stop offset="1" stopColor={s.sun} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id})`} />
      {s.sun && <circle cx="215" cy="92" r="46" fill={`url(#${id}-s)`} />}
      {s.sun && <circle cx="215" cy="92" r="9" fill={s.sun} opacity=".95" />}
      {variant === 'city' ? (
        <g>
          {[...Array(16)].map((_, i) => { const h = 40 + ((i * 37) % 70); return <rect key={i} x={i * 20 + 2} y={180 - h - 20} width="16" height={h + 20} fill={i % 2 ? s.layers[0] : s.layers[1]} />; })}
          {[...Array(30)].map((_, i) => <rect key={i} x={6 + ((i * 47) % 300)} y={95 + ((i * 29) % 70)} width="2" height="3" fill="#ffd9a8" opacity=".7" />)}
        </g>
      ) : variant === 'studio' ? (
        <g>
          <rect y="128" width="320" height="52" fill={s.layers[1]} />
          <rect x="128" y="76" width="64" height="62" rx="8" fill="#0e0f13" stroke="#8B5CF6" strokeOpacity=".5" />
          <circle cx="160" cy="110" r="16" fill="#1c1d24" stroke="#C084FC" strokeOpacity=".6" />
        </g>
      ) : (
        <g>
          <path d="M0 120 L50 80 L95 112 L150 62 L210 118 L265 78 L320 116 L320 180 L0 180Z" fill={s.layers[0]} />
          <path d="M0 140 L70 108 L130 138 L200 100 L260 136 L320 112 L320 180 L0 180Z" fill={s.layers[1]} />
          <path d="M0 160 L80 144 L160 160 L240 142 L320 158 L320 180 L0 180Z" fill={s.layers[2]} />
        </g>
      )}
    </svg>
  );
}
export const sceneLabel = (v: string) => (SCENES[v] || SCENES.mountain).label;
