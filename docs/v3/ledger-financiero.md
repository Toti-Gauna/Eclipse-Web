# Ledger financiero de Eclipse v3

**Creado en el lote 0.4 · 26/10/2026.** Es **documental**: no hay datos reales de ingresos, costos internos, comisiones ni impuestos en las fuentes leídas, y no se inventan. Todo lo que falta dice **«no disponible»**. Gasto externo ejecutado en este lote: **USD 0**. Los topes declarados por Ignacio (ElevenLabs USD 11/mes, Higgsfield USD 100/mes, Suno sin tope) son **registro de tope, no autorización de compra**.

## 1. Reglas del ledger

1. **Tres cuentas separadas, nunca sumadas:** **cobrado** (caja que entró), **facturado** (emitido, pendiente) y **prometido** (propuesta o acuerdo sin cobrar). Una vista, un formulario o una propuesta **no son cobros**.
2. **Costo directo de proveedor**, **costo fijo incremental asignado** (suscripción mínima, infraestructura atribuible), **horas humanas × costo horario interno** y **precio recibido neto de impuestos y comisiones**. Horas de agente y horas humanas **no se suman como si fueran lo mismo**.
3. **Margen** = ingreso sin impuestos indirectos − pasarela/comisiones − infraestructura incremental − consumo externo − horas humanas × costo interno. Tres escenarios: **base · doble consumo · máximo soporte**. Mientras falten costo interno o uso real, la rentabilidad es **«no verificada»**.
4. **No se reduce un alcance ya aprobado** (horas, cupos) para ocultar un problema de margen; se documenta y se decide.
5. **Sin sobrecargos automáticos.** Aviso al 80 %, pausa del consumible al 100 %; datos e historial nunca se bloquean por agotar multimedia o voz.
6. **Una suscripción mínima que supera el costo por clip se muestra junto al costo por clip** (costo marginal ≠ compromiso mensual).

## 2. Libro (estado al 26/10/2026)

| Cuenta | Importe | Fuente | Estado |
|---|---|---|---|
| Cobrado | no disponible | no hay registro de cobros en los repositorios ni en Notion leídos | pendiente de Ignacio |
| Facturado | no disponible | idem | pendiente de Ignacio |
| Prometido | no disponible | idem (las propuestas no son cobros) | — |
| Gasto externo ejecutado en el programa v3 | **USD 0** | ninguna compra, render, instalación ni suscripción hecha por el ejecutor | verificado (E0) |
| Costos fijos mensuales declarados (Ignacio, 26/10/2026) | **USD 281/mes**: infraestructura 100 · Claude 100 · Higgsfield 50 · GPT 20 · ElevenLabs 11 | mensaje de Ignacio | declarado, no verificado contra facturas (E0) |
| Topes declarados | ElevenLabs 11/mes · Higgsfield 100/mes · Suno sin tope | mensajes de Ignacio, 24 y 26/10/2026 | **no son autorización** |

## 2.b Base fija mensual y clientes para cubrirla (aritmética)

Con los costos fijos declarados (**USD 281/mes**) y **sin** descontar horas humanas, comisiones, impuestos ni consumos variables, la cantidad de clientes de un mismo plan que cubriría esa base sale de `281 ÷ ingreso neto del plan` (redondeado hacia arriba):

| Plan | Ingreso neto/mes | Clientes para cubrir USD 281 |
|---|---|---|
| EstateOS Contact | 30 | 10 |
| EstateOS Growth | 75 | 4 |
| EstateOS Escalar | 100 | 3 |
| EstateOS Hípergrowth | 150 | 2 |
| EstateOS Deluxe | 200 | 2 |
| EstateOS Partner (propuesta) | 500 | 1 |
| General Esencial (queda 25 tras terceros) | 25 | 12 |
| General Conectado (queda 60) | 60 | 5 |
| General Automatización e IA (queda 110) | 110 | 3 |

Cautelas: es el punto donde el ingreso cubre la base fija, **no** un margen; los costos fijos son de toda Eclipse (no de un solo producto); el presupuesto de terceros del plan general ya paga parte de la infraestructura, así que **sumarlo a los USD 100 de infraestructura puede contar dos veces**; Higgsfield figura en USD 50 de costo actual mientras el tope declarado sigue en USD 100 (no se resuelve cuál manda hasta que Ignacio lo aclare; el techo por lote de §5 se mantiene en USD 50).

## 3. Escenario de soporte, tarifario general (aritmética, no margen)

Datos de `content/maintenance.json` (16/10/2026): un plan mensual, hasta **2 h humanas en total por mes (no acumulables)**, y un presupuesto de terceros **dentro** de la mensualidad.

| Plan | Precio USD/mes | Terceros USD | Queda antes de trabajo | Equivale por hora si se consumen 2 h |
|---|---|---|---|---|
| Esencial | 30 | 5 | **25** | **12,50** |
| Conectado | 75 | 15 | **60** | **30,00** |
| Automatización e IA | 150 | 40 | **110** | **55,00** |

**Lectura:** si Eclipse valora su hora humana por encima de **12,50 / 30 / 55 USD**, un cliente que consume las 2 h **no deja contribución** (antes de estructura, comisiones e impuestos). Es **sensibilidad aritmética**, no tarifa de mercado ni margen neto. Con el costo horario interno aún sin definir, **no se concluye rentabilidad**, y **no se reducen horas ya aprobadas**.

Horas que alcanza a pagar cada plan antes de contribución cero, **con costos horarios hipotéticos a modo de lectura de la tabla** (no son el costo de Eclipse): `horas = restante ÷ costo hora`.

| Costo hora hipotético | Esencial | Conectado | Automatización e IA |
|---|---|---|---|
| 10 USD | 2,5 h | 6,0 h | 11,0 h |
| 20 USD | 1,25 h | 3,0 h | 5,5 h |
| 30 USD | 0,83 h | 2,0 h | 3,67 h |

## 4. Hojas económicas EstateOS (seis, separadas)

**Alcance:** catálogo sectorial EstateOS del propietario (24/10/2026): **Contact 30 · Growth 75 · Escalar 100 · Hípergrowth 150 · Deluxe 200 USD/mes**; **Partner 500 y todos los cupos son propuesta**. No se traslada el 5/15/40 del catálogo general como validación de EstateOS. Los cupos del anexo A son «borrador de capacidad a costear», **totales por plan, no acumulativos**.

**Umbral propuesto (a validar por Ignacio, no regla aprobada):** contribución ≥ 50 % del ingreso neto antes de gastos fijos. Con ese umbral, el **techo de costo total mensual** (proveedores + horas + infraestructura atribuible) por cliente es la mitad del ingreso neto. Como no se descontaron comisiones ni impuestos (no disponibles), **estos techos son cotas superiores**; el real será menor.

| Plan | Ingreso mensual | Techo de costo al 50 % (cota superior) |
|---|---|---|
| Contact | 30 | 15,00 |
| Growth | 75 | 37,50 |
| Escalar | 100 | 50,00 |
| Hípergrowth | 150 | 75,00 |
| Deluxe | 200 | 100,00 |
| Partner (propuesta) | 500 | 250,00 |

**Qué entra en cada hoja (inductores de costo; todos «por cotizar»):**

| Plan | Cupo mensual propuesto (anexo A) | Inductores de costo a medir |
|---|---|---|
| Contact | web de propiedades, 0 producción | infraestructura atribuible, mantenimiento (horas), soporte |
| Growth | 1 tour 15 s · 1 pieza motion · 4 imágenes · 300 mensajes salientes · 0 min de voz | clip(s) Higgsfield y reintentos, imágenes, horas de producción y revisión, mensajes (Meta: por mensaje entregado, mercado y categoría), soporte, infraestructura |
| Escalar | 2 tours · 1 campaña 15 s × 2 formatos · 8 imágenes · 600 mensajes · 15 min de voz | lo anterior + minutos de voz (ElevenAgents: minutos; LLM y telefonía aparte) |
| Hípergrowth | 3 tours · 2 campañas · 12 imágenes · 1.000 mensajes · 30 min | lo anterior + Intelligence (cómputo de análisis) |
| Deluxe | 4 tours · 3 campañas · 16 imágenes · 2.000 mensajes · 60 min · 1 consorcio / 20 unidades | lo anterior + chatbot interno (runtime LLM, contexto, tokens), correo, administración |
| Partner | 8 tours · 5 campañas · 24 imágenes · 5.000 mensajes · 150 min · 3 consorcios / 60 unidades · hasta 3 sedes | lo anterior + revisión mensual de 45 min, capacidad multi-sede |

**Puesta en marcha (una sola vez, aparte de la mensualidad):** configuración sobre producto existente, rebranding acotado, mejora de hasta dos perfiles, biblioteca de 12 hooks y 6 videos de ejemplo reutilizables. Su costo y su financiamiento **no están cotizados**: «Adaptación de producto existente desde USD 500» (tarifario general) **no cubre automáticamente todo EstateOS**; módulos nuevos, identidad integral o migraciones se cotizan aparte. Antes de ofrecer Contact a 30 hay que medir las horas iniciales y su amortización.

**Lectura aritmética (hipotética):** con el techo del 50 %, las horas totales (producción + revisión + soporte) que caben **sin ningún gasto externo** son `techo ÷ costo hora`:

| Costo hora hipotético | Contact | Growth | Escalar | Hípergrowth | Deluxe | Partner |
|---|---|---|---|---|---|---|
| 10 USD | 1,5 h | 3,75 h | 5,0 h | 7,5 h | 10 h | 25 h |
| 20 USD | 0,75 h | 1,88 h | 2,5 h | 3,75 h | 5,0 h | 12,5 h |
| 30 USD | 0,5 h | 1,25 h | 1,67 h | 2,5 h | 3,33 h | 8,33 h |

Con 20 o 30 USD/h, Growth (1,88 h y 1,25 h) **no alcanza ni para las 2 h de soporte de referencia**, antes de producir un tour, cuatro imágenes y una pieza motion y de pagar un solo clip o mensaje; con 10 USD/h deja 1,75 h para toda esa producción y su revisión. No es una conclusión de rentabilidad (el costo real de la hora es desconocido): es la razón por la que **los cupos siguen marcados como propuesta** y por la que 2.3 debe medirlos antes de ofertar. Alternativas a evaluar en 2.3 (sin cambiar el precio indicado): bajar el cupo, cotizar como extra, o separar mantenimiento de producción.

**Decisión pendiente:** el gate de 2.3 no exige aprobar de nuevo los cinco precios: exige **validar alcance rentable, sexto nivel y presupuesto** antes de la oferta pública. Estados de oferta de 2.3: recibido del propietario / cupo propuesto / costeado / aprobado para ofertar / implementado / probado / operativo / retirado. Hoy todo cupo está en **«cupo propuesto»**.

## 5. Límites de render propuestos (producción bloqueada hasta aprobarlos)

**Regla:** cero producción sin **techo numérico aprobado**. Al alcanzar el techo no se reintenta ni se cambia de proveedor automáticamente. Los valores en blanco los define Ignacio con una cotización real (gate A3).

| Campo | Propuesta |
|---|---|
| Cuenta / moneda | Cuenta de Higgsfield de Eclipse · USD |
| Tope mensual declarado | USD 100 (Higgsfield), USD 11 (ElevenLabs), sin tope (Suno): **es un compromiso mensual, no un costo por clip** |
| Modelo, resolución, segundos | a fijar tras comprobar la herramienta en la cuenta (el costo «desde» publicado **no** es el costo final); duración de pieza final ≤ 15 s, definida por la ficha |
| Intentos por escena | máximo 2; el tercero requiere nueva ficha y OK |
| Techo por clip | USD ___ (a cotizar y aprobar) |
| **Techo por lote (propuesta)** | **≤ 50 % del tope mensual (USD 50 de Higgsfield)** mientras no exista un costo medido; luego se recalibra con el costo real |
| Orden | A0→A5 secuencial; **un solo render en curso** |
| Conserva | job id privado, costo medido, hash, prompt exacto, intento, archivo final y póster/fallback |
| Si falla | se registra la causa; no se cambia proveedor ni se reintenta sin ficha |

**Costo marginal vs compromiso mensual:** si la suscripción mínima supera el costo por clip, se muestran **ambos**. Con un tope mensual de USD 100, la cantidad de clips que caben se calcula como `floor(tope ÷ (costo por clip × intentos))`, solo cuando exista un costo por clip medido. La intro de 90 s de EstateOS es **montaje de UI y extractos reutilizables**: **no autoriza seis videos pagos adicionales**.

## 6. Gate de gasto (plantilla)

> **Proveedor · producto · número de trabajos · configuración · saldo o recurrencia · tope en USD/moneda e impuestos · quién paga · qué se conserva · qué ocurre si falla.**

Sin las nueve respuestas no se gasta. Si la suscripción mínima supera el costo por clip, se muestran ambos importes. Cada gasto aprobado se enlaza desde el libro (§2).

## 7. Registro de asset propuesto (plantilla)

`id estable · escena · versión · hash · fuente/licencia/consentimiento · referencia ancla · prompt exacto · modelo y fecha del schema · duración/resolución/aspecto · costo cotizado · intento · job id privado · costo medido · QA · archivo final, póster y fallback · aprobación`.

## 8. Ciclo comercial y capacidad (reglas)

- **Reservar el 20 % de la capacidad** para prospección; ningún roadmap técnico acredita ventas.
- **Cinco números por lote comercial:** contactos nuevos · conversaciones abiertas · propuestas enviadas · **USD cobrado** · % de contactos tibios.
- **D+2 señal** y **D+7 informe**; sin respuesta con actividad real en una semana → ajustar **una** variable; un mes en cero con actividad real → revisar la apuesta con Ignacio. Estos plazos son reglas, **no eventos ocurridos**.
- Los 5 candidatos investigados en 3.9 **no** son interesados confirmados.

## 9. Datos que faltan para cerrar la economía (los aporta Ignacio)

1. Costo horario interno de Eclipse (o el criterio para fijarlo).
2. Comisiones de cobro (pasarela) y régimen de impuestos: **Ignacio los definirá al facturar**; hasta entonces los márgenes se leen antes de impuestos.
3. Ingresos reales y propuestas vigentes (para llenar el libro §2).
4. Cuota efectiva de Claude (el costo de USD 100/mes ya está declarado; la cuota no es legible).
5. Costos por clip, voz y mensajes **medidos** en la cuenta (Higgsfield, ElevenLabs, WhatsApp por mercado/categoría, telefonía y LLM de voz, LLM del chatbot).
6. Decisión sobre el umbral de contribución, el techo por lote de render y el tope de Suno.
7. ~~Confirmación del «200»~~ **Resuelto 26/10/2026:** el 200 es **Deluxe**; el 199 general sigue sin publicarse.
