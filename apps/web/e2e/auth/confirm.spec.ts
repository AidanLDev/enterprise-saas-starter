import { test, expect } from '@playwright/test';

test.describe('Confirm email page', () => {
  test('loads and shows the confirmation form', async ({ page }) => {
    await page.goto('/confirm?email=test%40example.com');

    await expect(page.getByRole('heading', { name: 'Confirm email' })).toBeVisible();
  });
});
