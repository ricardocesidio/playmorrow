# Deepened Cyberpunk v2 — Visual Design Spec

**Date:** 2026-07-02
**Status:** Approved
**Scope:** Full application (all pages, all components)

## Overview

Extend the existing Playmorrow v2 design system aggressively with layered cyberpunk
visual effects: scanlines, noise, hexagonal grids, glitch typography, animated
borders, holographic depth, and data-stream backgrounds. No constraints on
performance or animation complexity.

## 1. Global Atmosphere (CSS base layer)

### Layer Stack (bottom to top)

1. **Ambient glow gradients** — radial gradients at 3 positions:
   - Cyan at 20%/15% (top-left), coral at 85%/5% (top-right), violet at 50%/80% (bottom-center)
   - Opacity: 4-7%, large spreads (35-45rem)
2. **Hexagonal background grid** — `conic-gradient` based patterns, 48px tile size, cyan tinted
3. **CRT scanlines** — `repeating-linear-gradient` every 3px, 3-4% white opacity
4. **Film grain noise** — SVG `feTurbulence` with fractalNoise at baseFrequency 0.65, 3 octaves, 8-10% opacity via feColorMatrix
5. **Content** — panels, cards, text on top

### Global overrides

- `body` gets full layer stack (extends current radial gradients)
- All panels get scanline pseudo-element via `.pm-scanline` class
- `::selection` updates to cyan glow
- Scrollbar gets border-bright thumb with zero-radius (no change needed)

## 2. Typography & Glitch Effects

### Heading glitch (mixed approach)

- **`@keyframes glitch-rgb`**: Two offset pseudo-elements (cyan top half, coral bottom half) with translateX jitter. Applied via `.glitch-text` utility on hero headings only.
- **`@keyframes glitch-random`**: Occasional 1-2 frame glitch at random intervals (CSS animation-delay-based). Applied sparingly via `.glitch-sparse`.
- **`@keyframes glow-pulse`**: Text-shadow intensity oscillates. Applied to headings that don't use RGB split.

### Scanning highlight

- **`@keyframes scan-highlight`**: Semi-transparent horizontal bar (4px, gradient) sweeps top to bottom across `.section-heading` elements every 4s.

### Mono everywhere

- Body text switches from Inter to JetBrains Mono
- `letter-spacing: 0.02em` on body
- Headings remain Space Grotesk (display font)
- All UI labels, badges, buttons use JetBrains Mono at current tracking values

## 3. Panels, Cards & Borders

### Animated borders (3 effects)

- **Scanning bar (`.border-scan`)**: Pseudo-element on card top edge — 1px gradient bar sweeps left-to-right (3s infinite). Applied to all `.panel` and card components.
- **Circuit trace (`.border-circuit`)**: `conic-gradient` rotating border via border-image or mask-composite technique. Applied to `.panel` on hover.
- **Corner brackets (`.panel` existing)**: Already implemented via `::before`/`::after` on `HudPanel`. Extend to all `.panel` usage.

### Holographic card depth

- Multi-layer box-shadow:
  - `0 20px 80px rgba(0,0,0,0.6)` — base shadow
  - `0 0 30px rgba(62,231,255,0.05)` — cyan aura
  - `inset 0 1px 0 rgba(255,255,255,0.02)` — top highlight
- Background: `linear-gradient(135deg, rgba(62,231,255,0.06), rgba(166,92,255,0.04), rgba(255,87,77,0.03))`
- Corner signal dot (6px, cyan, glow) at top-right

## 4. Interactive Elements

### Buttons

- Keep current clipped-corner style (`clip-path: polygon(8px 0,100% 0,100% calc(100%-8px),...)`)
- Add stronger box-shadow glows on colored variants
- Primary: `shadow-[0_0_24px_rgb(62,231,255,0.22)]`
- Coral: `shadow-[0_0_24px_rgb(255,87,77,0.22)]`
- Hover: scale 1.02 with shadow intensity increase

### Hover effects on cards

- **Border glow pulse (`.card-hover-glow`)**: Border transitions from `border` → `cyan/70` on hover with `shadow-[0_0_28px_rgb(62,231,255,0.11)]` (already partially implemented)
- **Image glitch (`.img-glitch-hover`)**: Cover images get RGB offset filter on hover via CSS filter or pseudo-element overlay

### Focus states

- Inputs glow cyan on focus: `box-shadow: 0 0 16px rgba(62,231,255,0.25)` with expanded ring
- All focus-visible get cyan ring (already partially done)

### Cursor

- Default browser cursor (no custom cursor)

## 5. Transitions & Scroll

### Page entrance

- **Enhanced fadeIn (`.animate-fadeIn-stagger`)**:
  - Container: `animation: fadeIn 0.6s ease-out both`
  - Direct children get `animation: fadeIn 0.5s ease-out both` with `animation-delay: calc(var(--i) * 80ms)`
  - Elements animate opacity 0→1 and translateY(12→0)

### Scroll effects

- **Parallax background**: Circuit grid pattern moves at 0.3x scroll speed via `background-attachment: fixed` or `transform: translateY(var(--scroll-offset))` with scroll listener
- **Scroll-triggered reveal (`.reveal-on-scroll`)**: Existing `animate-fadeIn` applied via IntersectionObserver when element enters viewport
- **Data-stream background (`.data-stream-bg`)**: Fixed-position canvas or SVG element rendering falling matrix-like characters at low opacity, scroll speed modulates character fall rate

### Navigation transitions

- **Glitch exit**: On route change, current page content gets brief (200ms) glitch distortion before transition. Implement via Next.js `onRouteChangeStart` or template.tsx exit animation. Content shifts 3px with RGB split overlay, then clears.

## 6. Component Map

| Component | Effects Applied |
|---|---|
| `site-header.tsx` | Glass backdrop, scanning border bottom |
| `nav.tsx` links | Active state: cyan glow underline + signal dot |
| `search-field.tsx` | Terminal-style input, focus glow |
| `page.tsx` (homepage) | All atmosphere layers, data-stream, parallax |
| `game-card.tsx` | Holographic depth, img glitch hover, scanning border |
| `feed-item.tsx` | Scanning border, staggered fadeIn |
| `status-badge.tsx` | Flicker animation on LIVE/FEATURED statuses |
| `playmorrow/hud.tsx` | Circuit frame stays, add hex grid option, corner brackets on all panels |
| `section-heading.tsx` | Scanning highlight animation |
| `site-footer.tsx` | Data-stream background |
| `empty-state.tsx` | Terminal frame style |
| `error-state.tsx` | Glitch frame style |
| `loading-skeleton.tsx` | Scan shimmer effect |
| `media-gallery.tsx` | Image glitch hover on thumbnails |
| `button.tsx` (shadcn) | Replace shadcn rounded styles with clipped-corner + glow |
| `dashboard/` components | Full panel effects, scanning borders |
| Auth pages (`login/`, `register/`) | Auth collage + scan overlay |
| `devlogs/` pages | Stagger reveal + holographic panels |
| All forms/inputs | Focus glow effect |

## 7. Implementation Strategy

### File changes

- **`app/globals.css`**: ~200 new lines — keyframes, utility classes, layer overrides
- **`components/playmorrow/hud.tsx`**: Add hex grid variant, extend HudPanel corner brackets
- **`components/game-card.tsx`**: Update shadow/hover classes
- **`components/site-header.tsx`**: Glass styling upgrade
- **`components/feed-item.tsx`**: Scanning border + stagger
- **`components/section-heading.tsx`**: Scanning highlight animation
- **`components/status-badge.tsx`**: Flicker keyframe
- **`components/ui/button.tsx`**: Clip-corner + glow override
- **`components/loading-skeleton.tsx`**: Scan shimmer
- **`components/empty-state.tsx`**: Terminal frame
- **`components/error-state.tsx`**: Glitch frame
- **`components/media-gallery.tsx`**: Img glitch hover
- **`components/search-field.tsx`**: Focus glow
- **New: `components/cyberpunk/data-stream.tsx`**: Canvas-based matrix rain component
- **New: `components/cyberpunk/scroll-reveal.tsx`**: IntersectionObserver wrapper
- **`app/layout.tsx`**: Add data-stream to body, wrap with scroll effects provider

### Order of implementation

1. `globals.css` — all keyframes, utility classes, base layer overrides
2. `hud.tsx` + `site-header.tsx` — shell components
3. Cards (`game-card.tsx`, `feed-item.tsx`) — most visible
4. Interactive (`button.tsx`, `search-field.tsx`, hover utilities)
5. Badge/status/misc components
6. Scroll + data-stream new components
7. Page-level integration (homepage, dashboard, auth, etc.)
8. Final polish pass — timing, performance, cross-browser

## 8. Color Palette (unchanged)

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#02070b` | Page background |
| `--elevated` | `#071117` | Panel backgrounds |
| `--card` | `#09161d` | Card backgrounds |
| `--cyan` | `#3ee7ff` | Primary accent, glows |
| `--coral` | `#ff574d` | Danger, CTA, live indicators |
| `--violet` | `#a65cff` | Secondary accent, alpha status |
| `--amber` | `#e4a83b` | Warning, pre-alpha status |
| `--success` | `#70ff9b` | Success, connected |
| `--error` | `#ff574d` | Error (same as coral) |
| `--muted` | `#0d1a22` | Muted backgrounds |
| `--muted-foreground` | `#8c969b` | Muted text |
| `--border` | `#1b3038` | Default borders |
| `--border-bright` | `#51666d` | Brighter borders |
| `--input` | `#263940` | Input backgrounds |
| `--ring` | `var(--cyan)` | Focus ring |

## 9. Fonts (unchanged)

| Token | Font | Usage |
|---|---|---|
| `--font-family-display` | Space Grotesk | Headings |
| `--font-family-body` | JetBrains Mono | Body text (was Inter) |
| `--font-family-mono` | JetBrains Mono | Mono labels (merged with body) |

## 10. Browser/Device Support

- Modern browsers only (Chrome/Firefox/Safari last 2 versions)
- Fallback for browsers without `conic-gradient` (square grid fallback)
- `prefers-reduced-motion` already respected (keep existing `@media` rule)
- No IE11/legacy support needed
