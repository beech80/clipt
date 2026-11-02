import {expect, type Page} from '@playwright/test';

/** Exercise the real entrance before each fresh browser navigation, never bypass it. */
export async function openApp(page: Page, url: string, options?: Parameters<Page['goto']>[1]) {
  const response = await page.goto(url, options);
  const enter = page.getByRole('button', {name: 'ENTER CLIPT', exact: true});
  await expect.poll(async () =>
    await page.locator('.clipt-launch').count() > 0 ||
    await page.locator('.app-container').count() > 0
  ).toBe(true);
  if (await page.locator('.clipt-launch').count()) await enter.click();
  return response;
}
