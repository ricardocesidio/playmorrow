# Deploying Playmorrow API

## Option 1: Zeabur (Recommended — 100% Free, No Credit Card)

1. Go to https://zeabur.com
2. Sign in with GitHub
3. Create project → Deploy from GitHub → select ricardocesidio/playmorrow
4. Zeabur auto-detects zeabur.json
5. Add these environment variables:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET` | (random string) |
   | `SESSION_SECRET` | (random string) |
   | `CSRF_SECRET` | (random string) |
   | `WEB_ORIGIN` | `https://playmorrow.vercel.app` |
   | `NODE_ENV` | `production` |
   | `RESEND_API_KEY` | (your Resend key) |
   | `SENTRY_DSN` | (your Sentry DSN) |

6. Deploy!

## Option 2: Railway (Current — Still Running)

The API is currently live at https://playmorrow-api-production.up.railway.app
New deployments fail due to free tier limitations. The current deployment
has 48+ hours of uptime and serves traffic fine.

## After Migration

Update Vercel's `API_URL` environment variable to point to your new Zeabur URL.
