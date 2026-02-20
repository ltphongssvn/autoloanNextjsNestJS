import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page, email = 'alice@example.com', password = 'password123') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Dashboard', () => {
  test('should display dashboard with applications table or empty state', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    const table = page.getByTestId('applications-table');
    const empty = page.getByTestId('empty-state');
    await expect(table.or(empty)).toBeVisible({ timeout: 5000 });
  });

  test('should show New Application link for customers', async ({ page }) => {
    await login(page);
    await expect(page.getByTestId('new-app-link')).toBeVisible();
  });

  test('should navigate to new application form', async ({ page }) => {
    await login(page);
    await page.getByTestId('new-app-link').click();
    await expect(page).toHaveURL(/\/applications\/new/);
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
  });

  test('should navigate through multi-step form', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/applications/new');
    await expect(page.getByTestId('step-personal')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('step-vehicle')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('step-employment')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('step-loan')).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByTestId('step-employment')).toBeVisible();
  });

  test('should access profile page', async ({ page }) => {
    await login(page);
    await page.getByText('Profile').click();
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});
