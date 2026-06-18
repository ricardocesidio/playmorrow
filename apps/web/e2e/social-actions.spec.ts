import { test, expect, type Page } from '@playwright/test';
import { API, MOCK_USER, MOCK_TOKEN } from './fixtures/mocks';

test.describe('Follow interactions', () => {
  const setupMocks = async (page: Page, isFollowing = false, followerCount = 5) => {
    await page.goto('/');
    await page.evaluate((token: string) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);
    await page.route(`${API}/auth/me`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });

    // Studio detail mocks
    await page.route(`${API}/studios/test-studio`, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'studio-1', name: 'Test Studio', slug: 'test-studio', tagline: 'A test studio',
          description: null, logoUrl: null, bannerUrl: null, websiteUrl: null, location: null,
          foundedYear: null, isVerified: false, membersCount: 1, gamesCount: 1, followersCount: 0,
          createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
        }),
      });
    });
    await page.route(`${API}/studios/test-studio/members`, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ id: 'studio-1', name: 'Test Studio', slug: 'test-studio', members: [] }),
      });
    });
    await page.route(`${API}/studios/test-studio/games`, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }),
      });
    });

    // Follow status mock
    await page.route(`${API}/studios/test-studio/follow-status`, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing, followerCount }),
      });
    });
  };

  test('Guest redirects to login on follow', async ({ page }) => {
    // Set up with no auth
    await page.route(`${API}/auth/me`, async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.route(`${API}/studios/test-studio`, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'studio-1', name: 'Test Studio', slug: 'test-studio', tagline: null,
          description: null, logoUrl: null, bannerUrl: null, websiteUrl: null, location: null,
          foundedYear: null, isVerified: false, membersCount: 0, gamesCount: 0, followersCount: 0,
          createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
        }),
      });
    });
    await page.route(`${API}/studios/test-studio/follow-status`, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: false, followerCount: 5 }),
      });
    });

    let followPostCalled = false;
    await page.route(`${API}/studios/test-studio/follow`, async (route, request) => {
      if (request.method() === 'POST') followPostCalled = true;
      await route.fulfill({ status: 401 });
    });

    await page.goto('/studios/test-studio');
    await page.getByRole('button', { name: 'Follow' }).click();
    await page.waitForURL('/login', { timeout: 10_000 });
    expect(followPostCalled).toBeFalsy();
  });

  test('Authenticated user can follow and unfollow studio', async ({ page }) => {
    let currentFollowing = false;
    let currentCount = 5;

    await setupMocks(page, false, 5);

    await page.route(`${API}/studios/test-studio/follow`, async (route, request) => {
      if (request.method() === 'POST') {
        currentFollowing = true;
        currentCount = 6;
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: true, followerCount: 6 }),
        });
      } else if (request.method() === 'DELETE') {
        currentFollowing = false;
        currentCount = 5;
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: false, followerCount: 5 }),
        });
      } else {
        await route.fulfill({ status: 404 });
      }
    });

    // Refresh follow-status after mutations
    await page.route(`${API}/studios/test-studio/follow-status`, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: currentFollowing, followerCount: currentCount }),
      });
    });

    await page.goto('/studios/test-studio');

    // Follow
    const followBtn = page.getByRole('button', { name: /Follow/ });
    await expect(followBtn).toBeVisible();
    await followBtn.click();
    await expect(page.getByRole('button', { name: 'Following' })).toBeVisible({ timeout: 10_000 });

    // Unfollow
    await page.getByRole('button', { name: 'Following' }).click();
    await expect(page.getByRole('button', { name: 'Follow' })).toBeVisible({ timeout: 10_000 });
  });
});
