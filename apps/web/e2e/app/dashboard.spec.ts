import { test, expect } from '@playwright/test';

test.describe('Dashboard page', () => {
  // TODO: add authenticated tests via a storageState fixture once a Cognito test user exists.
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
