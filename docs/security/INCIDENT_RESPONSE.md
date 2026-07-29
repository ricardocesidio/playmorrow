# Incident Response Playbook

**Version:** 1.0 (2026-07-29)
**Owner:** Security Team
**Classification:** CONFIDENTIAL — Engineering Internal

---

## Purpose

This playbook defines the process for detecting, responding to, and recovering from security incidents affecting the Playmorrow platform.

---

## Incident Severity Matrix

| Severity | Definition | Examples | Response Time |
|----------|------------|----------|---------------|
| 🔴 **Critical** | Active data breach, service-wide outage, compromised credentials | Database exfiltrated, production secrets leaked, unauthorized admin access | Immediate (< 15min) |
| 🟡 **High** | Limited data exposure, degraded service, suspicious activity | Stored XSS discovered, rate limit bypass, OAuth abuse | < 1 hour |
| 🟢 **Medium** | Non-critical vulnerability, policy violation | Dependency vulnerability without exploit, misconfigured header | < 24 hours |
| 🔵 **Low** | Informational, best practice gap | Missing security header, outdated dependency without CVE | < 7 days |

---

## Incident Response Process

### 1. Detection

| Source | Method | Contact |
|--------|--------|---------|
| UptimeRobot | Frontend + API health check alerts | Email + SMS |
| Sentry | Error threshold exceeded, new error group | Email + Slack |
| Dependabot | Critical vulnerability PR created | GitHub notification |
| User report | Support ticket marked "security" | Support queue + Security team |
| Gitleaks CI | Secret detected in PR | Workflow failure notification |
| Manual | Developer or operator discovers anomaly | Slack #security |

### 2. Triage

For every reported incident:

```
□ Is this a real incident or false positive?
□ What severity? (Critical / High / Medium / Low)
□ What systems are affected?
□ Is there active user impact?
□ Should we notify the team immediately?
```

### 3. Containment

#### 🔴 Critical Incident

```bash
# 1. Isolate affected systems
flyctl scale count playmorrow-api-aged-mountain-9542 0  # Stop API
# Or restrict access via Fly.io firewall

# 2. Rotate compromised secrets immediately
flyctl secrets set DATABASE_URL=<new-url>
flyctl secrets set JWT_SECRET=<new-secret>
flyctl secrets set SESSION_SECRET=<new-secret>
flyctl secrets set CSRF_SECRET=<new-secret>

# 3. Revoke active sessions
# Database: DELETE FROM sessions; (via Neon dashboard or psql)

# 4. Notify affected users (if PII exposed)
# Template in Communication section below

# 5. Restore from backup if needed
# See docs/BACKUP.md for restore procedure
```

#### 🟡 High Incident

```bash
# 1. Apply hotfix
git checkout -b fix/incident-<date>
# ... fix the vulnerability ...
git commit -m "fix: <description of fix>"
git push origin fix/incident-<date>

# 2. Fast-track review + deploy
# Bypass normal PR process with Security team approval

# 3. Rotate specific secret if compromised
flyctl secrets set <COMPROMISED_SECRET>=<new-value>
```

### 4. Eradication

- Identify root cause
- Remove compromised access
- Patch all affected systems
- Verify fix in staging

### 5. Recovery

```bash
# 1. Deploy fixed version
flyctl deploy

# 2. Verify health
curl -f https://playmorrow-api...fly.dev/api/health
curl -f https://playmorrow...fly.dev/api/games?pageSize=1

# 3. Monitor for recurrence
# Check Sentry for new errors
# Check logs for suspicious activity

# 4. Restore service
flyctl scale count playmorrow-api-aged-mountain-9542 2
```

### 6. Post-Mortem

Within 72 hours of resolution, the Security team produces a post-mortem containing:

```
Date:
Severity:
Duration:
Root Cause:
Impact:
Detection:
Response:
Lessons Learned:
Action Items:
Owner:
Deadline:
```

---

## Communication Templates

### Internal Notification (Slack #security)

```
🚨 SECURITY INCIDENT
Severity: <Critical/High/Medium/Low>
Time Detected: <UTC timestamp>
Affected Systems: <list>
Current Status: <Investigating/Contained/Resolved>
Next Steps: <brief description>
Incident Lead: <name>
```

### User Notification (email — for data exposure incidents)

```
Subject: Security Notice — Playmorrow

Dear <user>,

We are writing to inform you of a security incident involving your Playmorrow account.

What happened: <brief, honest description>
What we did: <remediation steps>
What you should do: <recommended actions for user>
Contact: security@playmorrow.com

We apologize for this incident. We take your data security seriously.
```

---

## Key Contacts

| Role | Name/Team | Contact |
|------|-----------|---------|
| Incident Lead | Security Team | #security (Slack) |
| Engineering Lead | Backend Team | #engineering (Slack) |
| Communications | Product Team | #product (Slack) |
| Database Recovery | Platform Team | #platform (Slack) |
| External Comms (legal) | Founder | Signal / Phone |

---

## Recovery Drills

| Drill | Frequency | Last Run | Next Scheduled |
|-------|-----------|----------|----------------|
| Database restore | Quarterly | ⏳ Never | Q3 2026 |
| Secret rotation | Quarterly | ✅ July 2026 | Q4 2026 |
| Full incident simulation | Bi-annual | ⏳ Never | H1 2027 |

---

## References

- `docs/BACKUP.md` — Database and file backup/restore procedures
- `docs/security/SECRET_ROTATION.md` — Step-by-step for each of the 17 secrets (⏳ To be created)
- `docs/security/RUNBOOK.md` — Operational procedures (⏳ To be created)
- `docs/security/ACCESS_CONTROL.md` — Access management (⏳ To be created)
