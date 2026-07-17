'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSaved } from './saved-provider';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const { saved } = useSaved();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = (path: string) => pathname === path ? 'border-b-2 border-saffron-500 text-navy-950 font-bold' : 'text-stone-500 hover:bg-stone-50/50 hover:text-navy-950';
  const avatar = user?.username.slice(0, 1).toUpperCase() || 'N';

  const signOut = () => {
    setMenuOpen(false);
    logout();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/40 bg-white/80 shadow-glass backdrop-blur-md">
      <div className="shell flex h-[72px] items-center justify-between">
        <Link href={user?.role === 'recruiter' ? '/recruiter' : '/'} className="focus-ring group flex items-center gap-3 rounded-xl">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 text-white shadow-premium transition-transform duration-300 group-hover:scale-[1.03]">
            <span className="font-heading text-lg font-black">N</span><span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-saffron-500 via-white to-indiaGreen-500" />
          </div>
          <div><p className="font-heading text-lg font-extrabold tracking-tight text-navy-950">Niyukti</p><p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Private career workspace</p></div>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-1.5 sm:gap-2">
          {user?.role === 'candidate' && <>
            <Link href="/" className={`focus-ring hidden rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition sm:block ${active('/')}`}>Dashboard</Link>
            <Link href="/profile" className={`focus-ring hidden rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition md:block ${active('/profile')}`}>Profile</Link>
            <Link href="/#jobs" className="focus-ring hidden rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 transition hover:bg-stone-50/50 hover:text-navy-950 lg:block">Discover</Link>
            <Link href="/saved" className={`focus-ring flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${pathname === '/saved' ? 'border-navy-950 bg-navy-950 text-white' : 'border-stone-200 bg-white text-navy-900 hover:border-saffron-300'}`}>
              <span className="hidden sm:inline">Shortlist</span><span className="grid h-5 min-w-5 place-items-center rounded-full bg-saffron-50 px-1 text-[10px] text-saffron-800">{saved.length}</span>
            </Link>
          </>}
          {user?.role === 'recruiter' && <Link href="/recruiter" className={`focus-ring rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${active('/recruiter')}`}>Hiring workspace</Link>}

          <div className="relative ml-1.5">
            <button onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} className="focus-ring flex items-center gap-2 rounded-xl border border-stone-200 bg-white py-1.5 pl-2 pr-3 shadow-sm transition hover:border-saffron-300">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-navy-950 text-[11px] font-black text-white">{avatar}</span>
              <span className="hidden max-w-24 truncate text-xs font-bold text-navy-900 sm:block">Hi, {user?.username}</span><span className="text-[10px] text-stone-400">⌄</span>
            </button>
            {menuOpen && <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-premium-hover">
              <div className="border-b border-stone-100 px-3 py-2.5"><p className="truncate text-xs font-bold text-navy-950">{user?.username}</p><p className="truncate text-[10px] text-stone-400">{user?.email}</p></div>
              <p className="px-3 pb-1 pt-3 text-[9px] font-extrabold uppercase tracking-widest text-saffron-700">{user?.role} account</p>
              <button onClick={signOut} className="focus-ring w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-stone-600 transition hover:bg-saffron-50 hover:text-saffron-800">Sign out</button>
            </div>}
          </div>
        </nav>
      </div>
    </header>
  );
}
