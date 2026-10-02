// Folds messages/drafts/*.json ({ namespace: { es, en, pt } }) into messages/{locale}.json.
// Usage: node scripts/merge-message-drafts.mjs [--delete]
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const locales = ['es', 'en', 'pt'];
const draftsDir = path.join(root, 'messages', 'drafts');

let files = [];
try {
  files = (await readdir(draftsDir)).filter((f) => f.endsWith('.json')).sort();
} catch {
  console.log('No drafts to merge.');
  process.exit(0);
}

const merged = {};
for (const locale of locales) {
  merged[locale] = JSON.parse(await readFile(path.join(root, 'messages', `${locale}.json`), 'utf8'));
}

for (const file of files) {
  const draft = JSON.parse(await readFile(path.join(draftsDir, file), 'utf8'));
  for (const [ns, perLocale] of Object.entries(draft)) {
    for (const locale of locales) {
      if (!perLocale[locale]) throw new Error(`${file}: namespace "${ns}" is missing "${locale}"`);
      merged[locale][ns] = perLocale[locale];
    }
  }
  console.log(`merged ${file}: ${Object.keys(draft).join(', ')}`);
}

for (const locale of locales) {
  await writeFile(path.join(root, 'messages', `${locale}.json`), JSON.stringify(merged[locale], null, 2) + '\n');
}

if (process.argv.includes('--delete')) {
  await rm(draftsDir, { recursive: true, force: true });
  console.log('drafts removed');
}
