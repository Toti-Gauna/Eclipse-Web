# Lote 2.5 · Conversión y seguimiento

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `medium` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `2581850`, merge del PR #25) · **Resultado:** **documental**, más el registro de las decisiones de Ignacio del 27/10 en el catálogo (v2) y en el texto de «Precios». No se contactó a nadie, no se publicó ni se cobró nada. Gasto externo: USD 0.

**Fuentes leídas:** Notion «Lote 2.5 · Conversión y seguimiento» (prompt 01–16) y «Lotes y prospectos» (incluye la jornada EstateOS del 27/10, **15 inmobiliarias en Mar del Plata**); `lib/analytics.ts`, `lib/whatsapp.ts`, `components/ui/WhatsAppLink.tsx`, `components/pricing/Levels.tsx`, `components/demo-experience/store.ts`; en `Eclipse-be`: `prisma/schema.prisma` (`Lead`, `LeadBatch`, `Payment`) y `src/types/{crm,project}.ts`; en `Eclipse-internal-portal`: `src/live/modules/*`; los lotes 2.1–2.4.
**Límites:** no leí las fichas individuales de las 15 inmobiliarias ni la página «EstateOS · 15 inmobiliarias» (no hacía falta para definir el sistema y no se contacta a nadie); no hay cifras actuales de conversión (el prompt tampoco las tiene).

## 0. Informe en tres líneas

- **Qué cambió:** quedaron escritos el **embudo honesto** (clic → conversación → propuesta → aceptación → anticipo acreditado, cada etapa atada a un registro real del CRM), el **pitch de 90–120 s** (220 palabras, ≈ 96 s, medido), una **propuesta desglosada** con ejemplo, los **eventos mínimos** (sin proveedor nuevo ni datos personales), cómo se **registra todo en el CRM actual** (sin otro CRM), la **cadencia** D0/D+2/D+7 y el flujo por respuesta, el diseño de la **prueba** con 5–10 inmobiliarias y los **criterios de atribución**. Además, se **registraron tus decisiones del 27/10** (D17, D19, D21, D23, D24, D25, D26, cobros, D22): catálogo v2 (`estateos-2026-10-27-v2`), packs v2, y el aviso de «Precios» ahora dice que la puesta en marcha acotada va incluida.
- **Qué quedó abierto:** la solicitud de propuesta **por la web** sigue bloqueada hasta conciliar el catálogo del backend; la analítica **no persiste** (solo consola y un evento local: no hay proveedor instalado), así que la atribución se hace en el CRM; el CRM **no tiene un campo para plan y versión de catálogo** (propongo una convención de texto, sin tocar el backend); con la puesta en marcha incluida **falta definir qué es el anticipo** de un plan mensual (D27); D20 sigue sin respuesta.
- **Qué necesita el OK de Ignacio:** **D27** (¿el primer mes se paga antes de empezar y hace de «seña»?) y **D20** (chat guiado en Contact, ya explicado). Sales **no contacta a nadie** sin una instrucción explícita tuya. Cierra la Fase 2; sigue el **PR de conciliación del backend** y, después, la **Fase 3** (con el repo `roofy` cuando llegues ahí).

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Rama y HEAD | `claude/eclipse-v3-inventory-audit-2ukttn` = `main` `2581850`; `git status` limpio |
| Qué se corrió | lecturas; mediciones del pitch (palabras y duración); `tsc`, `vitest`; no se ejecutó build ni e2e (solo cambió un texto de 3 idiomas y datos de documentos) |
| Contacto externo | **ninguno** (criterio de aceptación) |
| Gasto | USD 0 |

## 2. Decisiones de Ignacio registradas (27/10/2026)

| # | Decisión | Dónde queda |
|---|---|---|
| **D17** | Nivel 199: descartado (perfecto) | Cerrada: la escalera tiene Deluxe en 200 |
| **D19** | **La puesta en marcha acotada se incluye con el precio** del plan | Catálogo v2 (`setup: incluida_en_el_precio`; lo que la excede = extra «A cotizar»); aviso de «Precios» es/en/pt. **Reemplaza** el «A cotizar» del lote 2.3 (§3.3 y contradicción C3) |
| **D20** | Preguntó qué es el «chat guiado» | **Pendiente**: respondido en el chat (botones con guion fijo, sin IA ni WhatsApp) |
| **D21** | Primero medir cuánto cuesta un tour guiado y demás; **Contact con 0 horas de soporte, salvo bug crítico** | Catálogo v2 (`humanSupport`); los cupos de producción siguen «a medir» y no se ofertan como cerrados. «Bug crítico» = un error que impide usar el producto contratado *(definición propuesta)* |
| **D22** | Economía al final, con el primer cliente | Diferida (ya estaba) |
| **D23** | Campaña: **dos distintos pueden ser; el costo es el mismo** | Catálogo v2: dos piezas de 15 s; el cliente elige un concepto en dos formatos o dos conceptos. *El «mismo costo» es tu criterio; queda para verificar al medir (dos conceptos suelen pedir más guion y revisión)* |
| **D24** | OK a las equivalencias packs ↔ cupos, **hasta definir y crear un paquete completo**: entonces se calcula su valor total, se suma el margen y se agrega al plan correspondiente | Packs v2 (`decisions`) |
| **D25** | De acuerdo: Branding y puesta en marcha, separados | Packs v2 |
| **D26** | De acuerdo: el cliente aporta el plano o las medidas del 2D | Packs v2 |
| **Cobros** | Link de pago + suscripción automática + efectivo + transferencia, **al final** | Catálogo v2 (`decisionLog`); mientras tanto, a mano (etapa P0 del lote 2.3b) |

**Consecuencia económica de D19 (a tener presente):** la puesta en marcha es trabajo humano único (marca acotada, dos perfiles, 12 hooks con 6 videos, guía). Incluida en la mensualidad, se recupera **mes a mes**: en Contact (30) tarda en pagarse y, si el cliente se va antes, queda como costo. Es una decisión comercial tuya; lo único que sugiero es **medir las horas reales con el primer cliente** (D22) antes de ofrecerlo a muchos.

## 3. El embudo (qué cuenta y qué no)

> Un clic en WhatsApp no es una conversación, una solicitud no es una propuesta y una aceptación no es un cobro.

| # | Etapa | Qué la prueba (registro real) | Dónde vive | ¿Se mide hoy? |
|---|---|---|---|---|
| 1 | **Rubro abierto** | evento `selector_chosen` | analítica (solo local) | señal, **no persistente** |
| 2 | **Demo vista** | evento `demo_opened` (`demo`, `origin`, `vertical`); no registra qué área se vio | analítica (solo local) | señal, no persistente |
| 3 | **CTA de consulta** | `whatsapp_opened` (con `origin` y `plan`), `selector_opened` desde un nivel | analítica (solo local) | señal, no persistente |
| 4 | **Conversación confirmada** | un humano habló con la persona: `Lead.stage ≥ conversation` y `firstConversationOn` | CRM (`Lead`) | **sí, a mano** (el operador la registra) |
| 5 | **Propuesta enviada** | actividad `proposal_sent` y/o etapa `proposal` | CRM (`LeadActivity`, `Lead.stage`) | sí, a mano |
| 6 | **Aceptación** | etapa `negotiation`/`won` con acuerdo escrito | CRM | sí, a mano |
| 7 | **Anticipo acreditado** | `Payment` con `status = collected` (no `committed`, no `proposed`) y tipo `deposit` (o el primer mes, si se acepta D27) | CRM/portal interno (`Payment`) | **sí, a mano** |

Reglas: un comprobante que manda el cliente **no** acredita (se verifica en el banco o el proveedor y recién ahí se marca `collected`); «cobrado» = `collected`; las etapas 1–3 son **señales**, nunca ventas; no se suman visualizaciones, formularios ni propuestas como cobros.

## 4. Tres caminos de entrada

| Camino | Qué hace el visitante | Qué queda registrado | Estado |
|---|---|---|---|
| **A · Demo, con guía o por mi cuenta** | abre el selector y la demo; elige «Ver con guía» o «Ver por mi cuenta» | señales 1–2 | **funciona hoy** (Lumen dentro de la web) |
| **B · Consulta manual por WhatsApp** | «Pedir este plan» (mensaje con el plan) o «Potenciar mi negocio» | señal 3; luego, en el CRM, el operador crea el `Lead` (fuente `demo_request`/`manual`) | **funciona hoy** |
| **C · Solicitud de propuesta por la web** | formulario → solicitud de plan | `PlanRequest` ligada a un `Lead` (`planRequestId`) | **bloqueada**: hasta que el catálogo del backend coincida con la escalera (D18) |

Cada contacto conserva **plan elegido, versión de catálogo y módulos solicitados** (ver §7). La bienvenida de planes tiene CTA directo y configuración por piezas; no obliga a terminar el video ni un formulario largo.

## 5. Pitch de 90–120 s (llamada, video o presencial)

> **Medido:** 220 palabras = **88–110 s** a 2,5–2,0 palabras/segundo (≈ 96 s a 2,3). Entra en 90–120 s. Un solo pedido al final. Sin ROI ni ventas prometidas.

**Texto (es, rioplatense):**

«Hola, te escribo por algo concreto. En muchas inmobiliarias, las consultas que llegan fuera de horario o por distintos chats quedan sin respuesta o sin seguimiento. No es un problema de ganas: es de orden.

Armamos EstateOS: una web de propiedades y un CRM completo para tu equipo, en un solo lugar. Para que lo veas funcionando preparamos una demo con una inmobiliaria ficticia, Lumen Propiedades. Ahí entra una consulta de noche, se ordena en el CRM, se agenda una visita y queda el seguimiento. Los datos son de ejemplo, no son de ningún cliente real, y no prometemos ventas: te mostramos cómo se vería tu operación ordenada.

Desde USD 30 por mes tenés la web y el CRM completos del producto. Hay seis niveles: sumás panel para el dueño del inmueble, contenido mensual, coordinación del equipo, análisis de datos, administración o varias sedes. Los precios son mensuales y objetivo. La puesta en marcha acotada va incluida. Lo que cuesta aparte lo cotizamos antes: producción extra y consumos de terceros, como mensajes o voz. Los cupos de producción todavía los estamos midiendo y te los confirmamos por escrito.

No te pido que decidas hoy. Te propongo una reunión breve para mostrarte la demo con tu rubro y ver si tiene sentido para tu inmobiliaria. ¿Te viene bien mañana o pasado?»

**Qué reconoce a propósito:** la demo es ficticia; los precios son objetivo; los cupos no están cerrados; lo no probado no se promete.

**Aperturas por canal** (una variable por tanda; las tres de la jornada del 27/10 en MDP):

| Lote | Canal | Variable que se observa | Apertura (primera frase) |
|---|---|---|---|
| E01 | Email | apertura por necesidad de seguimiento | «Las consultas que llegan fuera de horario suelen quedar sin seguimiento: armamos una demo corta de cómo se ordenan.» |
| L01 | Llamada | apertura breve y acceso al decisor | «¿Hablo con quien decide cómo se atienden las consultas nuevas? Son 30 segundos y te cuento para qué llamo.» |
| V01 | Visita | presentación presencial y reunión | «Pasé a mostrarte una demo de cómo una inmobiliaria ordena sus consultas; si ahora no es buen momento, coordinamos otro.» |

## 6. Propuesta desglosada (plantilla y ejemplo)

Una propuesta separa **setup, mensualidad, cuotas/consumos, extras y estados pendientes**, y nunca da un total final falso. Ejemplo **ficticio** (nivel Growth):

| Concepto | Detalle | Importe | Cuándo se paga | Estado |
|---|---|---|---|---|
| **Plan** | Growth · catálogo `estateos-2026-10-27-v2` | USD 75 por mes | cada mes, por adelantado | precio: dirección del propietario |
| **Puesta en marcha** | acotada: configurar web y CRM, marca acotada, hasta 2 perfiles, 12 hooks con 6 videos, guía | incluida en el precio | — | decidida (D19) |
| **Producción mensual** | cupos **propuestos**: 1 tour, 4 imágenes, 1 motion, 300 mensajes | incluidos en el plan | — | **sujeto a medición**: se confirma por escrito |
| **Packs / extras elegidos** | por ejemplo Branding, Kit de Redes | **A cotizar** | 50 % al aceptar, 50 % a la entrega | sin tarifa validada |
| **Consumos externos** | mensajes de WhatsApp, voz, dominio | A cotizar, por separado y explícitos | según uso | sin tarifa validada |
| **Usuarios** | sugerido 1–3 personas (no es tope) | adicionales: A cotizar | — | pendiente de costos |
| **Total de hoy** | primer mes por adelantado | USD 75 | antes de empezar | **propuesto (D27)** |

**Condiciones:** la demo usa datos ficticios; lo que aún no está probado figura como **objetivo**; la propuesta tiene fecha de vigencia; **nada empieza hasta que el pago se acredite** (no basta el comprobante); la forma de pago se acuerda con la propuesta (hoy, a mano; link de pago y suscripción automática, más adelante); no hay descuentos ni «antes $X»; no se vende el viejo «EstateOS desde 50», ni Partner 500 como aprobado.

## 7. Eventos mínimos y atribución

**Hoy:** `track()` solo escribe en consola (en desarrollo) y emite un evento del navegador; reenvía a Plausible o GA4 **si algún día se instala el script, y no hay ninguno**. Por lo tanto **no existe atribución persistente en el sitio**: no se afirma. Los eventos que ya existen cubren las señales 1–3: `selector_opened` y `selector_chosen`, `demo_opened`, `hero_cta_clicked`, `whatsapp_opened` (con `origin` y `plan`).

**Propuesta mínima (sin píxeles ni datos personales):** los identificadores son los ya definidos (`origin`, `plan` = id del nivel, `rubro`); **no se agrega ningún evento nuevo** salvo, cuando haya proveedor, registrar qué **área** de la demo se vio. Nada de nombres, teléfonos ni correos en los eventos.

**Dónde sí queda la atribución:** en el **CRM**, al crear el `Lead`: `source` (`demo_request`, `outbound_batch`, `referral`, `in_person`…), `sourceDetail` (texto: UTM o «demo de Lumen» o el lote), `channel`, `firstContactOn`, `batchId`.

## 8. Registro en el CRM actual (no se crea otro)

| Qué se registra | Campo real | Evidencia |
|---|---|---|
| Fuente | `Lead.source`, `sourceDetail` | `prisma/schema.prisma` |
| Negocio | `Lead.company`, `contactName`, `vertical` | ídem |
| Fecha y canal | `firstContactOn`, `channel` | ídem |
| Hipótesis | `LeadBatch.hypothesis` (por lote) y `Lead.need` | ídem |
| Próxima acción | `nextAction`, `nextActionOn` | ídem |
| Respuesta | `stage` (`conversation`…), `firstConversationOn`, actividades | `src/types/crm.ts` |
| Propuesta | `LeadActivity` tipo `proposal_sent`; etapa `proposal` | ídem |
| Consentimiento | `consentStatus`, `consentOn`, `consentBasis` | ídem |
| Pago verificado | `Payment.status = collected` (+ `kind`) | `src/types/project.ts` |
| **Plan, versión de catálogo, módulos** | **no hay campo** | — |

**Brecha y convención:** para no tocar el backend, se anota en `need` o `commercialNotes` una línea fija: `Plan: growth · catálogo: estateos-2026-10-27-v2 · módulos: branding, redes`. Si se vuelve habitual, se pide un campo propio (cambio de backend con tu autorización). El portal interno ya tiene los módulos de **prospectos, lotes, comunicaciones y cobros**: se usan tal cual.

## 9. Cadencia

**Por lote (demo-first, 5–10 prospectos):** D0 (envío, lo registra el operador) → **D+2 señal** → **D+7 cierre** contra el umbral del canal; **máximo 3 lotes vivos**, cada uno con **una** variable distinta. Los lotes del backend ya traen `signalDays = 2` y `closeDays = 7`.

**Por respuesta:** respondió → **llamada el mismo día** → **propuesta en ≤ 24 h** → toques **+2 / +5 / +9** → archivo **+14** → reactivación **+60**.

**Sin envío automático:** el sistema calcula los recordatorios; **WhatsApp se mantiene manual** y los correos pasan por «declarar enviado» (política del backend).

## 10. Prueba con inmobiliarias

- **5–10 inmobiliarias investigadas una por una** por tanda, **una variable por tanda**; máx. 3 lotes vivos. La jornada del 27/10 ya tiene tres lotes planificados (E01 email, L01 llamada, V01 visita; 15 empresas distintas en total). **No se contactó a ninguna.**
- Cierre de cada lote: **un informe de tres líneas** (qué funcionó, qué no, qué cambia la próxima). **Tres coincidentes → playbook.**
- Lo que se mide: del embudo, las etapas 4–7 (las 1–3 son contexto).

## 11. Criterios de atribución

1. **Primera fuente** guardada al crear el lead; no se pisa.
2. **Una conversación es de un humano**: un clic no la crea.
3. **Cobrado = `collected` verificado**, no «aceptó», no «mandó comprobante».
4. Un lead que llega por dos canales se **deduplica** (el CRM tiene `duplicateOfId`) y conserva la primera fuente.
5. **No se atribuyen resultados** (ventas, ROI) a una pieza o a un canal con una sola observación; hay que repetirlo en otra tanda.
6. Sin analítica persistente, **no se publican cifras de conversión** de la web.

## 12. Handoff a Sales

Entrega: pitch (§5), aperturas por lote (§5), propuesta (§6), convención del CRM (§8), cadencia (§9), prueba (§10) y atribución (§11). **Sales contacta solo cuando reciba una instrucción explícita de Ignacio.** No se envió ni se agendó nada.

## 13. Criterios de aceptación (§12 del prompt)

| Criterio | Estado | Dónde |
|---|---|---|
| El embudo separa clic, conversación, propuesta y cobrado | **Cumplido** | §3 |
| Pitch y propuesta reconocen demo y precios pendientes | **Cumplido** | §5, §6 |
| La propuesta desglosa anticipo/saldo y mensualidad | **Cumplido**, con D27 pendiente | §6 |
| Cada prospecto tiene fuente y próximo paso | **Cumplido** | §8 (campos reales) |
| No se realizó contacto externo | **Cumplido** | §1 |
| Cada afirmación de funcionamiento con evidencia o rotulada | **Cumplido** | §3 (señales vs. registros), §7 |
| Sin gastos, publicaciones ni cambios de alcance implícitos | **Cumplido** | USD 0; los cambios de v2 son decisiones tuyas |
| Contenido vigente preservado; sustituciones documentadas | **Cumplido** | v1 se conserva; v2 declara qué reemplaza (§2) |

## 14. Decisiones para Ignacio

| # | Decisión | Recomendación |
|---|---|---|
| **D27** | Con la puesta en marcha incluida, ¿qué es el anticipo de un plan? Propongo: el **primer mes se paga antes de empezar** y hace de seña; los packs y extras siguen 50/50 | Aceptar |
| **D20** | ¿Contact incluye el chat guiado del sitio? (ya explicado) | Que sí |

## 15. No ejecutado, límites y rollback

- **No ejecutado:** contacto con prospectos, instalación de analítica, cambios de backend, build/e2e (solo se tocó un texto de tres idiomas y datos).
- **Cambios de archivos:** catálogo y packs v2 (los v1 se conservan), `content/levels.json` (versión), aviso de «Precios» en `messages/{es,en,pt}.json`, pruebas actualizadas.
- **Rollback:** volver el commit; los v1 siguen disponibles y el texto anterior de «Precios» queda en el historial de git.

## 16. Handoff

Cierra la **Fase 2**. Habilita **3.1–3.9**, que se ordenan después del **PR de conciliación del backend** (la escalera como catálogo) y de que crees el repo `roofy` al empezar la Fase 3. Los cobros (link de pago, suscripción) y la economía real quedan **al final**, como indicaste.
