'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Video, ImagePlus, Scissors, Image as ImageIcon, FolderKanban, Library, BookText, LayoutTemplate, Download, Settings, Menu, X, Search, Bell, Zap, ChevronDown, Layers, Clapperboard, ArrowUpFromLine, Expand, Copy, Share2, History, Wallet, CreditCard, Repeat } from 'lucide-react';
import { Logo } from './Logo';

const MAIN = [
  ['Dashboard', '/app', LayoutDashboard], ['Create Video', '/app/create', Video], ['Image to Video', '/app/image-to-video', ImagePlus], ['Video Editing', '/app/editing', Scissors],
  ['Image Generation', '/app/images', ImageIcon], ['Projects', '/app/projects', FolderKanban], ['My Assets', '/app/assets', Library], ['Prompt Library', '/app/prompts', BookText],
  ['Templates', '/app/templates', LayoutTemplate], ['Exports', '/app/exports', Download], ['Settings', '/app/settings', Settings],
] as const;
const MORE = [
  ['Video to Video', '/app/video-to-video', Repeat], ['Multi Scene', '/app/multi-scene', Layers], ['Storyboards', '/app/storyboards', Clapperboard], ['Upscaling', '/app/upscale', ArrowUpFromLine],
  ['Extension', '/app/extend', Expand], ['Variations', '/app/variations', Copy], ['Social Content', '/app/social', Share2], ['History', '/app/history', History], ['Credits', '/app/credits', Wallet], ['Billing', '/app/billing', CreditCard],
] as const;

type Props = { children: React.ReactNode; name: string; workspace: string; credits: number; plan: string; unread: number };

export function AppShell({ children, name, workspace, credits, plan, unread }: Props) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const path = usePathname();
  const router = useRouter();
  const active = (h: string) => (h === '/app' ? path === '/app' : path.startsWith(h));
  const Item = ([l, h, Icon]: readonly [string, string, any]) => (
    <Link key={h} href={h} onClick={() => setOpen(false)} aria-current={active(h) ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active(h) ? 'bg-accent/15 text-ink' : 'text-mute hover:bg-card hover:text-ink'}`}>
      <Icon size={17} className={active(h) ? 'text-accent2' : ''} />{l}
    </Link>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-line bg-bg2 p-4 transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Application">
        <div className="mb-6 flex items-center justify-between"><Logo href="/app" /><button className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <nav className="space-y-0.5">{MAIN.map(Item)}</nav>
        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-mute">More tools</p>
        <nav className="space-y-0.5">{MORE.map(Item)}</nav>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/95 px-4 backdrop-blur sm:px-6">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="hidden max-w-[180px] truncate rounded-lg border border-line px-3 py-1.5 text-xs text-mute md:block" title="Workspace">{workspace}</span>
          <form className="relative min-w-0 flex-1 sm:max-w-md" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/app/search?q=${encodeURIComponent(q.trim())}`); }} role="search">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Search projects, assets, prompts" aria-label="Search" />
          </form>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link href="/app/credits" className="hidden items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs sm:flex" title="Available credits"><Zap size={14} className="text-accent2" />{credits.toLocaleString()} credits</Link>
            <Link href="/app/billing" className="hidden rounded-full border border-line px-2.5 py-1 text-xs text-mute lg:block">{plan}</Link>
            <Link href="/app/billing" className="btn-primary btn-sm hidden sm:inline-flex">Upgrade</Link>
            <Link href="/app/notifications" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}><Bell size={19} className="text-mute hover:text-ink" />{unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-creative px-1 text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span>}</Link>
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-1.5" aria-expanded={menu} aria-label="Account menu">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold">{(name || '?').charAt(0).toUpperCase()}</span><ChevronDown size={14} className="text-mute" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-card p-1.5 text-sm shadow-xl" onMouseLeave={() => setMenu(false)}>
                  <p className="truncate px-3 py-2 text-xs text-mute">{name}</p>
                  <Link href="/app/settings" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-bg2">Profile and settings</Link>
                  <Link href="/app/billing" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-bg2">Subscription</Link>
                  <Link href="/" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-bg2">Public website</Link>
                  <form action="/auth/signout" method="post"><button className="block w-full rounded-lg px-3 py-2 text-left text-bad hover:bg-bg2">Sign out</button></form>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
