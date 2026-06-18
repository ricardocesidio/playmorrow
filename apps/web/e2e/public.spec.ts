import { test, expect } from '@playwright/test';
import { mockApi, API } from './fixtures/mocks';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe('Public pages', () => {
  test('Homepage renders without errors', async ({ page }) => {
    page.on('pageerror', (e) => { throw new Error(`Page error: ${e.message}`); });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Discover/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore games' })).toBeVisible();
  });

  test('Explore games renders game cards', async ({ page }) => {
    await page.goto('/games');
    await expect(page.getByRole('heading', { name: 'Explore games' })).toBeVisible();
    // Wait for game cards to appear
    await expect(page.getByText('Test Game').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Explore games search input works', async ({ page }) => {
    await page.goto('/games');
    const searchInput = page.getByPlaceholder('Search games…');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Test');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Searched Game')).toBeVisible();
  });

  test('Explore games empty results state', async ({ page }) => {
    await page.route(`${API}/games*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false }),
      });
    });
    await page.goto('/games');
    await expect(page.getByText('No games yet')).toBeVisible();
  });

  test('Explore games error state', async ({ page }) => {
    await page.route(`${API}/games*`, async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server error' }) });
    });
    await page.goto('/games');
    await expect(page.getByText('Failed to load games')).toBeVisible();
    await expect(page.getByText('Try again')).toBeVisible();
  });

  test('Pagination controls appear with enough items', async ({ page }) => {
    const manyGames = Array.from({ length: 25 }).map((_, i) => ({
      id: `game-${i}`,
      title: `Test Game ${i}`,
      slug: `test-game-${i}`,
      tagline: null, description: null,
      status: 'IN_DEVELOPMENT',
      releaseDate: null, expectedReleaseText: null,
      priceCents: null, currency: 'USD', isFree: false,
      coverUrl: null, bannerUrl: null,
      isPublished: true, followersCount: 0,
      studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio' },
      media: [], platformLinks: [], tags: [],
      createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
    }));
    await page.route(`${API}/games*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: manyGames.slice(0, 20), total: 25, page: 1, pageSize: 20, hasMore: true }),
      });
    });
    await page.goto('/games');
    await expect(page.getByText('Next')).toBeVisible();
    await expect(page.getByText('Previous')).toBeDisabled();
  });

  test('Game detail renders metadata', async ({ page }) => {
    await page.goto('/games/test-game');
    await expect(page.getByRole('heading', { name: 'Test Game' })).toBeVisible();
    await expect(page.getByText('Test Studio')).toBeVisible();
    await expect(page.getByText('IN_DEVELOPMENT')).toBeVisible();
  });

  test('Studio detail renders metadata', async ({ page }) => {
    await page.goto('/studios/test-studio');
    await expect(page.getByRole('heading', { name: 'Test Studio' })).toBeVisible({ timeout: 20_000 });
  });
});
