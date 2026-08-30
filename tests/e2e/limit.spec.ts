import { expect, test } from '@playwright/test';

const dial = '.gauge';
const limit = '[data-limit]';

test('the limit is dragged onto the dial and remembered', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(limit)).toHaveText('85');

  const box = (await page.locator(dial).boundingBox())!;
  // Below the left half, which the dial reads as the quiet extreme whatever the scale.
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.9);
  await page.mouse.down();
  await page.mouse.up();

  await expect(page.locator(limit)).toHaveText('0');

  await page.reload();
  await expect(page.locator(limit)).toHaveText('0');
});

test('it says what it is and what it is not', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.note')).toContainText('not a sound level meter');
  await expect(page.locator('.version')).toHaveText(/^v\d+\.\d+\.\d+$/);
  await expect(page.getByRole('button')).toHaveText('Start listening');
});
