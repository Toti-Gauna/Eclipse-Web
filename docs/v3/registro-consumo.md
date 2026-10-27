# Registro de consumo y sesiones

**Creado en el lote 0.4 · 26/10/2026.** Registro manual, una fila por sesión de lote y una por cada intervención Opus. Si una métrica no está visible se escribe **«no disponible»**: no se estiman tokens ni se convierte una suscripción en USD por token.

## 1. Campos

| Campo | Contenido |
|---|---|
| Lote | id y título |
| Modelo / esfuerzo | configurado **y** efectivo (`get_session`: `session_context.model`, `last_served_model`, `effort_level`) |
| Inicio / fin | hora local (Argentina, UTC−3) |
| Contexto recuperado | resumen de cierre usado; compactaciones |
| Archivos leídos / tocados | rutas |
| Resultado | estado del lote (§3 del contrato) |
| Reintentos y causa | si hubo regeneración, por qué |
| Cuota / tokens | solo lo que la herramienta expone, con fecha y límite |
| Costo externo | cotizado / real (por defecto USD 0) |
| Evidencia | enlace a commit y documento |
| Opus | motivo, entrega, criterio de salida, uso antes/después (solo si intervino) |

## 2. Qué se puede medir hoy (y qué no)

- **Disponible (herramienta de sesión, `get_session`):** modelo y esfuerzo efectivos; uso acumulado de la sesión (tokens de entrada/salida, lectura y escritura de caché) y un campo `cost_usd`; uso de contexto (`used_tokens` sobre `max_tokens`); estado de la ventana de límite de 5 horas.
- **No disponible:** cuota de la suscripción de Claude, consumo por lote, consumo por llamada, precio por token de esta cuenta. El campo `cost_usd` que informa la herramienta es un **valor de la sesión, no el cargo a la suscripción**: se cita como dato, **no** se usa para calcular costos de lotes ni de clientes.
- **Subagentes:** la herramienta de sesión no separa el uso por subagente; el detalle por lote de 0.1–0.3 no está en este registro y se puede reconstruir del transcript si hace falta.

## 3. Registro de sesión

La sesión de Claude Code de Eclipse v3 (`session_01Tg555M4D4VmSrwxyrCMu2q`, creada el 24/10/2026 16:30 UTC) es **una sola conversación continua con compactaciones de contexto**; los lotes 0.1–0.4 corrieron dentro de ella, así que las métricas siguientes son **acumuladas** y no se pueden repartir por lote.

| Lote | Modelo / esfuerzo (efectivo) | Resultado | Opus | Costo externo | Evidencia |
|---|---|---|---|---|---|
| 0.1 Estado real | `claude-sonnet-5-5` · high | aceptado (E2 diferido a 1.5) | 0 | USD 0 | `auditoria-0.1-estado-real.md` |
| 0.2 Agentes y PR 1 | `claude-sonnet-5-5` · high | verificado local; PR #1 (`3c3f1cd`) y #2 (`061639e`) a la espera de Ignacio | 0 | USD 0 | `lote-0.2-agentes-pr1.md` §11–12 |
| 0.3 Skills verificadas | `claude-sonnet-5-5` · high | aceptado con alcance A, B, C; nada instalado | 0 | USD 0 | `lote-0.3-skills-verificadas.md` |
| 0.4 SDD y control financiero | `claude-sonnet-5-5` · high | **aceptado** (Ignacio, 26/10/2026) | 0 | USD 0 | `lote-0.4-sdd-control-financiero.md` |
| 1.1 Arquitectura y wireflows | `claude-sonnet-5-5` · high | **aceptado** con D1–D5 (Ignacio, 26/10/2026) | 0 | USD 0 | `lote-1.1-arquitectura-wireflows.md` |
| 1.4 Motion y dirección visual | `claude-opus-5-5` · high | verificado local; pendiente de aceptación | **1** | USD 0 | `lote-1.4-motion-direccion-visual.md` |

**Lectura de la herramienta de sesión, 26/10/2026 ≈ 13:33 UTC (10:33 ART), al abrir 0.4 (`get_session`):**
- Tokens: entrada 13.760 · salida 259.575 · lectura de caché 41.984.086 · escritura de caché 1.927.672.
- `cost_usd` informado por la herramienta para la **sesión acumulada**: 14,108 (valor de la herramienta; **no** es un cargo a la suscripción ni un costo por lote).
- Contexto: 143.773 de 1.000.000 tokens usados en la ventana actual.
- Ventana de límite de 5 horas: estado «allowed», sin uso de *overage*; reinicia 17:10 UTC (14:10 ART).
- **Cuota de suscripción:** no disponible.

## 4. Cierre del lote 0.4

- **Verificación documental (26/10/2026):** se comprobaron los enlaces internos de `lote-0.4-sdd-control-financiero.md`, `ledger-financiero.md` y este archivo (todos existen; `CLAUDE.md` y `AGENTS.md` son los de la raíz del repo) y se buscaron placeholders (`TODO`, `TBD`, `XXX`, plantilla sin reemplazar): **0 encontrados**. El grafo de 28 lotes y 42 dependencias es acíclico (script).
- **Entorno:** contenedor en la nube de Claude Code 2.1.310; sin pruebas de producto ni capturas (lote documental).
- **Consumo de 0.4:** por lote **no disponible**; el acumulado de la sesión está en §3. Reintentos: 0 en este lote; una corrección propia de redacción en el ledger (hipótesis de horas de Growth) antes del commit.
- **Opus:** 0. **Gasto externo:** USD 0.

## 4.a Lectura de la herramienta de sesión durante 1.1 (26/10/2026 ≈ 14:19 UTC, 11:19 ART)

Segunda lectura de `get_session`. **Diferencia contra la lectura de §3 (13:33 UTC), que cubre el cierre de 0.4, la instalación de skills y 1.1 juntos; no se puede separar por lote:**
- Tokens de entrada +1.086 (→ 14.846) · salida +69.551 (→ 329.126) · lectura de caché +9.578.307 (→ 51.562.393) · escritura de caché +166.511 (→ 2.094.183).
- `cost_usd` informado por la herramienta: de 14,108 a 16,433 (**+2,325**; valor de la herramienta, **no** un cargo a la suscripción ni un costo por lote).
- Contexto de la ventana actual: 143.773 → 312.832 de 1.000.000.
- Ventana de 5 horas: «allowed», sin *overage*. Cuota de suscripción: no disponible.
- Reintentos de 1.1: 0 de regeneración; 6 correcciones de redacción propias antes del commit (CTA con enlace real, conteo de openers, nombre de la vertical `tiendas`, orden de reglas de URL, fila de «CTA principal» y de «Selector»).

## 4.b Sesión de instalación de skills (26/10/2026, entre 0.4 y 1.1)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high (misma sesión). **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** 9 skills, 19 archivos instalados y verificados byte a byte; nada ejecutado de los repos de origen. Evidencia: `skills-instaladas.md`.
- **Reintentos:** 0. **Pendiente:** *smoke* de carga (E2) en la sesión de 1.1. Consumo por tarea: no disponible.

## 5. Intervenciones Opus

**O-1.4 · 26/10/2026.** Ignacio cambió el modelo a `claude-opus-5-5` con `/model` y pidió ejecutar 1.4 con Opus high.
- **Ficha:** `lote-1.4-motion-direccion-visual.md` §1 (lote · problema · evidencia · beneficio · entrega · criterio de salida).
- **Modelo y esfuerzo efectivos:** `claude-opus-5-5` · high (`get_session`). Inicio ≈ 14:34 UTC (11:34 ART).
- **Uso visible antes:** entrada 15.414 · salida 404.016 · caché 64.412.618 / 2.259.637 · `cost_usd` 19,13 (acumulado de sesión). **Después:** la herramienta devolvió **los mismos valores** a las 14:47 UTC (su campo de uso no se actualizó durante el lote): **consumo de la intervención no disponible**.
- **Trabajo hecho por Opus en lugar de Sonnet:** también el baseline (capturas y mediciones), que el plan híbrido asignaba a Sonnet, porque Ignacio pidió avanzar en el mismo turno.
- **Aceptación:** pendiente de Ignacio. La puerta estética real se pasa en 1.2/1.3 contra el baseline. Cada una se registra aquí con la ficha de seis campos (lote · problema · evidencia de entrada · beneficio · entrega · criterio de salida) y modelo efectivo, esfuerzo, hora, uso antes/después y aceptación.

## 6. Lote 1.2 · Home, loader y hero (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high (Ignacio volvió con `/model` tras 1.4). **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** código de la home + `lote-1.2-home-loader-hero.md`; rúbrica 12/14 contra el baseline de 1.4. PR abierto, sin mergear.
- **Reintentos / correcciones propias antes del commit:** titular en portugués acortado (4 líneas → 3); ajuste de `lines.css`; chips del chat del agente filtrados a los rubros vigentes (B3); 6 pruebas de e2e actualizadas por el cambio de estructura. Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 7. Lote 1.3 · Header y selector inmersivo (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** código del header, selector, History y contrato de URL + `lote-1.3-header-selector.md`; rúbrica 12/14; 400 pruebas unitarias y 72 e2e. PR abierto, sin mergear.
- **Reintentos / correcciones propias antes del commit:** (1) el CTA no abría el selector porque `SmoothAnchors` interceptaba el clic en captura → opt-out `data-opens-selector`; (2) `prettier` con su configuración por defecto reformateó archivos propios → reformateo con el estilo del repo; (3) regla de lint de componentes creados en render → el cuerpo reintentable pasó a `useState`; (4) tres expectativas del e2e (texto en mayúsculas por CSS, foco tras Adelante, error de chunk esperado). Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 8. Lote 1.5 · QA visual y rendimiento (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** `lote-1.5-qa-visual-rendimiento.md`, 150 celdas, 5 defectos corregidos (2 P1, 3 P2), A/B de 5 rondas, 33 comprobaciones de robustez, e2e 72/72. PR abierto, sin mergear.
- **Reintentos / correcciones propias:** (1) la «fuga» de ~1.400 nodos por apertura era del arnés (`waitForSelector` retiene el elemento): se midió de nuevo con `locator().waitFor()` y los nodos quedan planos; (2) el detector de anillo de foco no veía el anillo dibujado en un `::after` (falso fallo); (3) el contraste «1,08:1» del portal era el parpadeo del header medido en el instante de carga; (4) un `pkill -f` cortó mi propia shell (sin pérdida). Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible. Duración larga por las corridas de rendimiento (≈ 25 min cada una de 3 y 5 rondas).

## 9. Lote 2.1 · Arquitectura comercial (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** `lote-2.1-arquitectura-comercial.md` (documental): modelo de oferta, matriz de las 20 piezas contra las cinco líneas (generada desde `items.json`, verificada: 20/20, 0 diferencias de precio), cinco líneas con ejemplos por industria, orientaciones PyME, contrato de packs, copy propuesto, decisiones D12–D15. Sin cambios de producto.
- **Reintentos / correcciones propias:** un identificador de Notion mal copiado (se reintentó con la URL); un script con delimitador de bloque mal cerrado (se reescribió desde archivo). Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 10. Lote 2.2 · Precios y catálogo coherente (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** `lote-2.2-precios-catalogo.md`; comparación FE↔BE medida con el guard real (41 diferencias contra el BE de `main`, 51 contra el PR #10); prueba permanente `catalog-be-reconciliation` con fixture del PR #10; D15 (pie sin unidades); matriz 30/75/150/199 y tres escenarios con margen indeterminado; 405 pruebas unitarias pasan. Sin cambios en `/content`, `lib/pricing.ts` ni backend.
- **Reintentos / correcciones propias:** una fila del documento (precio de `landing` en FE/BE) estaba al revés y se corrigió contra los datos antes del commit; un script de conteo en Python falló por el formato del JSON y se rehízo leyendo el campo correcto. Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 11. Lote 2.2b · Retiro de ofertas y comparador de planes mensuales (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** `lote-2.2b-retiro-ofertas-planes-mensuales.md`; ofertas y asesorías ocultas (no borradas), comparador de planes mensuales, demos sin oferta, enlaces `/plan` viejos tolerados, guard con lo vendible; 410 pruebas unitarias, e2e 75/75, 3 capturas de la sección y medición de alineación/desborde/objetivos táctiles en 7 combinaciones.
- **Reintentos / correcciones propias:** (1) 11 pruebas fallaron por el cambio de modelo y se actualizaron una por una (no se relajó ninguna); (2) 3 comprobaciones e2e dependían de las ofertas (filas, precio en la demo, enlace `/plan` con pack) y se reescribieron; (3) el check «header claro sobre precios» dependía de haber hecho clic en una fila: se scrollea a la tabla; (4) una nota de CLAUDE.md afirmaba que Studio/Academy cuentan dentro de las 2 h sin que Ignacio lo hubiera dicho: se corrigió a «por confirmar». Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 12. Lote 2.3 · EstateOS · planes y bienvenida (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Subagente:** 1 de solo lectura (auditoría de `Eclipse-be` y del portal interno), verificado por mí en los puntos clave. **Gasto externo:** USD 0.
- **Resultado:** `lote-2.3-estateos-planes-bienvenida.md` (documental), catálogo versionado `estateos/catalogo-estateos.v1.json` con digest y 10 pruebas que lo vigilan; matriz requisito → estado real; hoja económica con margen indeterminado; guion ES-INTRO con dos correcciones medidas; wireflows; brechas S0–S4; decisiones D19–D23.
- **Reintentos / correcciones propias:** (1) tres páginas de tarifas externas no abrieron (el entorno bloquea los hosts): se registró el límite y se usaron solo referencias secundarias rotuladas «no validadas»; (2) una frase sobre los topes de proveedor no tenía sustento y se reemplazó antes del commit; (3) el guion del anexo B tenía un capítulo a 3,14 palabras/s y otro con la oferta vieja de Contact: se detectaron midiendo y se corrigieron. Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 13. Lote 2.3b · Modelo único de planes (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** `lote-2.3b-modelo-unico-de-planes.md`; `content/levels.json`, `Levels` en «Precios», FAQ/«Cómo se paga»/bloque de proyecto sin los tres planes viejos; 425 pruebas unitarias y e2e 75/75; capturas 360/1440.
- **Reintentos / correcciones propias:** (1) el botón principal decía «Potenciar mi negocio» en los seis niveles: se cambió a «Ver la demo»; (2) el e2e buscaba «Propuesta» y el texto sale en mayúsculas por CSS: se hizo insensible a mayúsculas; (3) un import sin uso. Alcance decidido a partir de una aclaración de Ignacio, sin respuesta explícita al «¿hago el 2.3b?»: queda como PR para su revisión. Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 14. Lote 2.4 · Packs inmobiliarios (26/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · medium (según el prompt del lote). **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** `lote-2.4-packs-inmobiliarios.md` (documental), catálogo versionado `estateos/packs-inmobiliarios.v1.json` con digest y 9 pruebas que lo vigilan; modelo de presupuesto con supuestos rotulados; equivalencias con los cupos de los planes; regla de geometría del plano 2D; canales del kit de redes; decisiones D24–D26.
- **Reintentos / correcciones propias:** dos cifras que había puesto sin respaldo («hasta 6 imágenes de referencia» y «hasta 10 fotos») se quitaron antes del commit porque el prompt no las fija. Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 15. Lote 2.5 · Conversión y seguimiento (27/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · medium (según el prompt del lote). **Opus:** 0. **Gasto externo:** USD 0.
- **Resultado:** `lote-2.5-conversion-seguimiento.md` (documental): embudo atado a registros reales del CRM, pitch de 90–120 s medido, propuesta desglosada, eventos mínimos, convención de registro, cadencia, prueba y atribución; catálogo y packs v2 con las decisiones del 27/10; aviso de «Precios» actualizado (es/en/pt). 437 pruebas unitarias.
- **Reintentos / correcciones propias:** (1) el catálogo ya tenía pruebas atadas a «puesta en marcha A cotizar» y a la versión: se versionó (v2, v1 se conserva) en lugar de pisar; (2) una duda de si había un script de analítica instalado se verificó (no hay ninguno). Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 16. D18 · Conciliación del backend (27/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0. Se instalaron las dependencias fijadas de `Eclipse-be` (`npm ci`, sin tocar `package.json`) para poder probar.
- **Resultado:** `Eclipse-be` PR #11 (snapshot, estimador, OpenAPI 0.8.0, 779 pruebas) y cambios en Eclipse-Web (guard con `levels`, fixtures, catálogo v3); guard sin diferencias contra el catálogo real del backend nuevo.
- **Reintentos / correcciones propias:** (1) `git push --force-with-lease` falló porque la rama remota no existía (referencia local vieja): se empujó como rama nueva; (2) el fixture de paridad salió en una sola línea y `prettier` lo rechazó: se formateó; (3) se reescribió `tests/plan-catalog.test.ts` entero porque codificaba el catálogo viejo. Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.


## 17. Lote 1.6 · Repo y subdominio EstateOS (27/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0. Se instalaron dependencias de npm en el repo nuevo `roofy` (mismas versiones fijadas de Eclipse-Web, `npm ci`/`npm install` desde su lockfile) para poder construir y probar; no se usó ningún servicio de pago.
- **Resultado:** repo `roofy` con el esqueleto (PR #1 hacia `main`), contrato de enlace probado en los dos repos con un fixture compartido, publicación de prueba preparada y apagada; en Eclipse-Web `lib/estateos-link.ts` (inactivo), su prueba y `lote-1.6-repo-subdominio-estateos.md`.
- **Reintentos / correcciones propias:** (1) mi propio chequeo de navegador esperaba un orden de parámetros distinto del contrato (los ajenos van primero): se corrigió el chequeo, no el código; (2) el chequeo de errores de consola contaba el 404 que la prueba provoca a propósito: se excluyó solo esa ruta; (3) `npm audit` marcó `next`, `vite` y `zod` en el lockfile heredado: se aplicó `npm audit fix` (solo lockfile) en `roofy`. Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 18. Lote 3.1 · Dirección de EstateOS (27/10/2026)

- **Modelo / esfuerzo:** `claude-opus-5-5` · high (Ignacio cambió la sesión a Opus; `get_session` lo confirma). **Opus:** 1 intervención (este lote, dirección creativa). **Gasto externo:** USD 0.
- **Resultado:** `lote-3.1-direccion-estateos.md`, `estateos/biblia-estateos.v2.md` (siete piezas con guion plano a plano, continuidad, prompts y costos) y `estateos/guia-motion.v1.md` (contrato visual y render cuadro por cuadro); camino de la Fase 3 rearmado en la matriz (39 filas, 72 dependencias, 0 violaciones); decisiones D28–D31 registradas y D32 propuesta.
- **Reintentos / correcciones propias:** (1) la escalera de niveles la había escrito como fases de la luna; `PhaseGlyph` dibuja fases del eclipse (0 → totalidad): se corrigió; (2) el copy de los videos mostraba cupos («1 por mes», «300 por mes», «20 unidades», «3 sedes»), que son propuestas y no se publican: se quitaron y quedó la regla en la guía; (3) recuentos de palabras de tres locuciones y el total de costo de lista (12,75, no 12,76) corregidos; (4) el orden que le había mostrado a Ignacio ponía V1 antes de 3.5, pero el piloto necesita Lumen dentro de `roofy`: se ajustó y se informa. Regeneraciones completas: 0.
- **Uso de la sesión:** `get_session` informa el modelo y el esfuerzo; el consumo por lote no está desagregado.
- **Ajuste del mismo día (D32–D36):** Ignacio resolvió D32 (fotos con GPT animadas con Higgsfield) y sumó D33 (pantallas completas), D34 (interacción premium), D35 (pantalla completa con la vista de celular en un botón) y D36 (Higgsfield con él presente). Se actualizaron el informe, la biblia, la guía (§12) y la matriz (41 filas, 65 dependencias, 0 violaciones). La búsqueda en el directorio de conectores no encontró uno de Higgsfield.


## 19. Lote 3.5 · Base en `roofy` (27/10/2026)

- **Modelo / esfuerzo:** `claude-sonnet-5-5` · high. **Opus:** 0. **Gasto externo:** USD 0. Se agregaron `gsap`, `@gsap/react` y `lucide-react` (mismas versiones que Eclipse-Web) a `roofy`; `npm audit` 0.
- **Resultado:** `lote-3.5-base-roofy.md`; en `roofy`, escenario de pantalla completa con barra inferior, entrada, lente por plan, guía, reproductor y 58 pruebas; en Eclipse-Web, `plan` en `lib/estateos-link.ts`, fixture compartido nuevo (digest `f66d6ee1…5665`) y la prueba que fija la copia del catálogo; 467 pruebas.
- **Reintentos / correcciones propias:** (1) el lint de React rechazó un `setState` dentro de un efecto y una memoización manual: se derivó el plan de la URL y se ajustó la dependencia; (2) mi aserción de QA buscaba el progreso de la simulación solo en español: se corrigió la aserción, no la demo; (3) copié un `showcase.css` que no se usa y lo quité del repo y del manifiesto. Regeneraciones completas: 0.
- **Uso de la sesión:** no se leyó `get_session` al cierre; consumo por lote: no disponible.

## 20. Lote 3.5b · Kit de interacción premium (27/10/2026)

- **Modelo / esfuerzo:** `claude-opus-5-5` · high (Ignacio cambió la sesión a Opus al empezar el lote; `get_session` lo confirma). La sincronización con `main` y la primera lectura se hicieron todavía en Sonnet. **Opus:** 1 intervención (este lote). **Gasto externo:** USD 0. Sin dependencias nuevas.
- **Resultado:** `lote-3.5b-kit-interaccion.md`; en `roofy`, el kit (`pace.ts`, `pacer.ts`, `interaction.tsx`), su guía `docs/kit-interaccion.md`, Lumen con chats que piensan y escriben, confirmaciones con «Deshacer», destello, error simulado, esqueleto y vacío; 80 pruebas.
- **Reintentos / correcciones propias:** (1) al responder desde el chat chico se abría el grande y mostraba la respuesta al instante: el ritmo pasó a compartirse por conversación; (2) al volver a un chat después de que la historia avanzó, las respuestas se repetían pensando: lo que pasó sin nadie mirando ahora es historia; (3) agendar mostraba dos avisos (el del kit y el de la historia): quedó uno; (4) el sello tapaba la × del chat: pasó a la línea del estado; (5) `prettier` reformateó un archivo entero que el repo no formatea con él: se restauró y se reaplicó solo el cambio; (6) en el celular el aviso quedaba detrás de la capa del comprador: se muestra en la capa de arriba. Regeneraciones completas: 0.
- **Uso de la sesión:** `get_session` informa el modelo y el esfuerzo; el consumo por lote no está desagregado.

## 21. Lote 3.6 · Demo Contact (27/10/2026)

- **Modelo / esfuerzo:** `claude-opus-5-5` · high. **Opus:** 1 intervención (este lote, control de estilo de las demos). **Gasto externo:** USD 0. Sin dependencias nuevas.
- **Resultado:** `lote-3.6-demo-contact.md`; en `roofy`, chat guiado en todas las vistas, CRM completo (Contactos, Tareas, Equipo con roles), ficha web completa, área «Marca» con los entregables de la puesta en marcha, historia y guía propias de Contact, `docs/demo-contact.md`; 89 pruebas.
- **Reintentos / correcciones propias:** (1) el límite de simulaciones no llegaba a la barra porque `AppShell` no pasaba la prop: se pasó; (2) el primer paso de la guía de Contact hablaba de un seguimiento que Contact no incluye: tiene su propio texto; (3) el área táctil del casillero de tareas no tenía un ancla posicionada: se corrigió; (4) la lista de conversaciones atribuía respuestas automáticas a WhatsApp y portales: ahora solo el sitio. Regeneraciones completas: 0.
- **Uso de la sesión:** `get_session` informa el modelo y el esfuerzo; el consumo por lote no está desagregado.

## 22. Lote V1 · Video de Contact + fábrica de videos (27/10/2026)

- **Modelo / esfuerzo:** `claude-opus-5-5` · high. **Opus:** 1 intervención (este lote, control de estilo de los videos). **Gasto externo:** USD 0. Sin dependencias nuevas: Chromium + Playwright preinstalados, `ffmpeg` y `ffprobe` del contenedor.
- **Resultado:** `lote-V1-video-contact.md`; en `roofy`, la fábrica (`components/video/`, `scripts/render-video.mjs`, `docs/video-factory.md`), el video de Contact en 16:9 y 9:16 con subtítulos es/en/pt, posters y manifest, y el reproductor con el corte vertical, subtítulos y precio al lado.
- **Reintentos / correcciones propias:** (1) la cámara medía el chat antes de que se abriera y encuadraba el celular entero: la toma arranca con el chat abierto; (2) la barra superior del CRM asomaba cortada arriba de la ventana: la ventana 16:9 tomó la proporción exacta del área de trabajo; (3) en 9:16 el celular quedaba chico y después demasiado cerca: zoom fijo de 1,6 y cada plano apunta a lo que pasa; (4) la prueba de lectura detectó que el rótulo de marca (8 palabras) duraba 3,4 s y necesitaba 3,64 s: el plano pasó a 4 s; (5) la lectura del audio fallaba porque `ffmpeg` informa en stderr; (6) el servidor de desarrollo recargó la página de render a mitad de un render por un cambio en otro archivo: se volvió a correr sin tocar el repo. Renders completos descartados: 4 (pruebas de encuadre y el corte de la recarga).
- **Uso de la sesión:** `get_session` informa el modelo y el esfuerzo; el consumo por lote no está desagregado.

## 23. Lote V1, segundo corte · Tráiler de Contact al modo Kinetic Studio (27/10/2026)

- **Por qué:** Ignacio rechazó el primer corte («una presentación bastante pobre»): no reconstruía los componentes como Kinetic Studio y no explicaba todo lo que recibe quien contrata Contact. Confirmó «según Notion»: Contact = web, CRM completo, chat guiado y rebranding; el WhatsApp automático va en el video de Growth y la voz en el de Escalar.
- **Modelo / esfuerzo:** `claude-opus-5-5` · high. **Gasto externo:** USD 0. Sin dependencias nuevas: GSAP ya estaba; el motor de sonido de Kinetic se copió byte a byte (`roofy/components/video/kinetic/PROCEDENCIA.md`).
- **Acceso:** el permiso de escritura sobre `Toti-Gauna/kinetic-studio` fue denegado; todo se hizo en `roofy` con el método copiado (Kinetic no se tocó).
- **Resultado:** guía de motion §0 (las reglas nuevas, que mandan sobre el resto), biblia P1 reescrita, informe `lote-V1-video-contact.md` (segundo corte); en `roofy`, el kit de tráiler, las piezas de EstateOS reconstruidas, la película de Contact (56 s, 120 BPM) en 16:9 y 9:16 y la fábrica adaptada.
- **Correcciones propias en la revisión cuadro a cuadro (hojas de contacto, un cuadro por segundo en los dos formatos):** (1) el golpe inicial reaparecía de los 6 a los 18 s (su reinicio con `autoAlpha` pisaba la visibilidad de la escena); (2) las tarjetas lupa se encogían a su palabra más larga (contenedor de 0 × 0); (3) la interfaz se leía a ≈ 12 px en 720p: zoom ×1,3 en la ventana y ×1,2 en el celular; (4) la reserva quedaba cortada por el borde de la ventana; (5) el reset `.tr p` anulaba el relleno de las burbujas del chat; (6) ventanas vacías entre módulos del CRM; (7) el pipeline: columnas angostas y la tarjeta de Carolina mal ubicada (ahora se mide de la primera tarjeta de cada columna); (8) la agenda no llegaba a las 18:30; (9) la auditoría y la guía operativa fuera de cuadro; (10) el 9:16 cargado arriba. Renders completos: 2 (uno por formato), sin descartes.
- **Uso de la sesión:** `get_session` informa el modelo y el esfuerzo; el consumo por lote no está desagregado.

## 24. Lote V1 · Música del tráiler de Contact (27/10/2026)

- **Por qué:** Ignacio: «le falta música, no tiene alma». El audio existía, pero era percusión y campanitas (los estilos de Kinetic), sin melodía en los versos.
- **Modelo / esfuerzo:** `claude-opus-5-5` · high. **Gasto externo:** USD 0. Sin dependencias nuevas, sin pistas descargadas.
- **Resultado (en `roofy`):**
  - Orquesta propia en Web Audio (`components/video/score/orquesta.ts`) y arreglador (`arreglo.ts`).
  - Partitura de Contact reescrita.
  - Kinetic queda solo para la interfaz.
  - Prueba de «es música».
  - Re-render de los dos cortes, subtítulos y manifest.
- **Ajustes medidos:**
  - Los efectos habían quedado 26 dB por debajo de la música; quedaron en ≈ 9 dB.
  - Los graves estaban 11–12 dB por encima de los medios, lo que en un parlante de teléfono hunde la melodía. Se bajaron el bajo y la batería, se subieron piano, voz y cuerdas, y se sumó un estante de agudos (+3 dB desde 5 kHz).
