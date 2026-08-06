import { test, expect } from '@playwright/test';
import { mockApi, setupAuth, MOCK_EVENT, MOCK_PARTNER } from './fixtures/mocks';

test.describe('Phase 5 — Marketplace, Events, Partners, Revenue, Creator', () => {
  test('marketplace browse shows listings and opens detail', async ({ page }) => {
    await mockApi(page);
    await page.goto('/marketplace');

    await expect(page.getByRole('heading', { name: 'Marketplace' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Neon Audio Pack/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Old Sound Kit/ })).toBeVisible();

    await page.getByRole('link', { name: /Neon Audio Pack/ }).click();
    await expect(page).toHaveURL(/\/marketplace\/listing-1/);
    await expect(page.getByRole('heading', { name: 'Neon Audio Pack' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Purchase' })).toBeVisible();
    await expect(page.getByText('by Test Studio')).toBeVisible();
  });

  test('marketplace type filter routes to ?type and filters', async ({ page }) => {
    await mockApi(page);
    await page.goto('/marketplace');

    await page.getByRole('tab', { name: 'Plugins' }).click();
    await expect(page).toHaveURL(/type=PLUGIN/);
    await expect(page.getByRole('link', { name: /WIP Shader Pack/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Neon Audio Pack/ })).not.toBeVisible();
  });

  test('studio dashboard lists all statuses with Edit and Archive', async ({ page }) => {
    await mockApi(page);
    await setupAuth(page);
    await page.goto('/dashboard/marketplace');

    await expect(page.getByRole('heading', { name: 'My Listings' })).toBeVisible();
    await expect(page.getByText('ACTIVE', { exact: true })).toBeVisible();
    await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
    await expect(page.getByText('ARCHIVED', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit Neon Audio Pack' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Archive Neon Audio Pack' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Archive WIP Shader Pack' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Archive Old Sound Kit/ })).not.toBeVisible();
  });

  test('edit listing prefills values and saves via PATCH', async ({ page }) => {
    await mockApi(page);
    await setupAuth(page);

    await page.goto('/dashboard/marketplace/listing-1');
    await expect(page.getByRole('heading', { name: 'Edit Listing' })).toBeVisible();

    const title = page.getByLabel('Title');
    await expect(title).toHaveValue('Neon Audio Pack');
    await expect(page.getByLabel('Price (cents)')).toHaveValue('1999');

    const patchPromise = page.waitForRequest((r) => r.method() === 'PATCH' && r.url().includes('/api/marketplace/listing-1'));
    await title.fill('Neon Audio Pack Deluxe');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    const patchReq = await patchPromise;
    expect(patchReq.postDataJSON()).toMatchObject({
      title: 'Neon Audio Pack Deluxe',
      priceCents: 1999,
      type: 'ASSET',
      status: 'ACTIVE',
    });
    await expect(page).toHaveURL('/dashboard/marketplace');
  });

  test('archive listing sends DELETE and archives', async ({ page }) => {
    await mockApi(page);
    await setupAuth(page);
    await page.goto('/dashboard/marketplace');

    page.once('dialog', (dialog) => dialog.accept());

    const deleteReq = page.waitForRequest((r) => r.url().includes('/api/marketplace/listing-2') && r.method() === 'DELETE');
    await page.getByRole('button', { name: 'Archive WIP Shader Pack' }).click();
    await deleteReq;

    await expect(page.getByText('Listing archived').first()).toBeVisible({ timeout: 10000 });
  });

  test('events listing shows upcoming and detail allows register', async ({ page }) => {
    await mockApi(page);
    await page.goto('/events');

    await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Indie Game Jam 2026/ })).toBeVisible();
    await expect(page.getByText('Free')).toBeVisible();

    await page.getByRole('link', { name: /Indie Game Jam 2026/ }).click();
    await expect(page).toHaveURL(/\/events\/indie-game-jam-2026/);
    await expect(page.getByRole('heading', { name: 'Indie Game Jam 2026' })).toBeVisible();
    await expect(page.getByText('Virtual Event')).toBeVisible();

    const register = page.getByRole('button', { name: 'Register' });
    await register.click();
    await expect(page.getByText('Registered')).toBeVisible();
  });

  test('partners network renders with type tabs', async ({ page }) => {
    await mockApi(page);
    await setupAuth(page);
    await page.goto('/dashboard/partners');

    await expect(page.getByRole('heading', { name: 'Partner Network' })).toBeVisible();
    await expect(page.getByText(MOCK_PARTNER.name)).toBeVisible();
    await expect(page.getByText('Orbit Interactive')).toBeVisible();

    await page.getByRole('tab', { name: 'Universities' }).click();
    await expect(page.getByText(MOCK_PARTNER.name)).toBeVisible();
    await expect(page.getByText('Orbit Interactive')).not.toBeVisible();
  });

  test('revenue dashboard shows studio sales metrics', async ({ page }) => {
    await mockApi(page);
    await setupAuth(page);
    await page.goto('/dashboard/revenue');

    await expect(page.getByRole('heading', { name: 'Revenue Dashboard' })).toBeVisible();
    await expect(page.getByText('Test Studio')).toBeVisible();
    await expect(page.getByText('Sales', { exact: true })).toBeVisible();
    await expect(page.getByText('Net', { exact: true })).toBeVisible();
  });

  test('creator program shows referral link and commissions', async ({ page }) => {
    await mockApi(page);
    await setupAuth(page);
    await page.goto('/dashboard/creator');

    await expect(page.getByRole('heading', { name: 'Creator Program' })).toBeVisible();
    await expect(page.getByText(/ref=PLAYTEST/)).toBeVisible();
    await expect(page.getByText('Your Referral Link')).toBeVisible();

    const copyButton = page.getByRole('button', { name: 'Copy referral link' });
    await expect(copyButton).toBeEnabled();
    await copyButton.click();
    await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();
  });
});
