// Renders the Open Graph images (1200×630): the eclipse + "ECLIPSE" + the hero line,
// one per locale (public/og-es.jpg, og-en.jpg, og-pt.jpg). Usage: node scripts/generate-og.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const font = (f) => readFileSync(path.join(root, 'app/fonts', f)).toString('base64');

const COPY = {
  es: { line: 'Antes de hablar,<br>te mostramos <em>tu negocio</em> funcionando.', tag: 'Desarrollo · IA · Automatización' },
  en: { line: 'Before we talk,<br>we show you <em>your business</em> already working.', tag: 'Development · AI · Automation' },
  pt: { line: 'Antes de conversar,<br>mostramos <em>o seu negócio</em> funcionando.', tag: 'Desenvolvimento · IA · Automação' },
};

const html = ({ line, tag }) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url(data:font/woff2;base64,${font('Geist-Variable.woff2')}) format('woff2');font-weight:100 900}
@font-face{font-family:Serif;src:url(data:font/woff2;base64,${font('InstrumentSerif-Regular.woff2')}) format('woff2')}
@font-face{font-family:Serif;font-style:italic;src:url(data:font/woff2;base64,${font('InstrumentSerif-Italic.woff2')}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#05050A;overflow:hidden;position:relative;font-family:Geist}
.noise{position:absolute;inset:0;opacity:.08;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.sky{position:absolute;inset:0;background:radial-gradient(800px 500px at 74% 50%,rgba(245,185,66,.10),transparent 70%)}
.e{position:absolute;width:560px;height:560px;left:720px;top:35px}
.l{position:absolute;inset:0;border-radius:50%}
.glow{inset:-14%;background:radial-gradient(closest-side,rgba(245,185,66,.34) 34%,rgba(245,185,66,.12) 52%,rgba(245,185,66,.04) 72%,transparent)}
.rays{-webkit-mask-image:radial-gradient(closest-side,transparent 38%,#000 42%,rgba(0,0,0,.6) 62%,transparent);filter:blur(1.5px)}
.r1{background:repeating-conic-gradient(from 0deg,rgba(255,232,176,0) 0 3deg,rgba(255,232,176,.55) 5deg,rgba(255,232,176,0) 8deg 13deg,rgba(245,185,66,.35) 15deg,rgba(255,232,176,0) 18deg 24deg)}
.r2{background:repeating-conic-gradient(from 7deg,rgba(245,185,66,0) 0 6deg,rgba(245,185,66,.4) 8deg,rgba(245,185,66,0) 11deg 19deg);opacity:.8}
.inner{inset:calc(29% - 7%);background:radial-gradient(closest-side,#fff8e6 74%,rgba(255,232,176,.95) 79%,rgba(245,185,66,.55) 86%,rgba(245,185,66,.15) 94%,transparent)}
.moon{inset:calc(29% - .4%);background:radial-gradient(circle at 38% 34%,#0d0d16,#050509 60%,#020204)}
.diamond{position:absolute;left:calc(35.2% - 9px);top:calc(64.8% - 9px);width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 0 30px 12px rgba(255,248,230,.9),0 0 90px 30px rgba(245,185,66,.5)}
.flare{position:absolute;left:calc(35.2% - 150px);top:calc(64.8% - 1px);width:300px;height:2px;background:linear-gradient(90deg,transparent,rgba(255,248,230,.9),transparent)}
.copy{position:absolute;left:84px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:28px;color:#F4EFE6}
.word{display:flex;align-items:center;gap:18px;font-size:30px;font-weight:500;letter-spacing:.42em}
.dot{width:26px;height:26px;border-radius:50%;background:#05050A;box-shadow:0 0 0 2px #F5B942,0 0 22px 6px rgba(245,185,66,.55)}
.line{font-family:Serif;font-size:58px;line-height:1.02;letter-spacing:-.01em;max-width:620px}
.line em{color:#F5B942}
.tag{font-size:17px;letter-spacing:.24em;text-transform:uppercase;color:#9A97A6}
</style></head><body>
<div class="sky"></div>
<div class="e"><div class="l glow"></div><div class="l rays r1"></div><div class="l rays r2"></div><div class="l inner"></div><div class="l moon"></div><div class="flare"></div><div class="diamond"></div></div>
<div class="noise"></div>
<div class="copy"><div class="word"><span class="dot"></span>ECLIPSE</div><div class="line">${line}</div><div class="tag">${tag}</div></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [locale, copy] of Object.entries(COPY)) {
  await page.setContent(html(copy), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(root, `public/og-${locale}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
  console.log(`${file} written`);
}
await browser.close();
