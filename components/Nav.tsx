'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const links = [
  { href: '/',             label: 'Dashboard' },
  { href: '/contacts',     label: 'Contacts' },
  { href: '/top-customers',label: 'Top Customers' },
  { href: '/leads',        label: 'Missed Leads' },
  { href: '/tanks',        label: 'Tanks' },
  { href: '/bookings',     label: 'Bookings' },
  { href: '/requests',     label: 'Requests' },
  { href: '/calls',        label: 'Quo Calls' },
  { href: '/messages',     label: 'Quo Messages' },
  { href: '/archive',      label: 'Archive' },
  { href: '/search',       label: 'Search' },
  { href: '/settings',     label: '⚙ Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-1 px-5 h-13 bg-[#0c0e18] border-b border-[#2a2d3e] shadow-lg" style={{ height: 52 }}>
      <span className="font-bold text-white text-[15px] mr-5 whitespace-nowrap">🌊 Rainbow Water</span>
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-3 py-1.5 rounded text-[13px] transition-all whitespace-nowrap ${
            pathname === l.href
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-white/50 hover:bg-white/8 hover:text-white/90'
          }`}
        >
          {l.label}
        </Link>
      ))}
      <div className="ml-auto relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">🔍</span>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && q.trim()) { router.push(`/search?q=${encodeURIComponent(q.trim())}`); setQ(''); } }}
          placeholder="Search everything…"
          className="bg-white/7 border border-white/12 rounded text-white text-[13px] py-1.5 pl-8 pr-3 w-64 outline-none placeholder:text-white/30 focus:bg-white/10 focus:border-blue-500"
        />
      </div>
    </nav>
  );
}
