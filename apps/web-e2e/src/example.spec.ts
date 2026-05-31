import { test, expect } from '@playwright/test';

test('renders the operational home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toHaveText('Operacao do conhecimento');
});
