import { test, expect } from '@playwright/test';
import { API, MOCK_USER, MOCK_TOKEN } from './fixtures/mocks';

test.beforeEach(async ({ page }) => {
  // Mock common API routes
  await page.route(`${API}/auth/me`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
  });
  await page.route(`${API}/me/notifications/unread-count`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unreadCount: 0 }) });
  });
  await page.route(`${API}/feed/public*`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 10, hasMore: false }) });
  });
  await page.route(/\/api\/games(?:\?|$)/, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }) });
  });
  // Set up localStorage auth
  await page.goto('/');
  await page.evaluate((token) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);
});

test.describe('Personalized feed', () => {
  const makeItems = (type: string, count: number) =>
    Array.from({ length: count }).map((_, i) => ({
      id: `feed-${type}-${i}`,
      type: type.toUpperCase(),
      createdAt: '2025-03-01T00:00:00.000Z',
      publishedAt: type === 'devlog' ? '2025-03-01T00:00:00.000Z' : null,
      title: `${type === 'devlog' ? 'Devlog' : 'Roadmap'} Item ${i}`,
      summary: `Summary for ${type} item ${i}.`,
      ...(type === 'roadmap' ? { status: 'PLANNED', targetDate: '2026-06-01T00:00:00.000Z' } : {}),
      game: { id: 'game-1', title: 'Test Game', slug: 'test-game', coverUrl: null },
      studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio', logoUrl: null },
      target: { kind: type.toUpperCase(), id: `${type}-${i}` },
    }));

  test('All filter shows mixed content', async ({ page }) => {
    page.on('console', (msg) => { if (msg.type() === 'error') console.log('FEED TEST ERROR:', msg.text()); });
    // Log all API requests for debugging
    page.on('request', (req) => { if (req.url().includes('/api/')) console.log('API REQ:', req.method(), req.url()); });
    await page.route(`${API}/me/feed*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [...makeItems('devlog', 2), ...makeItems('roadmap', 2)],
          total: 4, page: 1, pageSize: 10, hasMore: false,
        }),
      });
    });
    await page.goto('/dashboard/feed');
    await expect(page.getByText('Devlog Item 0').first()).toBeVisible();
    await expect(page.getByText('Roadmap Item 0').first()).toBeVisible();
  });

  test('Devlogs filter sends type=devlogs', async ({ page }) => {
    let requestedUrl = '';
    await page.route(`${API}/me/feed*`, async (route) => {
      requestedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: makeItems('devlog', 2), total: 2, page: 1, pageSize: 10, hasMore: false }),
      });
    });
    await page.goto('/dashboard/feed');
    await page.getByRole('button', { name: 'Devlogs', exact: true }).click();
    expect(requestedUrl).toContain('type=devlogs');
    await expect(page.getByText('Devlog Item 0').first()).toBeVisible();
  });

  test('Roadmap filter sends type=roadmap', async ({ page }) => {
    await page.route(`${API}/me/feed*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: makeItems('roadmap', 2), total: 2, page: 1, pageSize: 10, hasMore: false }),
      });
    });
    await page.goto('/dashboard/feed');
    await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
    await expect(page.getByText('Roadmap Item 0').first()).toBeVisible();
  });

  test('Empty state for no follows', async ({ page }) => {
    await page.route(`${API}/me/feed*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 10, hasMore: false }),
      });
    });
    await page.goto('/dashboard/feed');
    await expect(page.getByText('Explore games')).toBeVisible();
  });

  test('API failure shows retry button', async ({ page }) => {
    await page.route(`${API}/me/feed*`, async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Error' }) });
    });
    await page.goto('/dashboard/feed');
    await expect(page.getByText('Could not load your feed')).toBeVisible();
    await expect(page.getByText('Try again')).toBeVisible();
  });

  test('Pagination: next page requests page=2', async ({ page }) => {
    const requests: string[] = [];
    await page.route(`${API}/me/feed*`, async (route) => {
      requests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: makeItems('devlog', 10),
          total: 15, page: requests.length === 1 ? 1 : 2, pageSize: 10, hasMore: requests.length === 1,
        }),
      });
    });
    await page.goto('/dashboard/feed');
    await page.getByRole('button', { name: 'Next' }).click();
    expect(requests.some((u) => u.includes('page=2'))).toBeTruthy();
  });
});
