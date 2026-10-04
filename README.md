# Eclipse — landing + portal de clientes (mockup v3)

Landing de **Eclipse**, estudio de desarrollo, IA y automatización. Venta *demo-first*: antes de hablar, le mostramos al
cliente su negocio funcionando. Un solo objetivo de conversión: que el visitante **pida su demo** o **arme su plan** y
nos escriba por WhatsApp.

- **Stack:** Next.js 16 (App Router, export estático) · TypeScript · Tailwind CSS v4 · next-intl (es / en / pt-BR) ·
  GSAP + ScrollTrigger · OGL (solo la corona del eclipse, con fallback CSS) · Lucide · Vitest.
- **Deploy:** GitHub Pages en `https://toti-gauna.github.io/Eclipse-Web/` (automático en cada push a `main`).
- Todo el contenido comercial vive en **`/content/*.json`** y todo el copy de la UI en **`/messages/*.json`**.
- **Portal de clientes (mockup v3):** `/[locale]/portal/` dentro de la misma web, solo frontend y con datos ficticios
  rotulados; no tiene backend, login real ni persistencia (ver [Portal de clientes](#portal-de-clientes-mockup)).

## Qué cambió en la v3 · fase 2 (demos, armador, calculadora y portal)

- **Una sola experiencia de «Ver demo»** (`components/demo-experience/`): clara y cálida, se abre desde el punto del
  clic con el motivo del eclipse, tiene su propio scroll (la página de fondo no se mueve) y «Volver», Escape o Atrás
  devuelven la posición exacta y el foco. Al entrar, «Ver con guía» o «Ver por mi cuenta». Debajo de las vistas, el
  proyecto completo con su precio (`content/verticals.json` → `project`).
- **Demos manuales:** nada se mueve ni suena solo; cada historia avanza con «Simular: …» y termina quieta. Agenda,
  reservas, Kanban (arrastrar y soltar accesible), compras y pedidos funcionan con datos locales. Cada demo tiene su
  propia estructura y una guía de 4–6 pasos.
- **Guía reutilizable** (`components/ui/tour/`): foco iluminado, flecha y card; la usan las demos y el portal.
- **Armador** siempre desde la derecha y con el tema de la sección desde la que se abre.
- **Calculadora** con el rubro como campo editable y la pérdida por mes y por año como protagonistas.
- **Voz y Automatiza** muestran la landing premium incluida como bonus (sin cambiar precios ni mostrar ahorro).
- **Portal:** guía de primera visita (se recuerda solo en este navegador), «Más información» y jerarquía más clara.

## Qué cambió en la v3

Objetivo: que una persona nueva entienda en ~30 s qué hace Eclipse y encuentre una demo de su rubro, el precio de
entrada, el mantenimiento y el próximo paso en menos de 2 minutos, **sin borrar contenido** (inventario trazable en
`docs/v3/inventario.md`: lo que dejó de verse en superficie quedó plegado).

- **Header corto:** Servicios · Demos · Precios · Cómo trabajamos · preferencias agrupadas (idioma, moneda y sonido) ·
  «Ingresar» · «Armá tu plan» (secundario) · «Pedí tu demo» (primario). **Un solo botón ámbar sólido por pantalla:**
  el CTA del header pasa a contorno mientras se ve el del hero o el CTA principal de una sección (`data-page-cta`).
  En celular: logo, «Pedí tu demo» y un menú breve con las preferencias plegadas.
- **Hero:** la misma promesa, una explicación, los dos CTA antes de los rubros (atajo opcional) y atajos a Demos,
  Soluciones, Precios y Armar plan. Sin animación decorativa permanente.
- **Orden nuevo** (anclas de v2 sin cambios): demos `#ejemplos` → soluciones `#servicios` (índice de 6 familias, una
  abierta por vez) → precios `#precios` (tabs Paquetes / Pieza por pieza) → calculadora `#problema` (compacta, con «Ver
  la cuenta») → cómo trabajamos `#proceso` (5 etapas desplegables) → fundadores (recibís / te pedimos juntos) →
  preguntas y contacto `#contacto`.
- **Demos sin marcos:** «Escritorio» a la izquierda y «Celular» a la derecha, independientes y sin superponerse; en
  pantallas angostas, tabs con tamaños legibles. Solo se carga la demo activa.
- **Armador:** progreso y total siempre visibles, categorías plegables, precargas explicadas y un resumen que es una
  *solicitud de propuesta*, no una cotización.
- **Rendimiento medido** antes/después en el motivo del eclipse y el scroll (`docs/v3/rendimiento.md`).
- **Portal de clientes mockup** (ver abajo).

## Qué cambió en la v2

- **Dirección de arte "Efemérides"** (detalle en `CLAUDE.md`): la página es un observatorio y el lenguaje es el de un
  instrumento: rótulos en Geist Mono, líneas finas, marcas de registro, glifos de fases del eclipse
  (`<PhaseGlyph>`), secciones numeradas 01–08 y un riel de índice en escritorio. Cada sección tiene su propia
  composición (dial de instrumento en el hero, sala de demos, fases del proceso, constelación de fundadores, amanecer).
- **Sonido y música** (`lib/sound/`, `components/sound/`): efectos y música ambiente generativa sintetizados con Web
  Audio, sin archivos. Apagados por defecto; el visitante los prende desde el header o el panel de preferencias.
- **Loader**: la escena final de los trailers (luna → corona → anillo de diamante → ECLIPSE) en cada carga, solo CSS,
  1,78 s y salteable con cualquier clic o tecla.
- **Idioma y moneda con contexto**: un panel con nombres nativos, la cotización usada, su fuente y si es en vivo o
  estimada.
- **Precios claros**: cómo se paga (proyecto pago único · mantenimiento mensual opcional · extras), *Paquetes* vs.
  *Pieza por pieza*, un solo switch mensual/anual (en mantenimiento) y el mismo nombre ("paquete") en el WhatsApp.
- **Calculadora en forma de frase** con botones −/+ y **armador guiado** en 4 pasos (Objetivo → Piezas →
  Mantenimiento → Resumen).
- **Demos v2** sobre un kit propio (`components/demos/kit`, guía en `components/demos/README.md`): sidebar
  colapsable, chatbots, agentes de voz, gamificación, sitios públicos y paneles, cada demo con su marca y paleta.
  Rubros: clínica, inmobiliaria, gimnasio, **tienda online**, **restaurante** y **academias y cursos** (plataforma propia).

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
npm run test:e2e             # 54 chequeos e2e con Playwright sobre el export (ver abajo)
```

### Prueba e2e del export

`tests/e2e/smoke.mjs` recorre el sitio exportado tal como lo sirve GitHub Pages: redirección de idioma, loader solo en
la primera visita, overflow a 360 px, hidratación diferida, header claro sobre las secciones `--dawn`, cambio de moneda,
reveal del hero, "Armá tu plan" y su mensaje de WhatsApp, ruta `/plan` desde la URL, foco con teclado, cambio de
idioma, reduced motion, 404 y el portal mockup («Ingresar», aviso de demo, formulario que no envía ni guarda nada,
tabla/tarjetas de proyectos, detalle y 404 de un proyecto inexistente).

```bash
NEXT_PUBLIC_BASE_PATH=/Eclipse-Web npm run build
# serví out/ bajo /Eclipse-Web en el puerto 4000 (cualquier servidor estático), y:
BASE_URL=http://localhost:4000/Eclipse-Web npm run test:e2e
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
  [locale]/portal/        # portal de clientes mockup: ingreso demo, proyectos/ y proyectos/[id]/
components/
  loader/  hero/  demos/ (kit/ + una carpeta por demo)  sections/  pricing/  plan-builder/  trailers/
  layout/  (header, footer, panel de idioma y moneda)   motion/ (GSAP, Reveal, CountUp, Occult, DrawLine…)
  sound/ (proveedor, toggle)   ui/ (PhaseGlyph, SectionMark, EphemerisRail…)   providers/
  portal/ (pantallas del portal mockup: ingreso, proyectos, detalle)
content/                  # JSON comerciales (ver abajo)
messages/                 # copy de la UI: es.json, en.json, pt.json
lib/
  pricing.ts  currency.ts  plan-message.ts  plan-url.ts  whatsapp.ts  analytics.ts  content.ts  env.ts  seo.ts
  calculator.ts  sound/ (motor Web Audio + música generativa, se carga recién al prender el sonido)
  portal/ (fixtures ficticios, etapas, rutas y formato del portal mockup)
docs/v3/                  # inventario de contenidos v2 → v3 y mediciones de rendimiento
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
| `content/plans.json` | Los 7 paquetes: `priceUsd.from/to`, `items` (ids de `items.json`, se usan para detectar el paquete en el armador y para el "ahorrás ≈ X% vs. piezas sueltas"), `tier` (`start` = "Para empezar", `complete` = "Sistemas completos"), `maintenance` sugerido, nombre, para quién es, incluidos. `featured` = el paquete "Recomendado". |
| `content/items.json` | Piezas sueltas (precio, categoría, ícono Lucide, nombre, descripción). Las categorías son las 6 familias de la sección Servicios y del armador; sus nombres no repiten los de los paquetes. |
| `content/addons.json` | Extras que se suman a un paquete en el armador. Si el paquete ya incluye el `itemId`, se muestra como "Incluido" (`whenIncluded: show`) o se oculta (`hide`). `offer` lo conecta con el combo de voz. |
| `content/maintenance.json` | Planes mensuales, uso del agente de voz (49 + minutos) y `annualMonthsCharged` (10 = 2 meses gratis). |
| `content/offers.json` | Ofertas reales. `active` las prende/apaga; `endsAt` (ISO, opcional) muestra un contador y las apaga sola. |
| `content/verticals.json` | Rubros (7: clínicas, inmobiliarias, gimnasios, tiendas online, restaurantes, academias y cursos, otro): negocio ficticio, demo, dolor, número clave y valores por defecto de la calculadora. Un rubro nuevo con demo necesita además su carpeta en `components/demos/<id>/` (ver `components/demos/README.md`), su trailer en `components/trailers/` y las entradas en los dos `registry.ts`. |
| `content/founders.json` | Slots de clientes fundadores (ver abajo). |
| `content/units.json` | Unidades de Eclipse (Agency activa; Media y Market "Próximamente"). |
| `content/rates.fallback.json` | Cotizaciones de respaldo si fallan las APIs. |

### Reglas de precio (en `lib/pricing.ts`, con tests)

- **Precio del paquete** = su "desde" (pago único); el rango "desde–hasta" se muestra en chico. Los extras y el
  mantenimiento se suman en el armador.
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

## Portal de clientes (mockup)

Frontend de demostración del portal donde un cliente con proyecto confirmado va a seguir su avance. Vive en la misma
app, con el mismo layout, header, idiomas y moneda, bajo el mismo origen (`/Eclipse-Web/es/portal/…` en Pages).

| Ruta | Pantalla |
|---|---|
| `/[locale]/portal/` | Ingreso de demostración y cómo va a funcionar el acceso (seña + invitación por email) |
| `/[locale]/portal/proyectos/` | Mis proyectos: tabla en escritorio, tarjetas en celular; estados vacío y de carga |
| `/[locale]/portal/proyectos/<id>/` | Detalle: etapa, próximo hito, cronograma, actualizaciones, alcance y cambios, documentos |

- **Todo es ficticio y está rotulado:** badge «Demo» y el aviso «Vista de demostración — datos ficticios; acceso real
  disponible cuando se implemente el backend.» en cada pantalla. Los datos salen de `lib/portal/fixtures.ts`
  (empresa ficticia; del lado de Eclipse solo roles) y el copy de `messages` (namespace `portal`, que se traduce en el
  servidor y no viaja en el payload de la landing).
- **No hay backend:** el formulario de ingreso no tiene `name` ni `action`, no valida, no envía ni guarda nada; las
  acciones del cliente (aprobar, pedir cambios, subir insumos) están deshabilitadas con «Requiere backend»; los
  documentos son solo metadatos. La landing pública nunca exige cuenta.
- Etapas públicas: Preparación · Construcción · Revisión de Eclipse · Revisión del cliente · Entrega (+ Soporte solo con
  mantenimiento contratado, y En pausa / Cerrado con motivo).
- Para hacerlo real (fuera de este mockup): auth mantenida con invitaciones de un solo uso y MFA para el equipo,
  autorización del lado del servidor por organización y proyecto, almacenamiento privado con URLs temporales, emails
  con reintentos y auditoría de cambios de etapa. La especificación está en Notion («Portal de clientes —
  Especificación v3»).

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

- **Loader 100% CSS** con la escena final de los trailers: corre antes de que cargue el JS, en cada carga, dura 1,78 s
  (cualquier clic, toque o tecla lo saltea) y nunca tapa el LCP: el H1 se pinta debajo desde el primer frame y sigue
  siendo el elemento LCP. Reduced motion: cuadro fijo que se va en ~380 ms.
- **Sonido opt-in**: el `AudioContext` se crea recién dentro del clic del visitante y el motor (`lib/sound/engine.ts`,
  `music.ts`) es un chunk aparte que no se pide hasta entonces. La preferencia se guarda en `localStorage`.
- **OGL en lugar de Three.js** para la corona: ~10 veces más liviano. Se carga con `import()` solo con WebGL,
  `hardwareConcurrency > 4`, sin `prefers-reduced-motion` ni ahorro de datos; si no, queda la corona CSS.
- **Demos navegables reales** (React, no imágenes) en dos vistas sin marcos (`DeviceFrame`: «Escritorio» y «Celular»);
  cada demo se descarga recién cuando se va a mostrar y nunca hay más de una en vivo a la vez.
- **Sin middleware** (export estático): la raíz `/` detecta `navigator.language` y redirige con JS.
- **Fuentes locales** (Instrument Serif + Geist recortada a latín) con `next/font/local`.
- **Hidratación diferida** (`components/motion/LazyHydrate.tsx`): las secciones bajo el pliegue muestran su HTML
  estático (visible y usable) y React las hidrata recién al acercarse al viewport o al recibir foco o un toque. El
  copy de las demos viaja con el código de cada demo, no en cada página.
- **Sin `:has()` en `<html>` ni `scroll-behavior: smooth` global**: medido en Chrome, ambos hacían re-estilar el
  documento completo muchas veces durante la carga. El scroll de los modales se bloquea con `lib/scroll-lock.ts` y el
  scroll suave de los anchors lo hace `<SmoothAnchors>`.
- **"Recomendado" en lugar de "Más elegido"** en el plan destacado: sin clientes todavía, "más elegido" sería una
  afirmación que no podemos respaldar (ver `PLACEHOLDERS.md`).
- **v3 · sin animación decorativa permanente**: el hero quieto en reposo, la corona WebGL dibuja solo cuando algo cambia
  y las entradas de una sola vez (Reveal, DrawLine, Occult, LightSweep, CountUp) son transiciones CSS que dispara un
  IntersectionObserver compartido (`components/motion/observeEnter.ts`) en lugar de ~56 ScrollTriggers. Medición en
  `docs/v3/rendimiento.md`.
- **v3 · un solo ámbar por pantalla**: el CTA del header pasa a contorno mientras se ve el del hero (`data-hero-cta`) o
  el CTA principal de una sección (`data-page-cta`, o `pageCta` en `<DemoCta>`); `usePageCtaInView` lo resuelve con un
  IntersectionObserver.
- **v3 · la hidratación no cambia alturas**: el HTML del servidor de cada sección diferida mide lo mismo que la sección
  hidratada (si no, los saltos por ancla aterrizan corridos y hay CLS). Ejemplo: en Soluciones la familia abierta por
  defecto en desktop ya viene abierta en el HTML (`data-default`).
- **v3 · portal en la misma app**: `chromeRoute()` decide el modo del header (landing, /plan o portal) y `<LandingOnly>`
  saca los bloques comerciales del footer en el portal; el copy del portal se traduce en el servidor y queda fuera del
  payload de cliente, como el de las demos.

## Métricas (Lighthouse mobile, export servido con gzip como GitHub Pages)

Medido sobre la v3 con corridas intercaladas contra la v2 en la misma máquina (detalle y método en
`docs/v3/rendimiento.md`). Lighthouse varía bastante entre corridas en esta página, así que se informan rangos:

| Página | Performance | Accesibilidad | Best practices | SEO | LCP (simulado) | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/es/` (v2 → v3) | 70–82 → 80–84 | 100 | 96* | 100 | 2,9–5,0 → 3,5–3,8 s | 360–440 → 230–320 ms | 0 |
| `/es/plan/` (v2 → v3) | 84–91 → 80–86 | 100 | 96* | 100 | 2,9–3,5 → 2,7–4,4 s | 190–270 → 160–390 ms | 0 |
| `/es/portal/…` (v3) | 91–95 | 100 | 96* | 63** | 2,9–3,4 s | 90–170 ms | 0 |

\* Los 4 puntos que faltan son errores de consola de las APIs de cotización, bloqueadas en el entorno donde se midió.
\*\* El portal es `noindex` a propósito (mockup de una zona privada).
axe-core: 0 problemas en 26 escenarios (landing es/en/pt a 360 y 1440, preferencias, menú, armador, `/plan`, modal de
demo, reveal de los 6 rubros, portal y 404). En el scroll del hero (CPU 4×), el iPad pasa de 23,5 a 37,9 fps y en
reposo el hilo principal de 41–100 % a ~10 % ocupado.

Las secciones bajo el pliegue usan `content-visibility: auto` (`.cv-section`): el navegador no calcula su estilo ni su
layout hasta que se acercan al viewport, lo que bajó entre 20 y 35 % el trabajo de "Style & Layout" de la carga.
`<ContentVisibilitySync>` vuelve a medir ScrollTrigger cuando cambian de alto y los anchors las renderizan todas antes
de saltar, para aterrizar exacto.

## Pendientes conocidos / próximos pasos

- **Probar el scroll en dispositivos reales** (iPad y Android medio, también Safari): la mejora del lag está medida en
  Chromium headless con CPU limitada y sin GPU (`docs/v3/rendimiento.md`).
- **Primera bajada**: la domina la hidratación diferida, que recrea el DOM de cada sección; hidratar en el lugar
  (Suspense) la atacaría de raíz.
- **Portal de clientes real**: backend, auth con invitaciones, autorización por organización y proyecto, almacenamiento
  privado y emails (ver la especificación en Notion). Hasta entonces es solo el mockup.
- **Performance mobile ≥ 90 estable**: el trabajo de script inicial (React, Next y GSAP) es lo que más pesa en el LCP
  simulado y el TBT.
- **Kit de demos**: las demos dejaron anotadas mejoras para el kit (opciones de `runChat`, `VoiceCall`, `AppShell`,
  `Streak`, `Leaderboard`, `Kpi`) que hoy resuelven localmente; consolidarlas en `components/demos/kit`.
- Reemplazar los placeholders de `PLACEHOLDERS.md` (WhatsApp, email, dominio, trailers en video, logos).
