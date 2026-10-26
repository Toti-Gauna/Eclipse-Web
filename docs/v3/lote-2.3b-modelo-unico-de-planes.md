# Lote 2.3b · Modelo único de planes (la escalera de seis niveles)

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (encima del PR #24, lote 2.3, todavía abierto) · **Resultado:** código + contenido + pruebas. No se tocó el backend, no se generó ningún medio, no se cobró ni publicó nada. Gasto externo: USD 0.
**Origen (Ignacio, 26/10):** «los planes que ves en EstateOS van a ser los que realmente van a existir para los demás planes también»; la landing de Eclipse es la vidriera de los productos; las demos llevan al sitio del producto (EstateOS), donde «Ver con guía / Ver por mi cuenta» muestra los planes; la web **tiene precios**, pero lo primero que te lleva es **a ver la demo** (lo que estás comprando), con la opción de pedir el plan; los cobros serían con link de pago (tipo Tienda Nube), transferencia o efectivo a mano.

## 0. Informe en tres líneas

- **Qué cambió:** «Precios» de la landing muestra ahora **los seis niveles** (Contact 30 · Growth 75 · Escalar 100 · Hípergrowth 150 · Deluxe 200 · Partner 500 *propuesta*) como un ledger. En cada nivel el **primer botón es «Ver la demo»** y el segundo, **«Pedir este plan»** (WhatsApp con el plan en el mensaje). Los tres planes mensuales anteriores (Esencial, Conectado, Automatización e IA) **dejan de verse**: quedan solo para el builder dormido y el motor. El detalle de demos, la FAQ, «Cómo se paga» y el bloque de proyecto de las demos hablan de los seis niveles y de «desde USD 30». Hay un `content/levels.json` y una prueba que lo ata al catálogo versionado de EstateOS (mismos ids y precios).
- **Qué quedó abierto:** no hay carrito ni cobro en el sitio: **el pago se acuerda tras la propuesta** (§3); falta elegir proveedor del link de pago **y verificar que esté disponible para Argentina** antes de comprometer Stripe; el PR de conciliación del backend debe llevar **esta escalera**, no los tres planes; D19, D20, D21 y D23 siguen sin respuesta (afectan a todos los rubros; D22 diferida hasta el primer cliente); cada rubro por venir (ecommerce, restaurantes) necesita su propia ficha de contenido por nivel.
- **Qué necesita el OK de Ignacio:** el PR de este lote, la elección de las **etapas de cobro** de §3 y las decisiones D19/D20/D21/D23. Siguiente: **2.4 · Packs inmobiliarios** (Sonnet · medium).

## 1. Qué se hizo

| Área | Cambio |
|---|---|
| **Contenido** | `content/levels.json`: seis niveles con precio, estado del precio (`owner`/`proposal`), nombre, frase, para quién y qué incluye (es/en/pt). **Sin cuotas ni precio de puesta en marcha** (siguen siendo propuesta) |
| **Código** | `lib/content.ts`: `levels`, `lowestLevelUsd`; `components/pricing/Levels.tsx` + `levels.css`; `BuyTabs` (pestaña A «Planes (6)»); `PayLedger` y `ProjectBlock` usan «desde USD 30» de los niveles; `Faq` lista los seis niveles en lugar de los tres planes |
| **Copy** | `pricing.levels.*`, `pricing.ways.bundles.*`, `pricing.how.care.text` en es/en/pt; el aviso fijo dice que el ejemplo es EstateOS y que Partner, cupos y puesta en marcha son propuesta |
| **Pruebas** | `tests/levels.test.ts` (5): seis niveles y precios, igualdad con el catálogo, tres idiomas, sin cuotas ni USD en lo que incluye, «desde 30» y ningún 50; e2e actualizado (6 niveles, sin ofertas ni planes viejos, Partner «Propuesta», demo primero, WhatsApp con el plan) |
| **No tocado** | `maintenance.json`, el motor de precios y el builder (siguen para el builder dormido y sus pruebas); el backend |

## 2. Cómo queda el recorrido

```text
Landing (giro · qué es Eclipse · PyMEs · demos · Precios) ─▶ «Ver la demo» ─▶ selector ─▶ demo (hoy Lumen, dentro de la web)
                                                                  └─▶ (a futuro, lote 1.6) sitio del producto: Ver con guía / por mi cuenta ─▶ planes
Precios ─▶ «Pedir este plan» ─▶ WhatsApp con el plan elegido ─▶ propuesta ─▶ acuerdo de pago ─▶ (a futuro) portal del cliente
```

La guía animada con Higgsfield/ElevenLabs que presenta cada plan es la bienvenida **ES-INTRO** ya especificada en el lote 2.3; se produce en la Fase 3 y no hay nada producido todavía.

## 3. Cobros: etapas propuestas (nada se construye ahora)

| Etapa | Cómo se cobra | Qué hay que hacer | Estado |
|---|---|---|---|
| **P0 (hoy)** | A mano: transferencia o efectivo que recibe Ignacio; o un link de pago creado por él para cada cliente | Nada en el sitio; registrar el pago en el portal interno | **Posible ya**: el backend tiene registro **manual** de pagos (`Payment`: seña, cuotas, mantenimiento; estado; creado por el admin) y el portal interno tiene «cobros» |
| **P1** | Link de pago de un proveedor, enviado por Eclipse; el cliente paga y Eclipse **confirma la acreditación** | Elegir proveedor; el comprobante o el «pagué» **no** equivale a pago confirmado | **Sin empezar**; requiere decisión de proveedor |
| **P2** | Suscripción recurrente + aviso automático (webhook verificado) que habilita/pausa el servicio | Proveedor con suscripciones, estados de suscripción, derechos por plan y cuotas en el servidor (S1), facturación | **Sin empezar**; no existe nada de esto en el backend |

Reglas que ya están en las especificaciones y se mantienen: un link de pago **no implica suscripción automática**; un pago duplicado no duplica la mensualidad; un comprobante pendiente no confirma; la efectivo se registra con zona/agenda/costo definidos; el cliente ve su estado en «Mi Eclipse».

**Salvedad sobre el proveedor (no la verifiqué):** según mi conocimiento, Stripe **no permite abrir una cuenta de comercio en Argentina** salvo estructuras especiales (por ejemplo una entidad en otro país), y plataformas como Tienda Nube cobran en Argentina con **Mercado Pago/Nube Pago** u otras pasarelas locales. Hay que confirmar con Stripe y con tu situación fiscal antes de decidir; también la **facturación electrónica (ARCA)** y los términos de contratación. No se instaló ni contrató nada.

## 4. Qué se contradice con lo anterior (y cómo queda)

| Antes | Ahora |
|---|---|
| 2.2b: tres planes mensuales 30/75/150 con Studio y Academy por plan | **Reemplazados** por la escalera de seis niveles. «Academy inicial en el 75» pasa a ser «Academy inicial» en Growth (75) |
| D16/D18: el catálogo destino del backend = tres planes | Pasa a ser **la escalera**; el PR de conciliación espera |
| «Mismo importe, distinta oferta» (catálogo general vs sectorial) | Ya no hay dos catálogos: hay **uno** (la escalera); cada rubro define su contenido |
| Landing: «Pieza por pieza» + 3 planes | «Planes (6)» + «Pieza por pieza» (lista de precios de piezas, sin cambios) |

## 5. Evidencia

| Afirmación | Evidencia | Estado |
|---|---|---|
| Seis niveles, precios y Partner como propuesta | `tests/levels.test.ts`; e2e | **probado** |
| `content/levels.json` = catálogo EstateOS | prueba cruzada con el JSON versionado | **probado** |
| Ninguna oferta/plan viejo visible, demo primero, WhatsApp con el plan | e2e 75/75 (con el export servido en local) | **probado** (Chromium) |
| Sin desborde ni objetivos táctiles < 44 px | medido a 360, 390, 768, 1024, 1440 (es), 1440 (pt), 360 (en): 0 y 0 | **probado** |
| Rendimiento, Safari/iOS, lector de pantalla real | — | **no medido / no probado** |

Comandos: `npx tsc --noEmit` limpio · `npx eslint .` 0 errores · `npx vitest run` 33 archivos, **425 pruebas** · `npm run build` ok · `node tests/e2e/smoke.mjs` **75/75**. Capturas: `docs/v3/capturas/2.3b/`.

## 6. Decisiones para Ignacio

| # | Decisión | Recomendación |
|---|---|---|
| **Cobros** | Etapa inicial de cobro y proveedor | Empezar en **P0** (a mano) con el primer cliente; elegir proveedor cuando verifiques disponibilidad y facturación |
| D19, D20, D21, D23 | Siguen abiertas (ahora para **todos** los rubros) | Ver la explicación del lote 2.3 |
| D22 | Diferida hasta el primer cliente | — |

## 7. Rollback y handoff

Revertir el commit restaura los tres planes en «Precios». Habilita **2.4**; el PR de conciliación del backend toma la escalera como catálogo.
