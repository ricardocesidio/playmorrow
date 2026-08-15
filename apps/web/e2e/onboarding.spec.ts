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

  test('previews a valid avatar image', async ({ page }) => {
    await mockOnboardingRequests(page);
    await reachProfileStep(page);

    await page.locator('input[type="file"]').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });

    await expect(page.locator('img[src^="data:image/jpeg"]')).toBeVisible();
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

  test('sends only fields accepted by the onboarding API', async ({ page }) => {
    await mockOnboardingRequests(page);
    let submittedBody: Record<string, unknown> | undefined;
    await page.route('**/api/auth/complete-onboarding', async (route) => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'user-1' }, csrfToken: 'csrf-token' }),
      });
    });
    await reachProfileStep(page);

    await page.getByLabel('Country *').selectOption({ label: 'Brazil' });
    await page.getByLabel('Bio *').fill('I enjoy discovering independent games.');
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: 'Complete Setup' }).click();

    await expect.poll(() => submittedBody).toBeDefined();
    expect(submittedBody).not.toHaveProperty('provider');
  });

  test('lands on /dashboard after completing setup and does not bounce back to /onboarding', async ({ page }) => {
    // Authenticated session that becomes onboarded only after the mutation succeeds
    let onboarded = false;
    await page.route('**/api/auth/session/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-1',
          email: 'player@example.com',
          username: 'player123',
          displayName: 'Player',
          role: 'PLAYER',
          accountType: 'PLAYER',
          isOnboardingCompleted: onboarded,
          csrfToken: 'csrf-1',
        }),
      });
    });
    await page.route('**/api/auth/complete-onboarding', async (route) => {
      onboarded = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'user-1', username: 'player123', displayName: 'Player', role: 'PLAYER', accountType: 'PLAYER' },
          csrfToken: 'csrf-2',
        }),
      });
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

    await page.goto('/onboarding');
    await page.getByRole('button', { name: /Player/ }).click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByPlaceholder('Choose a username').fill('player123');
    await expect(page.getByText('Available')).toBeVisible();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByLabel('Country *').selectOption({ label: 'Brazil' });
    await page.getByLabel('Bio *').fill('I enjoy discovering independent games.');
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('button', { name: 'Complete Setup' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/\/onboarding/);
  });
});
