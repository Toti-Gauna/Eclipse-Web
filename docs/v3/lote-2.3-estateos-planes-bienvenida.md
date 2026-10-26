# Lote 2.3 · EstateOS · planes y bienvenida

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `4e00818`, merge del PR #23) · **Resultado:** **documental**. No se tocó código de producto ni `/content`. Se agregaron el catálogo versionado (`docs/v3/estateos/catalogo-estateos.v1.json`) y una prueba que lo vigila (`tests/estateos-catalog.test.ts`). No se generó ningún medio, no se gastó, instaló ni publicó nada. Gasto externo: USD 0.

**Fuentes leídas completas:** Notion «Lote 2.3» (prompt 01–16 y corrección vigente del 26/10), anexo A «Planes y cupos EstateOS», anexo B «Bienvenida · guion y producción», anexo C «Módulos y entregas futuras», anexo D, y las páginas V4 que esos anexos citan: «V4 · Eclipse y EstateOS · Evolución de portales», «V4 · Web, portal cliente y modalidades de compra», «Academy · Niveles, contenidos y aprendizaje» y «Academy · Matriz final propuesta por nivel». **Código inspeccionado (solo lectura):** Lumen (`components/demos/real-estate/*`), `Eclipse-be` (`prisma/schema.prisma`, `src/**`) y `Eclipse-internal-portal`.
**No leído / no accesible (límites explícitos):** (1) las tres páginas de tarifas externas (`business.whatsapp.com`, `elevenlabs.io`, `open.higgsfield.ai`): **el entorno bloquea esos hosts** (`ENOTFOUND`); solo hay referencias de búsquedas web, de fuentes secundarias y **no validadas** (§6.4); (2) los términos de Suno y la Ley 25.326 no se abrieron: no se afirma nada sobre derechos ni cumplimiento; (3) las doce fichas por rubro de la biblioteca de Academy (solo se usó su índice). Para abrir los hosts de tarifas: *Configuración del entorno → Acceso a la red → agregar los tres dominios en «Allowed domains»* (o un nivel más amplio).

## 0. Informe en tres líneas

- **Qué cambió:** quedó escrito el **catálogo EstateOS v1** (versión `estateos-2026-10-26-v1`, digest en el JSON): seis fichas con **exactamente** Contact 30, Growth 75, Escalar 100, Hípergrowth 150, Deluxe 200 (dirección del propietario) y Partner 500 (**propuesta**), con la corrección del 26/10 aplicada (**Contact = web + CRM completo del producto**, el propietario desde Growth, el chatbot desde Deluxe), cuotas como **totales por plan**, semántica de cada unidad (tour, campaña, imagen, mensaje, minuto, revisión, marca blanca), configurador, comparador y copy; la matriz **requisito → estado real → evidencia → lote** (resultado: **hoy no existe nada de EstateOS en el backend**, solo el demo guionado de Lumen); el paquete de la bienvenida **ES-INTRO** de 90 s (con dos correcciones al guion, §9.2); wireflows, brechas S0–S4 y la hoja económica por plan.
- **Qué quedó abierto:** la **rentabilidad es indeterminada** (faltan costo horario interno, comisiones, impuestos y tarifas validadas); aun con proveedores a costo 0, **Contact (30) no llega al gate de contribución ≥ 50 % si incluye las 2 h humanas de soporte** salvo que la hora cueste ≤ 7,5 USD (§6.3); la «puesta en marcha» no tiene precio de referencia desde que Adaptación 500 se ocultó (2.2b); ninguna capacidad por encima del CRM de demostración está construida; las tarifas externas no se pudieron validar.
- **Qué necesita el OK de Ignacio:** **D19–D23** (§12): precio de la puesta en marcha, si Contact incluye el chat guiado del sitio, horas de soporte por plan, los datos de costo para cerrar la economía, y si «campaña = dos formatos» es el alcance. Siguiente: **2.4 · Packs inmobiliarios** (Sonnet · medium), después 2.5.

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Rama y HEAD | `Eclipse-Web` `claude/eclipse-v3-inventory-audit-2ukttn` = `main` `4e00818`; `git status` limpio al empezar |
| Otros repos (lectura) | `Eclipse-be` `3754947` (`main`, limpio); `Eclipse-internal-portal` `3907160` (limpio) |
| Qué se corrió | lecturas; inspección de código; un script que mide la locución de la bienvenida (palabras por segundo); un script que genera el JSON del catálogo y su digest; `vitest` (prueba nueva y suite completa), `tsc`, `eslint` |
| Auditoría de `Eclipse-be`/portal | hecha por un subagente de solo lectura y **verificada por mí** en los puntos que sostienen la matriz (modelo `Organization`, ausencia de entidades de propiedad/suscripción, `wa.me` como único WhatsApp, límite de 5 MB de documentos) |
| Gasto | USD 0; sin servicios, cuentas ni instalaciones |

## 2. Decisiones vigentes aplicadas y contradicciones resueltas

**Dirección vigente (26/10/2026, Ignacio):** USD 30 incluye **web y CRM completo del producto** (Volta como referencia; en ecommerce, también Regalos/gamificación). Se **descarta** «Contact solo web / CRM desde Growth». Propietario desde 75; chatbot desde 200. Todos los niveles heredan el producto base completo; producción, formación comercial y módulos especializados diferencian los superiores. «Incluido comercialmente» no es «ya construido» (§5).

| # | Contradicción detectada | Resolución en este lote | Fuente que gana |
|---|---|---|---|
| C1 | El criterio 4 del prompt dice «Contact incluye chat en sus dos relaciones… y kit»; la corrección del 26/10 y el anexo A dicen web + CRM completo, y el kit va en la **puesta en marcha** | Contact = web + CRM completo; el **kit de marca/redes/hooks es puesta en marcha (única vez, cotizada)**, no mensualidad. El «chat» del sitio queda como **pregunta abierta D20** | corrección 26/10 + anexo A |
| C2 | El guion del anexo B (capítulo Contact) todavía dice «suma automatización inicial, una puesta en marcha de marca y redes y una guía de hooks» | Locución corregida (§9.2): web y CRM completo; la puesta en marcha se cotiza aparte | corrección 26/10 |
| C3 | El prompt toma como referencia de setup «adaptación de producto desde USD 500», pero **2.2b ocultó Adaptación 500** (D16) | La puesta en marcha de EstateOS queda **«A cotizar»**; 500 no se publica ni se cita como precio. Decisión **D19** | D16 de Ignacio |
| C4 | «Escalar: dos entregas publicitarias de 15 s» vs anexo A: «una campaña = dos piezas, 16:9 y 9:16, mismo concepto» | Se adopta la interpretación del anexo A (marcada **propuesta**; si son dos conceptos, consumen dos campañas). Decisión **D23** | anexo A (propuesta) |
| C5 | El criterio 5 dice «Academy privada con suscripción activa» en Growth, pero una cuenta privada y derechos por suscripción **no existen** (§5) | Se vende como **objetivo**; la demo pública muestra una muestra rotulada. Academy privada = S1 | spec §05 y anexo C |
| C6 | El precio «USD 50» aparece en copy histórico | Solo como antecedente sustituido (el JSON lo declara; una prueba lo exige) | prompt §03/§12 |
| C7 | Mismo importe, distinta oferta: Contact 30 ≠ Esencial 30 (catálogo general); Growth 75 ≠ Conectado 75; Hípergrowth 150 ≠ Automatización e IA 150 | El catálogo EstateOS lleva su `scope`: «no es el catálogo general». No se trasladan prestaciones | prompt §03 |
| C8 | La «compra de producto USD 200» de Ignacio y el plan Deluxe 200 comparten cifra | **No es precio de lista**: hipótesis pendiente de margen/alcance; no se muestra | V4 |
| C9 | Higgsfield: la página de catálogo API (citada) y una fuente secundaria que dice «sin API pública» | Sin resolver (no accesible): se trata como **por revalidar** antes de G4 | — |

## 3. Catálogo EstateOS v1 (definido / propuesto, no implementado)

Archivo: `docs/v3/estateos/catalogo-estateos.v1.json` · versión `estateos-2026-10-26-v1` · digest SHA-256 dentro del archivo (la prueba lo recalcula). **Estados:** *dirección del propietario* (precio) · *propuesta* (Partner, cuotas) · **ningún nivel está «disponible»**: todos son **objetivo** hasta pasar G5.

### 3.1 Escalera de planes

| Plan | USD/mes | Estado del precio | Equipo sugerido (no es tope) | Resultado y diferencial |
|---|---:|---|---|---|
| **Contact** | 30 | dirección del propietario | operación inicial del producto completo | Web + CRM completo del producto (en ecommerce, panel completo y Regalos/gamificación, referencia Volta) |
| **Growth** | 75 | dirección del propietario | 1–3 personas | Contact + **panel del propietario**, mapas MDP y métricas agregadas, Academy inicial, producción mensual, recreación del local al iniciar |
| **Escalar** | 100 | dirección del propietario | hasta 6 | Growth + coordinación comercial, más producción, **voz** y kit para comercializar tours |
| **Hípergrowth** | 150 | dirección del propietario | hasta 10 | Escalar + **Intelligence** (análisis y recomendaciones explicables) y Compliance documental (propuesta V4) |
| **Deluxe** | 200 | dirección del propietario | hasta 15 | Hípergrowth + **chatbot integrado al CRM** y **administración** con marca inmobiliaria |
| **Partner** | **500** | **propuesta** | equipos mayores / varias sedes | Deluxe + varias sedes/carteras, más cupos, revisión mensual de 45 min |

Reglas: cada nivel **hereda** al anterior; una inmobiliaria chica puede elegir un nivel alto por sus **funciones** (el tamaño sugerido orienta, no limita); los propietarios externos **no** cuentan como usuarios internos; una persona con varios roles cuenta una vez.

### 3.2 Capacidades por plan (21; qué es demo, qué es objetivo)

`demo` = existe un recorrido guionado de Lumen con datos ficticios · `objetivo` = sin código.

| Capacidad | Desde | Estado hoy | Evidencia | Lote / entrega |
|---|---|---|---|---|
| Web pública del producto | Contact | demo | `views/Site.tsx` | 3.5 · S0→S1 |
| CRM completo (contactos, consultas, propiedades, oportunidades, agenda, tareas, historial, roles básicos) | Contact | demo (sin servidor ni roles) | `views/{Inbox,Pipeline,Visits,Listings,Today}.tsx` | 3.5/3.6 · S1 |
| Puesta en marcha (marca, 2 perfiles, 12 hooks + 6 videos, guía) | Contact (única vez) | objetivo (servicio manual) | — | 2.4/2.5 |
| Panel del propietario | Growth | objetivo | — | 3.6 · S3 |
| Mapas MDP y métricas agregadas | Growth | objetivo | sin cartografía licenciada | 3.8 · S2 |
| Academy inicial | Growth | objetivo (muestra pública prevista) | — | 3.5 · S1/S2 |
| Archivo privado por inmueble/operación | Growth | objetivo (propuesta V4) | — | V4 · S1 |
| Producción mensual (imágenes, motion, tours) | Growth | objetivo | sin pipeline; sin gasto autorizado | 3.1–3.4 · S2 |
| Recreación del local (una vez) | Growth | objetivo | requiere fotos autorizadas | 3.3 · S2 |
| Mensajes automatizados salientes | Growth | objetivo | demo simula (`views/Followups.tsx`) | 3.5 · S1 |
| Coordinación comercial (reasignación, carga, metas, estancadas) | Escalar | objetivo | — | 3.6 · S1/S3 |
| Campañas de 15 s (16:9 + 9:16) | Escalar | objetivo | — | 3.3 · S2 |
| Agente de voz | Escalar | objetivo | sin proveedor | 3.5 · S2 |
| Kit para comercializar tours | Escalar | objetivo | — | 2.4 · S2 |
| Borradores de contratos desde plantillas | Escalar | objetivo (propuesta V4) | — | V4 · S3 |
| Intelligence | Hípergrowth | objetivo | el KPI del demo es fixture | 3.8 · S3 |
| Compliance · contratos y documentación | Hípergrowth | objetivo (propuesta V4) | no es asesoramiento jurídico | V4 · S3 |
| Chatbot integrado al CRM | Deluxe | objetivo | el demo tiene un chat guionado de cara al comprador, no un asistente sobre datos | 3.6 · S3 |
| Administración (consorcios, expensas, reclamos, correo) | Deluxe | objetivo | producto nuevo respecto de Lumen | 4.x · S4 |
| Varias sedes/carteras | Partner | objetivo | — | 4.x · S1/S4 |
| Revisión mensual de 45 min | Partner | objetivo (servicio humano) | — | — |

### 3.3 Puesta en marcha (única vez, alcance cotizado)

**Incluye:** configurar web/CRM sobre el producto existente; adaptación o rebranding **acotado** (diagnóstico, logo existente ajustado si procede, paleta, tipografía, plantillas); auditoría y mejora de biografía, portada, destacados y CTA en **hasta dos** perfiles; biblioteca de **12 hooks con 6 videos representativos** reutilizables (ejemplos educativos, **no** 6 anuncios exclusivos) y guía operativa. **No incluye:** rediseño integral de identidad, sesión fotográfica, gestión continua de redes, migraciones, módulos nuevos. **Precio: A cotizar** (D19). Su financiación y derechos se cierran antes de ofertar; no se cobra aparte lo que un setup vigente ya incluye.

## 4. Cuotas y semántica de las unidades

### 4.1 Tope mensual propuesto (**totales por plan, no sumas entre niveles; borrador a costear**)

| | Contact | Growth | Escalar | Hípergrowth | Deluxe | Partner |
|---|---:|---:|---:|---:|---:|---:|
| Tours de 15 s | 0 | 1 | 2 | 3 | 4 | 8 |
| Campañas de 15 s × 2 formatos | 0 | 0 | 1 | 2 | 3 | 5 |
| Motion por plantilla (10–15 s) | 0 | 1 | en campañas | en campañas | en campañas | en campañas |
| Imágenes finales | 0 | 4 | 8 | 12 | 16 | 24 |
| Mensajes automatizados salientes | 0 | 300 | 600 | 1.000 | 2.000 | 5.000 |
| Minutos de agente de voz | 0 | 0 | 15 | 30 | 60 | 150 |
| Consorcios / unidades | 0 | 0 | 0 | 0 | 1 / 20 | 3 / 60 |
| Sedes (configuración estándar) | 1 | 1 | 1 | 1 | 1 | hasta 3 |

La prueba `tests/estateos-catalog.test.ts` fija estos números contra el JSON y verifica que ninguna cuota baje al subir de nivel. **No se arrastra** el presupuesto general 5/15/40 de terceros como si validara esta producción.

### 4.2 Definiciones resueltas (antes de calcular costos)

| Unidad | Definición adoptada | Qué no es |
|---|---|---|
| **Tour** | Montaje de 15 s para **un** inmueble, **máximo 3 tomas**, desde fotos autorizadas y consistentes; un master y una relación de aspecto | 360°, escaneo, recorrido libre ni levantamiento. Sin continuidad espacial comprobable: **presentación animada de fotos rotulada** |
| **Campaña** (Escalar+) | Dos piezas finales de 15 s (**16:9 y 9:16**), mismo concepto; una ronda de cambios consolidada | Dos conceptos independientes (consumen dos campañas) — *pendiente de aceptación, D23* |
| **Imagen** | Arte final para un formato desde un concepto y referencias aprobadas | Producción ilimitada; variantes y revisiones se enumeran en el brief |
| **Motion** | Una pieza por plantilla de 10–15 s (Growth); desde Escalar forma parte de las campañas | Un cupo oculto adicional |
| **Mensaje** | Mensaje saliente automatizado **entregado** por la WhatsApp Business Platform, con reconciliación | Chat interno, enlaces manuales (`wa.me`), envío masivo ni tasa única universal |
| **Minuto de voz** | Tiempo conectado del agente, con unidad y redondeo del proveedor documentados | Minutos de locución de tours; LLM y telefonía van aparte en la economía |
| **Revisión** | Una consolidada por pieza; corregir un error imputable a Eclipse no consume otra pieza | Revisiones ilimitadas; reabrir el brief es extra |
| **Marca blanca** | Interfaz con la marca de la inmobiliaria sobre el producto de Eclipse | Propiedad del código, reventa ilimitada, ni «todo ilimitado» |
| **Cuota** | Mensual, **no acumulable**; aviso al 80 %; al 100 % se detiene **solo** el servicio consumible, sin sobrecargo automático ni pérdida de acceso a datos/historial | — |

## 5. Matriz requisito → estado real → evidencia → lote futuro

Auditoría de código acotada (E1: leído, no ejecutado). **Conclusión: del conjunto EstateOS existe el demo guionado de Lumen; ninguna capacidad real por encima de «CRM de demostración».**

| Requisito | Estado real hoy | Evidencia | Brecha / lote |
|---|---|---|---|
| Aislamiento multiempresa (tenant) | **No existe.** `Organization` es solo la etiqueta de empresa del cliente que agrupa proyectos; el acceso admin no se acota por organización; sin `tenantId` en leads, pagos, documentos ni solicitudes | `prisma/schema.prisma` `model Organization`; `src/projects/access.ts` | **S1** — SDD propio contra backend |
| Cuentas y roles | Existen dos clases (clientes en BD; admins en `ADMIN_ACCOUNTS_JSON`) con scopes de admin; **no hay roles por inmobiliaria** (dueño, recepción, asesor, propietario) | `src/configuration/auth.ts`, `src/types/auth.ts` | **S1** |
| Sesiones, CSRF, MFA | Existen y son sólidos (cookies `__Host-`, refresh con hash, CSRF ligado a sesión, TOTP admin) | `src/middlewares/auth.ts`, `src/auth/*` | reutilizar |
| Suscripción, derechos por plan, cuotas con contador idempotente | **No existe.** Solo claves de idempotencia contra repeticiones en solicitudes y pagos; el «catálogo» es un listado de precios de servicios | `src/plans/catalog-data.ts`; unicidad `(clientId, idempotencyKey)` | **S1** |
| Cobros / proveedor de pago / webhooks | **No existe.** Los pagos son registros manuales | modelo `Payment`; `src/projects/finance.ts` | **S3** (+ revisión de proveedor/jurídica) |
| WhatsApp Business API | **No existe.** Solo un enlace manual `wa.me`; la política del repo dice «WhatsApp se mantiene manual» | `src/communications/dto.ts` | **S1/S2**, con cuenta, plantillas y opt-in |
| Correo | Existe (SMTP apagado por defecto, outbox cifrado, plantillas); es **correo del operador**, no un beneficio comercial | `src/email/*` | reutilizable para Deluxe (reclamos) |
| Voz / LLM / telefonía | **No existe** en ninguno de los dos repos | `package.json` sin SDK | **S2** + elección de proveedor |
| Entidades de propiedad/ficha | **No existen** (solo CRM de leads del operador) | `prisma/schema.prisma` | **S1** |
| CRM de leads | Existe pero es el CRM **comercial de Eclipse** (leads, actividades, lotes, metas) | modelos `Lead`, `LeadActivity` | no es el CRM de la inmobiliaria |
| Documentos | Existen (contrato/presupuesto/entregable, versión, hash, visibilidad; PDF/PNG/JPEG/WebP, **5 MB**, en base de datos) | `src/documents/media.ts` | base para el archivo privado; falta tenant y permisos por documento |
| Contratos con evidencias | Solo el **expediente de Eclipse** y el campo de evidencia de comunicaciones; no hay módulo de contratos ni firma | — | V4 · S3 |
| Academy privada | **No existe** | — | S1 (cuentas/derechos) + producción editorial |
| Portal propietario | **No existe** | — | S3 |
| Cartografía / Intelligence | **No existe**; el KPI del demo es de fixture | `views/Today.tsx` | S2/S3 |
| Plan-request / catálogo FE-BE | Existe `GET /catalog/plans`, solicitudes de plan con Idempotency-Key; el catálogo del backend **no coincide** con el de la web (2.2) | `src/plans/*` | conciliación pendiente (D18) |
| Demo Lumen | Existe: Hoy, Bandeja, Pipeline, Visitas, Seguimientos (WhatsApp simulado), Propiedades, Sitio + chat guionado «Lumi»; estado local, sin envío ni cobro | `components/demos/real-estate/RealEstateDemo.tsx:35-40`, `story.ts` | S0: reutilizar tal cual |

**Reutilización:** autenticación, CSRF, documentos, correo, idempotencia y el host de demos son reutilizables; **no certifican** ninguna capacidad nueva. Nada de esto se vende como disponible.

## 6. Hoja económica por plan

### 6.1 Fórmula (del prompt, §11)

`contribución = ingreso neto de impuestos/comisiones − proveedores − (producción + revisión) × c − soporte × c − infraestructura atribuible`, con `c` = costo horario interno. **Umbral propuesto: contribución ≥ 50 % del ingreso antes de gastos fijos** (a validar por Ignacio; no es regla ni margen neto).

### 6.2 Qué se sabe y qué falta

| Insumo | Estado |
|---|---|
| Precio mensual | conocido (30/75/100/150/200; Partner propuesta) |
| Costo horario interno `c` | **falta** |
| Comisión de cobro e impuestos (IVA/IIBB) | **faltan** |
| Costo por tour, campaña, imagen (proveedor + horas de producción y revisión + reintentos) | **falta** (sin tarifas validadas) |
| Costo por mensaje entregado (país/categoría) | **falta** (tarifa de Argentina no hallada) |
| Costo por minuto de voz (agente + LLM + telefonía) | **falta** (solo referencias secundarias) |
| Infraestructura atribuible | **falta**; el ledger fija USD 281/mes de fijos **en total** (no asignados por plan) |
| Horas de soporte incluidas | sin decidir para EstateOS (referencia general 2 h/mes en 2.2) |

**Consecuencia: rentabilidad indeterminada.** No se reemplaza ningún faltante por 0 ni se certifica margen.

### 6.3 Lo que sí se puede decir sin costos internos (cotas, no márgenes)

Presupuesto máximo de costos para respetar un gate del 50 % **suponiendo ingreso bruto** (cota superior: neto de impuestos y comisión será menor):

| Plan | Ingreso | Presupuesto de costos (50 %) | Costo horario máximo si solo hay 2 h de soporte y proveedores a **0** |
|---|---:|---:|---:|
| Contact | 30 | 15,0 | **7,5** USD/h |
| Growth | 75 | 37,5 | 18,75 |
| Escalar | 100 | 50,0 | 25,0 |
| Hípergrowth | 150 | 75,0 | 37,5 |
| Deluxe | 200 | 100,0 | 50,0 |
| Partner (propuesta) | 500 | 250,0 | 125,0 |

Lectura: (a) **Contact** solo cumple el gate con 2 h de soporte si la hora interna cuesta ≤ 7,5 USD y los proveedores cuestan 0; con cualquier costo de infraestructura, menos. (b) Growth, Escalar y siguientes dejan ese presupuesto para **todo**: proveedores, producción, revisión y soporte; cada hora de producción de un tour consume una fracción grande de 37,5. Con un costo horario *hipotético* de 10 / 20 / 30 USD (los del ledger, no medidos), el presupuesto de Growth alcanza para **3,75 / 1,9 / 1,25 h humanas en total** (producción + revisión + soporte) **antes de pagar un solo proveedor**. Un tour, 4 imágenes, 1 motion y su revisión probablemente exceden eso: **el cupo de Growth es el primer candidato a revisar**.

### 6.4 Referencias externas (fuentes secundarias, **no validadas**, solo orden de magnitud)

| Servicio | Lo que se vio | Calidad |
|---|---|---|
| WhatsApp Platform | cobro por mensaje **entregado**, según categoría y país; tarifas de utility/authentication de Argentina bajaron el 1/10/2025; el rate card vigente se descarga por moneda (ARS disponible) | **sin cifra de Argentina**: hay que bajar el CSV desde la cuenta |
| ElevenLabs Agents | ≈ 0,08 USD/min base; LLM aparte (entre ≈ 0,0005 y ≈ 0,045 USD/min según modelo); telefonía aparte; cifras de planes contradictorias entre fuentes | blogs de terceros |
| Higgsfield | precios «desde» por segundo según modelo (p. ej. 0,084 USD/s); créditos por plan; una fuente dice «sin API pública» | blog de tercero + contradicción (C9) |

Con esas referencias, el costo de **proveedor** de la voz (Partner: 150 min × ≈ 0,08–0,13 ≈ **12–20 USD** + telefonía) y de **un tour** (15 s × 0,084 ≈ 1,3 USD por intento) parece chico frente al ingreso; **lo caro sería la hora humana**. Esto es una impresión de orden de magnitud, **no una cotización**: G2 exige tarifas validadas en la cuenta.

**Topes declarados por Ignacio (K3):** Higgsfield 100/mes y ElevenLabs 11/mes; el gasto autorizado **sigue en USD 0** hasta un gate G4. Cuántos clientes caben bajo esos topes depende del costo **medido** por tour e imagen (con reintentos y revisión), que hoy no existe: no se supone ni se calcula aquí.

### 6.5 Alternativas de cupo/alcance (sin cambiar el precio indicado)

1. **Mantener cupos y aceptar un gate menor al 50 % en Contact/Growth** hasta medir (decisión de Ignacio).
2. **Contact sin horas humanas incluidas**: centro de ayuda, guías de Academy y correo; la hora humana se cotiza. (Es la única forma de acercar Contact al gate con costo `c` realista.)
3. **Growth con tour cada dos meses o sin motion** hasta medir tiempos reales de producción/revisión.
4. **Producción como «créditos» comprables** por encima del mínimo, en lugar de cupos fijos grandes.
5. **Partner solo con capacidad cotizada** (ya lo dice la spec): precio 500 como piso, no como tope.

Recomiendo **(2) y (3)** como punto de partida y marcar los cupos de Growth/Escalar como «sujetos a cupos validados» hasta que G2 pase. Decisión **D21**.

## 7. Configurador por piezas

Base + módulos compatibles + cantidades → resumen persistente durante la sesión → propuesta. **Sin checkout**; sin catálogo de extras inventado.

| Módulo | Requiere | Estado de precio |
|---|---|---|
| Núcleo CRM/web | — | incluido en todos los planes |
| WhatsApp automatizado | núcleo + cuenta autorizada + plantillas | A cotizar |
| Contenido / imágenes | — (Studio puede contratarse sin CRM) | A cotizar |
| Tours | fotos autorizadas | A cotizar |
| Campañas | brief aprobado | A cotizar |
| Voz | núcleo + proveedor | A cotizar |
| Academy | cuenta privada (S1) | por nivel; formación puntual no da acceso ilimitado |
| Mapas / Intelligence | núcleo + datos autorizados | A cotizar |
| Propietario / cobros | núcleo + contrato + proveedor + conciliación | A cotizar |
| Administración | Deluxe+ | A cotizar |
| Equipamiento puntual (QR/NFC, llaveros) | — | contra pedido/anticipo; A cotizar |

**Reglas:** el resumen separa **pago de hoy · mensualidad · puesta en marcha · extras** y **consumos variables**; un extra ya incluido no se cobra de nuevo; mensual y anual no se cobran por la misma cobertura; «A cotizar» nunca suma ni muestra total final; los extras empiezan **desmarcados**; una compra puntual no altera la mensualidad. **Modalidades:** mensual (vigente en el catálogo); **anual prepagado** (propuesta V4: servicio por 12 meses, no propiedad del software, descuento solo si se aprueba); **compra de producto + mantenimiento** (hipótesis; sin precio de lista; exige distinguir web exportable de licencia alojada, titularidad del código y migración).

## 8. Copy propuesto (es · rioplatense) — comparador y fichas

> Todo es **texto propuesto para revisión**; no se publicó. Prefijo obligatorio en cada ficha mientras no haya evidencia: **«Objetivo»** (no «disponible»). Pendiente: en/pt al implementarse (3.x).

**Encabezado del comparador:** «Elegí el nivel por lo que necesitás, no por el tamaño de tu equipo.» **Aviso fijo:** «Demo con datos ficticios. Precios mensuales objetivo; Partner y cupos son propuesta. La puesta en marcha y los gastos externos se definen en tu propuesta.»

| Plan | Título | Una línea | Para quién | Resultado | Incluye (resumen) | No incluye | CTA |
|---|---|---|---|---|---|---|---|
| **Contact · USD 30/mes** | Tu web y tu CRM, completos | Consultas, propiedades, agenda y seguimiento en un solo lugar. | Inmobiliarias que empiezan a ordenar su operación. | Dejás de perder consultas en chats sueltos. | Web del producto · CRM completo · roles básicos · centro de ayuda | Portal del propietario · producción mensual · chatbot · puesta en marcha (se cotiza) | Quiero este plan |
| **Growth · USD 75/mes** | Crecé y rendí cuentas al propietario | Contact + panel del propietario y contenido mensual. | Equipos de 1 a 3 personas que quieren mostrar resultados. | Tus propietarios ven sus inmuebles, rendiciones y avance. | Todo Contact · panel del propietario · mapas y métricas · Academy inicial · 1 tour, 4 imágenes y 1 motion por mes · 300 mensajes | Voz · campañas · Intelligence | Quiero este plan |
| **Escalar · USD 100/mes** | Coordiná al equipo | Growth + reparto de consultas y más producción. | Equipos de hasta 6 que necesitan orden. | Ves qué se estancó y a quién reasignarlo. | Todo Growth · reasignación, metas y estancadas · 2 tours, 1 campaña (16:9 y 9:16), 8 imágenes · 600 mensajes · 15 min de voz · kit para ofrecer tours | Intelligence · chatbot | Quiero este plan |
| **Hípergrowth · USD 150/mes** | Decidí con datos | Escalar + análisis y recomendaciones con fuente. | Equipos de hasta 10 con volumen. | Sabés por qué perdés ventas y qué probar. | Todo Escalar · Intelligence · Compliance documental · 3 tours, 2 campañas, 12 imágenes · 1.000 mensajes · 30 min | Chatbot del CRM · administración | Quiero este plan |
| **Deluxe · USD 200/mes** | Sumá servicios nuevos | Hípergrowth + chatbot en tu CRM y administración. | Equipos que quieren administrar carteras. | Tu equipo consulta datos autorizados y atiende reclamos con tu marca. | Todo Hípergrowth · chatbot integrado al CRM · administración (1 consorcio, 20 unidades) · 4 tours, 3 campañas, 16 imágenes · 2.000 mensajes · 60 min | Varias sedes | Quiero este plan |
| **Partner · USD 500/mes · propuesta** | Varias sedes, una visión | Deluxe + sedes y carteras con permisos propios. | Operaciones con varias sedes. | Dirección compara sedes; cada equipo ve lo suyo. | Todo Deluxe · hasta 3 sedes · 3 consorcios, 60 unidades · 8 tours, 5 campañas, 24 imágenes · 5.000 mensajes · 150 min · revisión mensual de 45 min | Exclusividad · desarrollo ilimitado | Pedir propuesta |

**Comparador móvil:** por categorías (Producto · Propietario · Producción · Datos · Administración · Sedes) y **selección de hasta dos planes**; nunca seis columnas. «Incluye lo anterior» siempre acompañado de un desglose expandible completo. **Estados visibles:** *Objetivo* · *Demo simulada* · *Propuesta*. Ninguna prestación existe solo en la locución.

## 9. Bienvenida ES-INTRO — paquete de especificación (sin producir)

### 9.1 Reglas de entrada y salida

Activar al entrar **por primera vez al acceso general de EstateOS, después del reveal existente** (no duplicar loader: una sola aparición del eclipse). Primera visita: reproducción visible **sin sonido**, `playsinline`; si el navegador la impide, **poster + botón Reproducir**. **Saltar · Comparar · Explorar · Activar sonido** disponibles desde el primer cuadro. **Reduced-motion o ahorro de datos:** poster/lista y reproducción bajo pedido; fade ≤ 150 ms. Preferencia **local versionada** de «bienvenida vista/saltada», sin datos personales; si el almacenamiento falla no bloquea. Revisita ofrece «Repetir presentación». **Enlace directo a plan/área y suscriptor activo omiten la promoción.** La salida lleva al **gateway de cuatro accesos** (Ver con guía · Branding · Intelligence · Academy), sin obligar a recorrer doce escenas. Elegir un plan cambia el panel HTML y permite «Ver este capítulo», **sin audio automático**. El video nunca tapa precios/CTA ni secuestra el scroll.

### 9.2 Guion (90 s) con las dos correcciones de esta revisión

| Tiempo | Capítulo | Imagen y acción | Locución |
|---|---|---|---|
| 00–05 | Eclipse | Eclipse original, halo ámbar | «EstateOS conecta la operación y el crecimiento de tu inmobiliaria.» (10 palabras, 2,0 p/s) |
| 05–17 | Contact · 30 | Consulta → CRM → ficha → agenda | **«Contact te da la web y el CRM completo del producto: consultas, propiedades, agenda y seguimiento. La puesta en marcha de marca y redes se cotiza aparte.»** (27 p., 2,25 p/s) — *corregido: la versión del anexo hablaba de «automatización inicial» y kit como parte de Contact* |
| 17–30 | Growth · 75 | Panel del propietario; mapa MDP demo; Academy; un tour; oficina recreada | «Growth suma el panel del propietario, mapas de Mar del Plata, Academy y contenido: imágenes, motion y un tour mensual. Al comenzar, una recreación de tu local.» (27 p., 2,08 p/s) |
| 30–43 | Escalar · 100 | Tour desde fotos; dos pantallas 16:9/9:16; minutos y seguimiento | «Escalar aumenta la producción, incorpora anuncios de quince segundos en horizontal y vertical, más seguimiento y minutos de voz. Además, te ayuda a ofrecer tours como un servicio.» (28 p., 2,15 p/s) |
| 43–57 | Hípergrowth · 150 | Datos agregados, indicadores y recomendaciones con fuente; panel heredado | «Hípergrowth amplía la producción y suma Intelligence: análisis y recomendaciones para aprovechar tus datos y apoyar al equipo comercial.» (19 p., 1,36 p/s) |
| 57–71 | Deluxe · 200 | Chatbot dentro del CRM responde al equipo; consorcio ficticio, expensas y reclamos | «Deluxe incorpora un chatbot integrado al CRM y administración con tu marca: expensas, reclamos y comunicaciones. Además, amplía contenido y voz.» (21 p., 1,5 p/s) |
| 71–83 | Partner · 500 propuesto | Sedes separadas; mayor lote; revisión mensual | «Partner está pensado para varias operaciones: más capacidad, producción y acompañamiento para comercializar servicios. Es nuestra propuesta superior, sujeta al alcance acordado.» (22 p., 1,83 p/s) |
| 83–90 | Elección | Plan activo, checklist, CTA y cuatro accesos | **«Compará los planes, armá tu combinación o entrá a la demo. Implementación y consumos, en tu propuesta.»** (17 p., 2,43 p/s) — *corregido: el texto del anexo tiene 22 palabras en 7 s = 3,14 p/s, demasiado rápido para entenderse* |

**Medición hecha en este lote:** los capítulos suman **90 s**; la locución se midió palabra por palabra; solo el último capítulo excede un ritmo cómodo (≈ 2,5 p/s). Hípergrowth y Deluxe tienen holgura. **Texto obligatorio fuera de voz** (en pantalla): «Demo con datos ficticios · precios mensuales objetivo · Partner y cupos propuestos · puesta en marcha y gastos externos según alcance · módulos avanzados sujetos a disponibilidad validada.» No se dice en locución que un módulo pendiente ya funciona.

### 9.3 Producción, assets y gates (nada se produce ahora)

- **Montaje de UI real autorizada**, posters, motion y extractos ya aprobados; los clips pagados son **opcionales** y requieren G4. No comprar seis renders por tener seis planes.
- **Precio, estado y cupos viven en HTML**, enlazados por `catalogVersion` + id (esta misma versión alimenta comparador, configurador y texto sincronizado); cambiar una tarifa no exige otro render.
- Cada capítulo: **poster estático independiente**, cue de entrada/salida, texto alternativo, **subtítulos y transcript**.
- Desktop 16:9 (master 1920×1080); móvil **montaje propio** 9:16 (1080×1920), rendición ligera a definir tras medir peso; no recortar el texto del desktop. **No descargar el video completo antes de la intención** ni iniciar medios en paralelo sin necesidad.
- **Audio:** la música ambiental actual se respeta; la voz solo tras activar el sonido (ducking y restauración al salir); español rioplatense neutro; no imitar voces ajenas. ElevenLabs (voz) y Suno (música) quedan **como decisión de stack, sin activar**: derechos, plan/cuenta y condiciones por revalidar antes de G3/G4. Higgsfield: modelo, unidad y costo por revalidar (C9).
- **Cámara virtual de montaje:** 35–50 mm equivalentes, desplazamiento 2–4 %, sin deformar la UI; cortes de 180–240 ms; sin zoom continuo. Mapas y datos **no se generan** como evidencia factual.
- **Manifest propuesto (no existe ruta):** id `ES-INTRO` + versión, idioma, ratio, duración, origen y derechos, fuente de UI y HEAD, poster, subtítulos, transcript, cue in/out, codec, tamaño, hash, fallbacks, modelo/parámetros si aplica, costo por intento y final, aprobación. El directorio se decide al inspeccionar el repositorio de EstateOS (lote 1.6).
- **Gate visual del animatic (pre-producción):** seis capítulos y CTA; precios legibles; checklist = catálogo; estados demostrativos explícitos; nada bloquea saltar; sin audio invasivo; composición móvil propia. Chief y O1 revisan; O2 la integración final.

## 10. Wireflows

```text
Eclipse (reveal) ─▶ primera entrada EstateOS ─▶ ¿visita previa o enlace directo o suscriptor?
        │                                          ├─ no ─▶ ES-INTRO (sin sonido; Saltar/Comparar/Explorar/Sonido)
        │                                          └─ sí ─▶ gateway o plan elegido (sin promoción)
        ▼
ES-INTRO ─▶ elegir plan (panel HTML + checklist + cupos + CTA único «Quiero este plan») ─▶ solicitar propuesta
        └─▶ Comparar (hasta 2 planes) ─▶ Configurador (base + módulos, A cotizar) ─▶ resumen ─▶ propuesta
        └─▶ Explorar ─▶ gateway: Ver con guía · Branding · Intelligence · Academy (demo pública, rotulada)
```

| Flujo | Entrada | Acción | Salida | Error | Vacío | Recuperación |
|---|---|---|---|---|---|---|
| **Primera visita** | `/estateos/` tras el reveal | ver o saltar | gateway + preferencia local guardada | autoplay bloqueado | sin storage | poster + «Reproducir»; sin storage no bloquea |
| **Revisita** | misma ruta | «Repetir presentación» opcional | gateway directo | — | — | — |
| **Enlace directo** | `?plan=growth` o `?area=…` | — (omite video) | panel del plan / área | plan inexistente | — | limpiar parámetro y enfocar el título (patrón de 1.3) |
| **Suscriptor activo** | cuenta válida + suscripción activa **(S1)** | entra a su portal privado | Academy habilitada **desde el servidor** | cuenta sin suscripción activa | sin cursos publicados | mensaje claro; historial intacto; no basta ocultar botones |
| **Error de reproducción** | video denegado/sin red | — | poster + transcript + lista de capítulos | red lenta | — | «Reintentar»; la página sigue usable |
| **Permisos** | propietario abre inmueble ajeno / tenant ajeno | — | **403** | — | — | volver a lo propio |
| **Cuota** | 80 % / 100 % | aviso / pausa del consumible | aviso interno | webhook duplicado no duplica consumo | — | reponer cuota al renovar; datos siguen disponibles |
| **Pago** | pago confirmado por webhook verificado | habilita | suscripción activa | pago no confirmado ≠ pagado | — | reclamo; plazo de gracia a definir |

**Distinción:** el *portal privado del cliente EstateOS* (Academy, su cuenta) **no es** el *portal operativo privado de Eclipse* (`Eclipse-internal-portal`: solicitudes, proyectos, cobros, prospectos). Mi Eclipse/Academy/Media/Equipamiento (V4) es el portal cliente de Eclipse; el CRM EstateOS lo opera el equipo inmobiliario con sus roles.

## 11. Brechas de entrega (anexo C) y SDD posteriores

| Entrega | Contenido | Estado | Notas |
|---|---|---|---|
| **S0** · catálogo y demo pública | video con capítulos, comparador/configurador sin checkout, Lumen reutilizado, Academy e Intelligence de muestra rotuladas | **especificada aquí** (2.3); se construye en 3.5/3.9 | No requiere esperar consorcios |
| **S1** · núcleo operativo | aislamiento multiempresa, cuentas/roles, propiedades/web, chats, derechos de suscripción, WhatsApp real | **sin empezar** | SDD propio contra el backend; no es un refactor visual de 3.6; Academy privada solo con esto |
| **S2** · Growth/producción/voz | cartografía licenciada, consulta agregada, contenidos y cuotas medidos, Academy privada, pipeline Studio, llamadas | **sin empezar** | cada integración por separado y con QA |
| **S3** · propietario + Intelligence | rendiciones/ROI, cobros y conciliación, análisis, chatbot del CRM | **sin empezar** | el panel del propietario es **comercialmente Growth**, aunque se construya en S3 |
| **S4** · administración | consorcios/unidades, expensas, recibos, reclamos, correo, marca blanca | **sin empezar** | producto nuevo; no se promete completo por subir de 150 a 200 |

Cada S es un paquete futuro, **no un lote autorizado**; al activarlo se divide en SDD pequeños de 16 secciones, uno por vez. Límites de contenido que se mantienen: sin base penal privada, sin ranking vecinal, sin decisión automática de vivienda; informes crediticios solo por proveedor y flujo lícitos; propietarios solo ven lo propio.

## 12. Cuestiones abiertas y decisiones para Ignacio

| # | Decisión | Recomendación |
|---|---|---|
| **D19** | **Puesta en marcha de EstateOS**: la referencia «adaptación desde USD 500» ya no existe (2.2b). ¿Cómo se cotiza? | A cotizar por alcance, con un rango **interno** de referencia que no se publica; medir horas reales en el primer cliente. |
| **D20** | ¿**Contact incluye el chat guiado del sitio** (el «Lumi» del demo, guionado, sin IA ni WhatsApp)? El prompt lo menciona, el anexo A no. | Sí, el chat **guiado**; el asistente con IA sobre datos queda en Deluxe. |
| **D21** | **Horas humanas de soporte por plan** y cupos de Growth/Escalar (§6.5). | Contact sin horas incluidas; Growth con tour cada dos meses hasta medir; cupos marcados «sujetos a validación». |
| **D22** | **Datos para cerrar la economía**: costo horario interno, comisión de cobro, impuestos, y poder abrir los tres hosts de tarifas (red del entorno). | Me pasás los números o habilitás los dominios; con eso calculo el margen real. |
| **D23** | **Campaña = dos formatos (16:9 y 9:16, un concepto)**; dos conceptos consumen dos campañas. | Aceptar. |

Además queda **abierto, sin decisión tuya requerida ahora:** tarifas validadas de WhatsApp/ElevenLabs/Higgsfield (G2), derechos de Suno/ElevenLabs (G3), revisión jurídica de la Ley 25.326 y de Compliance (G6), proveedor de pagos, modalidad anual y compra de producto (sin precio).

## 13. Criterios de aceptación (§12 del prompt)

| Criterio | Estado | Dónde |
|---|---|---|
| Exactamente los seis precios; Partner y cuotas = propuesta | **Cumplido** | §3.1, §4.1; prueba del JSON |
| USD 50 solo como antecedente sustituido; tarifario general separado | **Cumplido** | §2 (C6, C7); JSON `historical` y `scope` |
| Cada plan con lista completa, setup, cuotas, extras, mantenimiento y disponibilidad verificable | **Cumplido** (mantenimiento/soporte: sin decidir, D21) | §3, §4, §7, §8 |
| Contact: criterio original (chat en dos relaciones + kit) | **Reinterpretado por la corrección del 26/10**: web + CRM completo; kit = puesta en marcha; chat = D20 | §2 (C1) |
| Growth 75 con panel del propietario, Academy, mapas, 1 tour, recreación; heredado | **Cumplido como objetivo** | §3 |
| Escalar con cupo finito de tours, campaña 2 × 15 s y minutos medidos | **Cumplido como propuesta** | §4 |
| Panel/ROI/cobros comercialmente en Growth; Hípergrowth añade Intelligence con gate | **Cumplido** | §3, §11 |
| Deluxe con chatbot; Partner lo hereda; administración, sedes, marca blanca, correo sin «ilimitado» | **Cumplido** | §3, §4 |
| Primera visita con video con capítulos; saltar/comparar/explorar desde el inicio; enlace directo no lo impone | **Especificado** (no producido) | §9 |
| Un mismo dato versionado alimenta precio, comparador, configurador y texto sincronizado | **Especificado** (versión + digest) | §3, §9.3 |
| Datos ficticios, mapa, IA y estados futuros rotulados; sin ranking vecinal ni base penal ni decisión de vivienda | **Cumplido** | §8, §11 |
| Matriz económica sin costos fabricados; registro de brechas; secuencia de entrega | **Cumplido** | §5, §6, §11 |
| Sin gastos, implementación ni publicaciones | **Cumplido** | USD 0; solo documento, JSON y una prueba |

## 14. No ejecutado, límites y rollback

- **No ejecutado:** generación de medios, voz o música; cotización con tarifas validadas; revisión jurídica; build ni e2e (no se tocó código de producto); capturas (no hay UI nueva).
- **Evidencia:** `npx vitest run` (suite completa) y `tests/estateos-catalog.test.ts` (10 pruebas sobre el JSON); `npx tsc --noEmit`, `npx eslint` de los archivos nuevos.
- **Rollback:** borrar `docs/v3/estateos/`, `tests/estateos-catalog.test.ts` y este documento; no hay migraciones ni datos externos. El catálogo no está conectado a ningún componente.

## 15. Handoff

Habilita **2.4 · Packs inmobiliarios** (catálogo de seis packs con brief, insumos, presupuesto y gates: debe partir de las unidades de §4.2 y de la regla «no cobrar dos veces lo ya incluido») y **2.5**; actualiza las entradas de **3.1** (dirección cinematográfica: usar el guion de §9.2 corregido y el ritmo medido), **3.5** (gateway + comparador), **3.8** (Intelligence/mapas honestos) y **3.9** (gate comercial: el gate de contribución de §6 debe pasar antes de ofertar cupos). **El repositorio `roofy` se crea al empezar la Fase 3 (lote 1.6): hoy no hay nada que migrar.** No autoriza ejecutar ninguno de ellos.
