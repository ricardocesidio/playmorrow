# Deepened Cyberpunk v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Playmorrow's existing dark UI into a full cyberpunk aesthetic with layered atmosphere (hex grid, scanlines, noise), glitch typography, holographic panels, animated borders, data-stream backgrounds, and glitch page transitions.

**Architecture:** All changes are CSS-first via Tailwind v4 utilities and `globals.css` keyframes, with one new React component (`DataStream`) using a canvas, one utility hook (`useScrollReveal`) using IntersectionObserver, and a Next.js template-based page transition. Existing components get upgraded class names and new pseudo-elements.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, JetBrains Mono (body), Space Grotesk (headings)

## Global Constraints

- Tailwind v4 `@theme inline` remains in `globals.css` — do not create a separate config file
- No new npm dependencies — use only what's already installed
- `prefers-reduced-motion` rule stays intact, all animations respect it
- JetBrains Mono replaces Inter as body font throughout
- All colors from existing `--cyan`, `--coral`, `--violet`, `--amber` palette

---

### Task 1: CSS Foundation — Keyframes, Utilities & Atmosphere Layers

**Files:**
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Produces: New `@utility` classes and `@keyframes` for all subsequent tasks

- [ ] **Step 1: Add all new keyframes**

Add these after the existing `@keyframes pulseGlow` block (after line 12):

```css
/* ── Cyberpunk v3 keyframes ─────────────────────────────────────────── */
@keyframes scanTop {
  0%, 100% { transform: translateX(-100%); }
  50%      { transform: translateX(100%);  }
}

@keyframes scanSide {
  0%, 100% { transform: translateY(-100%); }
  50%      { transform: translateY(100%);  }
}

@keyframes scanHighlight {
  0%   { top: 0%; }
  100% { top: 100%; }
}

@keyframes glitchRGB {
  0%, 90%, 96%, 98%, 100% { transform: translate(0); opacity: 0; }
  1%, 3%, 5% { transform: translate(1px, 0); opacity: 1; }
  92% { transform: translate(-3px, 1px); }
  94% { transform: translate(2px, -1px); }
}

@keyframes glitchSparse {
  0%, 6%, 10%, 27%, 33%, 45%, 100% { clip-path: inset(0 0 0 0); }
  5%  { clip-path: inset(40% 0 55% 0); }
  25% { clip-path: inset(10% 0 30% 0); }
  44% { clip-path: inset(80% 0 5% 0); }
}

@keyframes flickerText {
  0%, 92%, 94%, 96%, 98%, 100% { opacity: 1; }
  93% { opacity: 0.2; }
  95% { opacity: 0.6; }
  97% { opacity: 0.3; }
  99% { opacity: 1; }
}

@keyframes blinkCursor {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}

@keyframes glowPulse {
  0%, 100% { text-shadow: 0 0 12px currentColor; }
  50%      { text-shadow: 0 0 24px currentColor, 0 0 48px currentColor; }
}

@keyframes shimmerScan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%);  }
}
```

- [ ] **Step 2: Add new utility classes**

Add these after the existing `@utility animate-pulse-glow` block (after line 20):

```css
@utility animate-scan-top {
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--cyan) 20%, var(--cyan) 80%, transparent 100%);
    animation: scanTop 3s ease-in-out infinite;
    pointer-events: none;
  }
}

@utility animate-scan-highlight {
  &::after {
    content: '';
    position: absolute;
    left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--cyan) 25%, transparent) 20%, color-mix(in srgb, var(--cyan) 25%, transparent) 80%, transparent 100%);
    animation: scanHighlight 4s ease-in-out infinite;
    pointer-events: none;
  }
}

@utility animate-glitch-rgb {
  position: relative;
  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  &::before {
    color: var(--cyan);
    animation: glitchRGB 0.3s infinite;
    clip-path: inset(0 0 50% 0);
  }
  &::after {
    color: var(--coral);
    animation: glitchRGB 0.3s infinite reverse;
    clip-path: inset(50% 0 0 0);
  }
}

@utility animate-glitch-sparse {
  animation: glitchSparse 6s infinite;
}

@utility animate-flicker {
  animation: flickerText 3s ease-in-out infinite;
}

@utility animate-blink {
  animation: blinkCursor 1s step-end infinite;
}

@utility animate-glow-pulse {
  animation: glowPulse 3s ease-in-out infinite;
}

@utility shimmer {
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--cyan) 8%, transparent) 40%, color-mix(in srgb, var(--cyan) 12%, transparent) 50%, color-mix(in srgb, var(--cyan) 8%, transparent) 60%, transparent 100%);
    animation: shimmerScan 1.5s ease-in-out infinite;
    pointer-events: none;
  }
}

@utility img-glitch-hover {
  transition: filter 0.3s;
  &:hover {
    filter: drop-shadow(2px 0 1px color-mix(in srgb, var(--cyan) 40%, transparent))
            drop-shadow(-1px 0 1px color-mix(in srgb, var(--coral) 40%, transparent));
  }
}

@utility glass {
  background: color-mix(in srgb, var(--background) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

- [ ] **Step 3: Update the body background layer stack**

Replace the body background in the `@layer base` block (lines 133-137) — replace the `background:` property:

```css
  body {
    @apply bg-background text-foreground font-body;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    background:
      radial-gradient(circle at 18% 10%, rgb(62 231 255 / 0.06), transparent 28rem),
      radial-gradient(circle at 88% 2%, rgb(255 87 77 / 0.05), transparent 26rem),
      radial-gradient(circle at 50% 80%, rgb(166 92 255 / 0.04), transparent 32rem),
      conic-gradient(from 30deg at 24px 0, transparent 60deg, rgb(62 231 255 / 0.025) 60deg 120deg, transparent 120deg 180deg, rgb(62 231 255 / 0.025) 180deg 240deg, transparent 240deg 300deg, rgb(62 231 255 / 0.025) 300deg 360deg),
      conic-gradient(from 90deg at 0 24px, transparent 60deg, rgb(62 231 255 / 0.025) 60deg 120deg, transparent 120deg 180deg, rgb(62 231 255 / 0.025) 180deg 240deg, transparent 240deg 300deg, rgb(62 231 255 / 0.025) 300deg 360deg),
      linear-gradient(180deg, #02070b 0%, #03090d 52%, #010507 100%);
    background-size:
      100% 100%,
      100% 100%,
      100% 100%,
      48px 48px,
      48px 48px,
      100% 100%;
  }
```

- [ ] **Step 4: Add scanline pseudo-element to body**

Add after the body block in `@layer base` (after the closing brace of body):

```css
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgb(255 255 255 / 0.03) 2px,
      rgb(255 255 255 / 0.03) 3px
    );
  }
```

- [ ] **Step 5: Change body font to JetBrains Mono**

In `apps/web/app/layout.tsx`, change the body font variable assignment. Replace line 20-24 with:

```tsx
const body = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
```

And remove the `Inter` import from line 2 (replace `Space_Grotesk, JetBrains_Mono, Inter` with `Space_Grotesk, JetBrains_Mono`).

Also add `letter-spacing: 0.02em` to the body. In `globals.css`, add after `font-feature-settings: "cv02", "cv03", "cv04", "cv11";`:

```css
    letter-spacing: 0.02em;
```

- [ ] **Step 6: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS (no new type errors)

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/globals.css apps/web/app/layout.tsx
git commit -m "feat: add cyberpunk v3 keyframes, atmosphere layers, scanlines, mono body"
```

---

### Task 2: HUD Components — Hex Grid & Panel Upgrades

**Files:**
- Modify: `apps/web/components/playmorrow/hud.tsx`

**Interfaces:**
- Produces: Updated `HudPanel`, `CircuitFrame`, new `HexGrid` component

- [ ] **Step 1: Add `accent` prop default change and corner brackets to all HudPanel variants**

Replace the `HudPanel` function (lines 34-60) with:

```tsx
export function HudPanel({
  children,
  className,
  accent = 'cyan',
  ...props
}: ComponentProps<'div'> & { accent?: 'cyan' | 'coral' | 'muted' }) {
  const accentClass = {
    cyan: 'before:border-cyan/55 after:border-cyan/35',
    coral: 'before:border-coral/60 after:border-coral/45',
    muted: 'before:border-border-bright/60 after:border-border/80',
  }[accent];

  return (
    <div
      className={cn(
        'panel relative border-border/90 overflow-hidden',
        'before:pointer-events-none before:absolute before:left-3 before:top-3 before:size-8 before:border-l before:border-t before:z-10',
        'after:pointer-events-none after:absolute after:bottom-3 after:right-3 after:size-8 after:border-b after:border-r after:z-10',
        'animate-scan-top',
        accentClass,
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Add HexGrid component**

Add after the `HudPanel` function:

```tsx
export function HexGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0',
        'bg-[conic-gradient(from_30deg_at_24px_0,transparent_60deg,rgb(62_231_255_/_0.03)_60deg_120deg,transparent_120deg_180deg,rgb(62_231_255_/_0.03)_180deg_240deg,transparent_240deg_300deg,rgb(62_231_255_/_0.03)_300deg_360deg),conic-gradient(from_90deg_at_0_24px,transparent_60deg,rgb(62_231_255_/_0.03)_60deg_120deg,transparent_120deg_180deg,rgb(62_231_255_/_0.03)_180deg_240deg,transparent_240deg_300deg,rgb(62_231_255_/_0.03)_300deg_360deg)]',
        'bg-[length:48px_48px]',
        className,
      )}
    />
  );
}
```

- [ ] **Step 3: Add holographic panel variant**

Add after `HexGrid`:

```tsx
export function HudHoloPanel({
  children,
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'panel relative border border-border/80 overflow-hidden',
        'bg-[linear-gradient(135deg,rgb(62_231_255_/_0.06),rgb(166_92_255_/_0.04),rgb(255_87_77_/_0.03))]',
        'shadow-[0_20px_80px_rgb(0_0_0_/_0.6),0_0_30px_rgb(62_231_255_/_0.05),inset_0_1px_0_rgb(255_255_255_/_0.02)]',
        'animate-scan-top',
        className,
      )}
      {...props}
    >
      <span className="signal-dot absolute right-3 top-3 z-20" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/playmorrow/hud.tsx
git commit -m "feat: add hex grid, holographic panel, scanning borders to HUD"
```

---

### Task 3: Game Card — Holographic Depth & Image Glitch

**Files:**
- Modify: `apps/web/components/game-card.tsx`
- Modify: `apps/web/app/page.tsx` (LatestGameCard inline component)

**Interfaces:**
- Produces: Updated `GameCard` with holo classes and img glitch

- [ ] **Step 1: Update GameCard classes**

In `game-card.tsx`, replace the outer `className` on the Link (lines 14-18):

```tsx
return (
    <Link
      href={`/games/${game.slug}`}
      className="group panel relative flex min-h-[228px] flex-col overflow-hidden border-border/90 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.06),rgb(166_92_255_/_0.04),rgb(255_87_77_/_0.03))] shadow-[0_20px_80px_rgb(0_0_0_/_0.6),0_0_30px_rgb(62_231_255_/_0.05),inset_0_1px_0_rgb(255_255_255_/_0.02)] transition duration-200 hover:border-cyan/70 hover:shadow-[0_0_32px_rgb(62_231_255_/_0.14),0_20px_80px_rgb(0_0_0_/_0.7)] animate-scan-top"
    >
```

- [ ] **Step 2: Add image glitch hover**

On the `<img>` tag (line 21-24), add `img-glitch-hover`:

```tsx
        <img
          src={cover}
          alt={game.title}
          className="img-glitch-hover size-full object-cover transition duration-300 group-hover:scale-[1.035]"
        />
```

- [ ] **Step 3: Add signal dot to card corner**

After the `StatusBadge` div (after line 27 closing `</div>`), add:

```tsx
        <span className="signal-dot absolute right-3 top-3" aria-hidden />
```

- [ ] **Step 4: Update LatestGameCard in page.tsx**

In `apps/web/app/page.tsx`, update the `LatestGameCard` outer `<Link>` className (line 290):

Before:
```tsx
<Link href={`/games/${game.slug}`} className="group grid min-h-[260px] overflow-hidden border border-border bg-card transition hover:border-cyan/70">
```

After:
```tsx
<Link href={`/games/${game.slug}`} className="group grid min-h-[260px] overflow-hidden border border-border/80 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.06),rgb(166_92_255_/_0.04),rgb(255_87_77_/_0.03))] shadow-[0_20px_80px_rgb(0_0_0_/_0.6),0_0_30px_rgb(62_231_255_/_0.05)] transition hover:border-cyan/70 hover:shadow-[0_0_32px_rgb(62_231_255_/_0.14)]">
```

Add on the inner `<img>` tag (line 292):

```tsx
        <img src={game.coverUrl} alt={game.title} className="img-glitch-hover absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.035]" />
```

- [ ] **Step 5: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/game-card.tsx apps/web/app/page.tsx
git commit -m "feat: add holographic depth, img glitch hover to game cards"
```

---

### Task 4: Site Header — Glass Upgrade & Scanning Border

**Files:**
- Modify: `apps/web/components/site-header.tsx`

- [ ] **Step 1: Update header classes**

In `site-header.tsx`, replace the `<header>` className (line 59):

```tsx
    <header className="sticky top-0 z-40 border-b border-border/45 glass">
```

- [ ] **Step 2: Update search input to add terminal cursor blink**

Replace the search `<input>` tag (lines 87-94), add a blinking cursor pseudo-element styling via a class. Add `caret-cyan`:

```tsx
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults) setSearchOpen(true); }}
                placeholder="Search games, studios, genres..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60 caret-cyan"
              />
```

- [ ] **Step 3: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/site-header.tsx
git commit -m "feat: glass header, terminal cursor on search"
```

---

### Task 5: Feed Item — Scanning Border & Stagger

**Files:**
- Modify: `apps/web/components/feed-item.tsx`

- [ ] **Step 1: Add scanning border and hover glow**

Replace the outer `<Link>` className (line 14):

```tsx
      className="clip-corner block border border-border/60 bg-[#050b0f]/50 p-4 transition-colors hover:border-cyan/30 animate-scan-top relative overflow-hidden"
```

- [ ] **Step 2: Add signal dot for feed items**

After the closing `</Link>` tags — before the second `<span>` in line 25, add:

After the devlog/roadmap badge `<span>` (line 25), insert a signal dot on the right side. Add on line 28 before `</div>`:

Actually, add a signal dot as an absolute element. Change the top-level structure. Instead of modifying inner structure, add a signal dot as a child of the Link:

After the opening `<Link>` tag, add:

```tsx
        <span className="signal-dot absolute right-3 top-3" aria-hidden />
```

- [ ] **Step 3: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/feed-item.tsx
git commit -m "feat: scanning border and signal dot on feed items"
```

---

### Task 6: Section Heading — Scanning Highlight

**Files:**
- Modify: `apps/web/components/section-heading.tsx`

- [ ] **Step 1: Add scanning highlight overlay**

Replace the outer `<div>` and inner structure (lines 11-17):

```tsx
  return (
    <div className="mb-6 animate-scan-highlight relative overflow-hidden">
      {tag && (
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan">{tag}</p>
      )}
      <Tag className="font-display text-2xl font-semibold tracking-tight">{children}</Tag>
    </div>
  );
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/section-heading.tsx
git commit -m "feat: scanning highlight on section headings"
```

---

### Task 7: Status Badge — Flicker Animation

**Files:**
- Modify: `apps/web/components/status-badge.tsx`

- [ ] **Step 1: Add flicker for live/highlight statuses**

Replace the return statement (lines 17-23):

```tsx
export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] ?? 'border-border text-muted-foreground';
  const shouldFlicker = status === 'FEATURED' || status === 'BETA';
  return (
    <span className={`inline-block rounded-none border bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm ${style} ${shouldFlicker ? 'animate-flicker' : ''}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/status-badge.tsx
git commit -m "feat: flicker animation on featured/beta status badges"
```

---

### Task 8: Button — Clip Corner & Glow Override

**Files:**
- Modify: `apps/web/components/ui/button.tsx`

- [ ] **Step 1: Override shadcn button with cyberpunk style**

Replace the `buttonVariants` definition (lines 7-33):

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-mono uppercase tracking-widest transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'border border-cyan bg-cyan/10 text-cyan shadow-[0_0_20px_rgb(62_231_255_/_0.15)] hover:bg-cyan hover:text-cyan-foreground hover:shadow-[0_0_30px_rgb(62_231_255_/_0.25)]',
        destructive:
          'border border-coral bg-coral/10 text-coral shadow-[0_0_20px_rgb(255_87_77_/_0.15)] hover:bg-coral hover:text-coral-foreground hover:shadow-[0_0_30px_rgb(255_87_77_/_0.25)]',
        outline:
          'border border-border bg-transparent text-muted-foreground hover:border-cyan hover:text-cyan hover:shadow-[0_0_16px_rgb(62_231_255_/_0.1)]',
        secondary:
          'border border-violet/30 bg-violet/5 text-violet hover:bg-violet hover:text-violet-foreground',
        ghost:
          'text-muted-foreground hover:bg-cyan/5 hover:text-cyan',
        link: 'text-cyan underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-8 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-12 px-8 text-sm has-[>svg]:px-6',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/ui/button.tsx
git commit -m "feat: cyberpunk button styles with clip-corner and glows"
```

---

### Task 9: Search Field & Input — Focus Glow

**Files:**
- Modify: `apps/web/components/search-field.tsx`

- [ ] **Step 1: Update input styling**

Replace the `<input>` className (line 20):

```tsx
        className="w-full border border-input bg-elevated py-2.5 pl-10 pr-4 font-mono text-xs uppercase tracking-widest text-foreground placeholder:text-muted-foreground/40 focus:border-cyan focus:shadow-[0_0_16px_rgb(62_231_255_/_0.2)] focus:outline-none caret-cyan"
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/search-field.tsx
git commit -m "feat: focus glow on search inputs"
```

---

### Task 10: Loading Skeleton — Scan Shimmer

**Files:**
- Modify: `apps/web/components/loading-skeleton.tsx`

- [ ] **Step 1: Replace pulse with shimmer**

Replace the component (lines 1-14):

```tsx
interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export function LoadingSkeleton({ count = 4, height = 'h-24' }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`shimmer border border-border/60 bg-elevated ${height}`} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/loading-skeleton.tsx
git commit -m "feat: scan shimmer on loading skeletons"
```

---

### Task 11: Empty State — Terminal Frame

**Files:**
- Modify: `apps/web/components/empty-state.tsx`

- [ ] **Step 1: Upgrade to terminal style**

Replace the component (lines 1-27):

```tsx
import type { ReactNode } from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 border border-border/60 bg-[#050b0f]/80 py-16 relative overflow-hidden animate-scan-top">
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground/50">
        <span className="animate-blink inline-block w-2 h-3 bg-cyan mr-2 align-middle shadow-[0_0_6px_rgb(62_231_255_/_0.5)]" aria-hidden />
        NO DATA DETECTED
      </p>
      {icon && <div className="text-muted-foreground/30">{icon}</div>}
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-2 clip-corner border border-coral bg-coral/10 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-coral shadow-[0_0_16px_rgb(255_87_77_/_0.1)] transition hover:bg-coral hover:text-coral-foreground hover:shadow-[0_0_24px_rgb(255_87_77_/_0.2)]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/empty-state.tsx
git commit -m "feat: terminal-style empty state with cursor blink"
```

---

### Task 12: Error State — Glitch Frame

**Files:**
- Modify: `apps/web/components/error-state.tsx`

- [ ] **Step 1: Add glitch aesthetic**

Replace the component (lines 1-20):

```tsx
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 border border-coral/40 bg-coral/[0.03] py-16 relative overflow-hidden animate-scan-top">
      <p className="font-mono text-xs uppercase tracking-widest text-coral animate-glitch-sparse">
        <span className="inline-block size-1.5 bg-coral mr-2 shadow-[0_0_8px_rgb(255_87_77_/_0.6)]" aria-hidden />
        SIGNAL CORRUPTED
      </p>
      <p className="text-sm text-muted-foreground max-w-sm text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 clip-corner border border-coral bg-coral/10 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-coral shadow-[0_0_16px_rgb(255_87_77_/_0.1)] transition hover:bg-coral hover:text-coral-foreground hover:shadow-[0_0_24px_rgb(255_87_77_/_0.2)] cursor-pointer"
        >
          RETRY CONNECTION
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/error-state.tsx
git commit -m "feat: glitch-style error state"
```

---

### Task 13: Media Gallery — Image Glitch Hover

**Files:**
- Modify: `apps/web/components/media-gallery.tsx`

- [ ] **Step 1: Add img-glitch-hover class to thumbnail images**

In the screenshots grid, on the `<img>` tag (line 76):

```tsx
              <img src={m.thumbnailUrl ?? m.url} alt={m.caption ?? ''} className="img-glitch-hover aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105" />
```

Also update the trailer thumbnail (line 47):

```tsx
                <img src={m.thumbnailUrl} alt={m.caption ?? ''} className="img-glitch-hover aspect-video w-full object-cover" />
```

And the fallback trailer img (line 49):

```tsx
                <img src={m.url} alt={m.caption ?? ''} className="img-glitch-hover aspect-video w-full object-cover opacity-80" />
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/media-gallery.tsx
git commit -m "feat: image glitch hover on media gallery"
```

---

### Task 14: Data Stream Component

**Files:**
- Create: `apps/web/components/data-stream.tsx`

**Interfaces:**
- Produces: `<DataStream />` component rendered once in layout

- [ ] **Step 1: Create the DataStream component**

```tsx
'use client';

import { useEffect, useRef } from 'react';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}|/\\';
const FONT_SIZE = 12;
const COLUMNS_GAP = 1;

export function DataStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastScroll = window.scrollY;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const columns = Math.floor(canvas.width / (FONT_SIZE + COLUMNS_GAP));
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * canvas.height / FONT_SIZE);

    const draw = () => {
      const scrollDelta = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      const speedMult = 1 + Math.abs(scrollDelta) * 0.04;

      ctx.fillStyle = 'rgba(2, 7, 11, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < drops.length; i += 2) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * (FONT_SIZE + COLUMNS_GAP);
        const y = drops[i] * FONT_SIZE;

        ctx.fillStyle = 'rgba(62, 231, 255, 0.08)';
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i] += speedMult * 0.5;
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.35 }}
    />
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/data-stream.tsx
git commit -m "feat: add canvas-based data-stream (matrix rain) component"
```

---

### Task 15: Scroll Reveal Hook

**Files:**
- Create: `apps/web/lib/use-scroll-reveal.ts`

**Interfaces:**
- Produces: `useScrollReveal()` hook returning `ref` callback

- [ ] **Step 1: Create the hook**

```ts
'use client';

import { useEffect, useRef } from 'react';

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('animate-fadeIn');
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/use-scroll-reveal.ts
git commit -m "feat: add scroll-triggered reveal hook"
```

---

### Task 16: Layout Integration — DataStream + ScrollReveal

**Files:**
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Add DataStream and scroll reveal wrapper**

Update the layout (already modified for JetBrains Mono in Task 1). Now add `DataStream` to the body after `Providers`:

```tsx
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';
import { CookieConsent } from '@/components/cookie-consent';
import { DataStream } from '@/components/data-stream';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Playmorrow — Discover tomorrow's indie games today",
    template: '%s · Playmorrow',
  },
  description:
    'Playmorrow is a curated social platform where indie studios showcase their games, share devlogs, publish roadmaps, grow communities, and connect with players, press, and publishers.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://playmorrow.vercel.app'),
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: 'summary_large_image',
    title: "Playmorrow — Discover tomorrow's indie games today",
    description: 'The social discovery layer for indie games.',
  },
  openGraph: {
    title: "Playmorrow — Discover tomorrow's indie games today",
    description: 'The social discovery layer for indie games.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-background font-body text-foreground antialiased">
        <DataStream />
        <Providers>
          <div className="relative flex min-h-screen flex-col z-10">
            {children}
            <CookieConsent />
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

Note: Remove the `mono` font variable since body and mono are now the same. Remove `JetBrains_Mono, Inter` if Inter is still imported (should be only `Space_Grotesk, JetBrains_Mono` now).

Also remove the `mono = JetBrains_Mono({...})` block and its `variable: '--font-mono'` line. Instead, use `body.variable` for `--font-mono` by renaming the mono CSS variable:

In `globals.css`, change line 89:
```css
  --font-family-mono: var(--font-body), ui-monospace, SFMono-Regular, monospace;
```

(Since `--font-body` = JetBrains Mono, and `--font-mono` also needs to be JetBrains Mono now.)

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/globals.css
git commit -m "feat: integrate data-stream, mono body font throughout"
```

---

### Task 17: Glitch Page Transitions (template.tsx)

**Files:**
- Create: `apps/web/app/template.tsx`

**Interfaces:**
- Produces: Page transition wrapper with glitch exit animation

- [ ] **Step 1: Create template.tsx**

```tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';

export default function PageTemplate({ children }: { children: ReactNode }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    setGlitching(false);
  }, [children]);

  return (
    <div
      className={glitching ? 'animate-glitch-sparse' : ''}
      style={{ transition: 'opacity 0.15s ease-out' }}
    >
      {children}
    </div>
  );
}
```

Since Next.js template.tsx remounts on navigation, simply having the glitch class on initial mount gives a subtle glitch entrance. The glitch effect lasts ~200ms due to the keyframe timing. No explicit exit animation needed — the remount creates a natural "glitch entrance" for each navigation.

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/template.tsx
git commit -m "feat: glitch page transition via template.tsx"
```

---

### Task 18: Homepage Integration — Circuit Frame + Atmospheric Polish

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Add HexGrid to hero section**

In the homepage, after the opening `<main>` tag, the first section already has the gradient background. Replace the inline background divs with the `HexGrid` component:

At the top of the file, add the import:

```tsx
import { CircuitFrame, HudPanel, HudStatusRail, HexGrid } from '@/components/playmorrow/hud';
```

Then in the hero section (around line 37), replace the inline grid div with:

```tsx
        <HexGrid className="opacity-70" />
```

Keep the existing `CircuitFrame` and top gradient line.

- [ ] **Step 2: Update the "How it works" cards**

Replace each card's outer div className (lines 127, 136, 145). Change from:

```tsx
<div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
```

To:

```tsx
<div className="clip-corner border border-border/70 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.05),rgb(166_92_255_/_0.03),rgb(255_87_77_/_0.02))] p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3),0_0_16px_rgb(62_231_255_/_0.04)] hover:border-cyan/40 hover:shadow-[0_0_40px_rgb(0_0_0_/_0.4),0_0_24px_rgb(62_231_255_/_0.08)] transition-all duration-300 animate-scan-top relative overflow-hidden">
```

- [ ] **Step 3: Update CTA buttons to use stronger glows**

On line 170, update the cyan CTA:

```tsx
                className="clip-corner flex items-center gap-2 border border-cyan bg-cyan/10 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-cyan shadow-[0_0_24px_rgb(62_231_255_/_0.15)] transition hover:bg-cyan hover:text-background hover:shadow-[0_0_36px_rgb(62_231_255_/_0.25)]">
```

- [ ] **Step 4: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: homepage hex grid, holographic how-it-works cards, stronger CTA glows"
```

---

### Task 19: Final Verification — Build + E2E

- [ ] **Step 1: Run full typecheck**

```bash
cd apps/web && pnpm typecheck
```

Expected: PASS with no errors

- [ ] **Step 2: Run lint**

```bash
cd apps/web && pnpm lint
```

Expected: PASS with no errors

- [ ] **Step 3: Run build**

```bash
cd apps/web && pnpm build
```

Expected: Build succeeds with no errors

- [ ] **Step 4: Manual verification**

Start dev server and verify:
- Homepage: hex grid visible, scanlines visible, cards have holographic depth
- Header: glass effect, scanning bottom border
- Game cards: image glitch on hover, signal dots, holographic panel
- Feed items: scanning top border
- Section headings: scanning highlight animation
- Status badges: flicker on featured/beta
- Buttons: clip-corner + glow
- Loading skeletons: shimmer effect
- Empty states: terminal frame with cursor blink
- Error states: glitch text
- Media gallery: image glitch hover on thumbnails
- Data stream: subtle matrix rain in background
- Page transitions: subtle glitch on navigation

```bash
cd apps/web && pnpm dev
```

- [ ] **Step 5: Commit if any remaining changes**

```bash
git add -A
git commit -m "chore: final verification and polish"
```
