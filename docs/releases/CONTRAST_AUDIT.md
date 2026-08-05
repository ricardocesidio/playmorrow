# WCAG AA Color Contrast Audit — Playmorrow

**Date:** 2026-08-05  
**Standard:** WCAG 2.2 Level AA  
**Thresholds:**
- Normal text (<18px or <24px non-bold): **4.5:1**
- Large text (≥18px bold or ≥24px): **3:1**
- UI components / icons: **3:1**
- Decorative text: no minimum (but flagged for awareness)

---

## Design Tokens (Source: `apps/web/app/globals.css`)

| Token | Hex | Luminance |
|-------|-----|-----------|
| `--background` | `#02070b` | 0.00163 |
| `--foreground` | `#f2f5f4` | 0.9078 |
| `--elevated` | `#071117` | 0.00464 |
| `--card` | `#09161d` | 0.00599 |
| `--muted` | `#0d1a22` | 0.00875 |
| `--muted-foreground` | `#8c969b` | 0.2945 |
| `--cyan` | `#3ee7ff` | 0.6474 |
| `--cyan-foreground` | `#021014` | 0.00405 |
| `--coral` | `#ff574d` | 0.2862 |
| `--coral-foreground` | `#120302` | 0.00186 |
| `--violet` | `#a65cff` | 0.2309 |
| `--violet-foreground` | `#f6efff` | 0.8837 |
| `--amber` | `#e4a83b` | 0.4499 |
| `--amber-foreground` | `#120b02` | 0.00477 |
| `--success` | `#70ff9b` | 0.7730 |
| `--border` | `#1b3038` | 0.0260 |
| `--accent-foreground` | `#dce7e7` | 0.8239 |

Background variants found in code: `#020609` (dashboard), `#000000` (body/footer override), `#050b0f` (empty-state).

> **Note:** `body` in `globals.css` applies `@apply bg-background` then overrides with `background: #000`, making the effective body background pure black. Dashboards use `bg-[#020609]`. These three backgrounds (black, #020609, #02070b) are treated interchangeably below as "dark background" since their luminances differ by <0.001.

---

## Findings

### 🔴 FAIL — Must Fix

#### F1. text-muted-foreground/30 on dark backgrounds
| Property | Value |
|----------|-------|
| Foreground hex (effective) | `#2b3135` (approx) |
| Background hex | `#020609` or `#000000` |
| Contrast ratio | **1.22 : 1** (bg=black) / **1.25 : 1** (bg=#020609) |
| Required | 4.5:1 (normal) or 3:1 (large) |
| Verdict | **FAIL — decorative only; not readable** |
| Locations | EmptyState icon container (`text-muted-foreground/30`) line 18 |
| Fix | Use `text-muted-foreground/60` (\(\approx\)1.58:1, still fails) or switch to full `text-muted-foreground` (6.67:1). For decorative-only contexts, this is acceptable (WCAG exempts decorative content). |

#### F2. text-muted-foreground/50 on dark backgrounds
| Property | Value |
|----------|-------|
| Foreground hex (effective) | `#474e52` (approx) |
| Background hex | `#020609`, `#050b0f`, or `#000000` |
| Contrast ratio | **1.38–1.45 : 1** |
| Required | 4.5:1 (normal) |
| Verdict | **FAIL** |
| Locations | |
| | `empty-state.tsx:14` — `font-mono text-[0.6rem] ... text-muted-foreground/50` |
| | `site-footer.tsx:39` — legal links `text-muted-foreground/50` on `bg-black` |
| | `notification-dropdown.tsx:119` — `text-xs text-muted-foreground/50` |
| | `feed-item.tsx:26` — type badge `text-muted-foreground/50` |
| | `support/ticket-card.tsx` — multiple timestamp elements `/50` |
| | `cookie-consent.tsx:100` — button `text-muted-foreground/50` |
| Fix | Raise to `text-muted-foreground/85` to reach 4.5:1 (\(\approx\)#767f84, L=0.217), or use full `text-muted-foreground` (CR 6.67). Minimum opacity for 4.5:1 on black is \(\approx\)85%. |

#### F3. text-muted-foreground/60 on dark backgrounds
| Property | Value |
|----------|-------|
| Foreground hex (effective) | `#545a5e` (approx) |
| Background hex | `#020609` or `#000000` |
| Contrast ratio | **1.54–1.56 : 1** |
| Required | 4.5:1 (normal) |
| Verdict | **FAIL** |
| Locations | |
| | `site-footer.tsx:46` — copyright `text-muted-foreground/60` on `bg-black` |
| | `feed-item.tsx:26` — type badge |
| | `report-form.tsx:32,39` — labels and submitted message |
| | `support/ticket-card.tsx:46` — timestamp |
| | `notification-dropdown.tsx:34` — timestamp |
| | `trending-section.tsx:57` — studio name `text-[0.5rem]` |
| Fix | Raise to `text-muted-foreground/85` or full `text-muted-foreground`. |

#### F4. text-muted-foreground/70 on dark backgrounds
| Property | Value |
|----------|-------|
| Foreground hex (effective) | `#62696c` (approx) |
| Background hex | `#000000` (footer) or `#020609` |
| Contrast ratio | **3.85 : 1** (on black) / **3.93 : 1** (on #020609) |
| Required | 4.5:1 (normal text) |
| Verdict | **FAIL for normal text** (\(\leq\)4.5:1). Passes for large text only (\(\geq\)3:1). |
| Locations | |
| | `site-footer.tsx:32-36` — help center links `text-[0.6rem] font-mono text-muted-foreground/70` |
| Fix | Use full `text-muted-foreground` (6.67:1) or raise to `text-muted-foreground/85` (4.5:1). |

#### F5. text-white on bg-cyan (#3ee7ff)
| Property | Value |
|----------|-------|
| Foreground hex | `#ffffff` (L=1.0) |
| Background hex | `#3ee7ff` (L=0.6474) |
| Contrast ratio | **1.51 : 1** |
| Required | 4.5:1 (normal) or 3:1 (large) |
| Verdict | **FAIL for all text sizes** |
| Location | `stripe-payment.tsx:44` — `bg-cyan px-5 font-mono text-xs text-white` (Pay button) |
| Fix | Use `text-cyan-foreground` (`#021014`) for CR 12.90:1. This is already defined in the design tokens and used correctly in button hover states (e.g. the default button variant). |

#### F6. text-violet-foreground (#f6efff) on bg-violet (#a65cff)
| Property | Value |
|----------|-------|
| Foreground hex | `#f6efff` (L=0.8837) |
| Background hex | `#a65cff` (L=0.2309) |
| Contrast ratio | **3.32 : 1** |
| Required | 4.5:1 (normal, for text-sm=14px) |
| Verdict | **FAIL for normal text** (\(\leq\)4.5:1). Passes for large text (\(\geq\)3:1). |
| Location | `button.tsx:19` — secondary button hover state: `hover:bg-violet hover:text-violet-foreground`, applied to `text-sm` (14px) text |
| Fix | Either (a) darken violet to `#8a44e0` (L=0.152) to achieve 4.69:1, (b) lighten violet-foreground to `#ffffff` (CR 3.56 — still fails normal), or (c) accept 3.32:1 as sufficient for the hover state's brief duration (WCAG does not explicitly exempt hover states, but 3.32:1 meets the 3:1 UI component threshold for large/interactive text). Option (a) preferred if retaining current text size. |

---

### 🟢 PASS — Verified Compliant

#### Primary text combinations

| # | Foreground | Background | CR | For | 
|---|-----------|------------|-----|------|
| P1 | `text-foreground` `#f2f5f4` | `bg-background` `#02070b` | **18.55:1** | All text |
| P2 | `text-foreground` `#f2f5f4` | `bg-card` `#09161d` | **17.11:1** | All text |
| P3 | `text-foreground` `#f2f5f4` | `bg-elevated` `#071117` | **18.03:1** | All text |
| P4 | `text-muted-foreground` `#8c969b` (full) | `bg-background` `#02070b` | **6.67:1** | All text |
| P5 | `text-muted-foreground` `#8c969b` (full) | `bg-card` `#09161d` | **6.15:1** | All text |
| P6 | `text-muted-foreground` `#8c969b` (full) | `bg-black` `#000000` | **6.89:1** | All text |
| P7 | `text-white` `#ffffff` | `bg-background` `#02070b` | **19.3:1** | All text |

#### Accent text on dark backgrounds

| # | Foreground | Background | CR | For | 
|---|-----------|------------|-----|------|
| P8 | `text-cyan` `#3ee7ff` | `bg-background` `#02070b` | **13.51:1** | All text |
| P9 | `text-coral` `#ff574d` | `bg-background` `#02070b` | **6.51:1** | All text |
| P10 | `text-violet` `#a65cff` | `bg-background` `#02070b` | **5.44:1** | All text |
| P11 | `text-amber` `#e4a83b` | `bg-background` `#02070b` | **9.68:1** | All text |
| P12 | `text-success` `#70ff9b` | `bg-background` `#02070b` | **15.94:1** | All text |

#### Accent text on accent-tinted backgrounds (10% opacity)

| # | Foreground | Background (effective) | CR | For |
|---|-----------|------------------------|-----|------|
| P13 | `text-cyan` `#3ee7ff` | `bg-cyan/10` `#081c22` | **12.16:1** | All text |
| P14 | `text-coral` `#ff574d` | `bg-coral/10` `#1b0e10` | **6.10:1** | All text |
| P15 | `text-violet` `#a65cff` | `bg-violet/5` `#0a0a15` | **5.27:1** | All text |
| P16 | `text-amber` `#e4a83b` | `bg-amber/5` `#0d0e0b` | **9.24:1** | All text |

#### Button accent combos (hover/filled states)

| # | Foreground | Background | CR | For |
|---|-----------|------------|-----|------|
| P17 | `text-cyan-foreground` `#021014` | `bg-cyan` `#3ee7ff` | **12.90:1** | All text |
| P18 | `text-coral-foreground` `#120302` | `bg-coral` `#ff574d` | **6.48:1** | All text |
| P19 | `text-coral` `#ff574d` | `bg-coral/15` `#281213` | **5.91:1** | All text |
| P20 | `text-cyan` `#3ee7ff` | `bg-cyan/5` `#051115` | **12.80:1** | All text |

#### UI elements

| # | Foreground | Background | CR | For |
|---|-----------|------------|-----|------|
| P21 | `text-coral-foreground` `#120302` | `bg-coral` `#ff574d` | **6.48:1** | UI |
| P22 | `text-white` `#ffffff` | `bg-coral` `#ff574d` | **3.12:1** | UI (\(\geq\)3:1) |
| P23 | `text-muted-foreground` `#8c969b` | `bg-muted` `#0d1a22` | **5.67:1** | All text |
| P24 | `text-accent-foreground` `#dce7e7` | `bg-accent` `#10222b` | **7.93:1** | All text |

---

### 🟡 Borderline — Review Recommended

| # | Combo | CR | Issue |
|---|-------|-----|-------|
| B1 | `text-white` on `bg-coral` | 3.12:1 | Passes 3:1 UI component threshold (used on notification badges). Text is 9px bold — technically UI component, not body text. Marginally passing. |
| B2 | `text-coral` on `bg-coral/10` | 6.10:1 | Passes but 6.10 is lowest of all primary accent combos. Still safely above 4.5:1. |

---

## Summary

| Category | Count |
|----------|-------|
| **FAIL — Must Fix** | 6 distinct color combinations |
| **PASS — Verified** | 24 combinations |
| **Borderline** | 2 combinations |
| **Total combos analyzed** | 32 |

### Root Cause

The primary failures are all variations of reduced-opacity `text-muted-foreground` (30–70%) on near-black backgrounds. `--muted-foreground` at `#8c969b` is intentionally muted for secondary/hint text, but applying additional opacity drives contrast well below readability thresholds.

The two accent-on-accent failures (`text-white` on `bg-cyan` and `text-violet-foreground` on `bg-violet`) are one-off issues where the wrong foreground token was applied.

### Recommended Fixes (Priority Order)

#### High Impact (affects many pages)

1. **Replace all `text-muted-foreground/30`, `/40`, `/50`, `/60`, `/70` with full `text-muted-foreground`** across: `empty-state.tsx`, `site-footer.tsx`, `feed-item.tsx`, `notification-dropdown.tsx`, `support/ticket-card.tsx`, `report-form.tsx`, `trending-section.tsx`, `cookie-consent.tsx`. 

   If reduced emphasis is the intent, use `text-muted-foreground/85` which achieves 4.5:1 on black backgrounds.

#### Single Point Fixes

2. **`stripe-payment.tsx:44`** — Change `text-white` to `text-cyan-foreground` on `bg-cyan` button (from CR 1.51:1 → 12.90:1).

3. **`button.tsx:19`** (secondary variant) — Darken `--violet` from `#a65cff` to `#8a44e0` so that `hover:bg-violet hover:text-violet-foreground` meets 4.5:1 (or change hover foreground to a darker shade).

### Estimated Effort

| Fix | Files | Time |
|-----|-------|------|
| Replace reduced-opacity muted-foreground | ~8 files | 30 min |
| Fix stripe-payment white-on-cyan | 1 file | 5 min |
| Fix secondary button hover contrast | 1 file (globals.css + button.tsx) | 15 min |
| **Total** | **~10 files** | **~50 min** |

---

## Methodology

Contrast ratios calculated using the WCAG 2.2 relative luminance formula:

```
L = 0.2126 × R + 0.7152 × G + 0.0722 × B

Where R, G, B are linearized:
  C_linear = C_srgb / 12.92               (if C_srgb ≤ 0.04045)
  C_linear = ((C_srgb + 0.055) / 1.055)²·⁴ (otherwise)

Contrast Ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```

Opacity-blended effective hex values were computed as:
```
R_eff = R_fg × α + R_bg × (1 − α)
```
(applied to each channel independently)

Colors extracted from `apps/web/app/globals.css` (CSS custom properties in `:root`). Component patterns identified via grep across `apps/web/components/**/*.tsx` (357+ matches scanned).
