# Lote 3.5 · Base en `roofy`

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Ramas:** `roofy` y Eclipse-Web, ambas `claude/eclipse-v3-inventory-audit-2ukttn` · **Resultado:** Lumen corre en `roofy` a pantalla completa, con la barra inferior, el celular en un botón, la entrada, la lente por plan y el reproductor; el parámetro `plan` entra al contrato de enlace en los dos repos. **No se publicó nada** (la publicación de prueba sigue apagada).

**Fuentes leídas:** `lote-3.1-direccion-estateos.md` (D28–D36), `estateos/biblia-estateos.v2.md`, `estateos/guia-motion.v1.md`, `estateos/catalogo-estateos.v3.json`, `lote-1.6-repo-subdominio-estateos.md`, y el código de la demo de Lumen, el kit, el sonido y la guía de Eclipse-Web (commit `206ced5`).

## 0. Informe en tres líneas

- **Qué cambió:** `roofy` pasó de «en preparación» a la demo de Lumen en pantalla completa: barra inferior con el menú de plan, «Ver la guía», sonido y, abajo a la derecha, el botón del celular (D35). Cada carga ofrece «¿Cómo la querés ver?» («Ver con guía» / «Ver por mi cuenta») y no recuerda nada. Con un plan, las áreas que no incluye aparecen con candado y «Desde <plan> · USD <precio>/mes» más «Ver demo de <plan>» (nombres y precios salen de una copia del catálogo v3 con digest fijado en los dos repos). El contrato de enlace suma `?plan=` (fixture compartido, digest nuevo, probado de los dos lados) y hay un reproductor de video listo, sin videos todavía.
- **Qué quedó abierto:** las siete piezas siguen en `draft` y el escenario lo dice en pantalla; solo `Seguimientos` está bloqueado en Contact porque es la única área de la demo actual que el catálogo pone por encima de Contact (el resto de las áreas de cada plan llega en 3.6–3.8d). `vista` y `area` del enlace se leen y se limpian pero todavía no mueven la demo. La interacción «premium» (el chat que piensa, D34) es el lote 3.5b. No probé en un celular ni un Safari reales, ni en pantallas apaisadas bajas. El reproductor lo probé con un video de prueba temporal que quité: todavía no existe ningún video aprobado.
- **Qué necesita el OK de Ignacio:** aprobar los dos PRs (`roofy` y Eclipse-Web, que van juntos por el contrato de enlace). Sigue **3.5b** (Opus · high, kit de interacción premium); cuando llegue el momento de **3.3 (Higgsfield)** te aviso, como pediste.

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Base | Eclipse-Web `main` `206ced5` (merge del PR #30); `roofy` `main` `150a28e` |
| Qué se corrió | `tsc`, `eslint`, `vitest` y `next build` en `roofy`; `vitest`, `tsc` y `eslint` (archivos tocados) en Eclipse-Web; Chromium (Playwright preinstalado) contra el export servido en local |
| Contacto externo | Ninguno. `npm audit` de `roofy`: 0 vulnerabilidades |
| Gasto | USD 0 |

## 2. Qué se construyó (en `roofy`)

| Pieza | Decisión |
|---|---|
| Demo de Lumen | Copia de Eclipse-Web `206ced5` con manifiesto de SHA-256 (`docs/procedencia-lumen.json`) y la lista de lo que cambió (`docs/procedencia-lumen.md`). No es una dependencia: evoluciona en `roofy`. Se sumaron `gsap`, `@gsap/react` y `lucide-react` fijado en la misma versión exacta que Eclipse-Web (el kit y la guía los usan) |
| Pantalla completa (D35) | El escenario ocupa el alto de la pantalla entre una fila superior (volver a Eclipse, idiomas) y la barra. El texto de la demo escala con el menor del ancho y el alto de la pantalla (`clamp(11px, min(1.45cqw, 2.3cqh), 22px)`). Sin scroll de la página |
| Celular en un botón | Botón abajo a la derecha de la barra. **Desde 1280 px** el celular se acopla al escritorio y los dos comparten la misma historia (una sola tienda: simular en uno se ve en el otro). **Por debajo** se ve una vista por vez, con el mismo botón (muestra el celular o el escritorio) y el estado se conserva al alternar. En una pantalla de menos de 700 px arranca la vista del celular (la lógica invertida de D35) |
| Entrada | «¿Cómo la querés ver?» sobre la demo inerte; el foco cae en «Ver con guía». Se ofrece en cada carga; nada se recuerda; la guía nunca arranca sola |
| Guía | Los seis pasos de Lumen con el `Tour` del kit; en pantallas anchas abre el celular para que se vean «las dos vistas». «Ver la guía» en la barra la repite |
| Lente por plan | `?plan=<id>` o el menú de la barra (sin plan = demo general, todo abierto). Qué capacidad pide cada área: `components/experience/lens.ts`; desde qué plan arranca cada capacidad y el nombre y el precio de cada plan: `content/estateos-plans.json`. Ningún número está escrito en un componente. Partner muestra «propuesta», no un precio |
| «Ver demo de X» | El área bloqueada tiene un botón que cambia al plan que la incluye y actualiza la URL con `replaceState` (se puede compartir) |
| Honestidad | Cada pantalla dice «Demo · datos ficticios» y, mientras el plan esté en `draft` (`PLAN_DEMO_STATUS`), «Demo en preparación: todavía no muestra todo lo que incluye este plan» |
| Reproductor | `<dialog>` con póster, controles, transcripción en los tres idiomas, `preload="none"`, sin autoplay; al abrirlo apaga la música y al cerrarlo pausa el video. Vive detrás de `content/estateos-videos.json` (vacío): el botón «Ver el video» aparece solo si hay un video para el plan en pantalla |
| Se retiró | El panel técnico «Prueba del enlace» y la página «en preparación» |

## 3. Contrato de enlace: `plan`

- Valores: `contact`, `growth`, `escalar`, `hipergrowth`, `deluxe`, `partner` (los ids del catálogo; minúsculas). Orden fijo al construir: `moneda`, `vista`, `area`, `plan`, `utm_*`. Fuera de la lista se descarta (y la URL se limpia).
- Fixture compartido (**el mismo archivo, byte a byte, en los dos repos**): 3 casos nuevos de construcción y 4 de lectura; todos los estados leídos ahora llevan `plan`. **Digest: `f66d6ee1…5665`** (antes `144cfcaf…2597`). `roofy` y Eclipse-Web lo prueban; `lib/estateos-link.ts` suma `ESTATEOS_PLANS` y su prueba verifica que sean los ids de `content/levels.json`.
- Copia del catálogo en `roofy`: `tests/plans.test.ts` fija su digest (`42b26877…a25c`) y `tests/estateos-plans-copy.test.ts` (Eclipse-Web) reconstruye ese subconjunto desde `catalogo-estateos.v3.json` y exige el mismo digest. Si el catálogo cambia un plan, un precio o desde qué plan arranca una capacidad, falla hasta que se regenere la copia y se muevan los dos fijados juntos.
- La fila «Inmobiliarias» del selector de Eclipse sigue abriendo la demo de Lumen (D11): el enlace sigue **inactivo** hasta el lote 3.9.

## 4. Criterios

| Criterio | Estado | Evidencia |
|---|---|---|
| Lumen a pantalla completa, sin scroll de página, 360 a 1440 px | Cumplido | 5 anchos × 3 idiomas, desbordamiento horizontal 0 en los 15 |
| Celular en un botón abajo a la derecha, interactivo | Cumplido | A 1440 px el celular acoplado refleja «Simular» del escritorio; a 360/768/1024 px el estado se conserva al alternar |
| Entrada en cada carga, sin recordar | Cumplido | La entrada aparece en los 15 casos; no hay almacenamiento de por medio |
| Áreas bloqueadas con precio del catálogo y «Ver demo de X» | Cumplido | Captura a 1440 px: «Seguimientos» en Contact → «Desde Growth · USD 75/mes» → `?plan=growth` |
| Reproductor sin autoplay, con transcripción | Cumplido con un video de prueba temporal | `paused`, `autoplay=false`, `preload=none`; Escape cierra y el foco vuelve al botón |
| `plan` en el contrato, los dos repos | Cumplido | 41 pruebas de enlace en `roofy` (con los 7 casos nuevos) y 25 en Eclipse-Web, mismo digest |
| Blancos táctiles ≥ 44 px | Cumplido | 0 botones de la barra o de la entrada por debajo de 43,5 px en los 15 casos |
| Teclado | Cumplido | Entrada (Enter), menú de plan (abre, elige, Escape devuelve el foco), botón del celular (`aria-pressed`) y guía con flechas |
| Movimiento reducido | Cumplido | Guía completa con `prefers-reduced-motion: reduce`; el fundido de la entrada y del menú se apaga |
| Sin errores de consola | Cumplido | 0 en todas las corridas |
| Contraste AA medido | **No medido** | Se heredan los tokens de Eclipse-Web; falta una pasada con herramienta |
| Pantallas apaisadas bajas, Safari y celular reales | **No probado** | A menos de ~520 px de alto el texto de la demo llega a su mínimo (11 px) y puede recortarse |

## 5. QA

`roofy`: `tsc` limpio, `eslint` limpio, **58 pruebas** (5 archivos), `next build` verde (es/en/pt), `npm audit` 0. Eclipse-Web: **467 pruebas** pasan (1 omitida, la de siempre), `tsc` limpio, `eslint` limpio en los archivos tocados. Navegador: capturas a 360, 768, 1024, 1280 y 1440 px; entrada, escritorio, celular acoplado, área bloqueada, plan desbloqueado, guía y reproductor.

## 6. Riesgos y reversión

- **La copia de Lumen puede divergir de la de Eclipse-Web.** Es a propósito (cada demo evoluciona con su producto); el manifiesto permite comparar y portar un arreglo a mano.
- **Dos vistas montadas a la vez** desde 1280 px (el celular oculto sigue vivo para compartir la historia): más trabajo inicial que una sola vista. Sin medición antes/después todavía: no afirmo rendimiento.
- **El mapa área → capacidad** (`lens.ts`) es una decisión de este lote basada en las capacidades que el catálogo v3 ya declara; las áreas nuevas de cada plan lo amplían en 3.6–3.8d.
- Reversión: los dos PRs son aditivos sobre el esqueleto 1.6 y sobre `lib/estateos-link.ts` (inactivo); revertirlos devuelve el estado anterior sin tocar la home de Eclipse.

## 7. Handoff y gate siguiente

- Habilita **3.5b** (kit de interacción premium, Opus · high), que construye sobre este escenario. No habilita nada de gasto: 3.2 (fotos), 3.3 (Higgsfield, con Ignacio presente, D36) y 3.4 (voz) siguen con su compuerta.
- Del lado de Ignacio sigue pendiente cargar los secrets de publicación de `roofy` (`HOSTINGER_SSH_KEY`, `HOSTINGER_KNOWN_HOSTS`) cuando quiera ver la demo en el subdominio.
