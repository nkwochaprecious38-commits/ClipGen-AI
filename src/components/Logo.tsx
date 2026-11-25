export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#12121f" />
      <path d="M6 40 C18 22 28 22 36 34 S52 44 60 28 L60 38 C52 52 40 54 32 42 S16 32 6 50Z" fill="#6d28d9" />
      <path d="M6 36 C18 16 30 18 38 30 S54 38 60 22 L60 30 C52 44 40 46 32 36 S16 28 6 42Z" fill="#a78bfa" />
    </svg>
  );
}
export function Logo({ href = '/' }: { href?: string }) {
  return (
    <a href={href} className="flex items-center gap-2.5" aria-label="ClipGen AI home">
      <LogoMark />
      <span className="font-head text-lg font-extrabold tracking-tight">ClipGen AI</span>
    </a>
  );
}
