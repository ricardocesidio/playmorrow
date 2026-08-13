import { test, expect } from '@playwright/test';
import { MOCK_USER } from './fixtures/mocks';

test('OAuth callback finishes the post-login transition and redirects once', async ({ page }) => {
  const pageErrors: string[] = [];
  await page.addInitScript(() => {
    window.localStorage.setItem('playmorrow:visit-history', String(Date.now()));
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/api/auth/session/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
  });
  await page.route('**/api/health', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' });
  });

  await page.goto('/oauth/callback#csrf=test-csrf-token');
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  expect(page.url()).toContain('/dashboard');
  expect(pageErrors).toEqual([]);
});
