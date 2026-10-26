import { createRequire } from 'node:module';
const require = createRequire('/home/user/Eclipse-Web/package.json');
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [side, port, kind] of [['base', 4001, 'demo'], ['cand', 4000, 'demo'], ['cand', 4000, 'selector']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/Eclipse-Web/es/`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3500);
  const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable');
  const snap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await page.waitForTimeout(300); const m = await cdp.send('Performance.getMetrics'); const g = (n) => m.metrics.find((x) => x.name === n)?.value; return { nodes: g('Nodes'), attached: await page.evaluate(() => document.getElementsByTagName('*').length), listeners: g('JSEventListeners'), heapKB: Math.round(g('JSHeapUsedSize') / 1024) }; };
  const cycle = async () => {
    if (side === 'base') { await page.locator('[data-hero-chip="inmobiliarias"]').click(); await page.locator('dialog[data-demo-layer][open]').first().waitFor(); await page.waitForTimeout(3300); await page.keyboard.press('Escape'); await page.waitForTimeout(2700); }
    else { await page.locator('[data-hero-cta] a').click(); await page.locator('dialog[data-selector-layer][open]').first().waitFor(); await page.waitForTimeout(450); if (kind === 'demo') { await page.locator('[data-sx-row="inmobiliarias"]').click(); await page.locator('dialog[data-demo-layer][open]').first().waitFor(); await page.waitForTimeout(3300); await page.keyboard.press('Escape'); await page.waitForTimeout(2700); } else { await page.keyboard.press('Escape'); await page.waitForTimeout(500); } }
  };
  await cycle(); // warm-up
  const s = [await snap()];
  for (let i = 0; i < 5; i++) { await cycle(); s.push(await snap()); }
  console.log(`${side}/${kind}`.padEnd(14), 'nodes', s.map((x) => x.nodes).join('→'), '| attached', s.map((x) => x.attached).join('→'), '| listeners', s.map((x) => x.listeners).join('→'), '| heapKB', s.map((x) => x.heapKB).join('→'));
  await ctx.close();
}
await browser.close();
