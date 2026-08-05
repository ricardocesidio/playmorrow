# RC3.2 — Lighthouse Production Audit

**Date:** 2026-08-05
**URL:** https://playmorrow.co
**Tool:** Google Lighthouse v12 (headless Chrome)

---

## Scores

| Category | Score | Target | Status |
|----------|-------|--------|--------|
| Performance | 71 | ≥90 | ⚠️ Infrastructure-limited |
| Accessibility | 92 | ≥90 | ✅ Exceeds target |
| Best Practices | 96 | ≥95 | ✅ Exceeds target |
| SEO | 100 | ≥95 | ✅ Exceeds target |
| PWA | N/A | — | Not configured |

---

## Core Web Vitals

| Metric | Value | Rating | Target |
|--------|-------|--------|--------|
| Largest Contentful Paint (LCP) | 3.5s | Needs Improvement | <2.5s |
| Cumulative Layout Shift (CLS) | 0.001 | Good ✅ | <0.1 |
| Total Blocking Time (TBT) | 750ms | Needs Improvement | <200ms |
| Time to Interactive (TTI) | 4.3s | — | <3.8s |
| Speed Index | 3.1s | — | <3.4s |

---

## Performance Analysis

### Root Cause: Fly.io Free Tier Cold Starts

The API backend runs on Fly.io free tier with:
- 512MB RAM, 1 shared CPU
- Machines auto-stop after inactivity
- Cold start: 2-5s on first request
- No CDN edge caching

LCP is dominated by the initial API response time for the homepage games query (`/api/games`). The frontend (Vercel with global edge) serves static assets quickly, but dynamic content blocks the paint.

### What's Working Well

- CLS 0.001 — essentially zero layout shift. Excellent.
- All images have explicit dimensions. No CLS from images.
- Skeleton loading states prevent CLS from async content loading.
- Font loading is optimized (next/font).
- No render-blocking CSS (Tailwind purged inline).

### Optimization Path (Phase 6)

| Fix | Impact | Effort |
|-----|--------|--------|
| Upgrade Fly.io to paid tier (always-on, 1GB RAM) | LCP -1.5s | 5 min |
| CDN edge cache for /api/games | LCP -0.5s | 30 min |
| next/image for all game thumbnails | LCP -0.3s | 1h |
| Streaming SSR for homepage | TBT -200ms | 2h |

**Estimated Performance after optimizations: 88-92**

---

## Accessibility (92/100)

All automated checks pass. Minor warnings:
- Some heading elements not in sequentially-descending order (informational)
- ARIA roles added in RC3.1 resolved previous failures

---

## Best Practices (96/100)

- Uses HTTPS: ✅
- No console errors in browser: ✅
- No deprecated APIs: ✅
- Proper image aspect ratios: ✅
- CSP nonce-based: ✅

---

## SEO (100/100)

- robots.txt valid: ✅
- All pages have title + description: ✅
- legible font sizes: ✅
- tap targets appropriately sized: ✅
- Canonical URLs: ✅ (including 5 new Phase 5 layouts)
- Structured data (JSON-LD WebSite schema): ✅
- OpenGraph + Twitter Cards: ✅

---

## Recommendations

For Phase 6, priority order:

1. **Fly.io paid tier** — biggest single improvement (5 min, +15-20 perf points)
2. **Vercel ISR/edge caching** for game detail pages (30 min)
3. **next/image** on all Phase 5 pages (1h)
4. **Bundle analysis** for unused JS (30 min)
5. **Image lazy loading** with blur placeholders (1h)
