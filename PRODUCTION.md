# Playmorrow — Production Qualification & Deployment Checklist

**Last updated:** 2026-07-09 (post audit hardening)

This document exists because "curl says 401 on bad creds" is not enough. Use this before declaring prod healthy.

## 1. Required Environment Variables

### Railway (Backend `playmorrow-api-production`)

Must be set in Railway dashboard → Variables:

| Variable            | Example / Notes                                      | Required? | Notes |
|---------------------|------------------------------------------------------|-----------|-------|
| `DATABASE_URL`      | Neon pooler connection string                        | Yes       | With `?sslmode=require` if needed |
| `JWT_SECRET`        | Long random string (32+ chars)                       | Yes       | Used for access tokens + refresh |
| `SESSION_SECRET`    | Long random string                                   | Yes       | Session cookie handling |
| `CSRF_SECRET`       | Long random string (different from JWT)              | Yes       | HMAC for stateless CSRF (global guard) |
| `RESEND_API_KEY`    | `re_...`                                             | Yes       | Email verification + invites (was causing 500 on register) |
| `WEB_ORIGIN`        | `https://playmorrow.vercel.app`                      | Yes       | CORS |
| `COOKIE_DOMAIN`     | `.vercel.app`                                        | Recommended | For session cookies in prod |
| `NODE_ENV`          | `production`                                         | Yes       | Enables strict mode + early secret validation |
| `PORT`              | `4000` (or whatever Railway assigns)                 | No        | Defaults work |

After changing any of these → **Redeploy**.

The API will now **exit(1) immediately on boot** with a clear message if critical secrets are missing in production.

### Vercel (Frontend)

| Variable                  | Value                                              | Required? |
|---------------------------|----------------------------------------------------|-----------|
| `NEXT_PUBLIC_API_URL`     | `/api`                                             | Yes       |
| `API_URL`                 | `https://playmorrow-api-production.up.railway.app/api` | Yes (server routes) |
| `NEXT_PUBLIC_SITE_URL`    | `https://playmorrow.vercel.app`                    | Yes       |

## 2. Full Browser Production Smoke Test (do this after any deploy)

1. Open https://playmorrow.vercel.app in a fresh incognito window (no previous cookies).
2. Go to /register.
3. Create a new account with a real email you control (or a test inbox).
4. Check email for the 6-digit code (or use Resend dashboard / DB if needed).
5. Verify the email on /verify-email.
6. Log in.
7. Navigate to at least 4 different pages (home, a game, feed, dashboard).
8. Hard refresh (Cmd/Ctrl + Shift + R) on two of them — session must survive.
9. Perform a mutation (e.g. follow a game, post a comment, create a wishlist item).
10. Log out.
11. Confirm you are logged out and cannot access protected routes.
12. (Optional but recommended) Register a second account and test OAuth (Google + GitHub).

**If any step fails**, do not declare prod green. Paste the exact error + network tab here.

## 3. Quick curl checks (can be run from anywhere)

```bash
# Health
curl -s https://playmorrow-api-production.up.railway.app/health

# Login with bad creds (should 401, not 500)
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://playmorrow.vercel.app/api/auth/session/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test","password":"wrong"}'

# Register (will return 201 or 200 + requiresEmailVerification on success)
curl -s -X POST \
  https://playmorrow-api-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-test-'"$(date +%s)"'@example.com","password":"Test1234!@#","acceptedTerms":true,"acceptedPrivacy":true}'
```

## 4. Known Past Issues (for context)

- 2026-07-09: register returned 500 when RESEND_API_KEY was missing.
- CSRF tokens were previously broken (fixed in Session 10/11 with global HMAC guard).
- Various env var drift between Vercel and Railway.

## 5. GitHub Branch Protection (High priority from audit)

To prevent untested code reaching main:

1. Go to repo Settings > Branches > Branch protection rules > Add rule for `main`.
2. Enable "Require status checks to pass before merging".
3. Select the checks: "Lint & Typecheck", "Backend tests (Postgres)", "E2E (Playwright desktop + mobile)".
4. Also require "Require branches to be up to date before merging".
5. (Optional) Require 1 approving review.

After enabling, test by pushing a branch with a deliberate lint error — it should block merge.

## 6. After every production deploy

- [ ] Run the full browser smoke test above
- [ ] Check Railway logs for any `FATAL` or secret-related errors on boot
- [ ] Verify at least one real mutation works while logged in

**Full browser smoke test note:** This must be performed manually in a real browser (incognito). Automated Playwright can cover parts but session/cookie persistence across reloads is best verified manually.

---

**If you just fixed env vars or code related to auth/register**: run the browser test and update this file with the date + result.
