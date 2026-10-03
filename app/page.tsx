import type { Metadata } from 'next';
import { routing, localeTags } from '@/i18n/routing';
import { BASE_PATH, absoluteUrl } from '@/lib/env';
import es from '@/messages/es.json';
import en from '@/messages/en.json';
import pt from '@/messages/pt.json';

const titles = { es: es.meta.title, en: en.meta.title, pt: pt.meta.title };
const languageNames = { es: es.languages.es, en: en.languages.en, pt: pt.languages.pt };
// The visitor's language is still unknown here: name the nav in all three.
const navLabel = [es.header.language, en.header.language, pt.header.language].join(' · ');

export const metadata: Metadata = {
  title: es.meta.title,
  description: es.meta.description,
  alternates: {
    canonical: absoluteUrl('/'),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [localeTags[l], absoluteUrl(`/${l}/`)])),
      'x-default': absoluteUrl('/'),
    },
  },
};

// Static export has no middleware: detect the browser language on the client and
// redirect to /es/, /en/ or /pt/. A language chosen before (localStorage) wins.
// Without JS, <noscript> sends visitors to /es/.
const redirectScript = `(function(){try{
var base=${JSON.stringify(BASE_PATH)},supported=${JSON.stringify(routing.locales)},pick=null;
try{var saved=localStorage.getItem('eclipse:locale');if(supported.indexOf(saved)>-1)pick=saved;}catch(e){}
if(!pick){var langs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'es']);
for(var i=0;i<langs.length&&!pick;i++){var c=String(langs[i]).slice(0,2).toLowerCase();if(supported.indexOf(c)>-1)pick=c;}}
if(!pick)pick='en';
location.replace(base+'/'+pick+'/'+location.search+location.hash);
}catch(e){location.replace(${JSON.stringify(`${BASE_PATH}/es/`)});}})();`;

export default function RootRedirectPage() {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
        <noscript>
          <meta httpEquiv="refresh" content={`0; url=${BASE_PATH}/es/`} />
        </noscript>
        <meta name="theme-color" content="#05050A" />
      </head>
      <body style={{ margin: 0, minHeight: '100vh', background: '#05050A', color: '#F4EFE6', fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center' }}>
        <nav aria-label={navLabel} style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', padding: 16 }}>
          {routing.locales.map((l) => (
            <a key={l} href={`${BASE_PATH}/${l}/`} hrefLang={localeTags[l]} lang={localeTags[l]} title={titles[l]} style={{ color: '#F5B942', padding: 12 }}>
              {languageNames[l]}
            </a>
          ))}
        </nav>
      </body>
    </html>
  );
}
