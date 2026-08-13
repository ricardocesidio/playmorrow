import { test, expect, type Page } from '@playwright/test';

async function mockOnboardingRequests(page: Page) {
  await page.route('**/api/auth/session/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/studios**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
  });
  await page.route('**/api/games**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
  });
  await page.route('**/api/users/*', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not found' }) });
  });
}

async function reachProfileStep(page: Page) {
  await page.goto('/onboarding?provider=google&email=player%40example.com');
  await page.getByRole('button', { name: /Player/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByPlaceholder('Choose a username').fill('player123');
  await expect(page.getByText('Available')).toBeVisible();
  await page.getByRole('button', { name: /Continue/ }).click();
}

test.describe('Onboarding', () => {
  test('shows an error when the selected avatar cannot be decoded', async ({ page }) => {
    await mockOnboardingRequests(page);
    await reachProfileStep(page);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('not-an-image'),
    });

    await expect(page.getByText('Could not read this image.')).toBeVisible();
  });

  test('shows the completion error on the final wishlist step', async ({ page }) => {
    await mockOnboardingRequests(page);
    await page.route('**/api/auth/complete-onboarding', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unable to complete setup' }),
      });
    });
    await reachProfileStep(page);

    await page.getByLabel('Country *').selectOption({ label: 'Brazil' });
    await page.getByLabel('Bio *').fill('I enjoy discovering independent games.');
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: /Continue/ }).click();

    await expect(page.getByRole('heading', { name: 'Wishlist Games' })).toBeVisible();
    await page.getByRole('button', { name: 'Complete Setup' }).click();

    await expect(page.getByText('Unable to complete setup')).toBeVisible();
  });
});
