# Lote 2.2b · Retiro de ofertas y comparador de planes mensuales

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `82dea50`, merge del PR #22) · **Resultado:** código + contenido + pruebas. No se tocó el backend. No se publicó, cobró ni desplegó nada. Gasto externo: USD 0.
**Origen:** decisiones de Ignacio del 26/10 sobre el lote 2.2: *«no existen esos packs, ahora es todo planes mensuales»* (D16), *«75 da Academy inicial»*, *«los ocultás, que en algún momento nos pueden servir»*, D12 (sin asesoría financiera; marketing/crecimiento = prestaciones de Studio/Academy dentro de los planes) y D17 (199 sin publicar).
**Cómo leí «ocultalos»:** los montos/ofertas que se retiran **no se borran**: quedan en `content/` con `hidden: true`, invisibles y no vendibles, por si vuelven. Si querías borrarlos de verdad, es un cambio de una línea por id.

## 0. Informe en tres líneas

- **Qué cambió:** ya no hay packs ni ofertas a la venta. **Adaptación 500**, **Pack lanzamiento 700** (con su bonificación 3 × 30) y las asesorías económica y combo quedaron **ocultas** (`hidden`, conservadas); lo que se vende es **un plan mensual por proyecto (30 / 75 / 150)** y las **18 piezas vigentes** como lista de precios. La pestaña principal de «Precios» es ahora un **comparador de planes mensuales** (mismos campos en el mismo lugar: precio, para quién, terceros, horas, Studio, Academy, qué incluye; las horas y el cupo se leen **antes** del botón), y las demos muestran sus canales simulados **a su precio de pieza**. 410 pruebas unitarias y 75/75 e2e pasan.
- **Qué quedó abierto:** (1) confirmar si las sesiones de Studio/Academy cuentan **dentro de las 2 h** mensuales (lo dejé como pendiente, no como promesa); (2) redacción final de las prestaciones por plan (es/en/pt) para tu revisión; (3) el backend sigue sin conocer el modelo: **el PR de conciliación en `Eclipse-be` es lo que sigue** y no se ejecutó; (4) `CarePanel`, `Packages` y `PlanRow` quedaron sin uso (dormidos, no borrados); (5) las claves de copy del builder y de las ofertas (`pricing.groups`, `plan.*`) siguen en `messages` aunque ya no se rendericen; (6) falta la prueba de usabilidad con 5 personas.
- **Qué necesita el OK de Ignacio:** el texto de las prestaciones de §3 y la respuesta a (1). Con eso, sigue el **PR de conciliación del backend** (D18, te aviso cuando esté) y después **2.3 · EstateOS · planes y bienvenida**.

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Rama y HEAD | `claude/eclipse-v3-inventory-audit-2ukttn` reiniciada sobre `main` = `82dea50`; `git status` limpio |
| Línea base | 405 pruebas unitarias; e2e 72/72 (previo a 2.2) |
| Qué se corrió | `tsc --noEmit`, `eslint`, `vitest run`, `npm run build` (export con `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web`), `tests/e2e/smoke.mjs` contra el export servido en local, capturas de «Precios» a 360/390/768/1024/1440 (es), 1440 (pt) y 360 (en) |
| Alcance medido de antemano | `content/{plans,items,maintenance}.json`, `lib/{content,pricing,plan-request,plan-url}.ts`, `components/pricing/*`, `components/sections/{services,faq}`, `components/plan-builder/*`, `components/demo-experience/{project,ProjectBlock}`, `messages/*`, 8 archivos de pruebas |

## 2. Qué se hizo

| Área | Cambio |
|---|---|
| **Datos** | `plans.json`: `adaptacion` y `pack` con `hidden: true` (y nota en `$comment`); `items.json`: `asesoria-economica` y `asesorias` ocultas (`asesoria-growth` sigue, dentro de Studio); `maintenance.json`: cada plan suma `audience`, `studio`, `academy` (es/en/pt; `null` = no incluye) |
| **Contenido** | `lib/content.ts`: `hidden` en `Item` y `Plan`; `sellableItems` y `sellablePlans`. Las listas completas siguen resolviendo ids históricos |
| **Precios** | pestaña A «Planes mensuales» (`MonthlyPlans` + `monthly.css`, filas alineadas con subgrid desde 900 px, apiladas en celular); pestaña B «Pieza por pieza» solo lista vendible; `CarePanel` sale de la sección (lo reemplaza el comparador); «Cómo se paga → Implementación» lleva a las piezas |
| **Demos** | `projectSummary`: una oferta oculta es «sin oferta»; `ProjectBlock` muestra cada canal al precio de la pieza (no al de complemento) y el texto lo aclara |
| **Qué ofrecemos / FAQ** | la leyenda «Incluida en… Ver ofertas» solo aparece si hay ofertas a la venta; la FAQ de piezas deja de hablar de ofertas |
| **Builder (dormido)** | no lista paquetes ni piezas retiradas; el módulo de objetivos oculta la sección de paquetes si no hay ninguno |
| **Enlaces `/plan` viejos** | un enlace hecho con `plan=pack` o con una asesoría retirada pierde ese plan/pieza y conserva el resto (probado) |
| **Guard FE/BE** | `catalogMismatches` compara **solo lo vendible**: el backend no tiene que conocer lo oculto. Sigue bloqueando el envío en vivo (no se tocó la lógica de bloqueo) |
| **Pruebas** | actualizadas 8 (builder, plan-url, pricing, demo-experience, plan-request, reconciliación, e2e ×3); nuevas: ocultas ≠ borradas, prestaciones por plan, enlace viejo, demos sin oferta |

## 3. Prestaciones por plan (texto para revisión de Ignacio)

| Plan | Studio | Academy |
|---|---|---|
| **Esencial · 30** | No incluye | No incluye |
| **Conectado · 75** | Informe mensual de lectura: qué se usó y qué conviene mejorar. | **Academy inicial**: una sesión para que tu equipo aprenda a usar lo que contrataste. |
| **Automatización e IA · 150** | Informe mensual de lectura y una iniciativa de crecimiento por trimestre. | Academy: una sesión de capacitación por trimestre. |

Son los textos que hoy muestra el sitio (es/en/pt en `maintenance.json`). El nivel **199** no está en el sitio. «Marketing / crecimiento continuo» no es una pieza: vive en estas prestaciones (D12).

**Pendiente de confirmar:** el copy de «hasta 2 h humanas por mes, en total» ya existía y dice *en total*. Si las sesiones de Studio y Academy deben contarse **dentro** de esas 2 h, el plan de 75 queda ajustado (informe + sesión inicial en 2 h) y conviene decirlo en el texto; si van **aparte**, cambia la economía de §6.1 del lote 2.2 (más horas por plan) y el costo de equilibrio por hora baja. No lo afirmé en el sitio.

## 4. Evidencia

| Afirmación | Evidencia | Estado |
|---|---|---|
| Ninguna oferta ni asesoría financiera visible | e2e «no retired offer on the page»; prueba de contenido; inspección del DOM de la pestaña B (18 piezas, sin «gestión económica») | **probado** |
| Tres planes con horas visibles y Studio/Academy según plan | e2e (3 planes, 2 h en los 3, Esencial con 2 filas vacías, Conectado con «Academy inicial»); capturas | **probado** |
| Filas alineadas entre planes | medido con `getBoundingClientRect`: posiciones idénticas por plan a 1024, 1440 (es, pt) | **probado** |
| Sin scroll horizontal ni objetivos < 44 px en la sección | 0 px de desborde y 0 objetivos < 44 px a 360, 390, 768, 1024, 1440 (es), 1440 (pt), 360 (en) | **probado** (Chromium) |
| Las reglas de cobro siguen intactas (500/250, 700/350, bonificación 3 × 30, no duplicar, IA/voz) | `tests/pricing.test.ts` casos 1–19: **pasan sin cambios** (el motor sigue resolviendo las ofertas ocultas por id) | **probado** |
| Enlaces viejos con packs | `tests/plan-url.test.ts` y e2e `/plan` | **probado** |
| El backend sigue bloqueado | `tests/catalog-be-reconciliation.test.ts` (ahora sin esperar lo oculto) | **probado** |
| Safari/iOS real, lectores de pantalla reales | no ejecutado | **no probado** |
| Rendimiento (la pestaña A no pesa más que la anterior) | no medido; el componente es estático (sin librerías nuevas ni animación nueva más allá de la regla que dibuja) | **no medido** |

Comandos: `npx tsc --noEmit` limpio · `npx eslint .` 0 errores (5 avisos previos en scripts de QA) · `npx vitest run` 31 archivos, **410 pruebas** · `npm run build` ok · `node tests/e2e/smoke.mjs` **75/75**.

## 5. Lo que NO se hizo (y por qué)

- **Backend:** no se tocó `Eclipse-be`. Es el siguiente paso (D18): llevar el catálogo actual (3 planes mensuales sin ofertas, 18 piezas) como catálogo versionado nuevo, con digest, conservando los viejos. Te aviso cuando esté el PR.
- **Borrar** las ofertas y asesorías: quedan ocultas por tu indicación.
- **Limpieza de copy muerto** (`pricing.groups`, `plan.*`, builder): se conserva mientras el builder siga latente.
- **Nivel 199:** sin publicar.
- **Capturas antes/después con diferencia de píxeles:** hay capturas del después (`docs/v3/capturas/2.2b/`); el «antes» del lote 1.5 mostraba otra composición (ofertas), no comparable punto a punto.

## 6. Rollback

Volver el commit del lote restaura las ofertas a la venta (los datos nunca se borraron: basta quitar `hidden` de `plans.json` y de las dos piezas, y restaurar `Packages` en `BuyTabs`). No hay migraciones ni datos externos.

## 7. Handoff

Habilita el **PR de conciliación del backend** (D18) y, después, **2.3**. Una vez conciliado el backend, el guard debe devolver `[]` y «Enviar solicitud» en vivo puede reabrirse con su propia prueba de aceptación.
