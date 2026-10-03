// Folds messages/drafts/*.json ({ namespace: { es, en, pt } }) into messages/{locale}.json.
// Usage: node scripts/merge-message-drafts.mjs [--delete] [draft.json ...]
//   no file names → every draft; --delete removes the merged drafts afterwards.
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const locales = ['es', 'en', 'pt'];
const draftsDir = path.join(root, 'messages', 'drafts');

const only = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((f) => path.basename(f));
let files = [];
try {
  files = (await readdir(draftsDir)).filter((f) => f.endsWith('.json') && (!only.length || only.includes(f))).sort();
} catch {
  console.log('No drafts to merge.');
  process.exit(0);
}

const merged = {};
for (const locale of locales) {
  merged[locale] = JSON.parse(await readFile(path.join(root, 'messages', `${locale}.json`), 'utf8'));
}

// Same rules as i18n/messages.ts: objects merge key by key, `null` deletes, the rest replaces.
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
function deepMerge(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete target[key];
    else if (isObject(value) && isObject(target[key])) deepMerge(target[key], value);
    else target[key] = value;
  }
  return target;
}

for (const file of files) {
  const draft = JSON.parse(await readFile(path.join(draftsDir, file), 'utf8'));
  for (const [ns, perLocale] of Object.entries(draft)) {
    for (const locale of locales) {
      if (!perLocale[locale]) throw new Error(`${file}: namespace "${ns}" is missing "${locale}"`);
      deepMerge(merged[locale], { [ns]: perLocale[locale] });
    }
  }
  console.log(`merged ${file}: ${Object.keys(draft).join(', ')}`);
}

for (const locale of locales) {
  await writeFile(path.join(root, 'messages', `${locale}.json`), JSON.stringify(merged[locale], null, 2) + '\n');
}

if (process.argv.includes('--delete')) {
  for (const file of files) await rm(path.join(draftsDir, file));
  if (!(await readdir(draftsDir)).length) await rm(draftsDir, { recursive: true, force: true });
  console.log(`removed ${files.join(', ')}`);
}
