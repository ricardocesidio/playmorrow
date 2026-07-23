# PlayMorrow Backend Route Audit

Generated: 2026-06-22
Total endpoints audited: 68
Total controllers: 18

## Access level legend

| Level | Meaning |
|---|---|
| Public | No authentication required |
| Optional | Auth optional — works for both authenticated and anonymous users |
| Auth (self) | Authenticated user, inherently scoped to self |
| Auth (owner) | Authenticated user, ownership verified via service layer |
| Studio MEMBER | Authenticated user must be a studio member (any role) |
| Studio ADMIN/OWNER | Authenticated user must be studio ADMIN or OWNER |
| Global ADMIN | Authenticated user must have role='ADMIN' |
| Internal | Health/internal only |

---

## AuthController (`/auth`)

| Method | Path | Guard | Throttle | Access | Ownership | Notes |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | None | 5/60s | Public | — | Creates user + session cookie |
| POST | `/auth/login` | None | 10/60s | Public | — | Returns JWT tokens (legacy) |
| POST | `/auth/refresh` | None | — | Public | — | Refresh token rotation |
| POST | `/auth/logout` | None | — | Public | — | Revokes refresh token |
| GET | `/auth/me` | JwtAuthGuard | — | Auth (self) | Self | Legacy JWT profile |
| GET | `/auth/admin-only` | JwtAuthGuard + RolesGuard | — | Global ADMIN | Role check | Admin test route |
| POST | `/auth/session/login` | None | 10/60s | Public | — | Sets httpOnly session cookie |
| POST | `/auth/session/logout` | None | — | Auth (self) | Self | Revokes session |
| GET | `/auth/session/me` | SessionAuthGuard | — | Auth (self) | Self | Profile via cookie |
| GET | `/auth/session/list` | SessionAuthGuard | — | Auth (self) | Self | Active sessions |
| POST | `/auth/verify-email` | None | — | Public | — | Token-based verification |
| POST | `/auth/resend-verification` | None | 3/60s | Public | — | Sends new verification token |
| POST | `/auth/forgot-password` | None | 3/60s | Public | — | Sends reset email |
| POST | `/auth/reset-password` | None | 5/60s | Public | — | Consumes reset token |

## OAuthController (`/auth`)

| Method | Path | Guard | Access | Notes |
|---|---|---|---|---|
| GET | `/auth/google` | AuthGuard('google') | Public | Initiates Google OAuth |
| GET | `/auth/google/callback` | AuthGuard('google') | Public | Handles callback, sets session |
| GET | `/auth/github` | AuthGuard('github') | Public | Initiates GitHub OAuth |
| GET | `/auth/github/callback` | AuthGuard('github') | Public | Handles callback, sets session |

## UsersController (`/users`)

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| GET | `/users/:username` | None | Public | — |
| PATCH | `/users/me` | SessionAuthGuard | Auth (self) | Self via CurrentUser |
| DELETE | `/users/me` | SessionAuthGuard | Auth (self) | Self + password verify |

## StudiosController (`/studios`)

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| POST | `/studios` | SessionAuthGuard | Auth | Creates new |
| GET | `/studios` | None | Public | — |
| GET | `/studios/me` | SessionAuthGuard | Auth (self) | Self |
| GET | `/studios/:slug` | None | Public | — |
| GET | `/studios/:slug/members` | None | Public | — |
| PATCH | `/studios/:slug` | SessionAuthGuard | Studio ADMIN/OWNER | Service checks membership |
| DELETE | `/studios/:slug` | SessionAuthGuard | Studio ADMIN/OWNER | Service checks membership |

## GamesController

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| POST | `/studios/:studioSlug/games` | SessionAuthGuard | Studio MEMBER | Service checks |
| GET | `/studios/:studioSlug/games` | None | Public | — |
| GET | `/games` | None | Public | — |
| GET | `/games/:slug` | None | Public | — |
| PATCH | `/games/:slug` | SessionAuthGuard | Studio MEMBER | Service checks |
| DELETE | `/games/:slug` | SessionAuthGuard | Studio MEMBER | Service checks |

## DevlogsController

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| POST | `/games/:gameSlug/devlogs` | SessionAuthGuard | Studio MEMBER | Service checks |
| GET | `/games/:gameSlug/devlogs` | OptionalSessionGuard | Optional | Draft visibility |
| GET | `/devlogs` | None | Public | — |
| GET | `/devlogs/:id` | OptionalSessionGuard | Optional | Draft visibility |
| PATCH | `/devlogs/:id` | SessionAuthGuard | Author/Studio MEMBER | Service checks |
| DELETE | `/devlogs/:id` | SessionAuthGuard | Author/Studio MEMBER | Service checks |
| GET | `/me/devlogs` | SessionAuthGuard | Auth (self) | Self |

## RoadmapItemsController

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| POST | `/games/:gameSlug/roadmap` | SessionAuthGuard | Studio MEMBER | Service checks |
| GET | `/games/:gameSlug/roadmap` | None | Public | — |
| PATCH | `/games/:gameSlug/roadmap/reorder` | SessionAuthGuard | Studio MEMBER | Service checks |
| GET | `/roadmap-items/:id` | None | Public | — |
| PATCH | `/roadmap-items/:id` | SessionAuthGuard | Author/Studio MEMBER | Service checks |
| DELETE | `/roadmap-items/:id` | SessionAuthGuard | Author/Studio MEMBER | Service checks |

## PressKitsController

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| PUT | `/games/:gameSlug/press-kit` | SessionAuthGuard | Studio MEMBER | Service checks |
| GET | `/games/:gameSlug/press-kit` | None | Public | — |

## FollowsController

| Method | Path | Guard | Throttle | Access | Ownership |
|---|---|---|---|---|---|
| POST | `/studios/:slug/follow` | SessionAuthGuard | 20/60s | Auth | Self |
| DELETE | `/studios/:slug/follow` | SessionAuthGuard | 20/60s | Auth | Self |
| POST | `/games/:slug/follow` | SessionAuthGuard | 20/60s | Auth | Self |
| DELETE | `/games/:slug/follow` | SessionAuthGuard | 20/60s | Auth | Self |
| GET | `/studios/:slug/follow-status` | OptionalSessionGuard | — | Optional | — |
| GET | `/games/:slug/follow-status` | OptionalSessionGuard | — | Optional | — |
| GET | `/me/follows` | SessionAuthGuard | — | Auth (self) | Self |

## FeedController

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| GET | `/me/feed` | SessionAuthGuard | Auth (self) | Self |
| GET | `/feed/public` | None | Public | — |

## CommentsController

| Method | Path | Guard | Throttle | Access | Ownership |
|---|---|---|---|---|---|
| POST | `/devlogs/:devlogId/comments` | SessionAuthGuard | 20/60s | Auth | Self (creates) |
| GET | `/devlogs/:devlogId/comments` | OptionalSessionGuard | — | Optional | — |
| PATCH | `/comments/:id` | SessionAuthGuard | — | Author | Service checks |
| DELETE | `/comments/:id` | SessionAuthGuard | — | Author | Service checks |

## ReactionsController

| Method | Path | Guard | Throttle | Access | Ownership |
|---|---|---|---|---|---|
| POST | `/devlogs/:devlogId/reactions` | SessionAuthGuard | 30/60s | Auth | Self |
| DELETE | `/devlogs/:devlogId/reactions` | SessionAuthGuard | — | Auth | Self |
| GET | `/devlogs/:devlogId/reactions` | OptionalSessionGuard | — | Optional | — |
| POST | `/comments/:commentId/reactions` | SessionAuthGuard | 30/60s | Auth | Self |
| DELETE | `/comments/:commentId/reactions` | SessionAuthGuard | — | Auth | Self |
| GET | `/comments/:commentId/reactions` | OptionalSessionGuard | — | Optional | — |
| GET | `/devlogs/:devlogId/comments/reactions` | OptionalSessionGuard | — | Optional | — |

## ReportsController

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| POST | `/reports` | SessionAuthGuard | Auth | Self (reports) |
| GET | `/admin/reports` | SessionAuthGuard + RolesGuard('ADMIN') | Global ADMIN | Role check |
| GET | `/admin/reports/:id` | SessionAuthGuard + RolesGuard('ADMIN') | Global ADMIN | Role check |
| PATCH | `/admin/reports/:id` | SessionAuthGuard + RolesGuard('ADMIN') | Global ADMIN | Role check |

## NotificationsController

| Method | Path | Guard | Access | Ownership |
|---|---|---|---|---|
| GET | `/me/notifications` | SessionAuthGuard | Auth (self) | Self |
| GET | `/me/notifications/unread-count` | SessionAuthGuard | Auth (self) | Self |
| PATCH | `/notifications/:id/read` | SessionAuthGuard | Auth (recipient) | Service checks |
| PATCH | `/me/notifications/read-all` | SessionAuthGuard | Auth (self) | Self |
| DELETE | `/notifications/:id` | SessionAuthGuard | Auth (recipient) | Service checks |
| GET | `/me/notifications/stream` | Custom (cookie + JWT fallback) | Auth (self) | Self |

## UploadController

| Method | Path | Guard | Throttle | Access |
|---|---|---|---|---|
| POST | `/upload` | SessionAuthGuard | 5/60s | Auth |

## Other controllers

| Method | Path | Controller | Guard | Access |
|---|---|---|---|---|
| GET | `/health` | HealthController | SkipThrottle | Public |
| GET | `/` | AppController | None | Public |
| GET | `/search` | SearchController | 30/60s | Public |

---

## Summary

| Category | Count |
|---|---|
| Public endpoints | 17 |
| Optional auth | 8 |
| Authenticated (self) | 12 |
| Authenticated (with ownership check) | ~25 |
| Global ADMIN only | 4 |
| Internal/health | 1 |
| **Total** | **68** |
