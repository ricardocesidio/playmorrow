import { test, expect } from '@playwright/test';

test('OAuth callback finishes the post-login transition and redirects once', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('playmorrow:visit-history', String(Date.now()));
  });
  await page.route('**/api/auth/session/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/health', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' });
  });

  await page.goto('/oauth/callback#csrf=test-csrf-token');
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  expect(page.url()).toContain('/dashboard');
});
