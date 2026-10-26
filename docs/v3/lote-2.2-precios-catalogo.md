# Lote 2.2 · Precios y catálogo coherente

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `70c191c`, merge del PR #21) · **Resultado:** documento + **dos cambios de código acotados** (pie sin unidades, D15; prueba de conciliación contra los catálogos reales del backend). No se tocó `/content`, `lib/pricing.ts` ni el backend. No se publicó, cobró ni desplegó nada. Gasto externo: USD 0.
**Fuentes leídas:** Notion «Lote 2.2 · Precios y catálogo coherente» (prompt 01–16) y «Ofertas y precios» (tarifario, actualización del 16/10 y catálogo sectorial EstateOS del 24/10); `content/{items,plans,maintenance,addons,offers,legacy}.json`; `lib/{pricing,plan-request,content}.ts`; `tests/{pricing,plan-request}.test.ts`; `docs/v3/{lote-2.1,ledger-financiero}`; backend `Eclipse-be`: `src/plans/catalog-data.ts` en `origin/main` (`3754947`) y en el PR #10 (`feat/reto-2026-10-13-contracting`, head `864b90f`, `catalogVersion eclipse-reto-2026-10-13-v2`).
**No leído / no ejecutado:** la página «Contexto Eclipse» y la de 2.3 completas (2.3 es el siguiente consumidor); el backend **no** se ejecutó (sin Node 22 de BE, sin `test:db`, sin staging local): la conciliación se probó leyendo los dos catálogos como datos contra el guard del FE, no contra un servidor.

## 0. Informe en tres líneas

- **Qué cambió:** (1) la comparación **FE ↔ BE ↔ Notion** quedó medida, no supuesta: contra el catálogo del BE en `main` el guard del FE reporta **41 diferencias**, contra el del PR #10 **51**; ninguno de los dos conoce el modelo del 16/10 (Adaptación 500, Pack 700, mensual 30/75/150). Eso queda como **prueba permanente** (`tests/catalog-be-reconciliation.test.ts` + fixture del PR #10), de modo que el bloqueo de «Enviar solicitud» en vivo queda demostrado y no se puede quitar sin que falle una prueba. (2) **D15 aplicado:** el pie ya no muestra las unidades Eclipse Agency/Media/Market (`content/units.json` queda como historial). (3) Matriz **30/75/150/199** y **tres escenarios económicos** con costo horario faltante explícito (margen **indeterminado**, no 0), más el plan de conciliación del carril A para una ejecución futura autorizada.
- **Qué quedó abierto:** la conciliación del **backend** no se ejecutó (hace falta tu autorización, D18); retirar `asesoria-economica`/`asesorias` (D12) **no se aplicó** porque el Pack 700 las incluye y su reemplazo es decisión comercial tuya (D16); el nivel **199** no se publica ni se implementa; cupos y prestaciones nuevas de Studio/Academy son **hipótesis** hasta tu aprobación; el comparador v3 es **propuesta** (§7), sin código; el margen real depende de costos internos que no tengo.
- **Qué necesita el OK de Ignacio:** D16–D18 y §6.3 **respondidas el 26/10 (§13)**: ya no hay packs ni ofertas, el modelo es «planes mensuales + lista de piezas»; falta que apruebe la **matriz de §6** (hipótesis de Studio/Academy por plan), que define el contenido del retiro. Siguiente: **2.2b · Retiro de ofertas y comparador de planes mensuales** (§13.2), luego el PR de conciliación del backend, luego **2.3**.

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Rama y HEAD | `claude/eclipse-v3-inventory-audit-2ukttn` reiniciada sobre `main` = `70c191c` (PR #21 mergeado); `git status` limpio al empezar |
| Backend (solo lectura) | `Eclipse-be` `origin/main` = `3754947` (snapshot `COMMERCIAL_SNAPSHOT`, sin `catalogVersion`, `schemaVersion 1`); PR #10 abierto, head `864b90f` (`catalogVersion eclipse-reto-2026-10-13-v2`, `schemaVersion 2`) |
| Qué se corrió | lecturas; extracción de ambos catálogos a JSON en el scratchpad (no en el repo); el guard `catalogMismatches` aplicado a cada uno; `tsc`, `eslint` de lo tocado y `vitest` completo |
| Decisiones de entrada | D12–D15 respondidas por Ignacio (26/10, §2) |
| Gasto | USD 0; sin instalaciones; sin llamadas a servicios |

## 2. Decisiones D12–D15 aplicadas

| # | Decisión de Ignacio | Qué se hizo en 2.2 |
|---|---|---|
| **D12** | Marketing digital continuo: «no hace falta, se incluyen en los planes mensuales de pago que mencionamos». Las piezas diagnóstico/asesoría se presentan como parte de **Eclipse Studio**. **No** habrá asesoría financiera. | No se crea pieza nueva de marketing. En la matriz (§6) el marketing/crecimiento continuo figura como **prestación del plan mensual** (hipótesis hasta aprobación). La retirada de `asesoria-economica` y del combo `asesorias` queda **preparada pero no aplicada** (§5.3, D16). |
| **D13** | «Mantenemos los dos nombres con la línea puente». | Se registra para la especificación del gateway (3.x): acceso **«Branding»** + puente «Branding · parte de Eclipse Studio»; la línea comercial es Studio. Sin cambio de código en 2.2. |
| **D14** | Academy y Equipamiento «a cotizar» por ahora. | Sin cambios: ambas quedan sin precio publicado (`lines.json` modo `quote`). |
| **D15** | Retirar las unidades del pie. | **Aplicado.** `components/layout/Footer.tsx` (bloque «teaser» de unidades eliminado), claves `footer.teaser` y `footer.comingSoon` eliminadas de `messages/{es,en,pt}.json`. `content/units.json` y `lib/content.ts` quedan intactos como historial. |

## 3. Comparación FE ↔ BE ↔ Notion (paso 1 del plan)

### 3.1 Resultado medido

El guard del FE (`catalogMismatches` en `lib/plan-request.ts`) se aplicó a los **dos catálogos reales del BE**, extraídos tal cual de `catalog-data.ts`:

| Área | BE `main` (v1) | BE PR #10 (`reto-2026-10-13-v2`) |
|---|---:|---:|
| Piezas (`items`) | 23 | 29 |
| Planes/ofertas (`plans`) | 9 | 13 |
| Mantenimiento (`maintenance`) | 5 | 5 |
| Voz (`voice`) | 1 | 1 |
| Ofertas históricas (`offers`) | 3 | 3 |
| **Total** | **41** | **51** |
| de los cuales «falta en el API» | 11 | 11 |
| «falta en la web» | 12 | 22 |
| «difiere» (precio, add-on, uso) | 18 | 18 |

### 3.2 Lo que dice cada fuente

| Concepto | Web (`content/`, vigente) | BE `main` | BE PR #10 | Notion (tarifario aprobado) |
|---|---|---|---|---|
| Ofertas explícitas | `adaptacion` 500, `pack` 700 (seña 50 %) | **no existen**: 7 planes por nivel (`diagnostico`…`plataforma`) | + 4 planes sectoriales (`volta`, `velmar`, `operativo`, `ampliado`); **tampoco** `adaptacion`/`pack` | 500 / 700 (16/10) |
| Mantenimiento | Esencial 30 · Conectado 75 · IA 150 (terceros 5/15/40 dentro del precio, 2 h) | Esencial 25 · Crecimiento 79 · Escala 199 | Esencial 20 · Crecimiento 40 · Escala 100 | 30 / 75 / 150; 199 «en evaluación» |
| Pieza `landing` | 500 independiente, add-on 200 | 250 (difiere) | 500 igual; **add-on distinto** | según 16/10 |
| Piezas solo en la web | `whatsapp`, `migracion`, `catalogo`, `app-fase`, `asesoria-growth`, `asesoria-economica`, `asesorias` | — | — | vigentes |
| Piezas solo en el BE | — | `automatizacion`, `ecommerce`, `app-ondemand` | + `volta-base`, `velmar-base`, `operativo-base`, `ampliado-base`, `whatsapp-extra`, `landing-extra` | `ecommerce` se construye después de EstateOS (D7) |
| Uso de voz | **sin cargo** por voz ni por canal | `voz-uso` 49 USD/mes | `voz-uso` 49 USD/mes | sin cargo (16/10) |
| Ofertas históricas | las 4 **inactivas** (`founder`, `combo-voz`, `annual`, `referral`) | `founder`, `combo-voz`, `annual` **activas** | ídem | inactivas; fundadores descartado (D9) |
| Meses del anual | — | 10 | 10 | historial |

**Conclusión:** el bloqueo es **real y correcto**. Con cualquiera de los dos catálogos, un pedido armado con el catálogo 16/10 produciría un presupuesto distinto en el servidor (que recalcula en centavos). El FE hace lo que debe: no envía y explica.

### 3.3 Restricciones de contratos históricos (a respetar al conciliar)

1. Los catálogos viejos del BE (`v1` de `main`, `reto-2026-10-13-v2`) **no se borran ni se reescriben**: las solicitudes existentes referencian su versión. Hay que **agregar** una versión nueva, no mutar la vieja.
2. No se recalcula ningún acuerdo firmado ni se migran clientes (Notion, §05).
3. Los ids retirados siguen nombrados en `content/legacy.json` para solicitudes históricas; cualquier id que se retire (§5.3) entra ahí.
4. «Mismo importe no implica misma oferta»: los importes de EstateOS (30/75/100/150/200) **no** se trasladan a contratos generales ni al revés.

## 4. Lo que se probó (evidencia)

| Afirmación | Evidencia | Estado |
|---|---|---|
| El FE bloquea el envío live mientras el catálogo del BE difiera | `tests/plan-request.test.ts` («BLOCKER: the backend catalog v1 predates the 16/10 offer…») + `tests/catalog-be-reconciliation.test.ts` contra v1 **y** contra el snapshot real del PR #10 (fixture `tests/fixtures/backend-catalog.reto-2026-10-13-v2.json`) | **probado** (unitario) |
| Un catálogo del BE que lleve el 16/10 coincide 1:1 | `tests/plan-request.test.ts` («a backend catalog that carries the 16/10 offer matches 1:1») | **probado** con fixture sintético; contra un BE real: **no probado** |
| Adaptación 500 → seña 250 / saldo 250 | `tests/pricing.test.ts` caso 1 | **probado** |
| Pack 700 → 350/350; piezas incluidas y gamificación estándar no se cobran | casos 4, 9 | **probado** |
| Adaptación + landing add-on = 700 (350/350) **sin** crédito de pack | caso 2 | **probado** |
| Bonificación del pack 3 × 30 (meses 1–3: 0 / 45 / 120, luego 30 / 75 / 150) | caso 5 | **probado** |
| Complemento ya incluido no se duplica (landing en pack, SEO en ambas ofertas) | casos 2 (segundo), 19 | **probado** |
| IA y voz separadas, sin cargo automático por voz ni por canal | casos 15, 16, 17 | **probado** |
| Una mensualidad por pedido; cambiarla la reemplaza | caso 6 | **probado** |
| Migración fuera del total y de la seña | caso 8 | **probado** |
| Rechazo de selección antigua incompatible con explicación | `catalogMismatches` devuelve área/id/detalle por cada divergencia (pruebas de plan-request) | **probado** a nivel de guard; el mensaje en pantalla vive en `RequestAction` (probado en sus tests del builder) |
| El FE nunca envía precios | `tests/plan-request.test.ts` («maps the builder state 1:1 … no prices») | **probado** |
| Servidor recalcula en centavos | lectura de `src/plans/pricing.ts` del BE | **leído (E1)**, no ejecutado |

Comandos de este lote: `npx tsc --noEmit` → sin salida (limpio); `npx eslint components/layout/Footer.tsx tests/catalog-be-reconciliation.test.ts` → limpio; `npx vitest run` → **31 archivos, 405 pruebas pasan** (400 previas + 5 nuevas). No se ejecutaron `npm run build` ni e2e (el único cambio visible es borrar un bloque del pie; ver §9).

## 5. Carril A · Conciliación del catálogo aprobado

### 5.1 Qué se hizo ahora (frontend)
Prueba permanente de la divergencia y el pie sin unidades. El guard **no** se tocó.

### 5.2 Plan para la ejecución futura autorizada (backend; **no ejecutado**, D18)
1. Un solo cambio contractual acotado en `Eclipse-be/src/plans` **encima del mecanismo de catálogo versionado del PR #10** (si ese PR no se mergea antes, hay que decidir el orden con Ignacio): nueva `catalogVersion` (propuesta: `eclipse-2026-10-16-v3`) con `adaptacion`, `pack`, `maintenance` 30/75/150 (terceros dentro del precio), precios y add-ons de las 20 piezas, ofertas históricas inactivas, sin `voz-uso`.
2. **Conservar** las versiones anteriores para solicitudes existentes; no recalcular acuerdos firmados.
3. Fixtures de contrato **compartidos** con versión y digest (hash del JSON canónico): el FE guarda el digest esperado y la prueba cruzada verifica `catalogVersion` + digest, no solo funciones aisladas.
4. Pruebas en BE (`format:check`, lint, typecheck, build, test; `test:db` solo con fixture guardada según README); verificación FE ↔ BE en **staging local**, nunca desactivando el guard.
5. Hasta entonces «Enviar solicitud» en vivo sigue bloqueado y el pedido por WhatsApp (que no depende del BE) sigue funcionando.

### 5.3 Retirar `asesoria-economica` y `asesorias` (D12): preparado, no aplicado
Impacto medido (búsqueda en el repo): `content/plans.json` (el **Pack 700 incluye `asesorias`**), `content/items.json` (3 entradas), `lib/pricing.ts` (`ITEMS_ONE_OFF`), `lib/content.ts`, y pruebas (`pricing`, `plan-request`, `plan-message`, `builder`). Retirarlas cambia **qué recibe quien compra el Pack 700**, así que no es una limpieza técnica: es **D16**.

## 6. Matriz 30 / 75 / 150 / 199 (paso 2) — todo alcance nuevo es hipótesis

**Vigente y aprobado:** 30 / 75 / 150 USD/mes, terceros 5 / 15 / 40 **dentro** del precio, 2 h humanas en total, sin acumulación. **199:** propuesta general, **no aprobada, no publicada**. Lo marcado **(H)** es hipótesis de este documento, pendiente de tu aprobación.

| | **Esencial · 30** | **Conectado · 75** | **IA · 150** | **199 (propuesto)** |
|---|---|---|---|---|
| Para quién | web o app ya construida que necesita seguir en pie | negocio con WhatsApp / reservas / automatizaciones | negocio con chatbot o voz atendiendo clientes | operación con varios canales y mayor volumen (H) |
| Incluye (vigente) | hosting y soporte básico, correcciones | lo anterior + canal conectado | lo anterior + IA / voz | — |
| Consumo (terceros) | 5 USD dentro del precio | 15 USD | 40 USD | 60 USD (H) |
| Soporte humano | 2 h/mes en total | 2 h/mes en total | 2 h/mes en total | 2 h/mes (H); más horas = otro precio |
| Studio | — | informe mensual de lectura (H) | informe mensual + una iniciativa de crecimiento al trimestre (H) | iniciativa mensual (H) |
| Academy | — | — | una sesión de capacitación al trimestre (H) | una sesión al mes (H) |
| Marketing / crecimiento (D12) | — | prestación **incluida en el plan**, no pieza aparte (H) | ídem (H) | ídem (H) |
| Extras | piezas con su precio add-on | ídem | ídem | ídem |
| Estado | **aprobado** | **aprobado** | **aprobado** | **propuesto, sin publicar** |

Reglas que valen para todos: nada «ilimitado»; el cupo y las horas se ven **antes** del CTA; la voz no tiene cargo por minuto ni por canal; si el consumo de terceros excede lo incluido se informa y se acuerda antes, nunca se cobra por sorpresa.

### 6.1 Tres escenarios por plan (paso 3)

Fórmula: costo de terceros `T` (dentro del precio), horas humanas `H`, costo horario interno `c` **desconocido**. Con precio `P`: margen = `P − T×k − H×c`. Como `c` no está medido, se calcula el **costo horario de equilibrio** (el `c` al que el margen es 0), no un margen.

| Escenario | Supuesto | Fórmula | 30 | 75 | 150 | 199 (H) |
|---|---|---|---:|---:|---:|---:|
| **Base** | terceros = lo incluido, 2 h | `(P − T) / 2` | 12,5 | 30 | 55 | 69,5 |
| **Doble consumo** | terceros ×2, 2 h | `(P − 2T) / 2` | 10 | 22,5 | 35 | 39,5 |
| **Máximo soporte** | terceros = lo incluido, 4 h | `(P − T) / 4` | 6,25 | 15 | 27,5 | 34,75 |

(USD por hora.) Lectura: si el costo horario real supera la cifra, ese escenario deja de cubrir el plan. El plan de **30** es el más frágil (en soporte máximo cubre solo hasta ≈ 6 USD/h); el de **75** aguanta el escenario base si la hora cuesta menos de 30.

**Margen: indeterminado.** Faltan, y no se reemplazan por 0: costo horario interno, comisiones de cobro, impuestos, costo real de terceros por canal y costos fijos asignados (el ledger fija USD 281/mes de fijos en total, `docs/v3/ledger-financiero.md`). Con el costo horario hipotético del ledger (10 / 20 / 30 USD/h) no se calcula margen en este documento a propósito: sería inventar.

### 6.2 Por qué el 199 no se publica
No hay inclusión nueva aprobada que lo justifique, y la matriz muestra que el 150 ya cubre IA/voz con 40 USD de terceros. Se recomienda **posponerlo hasta que existan datos reales de consumo** de al menos dos clientes (D17).

### 6.3 Criterio de lectura de D12 (a confirmar)
Entendí que el marketing/crecimiento continuo **no** es una pieza ni una línea nueva sino prestaciones de Studio/Academy dentro de los planes mensuales de pago, y que `asesoria-growth` queda como diagnóstico dentro de Studio. Si querés otra lectura (por ejemplo, que Studio venda ese servicio como mensualidad aparte), cambia la matriz, no el código.

## 7. Carril B · Comparador v3 (propuesta; solo borrador/preview)

No se construyó UI: el público **sigue mostrando lo aprobado** hasta el gate comercial (Notion 6/7.6). Propuesta para revisión:

- **Forma:** ledger. Cuatro columnas (Esencial · Conectado · IA · [199 oculto en preview]) con filas fijas: *para quién · setup · mensualidad · terceros incluidos · horas humanas · Studio · Academy · extras*. Mensualidad y setup en **bloques separados**; el cupo de horas y terceros se lee **antes** del CTA, en la misma pantalla, nunca en un tooltip.
- **Mobile:** una columna por plan en pestañas de 44 px, misma jerarquía; sin scroll horizontal a 360 px.
- **Marca:** tokens semánticos existentes, Geist Mono para precios, una sola acción ámbar por viewport (`data-page-cta`).
- **Honestidad:** sin «ilimitado», sin descuento tachado, sin «antes $X», filas H marcadas como «en evaluación» solo en preview interno.
- **Dónde:** en los componentes de precio existentes (`components/pricing/`), detrás de un parámetro de preview no enlazado; no se agrega ruta ni dependencia.
- **Costo de hacerlo:** 1 lote Sonnet · high, después de que apruebes la matriz (§6) y D17.

## 8. Lista de aceptación (Notion §12)

- [x] FE/BE conciliados con tarifa aprobada **o bloqueo explícito conservado** → bloqueo conservado y demostrado (§3, §4); la conciliación del BE es carril A futuro.
- [x] Ningún 199 ni inclusión nueva publicados → nada publicado; todo en §6 está marcado (H).
- [x] No doble cargo de extras ni precio del FE como autoridad → casos 2, 14–19 y «no prices».
- [x] Bonificación y 50/50 probados → casos 1, 4, 5 y `splitPayment`.
- [x] Escenarios económicos con datos faltantes explícitos → §6.1.
- [x] Cada afirmación de funcionamiento con evidencia o rotulada → §4 (probado / leído / no probado).
- [x] Sin gastos, publicaciones ni cambios de alcance implícitos → ninguno; los dos cambios de código son D15 y una prueba.
- [x] Contenido previo vigente preservado; decisión que lo sustituye documentada → D15 (pie) en §2; `units.json` conservado.

## 9. No ejecutado y límites

- `npm run build`, e2e y capturas del pie (cambio de un bloque borrado; el riesgo es una prueba e2e que busque «Eclipse Agency/Media/Market» en el pie): lo revisa el CI del PR. Si falla, se corrige en el mismo PR.
- BE: `format:check`, lint, typecheck, build, tests, `test:db`: no ejecutados (carril A futuro).
- Safari iOS/iPad: no aplicable a este lote.

## 10. Decisiones para Ignacio

| # | Decisión | Recomendación |
|---|---|---|
| **D16** | Con `asesorias` retirado, ¿qué lleva el **Pack lanzamiento 700**? (a) una sesión de diagnóstico Studio (`asesoria-growth`) y precio 700 sin cambio; (b) las dos sesiones reemplazadas por otra inclusión tuya; (c) reajustar el precio. | **(a)**, para no cambiar el precio publicado; implica 1 sesión menos en el pack. |
| **D17** | Nivel **199**: descartar o posponer. | **Posponer** hasta tener datos de consumo reales (§6.2). |
| **D18** | ¿Autorizás un PR de conciliación en `Eclipse-be` (§5.2)? ¿Va antes o después del PR #10? | **Después de decidir el #10**, para apoyarse en su catálogo versionado. |
| §6.3 | Confirmar que marketing/crecimiento continuo = prestaciones de Studio/Academy dentro del plan. | Confirmar. |

## 11. Rollback

Cambios del lote: `components/layout/Footer.tsx`, `messages/{es,en,pt}.json` (dos claves), `tests/catalog-be-reconciliation.test.ts`, `tests/fixtures/backend-catalog.reto-2026-10-13-v2.json`, este documento, `docs/v3/lote-0.4-sdd-control-financiero.md` y `registro-consumo.md`. Revertir el commit del lote los devuelve; no hay migraciones ni datos. Para volver solo el pie: restaurar el bloque `LandingOnly` y las dos claves desde `main`.

## 12. Handoff

Habilita **2.3** (EstateOS · planes y bienvenida; recordá que EstateOS vive en su propio repo `roofy`, que creás vos al llegar a la Fase 3/lote 1.6), **2.4** y el **gate comercial antes de 3.9**. 2.3 debe tomar de aquí la regla «mismo importe no implica misma oferta» y no mezclar el catálogo sectorial (30/75/100/150/200) con el general (30/75/150).

## 13. Decisiones resueltas (26/10/2026, segunda ronda)

### 13.1 Respuestas de Ignacio

| # | Respuesta | Efecto |
|---|---|---|
| **D16** | «No existen esos packs, ahora es todo planes mensuales.» Confirmado: se **retiran Adaptación 500 y Pack lanzamiento 700** (y la bonificación 3 × 30); se quedan el plan mensual 30/75/150 y las **piezas con su precio de implementación 50/50** como lista de precios. | `asesoria-economica` y el combo `asesorias` se retiran con ellas (D12: sin asesoría financiera). `asesoria-growth` queda como diagnóstico dentro de Studio. Los ids retirados pasan a `content/legacy.json`. **Aún no aplicado** (§13.2). |
| **D17** | Preguntó qué es el 199: es el cuarto nivel mensual general propuesto sobre el de 150 (viene del «Escala 199» del backend antiguo); nunca se aprobó. | Sigue **sin publicarse**; recomendación de posponer, a la espera de su decisión explícita. |
| **D18** | De acuerdo con un PR de conciliación en `Eclipse-be`; pide aviso cuando esté para aprobarlo. | Se hace **después** de 2.2b: el catálogo destino del backend ya no es el del 16/10 (con ofertas) sino el nuevo sin ofertas. |
| **§6.3 / D12** | Lectura confirmada: marketing/crecimiento continuo = prestaciones de Studio/Academy dentro de los planes mensuales. | Sin pieza ni línea nueva. |

Consecuencia sobre lo ya escrito: en §3–§5 las ofertas `adaptacion`/`pack` aparecen como «el modelo del 16/10» contra el que se midió el backend. Esa medición sigue siendo válida (el backend tampoco conoce el modelo nuevo), pero el **destino** de la conciliación cambia: el catálogo a llevar al backend es el de 2.2b.

### 13.2 Alcance medido de 2.2b (no ejecutado)

Retirar las ofertas toca (búsqueda en el repo del 26/10):
- **Contenido:** `content/plans.json` (las dos ofertas, `featured`, `careCredit`), `content/items.json` (`asesoria-economica`, `asesorias`; los precios `addonUsd` pierden sentido sin ofertas), `content/verticals.json` (referencias a `adaptacion` en los proyectos de las demos), `content/legacy.json` (ids retirados).
- **Motor:** `lib/pricing.ts` (`careCredit`, `ITEMS_ONE_OFF`, add-ons por oferta, `maintenanceSuggestion`), `lib/content.ts`, `lib/plan-request.ts` (el guard y el contrato de solicitud).
- **Interfaz:** sección Precios (`Packages`, `BuyTabs`, `PlanRow`, `CarePanel`, `PiecesPanel`, `PricingSection`, `OffersLedger`), calculadora (`LossCalculator`), builder dormido (`rules.ts`, `StepPieces`), bloque de proyecto de las demos (`ProjectBlock`), textos `es/en/pt`.
- **Pruebas:** `pricing`, `plan-request`, `plan-message`, `plan-url`, `builder`, `content`, `demo-experience`, `catalog-be-reconciliation`.

La vista principal de Precios pasa de «dos ofertas» a **los tres planes mensuales en un ledger** (= el comparador v3 de §7), con la lista de piezas debajo. Por eso 2.2b necesita antes tu aprobación de la matriz de §6 (qué lleva cada plan en Studio/Academy). Se hace en un lote propio, con un diff revisable, y no se mezcla con este PR.
