import type { Locale } from './routing';

type Messages = Record<string, unknown>;

/**
 * UI copy lives in /messages/{locale}.json.
 * In development only, /messages/drafts/*.json files ({ namespace: { es, en, pt } })
 * are deep-merged on top so parallel work can add or change keys without touching the
 * shared files: objects merge key by key, any other value replaces, and `null` deletes
 * the key. `npm run i18n:merge` folds drafts into the locale files with the same rules.
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  const base = (await import(`../messages/${locale}.json`)).default as Messages;
  if (process.env.NODE_ENV !== 'development') return base;
  return deepMerge(structuredClone(base), await loadDrafts(locale));
}

const isObject = (v: unknown): v is Messages => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Merges `patch` into `target` (mutates it): objects recurse, `null` deletes, the rest replaces. */
export function deepMerge(target: Messages, patch: Messages): Messages {
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete target[key];
    else if (isObject(value) && isObject(target[key])) deepMerge(target[key], value);
    else target[key] = value;
  }
  return target;
}

async function loadDrafts(locale: Locale): Promise<Messages> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const dir = path.join(process.cwd(), 'messages', 'drafts');
  let files: string[] = [];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return {};
  }
  const out: Messages = {};
  for (const file of files) {
    try {
      const raw = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8')) as Record<
        string,
        Record<string, unknown>
      >;
      for (const [ns, perLocale] of Object.entries(raw)) {
        if (perLocale && perLocale[locale]) deepMerge(out, { [ns]: perLocale[locale] });
      }
    } catch (error) {
      console.error(`[i18n] invalid draft ${file}:`, error);
    }
  }
  return out;
}
