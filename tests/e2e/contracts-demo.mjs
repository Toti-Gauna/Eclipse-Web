import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const base = process.env.BASE_URL ?? 'http://localhost:3001';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const shots = 'test-results/contracts-demo';
mkdirSync(shots, { recursive: true });
let checks = 0;
const errors = [];
try {
  for (const locale of ['es', 'en', 'pt'])
    for (const width of [360, 768, 1440]) {
      console.log(`Checking ${locale} ${width}`);
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${base}/${locale}/portal/bienvenida/`);
      await page.locator('.ct-readable').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      checks++;
      assert.equal(await page.locator('.ct-consents input:checked').count(), 0);
      checks++;
      const action = page.locator('.ct-consents button');
      assert.equal(await action.isEnabled(), false);
      await page.locator('.ct-consents input').first().check();
      assert.equal(await action.isEnabled(), true);
      checks++;
      await action.click();
      assert.ok(await page.getByRole('status').last().textContent());
      checks++;
      await page.locator('.ct-readable').focus();
      assert.equal(await page.locator('.ct-readable').evaluate((e) => document.activeElement === e), true);
      checks++;
      if (locale === 'es' && (width === 360 || width === 1440))
        await page.screenshot({ path: `${shots}/welcome-${width}.png`, fullPage: true });
      await page.goto(`${base}/${locale}/plan/?plan=volta&items=landing-extra,whatsapp-extra&m=esencial`);
      await page.locator('.pb-dock').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      checks++;
      if (locale === 'es' && width === 360) await page.screenshot({ path: `${shots}/builder-360.png`, fullPage: true });
      await page.close();
    }
  assert.deepEqual(errors, []);
  checks++;
  console.log(
    `PASS ${checks} browser checks: demo welcome/document, no preselected consent, keyboard focus, all locales at 360/768/1440, builder overflow, reduced motion, no runtime errors. Screenshots: ${shots}`,
  );
} finally {
  await browser.close();
}
