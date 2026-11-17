import { test, expect } from '@playwright/test';

test('homepage has the current title and public entrance', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Clipt');
  await expect(page.getByRole('button', { name: 'ENTER CLIPT', exact: true })).toBeVisible();
});

test('login flow', async ({ page }) => {
  await page.goto('/login');
  // Add login test implementation
});
