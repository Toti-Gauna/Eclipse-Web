// Baseline capture: forces content-visibility sections to render (html.cv-off, as the site does
// for #hash jumps), walks the page so once-only entrances fire, then takes a full-page shot.
import { createRequire } from 'node:module';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const [url, out, widthsArg = '360,1440', reducedArg = ''] = process.argv.slice(2);
const reduced = reducedArg === 'reduced';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const width of widthsArg.split(',').map(Number)) {
  const height = width < 768 ? 780 : 900;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: width < 768, hasTouch: width < 768 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2600);
  await page.evaluate(() => document.documentElement.classList.add('cv-off'));
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(height * 0.6)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(260);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const file = `${out}/${reduced ? 'reduced' : 'normal'}-${width}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file, 'overflowX=' + overflow, errors.length ? 'pageerrors=' + errors.length : '');
  await ctx.close();
}
await browser.close();
