import { test, expect } from '@playwright/test';

test.describe('Reset password page', () => {
  test('loads and shows the set new password form', async ({ page }) => {
    await page.goto('/reset-password?email=test%40example.com');

    await expect(page.getByRole('heading', { name: 'Set new password' })).toBeVisible();
  });
});
