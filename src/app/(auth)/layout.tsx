import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { supabaseConfigured } from '@/lib/env';
import { AlertTriangle } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-x flex h-16 items-center justify-between"><Logo /><Link href="/" className="text-sm text-mute hover:text-ink">Back to site</Link></header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {!supabaseConfigured() && (
            <div className="mb-6 flex gap-3 rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm text-mute" role="alert">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
              <p>Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then run the database migration. See the README for steps. Forms are disabled until then.</p>
            </div>
          )}
          {children}
        </div>
      </main>
      <p className="container-x py-6 text-sm text-mute">© 2026 ClipGen AI</p>
    </div>
  );
}
