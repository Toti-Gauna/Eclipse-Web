# Eclipse v3 · Fase 0 · Lote 0.2 — Agentes y PR 1 (revisión documental)

**Fecha:** 26/10/2026 · **Modelo y esfuerzo efectivos:** `claude-sonnet-5-5`, esfuerzo `high` (comprobado con `get_session`: `configured_model`, `last_served_model` y `effort_level`) · **Tipo:** documental. No se editó la PR, no se hizo merge, no se instaló ningún agente ni skill, gasto externo USD 0.

## 0. Informe en tres líneas

- **Qué cambió:** revisé los 7 archivos de la PR #1 de `agents` (3 agentes en versión Claude Code y Codex, más README) y las 5 skills internas que el plan propone reutilizar. Veredicto: **adopción condicionada** a 14 correcciones (§3), un RACI con un único responsable por decisión (§4), una política de Opus consolidada (§5) y 5 rutas probadas en papel (§6).
- **Qué quedó abierto:** nadie aplicó las correcciones a la PR (este lote no la edita) y falta comprobar en Claude Code, antes de instalar, que el alias `model: sonnet` y los campos del encabezado se aceptan (§7). Dos skills internas (`ai-video-prompt`, `creative-direction`) chocan con el flujo vigente y hay que ajustarlas antes del lote 3.1/3.3.
- **Qué necesita el OK de Ignacio:** quién y cuándo aplica las correcciones a la PR #1 y si se mergea (gate G5); y la política de Opus de §5, en especial el criterio estético contra la línea base.

## 1. Registro de entrada

| Elemento | Valor | Verificado |
|---|---|---|
| `agents` `main` | `a811427d944500ecfb43234494129e89b19a3b17` | `git ls-remote`, 26/10/2026: sin cambios desde la base |
| PR #1 (draft, abierta, mergeable limpia) | base `a811427`, head `a6ee0c8ea26bc531fc6efe4916e5cd7c62efe770`, 23 commits, 7 archivos, +332 líneas | rama traída con `git fetch`; head idéntico al de la base del 23/10 |
| Eclipse-Web `main` · Eclipse-be `main` · portal interno `main` · email-kit `main` | `6bf91ae…` · `3754947…` · `3907160…` · `9cef2eaf…` | `git ls-remote`, sin cambios |
| Contexto de sesión | 537 k de 1 M de tokens usados al iniciar este lote | `get_session` |

La PR cambia solo archivos nuevos (no toca los agentes existentes). **Licencia:** el árbol de `agents` no tiene `LICENSE` en la raíz; es de uso propietario de Eclipse y no se redistribuye como paquete público sin aclarar derechos.

## 2. Qué hay en la PR

| Archivo | Líneas | Rol |
|---|---|---|
| `eclipse-chief-claude-code/claude-code/agents/eclipse-chief.md` | 47 | Dirección de producto y coste, gates G0–G5, política antidespilfarro |
| `eclipse-chief-codex/codex/AGENTS.md` | 42 | Mismo contenido para Codex |
| `eclipse-ux-ui-claude-code/claude-code/agents/eclipse-ux-ui.md` | 57 | Dirección de arte, motion, gateway de 4 accesos |
| `eclipse-ux-ui-codex/codex/AGENTS.md` | 56 | Mismo para Codex |
| `eclipse-marketing-claude-code/claude-code/agents/eclipse-marketing.md` | 50 | Canales, SDD de campaña, Studio e IA |
| `eclipse-marketing-codex/codex/AGENTS.md` | 45 | Mismo para Codex |
| `eclipse-v3-agents/README.md` | 35 | Índice, prioridades, integración |

Los tres agentes de Claude Code declaran `model: sonnet`. Los de Codex no tienen encabezado y repiten el título («# Eclipse Chief — Codex» seguido de «# Eclipse Chief»).

## 3. Hallazgos y corrección propuesta, por archivo

Cada corrección se aplica a **ambas** variantes (Claude Code y Codex) salvo que se indique.

### Chief

1. **Regla de Opus contradictoria (crítico).** «Reglas globales» dice que Opus solo se usa «después de dos alternativas documentadas… y OK explícito de Ignacio» y la «Política antidespilfarro» (punto 2) lo limita a «arquitectura irresuelta o impacto irreversible», mientras la excepción añadida al final autoriza Opus para EstateOS. Contradice la política vigente del 24/10 (Opus por valor creativo o dificultad, sin límite fijo de dos y sin nuevo OK por cantidad) y la decisión del 26/10 (§5). *Corrección:* reemplazar ambos pasajes por la política consolidada de §5.
2. **G1 «Ticket sin piso monetario, sí margen/hora».** Puede leerse como que no hay mínimo comercial. *Corrección:* «alcance y margen sujetos al tarifario vigente; nunca por debajo de lo aprobado por Ignacio».
3. **Precios SaaS «USD 30/75/150/199… propuesta».** Hoy hay tres cosas distintas: el catálogo general aprobado 30/75/150, el nivel 199 (hipótesis) y el catálogo sectorial EstateOS (30/75/100/150/200 como dirección de Ignacio; Partner 500 y cupos, propuesta). *Corrección:* nombrar los tres y agregar «mismo importe no implica misma oferta».
4. **Falta la regla de Contexto Eclipse (03/10):** Chief «no escribe ni modifica código ni repositorios». *Corrección:* agregarla al encabezado y al «Output obligatorio».
5. **Falta Ofertas y precios** entre las fuentes. *Corrección:* agregar la página.
6. **Duplicado de título en Codex.** *Corrección:* dejar un solo encabezado.

### UX/UI

7. **Cuatro líneas sin Academy (crítico).** La versión Claude Code dice «explorador de cuatro recorridos (SaaS, Agency, Studio, Equipamiento)»; la versión Codex ya dice cinco. *Corrección:* cinco líneas en ambas, y aclarar que los cuatro accesos del micrositio (Ver con guía / Branding / Intelligence / Academy) son modos de demo, no las líneas.
8. **Entrada a los rubros desactualizada.** Habla de «portada + explorador de líneas». El diseño vigente es: «Qué ofrecemos» (5 líneas y packs) → «Para tu PyME» → modal de rubros abierto desde «Quiero potenciar mi negocio» o «Ver opciones». *Corrección:* describir ese flujo.
9. **Falta el contrato de guía vigente (26/10).** En EstateOS, el modal «Ver con guía / Ver por mi cuenta» aparece **en cada recarga**; «Ver con guía» activa el teaser; el teaser no se repite si `localStorage` guarda «visto», salvo que el usuario pida verlo desde cero. *Corrección:* incluirlo y marcar que reemplaza la regla «nada se recuerda» de `CLAUDE.md`.
10. **Skills externas desalineadas.** Dice buscar Scrollcraft, GSAP Skills y WebGL Animation Skills. La selección vigente (página «Stack») prioriza skills internas + Frontend Design (una sola vía) + Emil + GSAP React/Timeline/Performance + GLSL selectivo; Scrollcraft, Theatre.js y Remotion están pospuestos. *Corrección:* alinear.
11. **Falta el criterio estético contra la línea base** (decisión del 26/10, §5) y la regla «un CTA ámbar sólido por viewport» de `CLAUDE.md`. *Corrección:* agregar ambos.
12. **Solapamiento UX/Frontend.** «Implementar cambios de copy/layout/estilos reutilizando» le asigna implementación a UX. *Corrección:* UX especifica y acepta; Frontend implementa (§4).

### Marketing

13. **Herramientas de IA.** «Higgsfield y Dreamina son candidatos, verificar modelos y precios». El stack confirmado el 24/10 es Claude + Higgsfield + ElevenLabs + Suno; Dreamina no está. *Corrección:* alinear y mantener «verificar modelo, precio, derechos y techo antes de producir».
14. **LinkedIn.** Está en la lista de canales con «CTA a demo/calificación». *Corrección:* aclarar que es canal de contenido posible y que no se lanza prospección por LinkedIn mientras no esté encargada.

### README

Misma alineación que 7, 10 y 13 (skills externas, Dreamina, cuatro líneas) y agregar el flujo de la entrada (punto 8). Se conserva «copiar a los repos destino solo mediante PR y revisión».

### Skills internas que el plan reutiliza (lectura de cabecera y de las dos más sensibles; no se auditaron todas línea por línea)

| Skill | Hallazgo | Acción antes de usarla |
|---|---|---|
| `creative-direction` (trailer) | Manda un **panel de tres directores «en paralelo, independientes»**. El plan vigente prohíbe el fan-out. | Usarla como tres alternativas escritas **en secuencia** dentro de una sola intervención (así lo prevé 3.1) |
| `ai-video-prompt` (trailer) | Afirma que Higgsfield Genjutsu es video-a-video y exige 4–30 s de video fuente. El flujo del plan parte de imágenes clave. | Verificar en la cuenta qué modelo y qué entradas admite Higgsfield antes de 3.3; ajustar la skill si cambió |
| `gsap-trailer-engine` | Motor de trailer *in-app* con GSAP; distinto del host WAAPI de las demos. | No lo uses para reemplazar `motion.ts` (Notion 1.4 lo prohíbe) |
| `component-crops` (trailer) | Hace `pip install --target` de Pillow en una carpeta temporal. | Es una instalación: requiere autorización de 0.3, no se invoca por iniciativa propia |
| `ui-component-architecture`, `performance-analysis` (frontend) | Existen en `main`; son las dos que el plan reutiliza. | Sin hallazgos en lo leído |
| Metadatos de `frontend-architect.md` y `trailer-arquitect.md` | `model: Claude Sonnet 4.6 (copilot)`: es el alias de otra herramienta (Copilot), no un alias de Claude Code. | No copiar ese valor; verificar el alias efectivo (§7) |

## 4. RACI propuesto (un solo responsable final por decisión)

| Decisión o tarea | **Decide (A)** | Ejecuta (R) | Consultados (C) |
|---|---|---|---|
| Alcance de lote, gates, registro de consumo | Eclipse Chief | Ejecutor Sonnet | UX/UI, Frontend |
| Gasto, publicación, merge a `main`, deploy | **Ignacio** | Ejecutor (hace el merge tras aprobación) | Chief (registra) |
| Precios, cupos, tarifas | **Ignacio** | Marketing (propone texto), Frontend/Backend (reflejan) | Chief |
| Flujos, estados, navegación, accesibilidad y recorrido | UX/UI (firma la especificación) | Frontend | Chief, Design |
| Lenguaje visual: tipografía, estilo, materiales, movimiento, 3D y aceptación estética | **Eclipse Design** (firma el gate estético) | Frontend | UX/UI, Chief |
| Concepto, guion, copy y variantes de piezas publicitarias | Eclipse Ads | Eclipse Ads | Design, Marketing, Ignacio |
| Implementación de componentes y copy en el sitio | Frontend Architect | Ejecutor Sonnet | UX/UI |
| Oferta comercial, guion de venta, canales | Marketing | Marketing | Chief, Ignacio |
| Gramática audiovisual, continuidad, prompts de medios | Eclipse Design (`higgsfield-direction`) y Trailer Architect para trailers | mismo | UX/UI, Marketing, Ads |
| Contratos de BE, auth, catálogo | Backend Architect (conserva contratos) | Ejecutor Sonnet | Seguridad, Chief |
| Revisión de límites de seguridad y datos | Cybersecurity Architect | Cybersecurity Architect | Backend, Chief |
| Código y repositorios | — | **Ejecutor**; Chief nunca escribe código | — |

Los roles son **perspectivas que el mismo ejecutor aplica en secuencia**, sin subagentes paralelos salvo encargo expreso y presupuesto.

## 5. Política de modelos propuesta (reemplaza los pasajes en conflicto de Chief)

1. **Sonnet** por defecto: investigación, implementación, integración y QA. Esfuerzo `medium` para trabajo bien definido; `high` para auditoría, arquitectura, frontend premium y QA de aceptación (presets de «Modelos y control de consumo»).
2. **Opus no es el modo por defecto.** Se usa en hitos justificados donde sube la estética o resuelve un problema difícil y delimitado (dirección visual, storyboard, revisión cinematográfica, interacción central). No hay límite fijo de dos ni nuevo OK por cantidad; sí se registra motivo, entrega, criterio de salida y consumo visible.
3. **Criterio estético (decisión del 26/10/2026, Ignacio):** la estética del CRM y de la web se mantiene o mejora respecto de su línea base; cada intervención Opus pasa un gate antes/después con capturas. Si el resultado es peor que la baseline, **no se mergea** y se vuelve a la versión anterior. Motivo registrado: la experiencia previa con TableFlow (uso excesivo de Opus con resultado estético deficiente).
4. Cargos adicionales, créditos, cambio de plan o API fuera de la suscripción: se presenta importe y alcance antes de comprometerlos; nada se activa por inferencia.
5. `xhigh` solo para un problema difícil y delimitado, y solo si el cliente lo admite; `max` no es preset.

## 6. Prueba en papel de cinco rutas (con la PR como está y con las correcciones)

| # | Pedido | Ruta esperada | Resultado con la PR **sin** corregir | Con las correcciones |
|---|---|---|---|---|
| 1 | **Header** flotante con vidrio | UX/UI especifica y firma → Frontend implementa → QA. Chief solo si cambia el alcance. Sonnet. | **Falla parcial:** UX también «implementa» (hallazgo 12): dos responsables | UX decide, Frontend implementa |
| 2 | **«Pipeline»** | Depende del objeto: Kanban del CRM de Lumen (Frontend + UX), pipeline comercial (Marketing) o pipeline de medios (Trailer). | **Falla por ambigüedad:** nada indica cómo desambiguar | Chief pregunta por el objeto y rutea; sin BE para la demo |
| 3 | **Render pago** (Higgsfield/ElevenLabs) | Trailer arma brief y cotización; Chief bloquea hasta que Ignacio apruebe modelo, cantidad y tope en USD (gates A3/A4). | **Pasa:** Chief («no gastar en video/voz») y Marketing («cotizar consumo antes de producir») coinciden | Igual |
| 4 | **Cambio de precio o plan** | Solo Ignacio aprueba; Marketing propone el texto; Chief registra; 2.2 coordina FE/BE. | **Falla:** G1 «sin piso monetario» (hallazgo 2) puede leerse como permiso | Pasa tras corregir G1 |
| 5 | **Pedido sobre Roofy** | Chief responde «fuera de alcance: proyecto futuro separado»; nadie ejecuta. | **Pasa:** los tres agentes repiten la exclusión | Igual |

## 7. Qué verificar en Claude Code antes de instalar (no probado en este lote)

- Que el alias `model: sonnet` se resuelva a un modelo disponible y respete el esfuerzo elegido con `/model` y `/effort` (el contenedor corre Claude Code `2.1.310`, dato de `get_session`; el comportamiento de los agentes no se probó).
- Que el encabezado (`name`, `description`, `user-invocable`, `model`) lo acepte la versión instalada en la máquina de destino.
- Que las rutas `.claude/agents/` sean el destino correcto: son destinos **propuestos**, ningún agente está instalado hoy.
- Que no haya otro agente con el mismo nombre en los repos destino.

## 8. Criterios de aceptación de 0.2

- [x] Los 7 archivos de la PR contrastados y diferencias entre herramientas anotadas (hallazgos 6, 7).
- [x] Academy presente en las cinco líneas y accesos de demo diferenciados (hallazgo 7).
- [x] RACI sin dos responsables finales (§4).
- [x] Sin permiso implícito para fan-out ni consumo externo (§4, §5).
- [x] Veredicto con correcciones y cinco casos con resultado esperado (§3, §6).
- [x] Afirmaciones de funcionamiento con evidencia o rotuladas como no probadas (§7).
- [x] Sin gastos, publicaciones ni cambios de alcance. Único cambio: este documento.
- [x] Contenido previo preservado; supersesiones con fuente y fecha (§3 punto 1; decisiones del 26/10).

## 9. Límites

No se leyeron línea por línea las skills de backend, seguridad, juegos ni documentación (no pertenecen al cambio). De las skills de trailer y frontend se leyeron las cabeceras y los pasajes de riesgo; `creative-direction` y `ai-video-prompt` se leyeron completas. No se ejecutó ningún agente ni se instaló nada. La PR sigue en `a6ee0c8`.

## 10. Próximo lote

**0.3 · Skills verificadas** (documental): catálogo con cobertura, compatibilidad, manifiestos de instalación propuestos, riesgos y pruebas. Modelo: **Sonnet, esfuerzo high** (según «Orden de ejecución»). No instala nada.

## 11. Seguimiento: correcciones aplicadas a la PR #1 (26/10/2026)

Ignacio autorizó al ejecutor a editar la PR («vos codeá… yo luego apruebo el PR 1»). Se aplicaron las 14 correcciones de §3 sobre la rama de la PR (`feature/eclipse-v3-core-agents`), commit **`60f3f75`** sobre `a6ee0c8`: 7 archivos, +54/−55 líneas. Cada reemplazo se hizo con coincidencia exacta; no quedó texto viejo (`grep` de las frases originales: 0 resultados).

- **Aplicadas:** 1 (Opus), 2 (G1), 3 (catálogos de precios), 4 (Chief no escribe código), 5 (fuente de precios), 6 (título duplicado en Codex), 7 y 8 (cinco líneas con Academy y flujo de entrada), 9 (contrato de la guía de EstateOS), 10 (selección de skills), 11 (gate estético y un CTA ámbar), 12 (UX especifica, Frontend implementa), 13 (stack de IA), 14 (LinkedIn) y los pasajes equivalentes del README.
- **No tocadas** (no están en la PR): las skills `creative-direction` y `ai-video-prompt` y el alias `Claude Sonnet 4.6 (copilot)` de los agentes que ya están en `main`. Siguen abiertas para antes de 3.1 y 3.3.
- **No hecho:** el merge de la PR #1 a `main`. La aprueba Ignacio; sigue en borrador.
- **Sigue sin probarse** (§7): que Claude Code acepte `model: sonnet` y el encabezado antes de instalar.

## 12. Agentes nuevos y arreglo (26/10/2026)

- **Arreglo en la PR #1** (commit `3c3f1cd`): mi script de correcciones dejó un `\1` suelto en 4 archivos (UX/UI y Marketing, Claude Code y Codex). Quedó reemplazado por «6. Gate estético» y «- LinkedIn:». `grep '^\\1'`: 0 resultados. También actualicé el cuerpo de la PR, que todavía decía «dos intervenciones acotadas» de Opus.
- **PR #2 (borrador, apilada sobre #1):** `feature/eclipse-v3-design-ads-agents`, commit `061639e`. Agrega **Eclipse Design** (7 skills internas) y **Eclipse Ads** (6 skills internas), con variantes Codex y README. El RACI de §4 queda actualizado: UX/UI firma flujos y accesibilidad; Design firma el lenguaje visual y la aceptación estética.
- **Límites declarados:** las tarifas de Higgsfield, las especificaciones de plataformas y las licencias de fuentes figuran como «verificar vigente»; no son presupuesto. No se instaló ni gastó nada. La aprobación de #1 y #2 es de Ignacio.
