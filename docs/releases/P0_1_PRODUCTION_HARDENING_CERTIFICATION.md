# P0.1 Production Hardening & Recovery Readiness Certification

**Date:** 2026-08-07
**Predecessor:** `docs/releases/PRODUCTION_DB_ISOLATION_CERTIFICATION.md` (P0 isolation, 2026-08-07)
**Status:** 🟡 CONDITIONALLY CERTIFIED — hardening + secret rotation complete; one user action remains (GitHub secrets + first backup run). See `docs/releases/P0_1_FINAL_CERTIFICATION.md` for the final closure sprint.

---

## 1. Executive Summary

Following the P0 production-database incident (2026-08-06) and the verified
isolation remediation (P0, same day), this certification covers the **P0.1
production-hardening sprint**:

1. **Nightly off-machine backups** implemented (GitHub Actions → Cloudflare R2),
   replacing the highest-priority remaining gap.
2. **DB safety guard** hardened to be **fail-closed** against unknown hosts.
3. **Test-suite prod-host guard** fixed (stale hostname regex).
4. **Smoke-test** made robust to an empty-but-healthy production dataset.
5. **Dead latent bypass** (`admin:ensure`) removed.
6. **Full restore drill** passed (dump → disposable Postgres 18 → 65 tables,
   row counts match live production).
7. **Secret rotation** required (exposed credential from the incident) — the
   one item gating full CERTIFIED status.

Every claim below was verified live in this session unless explicitly marked
`USER ACTION`.

## 2. Scope & Deliverables

| # | Item | Status |
|---|---|---|
| 1 | Nightly backup workflow `.github/workflows/backup-db.yml` | ✅ Implemented + components verified |
| 2 | Read-only backup role on prod Neon | ✅ Created + verified (writes denied) |
| 3 | Off-machine R2 write path | ✅ Verified from Fly runtime |
| 4 | Full restore drill | ✅ 65/65 tables, row counts match |
| 5 | Fail-closed DB guard (unknown hosts) | ✅ 7/7 matrix re-verified |
| 6 | Dead `admin:ensure` bypass removed | ✅ Verified |
| 7 | `vitest.setup.ts` prod-host regex fixed | ✅ 6/6 matrix |
| 8 | `smoke-test.yml` empty-prod robustness | ✅ Live-verified (total=0 passes) |
| 9 | GitHub secrets set + manual backup run | ⛔ **USER ACTION** |
| 10 | Secret rotation (DB password, NEON_API_KEY) | ✅ Completed 2026-08-07 (P0.1.1) |

## 3. Backup Architecture

**Trigger:** GitHub Actions `Nightly Database Backup` — 02:00 UTC cron +
`workflow_dispatch`.

**Pipeline:**
1. Safety check — `BACKUP_DATABASE_URL` must target the known prod host
   (`ep-orange-bird-abpuzipk…`) and must be a **direct (non-pooler)** host.
2. `pg_dump --no-owner --no-privileges -Fc --exclude-schema=neon_auth` via
   `postgres:18` container (matches Neon server version 18.4; PG16 client
   fails with "server version mismatch").
3. Integrity check — `pg_restore --list` + table-data count.
4. SHA-256 checksum + `MANIFEST.txt` (source, timestamp, sha, size, pg_dump version).
5. Upload `db-backups/<STAMP>.dump` (+ `.sha256` + `.MANIFEST.txt`) to R2.
6. Retention — prune objects older than `KEEP_DAYS` (14).
7. Existence verification of the latest object.

**Security model:**
- `BACKUP_DATABASE_URL` uses the read-only role `playmorrow_backup` — SELECT-only
  grants; `pg_dump` is inherently read-only. This is the single, deliberate
  exception to "CI has no production credentials" (documented in
  `docs/infrastructure/PRODUCTION_DATABASE_SAFETY.md`).
- `neon_auth` schema (Neon-managed built-in auth) is excluded.
- R2 creds in the workflow are `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
  (backup-only token recommended, see §10).

## 4. Backup Component Verification

| Component | Verification |
|---|---|
| Read-only role created (`playmorrow_backup`) | ✅ `CREATE ROLE … LOGIN`, grants on `public`, default privileges; write denied (`permission denied for schema public`) |
| Dump as read-only role | ✅ 197 KB custom-format archive, 65 tables |
| Direct vs pooler host | ✅ pg_dump requires direct host; pooler rejected in workflow safety check |
| Neon server version | ✅ 18.4 — `postgres:18` image used |
| R2 write path | ✅ PUT/GET/DELETE verified from Fly runtime (existing app token) |
| Restore drill | ✅ 65/65 tables restored; row counts match live prod (users=1, games=0) |
| Neon-only extension error | ✅ 2 expected errors for `pg_session_jwt` (Neon-only); app data unaffected |

## 5. Guard Hardening (P0.1 fail-closed)

`packages/database/scripts/db-guard.mjs` now **blocks destructive commands
against any unknown host** (any host that is not prod, not localhost, and not
`DEV_DB_HOST`), unless `ALLOW_PROD_DB_OPERATIONS=1`.

Regression matrix re-run post-changes:

| Target | reset/push/migrate-dev/seed | deploy/status |
|---|---|---|
| prod (`ep-orange-bird-abpuzipk…`) | BLOCKED ✅ | ALLOWED ✅ |
| dev branch (`ep-raspy-sunset-abo6apgc…`) | ALLOWED ✅ | ALLOWED ✅ |
| local :5433 test | ALLOWED ✅ | ALLOWED ✅ |
| unknown Neon/cloud host | **BLOCKED** ✅ (fail-closed) | ALLOWED ✅ |
| unknown host + `PLAYMORROW_DB_ROLE=dev` | ALLOWED ✅ | — |

## 6. Latent Bypass Removed

- Deleted dead `admin:ensure` scripts (root `package.json` + `apps/api/package.json`).
  The root one was an **unguarded** reference to `apps/api/src/admin-script.ts`
  (deleted in `a6eaaa5`) — a latent path that could have run arbitrary admin
  promotion without the guard.
- Removed `src/admin-script.ts` from `apps/api/tsconfig.json` excludes.
- Admin promotion now requires direct Prisma access by an operator (documented
  in `docs/product/admin-role.md`).

## 7. Test-Suite Safety

`apps/api/vitest.setup.ts` blocks the suite from running against Neon hosts. The
stale regex matched only `ep-aged-darkness` (pre-incident host). Updated to also
match the current prod host (`ep-orange-bird-abpuzipk`) **and** the dev branch
host (`ep-raspy-sunset`) — tests must never touch any Neon instance.

Verified 6/6: prod BLOCKED, dev branch BLOCKED, old host BLOCKED, local
`:5432`/`:5433` + CI container ALLOWED.

## 8. Smoke-Test Robustness

`.github/workflows/smoke-test.yml` previously **failed when production returned
0 games** — a false alarm, since prod is legitimately empty post-incident. The
games step now asserts only HTTP 200 + a well-formed `total` field, and accepts
`total=0`.

Verified live against the production API: `HTTP 200, total=0 → PASS`.

## 9. Quality Gates

| Gate | Result |
|---|---|
| `pnpm lint` | ✅ 0 errors (67 pre-existing `token` warnings) |
| `pnpm typecheck` | ✅ 7/7 workspaces |
| `pnpm build` | ✅ 6/6 workspaces |
| API test suite (disposable :5433) | ✅ 490/490, 48 files |
| Guard matrix | ✅ 7/7 |
| Workflow YAML | ✅ 4/4 files parse |
| Migration status (prod + dev) | ✅ 39/39, zero drift (P0 session) |

## 10. Remaining Risks / Required Actions

| # | Risk / Action | Owner | Status |
|---|---|---|---|
| 1 | **Set 5 GitHub secrets + run first backup** — `gh secret set` for `BACKUP_DATABASE_URL`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (commands printed by `scripts/setup-backup-secrets.sh`), then `gh workflow run backup-db.yml` | User | ⛔ PENDING |
| 2 | ~~Rotate exposed secrets~~ | ✅ **RESOLVED 2026-08-07 (P0.1.1)** — Neon DB password rotated via Neon API (old `npg_…` confirmed dead, new password live in Fly secret `DATABASE_URL`, prod smoke 200); exposed org `NEON_API_KEY` revoked (`playmorrow-key`, id 3244621) and replaced (`playmorrow-key-v2`, stored in gitignored `.env.neon-apikey`). New prod URL in gitignored `.env.prod-dburl`. See `docs/releases/P0_1_FINAL_CERTIFICATION.md`. |
| 3 | Backup-only R2 token (scoped to `db-backups/` prefix) — currently the app's full-bucket token is reused | User | ⏳ Recommended |
| 4 | Nightly backup evidence (first R2 object + `workflow_dispatch` success) | User | ⏳ After #1 |
| 5 | Full-bucket R2 backup (uploads) monthly | User | ⏳ Deferred |
| 6 | Neon plan upgrade for extended PITR | User | ⏳ Deferred |
| 7 | Branch protection in Neon (paid feature) — hostname guard is the current control | User | ⏳ Deferred |

## 11. Final Verdict

**🟡 CONDITIONALLY CERTIFIED**

All engineering work AND credential rotation are complete and verified. Full
**🟢 CERTIFIED** status is granted once the single remaining user action in §10
(GitHub secrets + first backup run) is completed. Until then, the residual item
is:

- **First successful automated backup** — MEDIUM (workflow is implemented and
  component-verified; the first R2 object is the end-to-end proof).

Phase 6 AI remains blocked until this certification reaches full CERTIFIED status.
