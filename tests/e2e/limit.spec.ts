import { expect, test } from '@playwright/test';

const dial = '.gauge';
const limit = '[data-limit]';

test('the limit is dragged onto the dial and remembered', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(limit)).toHaveText('85');

  const box = (await page.locator(dial).boundingBox())!;
  // The quiet end of the arc, on the left.
  await page.mouse.move(box.x + box.width * 0.06, box.y + box.height * 0.86);
  await page.mouse.down();
  await page.mouse.up();

  await expect(page.locator(limit)).toHaveText('30');

  await page.reload();
  await expect(page.locator(limit)).toHaveText('30');
});

test('it says what it is and what it is not', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.note')).toContainText('not a sound level meter');
  await expect(page.getByRole('button')).toHaveText('Start listening');
});
