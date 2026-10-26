import { createRequire } from 'node:module';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const id of ['servicios', 'ejemplos', 'precios', 'proceso', 'contacto']) for (const [side, port] of [['base', 4001], ['cand', 4000]]) for (const [w, h, mob] of [[1440, 900, false], [390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/Eclipse-Web/es/#${id}`, { waitUntil: 'domcontentloaded' });
  const tops = [];
  for (const t of [1500, 3500, 7000]) { await page.waitForTimeout(t - (tops.length ? [1500, 3500, 7000][tops.length - 1] : 0)); tops.push(Math.round(await page.evaluate((i) => document.getElementById(i)?.getBoundingClientRect().top ?? 9999, id))); }
  console.log(id.padEnd(9), side, String(w).padEnd(5), 'top px at 1.5/3.5/7 s:', tops.join(' / '));
  await ctx.close();
}
await browser.close();
