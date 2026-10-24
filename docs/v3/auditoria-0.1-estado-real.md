# Eclipse v3 · Fase 0 · Lote 0.1 — Estado real (auditoría documental)

**Fecha de revalidación:** 24/10/2026 (Argentina) · **Base remota:** auditoría del 23/10/2026 · **Alcance:** solo lectura y este documento; no se tocó código de producto, catálogo, assets ni configuración.
**Nivel de evidencia alcanzado:** E0/E1 (documento y código leído). **E2 (prueba local) pendiente**: ver §9.

## 0. Informe en tres líneas

- **Qué cambió:** se revalidó el inventario contra el HEAD real de los cinco repos y la PR #1 (SHA coinciden con la base del 23/10, sin deltas) y se agregó lo que faltaba: botón por botón de Lumen, la lista exacta de ids/campos divergentes FE↔BE, el mapa de anclas y tres contradicciones nuevas (§7, C12, C13 y C14).
- **Qué quedó abierto:** E2 (levantar la web y recapturar el HEAD) no se hizo porque `Eclipse-Web` no tiene `node_modules` y instalar está fuera de este lote; nada de lo descrito como «funciona» está probado en ejecución en este lote.
- **Qué necesita el OK de Ignacio:** (1) cuál es el CTA vigente: el código dice «Pedí tu demo», la instrucción actual dice «Quiero potenciar mi negocio» (C2); (2) autorizar el lote que reconcilie el catálogo BE con la tarifa aprobada (C6, lote 2.2); (3) si el estilo «referencia tachada» de `Eclipse-email-kit` se acepta o se corrige (C12). Gasto de este lote: USD 0.

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
| C2 | CTA: el código y `CLAUDE.md` dicen «Pedí tu demo» (`messages/es.json:85`) y prohíben «potenciá»; el anexo dice que prevalece «Quiero potenciar mi negocio». `grep` de «potenciar» en `messages/es.json`: 0 resultados. La captura histórica muestra «Quiero esto para mi negocio» (`wantThis`, `es.json:5443`) en la capa de demo | Requiere OK de Ignacio sobre qué CTA va en qué lugar; no se cambió copy | **Necesita OK** |
| C3 | Nueve fases técnicas históricas vs. cinco macrofases y 28 lotes | Prevalecen las cinco macrofases | Resuelto (E0) |
| C4 | Sonnet exclusivo / Opus por arquitectura vs. «Opus según necesidad, sin límite fijo de dos». La PR #1 dice «inicialmente dos intervenciones» y «Opus NO se auto-invoca» | Prevalece la instrucción actual; Chief registra motivo y consumo; gasto extra con su gate | Resuelto (E0) |
| C5 | «Backend pendiente» (Notion) vs. código existente | Existe código; producción sin comprobar (§6.2) | Resuelto (E1) |
| C6 | Catálogo FE (500/700, 3×30, 50 % seña) vs. BE (planes históricos, 25/79/199, ofertas activas) | Registrado en §6.1; **no sincronizar ni saltar el guard**; reconciliar contra tarifa aprobada con compatibilidad histórica en 2.2 | Abierto |
| C7 | Mantenimiento aprobado 30/75/150 (terceros 5/15/40, 2 h) vs. propuesta 30/75/150/199 + Studio/Academy | Conservar lo vigente; el 199 y nuevas inclusiones esperan margen | Abierto (hipótesis) |
| C8 | EstateOS «desde USD 50/mes» | Hipótesis sectorial; no asumir setup gratis ni CRM productivo por 50 | Abierto (hipótesis) |
| C9 | Inteligencia nacional privada ≠ demo inmobiliaria pública | Fixtures separadas; cero arrastre de compradores reales | Resuelto (regla) |
| C10 | Gateway mínimo en fase 3; fase 4 consolida | No bloquea la primera venta | Resuelto (E0) |
| C11 | Contrato actual: explorar libremente y «Ver con guía/por mi cuenta» en cada apertura; PR #1 y anexo: cine opt-in dentro de «Ver con guía», sin autoplay | Hoy el cine no es opt-in (se reproduce al abrir, saltable con click/tecla); cambiarlo es un lote futuro, no de este | Abierto |
| **C12** (nuevo) | `Eclipse-email-kit` presenta precios con «referencia tachada» y «50 % de descuento» (ARS 750.000 → 375.000) y fue pensado para Volta. `CLAUDE.md` de Eclipse-Web prohíbe tachados, «antes $X» y solo admite ofertas de `content/offers.json`. Su README declara «no listo para envío» | No mezclar con Eclipse-Web. Decidir con Ignacio si es una regla solo del sitio o de toda comunicación; no se tocó | **Necesita OK** |
| **C13** (nuevo) | `docs/v3/inventario.md` lista precios, paquetes y ofertas de v2 como si fueran el estado del sitio; el código vigente tiene otros (§6) | Mantener como inventario histórico de bloques (esta auditoría no lo edita) y no citarlo para precios | Registrado |
| C14 (nuevo, menor) | `AGENTS.md` de Web pide leer `node_modules/next/dist/docs/` antes de usar APIs de Next; `node_modules` no existe en este entorno | No hay API de Next que usar en este lote; el límite queda declarado | Límite |

## 8. Evidencia visual (histórica, no del HEAD)

- `docs/v3/capturas/fase2/despues/demo-inmobiliarias.jpg` (commit `0dc8f87`, 04/10/2026): Lumen en capa de demo. Se ve la composición editorial: serif para «Oficina cerrada. *Lumi atiende.*», cifra «100 %» en cobalto, filetes finos, esquinas rectas, sidebar con índice 01–07 sin íconos, tablero con 4 etapas, y a la derecha el celular con la ficha «Olmos 1420 · USD 168.000». Etiquetas «ESCRITORIO / CELULAR» independientes, sin marcos de dispositivo. Barra superior: «Volver», insignia «DEMO», «Ver con guía» y «Quiero esto para mi negocio».
- `docs/v3/capturas/fase3/despues/escritorio-1-apertura.jpg` (commit `9df7aa1`): tira de 6 fotogramas de la apertura: hero → eclipse centrado → anillo de diamante → luz que inunda → pregunta «¿Cómo la querés ver?» con «Ver con guía / Ver por mi cuenta» sobre la demo (en la captura, Clínica Aurora).
- **Interpretación visual (no medición):** la jerarquía, la identidad propia de Lumen y la legibilidad en escritorio se ven bien. No se puede juzgar CTA en móvil, foco ni movimiento real desde imágenes fijas.
- **Gate visual adversarial:** sin baseline ejecutable de este HEAD, no hay comparación; no se registra ningún criterio como «peor» ni «mejor». LCP ≤ 2,5 s, CLS ≤ 0,1 e INP ≤ 200 ms son objetivos de producto; `docs/v3/rendimiento.md` contiene ensayos de laboratorio propios de otro SHA, sin dispositivo de campo ni p75. Su tabla Lighthouse móvil para `/es/` da v2 → v3: TBT 360–440 ms → 230–320 ms, CLS 0 en ambos, pero **LCP 2,9–5,0 s → 3,5–3,8 s, por encima del objetivo de 2,5 s**. Es una medición de laboratorio histórica, no del HEAD; queda como dato abierto para 1.5.

## 9. Límites y lo que no se probó

- **E2 pendiente:** `Eclipse-Web` no tiene `node_modules`; levantar la web requiere `npm ci`, que este lote excluye. No se ejecutó `npm test`, `typecheck`, `lint`, `build`, e2e, ni se tomaron capturas. Acción para 1.5 / quien tenga el entorno: `npm ci` → `scripts/dev.sh 3200` → `node scripts/shot.mjs http://localhost:3200/es/ <outDir> --widths=360,1440`.
- Ninguna pantalla se abrió en un navegador; el comportamiento descrito sale de leer código.
- Cinco de las seis demos no se leyeron vista por vista; BE y portal interno se leyeron en sus puntos de entrada, no completos; Volta y email-kit apenas en cabecera.
- No se revisó `.env*` ni secretos. No se consultó Notion (las seis fuentes Notion no se abrieron: se trabajó con el anexo del prompt y los archivos de los repos). **Fuente no leída: Notion Eclipse v3, Contexto Eclipse, Eclipse Agency, Landing UX/UI v3, Portal interno v3, Sales Intelligence Lote 0**; el dossier de Sales Intelligence no apareció en el portal interno (ramas: solo `main` y la de trabajo).
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

**Próximo paso concreto:** que Ignacio resuelva C2, C6 (autorizar 2.2) y C12; en paralelo, quien tenga el entorno ejecuta el comando E2 de §9 para cerrar el 0.1 con capturas del HEAD.
