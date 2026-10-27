# Conciliación del backend (D18) · catálogo, estimador y guard

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5` · **Repos:** `Eclipse-be` (PR #11, rama `claude/eclipse-v3-inventory-audit-2ukttn`) y `Eclipse-Web` (esta rama) · **Resultado:** código + pruebas en los dos repos. Sin migraciones, sin deploy, sin envío de nada. Gasto externo: USD 0.
**Origen:** D18 (Ignacio, 26 y 27/10): autorizó el PR de conciliación en `Eclipse-be`; el catálogo destino es el modelo actual (sin packs ni ofertas, escalera de seis niveles).

## 0. Informe en tres líneas

- **Qué cambió:** el backend ahora publica y calcula **lo mismo que vende la web**: 18 piezas con precio independiente y de complemento, `plans` vacío, mantenimiento `esencial/conectado/ia`, la escalera de seis niveles (solo lectura), ofertas históricas inactivas y voz sin cargo; su estimador usa las reglas del 16/10 (la pieza más ancha es el proyecto, las otras a precio de complemento). **El guard de la web contra el catálogo real del backend da 0 diferencias** (antes 41 contra `main` y 51 contra #10).
- **Qué quedó abierto:** el PR del backend (**Eclipse-be #11**) **no está desplegado**; las pruebas con PostgreSQL pasaron (200/200, 27/10) pero no hay despliegue ni migración; **choca con #10** (mismos archivos del catálogo): se tomó del #10 lo reutilizable (parches de dependencias y CI con rol limitado) y el resto queda para rebasar sobre este PR (`docs/integracion-pr10-pr11.md` en Eclipse-be); los niveles se publican pero **no se pueden pedir** (no hay suscripciones, derechos ni cuotas en el backend).
- **Qué necesita el OK de Ignacio:** aprobar **Eclipse-be #11** y este PR de la web, y decidir el orden respecto de **#10**. Recién con el backend desplegado el guard deja de bloquear «Enviar solicitud» en vivo (que además solo es alcanzable desde `/plan/`, porque el builder está dormido).

## 1. Qué se hizo

| Repo | Cambio |
|---|---|
| **Eclipse-be** | `src/plans/catalog-data.ts` (generado desde `content/*.json` de la web), `catalog.ts` (`addonCents`, `reviewRangeCents`, `levels`), `pricing.ts` (estimador), `types/plan-request.ts` y `services/plan-request.service.ts` (`addon`, `pending`), `src/docs/openapi.json` **0.8.0**, `docs/plan-requests.md`, pruebas (779) y el fixture `web-quote-cases.json` |
| **Eclipse-Web** | `lib/plan-request.ts` (el guard compara también `levels`), `lib/api/types.ts`, `tests/export-quote-cases.test.ts` (exporta lo que dice `quote()` para el backend), `tests/fixtures/backend-catalog.2026-10-27.json` (el `GET /catalog/plans` real del backend nuevo) y pruebas |
| **Catálogo EstateOS v3** | decisiones D20 (chat guiado en Contact, configurado una vez y usado por un año) y D27 (sin seña en los planes mensuales: se paga el primer mes y se hace todo una vez) |

## 2. Evidencia

| Afirmación | Evidencia | Estado |
|---|---|---|
| El estimador del backend = `quote()` de la web | 183 selecciones (todas las piezas, todos los pares, 12 mayores) coinciden **al centavo** (líneas, add-on, pendientes, mantenimiento sugerido) | **probado** (unitario, en el backend) |
| El guard de la web no encuentra diferencias | `tests/catalog-be-reconciliation.test.ts` contra el catálogo real del backend nuevo → `[]`; y bloquea de nuevo si cambia un precio, un complemento, un nivel o una oferta | **probado** |
| El backend sigue sano | `format:check`, `lint`, `typecheck`, `build` y 779 pruebas unitarias | **probado** |
| Las pruebas con base de datos | — | **200/200** con PostgreSQL 16 local y rol limitado (27/10); el cambio no toca la base ni migraciones |
| El deploy y el flujo vivo de punta a punta | — | **no probado** |

## 3. Qué se encontró al portar

- El estimador viejo del backend aplicaba las reglas anteriores al 16/10 (rangos de paquete, combo de voz, fundador −20 %, anual a diez meses, voz con cargo fijo): se reemplazó, conservando el código de ofertas por si se reactivan (hoy inactivas).
- Los 7 paquetes del backend ya no existen: `plans` queda **vacío** y una selección con `planId` no nulo se rechaza (400). Las solicitudes ya guardadas conservan su selección y estimación.
- El backend traía piezas que la web no vende (`automatizacion`, `ecommerce`, `app-ondemand`) y le faltaban otras (`whatsapp`, `migracion`, `catalogo`, `app-fase`, `asesoria-growth`): quedó con las 18 vendibles.
- Las piezas ocultas (`asesoria-economica`, `asesorias`) **no** están en el backend.

## 4. Relación con #10 y orden de entrega

`Eclipse-be` #10 (contratación y catálogo del reto 13/10) y #11 tocan los mismos archivos (`catalog-data.ts`, `pricing.ts`, `tests/plan-catalog.test.ts`) y ambos suben OpenAPI a 0.8.0. **Recomiendo decidir #10 antes**: si #10 se mergea primero, #11 se rebasa sobre su mecanismo de versión (`eclipse-reto-…`) y su catálogo del reto (que ya no corresponde al modelo vigente); si #11 va primero, #10 debería reconciliarse con este catálogo. Orden de despliegue cuando haya OK: backup de staging → backend → web (el catálogo es código: no hay migración).

## 5. Rollback

Revertir el commit en cada repo. Sin migraciones ni datos externos; los pedidos guardados no cambian.
