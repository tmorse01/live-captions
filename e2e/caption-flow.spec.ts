import { test, expect } from '@playwright/test';

test.describe('Caption flow', () => {
  test('shows idle state and start button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Live Captions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start captioning' })).toBeVisible();
    await expect(page.getByText('Tap Start to begin captioning')).toBeVisible();
  });

  test('opens settings sheet', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Theme')).toBeVisible();
    await page.getByRole('button', { name: 'Close settings' }).click();
  });

  test('start requests microphone and shows listening or error', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start captioning' }).click();

    // Should transition to listening or show mic-related state
    await expect(
      page.getByText(/Listening|Requesting microphone|Stop captioning/),
    ).toBeVisible({ timeout: 10000 });
  });
});
