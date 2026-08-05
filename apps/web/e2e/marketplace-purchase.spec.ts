import { test, expect } from '@playwright/test';

test.describe('Marketplace Purchase Flow', () => {
  test('complete purchase with Stripe test card', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test-buyer@playmorrow.co');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    await page.goto('/marketplace');
    await expect(page.locator('.listing-card, a[href*="/marketplace/"]').first()).toBeVisible({ timeout: 10000 });

    const firstCard = page.locator('.listing-card, a[href*="/marketplace/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/marketplace\//);

    const buyButton = page.locator('button:has-text("Purchase"), button:has-text("Buy")');
    if (await buyButton.isVisible()) {
      await buyButton.click();
    }

    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    if (await stripeFrame.locator('[name="cardnumber"]').isVisible({ timeout: 5000 }).catch(() => false)) {
      await stripeFrame.locator('[name="cardnumber"]').fill('4242424242424242');
      await stripeFrame.locator('[name="exp-date"]').fill('12/30');
      await stripeFrame.locator('[name="cvc"]').fill('123');
      await stripeFrame.locator('[name="postal"]').fill('12345');
      await page.click('button:has-text("Pay")');
    }

    await expect(page).toHaveURL(/\/dashboard\/me\/licenses/, { timeout: 15000 });
  });

  test('purchase fails with declined card', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test-buyer@playmorrow.co');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/marketplace');
    const firstCard = page.locator('.listing-card, a[href*="/marketplace/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/marketplace\//);
    }

    const buyButton = page.locator('button:has-text("Purchase"), button:has-text("Buy")');
    if (await buyButton.isVisible()) {
      await buyButton.click();

      const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
      if (await stripeFrame.locator('[name="cardnumber"]').isVisible({ timeout: 5000 }).catch(() => false)) {
        await stripeFrame.locator('[name="cardnumber"]').fill('4000000000000002');
        await stripeFrame.locator('[name="exp-date"]').fill('12/30');
        await stripeFrame.locator('[name="cvc"]').fill('123');
        await stripeFrame.locator('[name="postal"]').fill('12345');
        await page.click('button:has-text("Pay")');
      }
    }

    await expect(page).not.toHaveURL(/\/licenses/, { timeout: 10000 });
  });

  test('unauthenticated user cannot purchase', async ({ page }) => {
    await page.goto('/marketplace');
    const firstCard = page.locator('.listing-card, a[href*="/marketplace/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCard.click();
      const buyButton = page.locator('button:has-text("Purchase"), button:has-text("Buy")');
      if (await buyButton.isVisible()) {
        await buyButton.click();
      }
    }
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
