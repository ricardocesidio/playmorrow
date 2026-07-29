# Access Control Runbook

**Version:** 1.0 (2026-07-29)
**Owner:** Security Team

---

## Infrastructure Access

| Service | URL | Who Has Access | How to Grant | How to Revoke |
|---------|-----|----------------|--------------|---------------|
| **Fly.io** | https://fly.io/apps/playmorrow-api-aged-mountain-9542 | Founders, DevOps | Invite via Fly.io dashboard → Members | Remove member via dashboard |
| **Vercel** | https://vercel.com/ricardocesidio/playmorrow | Founders, Frontend team | Invite via Vercel dashboard → Team | Remove member via dashboard |
| **Neon** | https://console.neon.tech | Founders, Backend team | Invite via Neon dashboard → Project → Members | Remove member via dashboard |
| **Cloudflare R2** | https://dash.cloudflare.com | Founders, DevOps | Invite via Cloudflare dashboard | Remove member via dashboard |
| **GitHub** | https://github.com/ricardocesidio/playmorrow | All engineers | Invite via GitHub → Repo → Settings → Collaborators | Remove via same page |
| **Sentry** | https://sentry.io | Founders, Backend team | Invite via Sentry dashboard | Remove via dashboard |
| **Resend** | https://resend.com | Founders | Invite via Resend dashboard | Remove via dashboard |

---

## Environment Access Levels

| Environment | Who Can Deploy | Who Can Access Logs | Who Can View Secrets |
|-------------|---------------|---------------------|----------------------|
| Production (Fly.io) | DevOps, Founders | All engineers | Founders, DevOps |
| Production (Vercel) | All engineers | All engineers | Only via Fly.io (secrets not in Vercel) |
| Staging | All engineers | All engineers | All engineers |
| Local dev | All engineers | N/A | `.env.local` per developer |

---

## Secret Access

- All 17 production secrets are stored in **Fly.io secrets** (encrypted at rest)
- Secrets are NEVER stored in the repository
- Secrets are NEVER shared via Slack, email, or messaging
- Secret values are only accessible via `flyctl secrets list` (requires Fly.io authentication)
- Secret rotation requires Fly.io authentication (see `SECRET_ROTATION.md`)

---

## Onboarding New Engineers

```markdown
1. Add to GitHub repository (collaborator or team)
2. Add to Vercel project (if frontend access needed)
3. Add to Fly.io organization (if backend access needed)
4. Add to Neon project (if database access needed)
5. Add to Sentry (if error monitoring access needed)
6. Provide `.env.local` template (no production secrets)
7. Document access in this file
```

## Offboarding

```markdown
1. Remove from GitHub
2. Remove from Vercel
3. Remove from Fly.io
4. Remove from Neon
5. Remove from Sentry
6. Remove from any other service
7. Rotate any secrets the person had access to
8. Update this file
```

---

## Principle of Least Privilege

- Every team member gets the minimum access required for their role
- No single person should be able to deploy to production alone without review
- Production secrets require at least 2 people to rotate (one to change, one to verify)
- Audit logs are available in all services (Fly.io, Vercel, Neon, GitHub)
