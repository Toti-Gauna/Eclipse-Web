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
| 0.4 SDD y control financiero | `claude-sonnet-5-5` · high | verificado local; pendiente de aceptación | 0 | USD 0 | `lote-0.4-sdd-control-financiero.md` |

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

## 5. Intervenciones Opus

Ninguna hasta el 26/10/2026. Cada una se registra aquí con la ficha de seis campos (lote · problema · evidencia de entrada · beneficio · entrega · criterio de salida) y modelo efectivo, esfuerzo, hora, uso antes/después y aceptación.
