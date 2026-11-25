'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';

const LINKS = [['Platform', '/platform'], ['Solutions', '/solutions'], ['Features', '/features'], ['Pricing', '/pricing']];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {LINKS.map(([l, h]) => (
            <Link key={h} href={h} className={`text-sm transition-colors hover:text-ink ${path === h ? 'text-ink' : 'text-mute'}`}>{l}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm text-mute hover:text-ink">Login</Link>
          <Link href="/signup" className="btn-primary">Get Started</Link>
        </div>
        <button className="md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-bg2 md:hidden">
          <nav className="container-x flex flex-col py-3" aria-label="Mobile">
            {LINKS.map(([l, h]) => <Link key={h} href={h} onClick={() => setOpen(false)} className="py-3 text-sm text-ink">{l}</Link>)}
            <Link href="/login" onClick={() => setOpen(false)} className="py-3 text-sm text-ink">Login</Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary mt-2">Get Started</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
