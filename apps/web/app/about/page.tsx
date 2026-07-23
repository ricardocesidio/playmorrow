'use client';

import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-[#020609] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <SiteHeader />

      <div className="relative px-5 sm:px-8 lg:px-10">

        <main className="relative z-10 mx-auto mt-8 max-w-3xl pb-16">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-6 sm:p-8 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h1 className="font-display font-black uppercase tracking-tight text-white text-2xl sm:text-3xl">About Playmorrow</h1>
            <p className="mt-2 text-sm text-muted-foreground">Where players discover games — and studios find their audience.</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p>
                Playmorrow is a game discovery platform built for independent developers and
                the players who love their work. We believe great games deserve to be found —
                no matter the studio size, budget, or marketing reach.
              </p>

              <h2 className="font-display text-base text-foreground">Our Mission</h2>
              <p>
                To make game discovery feel like exploring, not shopping. We replace algorithmic
                noise with community-driven signals: devlogs, roadmap updates, and genuine player
                reactions. Every studio gets a home page, every game gets a story.
              </p>

              <h2 className="font-display text-base text-foreground">For Players</h2>
              <p>
                Follow the games and studios you care about. Get updates straight from the
                developers — real progress, real devlogs, real roadmaps. No ads, no sponsored
                placements, no editorial payola. Just the games.
              </p>

              <h2 className="font-display text-base text-foreground">For Studios</h2>
              <p>
                Publish devlogs, share screenshots, and build a following before your game
                launches. Get direct feedback from engaged players, show your roadmap, and
                grow your community on your terms. No algorithms deciding who sees your work.
              </p>

              <h2 className="font-display text-base text-foreground">Why Playmorrow?</h2>
              <p>
                The game industry is flooded with storefronts and review aggregates. We think
                discovery should be human again. Playmorrow is built around the connection
                between creator and player — the devlog, the comment, the reaction. Every
                feature exists to strengthen that bond.
              </p>

              <h2 className="font-display text-base text-foreground">Our Team</h2>
              <p>
                Playmorrow is built by a small, independent team of developers and designers
                who care deeply about games and the people who make them. We are players first,
                builders second, and we ship every feature with the question: <em>does this help
                someone find a game they will love?</em>
              </p>
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
