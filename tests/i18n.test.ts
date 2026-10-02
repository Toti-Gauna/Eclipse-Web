import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const LOCALES = ['es', 'en', 'pt'] as const;

type Tree = { [key: string]: string | Tree };

function load(locale: string): Tree {
  const base = JSON.parse(readFileSync(path.join(root, 'messages', `${locale}.json`), 'utf8')) as Tree;
  // Drafts only exist during development; they're folded in by `npm run i18n:merge`.
  const draftsDir = path.join(root, 'messages', 'drafts');
  if (existsSync(draftsDir)) {
    for (const file of readdirSync(draftsDir).filter((f) => f.endsWith('.json'))) {
      const draft = JSON.parse(readFileSync(path.join(draftsDir, file), 'utf8')) as Record<string, Record<string, Tree>>;
      for (const [ns, perLocale] of Object.entries(draft)) base[ns] = perLocale[locale];
    }
  }
  return base;
}

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(tree ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.set(key, v);
    else for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
  }
  return out;
}

/** ICU placeholders and rich-text tags used in a message, e.g. {count} or <em>. */
function tokens(message: string): string[] {
  const vars = [...message.matchAll(/\{\s*(\w+)/g)].map((m) => `{${m[1]}}`);
  const tags = [...message.matchAll(/<\/?(\w+)>/g)].map((m) => `<${m[1]}>`);
  return [...new Set([...vars, ...tags])].sort();
}

describe('i18n messages', () => {
  const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l))])) as Record<string, Map<string, string>>;

  it('every locale has exactly the same keys', () => {
    const es = [...flat.es.keys()].sort();
    for (const l of ['en', 'pt']) {
      const keys = [...flat[l].keys()].sort();
      expect(keys.filter((k) => !flat.es.has(k)), `${l} has extra keys`).toEqual([]);
      expect(es.filter((k) => !flat[l].has(k)), `${l} is missing keys`).toEqual([]);
    }
  });

  it('no empty messages', () => {
    for (const l of LOCALES) {
      const empty = [...flat[l].entries()].filter(([, v]) => !v.trim()).map(([k]) => k);
      expect(empty, l).toEqual([]);
    }
  });

  it('placeholders and tags match across locales', () => {
    for (const [key, es] of flat.es) {
      for (const l of ['en', 'pt']) {
        const other = flat[l].get(key);
        if (other === undefined) continue;
        expect(tokens(other), `${l}:${key}`).toEqual(tokens(es));
      }
    }
  });
});
