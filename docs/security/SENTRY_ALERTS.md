# Sentry Alert Configuration

**Last configured:** Not yet
**Sentry DSN:** `https://4511711452594176.ingest.de.sentry.io/4511711`
**Login:** https://sentry.io

---

## Alert Rules to Create

### 1. 5xx Errors — Critical

| Setting | Value |
|---------|-------|
| **Name** | Backend 5xx Errors |
| **Environment** | production |
| **Trigger** | When `http.status_code` >= 500 |
| **Frequency** | More than 5 events in 5 minutes |
| **Action** | Send email to playmorrow@hotmail.com |
| **Priority** | 🔴 High |

### 2. Unhandled Exceptions — Critical

| Setting | Value |
|---------|-------|
| **Name** | Unhandled Exceptions |
| **Environment** | production |
| **Trigger** | When an unhandled exception occurs |
| **Frequency** | Single occurrence |
| **Action** | Send email + Slack (if configured) |
| **Priority** | 🔴 High |

### 3. Prisma Database Errors — High

| Setting | Value |
|---------|-------|
| **Name** | Prisma Database Errors |
| **Environment** | production |
| **Trigger** | When `exception.type` contains `Prisma` |
| **Frequency** | More than 3 events in 10 minutes |
| **Action** | Send email |
| **Priority** | 🟡 High |

### 4. Frontend JavaScript Errors — Medium

| Setting | Value |
|---------|-------|
| **Name** | Frontend Runtime Errors |
| **Environment** | production |
| **Trigger** | When `exception.type` contains `TypeError` or `ReferenceError` |
| **Frequency** | More than 10 events in 5 minutes |
| **Action** | Send email (digest) |
| **Priority** | 🟡 Medium |

---

## How to Create

1. Go to https://sentry.io → **Alerts** → **Create Alert**
2. Select **"Errors"**
3. Set environment to `production`
4. Configure the trigger conditions from the table above
5. Set action to email: `playmorrow@hotmail.com`
6. Save

Estimated time: **10 minutes**
