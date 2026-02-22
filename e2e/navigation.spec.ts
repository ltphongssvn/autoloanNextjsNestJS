import { test, expect } from '@playwright/test';
test.describe('Navigation', () => {
  test('should show public nav when not logged in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('AutoLoan')).toBeVisible();
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByText('Create Account')).toBeVisible();
  });
  test('should redirect to login when accessing dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
  test('should show authenticated nav after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('tiffany.chen@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });
});
