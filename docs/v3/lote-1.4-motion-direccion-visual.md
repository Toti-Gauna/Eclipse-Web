# Lote 1.4 · Motion y dirección visual

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-opus-5-5`, esfuerzo `high` (`get_session`: `model` y `last_served_model` = `claude-opus-5-5`, `effort_level` = `high`; cambio de modelo hecho por Ignacio con `/model`) · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` · **Resultado:** documental. **No se tocó código de producto**; sí se instalaron dependencias y se construyó el sitio **en local** para sacar el baseline (nada se publicó). Gasto externo: USD 0.
**Fuentes:** Notion «Lote 1.4 · Motion y dirección visual» (con su anexo «Dirección de arte maestra — Efemérides v3»), «Diseño premium · profundidad, luz y motion», `lote-1.1-arquitectura-wireflows.md`, y el código: `app/globals.css`, `components/demo-experience/motion.ts`, `components/hero/useHeroMotion.ts`, `components/motion/gsap.ts`, `lib/sound/{types,engine}.ts`, `components/layout/header.css`, `components/loader/constants.ts`, `docs/v3/rendimiento.md`.

## 0. Informe en tres líneas

- **Qué cambió:** existe un **baseline real** de la home (capturas de página completa a 360, 390, 768, 1024 y 1440, normal y *reduced*, en `docs/v3/capturas/baseline-1.4/`) con su diagnóstico y **dos defectos medidos**. Además: el contrato de arte del anexo **verificado contra el código** (tres correcciones), la **dirección visual** de las composiciones nuevas (elegida entre tres, con descartes), la **partitura** de 17 eventos de movimiento, el audio, el perfil de rendimiento, el presupuesto por viewport y la rúbrica aplicada al baseline.
- **Qué quedó abierto:** el baseline saca **10/14** en la rúbrica: el sitio actual ya está por debajo del umbral de 12 que se exige a lo nuevo. Las seis referencias externas **no se pudieron reabrir** desde este contenedor (la red las rechaza). La medición de rendimiento antes/después y la revisión con teclado quedan para 1.5.
- **Qué necesita el OK de Ignacio:** aceptar la dirección (§5) y decidir **D8** (titular del hero), **D9** (sección Fundadores con la oferta inactiva) y **D10** (qué hace el chip directo de Ecommerce mientras no exista). Habilita **1.2** (Sonnet · high).

## 1. Registro de entrada (G0) y ficha Opus

| Dato | Valor |
|---|---|
| Modelo y esfuerzo efectivos | `claude-opus-5-5` · `high`. Sin Max ni workflows |
| Rama y HEAD al abrir | `claude/eclipse-v3-inventory-audit-2ukttn` · `98967e1` (PR #16 abierto); `git status` limpio |
| `main` de Eclipse-Web | `d5cea50` (merge del PR #15). Código de aplicación igual a `6bf91ae` |
| Entorno de baseline | `npm ci` + `npm run build` (export estático, sin `basePath`, 65 s) servido en `127.0.0.1`; Chromium headless 1× DPR. Las llamadas externas del sitio (cotización, etc.) fallan por la política de red del contenedor: las capturas muestran la cotización de respaldo |
| Uso visible al iniciar (`get_session`, 14:34 UTC) | tokens: entrada 15.414 · salida 404.016 · lectura de caché 64.412.618 · escritura 2.259.637; `cost_usd` de la herramienta 19,13 (acumulado de toda la sesión; no es cargo de suscripción) |

**Ficha Opus (seis campos, `lote-0.4` §7):**
1. **Lote:** 1.4.
2. **Problema:** definir el lenguaje visual de lo que no existe todavía («Qué ofrecemos», «Para tu PyME», selector, entrada de EstateOS) sin romper Efemérides ni caer en tarjetas iguales, y fijar la partitura que Sonnet implementa en 1.2/1.3.
3. **Evidencia de entrada:** baseline E2 de esta sesión, tokens leídos del código, anexo de Notion, contrato 1.1.
4. **Beneficio esperado:** una dirección implementable tal cual, que reduzca vueltas de diseño en 1.2/1.3.
5. **Entrega:** este documento.
6. **Criterio de salida:** contrato verificado con correcciones; dirección elegida entre tres con descartes; partitura completa (disparador, duración, *easing*, simultaneidad, salto, *reduced*, audio, limpieza); rúbrica aplicada al baseline; tres defectos propios escritos. **La puerta estética real es en 1.2/1.3**: si lo implementado se ve peor que el baseline guardado, no se mergea.

## 2. Baseline (E2) y diagnóstico

**Archivos:** `docs/v3/capturas/baseline-1.4/{normal-360,normal-390,normal-768,normal-1024,normal-1440,reduced-360,reduced-1440}.jpg` (JPEG calidad 68, 4,7 MB en total) y el script `fullshot.mjs` que los generó. **Método:** el script fuerza el render de las secciones diferidas con la misma clase que usa el sitio (`html.cv-off`), recorre la página para que se disparen las entradas una sola vez y captura la página completa. Sin esa clase, Chromium deja en negro las secciones con `content-visibility: auto` (primer intento, descartado). **Límite:** en escritorio la captura completa muestra como espacio vacío el tramo en que el hero queda fijado al hacer scroll (100 vh): es el espaciador del *pin*, no un hueco real.

**Mediciones de esta sesión (E2):**
- **Sin scroll horizontal** en 360, 390, 768, 1024 y 1440 (`scrollWidth − innerWidth = 0`).
- **Sin JS** (HTML exportado `out/es/index.html`): los precios **están** (en pesos aproximados, por ejemplo «≈ $ 725.000» y «≈ $ 1.015.000», con «US$ 30/75/150» en el plan mensual), hay **13 enlaces `wa.me`** y **2 `mailto:`**. Cierra el punto que 1.1 había dejado como «no verificado».
- **Un ámbar por viewport:** se midieron todos los `.btn-primary` fuera del header. Hay **8** en la home y **un par comparte pantalla en los tres anchos medidos**: el «Pedí tu demo» de Cómo trabajamos y el «Quiero ser fundador» de Fundadores, a 468 px (360), 557 px (1024) y 600 px (1440) de distancia, con alturas de viewport de 780/900 px. **Defecto B1.**

**Qué funciona y se conserva (no tocar sin motivo):**
- El **hero**: H1 serif enorme con una sola cursiva ámbar, CTA único, el eclipse como instrumento (dial con marcas) a la derecha. Es reconocible y no parece plantilla.
- **Demos**: escritorio y celular lado a lado, sin marcos, con rótulo «Demo» y el número que importa en mono ámbar («12 turnos recuperados por semana»).
- El **amanecer** entre Soluciones y Precios: la mejor transición de la página; cambia de noche a día con una sola línea graduada.
- **Precios** en libro contable (líderes punteados, mono para números, «desde», anticipo y saldo visibles).
- La **calculadora en forma de frase** y el **sol final** «Tu negocio, a plena luz».

**Qué estorba (defectos, con evidencia):**

| # | Defecto | Dónde | Evidencia |
|---|---|---|---|
| B1 | Dos CTA ámbar sólidos en la misma pantalla | Cómo trabajamos + Fundadores, en 360, 1024 y 1440 | medición `.btn-primary` (arriba) |
| B2 | **Honestidad:** Fundadores invita «Quiero ser fundador» y «estamos eligiendo los primeros 5 negocios» con la oferta fundador **inactiva** (`content/offers.json`: `active: false`) | `#fundadores` | captura 1440 y 360 |
| B3 | Los rubros aparecen **tres veces** (7 chips en el hero, 6 pestañas en Demos, 7 chips en el chat del agente) | hero, `#ejemplos`, `#contacto` | captura |
| B4 | En 360 el **bloque del trailer** de la demo queda como un rectángulo negro de ~370 px en la captura (sin póster visible) | `#ejemplos` móvil | captura 360; **verificar en un dispositivo** (puede ser carga diferida del póster) |
| B5 | Zonas muertas: franja oscura de ~200 px bajo el hero en móvil; columna derecha vacía en Soluciones (escritorio) tras la vista previa; mitad derecha vacía en Fundadores | varias | capturas |
| B6 | Densidad de Precios: ~4,5 pantallas de 900 px en 1440; los importes en pesos son largos y el USD queda chico | `#precios` | captura |

## 3. Contrato de arte: verificación contra el código (HEAD)

| Elemento del anexo | En el código | Estado |
|---|---|---|
| void `#05050A`, night `#0C0C14`, ash `#1A1A24`, corona `#F5B942`, flare `#FFE8B0`, dawn `#F4EFE6`, ink `#111114`, mist `#9A97A6` | `app/globals.css:11–18`, idénticos | coincide |
| corona-deep `#8A5A00` (5,2:1 sobre dawn), mist-ink `#5B5866` (6,0:1) | `globals.css:21–22` | coincide |
| Geist, Geist Mono, Instrument Serif locales OFL | `app/fonts/*.woff2` + `*-OFL.txt` | coincide |
| Contenedor 1240 px, gutter 16 / 32 desde 768 | `.container-x` `max-width: 1240px`; `--gutter` 16 → 32 | coincide |
| Header 64 / 72 px | `--header-h` | coincide (no estaba en el anexo; se agrega) |
| `--ease-expo` `cubic-bezier(0.16,1,0.3,1)`, `--ease-soft` | `globals.css:38–39`; GSAP `expo.out` por defecto, 0,9 s (`gsap.ts`) | coincide |
| «Header glass: blur moderado **8–12 px**» | `.site-header[data-scrolled]`: `blur(16px) saturate(140%)`, fondo `rgb(5 5 10 / .62)` | **corrección 1:** el código usa 16 px. **No se cambia sin medición**: el valor se revisa en 1.5 con el perfil de §8 |
| «No glass en todas las cards» | `.glass` existe como utilidad; hoy hay `backdrop-filter` en header, `.glass`, fondo de `Sheet` y del tour | coincide con la regla; se fija el límite en §9 |
| Reveal de demo WAAPI «~2,4 s» | `OPEN`: la luz termina a 1080 + 1150 = **2230 ms**; el contenido termina de subir a 1700 + 900 + 70 ms por bloque = **≈ 2,7 s** | **corrección 2:** la apertura dura ~2,2 s hasta la luz y ~2,7 s hasta el contenido. Se puede saltar con clic o tecla. `CLAUDE.md` dice «~2.4 s»: se ajusta el texto en 1.2 |
| «Header: superficie flota vía transform/opacidad 180–240 ms» | `.site-header` transiciona `background-color`, `border-color` y `color` en **0,4 s** `ease` (propiedades de pintura; `globals.css:381`) | **corrección 3:** el código no usa transform/opacidad. Propuesta para 1.2: fondo del header en una capa propia que cambia por **opacidad** en 200 ms; se adopta solo si el perfil de §8 muestra costo de pintura al hacer scroll |
| Un ámbar sólido por viewport (`data-hero-cta`, `data-page-cta`, `usePageCtaInView`) | Existe para el header; **no protege pares de secciones** (B1) | ver §5.7 |

**Copy candidato del anexo** («Tecnología y creatividad para impulsar tu negocio»): **no se adopta como titular** (D8). Es la clase de frase genérica que `CLAUDE.md` prohíbe y no dice nada que el actual no diga mejor; el H1 actual («Antes de hablar, te mostramos tu negocio funcionando») lleva la promesa *demo-first* y es lo que mejor pasa la prueba de 30 s. La frase del anexo puede servir como bajada de «Qué ofrecemos».

## 4. Tesis y direcciones evaluadas

**Tesis:** *el observatorio comercial*. Eclipse es un **instrumento de lectura**: cada pantalla tiene **una** cosa iluminada (la que el visitante tiene que ver) y el resto queda en penumbra ordenada. La luz revela una capacidad concreta, nunca decora. **Una audacia por pantalla.** No se agrega ningún estilo nuevo (nada de *bento*, vidrio generalizado ni 3D): la profundidad sale de **planos** (fondo, instrumento, texto) y de la **luz** que ya existe.

Se evaluaron tres direcciones, en secuencia, para la pieza más visible que falta («Qué ofrecemos» + selector):

| Dirección | Idea | Riesgo | Costo | Resultado |
|---|---|---|---|---|
| **1 · Carta de efemérides** | Índice editorial de las cinco líneas con **una vista previa viva** (la misma gramática que ya funciona en Soluciones), una línea encendida por vez; selector como **dos filas de tabla astronómica** | Que se parezca demasiado a Soluciones | Bajo: reutiliza `ServicesIndex` y patrones existentes | **Elegida** |
| 2 · Constelación | Las cinco líneas como puntos alrededor del dial del eclipse; se explora rotando | Novedad sin comprensión; mal en móvil y con teclado; compite con el hero | Alto (SVG interactivo nuevo) | Descartada: falla «comprender en 30 s» |
| 3 · Bento de cinco | Grilla de cinco tarjetas de tamaños distintos | Es el tic de «tarjetas iguales» que `CLAUDE.md` prohíbe | Bajo | Descartada por la regla |

Para no repetir Soluciones, la dirección 1 cambia **la escala y el material**: Soluciones es una lista de piezas (densa, mono); «Qué ofrecemos» es una lista de **cinco nombres grandes** con una sola línea cada uno, y la vista previa es una **escena** (no una ficha).

## 5. Composiciones (lo que implementa Sonnet en 1.2/1.3)

Unidades: tamaños de texto en `rem` con `clamp`; colores **solo** por tokens semánticos (`text-fg`, `text-fg-muted`, `text-accent`, `border-line`); íconos Lucide 1,5. Nada de esto existe en código: es especificación.

### 5.1 Hero (A) · `#inicio`
- **Se conserva** la composición: H1 actual, bajada, eclipse-dial.
- **CTA primario:** «Quiero potenciar mi negocio», **enlace real** a `#contacto` mejorado por JS para abrir el selector (1.1 §3.1 fila 4). Sigue siendo el único ámbar sólido (`data-hero-cta`).
- **Debajo, en lugar de los 7 chips:** una línea de **entrada directa** con dos llaves de texto, sin caja: «Entrá directo: **Inmobiliarias** · **Ecommerce**». Son `<a>` a `?rubro=…&vista=entrada` (contrato 1.1 §5). Así el camino de un clic a la demo, que hoy existe con los chips, **no se pierde**. «Ver opciones» (secundario) es otro texto en la misma línea; nunca un segundo botón sólido.
- **Móvil:** se elimina la franja oscura de ~200 px bajo el hero (B5): el hero termina en la línea de entrada directa más 48 px.

### 5.2 Qué ofrecemos (B) · `#servicios`
- **Escritorio (≥ 1024):** dos columnas 5/7. Izquierda: las **cinco líneas** como nombres en Instrument Serif `clamp(2.25rem, 3.4vw, 3.5rem)`, cada una con **una** oración en Geist 1rem, separadas por filetes de 1 px. **Sin numeración 01–05** (no es una secuencia). La línea activa lleva el glifo de fase lleno a su izquierda y su nombre en `text-fg`; las demás en `text-fg-muted`. Derecha: la **escena** de la línea activa, en un marco con marcas de registro (`.ticks`), alto fijo para que no salte el layout.
- **Escenas** (solo material existente; lo que no hay se dice): SaaS → captura del CRM de Lumen; Agency → la landing de una demo; Studio → póster del trailer; **Academy y Equipamiento → sin material hoy**: la escena es un texto de una línea y el rótulo «Próximamente», nunca una imagen inventada.
- **Intelligence** no es una sexta fila: es una **banda horizontal** de 1 px con un texto corto debajo de las cinco («Intelligence: los datos de cada línea, leídos en un panel»), porque es transversal.
- **Piezas:** «Ver las 20 piezas» abre, plegado, el índice de Soluciones actual **sin cambios** (`ServicesIndex`).
- **Móvil:** acordeón de cinco filas (una abierta por vez, la primera abierta por defecto **también en el HTML del servidor**, regla de alturas de `CLAUDE.md`); la escena va dentro de la fila abierta, con relación 16:10.
- **Movimiento:** al cambiar de línea, la escena hace *crossfade* 200 ms `--ease-soft` + 8 px de desplazamiento; *reduced*: instantáneo. **Nada rota sola.**

### 5.3 Para tu PyME (C) · `#problema`
- Tres necesidades en secuencia de madurez (**empezar · ordenar · crecer**): acá **sí** es secuencia, así que llevan glifo de fase creciente (creciente, cuarto, llena) y número.
- Escritorio: tres columnas separadas por filetes, como Cómo trabajamos (sin cajas). Cada una: título serif, una oración, y **qué líneas combina** como texto corrido (no chips). Debajo, la calculadora actual plegada en «Ver la cuenta».
- Las necesidades **no son planes nuevos** ni tienen precio propio.

### 5.4 Selector (D)
- Vive en el **mismo `<dialog>`** de la capa de demo, en **tema noche** (todavía no hay luz): el fondo de la página se atenúa por opacidad (180 ms) y aparece la superficie (260 ms, `--ease-expo`, 12 px de subida).
- Dos **filas de tabla**, ancho completo, separadas por filetes: nombre del rubro en Instrument Serif `clamp(2.5rem, 6vw, 4.5rem)`, nombre del producto en Geist («Eclipse · EstateOS»), una oración, y a la derecha el glifo de fase que **se llena** en hover y foco (la firma de luz, sin flechas).
- **Ecommerce:** fila visible con el rótulo «Próximamente» y su oración honesta; `aria-disabled="true"`, texto `text-fg-muted` (AA en noche). No se abre (D1/D7).
- Elegir Inmobiliarias dispara **la apertura del eclipse existente** (WAAPI `motion.ts`) desde el glifo de la fila: es el único eclipse del recorrido. **Nunca dos eclipses seguidos.**
- «Volver» arriba a la izquierda; Escape cierra. Móvil: pantalla completa, filas apiladas de ≥ 88 px de alto.

### 5.5 Entrada de EstateOS (gateway)
- **Tema día** (ya iluminado). Arriba, el panel «¿Cómo querés verla?» con **«Ver con guía»** (el único ámbar sólido) y **«Ver por mi cuenta»** (ghost). Aparece en cada recarga (D3); no se guarda nada.
- Debajo, los **cuatro accesos asimétricos**: «Ver con guía» como bloque grande con la escena del CRM de Lumen (Lumen conserva piedra/cobalto: es otra marca, rotulada «Demo»), y Branding, Intelligence y Academy como **lista** de tres filas con una oración cada una y su estado («Próximamente» donde no hay contenido). Cuando el panel está visible, el bloque grande no usa ámbar sólido.
- Móvil: panel arriba, bloque grande, lista. Todo en una columna.

### 5.6 Planes de EstateOS (para 2.3)
- Un plan activo por vez en **libro contable** (mismo lenguaje que Precios), selector de los seis niveles con precios en Geist Mono, comparación por categorías en móvil. **No** seis columnas, **no** tarjetas inclinadas. El detalle es de 2.3.

### 5.7 Correcciones del baseline que entran en 1.2
- **B1:** «Quiero ser fundador» pasa a **ghost** (o la sección se pliega, según D9); queda un ámbar por pantalla. Regla nueva para el código: **dos `data-page-cta` no pueden estar a menos de un alto de viewport**; se agrega un test que lo mida (como la medición de §2).
- **B3:** los rubros aparecen **una sola vez** como acción (la entrada directa del hero y el selector); el chat del agente pregunta el rubro con texto libre y las dos opciones vigentes.
- **B5:** se quitan las zonas muertas listadas.

## 6. Partitura de movimiento (existente + nuevo)

*Técnica:* CSS = transición/animación; IO = `observeEnter` (un solo IntersectionObserver); WAAPI = `element.animate`; GSAP = `components/motion/gsap.ts`. *Simultaneidad:* máximo **dos movimientos principales** a la vez.

| # | Evento | Disparador | Técnica · archivo | Duración · *easing* | Saltar | *Reduced* | Audio | Limpieza | Estado |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Loader | carga completa | CSS · `loader/*` | fin 1790 ms (revela a 1180) | clic, tecla, rueda, toque (220 ms) | 380 ms | — | atributo `done` | existe |
| 2 | Entrada del hero | primera visita, al abrirse el loader | GSAP · `useHeroMotion.ts` | 1,0–2,4 s, `expo.out`; no toca H1 ni bajada | — | nada | — | `clearProps`, `mm.revert` | existe |
| 3 | Scroll del hero | scroll | GSAP ScrollTrigger, *pin* solo con puntero fino ≥ 768×600 | *scrub* 0,6 (pin) / 0,3 | — | nada | — | `mm.revert` | existe |
| 4 | Corona WebGL | cada actualización de scroll | OGL bajo demanda (`wake 700 ms`) | — | — | póster/CSS | — | se duerme sola | existe |
| 5 | Entradas de sección | llega a la línea de lectura | CSS + IO (`Reveal`, `Occult`, `DrawLine`, `LightSweep`) | 0,9 s `--ease-expo`; barrido 1,4 s | — | estado final | — | una vez | existe |
| 6 | Amanecer | entra en pantalla | CSS + IO (`DrawLine` 1,4 s) | 1,4 s | — | estado final | — | una vez | existe |
| 7 | Riel de efemérides | scroll (≥ 1280) | un ScrollTrigger compartido | lectura por frame | — | sin *scrub* | — | `removeEventListener` | existe |
| 8 | Header flota | `data-scrolled` | CSS: `background-color`, borde y color 0,4 s `ease` + blur fijo 16 px | 0,4 s (propuesta: opacidad 200 ms, §3 corrección 3) | — | instantáneo | — | — | existe (verificar costo §8) |
| 9 | **Selector abre** | CTA o llave directa | CSS opacidad + *transform* | fondo 180 ms; superficie 260 ms `--ease-expo` | clic | fade ≤ 150 ms | `open` | al cerrar | **nuevo** |
| 10 | **Fila del selector** | hover/foco | CSS (glifo se llena, `clip-path`) | 220 ms | — | instantáneo | — | — | **nuevo** |
| 11 | **Elegir rubro → luz** | clic en la fila | WAAPI `playOpening` (existente), origen = glifo de la fila | luz a 2230 ms, contenido ≈ 2,7 s | clic o tecla | fade 140 ms | `glint` + `whoosh` (existentes) | `cancel()` | reutiliza |
| 12 | **Prompt EstateOS** | entrada a EstateOS | CSS | 200 ms | — | instantáneo | — | — | **nuevo** |
| 13 | **Cambio de acceso / área** | clic | CSS *crossfade* | 180–240 ms, ≤ 12 px | — | ≤ 150 ms sin desplazamiento | `select` | — | **nuevo** |
| 14 | **Escena de «Qué ofrecemos»** | elegir línea | CSS *crossfade* | 200 ms `--ease-soft`, 8 px | — | instantáneo | — | — | **nuevo** |
| 15 | Abrir demo (capa) | «Ver con guía» | WAAPI `motion.ts` | ver #11 | sí | 140 ms | ídem | ídem | existe |
| 16 | Cerrar showroom | Volver, Escape, Atrás | WAAPI `playClosing` | ≈ 1,4 s (luz 840 ms; eclipse vuelve al hero 900 + 520 ms) | — | 120 ms | `close` | foco al opener o H1 | existe |
| 17 | **Entrada directa por URL** | carga con `?rubro=` | **sin cine** | fade ≤ 150 ms | — | igual | — | — | **nuevo** |

**Reglas:** no hay animación decorativa permanente; nada corre fuera de pantalla (canvas y video en pausa); ninguna animación depende de `animationend` para devolver la accesibilidad (el contenido es usable desde el HTML del servidor); no se convierte WAAPI a GSAP para «uniformar».

## 7. Audio

- Se reutiliza `useSound().play()` con los 10 nombres existentes (`lib/sound/types.ts`). Asignación: selector abre `open`, cierra `close`; fila elegida `select`; diamante `glint`; luz `whoosh`; cambio de área `select`. **Nunca** en hover, scroll ni carga.
- Música: apagada por defecto, preferencia persistida (ya existe). **Mute no se revierte** al cerrar o reabrir.
- Narración (3.4): **el motor no tiene *ducking* hoy** (en `engine.ts` hay bus de música y *master*, sin atenuación por voz). Especificación para 3.4: mientras suena una voz, la música baja a 25 % de su nivel con rampas de 300 ms y vuelve al nivel elegido al terminar; la voz nunca se activa sola.

## 8. Perfil de rendimiento antes/después (definido, **no ejecutado**)

Se reutiliza el arnés de `docs/v3/rendimiento.md` (Playwright + CDP, CPU 4×, 3 rondas A/B intercaladas, configuraciones 390×844, 1024×1366 y 1440×900). Se agregan tres medidas para lo nuevo: **apertura del selector** (tareas > 50 ms, *long animation frames*), **cambio de escena en «Qué ofrecemos»** (estilo y layout por cambio) y **header con blur 16 px vs 12 px** (costo de composición al hacer scroll). Metas del producto: LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms; **son objetivos, no mediciones**. Sin GPU real ni Safari: lo que no se mide en un dispositivo se informa como no medido. Se corre en 1.5.

## 9. Presupuesto visual por viewport

| Recurso | Máximo por pantalla |
|---|---|
| Ámbar sólido | 1 |
| Movimientos principales simultáneos | 2 |
| Superficies con `backdrop-filter` visibles | 2 (header + fondo de un diálogo); **nunca** blur animado |
| Canvas/WebGL | 1, solo el hero; pausado fuera de pantalla |
| Video | 1 en reproducción; póster estático antes de la intención |
| Cursivas ámbar en titulares | 1 por sección, no en todas |
| Escenas con imagen | 1 activa (las demás no se cargan hasta elegirlas) |

## 10. Referencias

Las seis del anexo (Apple iPhone, Linear, Lusion, Stripe, Cuberto, Instrument) y las tres principales (**Apple** para comparar, **Linear** para producto comprensible, **Lusion** para una sola secuencia memorable) **se mantienen como criterio**, con su patrón, costo y límite tal como figuran en Notion. **Límite de esta sesión:** se intentó abrir las seis URL y la política de red del contenedor **rechazó la conexión** (`connect_rejected`); quedan como E0 (documentadas por otra sesión, no reverificadas). Ninguna se copia: ni assets, ni tipografías, ni escenas.

## 11. Rúbrica aplicada al baseline (E2, capturas de esta sesión)

Escala 0–2 por eje; umbral para lo nuevo ≥ 12/14, ningún eje en 0.

| Eje | Puntos | Por qué |
|---|---|---|
| Identidad | 2 | Inconfundible: eclipse-instrumento, serif extremo, luz ámbar |
| Jerarquía | 1 | El hero es claro; Precios es largo y denso (B6) |
| Lectura | 2 | Contraste y tamaños correctos en las capturas |
| Orientación | 1 | Rubros repetidos tres veces (B3); 8 secciones con dos zonas muertas (B5) |
| Móvil | 1 | Sin desborde, pero franja muerta bajo el hero y bloque negro del trailer (B4, B5) |
| Acción principal | 1 | 8 CTA sólidos y un par en la misma pantalla (B1) |
| Movimiento | 2 | Coherente y con *reduced* (no se evaluó la sensación en vivo) |
| **Total** | **10/14** | **Debajo del umbral.** Bloqueantes binarios (foco, Atrás, contraste medido): **no evaluados** en este lote → 1.5 |

**Tres defectos de esta dirección (autocrítica):**
1. La fila «Ecommerce · Próximamente» en el selector puede leerse como promesa incumplida en el primer contacto. Mitigación: oración honesta y D10; riesgo que se mide en la prueba de 5 personas.
2. Academy y Equipamiento **no tienen material** para su escena: dos de cinco previas serán solo texto, y eso debilita «Qué ofrecemos». Antes de 1.2 conviene tener al menos una imagen real por línea, o aceptar el estado honesto.
3. Selector + entrada + acceso agregan pasos frente al chip de un clic actual. Mitigación: la entrada directa del hero (§5.1) y el contrato de URL; se mide en 1.5 contra el baseline.

## 12. Skills

- **`frontend-design`** (smoke, E2): cargó desde `.claude/skills/`, respondió con criterios y **no pidió instalar ni ejecutar nada**. Choques con la marca resueltos por precedencia de `CLAUDE.md` (su lista de «tics» incluye etiquetas mono, filetes y numeración, que en Eclipse son decisión del dueño). Tomado de ella: **no numerar lo que no es secuencia** (§5.2) y **una audacia por pantalla** (§4).
- Emil y GSAP: no se invocaron (la partitura usa los valores del código). Su smoke queda para 1.2, el primer lote que implementa movimiento.

## 13. Criterios de aceptación de 1.4

| Criterio (Notion §12) | Estado | Evidencia |
|---|---|---|
| Seis experiencias reales y tres principales con URL/patrón/costo/no copiar | **Cumplido (E0)**, sin reverificar | §10; red rechazada |
| Cada transición con *fallback*/*reduced*/salto/foco/audio | **Cumplido** | §6 (17 eventos), §7 |
| Tokens y tipos coinciden con el código | **Cumplido, con 3 correcciones** | §3 |
| WAAPI original sigue siendo la base del reveal | **Cumplido** | §6 #11, #15, #16 |
| Evidencia visual y de rendimiento definida sin inventar resultados | **Cumplido** | §2 (E2 real), §8 (definido, no ejecutado) |
| Cada afirmación con evidencia o rótulo | **Cumplido** | niveles E0/E1/E2 en el texto |
| Sin gastos, publicaciones ni cambios de alcance implícitos | **Cumplido** | USD 0; build solo local |
| Contenido previo preservado y lo sustituido documentado | **Cumplido** | §3 (correcciones), §5.7, D8 |

## 14. Ejecutado / no ejecutado · rollback

- **Ejecutado:** `npm ci`, `npm run build` (local), servidor local, capturas (`fullshot.mjs`), medición de CTA ámbar, inspección del HTML exportado, smoke de `frontend-design`.
- **No ejecutado:** perfil de rendimiento, teclado/foco/Atrás, Safari/WebKit, dispositivos reales, prueba con personas.
- **Rollback:** borrar este documento, `docs/v3/capturas/baseline-1.4/` y las líneas agregadas en los registros. `node_modules/` y `out/` están en `.gitignore`.

## 15. Decisiones para Ignacio y handoff

| # | Decisión | Recomendación |
|---|---|---|
| **D8** | Titular del hero: ¿el actual («Antes de hablar, te mostramos tu negocio funcionando») o el del anexo («Tecnología y creatividad para impulsar tu negocio»)? | **El actual** (§3): concreto, *demo-first*, ya probado visualmente |
| **D9** | Fundadores con la oferta **inactiva**: ¿la sección invita igual («Quiero ser fundador»)? | Plegarla dentro de Preguntas y contacto como texto, sin CTA, hasta que haya un programa activo; resuelve B1 y B2 |
| **D10** | Llave directa «Ecommerce» del hero mientras no exista el apartado | Mostrar solo **Inmobiliarias** como llave directa; Ecommerce aparece en el selector como «Próximamente» |

**Siguiente lote:** **1.2 · Home, loader y hero** con **Sonnet · high**. Implementa §5.1, §5.2, §5.3 y §5.7 sobre los componentes existentes y pasa la **puerta estética contra `docs/v3/capturas/baseline-1.4/`** (rúbrica ≥ 12/14 sin ejes en 0). Opus puede volver **solo** como revisión de capturas de 1.2/1.3 si el resultado no llega al umbral.
