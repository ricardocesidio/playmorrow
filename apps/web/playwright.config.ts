import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PLAYWRIGHT_PORT ? parseInt(process.env.PLAYWRIGHT_PORT) : 3099;
const BASE_URL = `http://localhost:${PORT}`;

// Dev-mode E2E (#16): `PLAYWRIGHT_DEV=1` serves the app with `next dev` (hot
// reload, no 3–5 min production build) for fast local iteration on a UI fix and
// its test. CI and the default run still use the production `next start` build,
// which is what ships. Behaviour can differ slightly between the two modes.
const DEV_MODE = process.env.PLAYWRIGHT_DEV === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],

  webServer: {
    command: DEV_MODE
      ? `pnpm --filter @playmorrow/web exec next dev -p ${PORT}`
      : `pnpm --filter @playmorrow/web start -p ${PORT}`,
    port: PORT,
    // Always let Playwright own the server lifecycle (#15). Reusing an existing
    // server silently adopts a stale/wedged process left over from a killed run,
    // which hangs the suite. If the port is busy, fail loudly instead — run
    // `pnpm --filter @playmorrow/web clean-port` to clear it (see #34 port map).
    reuseExistingServer: false,
    // Dev mode compiles routes lazily on first hit, so allow more startup slack.
    timeout: DEV_MODE ? 120_000 : 60_000,
    // NEXT_PUBLIC_* is inlined at build time, so this override only takes effect
    // in dev mode; the production bundle already has the value baked in at build.
    env: { NEXT_PUBLIC_API_URL: 'http://localhost:4000/api' },
  },
});
