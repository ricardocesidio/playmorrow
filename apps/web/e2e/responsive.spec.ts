import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_TOKEN } from './fixtures/mocks';

const API_ORIGIN = 'http://localhost:4000';

test.describe('Responsive layout', () => {
  const routes: Array<{ path: string; name: string }> = [
    { path: '/', name: 'homepage' },
    { path: '/games', name: 'games explore' },
    { path: '/games/test-game', name: 'game detail' },
    { path: '/login', name: 'login' },
  ];

  for (const route of routes) {
    test(`No overflow on ${route.name} at desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw).toBeLessThanOrEqual(1440);
    });

    test(`No overflow on ${route.name} at mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 412, height: 915 });
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw).toBeLessThanOrEqual(412);
    });
  }

  test('No overflow on protected dashboard routes', async ({ page }) => {
    // Mock all endpoints the dashboard pages depend on
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/studios/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/notifications/unread-count', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unreadCount: 0 }) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/notifications', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20 }) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/follows', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ studios: [], games: [] }) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/feed/public', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 10, hasMore: false }) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/games', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 10, hasMore: false }) });
    });

    // Also mock /studios/:slug/games which MyGamesList calls
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/^\/api\/studios\/[^/]+\/games/), async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }) });
    });
    // Mock /games/:slug/devlogs for MyDevlogs
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/^\/api\/games\/[^/]+\/devlogs/), async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }) });
    });

    // Set up auth
    await page.goto('/');
    await page.evaluate((token) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);

    for (const path of ['/dashboard', '/dashboard/feed', '/dashboard/notifications']) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      let sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw).toBeLessThanOrEqual(1440);

      await page.setViewportSize({ width: 412, height: 915 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw).toBeLessThanOrEqual(412);
    }
  });
});
