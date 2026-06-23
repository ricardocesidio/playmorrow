# Registration & Email Verification

## Account Types

| Type | Backend Value | Who It's For |
|---|---|---|
| **Player** | `PLAYER` | Normal users who want to discover games, follow updates, comment, react, and wishlist |
| **Studio / Indie Company** | `STUDIO` | Indie developers, studios, publishers who want to share games, create profiles, post devlogs |

`accountType` is **onboarding intent only**. It does not grant backend permissions. Studio access requires `StudioMember` roles.

## Consent Rules

| Consent | Required? | Backend Field | Version Field |
|---|---|---|---|
| Terms of Service | ✅ Yes | `termsAcceptedAt` | `termsVersion` |
| Privacy Policy | ✅ Yes | `privacyAcceptedAt` | `privacyVersion` |
| Community Guidelines | ✅ Yes | `communityGuidelinesAcceptedAt` | `communityGuidelinesVersion` |
| Marketing opt-in | ❌ No (unchecked) | `marketingOptInAt` | — |
| Partner marketing opt-in | ❌ No (unchecked) | `partnerMarketingOptInAt` | — |

### Current versions (2026-06-23)

```
TERMS_VERSION = '2026-06-23'
PRIVACY_VERSION = '2026-06-23'
COMMUNITY_GUIDELINES_VERSION = '2026-06-23'
```

### Partner marketing note

`partnerMarketingOptIn` stores the user's consent preference. **No partner data sharing is currently implemented.** This field is a placeholder for future functionality.

## Email Verification Flow

1. User fills register form with account type, consent, and credentials
2. Backend validates `acceptedTerms === true`, creates user with `emailVerifiedAt = null`
3. Backend generates 6-digit verification code (SHA-256 hashed, 15 min expiry)
4. Code is sent via email (Resend in production, logged to console in development)
5. Frontend redirects to `/verify-email?email=<encoded>`
6. User enters the 6-digit code
7. Backend verifies hash, marks code consumed, sets `emailVerifiedAt`
8. Auth session is created; user is redirected based on account type

## Resend Behavior

- Rate-limited (3 per 60 seconds)
- Always returns the same generic message regardless of whether email exists
- Invalidates previous unconsumed codes when creating a new one
- 60-second cooldown enforced on frontend UI

## Login Behavior for Unverified Accounts

If credentials are valid but `emailVerifiedAt` is null, the API returns:

```json
{
  "message": "Please verify your email before signing in.",
  "code": "EMAIL_NOT_VERIFIED",
  "email": "user@example.com"
}
```

The frontend redirects to `/verify-email`.

## Security Notes

- Codes are 6-digit numeric, generated via `crypto.randomInt` (not `Math.random`)
- Only SHA-256 hashes are stored in the database — raw codes are never persisted
- Each code is single-use (consumed after verification)
- Creating a new code invalidates old unconsumed codes
- `emailVerifiedAt` is set transactionally with code consumption
- Registration fails if required terms are not accepted
- No password, auth token, or personal data is included in verification emails
- Email enumeration is prevented: all resend responses are identical regardless of email existence
- OAuth does not bypass email verification

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `EMAIL_PROVIDER` | No | `resend` | Email provider type |
| `RESEND_API_KEY` | Dev: No, Prod: Yes | — | Resend API key |
| `EMAIL_FROM` | No | `PlayMorrow <noreply@playmorrow.com>` | Sender address |
| `EMAIL_CODE_SECRET` | No | — | HMAC secret for code hashing |
| `EMAIL_VERIFICATION_CODE_TTL_MINUTES` | No | `15` | Code expiry in minutes |
| `EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS` | No | `60` | Cooldown between resends |

## Development Email Behavior

When `RESEND_API_KEY` is not set in development:
- The app does not crash
- Verification codes are logged to the console with `[DEV]` prefix
- Example log: `[DEV] Verification code for user@example.com: 483291`

**Codes are never logged in production.**

## API Endpoints

### `POST /api/auth/register`

Creates an unverified user account. Does not return auth session.

### `POST /api/auth/verify-email`

Verifies email with 6-digit code. Returns auth session on success.

### `POST /api/auth/resend-verification`

Resends verification code. Generic response regardless of email existence.

## Data Model

Added to `User`:
- `termsAcceptedAt`, `privacyAcceptedAt`, `communityGuidelinesAcceptedAt`
- `termsVersion`, `privacyVersion`, `communityGuidelinesVersion`
- `marketingOptInAt`, `partnerMarketingOptInAt`
- `emailVerifiedAt`

New model: `EmailVerificationCode`
- `id`, `userId`, `codeHash`, `expiresAt`, `consumedAt`, `createdAt`

## Known Limitations

1. **Legal pages are drafts** — `/terms`, `/privacy`, `/community-guidelines` contain placeholder text that requires legal review before production
2. **Partner data sharing is not implemented** — `partnerMarketingOptIn` stores consent but no actual sharing occurs
3. **Email templates are minimal** — HTML-formatted emails are not implemented; plain text only
4. **No email queue** — Sending is synchronous; for high volume, a job queue (BullMQ) should be added
5. **No OAuth verification bypass** — OAuth users currently still need email verification (can be relaxed in future)
