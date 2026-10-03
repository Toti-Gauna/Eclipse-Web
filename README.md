# Eclipse — landing (mockup v1)

Landing de **Eclipse**, estudio de desarrollo, IA y automatización. Venta *demo-first*: antes de hablar, le mostramos al
cliente su negocio funcionando. Un solo objetivo de conversión: que el visitante **pida su demo** o **arme su plan** y
nos escriba por WhatsApp.

- **Stack:** Next.js 16 (App Router, export estático) · TypeScript · Tailwind CSS v4 · next-intl (es / en / pt-BR) ·
  GSAP + ScrollTrigger · OGL (solo la corona del eclipse, con fallback CSS) · Lucide · Vitest.
- **Deploy:** GitHub Pages en `https://toti-gauna.github.io/Eclipse-Web/` (automático en cada push a `main`).
- Todo el contenido comercial vive en **`/content/*.json`** y todo el copy de la UI en **`/messages/*.json`**.

---

## Cómo correrlo

Requisitos: Node ≥ 20.9 (CI usa Node 22).

```bash
npm ci
cp .env.example .env.local   # opcional: en local podés dejar NEXT_PUBLIC_BASE_PATH vacío
npm run dev                  # http://localhost:3000/es/  (o /Eclipse-Web/es/ si definiste el basePath)
npm test                     # Vitest: precios, monedas, mensajes de WhatsApp, contenido e i18n
npm run typecheck            # tsc --noEmit
npm run lint                 # ESLint
npm run build                # export estático → out/
npm run start                # sirve out/ en local
```

> `npm run dev` sin `.env.local` usa basePath vacío. Para probar exactamente lo que se publica en Pages:
> `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web npm run build` y serví `out/` bajo `/Eclipse-Web`.

### Variables de entorno

| Variable | Para qué | Valor en Pages |
|---|---|---|
| `NEXT_PUBLIC_WHATSAPP` | Número de WhatsApp en formato internacional, sin `+` | placeholder `5492230000000` |
| `NEXT_PUBLIC_EMAIL` | Email de contacto | placeholder `hola@eclipse.example` |
| `NEXT_PUBLIC_SITE_URL` | URL pública (canonical, hreflang, OG, JSON-LD) | `https://toti-gauna.github.io/Eclipse-Web` |
| `NEXT_PUBLIC_BASE_PATH` | Prefijo de rutas y assets | `/Eclipse-Web` (vacío en dominio propio) |

---

## Estructura

```
app/
  layout.tsx              # pass-through (el documento real está en [locale]/layout.tsx)
  page.tsx                # raíz: detecta el idioma del navegador y redirige a /es, /en o /pt (sin JS → /es)
  not-found.tsx           # 404.html para GitHub Pages
  [locale]/layout.tsx     # <html>, fuentes, metadata/hreflang, providers, loader, header y footer
  [locale]/page.tsx       # la landing
  [locale]/plan/page.tsx  # "Armá tu plan" como página compartible (?items=…&m=…)
components/
  loader/  hero/  demos/  sections/  pricing/  plan-builder/  trailers/
  layout/  (header, footer, selectores)   motion/ (GSAP, Reveal, CountUp…)   ui/   providers/
content/                  # JSON comerciales (ver abajo)
messages/                 # copy de la UI: es.json, en.json, pt.json
lib/
  pricing.ts  currency.ts  plan-message.ts  plan-url.ts  whatsapp.ts  analytics.ts  content.ts  env.ts  seo.ts
tests/                    # Vitest
scripts/                  # generate-og.mjs, merge-message-drafts.mjs, shot.mjs (QA), dev.sh
```

---

## Editar precios, rubros, fundadores y ofertas (sin tocar componentes)

Todos los precios están en **USD**. ARS y BRL se calculan en el navegador con la cotización del día.
Cada texto visible tiene versión `es`, `en` y `pt`. `npm test` valida referencias, rangos y traducciones: corrélo
después de editar.

| Archivo | Qué contiene |
|---|---|
| `content/plans.json` | Los 7 planes: `priceUsd.from/to`, `items` (ids de `items.json`, se usan para detectar el plan en el generador y para la línea "Por separado → ahorrás"), `maintenance` sugerido, nombre, para quién es, incluidos. `featured` = el plan "Más elegido". |
| `content/items.json` | Catálogo individual de "Armá tu plan" (precio, categoría, ícono Lucide, nombre, descripción). |
| `content/addons.json` | Botones "+ Sumar" de las cards. Si el plan ya incluye el `itemId`, el add-on se muestra como "Incluido" (`whenIncluded: show`) o se oculta (`hide`). `offer` lo conecta con el combo de voz. |
| `content/maintenance.json` | Planes mensuales, uso del agente de voz (49 + minutos) y `annualMonthsCharged` (10 = 2 meses gratis). |
| `content/offers.json` | Ofertas reales. `active` las prende/apaga; `endsAt` (ISO, opcional) muestra un contador y las apaga sola. |
| `content/verticals.json` | Rubros: negocio ficticio, dolor, número clave y valores por defecto de la calculadora. |
| `content/founders.json` | Slots de clientes fundadores (ver abajo). |
| `content/units.json` | Unidades de Eclipse (Agency activa; Media y Market "Próximamente"). |
| `content/rates.fallback.json` | Cotizaciones de respaldo si fallan las APIs. |

### Reglas de precio (en `lib/pricing.ts`, con tests)

- **Precio de la card** = "desde" del plan + add-ons sumados; el rango "desde–hasta" se muestra en chico.
- **"Por separado: X → ahorrás ≈ Y%"**: suma de los ítems del plan a precio de catálogo vs. el "desde" del plan. Solo se
  muestra en combos (2+ ítems) con un ahorro real (≥ 5%).
- **Combo voz**: el agente de voz cuesta USD 300 en Sistema, Comercio y Plataforma, o en "Armá tu plan" cuando el resto
  de la selección (sin contar el propio agente) llega a USD 1.000. Medirlo sin el agente evita que el descuento haga bajar
  el total de 1.000 y se anule a sí mismo.
- **Precio fundador**: −20% sobre el total único, opcional ("Quiero precio fundador"), solo mientras queden slots.
- **Mantenimiento anual**: precio × 10 (2 meses gratis). El fijo del agente de voz (USD 49/mes + minutos) sigue siendo mensual.
- **Nunca** se muestran precios tachados ni "antes $X".

### Fundadores

`content/founders.json` arranca con 5 slots vacíos. Para sumar un fundador, completá su slot:

```json
{
  "id": "fundador-1",
  "filled": true,
  "name": "Nombre real del negocio",
  "vertical": "clinicas",
  "result": { "es": "…", "en": "…", "pt": "…" },
  "logo": "/founders/logo.svg",
  "caseUrl": "https://…"
}
```

El logo va en `public/founders/`. Con los 5 llenos, la sección pasa a llamarse "Clientes", desaparece el contador y se
apaga sola la oferta de precio fundador.

### Agregar una unidad nueva

En `content/units.json` agregá `{ "id": "nueva", "name": "Eclipse Nueva", "status": "comingSoon", "href": null, "tagline": null }`.
Aparece en gris y sin link en el footer. Para activarla: `"status": "active"`, `"href"` con su URL y un `tagline` en los 3
idiomas.

### Copy e idiomas

El texto de la UI está en `messages/{es,en,pt}.json`. Las tres versiones tienen que tener las mismas claves (lo valida
`npm test`). Para resaltar una palabra en itálica ámbar en un título usá `<em>…</em>` dentro del mensaje.

---

## Monedas

- **ARS**: dólar MEP de `dolarapi.com/v1/dolares/bolsa` (campo `venta`). **BRL**: `api.frankfurter.app`.
- Fetch en el navegador con timeout de 3 s y cache en memoria; si falla, `content/rates.fallback.json`.
- Redondeo: ARS al 1.000, BRL al 10, USD entero. ARS y BRL llevan "≈".
- Moneda por defecto según idioma (es→ARS, pt→BRL, en→USD); el selector es independiente y se recuerda en
  `localStorage` (si el navegador lo bloquea, funciona igual).

---

## Deploy automático a GitHub Pages

`.github/workflows/deploy.yml` corre en cada push a `main`: `npm ci` → `npm test` → `npm run build` → publica `out/`
con `actions/upload-pages-artifact` + `actions/deploy-pages`.

Una sola vez, en el repo:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. (Opcional) **Settings → Secrets and variables → Actions → Variables**: `NEXT_PUBLIC_WHATSAPP` y `NEXT_PUBLIC_EMAIL`
   con los datos reales (el workflow usa placeholders si no existen).

El basePath `/Eclipse-Web` está fijado en el workflow (`NEXT_PUBLIC_BASE_PATH`). `public/.nojekyll` evita que Pages
ignore la carpeta `_next/`.

## Migrar a Hostinger con Cloudflare adelante

1. Build sin basePath y con la URL final:
   ```bash
   NEXT_PUBLIC_BASE_PATH= NEXT_PUBLIC_SITE_URL=https://tudominio.com \
   NEXT_PUBLIC_WHATSAPP=549XXXXXXXXXX NEXT_PUBLIC_EMAIL=hola@tudominio.com npm run build
   ```
2. Subí el **contenido** de `out/` a `public_html/` (File Manager o FTP). No hace falta código de servidor.
3. En Cloudflare: el dominio con proxy (nube naranja), SSL/TLS en **Full (strict)**, *Always Use HTTPS* activado.
   Recomendado: una Cache Rule que cachee `/_next/static/*` por 1 año (los nombres llevan hash) y HTML con TTL corto.
4. `404.html` ya está en la raíz del export. Para que Hostinger lo use, en `public_html/.htaccess`:
   `ErrorDocument 404 /404.html`.
5. Si el deploy pasa a ser por CI, cambiá el último paso del workflow por un upload (FTP/SSH) de `out/`.

No hay que tocar código: todas las rutas internas, la redirección de idioma, las fuentes y las imágenes OG salen de
`NEXT_PUBLIC_BASE_PATH` y `NEXT_PUBLIC_SITE_URL`.

---

## Analítica

`lib/analytics.ts` expone `track(event, props)`. Hoy hace `console.debug` (en desarrollo o con `?debug-analytics`) y
ya reenvía a `window.plausible` o `window.gtag` si cargás alguno de esos scripts. Eventos: `vertical_selected`,
`demo_opened`, `trailer_played`, `calculator_used`, `plan_cta_clicked`, `builder_opened`, `builder_item_toggled`,
`builder_sent`, `founder_cta_clicked`, `whatsapp_opened` (con `origin`), `locale_changed`, `currency_changed`.

---

## Decisiones técnicas

- **Loader 100% CSS** (anillo, destello, letras e iris con una máscara animada vía `@property`): corre antes de que
  cargue el JS, dura ≤ 1,45 s, solo en la primera visita de la sesión y nunca tapa el LCP (el H1 se pinta debajo desde
  el primer frame). Reduced motion: fade de 300 ms.
- **OGL en lugar de Three.js** para la corona: ~10 veces más liviano. Se carga con `import()` solo con WebGL,
  `hardwareConcurrency > 4`, sin `prefers-reduced-motion` ni ahorro de datos; si no, queda la corona CSS.
- **Demos navegables reales** (React, no imágenes) dentro de `DeviceFrame`; cada demo se descarga recién cuando se va a
  mostrar.
- **Sin middleware** (export estático): la raíz `/` detecta `navigator.language` y redirige con JS.
- **Fuentes locales** (Instrument Serif + Geist recortada a latín) con `next/font/local`.
