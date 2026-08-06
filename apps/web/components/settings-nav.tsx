'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Settings, Bell } from 'lucide-react';

const links = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/account', label: 'Account', icon: Settings },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-1 clip-corner border border-border/50 panel p-1 shadow-[0_0_20px_rgb(0_0_0_/_0.2)]">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 clip-corner px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest transition ${
              isActive
                ? 'bg-cyan/10 text-cyan shadow-[0_0_12px_rgb(62_231_255_/_0.12)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-3.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
