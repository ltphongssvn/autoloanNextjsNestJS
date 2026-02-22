import { test, expect } from '@playwright/test';
test.describe('Authentication', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('AutoLoan Application Platform');
    await expect(page.getByText('Log In')).toBeVisible();
    await expect(page.getByText('Sign Up')).toBeVisible();
  });
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('invalid@test.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page.locator('.bg-red-50[role="alert"]')).toBeVisible();
  });
  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('tiffany.chen@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent');
    await expect(page.getByText('404')).toBeVisible();
  });
});
