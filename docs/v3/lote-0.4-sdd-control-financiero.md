# Lote 0.4 · SDD y control financiero

**Fecha:** 26/10/2026 · **Modelo configurado y efectivo:** `claude-sonnet-5-5`, esfuerzo `high` (leído con `get_session`: `session_context.model` y `external_metadata.last_served_model` coinciden) · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` · **Estado: aceptado por Ignacio el 26/10/2026 (habilita 1.1).** **Resultado:** documental; no se tocó código de producto, no se instaló nada, gasto externo ejecutado USD 0.
**Fuente del lote:** Notion «Lote 0.4 · SDD y control financiero» (última edición 24/10/2026), «Modelos y control de consumo», «Orden de ejecución y entregables», y las páginas de fase 1–4 para los títulos. **Complementos:** [`ledger-financiero.md`](ledger-financiero.md) y [`registro-consumo.md`](registro-consumo.md).

## 0. Informe en tres líneas

- **Qué cambió:** quedan escritos el **contrato base de ejecución** (§3), la **ficha de lote de 16 apartados** con checklist de evidencia (§4), los **gates G0–G5 y A0–A5** con su criterio de salida (§5), la **matriz de dependencias de los 28 lotes** verificada como acíclica (§6), la **política operativa de modelos** (§7) y los **criterios de parada** (§8). El control de dinero está en `ledger-financiero.md` y el de consumo en `registro-consumo.md`.
- **Qué quedó abierto:** el costo horario interno, las comisiones de cobro, el régimen de impuestos y los costos reales de proveedores (Higgsfield, ElevenLabs, WhatsApp, voz, chatbot) **no están disponibles**: por eso ninguna hoja económica concluye rentabilidad y la producción audiovisual sigue bloqueada (sin techo numérico aprobado). La cuota de suscripción de Claude no se puede leer; solo hay lo que informa la herramienta de sesión.
- **Qué necesita el OK de Ignacio:** aceptar 0.4 (habilita 1.1), decidir el umbral de contribución propuesto (≥ 50 %), el techo por lote de render propuesto (§ del ledger) y confirmar el «200» (Deluxe o 199 general).

## 1. Registro de entrada (G0)

| Dato | Valor | Cómo se obtuvo |
|---|---|---|
| Modelo y esfuerzo efectivos | `claude-sonnet-5-5` · `high` | `get_session` al abrir 0.4 (no hay Max ni workflows automáticos activos) |
| Eclipse-Web, rama de trabajo | `claude/eclipse-v3-inventory-audit-2ukttn`, HEAD al abrir `0c980c3`, `git status --short` vacío | `git rev-parse`, `git status` |
| Eclipse-Web, `main` | `6bf91ae` (igual que la base de la auditoría remota del 23/10) | `git rev-parse origin/main` |
| `agents` | PR #1 head `3c3f1cd`; PR #2 head `061639e` (apilado) | `git log`, API de GitHub |
| Delta contra la base de Notion | Eclipse-Web `main` sin cambios; PR #1 de `agents` pasó de `a6ee0c8` a `3c3f1cd` por las correcciones de 0.2 | comparación de SHAs |
| Instrucción previa de Ignacio | Manifiesto de 0.3: **A, B y C aprobados**; D no se instala (skill interna sobre OGL cuando haya efecto aprobado). **OK explícito a 0.4.** | mensaje del 26/10/2026 |
| Fuentes no accesibles | Ninguna de las leídas. No se leyó `.env` ni secretos. | — |

**Conflicto entre fuentes resuelto (registro).** El prompt de 0.4 dice «no instalar skills dentro de esta ejecución». Ignacio aprobó el manifiesto A, B y C. Se resuelve así: **la aprobación queda registrada, la instalación NO se ejecuta en 0.4**; se hace en una sesión propia, con su procedimiento (0.3 §6), su rollback y su OK de ejecución (propuesta: justo antes del primer lote que use una skill, 1.4). La regla vigente es la instrucción más reciente de Ignacio **y** la exclusión del lote; ninguna contradice a la otra si la instalación espera.

## 2. Qué se decidió en 0.3 al cerrarlo

- **A** (Frontend Design), **B** (GSAP: React, Timeline, Performance, más ScrollTrigger y Core) y **C** (Emil: `emil-design-eng`, `animate`, `animation-performance`, con precedencia de `CLAUDE.md`): **aprobados como manifiesto**.
- **D** (`shader-glsl` externa): **no se instala**. Se reemplaza por una skill interna sobre OGL, cuando exista un efecto aprobado (1.4 o 3.x).
- Referencias revisables 6 y 7 (Design Motion Principles, Accessible Animation): quedan dentro del manifiesto como *referencia*, no como instalación; 8 y 9 se preparan en su lote.
- **Nada está instalado.** Estado de 0.3 pasa a **aceptado con alcance A, B, C**.

## 3. Contrato base de ejecución

Es el contrato que cada lote hereda. Si un lote lo contradice, gana el prompt del lote **solo** en lo que lo dice expresamente.

1. **Un lote activo por vez.** Sin subagentes, workers ni sesiones paralelas salvo encargo expreso de Ignacio con presupuesto. No se avanza al lote siguiente: se cierra con evidencia y se espera su entrada (§5).
2. **Apertura (G0, 10 minutos de trabajo):** leer `AGENTS.md` y `CLAUDE.md` del repo; si Next está instalado, la guía local bajo `node_modules/next/dist/docs/` antes de usar una API (no se instala para leerla); registrar modelo y esfuerzo **efectivos**, rama, HEAD, `git status --short` y deltas contra la base; buscar con `rg --files` y `rg <símbolo>`; si falta una ruta, localizarla y registrar la real. No se repite una auditoría total sin un delta que lo justifique. No se leen `.env` ni se imprimen secretos.
3. **Durante:** diff acotado, solo archivos autorizados y sus imports directos. Cada afirmación de funcionamiento lleva su nivel de evidencia: **E0** documento · **E1** código leído · **E2** prueba local reproducida · **E3** entorno remoto verificado · **E4** operación real. Sin evidencia se rotula *no probado* o *simulado*. Se separan siempre **propuesto · implementado · probado · cobrado**.
4. **Dos intentos:** si dos correcciones no resuelven un defecto, se guarda el repro y la causa pendiente y se para; no se regenera el trabajo completo ni se cambia de proveedor o modelo por reflejo.
5. **Cierre:** informe de tres líneas (Qué cambió · Qué quedó abierto · Qué necesita OK) + evidencia enlazada + lista de archivos + registro de sesión (`registro-consumo.md`) + **resumen de cierre reutilizable** (≤ 15 líneas: qué quedó decidido, dónde está, qué sigue) para la siguiente sesión, de modo que no haya que repetir contexto.
6. **Integración a `main` = publicación.** Un merge a `main` en Web o en el portal interno publica en producción (auditoría §18). Reglas: cada lote en su rama; PR a la rama de integración `feat/eclipse-v3` (Web no corre CI en PR hacia ramas que no son `main`: se corre `npm ci`, test, lint, typecheck y build **en local** antes de integrar); el PR único hacia `main` lo aprueba Ignacio y el merge se hace después (G5). La lista de merges se mantiene en el §18 de la auditoría.
7. **Sin gasto ni instalación por iniciativa propia.** Higgsfield, ElevenLabs, Suno, fuentes de pago, librerías y suscripciones solo con el gate de gasto del ledger (tope en USD y OK de Ignacio). Los topes declarados (ElevenLabs USD 11/mes, Higgsfield USD 100/mes, Suno sin tope) **no son autorización de compra**.
8. **Honestidad de datos:** fixtures identificadas «Demo», nada de compradores reales inventados, sin mezclar fixtures con DTO live ni datos del portal interno en la demo pública, y ninguna cifra de costo, ingreso o tokens que no esté medida: lo que falta se escribe **«no disponible»**.
9. **Roofy queda fuera** de todo lote. Handy y las demos originales no se reescriben.

### Estados de un lote
`especificado` → `listo por dependencias` → `ejecutando` → `bloqueado` (solo la acción dependiente; se sigue con lo independiente) → `verificado local` → `aceptado`. Nunca «hecho» por haber creado una página. «Aceptado» lo declara Ignacio (con Chief como revisor); un lote verificado sin aceptación **no habilita** el siguiente.

## 4. Ficha de lote: 16 apartados y checklist de evidencia

Toda ficha usa estos 16 apartados, en este orden. La ficha de cada lote ya existe en Notion con su prompt; este es el formato de cierre.

| # | Apartado | Qué debe quedar escrito para poder cerrar |
|---|---|---|
| 01 | Identificación | Lote, prioridad, modelo y esfuerzo **efectivos**, repositorios, responsable técnico, revisor |
| 02 | Resultado de negocio | Una frase medible; sin contar vistas, formularios o propuestas como cobros |
| 03 | Fuentes y precedencia | Lista con fecha de lectura; la instrucción expresa de Ignacio prevalece |
| 04 | Estado previo verificable | Rama, HEAD, `git status`, deltas contra la base, límites de lo no ejecutado |
| 05 | Especificación SDD | Flujo feliz/alternativo/error/vacío, estados, datos y permisos, requisitos no funcionales |
| 06 | Dirección UX/UI | Contrato de marca y comparativa antes/después con fallos binarios (si hay UI) |
| 07 | Plan en orden | Pasos numerados con su evidencia |
| 08 | Arquitectura y permisos | Qué se reutiliza; endpoints propuestos rotulados *propuesto* |
| 09 | Cinematografía y medios | Si no aplica, decirlo; textos, precios y mapas viven en HTML/SVG |
| 10 | Exclusiones | Lo que no se hace, explícito |
| 11 | Costos y condición de pausa | Gasto externo autorizado (por defecto USD 0), estimación rotulada, qué se detiene si falta algo |
| 12 | Criterios binarios | Casillas con evidencia o bloqueo; sin «bien»/«premium» sin comparativa |
| 13 | QA y evidencias | Qué se ejecutó y dónde (entorno), qué **no** se ejecutó |
| 14 | Riesgos y rollback | Snapshot del HEAD, archivos tocados, reversión solo del cambio del lote |
| 15 | Handoff y gate siguiente | Qué habilita; lista de archivos; presupuesto consumido |
| 16 | Informe final | Tres líneas + evidencia + próximo paso |

**Checklist de cierre (se completa en cada lote):**
- [ ] Modelo/esfuerzo efectivos registrados (no solo los pedidos).
- [ ] HEAD inicial y final, archivos tocados, sin cambios ajenos pisados.
- [ ] Cada afirmación con nivel E0–E4; lo no probado, rotulado.
- [ ] Pruebas y capturas clasificadas **ejecutadas / no ejecutadas**, con entorno.
- [ ] Ninguna cifra inventada; lo que falta dice «no disponible».
- [ ] Gasto: USD 0 o, si hubo, gate de gasto aprobado y enlazado.
- [ ] Opus: si intervino, motivo, entrega, criterio de salida y consumo (§7).
- [ ] Contenido previo vigente preservado; lo sustituido, marcado con fuente, fecha y razón.
- [ ] Informe de tres líneas y resumen de cierre reutilizable escritos.
- [ ] Entrada del siguiente lote revisada; **no** se empieza.

## 5. Gates

| Gate | Pregunta | Evidencia mínima | Quién lo cierra |
|---|---|---|---|
| **G0** Fuentes/HEAD | ¿Sé qué leí y sobre qué versión trabajo? | Registro de entrada (§1) | Ejecutor |
| **G1** SDD/alcance | ¿El alcance es acotado, con exclusiones y aceptación binaria? | Ficha de 16 apartados; SDD mínimo (§9) | Ejecutor + Chief |
| **G2** Baseline y prueba de salida | ¿Existe un «antes» comparable y un test de salida definido *antes* de cambiar? | Capturas/medición del HEAD; criterios binarios | Ejecutor |
| **G3** Ejecución local | ¿El cambio funciona en local sin tocar producción? | `npm test`, `typecheck`, `lint`, `build` y capturas 360/1440 (en Web) | Ejecutor |
| **G4** QA y revisión | ¿Pasa el QA visual/funcional y la revisión adversarial? | Informe por caso; ningún crítico peor que la línea base | Chief + revisión |
| **G5** Merge/deploy | ¿Ignacio autorizó publicar? | Autorización explícita, separada | **Ignacio** |

**Producción audiovisual** agrega: **A0** storyboard aprobado → **A1** imagen ancla → **A2** todas las imágenes → **A3** cotización específica (modelo, unidad, reintentos, impuestos, techo en USD) → **A4** renders **secuenciales** → **A5** revisión final. No se salta ninguno y A3 sin techo numérico aprobado **bloquea A4**.

**Reglas de aprobación de un gate:** no se pasa con un título vacío, un costo inventado, un test no ejecutado o un dato ficticio sin rótulo. Un criterio crítico peor que la línea base **bloquea** aunque la puntuación estética sea alta (foco roto, CTA tapado, texto ilegible en 360 px). LCP ≤ 2,5 s, CLS ≤ 0,1 e INP ≤ 200 ms son **objetivos** del producto; las mediciones de laboratorio se reportan con dispositivo y límites, sin atribuirlas a p75 de campo.

## 6. Matriz de dependencias de los 28 lotes

Fuente: «Orden de ejecución y entregables» (Notion, 24/10/2026). El **orden numérico de la primera columna es el de ejecución**; las dependencias son los prerrequisitos mínimos de cada lote. Los números son identificadores: **1.4 se ejecuta antes de 1.2 y 1.3** (decisión de Notion, «dirección visual antes de código»). Los títulos salen de las páginas de fase; los de 0.3 son el nombre corto usado en el repositorio.

| Orden | Lote | Depende de | Modelo · esfuerzo | Salida verificable | Estado |
|---|---|---|---|---|---|
| 1 | **0.1** Estado real | — | Sonnet · high | Inventario E0/E1 con deltas, registro de contradicciones, ruta de reutilización | aceptado (E2 diferido a 1.5) |
| 2 | **0.2** Agentes y PR 1 | 0.1 | Sonnet · high | Review por archivo, RACI, política de modelos y test de cinco rutas | verificado local; PR #1 y #2 de `agents` a la espera de Ignacio |
| 3 | **0.3** Skills verificadas | 0.2 | Sonnet · high | Catálogo, manifiestos, riesgos y pruebas, sin instalar | aceptado con alcance A, B, C; instalación pendiente |
| 4 | **0.4** SDD y control financiero | 0.1, 0.2, 0.3 | Sonnet · high | Contrato base, ledger financiero, matriz de modelos y gates, criterios de parada | **aceptado** (Ignacio, 26/10/2026) |
| 5 | **1.1** Arquitectura y wireflows | 0.4 | Sonnet · high | Mapa de contenidos, wireflows desktop/móvil, tabla URL/estado/foco, protocolo de usabilidad | **aceptado** con D1–D5 (Ignacio, 26/10/2026; `lote-1.1-arquitectura-wireflows.md`) |
| 6 | **1.4** Motion y dirección visual | 1.1 | Opus · high (ejecutado 26/10/2026) | Dirección de arte maestra, partitura y matriz de QA visual (antes de código) | **aceptado** (PR #17 mergeado por Ignacio, 26/10/2026; `lote-1.4-motion-direccion-visual.md`) |
| 7 | **1.2** Home, loader y hero | 1.1, 1.4 | Sonnet · high | Ajuste local de portada sobre componentes existentes, capturas/QA, inventario conservado | **aceptado** (PR #18 mergeado por Ignacio, 26/10/2026; `lote-1.2-home-loader-hero.md`) |
| 8 | **1.3** Header y selector inmersivo | 1.2, 1.4 | Sonnet · high | Selector/header integrados localmente con prueba de History, foco, fallback y captura | **aceptado** (PR #19 mergeado por Ignacio, 26/10/2026; `lote-1.3-header-selector.md`) |
| 9 | **1.5** QA visual y rendimiento | 1.2, 1.3 | Sonnet · high | Informe de QA, capturas, métricas y defectos por severidad | **aceptado** (PR #20 mergeado, 26/10/2026): 0 P0/P1 abiertos; usabilidad con 5 personas pendiente (`lote-1.5-qa-visual-rendimiento.md`) |
| 10 | **2.1** Arquitectura comercial | 0.4, 1.1 | Sonnet · high | Matriz necesidades/líneas/capacidades y copy con fuentes (cambios tras el gate 1.5) | **aceptado** (PR #21 mergeado, 26/10/2026; `lote-2.1-arquitectura-comercial.md`) |
| 11 | **2.2** Precios y catálogo coherente | 2.1 | Sonnet · high | Catálogo aprobado conciliado en cambio revisable; comparador v3 con escenarios de costos | **aceptado** (PR #22 mergeado, 26/10/2026; `lote-2.2-precios-catalogo.md`): FE↔BE medido (41/51 diferencias), prueba permanente, D15, matriz y escenarios; D16–D18 resueltas |
| 11.1 | **2.2b** Retiro de ofertas y comparador de planes mensuales (nuevo, D16) | 2.2 | Sonnet · high | Ofertas ocultas, planes mensuales 30/75/150 con Studio/Academy, piezas como lista de precios, guard solo con lo vendible | ejecutado 26/10/2026 (PR abierto, `lote-2.2b-retiro-ofertas-planes-mensuales.md`); falta confirmar si Studio/Academy cuentan dentro de las 2 h; luego PR de conciliación del backend (D18) |
| 12 | **2.3** EstateOS · planes y bienvenida | 0.4, 2.1, 2.2 | Sonnet · high | Seis niveles, cuotas propuestas, economía, video de bienvenida, configurador | ejecutado 26/10/2026 (documental, PR abierto; `lote-2.3-estateos-planes-bienvenida.md` y `estateos/catalogo-estateos.v1.json`); rentabilidad indeterminada; D19–D23 por responder |
| 12.1 | **2.3b** Modelo único de planes (nuevo, 26/10) | 2.3 | Sonnet · high | Landing con la escalera de seis niveles (demo primero, pedir plan por WhatsApp); catálogo destino del backend = la escalera | ejecutado 26/10/2026 (PR abierto, `lote-2.3b-modelo-unico-de-planes.md`); etapas de cobro P0–P2 por decidir |
| 13 | **2.4** Packs inmobiliarios | 2.3 | Sonnet · medium | Catálogo de seis packs con brief, insumos, presupuesto y gates | ejecutado 26/10/2026 (documental, PR abierto; `lote-2.4-packs-inmobiliarios.md` y `estateos/packs-inmobiliarios.v1.json`); precios A cotizar; D24–D26 por responder |
| 14 | **2.5** Conversión y seguimiento | 2.1, 2.4 | Sonnet · medium | Pitch, propuesta desglosada, cadencia, métricas y handoff a Sales | ejecutado 27/10/2026 (documental, PR abierto; `lote-2.5-conversion-seguimiento.md`); decisiones del 27/10 registradas en catálogo v2; cierra la Fase 2; D27 y D20 por responder |
| 14.2 | **D18** Conciliación del backend (nuevo, 27/10) | 2.2b, 2.3b | Sonnet · high | Backend con el catálogo y el estimador del modelo vigente; guard de la web sin diferencias | ejecutado 27/10/2026 (PR abiertos: Eclipse-be #11 y Eclipse-Web; `conciliacion-backend-d18.md`); sin desplegar; decidir el orden respecto de Eclipse-be #10 |
| 14.1 | **1.6** Repo y subdominio EstateOS (nuevo, D11) | 1.5, 2.5 | Sonnet · high | Esqueleto del repo `roofy`, publicación de prueba en `roofy.eclipse-business.com` y contrato de enlace con Eclipse-Web (idioma y moneda por URL) | ejecutado 27/10/2026 (repo `roofy` con el esqueleto (PR #1 abierto; `main` creado como commit vacío con OK de Ignacio); contrato de enlace probado en los dos repos; publicación de prueba **preparada y apagada**: faltan en `roofy` los secrets de Hostinger y confirmar la carpeta del subdominio; `lote-1.6-repo-subdominio-estateos.md`) |
| 15 | **3.1** Dirección de EstateOS (siete piezas; D28–D36) | 2.5, 1.6 | Opus · high | Biblia v2 (siete piezas), guía de motion con el estándar de interacción, brechas por plan y camino | ejecutado 27/10/2026 (documental; `lote-3.1-direccion-estateos.md`, `estateos/biblia-estateos.v2.md`, `estateos/guia-motion.v1.md`) |
| 16 | **3.5** Base en `roofy` | 1.5, 1.6, 3.1 | Sonnet · high | Lumen en `roofy` a pantalla completa con la barra inferior y la vista de celular en un botón (D35), entrada «¿Cómo la querés ver?», demo por plan con áreas bloqueadas, reproductor, parámetro `plan` en el contrato de enlace (los dos repos) | **aceptado** (`roofy` #2 y Eclipse-Web #31 mergeados por Ignacio, 27/10/2026; `lote-3.5-base-roofy.md`); planes en `draft` hasta 3.6–3.8d; contraste y dispositivos reales sin medir |
| 16.1 | **3.5b** Kit de interacción premium (nuevo, D34) | 3.5 | Opus · high | Pensando, escribiendo, respuesta progresiva, carga, acción optimista, confirmación, error y éxito, con movimiento reducido | **aceptado** (`roofy` #3 y Eclipse-Web #32 mergeados por Ignacio, 27/10/2026; `lote-3.5b-kit-interaccion.md`); tiempos a validar en vivo |
| 17 | **3.6** Demo Contact (absorbe el anterior 3.6 y la ficha de 3.7) | 3.5b | Opus · high | Web, ficha, chat guiado (D20), CRM completo, entregables de la puesta en marcha de marca | ejecutado 27/10/2026 (`lote-3.6-demo-contact.md`); **control de estilo de las demos: aprobado** («todos son premium, incluido Contact», Ignacio, 27/10/2026); PR abiertos en `roofy` y Eclipse-Web |
| 17.1 | **V1** Video de Contact + fábrica de videos (nuevo, D29/D31) | 3.6 | Opus · high | Render cuadro por cuadro, audio sin conexión, subtítulos, posters, manifest y el video de Contact (16:9 y 9:16, es) | primer corte rechazado por Ignacio (27/10/2026: demo filmada, no explicaba todo lo que entrega Contact); **segundo corte al modo Kinetic Studio ejecutado** (`lote-V1-video-contact.md`, guía de motion §0); control de estilo de los videos: **a decidir por Ignacio** |
| 18 | **3.2 (A1)** Fotos con GPT (D32) | 3.1 | Opus · high | Fotos del local de Lumen (4) y de Los Aromos 88 (3), con manifest | especificado; gate de gasto; genera Ignacio en ChatGPT o con una clave suya |
| 19 | **3.3 (A2)** Animación con Higgsfield (D32, D36) | 3.2 | Opus · high | Acceso (conector MCP si existe, skill oficial o API), cotización real, clips: llegada 6 s, umbral 5 s, tour 15 s | especificado; gate de gasto; **con Ignacio presente** |
| 20 | **3.4 (A3)** Voz y sonido | 3.1 | Sonnet · medium | Voces con licencia para el agente de Escalar y locuciones opcionales; transcripciones | especificado; gate de gasto |
| 21 | **3.7** Demo Growth (D33) | 3.6, 3.3 | Opus · high | Recreación inmersiva del local, panel del propietario, mapas y métricas (fuente licenciada o tabla), Academy, archivo privado, producción mensual, seguimientos automáticos | especificado |
| 22 | **3.8** Demo Escalar (D33) | 3.7, 3.4 | Opus · high | Tablero del equipo, campañas 16:9 y 9:16, agente de voz con llamada y transcripción, kit de tours, borradores de contratos | especificado |
| 22.1 | **3.8b** Demo Hípergrowth (D33) | 3.6 | Opus · high | Intelligence (canal, motivos, recomendaciones con fuente) y documentación de operaciones | especificado |
| 22.2 | **3.8c** Demo Deluxe (D33) | 3.6 | Opus · high | Asistente dentro del CRM y administración de consorcios | especificado |
| 22.3 | **3.8d** Demo Partner (D33) | 3.6 | Opus · high | Varias sedes con permisos, visión consolidada, revisión mensual | especificado |
| 23 | **V2** Video de Growth | V1, 3.7 | Opus · high | Con la recreación del local y el tour | especificado |
| 23.1 | **V3** Video de Escalar | V1, 3.8 | Opus · high | Con campaña y llamada | especificado |
| 23.2 | **V4** Videos de Hípergrowth, Deluxe y Partner | V1, 3.8b, 3.8c, 3.8d | Opus · high | Tres videos (se separan si alguno pierde calidad) | especificado |
| 23.3 | **V5** Video general | V2, V3, V4 | Opus · high | Eclipse → llegada al local → escalera de los seis planes → elección | especificado |
| 23.4 | **3.9** QA y lanzamiento comercial | 2.3, V5 | Sonnet · high (revisión O2: Opus · high) | QA de las siete piezas en móvil y escritorio, plan de release y rollback; quita `noindex` con OK de Ignacio | especificado |
| 24 | **4.1** Consolidación EstateOS | 3.9 | Sonnet · high | Micrositio EstateOS consolidado en cambio revisable y contrato estable | especificado |
| 25 | **4.2** Catálogo de demos reales | 4.1 | Sonnet · medium | Catálogo verificado, gateways por alcance y matriz de disponibilidad | especificado |
| 26 | **4.3** Arquitectura reutilizable | 4.2 | Sonnet · high | SDD de reutilización, dos configuraciones y plan de extracción acotado | especificado |
| 27 | **4.4** Restaurantes · plan siguiente | 4.1, 4.3 | Sonnet · medium | Plan de expansión con descubrimiento y presupuesto por validar | especificado |
| 28 | **4.5** Ecommerce y próximas industrias | 4.4 | Sonnet · medium | Plan de ecommerce y cola posterior con criterios de activación | especificado |

**D11 (Ignacio, 26/10/2026): EstateOS en repositorio y subdominio propios.** Nombre del repo **`roofy`** «por ahora» y dominio `roofy.eclipse-business.com` (el subdominio ya está creado en Hostinger). Efectos: el lote **1.6** (nuevo; **ejecución al empezar la Fase 3**, entre 2.5 y 3.1, por indicación de Ignacio del 26/10/2026: el repo se crea al llegar a la fase de EstateOS) deja el esqueleto y la publicación de prueba; **3.5–3.9** construyen EstateOS en ese repo; **4.1** consolida allí; **4.3** se reduce a lo que falte de reutilización; la fila «Inmobiliarias» del selector de Eclipse-Web pasa a enlazar al subdominio (la demo de Lumen actual queda de respaldo hasta que esté publicado). Ignacio crea el repositorio cuando se llegue al 1.6. «Roofy» aparece en Notion como otro proyecto fuera de alcance: aquí es solo el nombre técnico del repo y del subdominio (a confirmar si se renombra).

**Verificación (script, ejecutado en este lote, 26/10/2026, antes de agregar 1.6):** 28 lotes, 42 dependencias, **0 violaciones**: toda dependencia aparece antes del lote que la usa, así que el grafo es **acíclico**. Se verificó contra la tabla de Notion, no contra el estado real de cada lote.

**Actualización 27/10/2026 (lote 3.1, D28–D36):** la Fase 3 se rearmó en siete piezas (demo general + una por plan, cada una con su video de motion graphics), con dos controles de estilo (la demo y el video de Contact) antes de replicar y de gastar, un kit de interacción premium (3.5b) y una demo completa por plan (3.6–3.8d), que absorben los antiguos 3.6, 3.7, 3.8 y las pantallas faltantes. Verificación con el mismo script sobre esta tabla: **41 filas, 65 dependencias, 0 violaciones** (toda dependencia aparece antes del lote que la usa). Detalle y motivos: `lote-3.1-direccion-estateos.md`.

**Notas de lectura:**
- Las fases 2, 3 y 4 listan sus lotes en orden lineal (2.1→2.5, 3.1→3.9, 4.1→4.5). Se **conserva el orden lineal** como orden de ejecución aunque varias dependencias sean más débiles, para mantener «un lote activo por vez».
- **3.5** depende de la integración de Fase 1 (1.5) y de la dirección 3.1; los assets de 3.3/3.4 son opcionales si se declara un *fallback* (póster y sonido actual).
- **3.9** exige la oferta de **2.3**; la revisión final O2 es una intervención Opus.
- **1.5** hereda el E2 que 0.1 dejó diferido; **2.1** puede empezar tras 1.1, pero sus **cambios** esperan el gate de 1.5.
- Cada fase termina con «un documento no acredita implementación»: una página escrita no pasa a `aceptado` por existir.

### Contradicciones detectadas al armar la matriz (para resolver en su lote)
| ID | Contradicción | Resolución propuesta | Lote |
|---|---|---|---|
| K1 | El criterio 4 de **2.3** dice que Contact incluye chat y kit de marca inicial; el anexo «Planes y cupos» (segmentación del 26/10) dice que Contact es **web básica sin chats internos**, y que el kit va en la puesta en marcha | Gana la fuente **más reciente y específica** (anexo del 26/10); corregir el criterio en la ficha de 2.3 | 2.3 |
| K2 | **0.4** prohíbe instalar skills; Ignacio aprobó el manifiesto de 0.3 | Aprobación registrada; instalación en sesión aparte (§1) | 0.3 / 1.4 |
| K3 | **0.4** dice «límites de gasto todavía USD 0»; Ignacio declaró topes (ElevenLabs 11/mes, Higgsfield 100/mes) | Los topes se registran; **el gasto autorizado sigue en USD 0** hasta un gate de gasto | ledger |
| K4 | **2.3** exige «exactamente seis precios» y marca Partner como propuesta, pero las cuotas dependen de costos aún inexistentes | Mostrar *precio comercial*, *derecho contratado* y *disponibilidad técnica* por separado (estados de oferta de 2.3) | 2.3 |
| K5 | La política de modelos (Notion) y el prompt de 0.4 dicen «Opus sin límite fijo»; el título del PR #1 original hablaba de «dos intervenciones» | Ya corregido en el PR #1 (0.2 §11 y §12) | cerrado |

## 7. Política operativa de modelos y esfuerzo

**Presets** (Notion «Modelos y control de consumo»; son decisiones de Eclipse, no un ranking universal):

| Trabajo | Modelo | Esfuerzo |
|---|---|---|
| Producción habitual, copy/fichas ya definidos, coordinación de assets, expansión documental | Sonnet | medium |
| Auditoría, decisiones SDD, frontend premium, integración, CRM, datos, seguridad y QA de aceptación | Sonnet | high |
| Concepto, dirección visual, storyboard, revisión audiovisual | Opus | high |
| Continuidad o interacción difícil con alcance delimitado | Opus | xhigh (si está disponible y justificado) |
| Corrección mecánica aislada dentro de un lote | Sonnet | medium; volver al preset para revisar |

**Reglas:** no usar `max`, no activar workflows automáticos ni `ultracode` por elegir un esfuerzo, y comprobar el nivel **efectivo** en el cliente (un nivel escrito en el prompt no sustituye la configuración). Si falta `xhigh`, se usa `high` y se **registra** la alternativa.

**Opus (sin límite fijo de dos; lo decide el valor, no el conteo).** Antes de cada intervención se escribe una **ficha Opus** de seis campos: lote · problema concreto · evidencia de entrada · beneficio esperado · entrega · criterio de salida. Después se registra modelo efectivo, esfuerzo, hora, uso visible antes/después, archivo/asset y aceptación. Se elige Opus **directamente** para un hito creativo previsto; para un problema imprevisto, primero se decide si necesita razonamiento superior o solo una corrección puntual. No se alterna de modelo para resumir lo que el mismo agente puede cerrar.

**Gate estético con Opus (lección «TableFlow»):** una intervención Opus que produce algo **peor que la línea base no se mergea**, aunque haya costado más. Se compara contra baseline en 360/390/768/1024/1440 con la rúbrica de Eclipse Design (≥ 12/14, sin bloqueantes, tres defectos escritos) y la comparativa de jerarquía, identidad, legibilidad, CTA, móvil, movimiento y honestidad.

**Qué requiere OK de Ignacio aunque Opus no tenga tope:** cargos adicionales, API fuera de la suscripción, créditos, cambio de plan o gasto irreversible. Falta de cupo se resuelve **priorizando el hito**, nunca activando cobro automático. No se inventa equivalencia USD/token de la suscripción.

**Registro de Opus hasta hoy:** 0 intervenciones (0.1–0.4 con Sonnet · high).

## 8. Criterios de parada

Se **detiene la acción dependiente** (y se sigue con lo independiente) cuando:
1. Falta una fuente crítica, un asset aprobado, un entorno para comprobar una afirmación o un permiso de gasto.
2. Dos correcciones no resolvieron el mismo defecto (§3.4): se guarda el repro.
3. Un gate pasaría con un costo inventado, un test no ejecutado o un dato sin rótulo.
4. Se alcanzó un techo de render o de gasto: **no se reintenta ni se cambia de proveedor** automáticamente.
5. Una intervención Opus no tiene ficha, o su resultado es peor que la línea base (§7).
6. Un cambio exige tocar producción, merge, deploy, envíos, cobros o publicidad paga sin autorización explícita.
7. El contexto se repite sin evidencia nueva: se corta y se vuelve con resumen de cierre, referencias o repro corregido.
8. Se detecta que una «propuesta» se está tratando como implementada (riesgo principal del lote).

**Pausa de producción ≠ bloqueo del programa:** si solo falta el gasto de render, se avanza con documentación, UI y QA independientes.

## 9. Plantillas

**SDD mínimo previo (G1):** id y objetivo · actor · evidencia del problema · HEAD · flujo feliz, alternativo, error y vacío (entrada, acción, salida, recuperación) · componentes · modelo de estado · datos y permisos · UI/motion · exclusiones · aceptación binaria · pruebas · riesgos · rollback · revisión · costo medible.

**Registro de sesión:** ver `registro-consumo.md` (tabla y campos). **Registro de asset propuesto, gate de gasto, margen y ciclo comercial:** ver `ledger-financiero.md`.

**Resumen de cierre reutilizable:** (1) qué quedó decidido, con la decisión de Ignacio citada; (2) dónde está el entregable (ruta y commit); (3) qué no se hizo y por qué; (4) qué sigue y su gate de entrada; (5) riesgos abiertos. Máximo 15 líneas. Lo pega la siguiente sesión como único contexto.

## 10. Criterios de aceptación de 0.4

| Criterio (Notion §12) | Estado | Evidencia |
|---|---|---|
| Cada lote registra modelo, dependencias y *evidence owner* | **Cumplido** para los 28 | §6 (modelo y dependencias); *evidence owner* = ejecutor, revisor Chief, aceptación Ignacio (§3.5 y §5) |
| Cada intervención Opus tiene motivo, entrega, criterio de salida y consumo; sin límite fijo | **Cumplido** | §7 (ficha Opus de seis campos) |
| Sin costos de tokens inventados ni gastos por inferencia | **Cumplido** | `registro-consumo.md`: solo valores informados por la herramienta, con su límite; `ledger-financiero.md`: costos desconocidos = «no disponible» |
| Se distingue costo marginal de render de compromiso mensual mínimo | **Cumplido** | `ledger-financiero.md` §5 (Higgsfield y ElevenLabs: tope mensual ≠ costo por clip) |
| Pruebas y capturas clasificadas ejecutadas/no ejecutadas, con entorno | **Cumplido** | Este lote no ejecutó pruebas de producto ni capturas (documental): §11 |
| Cada afirmación de funcionamiento con evidencia o rótulo no probada/simulada | **Cumplido** | Niveles E0–E4 (§3.3); este documento solo afirma E0/E1 |
| Sin gastos, publicaciones o cambios de alcance implícitos | **Cumplido** | USD 0; nada publicado ni instalado; K2 y K3 resueltas por escrito |
| Se preservó el contenido previo vigente y se documentó lo sustituido | **Cumplido** | §1 y §6 (K1–K5), con fuente, fecha y razón |

## 11. Qué se ejecutó y qué no (clasificación)

- **Ejecutado (documental):** lectura de 10 páginas de Notion; `get_session`; `git rev-parse`/`status`; verificación de acíclico del grafo (script, 28 lotes y 42 aristas); revisión de enlaces internos y de placeholders al cerrar (§12).
- **No ejecutado:** `npm ci`, tests, lint, typecheck, build, capturas, Playwright, cualquier medición de LCP/CLS/INP, llamadas a proveedores, instalaciones. Motivo: lote documental y exclusión expresa.
- **Entorno:** contenedor en la nube de Claude Code 2.1.310; sin acceso a la cuenta de facturación ni a la cuota de la suscripción.

## 12. Verificación documental del cierre
Ver el resultado en la sección final de `registro-consumo.md` (entrada de 0.4). 

## 13. Handoff y próximo lote

- **Habilita:** **1.1 Arquitectura de información** (Sonnet · high), tras la **aceptación de 0.4** por Ignacio.
- **Entrega:** `lote-0.4-sdd-control-financiero.md`, `ledger-financiero.md`, `registro-consumo.md`.
- **Pendiente antes de 1.1 (de Ignacio):** aceptar 0.4; opcionalmente, indicar si se hace antes la sesión de instalación de A, B y C (§1).
- **Rollback:** estos documentos son nuevos; revertir = quitar los tres archivos y las líneas agregadas en 0.2/0.3/auditoría §24, sin tocar producción.
