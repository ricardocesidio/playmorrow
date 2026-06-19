import { test, expect } from '@playwright/test';
import { mockApi, MOCK_TOKEN } from './fixtures/mocks';
import { API } from './fixtures/mocks';

test.describe('Visual snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  // ── Public pages ──────────────────────────────────────────────────────

  for (const viewport of ['desktop', 'mobile'] as const) {
    const width = viewport === 'desktop' ? 1536 : 412;
    const height = viewport === 'desktop' ? 1024 : 915;

    test(`homepage at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height });
      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: /Follow games/i })).toBeVisible();
      await expect(page).toHaveScreenshot(`home-${viewport}.png`);
    });

    test(`games explore at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height });
      await page.goto('/games', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: /Browse games/i })).toBeVisible();
      await expect(page).toHaveScreenshot(`games-${viewport}.png`);
    });

    test(`game detail at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height });
      await page.goto('/games/test-game', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Neon Warden' })).toBeVisible();
      await expect(page).toHaveScreenshot(`game-detail-${viewport}.png`);
    });

    test(`login at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height });
      await page.goto('/login', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      await expect(page).toHaveScreenshot(`login-${viewport}.png`);
    });

    test(`register at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height });
      await page.goto('/register', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
      await expect(page).toHaveScreenshot(`register-${viewport}.png`);
    });

    test(`studio detail at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height });
      await page.goto('/studios/test-studio', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Test Studio' })).toBeVisible();
      await expect(page).toHaveScreenshot(`studio-${viewport}.png`);
    });

    test(`devlog detail at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height });
      // Need to mock the devlog endpoint — mockApi doesn't cover /devlogs/:id
      await page.route(`${API}/devlogs/*`, async (route) => {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            id: 'devlog-1', title: 'Test Devlog', slug: 'test-devlog',
            excerpt: 'A test devlog excerpt.', body: 'Full devlog body content for testing.',
            coverUrl: null, isPublished: true, publishedAt: '2025-01-15T00:00:00.000Z',
            game: { id: 'game-1', title: 'Test Game', slug: 'test-game' },
            studio: { id: 'studio-1' },
            author: { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null },
            createdAt: '2025-01-15T00:00:00.000Z', updatedAt: '2025-01-15T00:00:00.000Z',
          }),
        });
      });
      await page.route(`${API}/devlogs/*/comments`, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });
      await page.route(`${API}/devlogs/*/reactions`, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          targetType: 'DEVLOG', targetId: 'devlog-1',
          counts: { LIKE: 0, LOVE: 0, HYPE: 0, INSIGHTFUL: 0 }, viewerReactions: [],
        }) });
      });
      await page.goto('/devlogs/devlog-1', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Test Devlog' })).toBeVisible();
      await expect(page).toHaveScreenshot(`devlog-${viewport}.png`);
    });
  }

  // ── Protected pages (authenticated) ────────────────────────────────────

  for (const viewport of ['desktop', 'mobile'] as const) {
    const width = viewport === 'desktop' ? 1536 : 412;
    const height = viewport === 'desktop' ? 1024 : 915;

    test(`dashboard at ${viewport}`, async ({ page }) => {
      test.slow();
      // Seed auth before page load
      await page.addInitScript((token) => {
        window.localStorage.setItem('playmorrow_token', token);
      }, MOCK_TOKEN);
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
      await expect(page).toHaveScreenshot(`dashboard-${viewport}.png`);
    });

    test(`dashboard feed at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.addInitScript((token) => {
        window.localStorage.setItem('playmorrow_token', token);
      }, MOCK_TOKEN);
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard/feed', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Your Feed' })).toBeVisible();
      await expect(page).toHaveScreenshot(`feed-${viewport}.png`);
    });

    test(`notifications at ${viewport}`, async ({ page }) => {
      test.slow();
      await page.addInitScript((token) => {
        window.localStorage.setItem('playmorrow_token', token);
      }, MOCK_TOKEN);
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard/notifications', { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
      await expect(page).toHaveScreenshot(`notifications-${viewport}.png`);
    });
  }
});
