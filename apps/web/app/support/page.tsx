'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  LifeBuoy,
  Ticket,
  BookOpen,
  Activity,
  Mail,
  MessageSquare,
  Terminal,
  Shield,
  Users,
  Upload,
  ScrollText,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { icon: Users, label: 'Account', desc: 'Login, billing, profile issues', href: '/support/new?department=ACCOUNTS' },
  { icon: Terminal, label: 'Technical', desc: 'Bugs, errors, platform issues', href: '/support/new?department=TECHNICAL' },
  { icon: Shield, label: 'Studio', desc: 'Game management, team tools', href: '/support/new?department=STUDIO' },
  { icon: Upload, label: 'Publishing', desc: 'Submission, distribution, visibility', href: '/support/new?department=PUBLISHING' },
  { icon: MessageSquare, label: 'Community', desc: 'Reports, moderation, conduct', href: '/support/new?department=COMMUNITY' },
  { icon: ScrollText, label: 'Legal', desc: 'DMCA, copyright, terms', href: '/support/new?department=LEGAL' },
];

const QUICK_ACTIONS = [
  { icon: Ticket, label: 'Create Ticket', desc: 'Submit a new support request', href: '/support/new' },
  { icon: BookOpen, label: 'My Tickets', desc: 'View your existing tickets', href: '/support/tickets' },
  { icon: LifeBuoy, label: 'Knowledge Base', desc: 'Guides & documentation', href: '/help' },
  { icon: Activity, label: 'System Status', desc: 'Check platform health', href: '#' },
];

const CONTACT_CHANNELS = [
  { icon: Mail, label: 'Email', value: 'playmorrow@hotmail.com' },
  { icon: MessageSquare, label: 'Discord', value: 'discord.gg/playmorrow' },
];

export default function SupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/support/new?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <main className="relative mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
            How can we <span className="text-cyan">help?</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            Search our knowledge base or create a support ticket
          </p>
          <form onSubmit={handleSearch} className="mx-auto max-w-lg">
            <div className="clip-corner flex h-14 items-center gap-3 border border-cyan/30 panel px-5 shadow-[0_0_30px_rgb(62_231_255_/_0.08)]">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                aria-label="Search support articles"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Category Cards */}
        <section className="mb-16">
          <h2 className="mb-6 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
            Browse by Category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="clip-corner group border border-border/60 panel p-5 transition hover:border-cyan/30 hover:shadow-[0_0_20px_rgb(62_231_255_/_0.06)]"
                >
                  <Icon className="mb-3 size-6 text-cyan/60 group-hover:text-cyan transition" />
                  <h3 className="mb-1 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground">
                    {cat.label}
                  </h3>
                  <p className="font-mono text-[0.55rem] text-muted-foreground/70">
                    {cat.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-16">
          <h2 className="mb-6 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="clip-corner group border border-border/50 panel p-5 text-center transition hover:border-coral/30 "
                >
                  <Icon className="mx-auto mb-2 size-6 text-coral/60 group-hover:text-coral transition" />
                  <h3 className="mb-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground">
                    {action.label}
                  </h3>
                  <p className="font-mono text-[0.5rem] text-muted-foreground/60">
                    {action.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Contact */}
        <section className="clip-corner border border-border/60 panel p-6 text-center">
          <h2 className="mb-4 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
            Still need help?
          </h2>
          <p className="mb-6 font-mono text-[0.55rem] text-muted-foreground">
            Our support team typically responds within 24 hours
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {CONTACT_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              return (
                <div key={channel.label} className="flex items-center gap-2">
                  <Icon className="size-4 text-cyan/60" />
                  <span className="font-mono text-[0.55rem] uppercase tracking-wider text-muted-foreground/80">
                    {channel.label}:
                  </span>
                  <span className="font-mono text-[0.55rem] text-foreground">
                    {channel.value}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <Link href="/support/new">
              <Button>
                <Ticket className="size-4" />
                Create a Ticket
              </Button>
            </Link>
          </div>
        </section>
      </main>

    </div>
  );
}
