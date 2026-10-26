# Eclipse v3 · Fase 0 · Lote 0.1 — Estado real (auditoría documental)

**Fecha de revalidación:** 24/10/2026 (Argentina) · **Base remota:** auditoría del 23/10/2026 · **Alcance:** solo lectura y este documento; no se tocó código de producto, catálogo, assets ni configuración.
**Nivel de evidencia alcanzado:** E0/E1 (documento y código leído). **E2 (prueba local) pendiente**: ver §9.

## 0. Informe en tres líneas

- **Qué cambió:** se revalidó el inventario contra el HEAD real de los cinco repos y la PR #1 (SHA coinciden con la base del 23/10, sin deltas) y se agregó lo que faltaba: botón por botón de Lumen, la lista exacta de ids/campos divergentes FE↔BE, el mapa de anclas y tres contradicciones nuevas (§7, C12, C13 y C14).
- **Qué quedó abierto:** E2 (levantar la web y recapturar el HEAD) no se hizo porque `Eclipse-Web` no tiene `node_modules` y instalar está fuera de este lote; nada de lo descrito como «funciona» está probado en ejecución en este lote.
- **Qué necesitaba el OK de Ignacio (resuelto el 24/10/2026, ver §15):** (1) CTA «Quiero potenciar mi negocio» (C2) · (2) lote 2.2 de reconciliación del catálogo autorizado y EstateOS usa el BE de Eclipse por ahora (C6) · (3) los email kits se rehacen, los viejos se conservan (C12). Gasto de este lote: USD 0.

## 1. Repositorios, ref y cobertura

| Repo | Ref | SHA (HEAD local = base del anexo) | Worktree | Archivos | Cobertura de esta revalidación |
|---|---|---|---|---|---|
| Eclipse-Web | `claude/eclipse-v3-inventory-audit-2ukttn` (base: `main`) | `6bf91aeee275dc7685fad7ce22a1134a8584fe03` (22/10/2026) | limpio al iniciar | 597 | Alta: página, anclas, header, loader, hero, demo-experience, registry, Lumen completo, sonido, contenido/precios, guard FE/BE |
| Eclipse-be | ídem | `37549472d4b4353988cb9f828b8606a84935013e` (12/10/2026) | limpio | 202 | Media: catálogo, auth flag, README, `docs/produccion-hoy.md`, conteo de OpenAPI. No se leyeron controladores ni repositorios |
| Eclipse-internal-portal | ídem | `3907160dae35b50ca8f875c62ee3e170186d1a67` (23/10/2026) | limpio | 129 | Media: README, `docs/integration.md`, `src/live/registry.js` y listado de módulos. No se leyó cada adaptador |
| agents | `main` | `a811427d944500ecfb43234494129e89b19a3b17` | clon superficial, limpio | 162 | Baja: árbol y archivos de la PR |
| agents · PR #1 (draft, abierta, mergeable limpia) | `feature/eclipse-v3-core-agents` → `main` | head `a6ee0c8ea26bc531fc6efe4916e5cd7c62efe770` | — | 7 archivos, +332, 23 commits | Media: se leyó el diff completo de los 7 archivos |
| supplements-ecommerce (Volta) | `main` | `0ae34ddeef588ff866762b0b96ad1995595b638b` | clon superficial, limpio | 2532 | Baja: solo `AGENTS.md` y listado de `docs/` |
| Eclipse-email-kit (no figura en el anexo) | ídem | `9cef2eaf30e20d50222de0d3f55af8d5bf149faf` (20/10/2026) | limpio | 274 | Mínima: cabecera del README |

Las ramas locales de trabajo en Web, BE, portal y email-kit existen solo en la sesión; no hay commits propios previos en ellas. `agents` y Volta se agregaron a la sesión en modo lectura (ver §9).

**Delta contra el anexo:** ninguno en SHA. El delta es de contenido: lo listado en §0 y §7.

## 2. Convenciones

- **Nivel:** E0 documento · E1 código leído · E2 prueba local reproducida · E3 entorno remoto verificado · E4 operación real. Todo lo de abajo es E0/E1 salvo que diga otra cosa.
- **Clasificación:** `existente` (reutilizar tal cual) · `ajustar` (existe, requiere cambio acotado) · `falta` · `simulación` (existe como demo local honesta).
- **Modo:** `demo` (sin backend ni red) / `live` (contra BE). `lib/env.ts` decide en build: `live` solo con `NEXT_PUBLIC_API_BASE_URL` válida **y** `NEXT_PUBLIC_PORTAL_MODE=live`.
- «Probado» significa ejecutado en este lote. No hay nada probado en este lote.

## 3. Inventario de capacidades

Un registro por capacidad. Fuente de cada afirmación: el archivo de la columna 2.

| # | Capacidad | Repo · archivo · símbolo | Modo | Nivel | Clase | Reutilización | Faltante / gate |
|---|---|---|---|---|---|---|---|
| 1 | Home en 8 secciones, hidratación diferida | Web · `app/[locale]/page.tsx` (`LazyHydrate`, `SkyTransition`, `EphemerisRail`) | demo | E1 | existente | Mantener orden e ids | — |
| 2 | Anclas y navegación | Web · `components/layout/navLinks.ts` (`SECTION_IDS`, `NAV_LINKS`, `chromeRoute`) | demo | E1 | existente | No romper ids (§4) | Gateway de 4 accesos no existe (#14) |
| 3 | Loader | Web · `components/loader/Loader.tsx` (`LOADER_HEAD_SCRIPT`, `LOADER_SYNC_SCRIPT`) | demo | E1 | existente | CSS puro, `aria-hidden`, salteable con pointer/key/wheel/touch, omitido en `/portal`; el H1 queda como LCP. No sumar espera a medios | Duración efectiva: pendiente de medición |
| 4 | Hero y corona | Web · `components/hero/{Hero,HeroStage,Eclipse,Dial,HeroCopy,VerticalChips}.tsx`, `corona/`, `useHeroMotion.ts` | demo | E1 | existente / ajustar | Pin solo con `(min-width:768px) and (min-height:600px) and (hover:hover) and (pointer:fine)`; `CORONA_WAKE_MS = 700`; no toca eyebrow/H1/subtítulo; reduced = nada | Rendimiento: `docs/v3/rendimiento.md` tiene mediciones propias de otro SHA, no del HEAD |
| 5 | Header y preferencias | Web · `components/layout/Header.tsx`, `PrefsDisclosure/PrefsPanel`, `usePageCtaInView.ts` | demo/live (enlace «Ingresar») | E1 | ajustar | `data-scrolled`, zonas claras (`data-header-theme="light"`), preferencias agrupadas, modo portal, CTA a outline si hay otro visible | Superficie flotante y CTA largo en móvil (anexo); copy del CTA (C2) |
| 6 | Capa «Ver demo» | Web · `components/demo-experience/{DemoExperienceHost,DemoLayerBody,motion,store,guide}.ts(x)` | demo | E1 | existente | `<dialog>` modal + `lockScroll` + `pushState` de la **misma URL**; Escape y `popstate` cierran; foco vuelve a `data-demo-opener`. Una demo a la vez (`openDemoExperience` ignora si hay una abierta) | **URL compartible por demo: falta** (no hay `searchParams`/hash en `demo-experience` ni en `sections/examples`) |
| 7 | Transición de apertura | Web · `components/demo-experience/motion.ts` (`OPEN`, `playOpening`) | demo | E1 | existente | WAAPI, no GSAP. Confirmado: void 320 · eclipse 560 · moon desde 380 / 620 · diamond 720 · flare 780 · light 1080 / 1150 · rise 1700 / 900 ms. Reduced: 140 ms entrada, 120 ms salida | — |
| 8 | Elección «Ver con guía» / «Ver por mi cuenta» | Web · `DemoLayerBody.tsx` (`tt('withGuide')`), `components/demos/tours.ts`, `<demo>/tour.ts` | demo | E1 | existente | Se ofrece en cada apertura; la guía no arranca sola. Lumen: 6 pasos (`sim, chat, site, pipeline, visits, followups`) | La PR #1 pide «cine opt-in dentro de Ver con guía» (C11): hoy la transición es obligatoria pero saltable |
| 9 | Registro de demos | Web · `components/demos/registry.ts` (`demoLoaders`) | demo | E1 | existente | 6 loaders lazy (ver §5) | — |
| 10 | Kit de demos | Web · `components/demos/kit/*` (`AppShell`, `Kanban`, `Calendar`, `ChatWidget`, `SimBar`, `store.ts: createDemoStore/useStory/usePairedStore/useBeatFocus`) | demo | E1 | existente | Desktop y celular comparten **un** store | — |
| 11 | Calculadora de oportunidad | Web · `components/sections/problem/*`, `lib/calculator.ts` | demo | E1 | existente | Indicativa | — |
| 12 | Precios y armador | Web · `components/pricing/*`, `components/plan-builder/*`, `lib/pricing.ts`, `content/*.json` | demo / live (solo solicitud) | E1 | existente | Ver §6 | Divergencia con BE (§6) |
| 13 | Solicitud de plan al BE | Web · `components/plan-builder/RequestAction.tsx`, `lib/plan-request.ts` (`catalogMismatches`, `buildPlanRequestBody`), `lib/api/endpoints.ts` (`catalog`) | live | E1 | existente | Envía selección, nunca precios. **Se bloquea si `catalogMismatches(catalog).length > 0`** (`RequestAction.tsx:85,101`) | El guard está activo y hoy se dispararía (§6). No tocarlo |
| 14 | Gateway de 4 accesos (Ver con guía / Branding / Intelligence / Academy) | — (solo en la PR #1 de `agents`) | — | E0 | **falta** | Reusar capa «Ver demo» + kit | Fase 3 mínimo; fase 4 consolida |
| 15 | Portal de clientes | Web · `app/[locale]/portal/**` (9 rutas), `components/portal/**`, `components/portal/live/**`, `lib/env.ts`, `lib/portal/routes.ts`, `lib/api/*` | demo / live | E1 | existente | Demo = fixtures «Demo» sin red; live = cookies HttpOnly + CSRF en memoria | No rediseñar en v3. Live necesita BE same-site y SMTP para registro (C5) |
| 16 | Sonido | Web · `lib/sound/{engine,music,types}.ts`, `components/sound/{SoundProvider,SoundContext,SoundToggle}.tsx` | demo | E1 | existente | WebAudio sintetizado, 10 nombres (`tick…error`), apagado por defecto, motor cargado por `import()` al activarlo; música generativa aparte (`music`). **No hay archivos de audio** | Confirmar bus si se agrega narración (no duplicar) |
| 17 | Lumen Propiedades | Web · `components/demos/real-estate/*` | demo | E1 | simulación | Ver §5.1 | Medios fotorrealistas fuera del CRM |
| 18 | Portal interno | Portal · `index.html`, `src/live/{registry,repository,auth}.js`, `modules/*`, `adapters/*` | demo / live | E1 | existente | HTML/CSS/JS nativo, sin build; demo en `localStorage`, live contra BE | Ver §6.3: el README está desactualizado |
| 19 | Backend | BE · Express 5.3.0, Prisma 7.10.0, PostgreSQL, Node `>=22.12 <23`; `src/routes/*`, `prisma/schema.prisma`, `src/docs/openapi.json` (97 paths, 117 operaciones) | live | E1 | existente | Auth cliente y admin separadas, MFA TOTP, solicitudes, proyectos, pagos registrados, CRM, comunicaciones manuales, documentos, importación | Existencia ≠ producción (§6.2). No se verificó que las operaciones de OpenAPI coincidan con las rutas montadas |
| 20 | Volta | `supplements-ecommerce/AGENTS.md`, `docs/` | demo | E1 (solo AGENTS.md) | existente | FE estático pre-seña con `output:"export"`, `/admin-demo/` abierto y ficticio, stores locales `volta-demo:*`; pagos, credenciales y servicios externos prohibidos; plan en `docs/plan-por-fases.md`; Atomic Design + Zustand + `motion/react` | No aplicar el sistema Eclipse encima. No se leyó `plan-por-fases.md` |
| 21 | Agentes v3 | agents · PR #1 (`eclipse-chief`, `eclipse-ux-ui`, `eclipse-marketing`, versión Claude Code y Codex, README) | — | E1 | existente (draft) | Copiar a repos destino solo por PR | Ver C1, C4, C11 |
| 22 | Kit de emails | email-kit · README, `data/offers/volta-2026-10-19.json` | — | E1 (cabecera) | existente | «Revisable localmente, no listo para envío» según su README | C12 |
| 23 | Pruebas | Web · `tests/*.test.ts` (29 archivos, incl. `demo-real-estate-beat-focus`, `demo-re-shop-beats`, `plan-request`), `tests/e2e/{smoke,live}.mjs` | — | E1 | existente | `npm test` = `vitest run`; `typecheck` = `tsc --noEmit` | No ejecutados (§9) |
| 24 | EstateOS / Roofy | — | — | E1 | **falta** | `grep` de `estateos`/`roofy` en `Eclipse-Web` sin resultados; solo existen en la PR #1 de `agents` | No hay repo EstateOS en el listado de repos accesibles (límite: otras cuentas/ramas no inspeccionadas) |

## 4. Mapa de secciones y anclas

Fuente: `app/[locale]/page.tsx`, `components/layout/navLinks.ts`. Los ids no cambian desde v2.

| Orden v3 | Componente | id (ancla) | En header | Contenido conservado (según `docs/v3/inventario.md`) |
|---|---|---|---|---|
| 01 | `Hero` | `#inicio` | — | Promesa, CTA único, chips por rubro |
| 02 | `ExamplesSection` | `#ejemplos` | Demos | 6 demos, número clave, dolor |
| 03 | `ServicesSection` | `#servicios` | Servicios | 6 familias de piezas (sin precios ni «Sumar») |
| 04 | `PricingSection` | `#precios` | Precios | Paquetes / pieza por pieza, mantenimiento, ofertas |
| 05 | `ProblemSection` | `#problema` | — | Calculadora + «Ver la cuenta» |
| 06 | `ProcessSection` | `#proceso` | Cómo trabajamos | 5 etapas con plazo |
| 07 | `FoundersSection` | `#fundadores` | — | Programa fundador |
| 08 | `AgentSection` | `#contacto` | — | FAQ, condiciones, chat del agente, cierre |

`SkyTransition` void→night tras el hero y night→dawn antes de Precios. **Atención:** `docs/v3/inventario.md` describe precios y mantenimiento de v2 (USD 25/79/199, paquetes 150–7.000, ofertas activas). Es un inventario histórico de **bloques**, no de precios vigentes; los vigentes están en `content/*.json` (§6). No se borró ni modificó.

## 5. Las seis demos y sus marcas

Fuente: `components/demos/registry.ts` (loaders) y tabla de `CLAUDE.md`. Solo Lumen fue abierto archivo por archivo; las otras cinco están confirmadas por registry, tests con su nombre y `CLAUDE.md`, no por lectura de sus vistas.

| `DemoId` | Rubro | Negocio ficticio («Demo») | Paleta (contrato) | Código | Tests presentes |
|---|---|---|---|---|---|
| `clinic` | Clínicas | Clínica Aurora | porcelana #F7F4EF · tinta #1D2A2B · teal #127C74 · blush #F2C4B3 | `demos/clinic/` | `demo-clinic-beats`, `demo-clinic-focus` |
| `realEstate` | Inmobiliarias | Lumen Propiedades | piedra #ECE8E1 · tinta #141414 · cobalto #2448C8 · arena #D9CBB3 | `demos/real-estate/` | `demo-real-estate-beat-focus`, `demo-re-shop-beats` |
| `gym` | Gimnasios | Órbita Fitness | #0B0C0F · lima #CCFF33 · rosa #FF3E8A | `demos/gym/` | `demo-gym-beats`, `demo-gym-screens` |
| `shop` | Tiendas | Bruma Tostadores | crema #FBF6EE · espresso #2B1B14 · tomate #E4472B · avena #EADFCB | `demos/shop/` | `demo-shop-beat-focus`, `demo-re-shop-beats` |
| `restaurant` | Restaurantes | Bodegón Lucero | #1A1113 · crema #F3E6D0 · vino #B23A52 · oliva #8C9A4B | `demos/restaurant/` | `demo-restaurant-beats`, `demo-restaurant-focus` |
| `academy` | Academias | Atrio Idiomas | tinta-azul #172338 · tiza #F3F0E6 · cielo #7CC8F5 · salmón #FF9F87 | `demos/academy/` | `demo-academy-beats`, `demo-academy-screens` |

Todas son productos ficticios con estado local, no SaaS desplegados por cliente. La paleta de Lumen no se recolorea con tokens Eclipse.

### 5.1 Lumen Propiedades: estructura y estado

- **Stack interno:** `RealEstateDemo.tsx` (shell `AppShell`, `LAYOUT = {nav:'sidebar', density:'regular', icons:'none'}`), `data.ts`, `story.ts` (`createEstateStore`, `deriveEstate`, `act`), `context.tsx`, `facade.tsx`, `scripts.tsx`, `focus.ts`, `tour.ts`, `ui.tsx`, `real-estate.css`, y 7 vistas en `views/` (Today, Inbox, Pipeline, Visits, Followups, Listings, Site). `usePairedStore('realEstate', createEstateStore)` une desktop y celular en un store.
- **Pestañas:** laptop `today, inbox, pipeline, visits, followups, listings, site`; celular `inbox, pipeline, visits, today, followups, listings` (en celular «Sitio web» abre la vista del comprador como overlay).
- **Datos:** 6 propiedades ficticias (`olmos, ceibo, ribera, colinas, parque, loft`), leads y visitas fijos, 2 asesores (Julia R., Marcos V.). Fachadas y planos son SVG generados por `facade.tsx` (`Facade`, `FloorPlan`, `MapBlock`): **no hay fotos reales ni mapa real**.
- **Historia:** 5 beats que el visitante reproduce desde la SimBar: `inquiry` (5,8 s) · `qualify` (12,8) · `visit` (19,5) · `followup` (24,5) · `reply` (30,5). Nada se reproduce solo.
- **Dependencias externas de Lumen:** ninguna encontrada. En `real-estate/` no hay `fetch`, `XMLHttpRequest`, `WebSocket`, `window.open`, `<a href>`, `<iframe>`, `<img src>` ni `localStorage/sessionStorage`. Los textos vienen de next-intl (`demoRealEstate`, cargado por `DemoMessages`). `listingPath()` arma una URL de texto (`${SITE_URL}/propiedad/<calle>`) que **no es un enlace navegable** en las vistas leídas.
- **Evidencia visual:** ver §8.

### 5.2 Lumen: inventario de controles (botón por botón)

Todos actúan sobre estado local (`store.update(act.*)`, `useState`) o navegan entre pestañas; ninguno llama a red. Nivel E1 (leído, no ejecutado).

| Vista | Control | Acción real | Tipo |
|---|---|---|---|
| Shell | Interruptor «Lumi asiste» (`Switch`, `toggleBot`) en barra y en Inbox | `act.toggleBot`; el llamador reinicia la historia para reproducir la noche con el nuevo valor | local |
| Shell | Botón «Comprador» (`re-buyerbtn`, celular) | abre el overlay del sitio como lo ve un comprador (`ctx.openBuyer`) | local |
| Shell / Kit | SimBar: «Simular: …», omitir, reiniciar, lista de beats (4 botones + panel) | avanza/omite/reinicia beats del store; cada beat lleva cada vista a donde ocurre (`useBeatFocus`) | simulación |
| Hoy | «Ver conversación», «Ver pipeline» (2 `re-link`) | `go('inbox')`, `go('pipeline')` | navegación |
| Hoy / Pipeline | Tablero Kanban (`PipelineBoard` → kit `Kanban` con `onMove`) | arrastrar o «Mover a …» por tarjeta → `act.moveCard(id, columna)` | local |
| Consultas (Inbox) | Chips de respuesta de Carolina (`re-chip`) | `awaiting.pick(step, reply)` | simulación |
| Consultas | Selector de canal (`re-channel`, `aria-pressed`) | `setChannel` | local |
| Consultas | «Dock en vivo» (`re-live-dock`) | `go('pipeline')` | navegación |
| Visitas | Chips de propiedad (`pick`) + «Confirmar» | `act.book({day,start,listing,advisor,via:'calendar'})` + sonido `success`; muestra «solo en este navegador» | local |
| Visitas | Cancelar (`re-iconbtn`) | cierra el formulario | local |
| Seguimientos | `ChatWidget` WhatsApp (chips de respuesta de Carolina) | `act.pickFollow`; compositor decorativo | simulación |
| Propiedades | **Sin controles** (0 `onClick`) | lista de solo lectura con estadísticas | solo lectura |
| Sitio web | Búsqueda: 3 `select` (zona, ambientes, precio máx.) | filtran las 6 propiedades; el `<form>` hace `preventDefault` | local |
| Sitio web | Tarjeta de resultado (`re-result`) | abre la ficha | local |
| Sitio web | Fotos anterior/siguiente (2) | recorre las 3 vistas SVG | local |
| Sitio web | Chips de día y hora + «Confirmar visita» | `act.book({... via:'site'})`; luego «Ver agenda» o «Seguir» | local |
| Sitio web | «Agendar visita», «Consultar», migas, marca y enlaces de navegación (`re-site-navlink`) | cambian de página interna o abren el chat | local |
| Sitio web | Lanzador del chat de Lumi, cerrar (×2), «Atrás» (×2), botón WhatsApp (`re-wabtn`) | chat propio (`act.ownPick`, responde al instante) o pantalla de WhatsApp simulada (`setScreenOv`) | simulación |

Los kits compartidos (`AppShell`, `Kanban`, `Calendar`, `ChatWidget`, `SimBar`) tienen más controles que no se enumeraron uno por uno.

## 6. Catálogo FE ↔ BE (sin tocar contratos)

Método: script de solo lectura (`node --experimental-strip-types`) que importa `COMMERCIAL_SNAPSHOT` de `Eclipse-be/src/plans/catalog-data.ts` y compara con `Eclipse-Web/content/{items,plans,maintenance,offers}.json`. El script quedó en el scratchpad de la sesión y no se versiona. Precios en USD; BE guarda centavos.

### 6.1 Divergencias

**Precios de piezas (FE vigente → BE):** `landing` 500→250 · `web-multi` 500→450 · `seo` 500→150 · `trailer` 500→250 · `turnos` 750→400 · `pedidos` 750→400 · `dashboard` 750→400 · `crm` 750→600 · `gamificacion` 500→700 · `chatbot` 750→350 · `voz` 750→600 · `marketing` 500→400 · `auditoria` 500→150.

**Ids solo en FE:** `whatsapp`, `migracion`, `catalogo`, `app-fase`, `asesoria-growth`, `asesoria-economica`, `asesorias`.
**Ids solo en BE:** `automatizacion`, `ecommerce`, `app-ondemand` (FE los conserva como retirados en `content/legacy.json`, junto con los planes `diagnostico, presencia, voz, automatiza, sistema, comercio, plataforma` y el mantenimiento `crecimiento, escala`).

**Planes:** FE tiene `adaptacion` (500) y `pack` (700, `validate`, `careCredit` 3×30). BE tiene los 7 planes históricos (rangos 150–250, 250–400, 500–700, 400–700, 1.000–1.500, 2.000–3.500, 4.000–7.000) y ninguno de los dos de FE.

**Mantenimiento:** FE `esencial` 30 (+5 terceros) · `conectado` 75 (+15) · `ia` 150 (+40), 2 h/mes. BE `esencial` 25 · `crecimiento` 79 · `escala` 199. `annualMonthsCharged` = 10 en ambos. BE además publica `voiceUsage` 49/mes; FE no tiene tarifa de voz (el guard lo señala como `voice: usage fee`).

**Ofertas:** BE tiene `founder` (−20 %), `combo-voz` (voz a 300), `annual` y `referral` **activas**. FE las tiene las cuatro **inactivas** (históricas). `founders.total` = 5 en ambos; ids de `goals` y `verticals` coinciden (7 y 7).

**PR abierto del BE (hallazgo posterior, §18):** `Eclipse-be#10` cambia este snapshot a la versión del reto del 13/10, que tampoco coincide con la tarifa del 16/10 (mantenimiento 20/40/100 en vez de 30/75/150). Esta comparación describe `main`.

**Qué lado está al día:** el tarifario aprobado de Notion («Ofertas y precios», actualización del 16/10/2026: adaptación 500, pack 700, planes 30/75/150 con terceros 5/15/40 y 2 h, seña 50/50, 3 meses bonificados) coincide con el **FE**; el que está desactualizado es el snapshot del **BE**. Las inclusiones nuevas (USD 199, Studio) siguen siendo hipótesis no aprobadas.

**Efecto:** `catalogMismatches()` devolvería una lista no vacía, así que «Enviar solicitud» en modo live **está bloqueado por diseño** contra este BE. La prueba `tests/plan-request.test.ts` solo comprueba que no hay divergencia cuando el catálogo se arma desde `/content`; no valida contra este snapshot de BE.

### 6.2 Qué se puede y qué no afirmar del backend

- Existe código real: auth, MFA, solicitudes, proyectos, pagos registrados, CRM, comunicaciones, documentos e importación, con OpenAPI de 97 paths / 117 operaciones.
- **No** hay evidencia de producción: `README` dice `AUTH_ENABLED=false` por defecto, «no hay deploy automático» y que las sesiones admin viven en memoria (una sola instancia). `docs/produccion-hoy.md` es una **guía** («no ejecuta nada por sí sola») con pasos de Render/Neon, no un registro de despliegue. Que `api.eclipse-business.com` responda no fue comprobado (E3 pendiente).
- Mientras `SMTP_ENABLED=false`, los clientes no pueden registrarse (lo dice la propia guía). El README del BE además exige `AUTH_ENABLED=true` para activar SMTP.

### 6.3 Portal interno: README vs. código

`README.md` dice que en live «están conectadas Solicitudes, Proyectos, Cobros y una versión parcial de Hoy; el resto muestra “todavía no está conectada”». `docs/integration.md` (tabla «Estado de los módulos») y `src/live/modules/*.js` dicen otra cosa: **todos los módulos de `MODULES` declaran `status: "live"`** (core, hoy, solicitudes, proyectos, cobros, planner [calendario, metas, herramientas], prospectos, lotes, comunicaciones, documentos, importar, actividad), más `pending.js`. Bitácora es «hecho con alcance parcial» (el BE no tiene bitácora global). Registro: el README está atrasado; la fuente más fiable es `integration.md` + los módulos, **sin ejecución**. Conectado en código ≠ operativo.

## 7. Contradicciones, ordenadas por jerarquía del propietario

Orden de precedencia: instrucción expresa de Ignacio → Eclipse v3 → Contexto/Agency (sujeto a correcciones) → tarifario aprobado → código.

| # | Contradicción | Resolución | Estado |
|---|---|---|---|
| C1 | Cuatro unidades históricas vs. cinco líneas transversales. **Evidencia nueva:** en la PR #1 la versión Claude Code de `eclipse-ux-ui.md` aún dice «cuatro recorridos (SaaS, Agency, Studio, Equipamiento)» y la versión Codex dice «cinco líneas (…Academy…)» | Cinco líneas, Intelligence transversal; Handy aparte. Corregir la versión Claude Code de `eclipse-ux-ui.md` en la PR | Abierto (archivo de otra PR) |
| C2 | CTA: el código y `CLAUDE.md` dicen «Pedí tu demo» (`messages/es.json:85`) y prohíben «potenciá»; el anexo dice que prevalece «Quiero potenciar mi negocio». `grep` de «potenciar» en `messages/es.json`: 0 resultados. La captura histórica muestra «Quiero esto para mi negocio» (`wantThis`, `es.json:5443`) en la capa de demo | Ignacio aprobó el CTA nuevo el 24/10/2026 (§15). No se cambió copy en este lote | **Resuelto: decisión; implementación pendiente** |
| C3 | Nueve fases técnicas históricas vs. cinco macrofases y 28 lotes | Prevalecen las cinco macrofases | Resuelto (E0) |
| C4 | Sonnet exclusivo / Opus por arquitectura vs. «Opus según necesidad, sin límite fijo de dos». La PR #1 dice «inicialmente dos intervenciones» y «Opus NO se auto-invoca» | Prevalece la instrucción actual; Chief registra motivo y consumo; gasto extra con su gate | Resuelto (E0) |
| C5 | «Backend pendiente» (Notion) vs. código existente | Existe código; producción sin comprobar (§6.2) | Resuelto (E1) |
| C6 | Catálogo FE (500/700, 3×30, 50 % seña) vs. BE (planes históricos, 25/79/199, ofertas activas) | Registrado en §6.1; **no sincronizar ni saltar el guard**; reconciliar contra tarifa aprobada con compatibilidad histórica en 2.2 (autorizado el 24/10/2026, §15) | **Autorizado; sin ejecutar** |
| C7 | Mantenimiento aprobado 30/75/150 (terceros 5/15/40, 2 h) vs. propuesta 30/75/150/199 + Studio/Academy | Conservar lo vigente; el 199 y nuevas inclusiones esperan margen | Abierto (hipótesis) |
| C8 | EstateOS «desde USD 50/mes» (así figura en las secciones 03 de los prompts 0.1–0.3 de Notion) | **Supersedida el 24/10/2026** (Contexto Eclipse, «Ofertas y precios», lote 2.3): dirección del propietario Contact 30 · Growth 75 · Escalar 100 · Hípergrowth 150 · Deluxe 200 USD/mes; Partner 500 y todos los cupos son **propuesta** pendiente de costeo. Es un catálogo sectorial distinto del general 30/75/150: mismo importe no implica misma oferta, y los contratos emitidos se conservan. Los prompts 0.1–0.3 de Notion aún citan el «50»; ver §16 | Resuelta (E0); economía sin validar |
| C9 | Inteligencia nacional privada ≠ demo inmobiliaria pública | Fixtures separadas; cero arrastre de compradores reales | Resuelto (regla) |
| C10 | Gateway mínimo en fase 3; fase 4 consolida | No bloquea la primera venta | Resuelto (E0) |
| C11 | Contrato actual: explorar libremente y «Ver con guía/por mi cuenta» en cada apertura; PR #1 y anexo: cine opt-in dentro de «Ver con guía», sin autoplay | Hoy el cine no es opt-in (se reproduce al abrir, saltable con click/tecla); cambiarlo es un lote futuro, no de este | Abierto |
| **C12** (nuevo) | `Eclipse-email-kit` presenta precios con «referencia tachada» y «50 % de descuento» (ARS 750.000 → 375.000) y fue pensado para Volta. `CLAUDE.md` de Eclipse-Web prohíbe tachados, «antes $X» y solo admite ofertas de `content/offers.json`. Su README declara «no listo para envío» | No mezclar con Eclipse-Web. Ignacio decidió el 24/10/2026 (§15): se rehacen todos los email kits, los actuales se conservan sin tocar. No se tocó nada en este lote | **Resuelto: decisión; trabajo pendiente** |
| **C13** (nuevo) | `docs/v3/inventario.md` lista precios, paquetes y ofertas de v2 como si fueran el estado del sitio; el código vigente tiene otros (§6) | Mantener como inventario histórico de bloques (esta auditoría no lo edita) y no citarlo para precios | Registrado |
| C14 (nuevo, menor) | `AGENTS.md` de Web pide leer `node_modules/next/dist/docs/` antes de usar APIs de Next; `node_modules` no existe en este entorno | No hay API de Next que usar en este lote; el límite queda declarado | Límite |
| **C15** (nuevo) | Notion (Contexto y Portal interno, decisión 07/10/2026): comunicación al cliente por **WhatsApp manual, sin SMTP**. BE: el registro de clientes, la verificación de email y la recuperación de contraseña dependen de `SMTP_ENABLED`, y `docs/produccion-hoy.md` deja el portal de clientes live «para después» por falta de correo | Hay que decidir en el SDD del portal cliente si el live espera SMTP o se define otro método de alta (no investigado). No es de este lote | Abierto |
| **C16** (nuevo) | Notion tarifario: la tabla del 14/10 da USD 50 de complemento para landing; la actualización del 16/10 (que prevalece) da USD 200. FE usa 200 (`items.json`) | Sin acción: FE sigue la fuente que prevalece | Registrado |

## 8. Evidencia visual (histórica, no del HEAD)

- `docs/v3/capturas/fase2/despues/demo-inmobiliarias.jpg` (commit `0dc8f87`, 04/10/2026): Lumen en capa de demo. Se ve la composición editorial: serif para «Oficina cerrada. *Lumi atiende.*», cifra «100 %» en cobalto, filetes finos, esquinas rectas, sidebar con índice 01–07 sin íconos, tablero con 4 etapas, y a la derecha el celular con la ficha «Olmos 1420 · USD 168.000». Etiquetas «ESCRITORIO / CELULAR» independientes, sin marcos de dispositivo. Barra superior: «Volver», insignia «DEMO», «Ver con guía» y «Quiero esto para mi negocio».
- `docs/v3/capturas/fase3/despues/escritorio-1-apertura.jpg` (commit `9df7aa1`): tira de 6 fotogramas de la apertura: hero → eclipse centrado → anillo de diamante → luz que inunda → pregunta «¿Cómo la querés ver?» con «Ver con guía / Ver por mi cuenta» sobre la demo (en la captura, Clínica Aurora).
- **Interpretación visual (no medición):** la jerarquía, la identidad propia de Lumen y la legibilidad en escritorio se ven bien. No se puede juzgar CTA en móvil, foco ni movimiento real desde imágenes fijas.
- **Gate visual adversarial:** sin baseline ejecutable de este HEAD, no hay comparación; no se registra ningún criterio como «peor» ni «mejor». LCP ≤ 2,5 s, CLS ≤ 0,1 e INP ≤ 200 ms son objetivos de producto; `docs/v3/rendimiento.md` contiene ensayos de laboratorio propios de otro SHA, sin dispositivo de campo ni p75. Su tabla Lighthouse móvil para `/es/` da v2 → v3: TBT 360–440 ms → 230–320 ms, CLS 0 en ambos, pero **LCP 2,9–5,0 s → 3,5–3,8 s, por encima del objetivo de 2,5 s**. Es una medición de laboratorio histórica, no del HEAD; queda como dato abierto para 1.5.

## 9. Límites y lo que no se probó

- **E2 pendiente:** `Eclipse-Web` no tiene `node_modules`; levantar la web requiere `npm ci`, que este lote excluye. No se ejecutó `npm test`, `typecheck`, `lint`, `build`, e2e, ni se tomaron capturas. Acción para 1.5 / quien tenga el entorno: `npm ci` → `scripts/dev.sh 3200` → `node scripts/shot.mjs http://localhost:3200/es/ <outDir> --widths=360,1440`.
- Ninguna pantalla se abrió en un navegador; el comportamiento descrito sale de leer código.
- Cinco de las seis demos no se leyeron vista por vista; BE y portal interno se leyeron en sus puntos de entrada, no completos; Volta y email-kit apenas en cabecera.
- No se revisó `.env*` ni secretos. Notion se leyó después de la primera versión de este documento, el 24/10/2026 (§16). El dossier de Sales Intelligence no apareció en el portal interno (ramas: solo `main` y la de trabajo); según Notion sus ramas `docs/sales-intelligence-ar-lote-0` son locales y sin push, así que no se pueden recuperar desde este entorno.
- `agents` y Volta se agregaron a la sesión por `add_repo` (lectura); no se escribió en ellos.
- Cobertura de «47 repos accesibles»: no se re-listó; se consultó `list_repos` solo por nombre (`agents`, `supplements-ecommerce`).
- Palabras «probado / live / desplegado»: este documento no afirma ninguna de las tres como hecho. «Live» aparece solo como modo de código.

## 10. Archivos para el lote 1.1 (lista acotada)

1. `Eclipse-Web/app/[locale]/page.tsx`, `components/layout/navLinks.ts`, `components/layout/Header.tsx` — anclas y CTA.
2. `components/demo-experience/{DemoExperienceHost.tsx,store.ts,motion.ts,DemoLayerBody.tsx,guide.ts}` — apertura, historial y la futura URL compartible.
3. `components/demos/{registry.ts,types.ts,README.md}`, `components/demos/kit/*`, `components/demos/real-estate/*` — base del piloto.
4. `components/sections/examples/*` — selector de demos.
5. `content/{plans,items,maintenance,offers,legacy}.json`, `lib/{pricing,plan-request}.ts` — tarifas y guard (solo lectura hasta 2.2).
6. `lib/sound/*`, `components/sound/*` — audio (preservar preferencia).
7. `Eclipse-be/src/plans/{catalog-data,catalog,pricing}.ts` — catálogo (solo lectura hasta 2.2).
8. `Eclipse-internal-portal/src/live/{registry,modules/index}.js` y `docs/integration.md` — estado interno.
9. `agents` PR #1: `eclipse-v3-agents/README.md`, `eclipse-ux-ui-claude-code/claude-code/agents/eclipse-ux-ui.md` (C1).

## 11. Ruta de reutilización

Loader, hero, header, capa «Ver demo», kit de demos, Lumen (acciones y estados), sonido y portal cliente existen y se reutilizan. Lo nuevo que Lumen/EstateOS necesita va **fuera** del CRM: gateway de 4 accesos con deep links, llegada aérea, fachada fotorrealista, recepción, marketing/branding/Academy específicos, mapa MDP honesto y escena de salida (todos `falta`). Sin Three.js, Lenis, otro CRM, proveedor ni DB nuevos.

## 12. Flujos clave (entrada · acción · salida · error · vacío · recuperación)

| Flujo | Entrada | Acción | Salida | Error / vacío | Recuperación |
|---|---|---|---|---|---|
| Abrir demo | Chip del hero o botón de `#ejemplos` | `openDemoExperience` → `<dialog>`, `pushState` misma URL | Capa con vistas desktop y celular + elección de guía | Si ya hay una abierta, se ignora; chunk lazy que no carga: no verificado | Volver / Escape / Back restauran scroll y foco |
| Reproducir historia | SimBar «Simular: …» | beat a beat; `useBeatFocus` lleva cada vista | Estado final quieto | Sin beats alcanzados: «Reiniciar» deshabilitado | «Reiniciar» (store) |
| Armar plan y pedir | Armador → resumen | `RequestAction` → `POST` de selección al BE | Confirmación | Divergencia de catálogo: bloqueado (§6.1); sin BE/modo demo: flujo WhatsApp | Copiar link/resumen y WhatsApp (`lib/whatsapp.ts`) |
| Portal cliente demo | `/[locale]/portal/` | Login ficticio, fixtures «Demo» | Lista y detalle | Sin red por diseño | «Salir de la demo» |
| Portal cliente live | Login cookies + CSRF | `lib/api/*`, un refresh + un reintento ante 401 | Datos reales del BE | Sin sesión / sin permiso: pantallas `NotLive`/`DemoOff` | Reingresar |

## 13. Criterios de aceptación (estado)

- [x] Cinco repos y la PR con SHA/ref/cobertura anotados (§1; email-kit como extra).
- [x] Cada capacidad con clasificación y archivo exacto (§3).
- [x] Seis demos y marcas mapeadas (§5; solo Lumen leído a fondo).
- [x] Discrepancia FE/BE registrada sin alterar contratos (§6).
- [x] Backend no presentado como inexistente ni como producción certificada (§6.2).
- [x] Cada afirmación de funcionamiento tiene evidencia de código o está rotulada como no probada (§9).
- [x] Sin gastos, publicaciones ni cambios de alcance. Único cambio: este documento.
- [x] Contenido previo preservado; `docs/v3/inventario.md` no se editó (C13).

## 14. Consumo y rollback

Modelo configurado: Claude Sonnet 5.5, una sesión, sin reintentos de corrección, sin subagentes. Uso visible de cuenta: no medido. Gasto externo: USD 0. Hora de inicio/fin: no registrada por la sesión. Rollback: borrar este archivo; no hay otro cambio.

**Próximo paso concreto:** cerrar 0.1 con la aceptación de Ignacio sobre E1 o, si se prefiere E2, con las capturas del HEAD (comando en §9).

## 15. Decisiones de Ignacio (24/10/2026, en la conversación de esta sesión)

Registro, no ejecución: ninguna de estas decisiones se implementó en este lote.

1. **CTA (C2):** aprobado el CTA nuevo «Quiero potenciar mi negocio». Queda por definir en el lote que lo implemente: en qué lugares reemplaza a «Pedí tu demo» (header, hero, `data-page-cta`) y si afecta a «Quiero esto para mi negocio» (`wantThis`) de la capa de demo; versiones en/pt; y actualizar la regla de `CLAUDE.md` que prohíbe «potenciá» (que ahora contradice esta decisión). Supersede la regla de copy anterior; fuente: Ignacio, 24/10/2026.
2. **Catálogo (C6):** se autoriza el lote 2.2 (reconciliar el catálogo BE con la tarifa aprobada, con compatibilidad histórica). ~~EstateOS usa el BE de Eclipse por ahora.~~ **Reemplazado el mismo día (24/10/2026, Ignacio):** EstateOS tendrá un BE **distinto** del de Eclipse, por seguridad. EstateOS es solo una demo: si el visitante elige un plan de pago, se lo deriva a la app de Eclipse. Quedan abiertas, sin decidir acá: (a) **cuándo** existe ese BE: el anexo C de 2.3 define S0 (demo pública, comparador y configurador sin checkout) como entregable sin backend y reserva el aislamiento multiempresa y los datos reales para S1; hoy no hay evidencia de que S0 necesite BE; (b) **costo e infraestructura:** Render + Neon son por proyecto y el plan Hostinger actual no admite Node.js (Contexto Eclipse); un BE nuevo es infraestructura nueva y necesita gate de gasto separado; (c) **dónde aterriza el pedido de plan:** si se deriva a la app de Eclipse, el BE de Eclipse tendría que reconocer un catálogo sectorial EstateOS o recibir un pedido genérico: es una decisión de 2.2/2.3; (d) el guard de catálogo y `AUTH_ENABLED`/SMTP siguen como en §6. No se creó ni se provisionó nada. **Actualización del mismo día:** EstateOS no necesita BE (§17.1).
3. **Email kits (C12):** se rehacen todos; los viejos se conservan sin modificar; se crean kits nuevos para Eclipse y para EstateOS. Los nuevos deberán respetar las reglas de honestidad de Eclipse (sin precios tachados ni «antes $X», solo ofertas de `content/offers.json`). Pendiente de SDD propio; no es parte de 0.1.
4. **Cierre de 0.1 (24/10/2026, Ignacio):** «cerramos 0.1». Cierre en cobertura E1; el E2 (capturas del HEAD) queda para 1.5. No se marcó nada en Notion.

## 16. Lectura de Notion (24/10/2026)

**Leído por mí:** «Eclipse v3» (índice), Contexto Eclipse, Eclipse Agency (índice), Ofertas y precios, Modelos y control de consumo, Orden de ejecución, Referencias históricas 00–08, páginas de Fase 0–4, lotes 0.1, 0.2, 0.3, 0.4, 1.1, 2.2, 2.3 (con anexos A y C), Landing UX/UI v3, Portal interno v3, Sales Intelligence Lote 0.
**Leído por un subagente** (resumen de segunda mano, no verificado línea por línea): lotes 1.2–1.5, 2.1, 2.4, 2.5, 3.1–3.9, 4.1–4.5, anexo B (bienvenida), biblia/escenas y «Stack · skills, mods y plugins».
**No leído:** las 12 fichas de escena 00–11 de la biblia, «Inventario interno» y «Diseño premium» de Stack, «Auditoría de skills» (0.3).

**Programa (orden de ejecución, un lote activo por vez):** 0.1 → 0.2 → 0.3 → 0.4 → 1.1 → 1.4 → 1.2 → 1.3 → 1.5 → 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 3.1 … 3.9 → 4.1 … 4.5. Son documentales 0.1–0.4, 1.1, 1.4, 2.1, 2.3–2.5, 3.1 y 4.3–4.5; producen cambios locales en rama (o assets, con gasto aparte) 1.2, 1.3, 1.5, 2.2, 3.2–3.9, 4.1 y 4.2; en ningún caso hay merge ni deploy. Modelo por defecto Sonnet; Opus high solo en 3.1 (y en la revisión O2 de 3.9). Gates de gasto y publicación separados en todos.

**Qué consume de este inventario cada lote cercano:**
- **0.2 (agentes y PR #1):** revisión documental de los seis archivos de la PR, corrección de «cuatro líneas» a cinco, RACI, política Opus consolidada y prueba en papel de cinco rutas. No edita la PR.
- **0.3 (skills):** manifiesto de instalación, sin instalar nada.
- **0.4 (SDD y control financiero):** contrato base, ledger y matriz de modelos y gates. Cierra Fase 0; recién entonces arranca 1.1.
- **1.1:** mapa de contenidos, wireflows y contrato de URL (`?rubro=inmobiliarias&vista=…&area=…`, propuesto). Un único propietario de `History`.
- **2.2:** conciliación FE/BE (ya autorizada); carril A catálogo aprobado, carril B comparador v3 solo borrador.

**Tensiones nuevas entre Notion y el código o `CLAUDE.md` (registro, no resolución):**

| # | Tensión | Qué hay que decidir y dónde |
|---|---|---|
| C17 | **BE propio de EstateOS vs. diseño de Notion.** 2.3 (anexo C), 2.5 y 4.1 suponen un único BE y un único catálogo: el CRM interno de Eclipse recibe los leads de EstateOS, el catálogo versionado alimenta panel y configurador, y el micrositio vive dentro de Eclipse-Web. La decisión de Ignacio del 24/10 (BE separado, pago derivado a la app de Eclipse) no figura en ninguna página | Reflejarla en 0.4 (SDD) y 2.3; definir dónde aterriza el pedido de plan. Mientras tanto, S0 (demo, comparador, configurador sin checkout) no necesita BE |
| C18 | **Bienvenida ES-INTRO (2.3 anexo B, 3.5) vs. contrato de demos de `CLAUDE.md`.** ES-INTRO reproduce en la primera visita y guarda una preferencia local de «ya vista»; `CLAUDE.md` dice que nada se reproduce solo, que nada se recuerda y que en cada apertura se ofrece «Ver con guía / Ver por mi cuenta». Notion lo acota (muda, saltable, enlace directo la omite) pero el conflicto con «nada se recuerda» queda abierto | Decisión de Ignacio antes de 3.5; actualizar `CLAUDE.md` si se aprueba |
| C19 | **CTA en 1.2:** el primario «Quiero potenciar mi negocio» y el secundario «Ver opciones» abren el selector, no WhatsApp; «Armá tu plan» no aparece. `CLAUDE.md` define «Pedí tu demo» como CTA primario y «Armá tu plan» como secundario. Orden de home de Notion (qué ofrecemos → PyME → precios) distinto del actual | Aprobado el texto del CTA (C2); falta aprobar el reparto de CTAs y el orden de home en 1.1/1.2 |
| C20 | **Texto desactualizado dentro de Notion:** el «EstateOS desde USD 50» sigue en los prompts 0.1–0.3, 1.2–1.5, 2.1 (incluido el cuerpo), 3.2, 3.3, 3.7 y 4.2–4.5; los lotes 2.4, 2.5, 3.4–3.6, 3.8, 3.9 y 4.1 ya tienen la revisión del 24/10 | Limpiar en Notion; este documento sigue la revisión del 24/10 (C8) |
| C21 | **Opus:** la política general dice «sin límite fijo de dos»; 3.9 describe O2 como «la segunda y última intervención Opus planificada» | Prevalece la política general; ajustar 3.9 |
| C22 | **Selector de dos rubros (Inmobiliarias, Ecommerce)** vs. seis demos en el sitio y Volta/Velmar externos | Notion lo fija en dos hasta nueva decisión comercial (4.2); no hay conflicto de código, sí de alcance visible |
| C23 | **Notion asume auth y entitlements activos** («suscriptor», «plan activo», Academy privada verificada en servidor) mientras `AUTH_ENABLED=false` por defecto y no hay modelo de suscripción | Notion lo difiere a una entrega posterior (S1); no entra en el piloto |

**Datos de Notion que conviene tener a mano (no verificados en este lote):**
- Candidatos del lote comercial 3.9: cinco inmobiliarias de Mar del Plata, sin contactar y no calificados. No se transcriben acá.
- Costos ilustrativos de Higgsfield, ElevenLabs y Suno en 3.3/3.4 son precios públicos observados por otra sesión, no cotizaciones de la cuenta; no autorizan gasto.
- El dataset municipal de barrios devolvió 403 y la licencia de las capas IGN no está demostrada (Sales Intelligence Lote 0; 3.8). El mapa de barrios de 3.8 queda bloqueado hasta resolverlo.
- `AGENTS.md` de Volta cita `docs/panel-demo.md`, que según 4.5 no existe en HEAD; no verificado por mí.

## 17. Decisiones de Ignacio, segunda tanda (24/10/2026)

Registro de decisiones; ninguna está implementada. Fuente: conversación de esta sesión.

1. **EstateOS no necesita BE** (supersede §15.2). Es una demo con fixtures y estado local. Si el visitante elige un plan de pago, se lo deriva a la app de Eclipse. Si en el futuro hiciera falta un BE propio (datos reales de una inmobiliaria cliente), sería separado del de Eclipse. Cierra C17 en lo que respecta a S0.
2. **Bienvenida (C18, resuelto):** al entrar a EstateOS aparece un modal con «Ver con guía» y «Ver por mi cuenta». «Ver con guía» activa todo el teaser. Si el usuario ya lo vio, queda `localStorage` con «visto = true» y no se le muestra de nuevo salvo que pida verlo desde cero. Esto reemplaza, para EstateOS, la regla de `CLAUDE.md` de que nada se recuerda. *Interpretación a confirmar en 3.5:* con «visto = true» se omite el modal y se entra en modo libre, con un botón visible «Ver presentación» para repetirla; la clave sería versionada (propuesta: `eclipse:estateos:intro-seen:v1`) y la lectura de storage va en `try/catch`.
3. **CTA (C19):** se aplica el diseño ya acordado de Notion 1.2: primario «Quiero potenciar mi negocio» y secundario «Ver opciones», ambos abren el selector. «Armá tu plan» deja de estar en el header pero el armador sigue alcanzable desde Precios (no se borra contenido comercial).
4. **Demos (C22):** las demos que no entran al selector quedan **ocultas y en standby dentro de este repositorio**, para reutilizarlas después en otros repositorios como productos por tipo de comercio. No se borra código, copy ni tests. Esto supersede, para esas demos, la regla de `docs/v3/inventario.md` de que todo contenido v2 sigue alcanzable. *A confirmar:* visibles = Inmobiliarias (Lumen) y Ecommerce; en standby = clinic, gym, restaurant y academy. Falta definir qué es «Ecommerce» (Bruma interna o Volta/Velmar externos).
5. **Alcance (C23):** se construye todo el programa; los planes muestran como «objetivo» lo que aún no existe. Los gastos externos (3.2–3.4) siguen necesitando un tope numérico en USD cuando lleguen.
6. **CI/deploy y permisos de trabajo:** puedo correr `npm ci`, tests y build yo mismo; hago commits y merges; los PRs los aprueba Ignacio; se lleva una lista de merges (§18).
7. **Copy y `messages/drafts/`:** ver §18; por defecto se edita `messages/*.json` directamente con un solo ejecutor.
8. **Opus (C21):** no es el modo por defecto. Se usa solo en hitos justificados para elevar la estética. La estética del CRM y de la web se mantiene o mejora respecto de las líneas base; si una versión se ve peor que su baseline, no se mergea. Motivo: mala experiencia previa con TableFlow (uso excesivo de Opus con resultado estético deficiente).
9. **Catálogos separados (C13):** Esencial 30 (general) y Contact 30 (EstateOS) son ofertas distintas; igual Partner 500 y la adaptación de 500. A Ignacio le gusta Esencial y le gusta mucho más Partner. *Partner 500 y sus cupos siguen como propuesta hasta una aprobación explícita de precio y alcance antes de publicarlos.*
10. **SMTP (C15, resuelto en dirección):** SMTP será el canal de mensajes automáticos y el respaldo cuando el usuario no lea WhatsApp; más adelante se automatiza WhatsApp junto con SMTP. Esto reemplaza la decisión del 07/10 de «WhatsApp manual, sin SMTP». No se activó nada: elegir proveedor, costo y `AUTH_ENABLED` requieren su propio gate de gasto.
11. **Fechas y capacidad:** no se planifican; se ejecuta lote por lote.
12. **Incoherencia de 1.4 (corregida en Notion):** el lote 1.4 se acepta *antes* de 1.2 y 1.3 (el índice lo dice), pero la página 1.3 decía que 1.3 «habilita 1.4 integración de motion», lo que lo hacía circular. Se corrigió en la página del lote 1.3: ahora dice que 1.3 habilita 1.5 y que el movimiento se integra en 1.3 siguiendo la especificación de 1.4.
13. **«EstateOS desde USD 50» (C20):** se trata como superado por los precios del 24/10 en toda ejecución. Notion conserva el texto viejo en unas 15 páginas de lote; no se editó.

## 18. CI, deploy y PRs abiertos (leído del repo y de GitHub Actions, 24/10/2026)

**CI automático.** GitHub Actions corre solo en cada PR y en cada push a `main`; nadie lo corre a mano.
- Web (`hostinger.yml`, `deploy.yml`): `npm ci`, test, lint, build, typecheck. **Solo se disparan en PR hacia `main`:** un PR hacia una rama de integración no tendría CI en Web.
- BE (`ci.yml`): audit, format, lint, typecheck, build, tests y tests contra PostgreSQL 17, en cualquier PR.
- Portal interno (`checks.yml`): tests y Playwright, en cualquier PR.
- email-kit: solo Pages.

**Deploy.** Un push a `main` publica automáticamente: en Web, a GitHub Pages (demo, `/Eclipse-Web`) y a Hostinger (`eclipse-business.com`, build en modo `live` contra `api.eclipse-business.com`); en el portal interno, a Hostinger y a Pages. Hostinger hace respaldo previo, publica por SSH verificado, comprueba la raíz, el portal y la salud de la API, y restaura el respaldo si algo falla. Los PR solo construyen, nunca publican. **El BE no tiene workflow de deploy**; su publicación depende de Render (configuración no verificada).
- *Evidencia de ejecución:* en Web, el run #4 sobre `main` (`6bf91ae`, 22/10/2026 19:01–19:03 UTC) terminó en éxito con el job `deploy` completo («Upload, back up, and publish»); el run #2 (PR #13) había fallado antes y se corrigió con el PR #14. En el portal interno, el deploy corrió con éxito el 23/10 por `workflow_dispatch`. Es evidencia del log de Actions; no se verificó el sitio publicado.

**Consecuencia para trabajar:** *cada merge a `main` en Web o en el portal interno publica en producción.* Regla operativa propuesta: cada lote va en una rama; se integra en una rama de integración `feat/eclipse-v3`; un PR único de integración a `main` lo aprueba Ignacio; solo después hago el merge a `main`. Antes de cada merge a la rama de integración corro localmente `npm ci`, test, lint, typecheck y build (porque ahí no hay CI en Web). Llevo la lista de merges más abajo.

**PRs abiertos relevantes (no míos):**
- **Eclipse-be #10** «Reto 13/10: catálogo versionado y contratación pre-proyecto» (no draft, mergeable, CI verde el 23/10): agrega el catálogo `eclipse-reto-2026-10-13-v2`, contratación pre-proyecto y migración aditiva. Su descripción dice que el deploy espera tu OK explícito y un orden: backup/restore de staging → migración → backend → portal → web.
- **Eclipse-Web #11** y **Eclipse-internal-portal #11**: drafts coordinados con el anterior. Eclipse-internal-portal #2: CI de Pages, de octubre.
- **Hallazgo:** comparé el catálogo de la rama de #10 con `content/*.json`. #10 **no reconcilia con la tarifa aprobada del 16/10**: pasa `landing` a 500 pero deja `esencial` en 20 (la web: 30), `crecimiento` 40 y `escala` 100 (la web tiene `conectado` 75 e `ia` 150), y mantiene los planes históricos y las ofertas fundador activas. El guard de la web seguiría bloqueando el envío live. El lote 2.2 tiene que construirse sobre #10 (o decidir qué hacer con #10) y no ignorarlo.

**Lista de merges realizados por mí:** (vacía; se completa a medida que ocurran).

**`messages/drafts/`.** `CLAUDE.md` pide poner el copy nuevo en `messages/drafts/<área>.json` mientras varios agentes trabajan en paralelo, para que no se pisen en `messages/*.json`. El build de producción **ignora los drafts**: un texto que quede solo en `drafts/` y se mergee a `main` no aparece en el sitio. Con un solo ejecutor, la regla no hace falta; por defecto edito `messages/{es,en,pt}.json` directamente y dejo corriendo el test de paridad de claves. Actualizo esa línea de `CLAUDE.md` en el lote 1.2.

## 19. Visión y catálogo EstateOS vigentes (contexto entregado por Ignacio, 24/10/2026)

Ignacio compartió la visión completa del programa. Contrasté sus cambios contra Notion (páginas editadas el 24/10/2026 a las 22:25 UTC): anexo A «Planes y cupos EstateOS», anexo C «Módulos y entregas futuras» (S3 y «Chatbot CRM · alcance separado») y las menciones en 2.3, 3.6, 3.8, 3.9 y la bienvenida. Coinciden.

**Cambio de catálogo respecto de lo que leí a las 16:27 UTC:**

| Plan | Antes | Ahora (vigente) |
|---|---|---|
| Growth · USD 75 | mapas MDP y métricas, Academy, imágenes, 1 tour | **+ panel del propietario** (inmuebles propios, rendiciones, cobros confirmados y pendientes, gastos y seguimiento de inversión, comunicación con la inmobiliaria) |
| Hípergrowth · USD 150 | módulo propietario/cobros/ROI + Intelligence con asistente | **Intelligence de análisis y recomendaciones** (el panel se hereda desde Growth) |
| Deluxe · USD 200 | administración (expensas, reclamos, correo) | **+ chatbot integrado al CRM** para el equipo inmobiliario, más administración |
| Partner · USD 500 (propuesta) | Deluxe + sedes y producción | hereda el chatbot; sigue propuesto |

**Lo que NO cambió:** Contact 30 y Escalar 100; los cupos siguen siendo un borrador a costear; Partner y su economía siguen pendientes de OK.

**Estado de cada módulo (regla del programa: «aparece en una demo» no equivale a «operativo»):**
- Panel del propietario (Growth): *objetivo*. Requiere entrega S3 (rendiciones, ROI, cobros, conciliación con proveedor). Dinero recibido y proyección se muestran separados.
- Chatbot del CRM (Deluxe): *objetivo; demo guionada y rotulada*. Requiere SDD propio. Proveedor del modelo, consumos y cupos sin definir; que Claude sea la herramienta de desarrollo no decide el modelo del producto. Debe respetar permisos, separar datos por inmobiliaria, citar fuentes, permitir intervención humana y pedir confirmación antes de modificar registros. No incluye bot público ni de WhatsApp.
- Intelligence (Growth: mapas y métricas; Hípergrowth: análisis y recomendaciones): demostrativo con fixtures rotuladas; la capa de barrios sigue bloqueada por licencia (ver §16).
- Lumen actual: simulación local (ver §5); no acredita multiempresa, chat real ni WhatsApp.

**Preguntas derivadas (no resueltas):**
1. *Dónde viven los módulos reales.* Notion (anexo C, S1) exige aislamiento multiempresa contra un backend. Con la decisión de §17.1 (EstateOS es una demo sin BE y los pagos se derivan a la app de Eclipse), mi lectura es que panel del propietario, chats, suscripciones y chatbot se construirían después en la plataforma de Eclipse con un BE multiempresa. *Es una inferencia mía; se confirma en el SDD de S1.*
2. *Alcance económico:* un panel con cobros dentro de USD 75 y un chatbot dentro de USD 200 sin costo de proveedor definido. Notion lo declara pendiente; no se publica como disponible ni como rentable.
3. El texto de contexto termina con «el primer paso sigue siendo 0.1»: está superado, 0.1 se cerró en E1 (§15.4). El siguiente es 0.2.

## 20. Decisiones de Ignacio, tercera tanda (26/10/2026)

Registro; ninguna está implementada.

1. **Bienvenida (ajusta §17.2):** el modal «Ver con guía» / «Ver por mi cuenta» aparece **en cada recarga** de EstateOS. «Ver con guía» activa el teaser. El teaser guarda «visto» en `localStorage` y no se repite solo salvo que el usuario pida verlo desde cero. Reemplaza la interpretación de §17.2 («con visto se omite el modal»).
2. **PR #10 del BE:** el lote 2.2 se construye **por encima** de la rama del PR #10 para poder avanzar. No se mergea el PR #10 por esto.
3. **«Armá tu plan» no existe** en el diseño nuevo. «Quiero potenciar mi negocio» abre un **cuestionario modal** que redirige al rubro específico: **ecommerce, salud y animales, inmobiliarias, compliance para empresas, restaurantes**, cada uno «con sus plantillas y los 5 planes mencionados». *Choca con* Notion 1.3 / 4.2 («exactamente dos rubros iniciales»), con §17.3 y con §17.4. *Preguntas abiertas:* (a) ¿los cinco rubros están activos desde el inicio o los que aún no tienen micrositio se muestran como «próximamente»? (no se enlaza a algo que no existe); (b) «los 5 planes» ¿son los cinco planes de EstateOS o las cinco líneas de Eclipse? (c) el armador `/plan` queda en standby en el repo, no se borra.
4. **Demos ocultas (ajusta §17.4):** Bruma (`shop`) también pasa a standby. Todas las demos ocultas se **conservan dentro de Eclipse-Web** para migrarlas después a otros repositorios como productos por tipo de comercio. No se borra código, copy ni tests.
5. **Alcance de «hacer todo» (§17.5), explicado:** mientras una capacidad no está construida y probada, la web la muestra dentro del plan como «objetivo» o «en desarrollo», nunca como «disponible». Y antes de generar imágenes, video, voz o música (lotes 3.2–3.4) pido un tope en USD y lo registro.
6. **Merges y PRs:** hago commits, merges de integración y PRs; Ignacio aprueba los PRs; le aviso cuando haya uno y le indico el **modelo y esfuerzo del lote siguiente**. Lista de merges: §18.
7. **«EstateOS desde USD 50» en Notion:** reemplazar por el catálogo vigente. Se ejecuta en las páginas de lote que contienen la frase; ver el informe de la sesión.
8. **Incoherencia de 1.4:** explicada y corregida en Notion (§17.12). Sin cambios adicionales.
9. **Catálogos separados (§17.9):** de acuerdo.
10. **Fechas y capacidad (§17.11):** no se consideran; se ejecuta lote por lote.

## 21. Decisiones de Ignacio, cuarta tanda (26/10/2026)

Registro; salvo lo indicado, ninguna está implementada.

1. **Opus:** su última afirmación es la vigente (0.2 §5): hitos justificados, estética igual o mejor que la línea base, sin límite fijo de dos.
2. **Academy** forma parte de las cinco líneas en todos los agentes.
3. **Precios:** los mencionados son los existentes: general 30/75/150 y sectorial EstateOS 30/75/100/150/200. *Sin cambio:* el nivel 199 y Partner 500 no figuran como aprobados por esta frase; se tratan como propuesta hasta aprobación explícita.
4. **PR #1 de `agents`:** el ejecutor codea y mergea lo que corresponda; Ignacio aprueba el PR #1 para tener un `agents` más pulido. Aplicado: commit `60f3f75` (0.2 §11). El merge de la PR a `main` espera su aprobación.
5. **Topes de producción (declarados):** ElevenLabs **USD 11** y Higgsfield **USD 100**. No se ejecutó ninguna compra. *Pendiente:* si son por mes o totales, y el tope de Suno.
6. **Rubros del modal (ajusta §20.3):** respuesta ambigua. Se registra tal cual («no arrancamos con esos dos rubros del notion, pero más adelante vamos a ampliar la gama de lo que ofrece Eclipse») y se vuelve a preguntar al abrir el lote 1.1, antes de diseñar el selector. Hipótesis de trabajo hasta entonces: el selector no muestra enlaces a micrositios que no existen.
7. **«Los 5 planes»** son los cinco planes de EstateOS (Contact, Growth, Escalar, Hípergrowth y Deluxe); Partner sigue como propuesta.
8. **Lote 0.3 iniciado:** entregable en `docs/v3/lote-0.3-skills-verificadas.md`.

## 22. Decisiones de Ignacio, quinta tanda (26/10/2026)

1. **PR #1 de `agents`:** la aprueba Ignacio. El ejecutor no la mergea.
2. **Topes de producción confirmados (ajusta §21.5):** **ElevenLabs USD 11 por mes** y **Higgsfield USD 100 por mes**. Registro de tope; no autoriza compras. Suno: sin tope declarado.
3. **Precios (ajusta §21.3):** Partner **USD 500** y el nivel de **200** se usan en la oferta; Ignacio los llama «propuesta, así que hay que utilizarlos». Interpretación: Deluxe 200 ya era dirección suya y Partner 500 queda **aprobado como precio**; los **cupos** siguen siendo un borrador a costear y el alcance económico final sigue pendiente. *Si «el 200» se refería al nivel general de 199, hay que confirmarlo; hasta entonces el 199 general no se publica.*
4. **Rubros del modal (resuelve §20.3 y §21.6):** se arranca con **Inmobiliarias y Ecommerce** (como dice Notion). Los demás rubros (salud y animales, restaurantes/bodegones, compliance para empresas, etc.) se suman después, cuando cada uno tenga su micrositio. Las demos ocultas siguen en standby dentro de Eclipse-Web (§20.4).
5. **Manifiesto de 0.3:** pendiente de explicación y de aprobación; 0.3 no se da por aceptado hasta entonces.

## 23. Agentes Design y Ads (26/10/2026)

Se crearon **Eclipse Design** y **Eclipse Ads** a pedido de Ignacio (PR #2 de `agents`, borrador, apilada sobre #1). Ver `lote-0.2-agentes-pr1.md` §12 y `lote-0.3-skills-verificadas.md` §12. Pendiente de Ignacio: aprobar #1 y #2 y el manifiesto de 0.3, y dar el OK de 0.4.

## 24. Decisiones de Ignacio, sexta tanda (26/10/2026)

1. **Manifiesto de 0.3:** aprobado **A, B y C**; D no se instala (§22.5 queda resuelto). Instalación pendiente en sesión aparte (`lote-0.3-skills-verificadas.md` §13).
2. **Lote 0.4:** OK explícito. Ejecutado como documental (`lote-0.4-sdd-control-financiero.md`, `ledger-financiero.md`, `registro-consumo.md`). Estado: **verificado local, pendiente de su aceptación**; habilita 1.1.
3. **Lista de merges realizados por mí (§18):** sigue vacía. Pendiente de Ignacio: PR #1 y #2 de `agents`; el PR #15 de Eclipse-Web (borrador, solo documentos de Fase 0) **no se mergea** hasta su aprobación, porque un merge a `main` publica en producción.
4. **El «200» es Deluxe** (resuelve §22.3). El nivel general de 199 sigue **sin publicarse**.
5. **Costos fijos mensuales declarados:** infraestructura USD 100 · Claude USD 100 · Higgsfield USD 50 · GPT USD 20 · ElevenLabs USD 11 = **USD 281/mes**. Impuestos y comisiones: se definen al facturar. Ver `ledger-financiero.md` §2.b. Higgsfield: USD 50 de costo contra tope declarado de USD 100; pendiente aclarar cuál rige.
6. **Contact:** se mantiene como web básica con enlace manual a WhatsApp (segmentación del 26/10); el «chat» del criterio de 2.3 se corrige en ese lote.
7. **Instalación de skills (A, B, C):** ejecutada el 26/10/2026 a pedido de Ignacio, antes de 1.1. Ver `skills-instaladas.md`. Pendiente: *smoke* de carga en la sesión de 1.1.
8. **Lote 0.4 aceptado** por Ignacio (26/10/2026). La **Fase 0 queda cerrada**. Habilita 1.1. Orden siguiente: 1.1 → **1.4** → 1.2 → 1.3 → 1.5 (el texto de 1.1 en Notion dice «habilita 1.2 y 1.3»; manda el orden maestro y la página de Fase 1: la dirección visual 1.4 va antes).
9. **Lote 1.1 ejecutado** (documental): `lote-1.1-arquitectura-wireflows.md`. **Pendiente de Ignacio:** aceptar 1.1 y decidir D1 (qué es «Ecommerce»), D2 (destino del armador), D3 (qué hace «visto»), D4 (orden de la home), D5 («Otro» del hero). Siguiente lote: **1.4**.

## 25. Decisiones de Ignacio, séptima tanda (26/10/2026)

1. **PR #15 de Eclipse-Web** y **PR #1 y #2 de `agents`** quedaron mergeados por Ignacio. El PR #2 se mergeó a la rama `feature/eclipse-v3-core-agents` un minuto **después** de que el #1 llegara a `main`, así que los agentes de Design y Ads **no estaban en `main`**: PR #3 de `agents` los lleva. El PR #15 se mergeó **antes** de las skills, de 0.4 aceptado y de 1.1: PR nuevo de Eclipse-Web los lleva.
2. **Lote 1.1 aceptado** con las decisiones D1–D5 (`lote-1.1-arquitectura-wireflows.md` §11): **D1** Ecommerce será un apartado propio con sus planes, parecido a EstateOS (sin catálogo ni demo hoy: «Próximamente» hasta que se construya); **D2** el armador queda **dormido** y más adelante se transforma en el flujo de **pago con link**; **D3** **no hay variable «visto»** (el modal aparece en cada recarga; reemplaza §17.2 y §20.1 en lo que decían de `localStorage`); **D4** reordenar la home según A–F; **D5** el chip «Otro» desaparece.
3. **Pregunta de Ignacio sobre 1.4:** ¿conviene Opus? Ver `lote-1.1-arquitectura-wireflows.md` §16: sí, una intervención Opus · high acotada y el resto con Sonnet · high.

## 26. Lote 1.4 con Opus (26/10/2026)

1. **PR #16 mergeado por Ignacio** (skills, 0.4 aceptado, 1.1). Lista de merges: #15 y #16 de Eclipse-Web, #1 y #2 de `agents`, todos por Ignacio; `agents` #3 abierto.
2. **Lote 1.4 ejecutado con Opus high** a pedido de Ignacio (`lote-1.4-motion-direccion-visual.md`): baseline real de la home en 5 anchos (`docs/v3/capturas/baseline-1.4/`), dos defectos medidos (**B1** dos CTA ámbar en la misma pantalla: Cómo trabajamos + Fundadores; **B2** Fundadores invita con la oferta inactiva), contrato verificado con 3 correcciones, dirección «Carta de efemérides», partitura de 17 eventos. La home actual saca **10/14** en la rúbrica.
3. **Pendiente de Ignacio:** aceptar 1.4 y decidir D8 (titular), D9 (Fundadores) y D10 (llave directa de Ecommerce).
