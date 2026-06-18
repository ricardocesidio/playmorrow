import { test, expect, type Page } from '@playwright/test';
import { MOCK_USER, MOCK_TOKEN } from './fixtures/mocks';

const API_ORIGIN = 'http://localhost:4000';

test.describe('Follow interactions', () => {
  async function setupStudioMocks(page: Page, isFollowing = false, followerCount = 5) {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });

    // Studio detail
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/^\/api\/studios\/(?!me\b)[^/]+$/), async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'studio-1', name: 'Test Studio', slug: 'test-studio', tagline: null,
          description: null, logoUrl: null, bannerUrl: null, websiteUrl: null, location: null,
          foundedYear: null, isVerified: false, membersCount: 1, gamesCount: 0, followersCount: isFollowing ? 6 : followerCount,
          createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
        }),
      });
    });
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/members/), async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ members: [] }) });
    });
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/games/), async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }) });
    });

    // Follow-status
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/follow-status/), async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing, followerCount }),
      });
    });
  }

  test('Guest redirects to login on follow', async ({ page }) => {
    await page.route((url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/^\/api\/studios\/(?!me\b)[^/]+$/), async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'studio-1', name: 'Test Studio', slug: 'test-studio', tagline: null,
          description: null, logoUrl: null, bannerUrl: null, websiteUrl: null, location: null,
          foundedYear: null, isVerified: false, membersCount: 0, gamesCount: 0, followersCount: 5,
          createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
        }),
      });
    });
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/members/), async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ members: [] }) });
    });
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/games/), async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }) });
    });
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/follow-status/), async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: false, followerCount: 5 }),
      });
    });

    let followCalled = false;
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/follow$/), async (route, request) => {
      if (request.method() === 'POST') followCalled = true;
      await route.fulfill({ status: 401 });
    });

    await page.goto('/studios/test-studio');
    await page.getByRole('button', { name: 'Follow' }).first().click();
    await page.waitForURL('/login', { timeout: 15_000 });
    expect(followCalled).toBeFalsy();
  });

  test('Authenticated user can follow and unfollow studio', async ({ page }) => {
    // Track follow state
    let currentFollowing = false;
    let currentCount = 5;

    await setupStudioMocks(page, false, 5);

    // Override follow-status handler to return current state
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/follow-status/), async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: currentFollowing, followerCount: currentCount }),
      });
    });

    // Follow/unfollow endpoint
    await page.route((url) => url.origin === API_ORIGIN && !!url.pathname.match(/\/studios\/[^/]+\/follow$/), async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        currentFollowing = true;
        currentCount = 6;
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: true, followerCount: 6 }),
        });
      } else {
        currentFollowing = false;
        currentCount = 5;
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: false, followerCount: 5 }),
        });
      }
    });

    await page.goto('/');
    await page.evaluate((token) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);
    await page.goto('/studios/test-studio');

    // Follow
    const followBtn = page.getByRole('button', { name: /Follow/ });
    await expect(followBtn.first()).toBeVisible({ timeout: 15_000 });
    await followBtn.first().click();
    await expect(page.getByRole('button', { name: 'Following' }).first()).toBeVisible({ timeout: 15_000 });

    // Unfollow
    await page.getByRole('button', { name: 'Following' }).first().click();
    await expect(page.getByRole('button', { name: 'Follow' }).first()).toBeVisible({ timeout: 15_000 });
  });
});
