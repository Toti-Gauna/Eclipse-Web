# Lote 1.3 · Header y selector inmersivo

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` tras el merge del PR #18) · **Resultado:** código del header, el selector y la History del showroom (Eclipse-Web). Nada se publicó: el PR se abre para que Ignacio lo apruebe y lo mergee (G5). Gasto externo: USD 0.
**Fuentes:** Notion «Lote 1.3 · Header y selector inmersivo» (§05, §07, §12), `lote-1.1-arquitectura-wireflows.md` (§3.2, §5, §6, §7, §11), `lote-1.4-motion-direccion-visual.md` (§5.4, §6, §9), decisiones **D6** y **D7** de Ignacio (26/10/2026).

## 0. Informe en tres líneas

- **Qué cambió:** «Potenciar mi negocio» es la única entrada al showroom (hero, header, menú móvil, tarjetas de plan, «Pieza por pieza», calculadora y cierre): un `<a href="#contacto">` real que abre el **selector** «¿Qué negocio querés potenciar?» con exactamente dos filas, Inmobiliarias (abre la demo de Lumen) y Ecommerce («Próximamente», `aria-disabled`). Hay **un dueño de History** (`showroomHistory`) y el **contrato de URL** `?rubro&vista&area` con lista blanca y pruebas; la entrada directa abre sin película, Atrás/Adelante/Escape/«Volver» restauran sin doble entrada, y si el chunk falla el enlace hace lo que dice (va a contacto). El header **flota** al scrollear (superficie con desenfoque fijo; altura y anclas intactas) y ya no tiene «Armá tu plan».
- **Qué quedó abierto:** hay **dos `<dialog>`** en secuencia (selector → demo), no uno que cambia de contenido (§3.1); `vista=entrada` y `area=…` valen como URL pero abren la demo (no existen el gateway de 4 accesos ni las áreas); no se probó en Safari iOS/iPad real ni con lector de pantalla; contraste medido y rendimiento antes/después van a 1.5; la superficie del header en teléfonos queda a 8 px del borde (el contrato pedía 12–16, porque el gutter del contenido es 16 y no se movió).
- **Qué necesita el OK de Ignacio:** aprobar el PR. **D6 y D7 quedan resueltas** con su respuesta (§6). Habilita **1.5 · QA visual y rendimiento** (Sonnet · high).

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Rama y base | `claude/eclipse-v3-inventory-audit-2ukttn` reiniciada sobre `main` = `27738c2` (merge del PR #18, lote 1.2); `git status` limpio |
| Modelo y esfuerzo | `claude-sonnet-5-5` · `high` |
| Entorno | `npm run build` con `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web` servido en local; Chromium headless (Playwright) |

## 2. Qué se hizo, por pieza

| Pieza | Cambio | Dónde |
|---|---|---|
| **CTA único (D6)** | `<PotenciarCta origin>`: enlace real a `#contacto`; con JS abre el selector (clic modificado = comportamiento del enlace; `SmoothAnchors` lo ignora por `data-opens-selector`). Si el chunk no llega, hace lo que dice el enlace. `data-demo-opener="selector:<origen>"` para devolver el foco | `components/ui/PotenciarCta.tsx`, `SmoothAnchors.tsx` |
| **Header** | Servicios · Demos · Precios · Cómo trabajamos · preferencias · Ingresar · **Potenciar mi negocio** (primario). «Potenciar» a < 430 px (nombre accesible completo). Sin «Armá tu plan». En `/plan` el CTA sigue siendo «Pedí tu demo» (el selector vive en la home). Superficie flotante: `.hdr-row::before`, aparece con `data-scrolled` (un solo ScrollTrigger, ya existente), opacidad + 8 px de caída en 220 ms, desenfoque fijo de 10 px, opaco si no hay `backdrop-filter`, fundido de 120 ms en *reduced* | `Header.tsx`, `header.css`, `globals.css` |
| **Menú móvil** | Mismo CTA; se cierra solo y el foco vuelve al botón del menú | `MobileMenu.tsx` |
| **Selector** | `<dialog>` nocturno, título «¿Qué negocio querés potenciar?», dos filas en tabla (nombre serif `clamp(2.5rem,6vw,4.5rem)`, producto en mono, una oración, glifo de fase que se llena con foco/hover solo con opacidad), «Volver» arriba a la izquierda, contacto directo para quien no encaja (D5). Apertura: la noche aparece 180 ms y la superficie sube 12 px en 260 ms (*reduced* y entrada directa: fundido de 140 ms). Escape, «Volver» y Atrás cierran con 160 ms de fundido y devuelven el foco al origen | `components/demo-experience/SelectorLayer.tsx`, `selector.css` |
| **Traspaso a la demo** | Elegir Inmobiliarias llama a `openDemoExperience(..., entry: 'handoff')`: la capa de demo hace **su** apertura (el único eclipse) y el selector se retira cuando el vacío la cubre (`OPEN.void + 80 ms`); no hay dos eclipses | `SelectorLayer.tsx`, `store.ts` |
| **History (un dueño)** | `showroomHistory.ts` es el único que llama `pushState`/`replaceState`. Marca `{ eclipseShowroom: { v: 1, level } }` (sin datos del visitante). Selector: una entrada, misma URL. Demo: una entrada con `?rubro=inmobiliarias&vista=guia` (parámetros ajenos intactos); desde el selector **reemplaza** su entrada (Atrás/Escape/«Volver» → home). Entrada directa: sin entrada propia detrás, cerrar limpia la URL y **no** llama `history.back()`. Adelante sobre una entrada nuestra reabre la capa. Reemplaza al token `eclipseDemo` | `showroomHistory.ts`, `DemoExperienceHost.tsx`, `store.ts` |
| **Contrato de URL** | `parseShowroomParams` (puro, lista blanca, alias `area=branding…`, un valor fuera de lista invalida todo), `withShowroomParams`, `stripShowroomParams`, `isPortalPath`. Carga: `rubro=inmobiliarias` → demo sin película; `rubro=ecommerce` → selector (URL limpiada); inválido → se limpian `rubro/vista/area` y el foco va al H1. Nunca en `/portal` | `lib/showroom.ts`, `tests/showroom.test.ts` (12 pruebas) |
| **Falla de carga** | `LayerBoundary` alrededor del cuerpo de la demo: panel «No se pudo cargar la demo» con «Reintentar» (nuevo `lazy`) y WhatsApp; la barra de la capa («Volver») queda fuera, así que nunca hay una página bloqueada | `LayerBoundary.tsx`, `DemoExperienceHost.tsx` |
| **Sin JS** | `<noscript>` bajo el hero: «La demo interactiva necesita JavaScript…» y el CTA sigue llevando a contacto | `Hero.tsx` |
| **Armador dormido** | Se retiran los últimos puntos de apertura: header, menú, footer, cierre, calculadora, tarjetas de plan, «Pieza por pieza» (también los «Sumar» de cada pieza: la lista es de lectura) y el botón de la capa de demo. Quedan el código, `/plan/` y los tests | varios; claves de mensajes sin uso eliminadas |
| **Copy honesto** | Se quitó «Armá tu plan» del texto del cierre y «Mirá el total, el anticipo y el saldo al instante» de «Pieza por pieza» (prometían una herramienta que duerme) | `messages/*` |

## 3. Decisiones y desvíos

### 3.1 Dos `<dialog>` en secuencia, no uno (desvío de 1.1 §6.1 y de Notion §07.4)
1.1 pedía **un solo `<dialog>`** que cambia de vista. La capa de demo es un componente de 480 líneas con su ciclo de vida (película, `lockScroll`, guía, History) y reescribirla para alojar vistas ajenas era un riesgo de regresión desproporcionado para dos estados. Se eligió: un **solo host y un solo store** (`DemoExperienceHost` / `store.ts`), dos diálogos que **nunca coexisten salvo ~400 ms de traspaso** (el vacío de la demo cubre al selector). `lockScroll` es contado, así que el bloqueo no se suelta entre ambos. Se cumplen los criterios binarios («una experiencia pesada y un audio provider»), no la letra de «un dialog». Si 1.5 mide un costo, unificar es un lote propio.

### 3.2 Qué abre cada vista del contrato hoy
Existe una sola vista: la **demo de Lumen** (`vista=guia`). `entrada`, `branding`, `intelligence`, `academy` y cualquier `area` son válidos como URL pero abren esa demo; al escribir se canoniza a `vista=guia`. El gateway de 4 accesos y las áreas son de 3.x (1.1 §5.1). Una entrada directa **no** reescribe la URL (conserva `area` y lo demás).

### 3.3 «Volver» sube al home
Con el gateway ausente, «Volver» (y Escape y Atrás) llevan al home, al origen y con el foco exacto. Cuando exista la entrada de EstateOS, «Volver» de la guía subirá un nivel (1.1 §7.2).

### 3.4 Sonido y movimiento
Un solo proveedor de sonido (`useSound`): `open` al abrir el selector, `select` al elegir, `close` al cerrar, `glint` en los CTA; nada en carga ni en hover; la entrada directa no suena. Movimiento: solo `opacity` y `transform` (12 px / 8 px) y, en la demo, el WAAPI existente. Sin animación permanente.

## 4. Puerta estética contra el baseline (rúbrica 1.4 §11)

Superficies nuevas, capturas en `docs/v3/capturas/1.3/` (selector a 360, 1024, 1440 y en en/pt a 360; header en reposo y flotando a 360 y 1440).

| Eje | Puntos | Por qué |
|---|---|---|
| Identidad | 2 | Noche + una luz ámbar de un solo lado, serif extremo y glifos de fase: es Eclipse, no un modal genérico |
| Jerarquía | 2 | Una pregunta, dos filas; el nombre del rubro es el único momento grande; Ecommerce atenuado |
| Lectura | 2 | Texto ≥ 16 px; muted sobre `--void` (≈ 7:1 por tokens; **no medido** en pantalla) |
| Orientación | 2 | «Volver» arriba, foco al título, URL que dice dónde estás, retorno exacto |
| Móvil | 1 | Filas de 183 px, sin desborde a 360, safe-areas; **sin dispositivo real ni WebKit** |
| Acción principal | 2 | Un ámbar sólido por viewport (7 CTA fuera del header, **0 pares**; el del header se calla al ver el del hero) |
| Movimiento | 1 | Duraciones medidas y *reduced* verificado (todas ≤ 150 ms); la sensación en vivo no se evaluó |
| **Total** | **12/14** | Cumple el umbral (≥ 12, ningún 0). Bloqueantes binarios: foco, Atrás y Escape **probados**; contraste medido: **pendiente (1.5)** |

Contra el baseline no empeora ningún criterio crítico: el header gana un CTA con nombre propio y pierde un botón secundario (menos ruido), y las tarjetas de plan pasan de «Personalizar» (armador) a «Potenciar mi negocio».

## 5. Verificación (E2)

| Chequeo | Resultado |
|---|---|
| `npx tsc --noEmit` · `npx eslint components lib app` | sin errores ni avisos |
| `npx vitest run` | 30 archivos, **400 pruebas** (12 nuevas del contrato de URL) |
| `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web npm run build` | exporta |
| `tests/e2e/smoke.mjs` sobre `out/` bajo `/Eclipse-Web` | **72/72** (11 nuevas: sin «Armá tu plan», selector desde el header y el hero, dos filas, Ecommerce deshabilitado, Atrás/Adelante, traspaso sin entrada extra, URL del contrato, entrada directa, URL inválida, portal, chunk caído) |
| Flujo en Chromium (23 comprobaciones) | selector abre con una entrada y misma URL; Escape devuelve foco y scroll; 3 aperturas/cierres seguidos sin bloqueo; Atrás/Adelante; «Volver»; traspaso a la demo; Escape de la demo limpia la URL; entrada directa conserva `utm_source` y el foco va al H1; `rubro=ecommerce` abre el selector; el portal ignora la consulta; Atrás desde una demo vuelve al home y Adelante la reabre; chunk caído → `#contacto` sin diálogo ni bloqueo |
| Menú móvil (360, táctil) | contiene «Potenciar mi negocio» y no «Armá tu plan»; se cierra y el foco vuelve al botón del menú |
| Idiomas | en: «Boost» (66 px) · pt: «Potencializar» (111 px) a 360, sin desborde |
| *Reduced motion* | todas las animaciones al abrir ≤ 150 ms |
| Tarjetas de plan | «Potenciar mi negocio» abre el selector y Escape vuelve a esa tarjeta |

## 6. Decisiones de Ignacio resueltas en este lote

- **D6** — «un botón de "Potenciar mi negocio" que te derive al modal que selecciona un negocio». Aplicado en las tarjetas de plan, en «Pieza por pieza» (un botón en la introducción; **las filas de piezas pierden «Sumar»** y quedan como lista de precios de lectura) y en la calculadora y el cierre en lugar de «Armá tu plan». **Se interpretó** que el botón reemplaza también al «Sumar» por pieza; si prefieres un botón por pieza, es un cambio de una línea.
- **D7** — Ecommerce se construye **después de EstateOS**. La fila queda visible, honesta y sin planes inventados.

## 7. No ejecutado

- Safari iOS/iPad real, WebKit emulado, lector de pantalla y *Tab* en navegadores distintos de Chromium.
- Contraste medido, LCP/CLS/INP antes/después y prueba de 5 personas: 1.5. No se afirma ninguna mejora de rendimiento.
- La superficie del header a 12–16 px del borde en teléfonos (queda en 8 px, §0).

## 8. Rollback

`git revert` del commit del lote devuelve el header de 1.2 con «Armá tu plan» y los puntos de apertura del armador; el selector y el contrato de URL desaparecen y vuelve el token `eclipseDemo`. No toca `/content`, precios ni el backend.

## 9. Handoff

- **1.5 · QA visual y rendimiento** (Sonnet · high): medir CLS/LCP/INP con el método de `rendimiento.md`, contraste real, teclado completo, el salto de ancla con `#precios` al cargar (en la prueba, a los 3,5 s la página quedó en Demos: las secciones diferidas cambian de altura; ya existía y no se tocó), el desplazamiento intermitente de `.hero-copy-inner`, y decidir si el selector y la capa de demo se unifican en un solo `<dialog>`.
- Para 2.x/3.x: el gateway de 4 accesos y las áreas del contrato (`vista=entrada|branding|intelligence|academy`, `area=…`) entran al mismo host sin tocar la History.
