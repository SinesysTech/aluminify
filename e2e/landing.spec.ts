import { test, expect } from '@playwright/test';

test('landing page loads and displays key elements', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Aluminify/);

  // Check for the main heading
  await expect(page.getByRole('heading', { name: /Seu curso online/i })).toBeVisible();

  // Check for the "Entre em contato" button/link
  await expect(page.getByRole('link', { name: /Entre em contato/i })).toBeVisible();

  // Check for the "Ver funcionalidades" button/link
  await expect(page.getByRole('link', { name: /Ver funcionalidades/i })).toBeVisible();
});
