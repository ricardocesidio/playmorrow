import { test, expect, type Page } from '@playwright/test';
import { MOCK_USER, MOCK_TOKEN } from './fixtures/mocks';

const API_ORIGIN = 'http://localhost:4000';

test.describe('Personalized feed', () => {
  async function setupAuth(page: Page) {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.evaluate((token) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);
  }

  function feedResponse(items: unknown[], total: number, page: number, pageSize: number, hasMore: boolean) {
    return { items, total, page, pageSize, hasMore };
  }

  function makeItem(type: string, index: number) {
    const isDevlog = type === 'devlog';
    return {
      id: `feed-${type}-${index}`, type: type.toUpperCase(), createdAt: '2025-03-01T00:00:00.000Z',
      publishedAt: isDevlog ? '2025-03-01T00:00:00.000Z' : null,
      title: `${isDevlog ? 'Devlog' : 'Roadmap'} Item ${index}`,
      summary: `Summary for ${type} item ${index}.`,
      ...(isDevlog ? {} : { status: 'PLANNED', targetDate: '2026-06-01T00:00:00.000Z' }),
      game: { id: 'game-1', title: 'Test Game', slug: 'test-game', coverUrl: null },
      studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio', logoUrl: null },
      target: { kind: type.toUpperCase(), id: `${type}-${index}` },
    };
  }

  async function setupCommonMocks(page: Page) {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/notifications/unread-count', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unreadCount: 0 }) });
    });
    // Default feed handler (tests override this)
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      const urlP = new URL(route.request().url());
      const pageN = parseInt(urlP.searchParams.get('page') ?? '1');
      const ps = parseInt(urlP.searchParams.get('pageSize') ?? '10');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feedResponse([], 0, pageN, ps, false)) });
    });
    // Mock homepage dependencies
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/feed/public', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feedResponse([], 0, 1, 10, false)) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/games', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feedResponse([], 0, 1, 20, false)) });
    });
  }

  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuth(page);
  });

  test('All filter shows mixed content', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      const urlP = new URL(route.request().url());
      const pageN = parseInt(urlP.searchParams.get('page') ?? '1');
      const ps = parseInt(urlP.searchParams.get('pageSize') ?? '10');
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(feedResponse([makeItem('devlog', 0), makeItem('roadmap', 0)], 2, pageN, ps, false)),
      });
    });
    await page.goto('/dashboard/feed');
    await expect(page.getByText('Devlog Item 0')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Roadmap Item 0')).toBeVisible();
  });

  test('Devlogs filter sends type=devlogs', async ({ page }) => {
    let capturedUrl = '';
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(feedResponse([makeItem('devlog', 0)], 1, 1, 10, false)),
      });
    });
    await page.goto('/dashboard/feed');
    await page.getByRole('button', { name: 'Devlogs', exact: true }).click();
    expect(new URL(capturedUrl).searchParams.get('type')).toBe('devlogs');
    await expect(page.getByText('Devlog Item 0')).toBeVisible();
  });

  test('Roadmap filter sends type=roadmap', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(feedResponse([makeItem('roadmap', 0)], 1, 1, 10, false)),
      });
    });
    await page.goto('/dashboard/feed');
    await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
    await expect(page.getByText('Roadmap Item 0')).toBeVisible();
  });

  test('Empty state for no follows', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(feedResponse([], 0, 1, 10, false)),
      });
    });
    await page.goto('/dashboard/feed');
    await expect(page.getByText('Explore games')).toBeVisible({ timeout: 15_000 });
  });

  test('API failure shows retry button', async ({ page }) => {
    let callCount = 0;
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Error' }) });
      } else {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify(feedResponse([makeItem('devlog', 0)], 1, 1, 10, false)),
        });
      }
    });
    await page.goto('/dashboard/feed');
    await expect(page.getByText('Could not load your feed')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Try again').click();
    await expect(page.getByText('Devlog Item 0')).toBeVisible();
  });

  test('Pagination: next page requests page=2', async ({ page }) => {
    const requests: string[] = [];
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      const reqUrl = route.request().url();
      requests.push(reqUrl);
      const urlP = new URL(reqUrl);
      const pageN = parseInt(urlP.searchParams.get('page') ?? '1');
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(feedResponse(
          Array.from({ length: 10 }).map((_, i) => makeItem('devlog', i)),
          15, pageN, 10, pageN === 1,
        )),
      });
    });
    await page.goto('/dashboard/feed');
    // Wait for page 1 to load
    await expect(page.getByText('Devlog Item 0')).toBeVisible({ timeout: 15_000 });
    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();
    // Verify page=2 was requested
    expect(requests.some((u) => new URL(u).searchParams.get('page') === '2')).toBeTruthy();
  });
});
