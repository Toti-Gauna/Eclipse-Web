import type { Locale } from './routing';

type Messages = Record<string, unknown>;

/**
 * UI copy lives in /messages/{locale}.json.
 * In development only, /messages/drafts/*.json files ({ namespace: { es, en, pt } })
 * are overlaid on top so parallel work can add namespaces without touching the
 * shared files. `npm run i18n:merge` folds drafts into the locale files.
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  const base = (await import(`../messages/${locale}.json`)).default as Messages;
  if (process.env.NODE_ENV !== 'development') return base;
  return { ...base, ...(await loadDrafts(locale)) };
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
        if (perLocale && perLocale[locale]) out[ns] = perLocale[locale];
      }
    } catch (error) {
      console.error(`[i18n] invalid draft ${file}:`, error);
    }
  }
  return out;
}
