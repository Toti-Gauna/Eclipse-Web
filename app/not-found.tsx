import './globals.css';
import { fontMono, fontSans, fontSerif } from './fonts';
import { routing, localeTags } from '@/i18n/routing';
import { BASE_PATH } from '@/lib/env';
import es from '@/messages/es.json';
import en from '@/messages/en.json';
import pt from '@/messages/pt.json';

const messages = { es, en, pt };

// Served by GitHub Pages as /404.html for any unknown path. We cannot know the
// locale here, so it shows all three.
export default function NotFound() {
  return (
    <html lang="es" className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}>
      <head>
        {/* No metadata pipeline here (own <html>): without it the 404 had no document title. */}
        <title>{`${messages.es.meta.notFoundTitle} — Eclipse`}</title>
      </head>
      <body className="theme-dark grain grid min-h-dvh place-items-center bg-void">
        <main className="container-x py-24 text-center">
          <div aria-hidden className="mx-auto mb-10 size-24 rounded-full bg-void shadow-[0_0_0_2px_var(--corona),0_0_60px_10px_rgb(245_185_66/0.35)]" />
          <ul className="space-y-10">
            {routing.locales.map((l) => (
              <li key={l} lang={localeTags[l]}>
                <h1 className="display text-4xl md:text-5xl">{messages[l].meta.notFoundTitle}</h1>
                <p className="mt-3 text-fg-muted">{messages[l].meta.notFoundBody}</p>
                <a className="btn btn-ghost btn-sm mt-5" href={`${BASE_PATH}/${l}/`}>
                  {messages[l].meta.notFoundCta}
                </a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
