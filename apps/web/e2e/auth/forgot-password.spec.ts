import { test, expect } from '@playwright/test';

test.describe('Forgot password page', () => {
  test('loads and shows the reset password form', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible();
  });
});
