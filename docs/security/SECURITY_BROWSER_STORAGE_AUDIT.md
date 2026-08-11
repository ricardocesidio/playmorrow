# Playmorrow — Browser Storage Security Audit

**Date:** 2026-08-11
**Scope:** All localStorage, sessionStorage, IndexedDB, and document.cookie usage in `apps/web/`
**Verdict:** 🟢 **PASS — No stored credentials or PII**

---

## localStorage Usage

| File | Key | Data | Classification |
|------|-----|------|---------------|
| `components/cookie-consent.tsx:20,27` | `playmorrow-cookies` | `{ analytics, marketing, updatedAt }` | **SAFE** — cookie consent prefs |
| `components/analytics.tsx:11` | `playmorrow-cookies` | (read only) | **SAFE** — gates analytics loading |
| `components/loading/SplashProvider.tsx:14` | `playmorrow:visit-history` | Timestamp only | **SAFE** — splash screen gate |
| `hooks/useBootSequence.ts:19,53` | `playmorrow:visit-history` | Timestamp only | **SAFE** — boot animation tier |
| `hooks/useUiSound.ts:17,21` | `playmorrow:sound-muted` | `'1'` / `'0'` | **SAFE** — sound preference |
| `components/dashboard/PlayerDashboard.tsx:51,60` | `player-level` | Numeric user level | **SAFE** — level-up toast detection |
| `app/settings/notifications/page.tsx:46,107,199` | `playmorrow_notification_preferences` | Notification toggle prefs | **SAFE** — synced to backend |
| `app/dashboard/studios/[slug]/team/page.tsx:53,58` | `team-feed-${slug}` | JSON array of feed items | **SAFE** — ephemeral feed cache |
| `e2e/fixtures/mocks.ts:51` (+ 6 test files) | `playmorrow_token` | Mock JWT (test only) | **TEST-ONLY** — not production code |

## sessionStorage Usage

**None.** Zero `sessionStorage.getItem` or `sessionStorage.setItem` calls in `apps/web/`.

## IndexedDB Usage

**None.** Zero `indexedDB.open` or `indexedDB.databases` calls.

## CookieStore API Usage

**None.**

## document.cookie Usage

All 10 instances in `apps/web/` exclusively access `playmorrow_csrf` (the CSRF token cookie):

| File | Operation |
|------|-----------|
| `lib/api/client.ts:305` | **Read** — send as `X-CSRF-Token` header |
| `lib/api/auth-context.tsx:94` | **Write** — after login |
| `lib/api/auth-context.tsx:145` | **Delete** — on logout (maxAge=0) |
| `app/onboarding/page.tsx:189` | **Write** — after onboarding |
| `app/oauth/callback/page.tsx:21` | **Write** — after OAuth callback |
| `app/games/[slug]/page.tsx:1052` | **Read** — for mutations |
| `app/dashboard/games/[slug]/page.tsx:116` | **Read** — for mutations |
| `app/dashboard/games/new/page.tsx:120` | **Read** — for mutations |
| `app/dashboard/devlogs/[id]/page.tsx:206` | **Read** — for mutations |
| `app/dashboard/devlogs/new/page.tsx:110` | **Read** — for mutations |

## Critical Verifications

| Check | Result |
|-------|--------|
| Auth tokens in localStorage? | **NO** ✅ |
| JWTs in localStorage? | **NO** ✅ |
| Refresh tokens in localStorage? | **NO** ✅ |
| API keys in localStorage? | **NO** ✅ |
| Session tokens in document.cookie (JS-readable)? | **NO** — `playmorrow_session` is httpOnly ✅ |
| PII in browser storage? | **NO** ✅ |
| Passwords in browser storage? | **NO** ✅ |
| Email in browser storage? | **NO** ✅ |

## Summary

- **0 authentication tokens** in any browser storage mechanism
- **0 PII** stored client-side
- All localStorage usage is non-sensitive UX preferences
- CSRF token stored in non-httpOnly cookie (by design for `X-CSRF-Token` header)
- Session token protected by HttpOnly cookie (unreachable via JavaScript)
- **No security action required.**
