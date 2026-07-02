import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads and shows the landing content', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'SaaS Starter' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();
  });
});
