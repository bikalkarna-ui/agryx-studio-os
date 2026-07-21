'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarCheck,
  Image as ImageIcon,
  Receipt,
  Star,
  Megaphone,
  Settings,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads (CRM)', icon: Users },
  { href: '/quotes', label: 'AI Quotes', icon: FileText },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/galleries', label: 'Galleries', icon: ImageIcon },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/landing-pages', label: 'Landing Pages', icon: Megaphone },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-sand bg-white p-6 gap-1">
      <div className="mb-8">
        <div className="text-lg font-serif font-bold text-ink">AgryX</div>
        <div className="text-xs text-ink/50 tracking-wide">STUDIO OS</div>
      </div>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              active ? 'bg-clay text-white' : 'text-ink/70 hover:bg-sand/60'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
