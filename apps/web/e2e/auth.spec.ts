import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_TOKEN } from './fixtures/mocks';

const API_ORIGIN = 'http://localhost:4000';

test.describe('Authentication', () => {
  test('Login page renders', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('Register page renders', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  });

  test('Login success stores token and redirects', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/login', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: MOCK_USER, accessToken: MOCK_TOKEN }) });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('testuser');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15_000 });
    // Check token stored
    const stored = await page.evaluate(() => localStorage.getItem('playmorrow_token'));
    expect(stored).toBe(MOCK_TOKEN);
  });

  test('Login failure shows error', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/login', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials' }) });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('testuser');
    await page.getByPlaceholder('••••••••').fill('wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    expect(page.url()).toContain('/login');
  });

  test('Protected feed redirects to login when unauthenticated', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.goto('/dashboard/feed');
    await page.waitForURL('/login', { timeout: 15_000 });
  });

  test('Authenticated feed renders', async ({ page }) => {
    // Mock all needed endpoints
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/feed', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          items: [{ id: 'feed-1', type: 'DEVLOG', createdAt: '2025-03-01T00:00:00.000Z',
            publishedAt: '2025-03-01T00:00:00.000Z', title: 'Personalized Devlog',
            summary: 'A personalized feed devlog.', game: { id: 'game-1', title: 'Test Game', slug: 'test-game', coverUrl: null },
            studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio', logoUrl: null },
            target: { kind: 'DEVLOG', id: 'devlog-1' } }],
          total: 1, page: 1, pageSize: 10, hasMore: false,
        }),
      });
    });
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/me/notifications/unread-count', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unreadCount: 0 }) });
    });

    // Set auth and navigate
    await page.goto('/');
    await page.evaluate((token) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);
    await page.goto('/dashboard/feed');

    await expect(page.getByRole('heading', { name: 'Your Feed' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Personalized Devlog')).toBeVisible();
  });
});
