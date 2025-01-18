import { test, expect } from '@playwright/test';

test('homepage has title and login button', async ({ page }) => {
  await page.goto('/');
  
  // Check title
  await expect(page).toHaveTitle(/Clip - Share Your Gaming Moments/);
  
  // Verify main content
  await expect(page.locator('[role="main"]')).toBeVisible();
  
  // Check for login elements when not authenticated
  const heading = page.locator('h1');
  await expect(heading).toContainText('Share Your Epic Gaming Moments');
});

test('login flow', async ({ page }) => {
  await page.goto('/login');
  // Add login test implementation
});