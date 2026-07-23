'use client';

import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';

const channels = [
  {
    title: 'Support',
    email: 'support@playmorrow.com',
    description: 'Account issues, login problems, or technical questions.',
  },
  {
    title: 'Press & Media',
    email: 'press@playmorrow.com',
    description: 'Press kits, interview requests, and media inquiries.',
  },
  {
    title: 'Partnerships',
    email: 'partners@playmorrow.com',
    description: 'Studio partnerships, platform integrations, and business development.',
  },
  {
    title: 'Security',
    email: 'security@playmorrow.com',
    description: 'Responsible disclosure of security vulnerabilities.',
  },
  {
    title: 'Legal',
    email: 'legal@playmorrow.com',
    description: 'DMCA takedown requests, legal inquiries, and data privacy requests.',
  },
];

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-[#020609] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <SiteHeader />

      <div className="relative px-5 sm:px-8 lg:px-10">

        <main className="relative z-10 mx-auto mt-8 max-w-3xl pb-16">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-6 sm:p-8 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h1 className="font-display font-black uppercase tracking-tight text-white text-2xl sm:text-3xl">Contact Us</h1>
            <p className="mt-2 text-sm text-muted-foreground">We would love to hear from you.</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p>
                The best way to reach us is by email. Choose the channel that fits your
                inquiry and we will respond as quickly as possible.
              </p>

              {channels.map((channel) => (
                <div key={channel.title} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <h2 className="font-display text-base text-foreground">{channel.title}</h2>
                  <p className="mt-1">{channel.description}</p>
                  <a
                    href={`mailto:${channel.email}`}
                    className="mt-1 inline-block text-cyan hover:text-cyan/80 underline underline-offset-2"
                  >
                    {channel.email}
                  </a>
                </div>
              ))}

              <div className="border-t border-border pt-6">
                <h2 className="font-display text-base text-foreground">Social</h2>
                <p className="mt-1">Follow us for updates, announcements, and community highlights.</p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <a href="https://x.com/playmorrow" target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                    X (Twitter)
                  </a>
                  <a href="https://discord.gg/playmorrow" target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                    Discord
                  </a>
                  <a href="https://github.com/playmorrow" target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-cyan/80 underline underline-offset-2">
                    GitHub
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-border pt-6">
              <Link href="/" className="text-sm text-cyan hover:text-cyan/80 underline underline-offset-2">
                &larr; Back to home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
