# Claude Review Package — Playmorrow v1.0 Platinum

Briefing for external architectural audit. Read this in 10 minutes, then proceed to deep review.

---

## 1. What Is Playmorrow?

Playmorrow is a social discovery platform for indie games. It connects developers with players through game pages, devlogs, community features, a marketplace (Stripe Connect), and an AI intelligence layer (provider-agnostic, not yet deployed).

**Tagline:** "Discover tomorrow's indie games today."

**Domain:** https://playmorrow.co | **API:** Fly.io | **DB:** Neon PostgreSQL | **Storage:** Cloudflare R2

---

## 2. Project History

| Attribute | Value |
|-----------|-------|
| Founded | July 2026 |
| Development sessions | 23 |
| Phases | 5 completed + Phase 6 (AI) ready |
| Milestones | 21 |
| Engineering score | 91/100 (Platinum) |
| Commits | ~880 |
| Tests | 318 backend + 64 E2E (27 files) |

### Evolution

```
Phase 1-2 (Sessions 1-8):    Game pages, devlogs, feed, auth, CSRF
Phase 3 (Sessions 9-12):     Security hardening, CI, professionalization
Phase 4 (Sessions 13-17):    Dashboard, SEO, documentation, certifications
Phase 5 (Sessions 18-19):    Marketplace (Stripe), partner CRM, events, creator
         (Session 20):       Platinum certification, Lighthouse, contrast, a11y
         (Session 21):       Phase 6 strategy, v1.0 freeze, AI vision
Phase 6 (Sessions 22-23):    AI foundation (35 files, provider-agnostic)
                              AI governance (20 articles, 28 docs, 69 capabilities)
```

---

## 3. Current Architecture

### Monorepo Structure

```
playmorrow/
├── apps/
│   ├── web/          Next.js 15 (App Router) + React 19 + Tailwind CSS v4
│   │                 TanStack Query, DOMPurify, SSE notifications
│   └── api/          NestJS + TypeScript, port 4000
│                     55 modules, PrismaService, rawBody for Stripe
├── packages/
│   └── database/     Prisma ORM, 63 models
├── docs/
│   ├── releases/     28 certification/quality/engineering reports
│   ├── strategy/     22 AI strategy documents
│   ├── ai/           3 AI foundation docs
│   ├── adr/          1 architecture decision record
│   ├── templates/    3 AI execution templates
│   └── handoff/      1 session handoff
└── .github/workflows/  6 CI workflows
```

### Scale

| Metric | Count |
|--------|-------|
| Database models | 63 |
| Backend modules | 55 |
| Frontend routes | 82 |
| AI module files | 35 |
| AI capabilities mapped | 69 |
| AI strategic documents | 28 |
| Root documentation files | 9 |

### Infrastructure

| Service | Provider | Notes |
|---------|----------|-------|
| Frontend | Vercel | playmorrow.co |
| Backend | Fly.io | Free tier (512MB/1CPU) |
| Database | Neon | Serverless PostgreSQL |
| Storage | Cloudflare R2 | Public bucket, S3-compatible |
| Monitoring | UptimeRobot | 5-minute checks on both services |

### CI Pipelines (6 workflows)

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Backend tests (318), lint, typecheck |
| `a11y.yml` | Accessibility validation |
| `smoke-test.yml` | Production endpoint health |
| `uptime-check.yml` | Scheduled monitoring |
| `dependency-review.yml` | Dependency vulnerability scanning |
| `security-scan.yml` | SAST + secrets detection |

---

## 4. Completed Certifications

| Certification | Score | Date | Session |
|---------------|-------|------|---------|
| RC2 Certification | — | 2026-07-30 | RC2 |
| RC3.1 GOLD | 88/100 | 2026-08-05 | Session 19 |
| RC3.2 PLATINUM | 91/100 | 2026-08-05 | Session 20 |
| Phase 5 Certification | 70/100 | 2026-07-31 | Session 18 |
| Phase 5.1 Remediation | 84/100 | 2026-08-05 | Session 19 |
| AI Foundation | — | 2026-08-05 | Session 22 |
| AI Strategy | 92/100 | 2026-08-05 | Session 23 |
| AI Governance | 94/100 | 2026-08-05 | Session 23 |
| AI Execution | 91/100 | 2026-08-05 | Session 23 |
| AI Product Architecture | 91/100 | 2026-08-05 | Session 23 |
| QC Pass | 6/6 typecheck, 0 lint errors | Every session | — |

---

## 5. AI Governance (Summary for Auditor)

Playmorrow has an unusually mature governance layer for a pre-AI-deployment platform. This is by design — governance was frozen before any AI feature ships.

### Key Documents

| Document | Description |
|----------|-------------|
| `AI_NORTH_STAR.md` | "Playmorrow always finds the game I didn't even know I wanted" |
| `AI_CONSTITUTION.md` | 20 immutable articles (Assist Never Replace, Always Explain, Never Manipulate, etc.) |
| `AI_GUIDING_PRINCIPLES.md` | 15 principles with compliance/violation examples |
| `AI_GOVERNANCE.md` | Document ownership, review cadence, deprecation policy |
| `AI_DECISION_FRAMEWORK.md` | 24-gate mandatory checklist for any AI feature |
| `AI_FEATURE_EVALUATION_MATRIX.md` | 10-dimension scoring (Priority Score formula) |
| `AI_EXECUTION_FRAMEWORK.md` | 6-step cycle: Build → Measure → Learn → Improve → Review → Repeat |
| `AI_CAPABILITY_MAP.md` | 69 capabilities across 7 domains |
| `ADR-001-AI-GOVERNANCE-FREEZE.md` | Architecture Decision Record freezing strategy |

### Architecture

The AI module (`apps/api/src/ai/`, 35 files) is **provider-agnostic by design**:

- **Interface:** `AIProvider` with `chat()`, `embed()`, `moderate()` methods
- **Implementations:** OpenAI, Anthropic
- **Factory pattern:** Swap via `AI_PROVIDER` env var, zero code changes
- **Constitutional reinforcement:** Article 8 mandates provider independence

The governance isn't aspirational — it's architectural. Vendor lock-in is prevented at both the code and policy levels.

### Capability Landscape

69 capabilities across 7 domains:
- Player Intelligence (16): recommendation engine, semantic search, personalized feed
- Studio Intelligence (12): store page optimizer, devlog assistant, analytics insights
- Publisher Intelligence (8): revenue forecasting, churn prediction
- Marketplace Intelligence (8): price optimization, fraud detection
- Community Intelligence (8): smart moderation, discussion summarization
- Platform Intelligence (7): search indexing, content classification
- Global/Shared (10): embedding service, text chunker, conversation memory

### Kill Switch Policy

- Every AI feature must be independently kill-switchable (Constitution Article 15)
- Underperforming features deprecated at 10 weeks (Constitution Article 16)
- Rollout: 5% → 25% → 100% with KPIs at each gate

---

## 6. Questions for the Auditor

These are honest questions we want answered — not defensive challenges:

1. **Provider lock-in:** Does the `AIProvider` abstraction + factory pattern + constitutional enforcement truly prevent vendor lock-in, or is there a hidden coupling we missed?

2. **Phase 5 test gaps:** Marketplace, partner, events, publisher, and creator modules have unit tests with mocked Prisma. Are there critical E2E gaps that mock testing hides?

3. **Stripe flow:** The `stripe-payment.tsx` component renders conditionally in marketplace detail. Is the end-to-end flow (browse → pay → license → download) fully functional, or are there broken links in the chain?

4. **RBAC guards:** Admin/moderation endpoints use `RolesGuard`. Are all Phase 5 modules (events, partners, marketplace, creator, publisher) correctly guarded, or are there unprotected mutation endpoints?

5. **CSP nonce:** Middleware generates per-request nonces. Does this actually prevent XSS in production, or are there bypass vectors (inline event handlers, dynamically injected scripts)?

6. **Execution framework realism:** The 6-step cycle mandates deprecation at 10 weeks if underperforming. Is this realistic for an indie platform, or would sunk-cost pressure override it?

7. **Capability prioritization:** 69 capabilities are mapped. Are they correctly prioritized (Discovery → Studio → Assistant → Trust), or would you reorder?

8. **Constitution enforceability:** 20 articles sound good on paper. Are they enforceable in practice, or are they aspirational text with no teeth?

9. **M22 risk:** If the AI Assistant milestone ships as designed (6 weeks, SSE streaming chat), what's the biggest single risk?

10. **Missing essentials:** What's missing that every production AI platform needs but hasn't been addressed?

---

## 7. Known Limitations (Honest Disclosure)

| Limitation | Severity | Resolution |
|------------|----------|------------|
| Fly.io free tier (512MB, 1CPU) limits performance | Medium | Upgrade to paid tier ($5/mo) |
| No Phase 5 E2E tests (unit tests only with mocks) | Medium | Need test DB for proper integration |
| 27 integration tests need local test DB | Low | Neon free branch |
| Accessibility not screen-reader tested | Low | Needs NVDA/VoiceOver validation |
| No Vitest coverage thresholds configured | Low | Add in CI config |
| Dependabot paused | Low | Re-enable |
| 137 legacy `any` type warnings (pre-existing) | Low | Incremental cleanup |
| CLAUDE.md references deleted docs (PHASE2_CERTIFICATION.md, etc.) | Low | Needs pruning |
| RC2_CERTIFICATION.md missing from filesystem | Low | AGENTS.md claims it exists |
| Only 1 handoff document (session-18) — others missing | Low | May have been intentionally not committed |
| Lighthouse Performance 71 (fly.io cold starts) | Low | Resolves with paid Fly.io tier |
| Duplicate project overviews (AGENTS.md vs CLAUDE.md with conflicting numbers) | Low | Consolidate |

---

## 8. What NOT to Review

These are out of scope for the architectural audit:

- **Code style preferences** — subjective (naming, file structure, formatting)
- **Tailwind class ordering** — established by linter, not architectural
- **Whether AI features should be built** — governance already decided by Session 23 freeze
- **Whether the AI persona/voice is "right"** — subjective design choice, not architecture
- **Color palette / visual design** — covered by accessibility audit (92/100 Lighthouse), subjective otherwise
- **Documentation phrasing** — content accuracy is reviewable, style is not

---

## 9. How to Run This Project

```bash
pnpm install
pnpm dev          # Runs both frontend (:3000) and API (:4000)
pnpm typecheck    # 6/6
pnpm lint         # 0 errors
pnpm test         # 318 backend tests
pnpm verify       # Full pre-push check (lint + typecheck + build)
```

Requires `DATABASE_URL` pointing to a PostgreSQL instance. See `.env.example` for all env vars.

---

## 10. Security Posture

| Domain | Implementation |
|--------|---------------|
| Authentication | Session-based (httpOnly cookies) + OAuth (Google, GitHub) |
| Password hashing | argon2id |
| CSRF | HMAC-SHA256 stateless, global APP_GUARD (all 70+ mutation endpoints) |
| CSP | Nonce-based per-request (middleware), no unsafe-inline in prod |
| Rate limiting | 60 req/min global, 5/min register, 10/min login |
| Upload validation | MIME + magic bytes + 4096px dimension cap + 20MB limit |
| XSS | DOMPurify on all Markdown rendering |
| Secrets scanning | Gitleaks in CI, .dockerignore prevents env leak |
| Dependency review | GitHub workflow blocks vulnerable PRs |
| SAST | CodeQL + Semgrep in CI |
| Container scanning | Trivy in CI |
| SBOM | CycloneDX generated per push to main |

---

**Prepared for:** External architectural audit — 2026-08-05

**Point of contact:** Playmorrow engineering team

**Estimated review time:** 10 minutes (briefing) + 1-2 hours (deep dive)
