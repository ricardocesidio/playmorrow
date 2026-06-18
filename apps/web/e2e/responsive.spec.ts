import { test, expect } from '@playwright/test';
import { mockApi, API, MOCK_USER, MOCK_TOKEN } from './fixtures/mocks';

test.describe('Responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  const routes = [
    { path: '/', name: 'homepage' },
    { path: '/games', name: 'games explore' },
    { path: '/games/test-game', name: 'game detail' },
    { path: '/login', name: 'login' },
  ];

  for (const route of routes) {
    test(`No horizontal overflow on ${route.name} at desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(1440);
    });

    test(`No horizontal overflow on ${route.name} at mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 412, height: 915 });
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(412);
    });
  }

  test('Protected dashboard routes have no overflow', async ({ page }) => {
    await page.route(`${API}/auth/me`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.route(`${API}/me/notifications/unread-count`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unreadCount: 0 }) });
    });
    await page.route(`${API}/me/notifications*`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20 }) });
    });
    await page.route(`${API}/studios/me`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route(`${API}/me/follows`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ studios: [], games: [] }) });
    });
    await page.route(`${API}/feed/public*`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 10, hasMore: false }) });
    });
    await page.route(`${API}/games*`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }) });
    });
    await page.route(`${API}/me/feed*`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 10, hasMore: false }) });
    });

    await page.goto('/');
    await page.evaluate((token) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);

    for (const path of ['/dashboard/feed', '/dashboard/notifications']) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const desktopWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(desktopWidth).toBeLessThanOrEqual(1440);

      await page.setViewportSize({ width: 412, height: 915 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const mobileWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(mobileWidth).toBeLessThanOrEqual(412);
    }
  });
});
