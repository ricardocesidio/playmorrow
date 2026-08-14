import { test, expect, type Page } from '@playwright/test';

async function mockRegisterPage(page: Page) {
  await page.route('**/api/auth/session/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });
}

test.describe('Register', () => {
  test('submits only the fields accepted by the auth API and redirects to verify-email', async ({ page }) => {
    await mockRegisterPage(page);
    let submittedBody: Record<string, unknown> | undefined;
    await page.route('**/api/auth/register', async (route) => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          requiresEmailVerification: true,
          email: 'dev@example.com',
          user: {
            id: 'user-1',
            displayName: 'dev',
            username: 'dev',
            email: 'dev@example.com',
            accountType: 'PLAYER',
            emailVerifiedAt: null,
          },
        }),
      });
    });

    await page.goto('/register');
    await page.getByLabel('Email').fill('dev@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Str0ng!pass');
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Create account' }).click();

    await page.waitForURL(/\/verify-email\?/, { timeout: 15_000 });

    await expect.poll(() => submittedBody).toBeDefined();
    expect(submittedBody).toMatchObject({
      email: 'dev@example.com',
      password: 'Str0ng!pass',
      acceptedTerms: true,
      acceptedPrivacy: true,
      marketingOptIn: false,
      partnerMarketingOptIn: false,
    });
    expect(submittedBody).not.toHaveProperty('username');
    expect(submittedBody).not.toHaveProperty('displayName');
    expect(submittedBody).not.toHaveProperty('accountType');
  });

  test('web-vitals sends the analytics beacon with an application/json content type', async ({ page }) => {
    await mockRegisterPage(page);
    const captured: string[] = [];
    await page.route('**/api/analytics/track', async (route) => {
      captured.push(route.request().headers()['content-type'] ?? '');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/register', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Create your signal' })).toBeVisible();

    await expect.poll(() => captured.length, { timeout: 15_000 }).toBeGreaterThan(0);
    expect(captured.every((ct) => ct.startsWith('application/json'))).toBe(true);
  });
});
