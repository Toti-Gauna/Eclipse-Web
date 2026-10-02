// Screenshot helper for local QA (not part of the build).
// Usage:
//   node scripts/shot.mjs <url> <outDir> [--widths=360,1440] [--full] [--wait=1500]
//        [--scroll=0,800,2000] [--click=<css selector>] [--reduced] [--name=prefix] [--walk]
// Prints the PNG paths and any console errors / page errors.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const [url, outDir = '.lab-shots'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}`));
  if (!hit) return fallback;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};
if (!url) {
  console.error('usage: node scripts/shot.mjs <url> <outDir> [--widths=360,1440] [--full] [--scroll=0,900] [--click=sel] [--reduced]');
  process.exit(1);
}
const widths = String(flag('widths', '360,1440')).split(',').map(Number);
const scrolls = String(flag('scroll', '0')).split(',').map(Number);
const wait = Number(flag('wait', 1500));
const full = !!flag('full', false);
const click = flag('click', null);
const reduced = !!flag('reduced', false);
const name = flag('name', 'shot');
const walk = !!flag('walk', false); // scroll through the whole page first so ScrollTrigger reveals fire
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const width of widths) {
  const height = width < 768 ? 780 : 900;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
  if (click) {
    await page.locator(String(click)).first().click();
    await page.waitForTimeout(wait);
  }
  if (walk) {
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 500) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(600);
  }
  for (const y of scrolls) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(Math.min(wait, 900));
    const file = path.join(outDir, `${name}-${width}-y${y}.png`);
    await page.screenshot({ path: file, fullPage: full });
    console.log(file);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) console.log(`WARNING horizontal overflow at ${width}px: ${overflow}px`);
  if (errors.length) console.log(errors.join('\n'));
  await context.close();
}
await browser.close();
