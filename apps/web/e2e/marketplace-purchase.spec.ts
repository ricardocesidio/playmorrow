import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mockApi, MOCK_USER, API_ORIGIN } from './fixtures/mocks';

/**
 * Hermetic Stripe.js stub — intercepts https://js.stripe.com/** so loadStripe()
 * resolves inside the test browser without a real Stripe account. The stub
 * implements the subset of the Stripe object surface used by
 * <Elements>/<PaymentElement> (elements.create/submit + confirmPayment) and
 * either completes the payment or returns a declined-card error.
 */
async function stubStripeJs(page: Page, opts: { decline?: boolean } = {}) {
  await page.route('https://js.stripe.com/**', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        (function () {
          var confirmResult = ${opts.decline ? "{ error: { message: 'Your card was declined.' } }" : '{}'};
          window.Stripe = function () {
            return {
              elements: function () {
                return {
                  create: function () {
                    return { mount: function () {}, destroy: function () {}, on: function () {}, update: function () {} };
                  },
                  getElement: function () { return null; },
                  submit: function () { return Promise.resolve({}); },
                };
              },
              confirmPayment: function () { return Promise.resolve(confirmResult); },
              // react-stripe-js v6 validates these surface members exist
              createToken: function () { return Promise.resolve({}); },
              createPaymentMethod: function () { return Promise.resolve({}); },
              confirmCardPayment: function () { return Promise.resolve(confirmResult); },
            };
          };
        })();
      `,
    });
  });
}

/**
 * Login through the real login form. Overrides the mock's default
 * authenticated /session/me response (last-registered route wins in Playwright)
 * so the form actually renders: 401 until the login POST flips the flag.
 */
async function loginViaUi(page: Page) {
  let authed = false;
  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/session/me',
    async (route) => {
      if (!authed) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      }
    },
  );
  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname === '/api/auth/session/login',
    async (route) => {
      authed = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_USER, csrfToken: 'mock-csrf-token' }),
      });
    },
  );

  await page.goto('/login');
  await page.getByLabel('Email or username').fill(MOCK_USER.email);
  await page.getByLabel('Password', { exact: true }).fill('TestPassword123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

async function openFirstListing(page: Page) {
  await page.goto('/marketplace');
  await expect(page.getByRole('link', { name: /Neon Audio Pack/ })).toBeVisible();
  await page.getByRole('link', { name: /Neon Audio Pack/ }).click();
  await expect(page).toHaveURL(/\/marketplace\/listing-1/);
}

test.describe('Marketplace Purchase Flow', () => {
  test('complete purchase with Stripe test card', async ({ page }) => {
    await mockApi(page);
    await stubStripeJs(page);

    // Browse → login → buy → pay → license → download, fully hermetic.
    await loginViaUi(page);
    await openFirstListing(page);

    await expect(page.getByRole('heading', { name: 'Neon Audio Pack' })).toBeVisible();
    await page.getByRole('button', { name: 'Purchase' }).click();

    // Purchase intent returns a clientSecret; StripePayment panel appears.
    await expect(page.getByRole('heading', { name: 'Complete Payment' })).toBeVisible();
    await page.getByRole('button', { name: 'Pay Now' }).click();

    // Successful payment unlocks the license page with a download link.
    await expect(page).toHaveURL(/\/dashboard\/me\/licenses/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'My Licenses' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download' })).toBeVisible();
  });

  test('purchase fails with declined card', async ({ page }) => {
    await mockApi(page);
    await stubStripeJs(page, { decline: true });

    await loginViaUi(page);
    await openFirstListing(page);

    await page.getByRole('button', { name: 'Purchase' }).click();
    await expect(page.getByRole('heading', { name: 'Complete Payment' })).toBeVisible();
    await page.getByRole('button', { name: 'Pay Now' }).click();

    await expect(page.getByText('Your card was declined.')).toBeVisible();
    await expect(page).not.toHaveURL(/\/licenses/, { timeout: 10000 });
  });

  test('unauthenticated user can browse but cannot purchase', async ({ page }) => {
    await mockApi(page, { unauthenticated: true });
    await stubStripeJs(page);

    // Marketplace browsing is intentionally public — no redirect expected.
    await page.goto('/marketplace');
    await expect(page).toHaveURL(/\/marketplace$/);
    await expect(page.getByRole('link', { name: /Neon Audio Pack/ })).toBeVisible();

    // Detail page is also public; only the purchase action is gated.
    await page.getByRole('link', { name: /Neon Audio Pack/ }).click();
    await expect(page).toHaveURL(/\/marketplace\/listing-1/);

    await page.getByRole('button', { name: 'Purchase' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
