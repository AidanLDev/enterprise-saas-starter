import { test, expect } from '@playwright/test';

test.describe('Team page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard/team');

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
