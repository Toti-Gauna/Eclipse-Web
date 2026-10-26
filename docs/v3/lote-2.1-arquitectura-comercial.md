# Lote 2.1 · Arquitectura comercial

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `b9391bb`, merge del PR #20) · **Resultado:** **documental**. No se tocó código de producto, contenido (`/content`) ni mensajes; no se publicó nada. Gasto externo: USD 0.
**Fuentes leídas:** Notion «Lote 2.1 · Arquitectura comercial» (incluye la matriz comercial propuesta) y «Ofertas y precios» (tarifario, actualización del 16/10 y catálogo sectorial del 24/10); `content/{items,plans,maintenance,addons,lines,verticals,units,legacy,offers}.json`; `lib/pricing.ts` (`maintenanceSuggestion`); `messages/es.json` (`services`, `pyme`); `docs/v3/{auditoria-0.1,lote-1.1,lote-1.2,lote-1.5,ledger-financiero}`.
**No leído en este lote:** la página de «Contexto Eclipse» y la de 2.3 (EstateOS · planes y bienvenida) completas: 2.3 es el siguiente consumidor y se lee en su lote; aquí solo se cuida no mezclar su catálogo con el general.

## 0. Informe en tres líneas

- **Qué cambió:** queda escrito el **modelo de oferta** (necesidad → línea → capacidad demostrable → setup / mensualidad / extra → fuente y estado) con **tres ejes que no se mezclan** (industria · línea comercial · acceso de demo), la **matriz de las 20 piezas vigentes contra las cinco líneas** (cada pieza con **una sola línea principal y una sola partida**, generada desde `items.json` para que ningún precio se copie a mano), las **cinco líneas** con su frase, problema, ejemplos para inmobiliaria / restaurante / ecommerce y exclusiones, las **tres necesidades PyME** como orientación (no planes), el **contrato de los packs integrales**, el mapa a home / gateway / configurador y el **copy propuesto** (es). Ningún precio, id ni contrato cambia.
- **Qué quedó abierto:** Academy y Equipamiento **no tienen piezas ni precio publicado** (se muestran «a cotizar»); las prestaciones nuevas por plan (Studio/Academy en 30/75/150, nivel 199) y los cupos siguen siendo **propuesta** hasta 2.2; hay **tres choques de nombres** a resolver (§9); la capacidad «demostrable» está leída del código (E1), no vuelta a ejecutar pieza por pieza.
- **Qué necesita el OK de Ignacio:** las cuatro decisiones **D12–D15** (§12) y la confirmación de que **1.6 pasa a ejecutarse al empezar la Fase 3** (ya aplicado en la matriz según tu mensaje). Habilita **2.2** (precios y catálogo) y **2.3** (EstateOS).

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Rama y HEAD | `claude/eclipse-v3-inventory-audit-2ukttn` reiniciada sobre `main` = `b9391bb`; `git status` limpio |
| Qué se corrió | solo lecturas y un script que arma la tabla de §4 desde `content/items.json` (sin escribir en `/content`) |
| Piezas vigentes | 20 (`items.json`) en 6 familias; 2 ofertas (`plans.json`: `adaptacion` 500 y `pack` 700); 3 planes mensuales (`maintenance.json`: 30 / 75 / 150, terceros 5 / 15 / 40 dentro del precio, 2 h mensuales en total); 4 ofertas históricas inactivas (`offers.json`) |
| Líneas hoy en código | `content/lines.json` (lote 1.2): `saas`, `agency`, `studio` (`catalog`), `academy`, `equipment` (`quote`), con ejemplos mínimos y tres `needs` |

## 2. Modelo de oferta

```text
necesidad ─▶ línea(s) ─▶ capacidad demostrable ─▶ setup · mensualidad · extra ─▶ fuente y estado
 (cliente)    (qué se       (qué se puede ver         (los importes viven SOLO     (aprobado · propuesto ·
               compra)       hoy y dónde)              en items/plans/maintenance)  a cotizar · a validar)
```

**Regla de oro: el precio pertenece a la pieza (o al plan), nunca a la línea.** Las líneas son una forma de ordenar y explicar; no son catálogos ni cuentas de cobro. Una pieza puede mostrarse en más de una línea, pero tiene **una línea principal** (la que la presenta primero) y **una sola partida** al facturarla. Esto cumple «no crear cinco catálogos» y «una sola partida cobrada».

### 2.1 Tres ejes que no se mezclan

| Eje | Responde | Valores | Dónde vive |
|---|---|---|---|
| **Industria** | ¿para qué negocio? | Inmobiliarias (piloto), Restaurantes (siguen), Ecommerce (después) | `content/verticals.json`, selector, gateway |
| **Línea comercial** | ¿qué se compra? | SaaS · Agency · Studio · Academy · Equipamiento; **Intelligence** aporta medición en todas | `content/lines.json` + mensajes |
| **Acceso de demo** | ¿cómo se muestra? | «Ver con guía» · «Branding» · «Intelligence» · «Academy» (gateway de EstateOS) | sitio de EstateOS (Fase 3/4) |

Las cinco líneas sirven a **cualquier industria**. Los accesos de demo **no son unidades comerciales**: «Branding» es *cómo se ve* Studio dentro de EstateOS, no un producto aparte; «Academy» e «Intelligence» del gateway muestran la línea y la capa transversal con el ejemplo de inmobiliarias. Tabla de equivalencia:

| Acceso del gateway | Línea comercial que muestra | Qué NO es |
|---|---|---|
| Ver con guía | SaaS (el producto funcionando) | un servicio vendible |
| Branding | Studio | una línea nueva ni una pieza con precio propio |
| Intelligence | Intelligence (transversal) | una sexta línea |
| Academy | Academy | un curso acreditado |

### 2.2 Estados (se usan en la matriz y en el copy)

| Estado | Significa | Se muestra como |
|---|---|---|
| **aprobado** | importe aprobado por Ignacio (tarifario, 16/10/2026) y presente en `/content` | precio publicado |
| **a validar** | aprobado, pero depende de proveedor, factibilidad o metodología antes de contratar | precio + «sujeto a validación» (como hoy en `validate`) |
| **propuesto** | idea o importe de Ignacio/Notion que **no** está en `/content` | **no se publica**; se nombra solo en documentos internos |
| **a cotizar** | no hay precio público | «A cotizar», con WhatsApp; sin importes ni rangos |
| **demostrada / solo descrita** | si hay algo que se pueda ver hoy | «Probalo en la demo» o descripción sin demo |

## 3. Las cinco líneas

Una frase en la superficie y el detalle bajo demanda (acordeón o «Ver más»), como pide 06. **Intelligence no es línea.** Academy y Equipamiento tienen **el mismo nivel conceptual** que las otras tres aunque su disponibilidad sea «a cotizar».

| | **SaaS** | **Agency** | **Studio** | **Academy** | **Equipamiento** |
|---|---|---|---|---|---|
| **Qué es** (una frase) | Software listo para usar, con tu marca. | Integramos y desarrollamos lo que tu negocio necesita. | Piezas de marca, web y video hechas por profesionales. | Tu equipo aprende a usar lo que le entregamos. | El equipo físico que tu negocio necesita, instalado. |
| **Problema que resuelve** | Tu equipo sigue con planillas y mensajes sueltos. | Tus herramientas no se hablan, o te falta una pieza que no existe hecha. | Tu marca no se ve a la altura de lo que vendés. | El sistema existe, pero no se usa. | Falta la pantalla, el lector o la impresora para que funcione en el local. |
| **Qué se compra** | La adaptación de un producto existente + su plan mensual; módulos de gestión. | Integraciones estándar, asistentes y agentes, primera fase de una app a medida. | Landing, web multipágina, trailer, SEO técnico. | Guías, inducción y revisión de uso. | Hardware **por pedido**, con instalación. |
| **Disponibilidad** | catálogo (7 piezas + 2 ofertas) | catálogo (4 piezas) | catálogo (4 piezas) | **a cotizar** | **a cotizar** |
| **Inmobiliaria** | Consultas, pipeline, visitas y seguimientos en un solo lugar. | Asistente que califica consultas y las pasa al pipeline; WhatsApp. | Landing por desarrollo; trailer de un proyecto. | Inducción del equipo comercial al sistema. | Pantalla de vidriera con las propiedades (ilustrativo). |
| **Restaurante** | Pedidos y reservas en un solo lugar. | Agente de voz que toma pedidos y deriva a una persona. | Web con la carta y reservas. | Capacitación del salón y la cocina en pedidos. | Tablet e impresora de comandas (ilustrativo). |
| **Ecommerce** | Catálogo y consultas; pedidos del negocio. | WhatsApp que responde por producto; segunda fase de la tienda. | Landing de lanzamiento. | Guía para cargar y mantener productos. | Lector y etiquetadora para depósito (ilustrativo). |
| **Exclusiones** | No es desarrollo nuevo (eso es Agency). Módulos de hasta 3 usuarios. | Sin pentest ni certificaciones; proveedor y consumos aparte; la app es una **primera fase**, no un marketplace. | Sin filmación ni modelado original; trailer de hasta 15 s; identidad completa, campañas y premios **fuera**. | Sin certificaciones ni cursos acreditados; lo que ya incluye «Entrega y capacitación» del proyecto no se cobra dos veces. | **Sin stock** especulativo ni catálogo de hardware comprado; cada equipo se cotiza. |
| **Se cobra como** | setup + **un** plan mensual | setup + **un** plan mensual | setup (el plan lo hereda del sitio si acompaña uno) | a cotizar | a cotizar |

> Los **ejemplos de Equipamiento son ilustrativos**: Eclipse hoy no tiene catálogo, proveedor ni instalación definidos. No se publican como oferta; se nombran solo como «a cotizar».

**Intelligence (transversal).** «Medís lo que pasa para decidir con datos.» Aporta en cada línea: números del día (SaaS), qué asistente resolvió qué (Agency), qué pieza trae consultas (Studio), quién terminó la guía (Academy), qué equipo se usa (Equipamiento). Sus piezas con precio son diagnósticos puntuales (§4). **No** promete mapas con demanda real, ROI ni informes automáticos: eso son módulos futuros de EstateOS (2.3/3.8).

## 4. Las 20 piezas contra las cinco líneas (E1)

Generada desde `content/items.json` por script (ids, familias, importes y complementos son los del archivo). La columna «Mensualidad» reproduce `maintenanceSuggestion` de `lib/pricing.ts` (chatbot y voz → Automatización e IA; WhatsApp estándar → Conectado; cualquier otro producto construido → Esencial; servicios puntuales → ninguna): **un solo plan por proyecto, nunca suma**. «Capacidad demostrable» dice qué se puede ver **hoy** y dónde (E1: leído del código y de la auditoría 0.1, no re-ejecutado pieza por pieza).

| Pieza (id) | Familia actual | Línea principal | También se muestra en | Setup «desde» | Complemento | Mensualidad que sugiere `lib/pricing.ts` | Capacidad demostrable (E1) | Estado |
|---|---|---|---|---|---|---|---|---|
| Landing premium con motion graphics (`landing`) | Web y marca | **Studio** | — | USD 500 | USD 200 | Esencial | Lumen · vista «Sitio web» (sitio público del comprador); no prueba el motion premium de una landing a medida | aprobado |
| Web multipágina (`web-multi`) | Web y marca | **Studio** | — | USD 500 | USD 150 | Esencial | Lumen · «Sitio web» (una vista): **no demuestra multipágina** | aprobado |
| SEO técnico básico + analytics (`seo`) | Web y marca | **Studio** | Intelligence | USD 500 | USD 100 | Esencial | solo descrita: una demo no puede probar posicionamiento ni medición | aprobado |
| Trailer en motion graphics (`trailer`) | Web y marca | **Studio** | — | USD 500 | USD 100 | ninguna (pieza puntual) | trailers de 15 s de las demos (el de Lumen está en «Demos») | aprobado |
| Turnos administrativos (`turnos`) | Gestión y operación | **SaaS** | — | USD 750 | USD 250 | Esencial | Lumen · «Visitas» (agenda de visitas); demos ocultas: clínica (turnos), restaurante (reservas) | aprobado |
| Sistema de pedidos (`pedidos`) | Gestión y operación | **SaaS** | — | USD 750 | USD 250 | Esencial | solo en demos ocultas: restaurante (QR + cocina) y tienda (checkout) | aprobado |
| WhatsApp estándar (sin IA) (`whatsapp`) | Gestión y operación | **Agency** | SaaS | USD 500 | USD 100 | Conectado | Lumen · «Consultas» (WhatsApp simulado, 24/7) | aprobado |
| Dashboard interno (`dashboard`) | Gestión y operación | **SaaS** | Intelligence | USD 750 | USD 250 | Esencial | Lumen · «Hoy» (parcial: números del día, no un tablero configurable) | aprobado |
| CRM y documentación básica (`crm`) | Gestión y operación | **SaaS** | — | USD 750 | USD 250 | Esencial | Lumen · «Pipeline» y «Seguimientos» | aprobado |
| Gamificación y misiones (`gamificacion`) | Gestión y operación | **SaaS** | — | USD 500 | USD 150 | Esencial (incluida en la adaptación) | solo en la demo oculta de gimnasio (rachas, misiones, ranking) | aprobado |
| Migración de Excel/PDF (`migracion`) | Gestión y operación | **SaaS** | Agency | USD 100–USD 300 tras revisar | — | ninguna (única vez) | solo descrita; se revisa una muestra antes de cotizar | aprobado · rango tras revisión |
| Catálogo y consultas (`catalogo`) | Venta online | **SaaS** | — | USD 500 | — | Esencial | Lumen · «Propiedades» (catálogo con fichas); tienda oculta: catálogo → producto → carrito | aprobado |
| App on-demand: primera fase (`app-fase`) | Apps a medida | **Agency** | — | USD 1.000 | — | Esencial | solo descrita (no hay demo de app a medida visible) | aprobado |
| Chatbot IA (WhatsApp o web) (`chatbot`) | IA y agentes | **Agency** | — | USD 750 | USD 250 | Automatización e IA | Lumen · chat que califica consultas (simulación: el proveedor real se valida por cuenta) | aprobado · a validar |
| Agente de voz con IA (`voz`) | IA y agentes | **Agency** | — | USD 750 | USD 250 | Automatización e IA | solo en demos ocultas: clínica, restaurante y academia (simulación) | aprobado · a validar |
| Asesoría growth, marketing y marca (`asesoria-growth`) | Estrategia y crecimiento | **Intelligence** | Studio | USD 150 | USD 150 | ninguna (puntual) | servicio humano, sin demo | aprobado |
| Asesoría de gestión económica (`asesoria-economica`) | Estrategia y crecimiento | **Intelligence** | — | USD 150 | USD 150 | ninguna (puntual) | servicio humano, sin demo; **exige metodología y responsable** | aprobado · a validar |
| Las dos asesorías (`asesorias`) | Estrategia y crecimiento | **Intelligence** | — | USD 250 | USD 250 | ninguna (puntual) | las dos anteriores en una sola partida | aprobado · a validar |
| Estudio de mercado (`marketing`) | Estrategia y crecimiento | **Intelligence** | Studio | USD 500 | USD 150 | ninguna (puntual) | servicio, sin demo | aprobado |
| Auditoría digital (`auditoria`) | Estrategia y crecimiento | **Intelligence** | Agency | USD 500 | USD 100 | ninguna (puntual) | servicio, sin demo; sin pentest ni certificaciones | aprobado |

**Cómo se lee:** «Línea principal» es dónde se presenta primero; «También se muestra en» es solo visibilidad (sin segundo precio). Cada pieza conserva su **id**, su familia de `items.json` (las seis familias técnicas siguen siendo la vista plegada de «Qué ofrecemos»), su precio y su estado.

**Recuento por línea principal:** SaaS 7 · Agency 4 · Studio 4 · Intelligence (transversal) 5 · Academy 0 · Equipamiento 0. Por eso Academy y Equipamiento se muestran «a cotizar».

**Ofertas (`plans.json`) y planes (`maintenance.json`):**

| Id | Línea | Contenido | Estado |
|---|---|---|---|
| `adaptacion` · USD 500 | SaaS | adaptación del producto existente; **ya incluye gamificación estándar y SEO técnico** (no se cobran dos veces) | aprobado |
| `pack` · USD 700 | SaaS + Studio + Intelligence | adaptación + landing adicional + las dos asesorías + 3 meses de plan bonificado (`careCredit`) | aprobado · a validar |
| `esencial` · 30 / mes | SaaS (uso) | mantenimiento, alojamiento y datos básicos, gamificación estándar, mejoras pequeñas; terceros ≤ USD 5 | aprobado |
| `conectado` · 75 / mes | Agency (integración) | Esencial + **una** integración estándar con un flujo definido; terceros ≤ USD 15 | aprobado |
| `ia` · 150 / mes | Agency (flujos) | Conectado + hasta 2 flujos estándar en total, uno puede usar IA con derivación a una persona; terceros ≤ USD 40 | aprobado |

Todos los planes incluyen **hasta 2 h mensuales totales, no acumulables** (mantenimiento, configuración y mejoras). Aviso al 80 % del cupo, sin sobrecargos automáticos.

## 5. Matriz necesidad → línea → capacidad → importes → fuente

Las siete necesidades salen de los «objetivos» del armador dormido (inventario v2) y se agrupan en las tres orientaciones PyME de la home. Los importes **no se repiten acá**: se remite a la pieza (§4).

| Necesidad (cómo la dice el cliente) | Línea(s) | Piezas (ids) | Capacidad demostrable hoy | Mensualidad | Fuente · estado |
|---|---|---|---|---|---|
| **Que me encuentren** | Studio (+ Intelligence) | `landing`, `web-multi`, `seo` | Lumen «Sitio web» (parcial); SEO solo descrita | Esencial | tarifario 16/10 · aprobado |
| **Atender 24/7** | Agency | `whatsapp`, `chatbot`, `voz` | Lumen «Consultas» (chat y WhatsApp simulados); voz solo en demos ocultas | Conectado / Automatización e IA | tarifario 16/10 · aprobado, IA a validar |
| **Ordenar turnos y pedidos** | SaaS (+ Intelligence) | `turnos`, `pedidos`, `crm`, `dashboard`, `migracion` | Lumen «Visitas», «Pipeline», «Hoy»; pedidos solo en demos ocultas | Esencial | tarifario 16/10 · aprobado |
| **Vender online** | SaaS + Agency | `catalogo`, `pedidos`, `whatsapp`, `app-fase` | Lumen «Propiedades» (catálogo); tienda en demo oculta | Esencial / Conectado | «Ecommerce conectado» desde 750 con un módulo validado y 1.000 con dos módulos y una integración (nota del tarifario) · aprobado |
| **Fidelizar clientes** | SaaS (+ Studio) | `gamificacion` (ya incluida en la adaptación), `trailer`, `landing` | solo en la demo oculta de gimnasio | Esencial | tarifario 16/10 · aprobado |
| **Una app propia** | Agency | `app-fase` | solo descrita | Esencial | tarifario 14/10 · aprobado (primera fase, no marketplace) |
| **No sé: quiero un diagnóstico** | Intelligence (+ Agency) | `auditoria`, `marketing`, `asesorias` | servicio humano, sin demo | ninguna | tarifario 16/10 · aprobado; asesoría económica a validar |

### 5.1 Tres orientaciones PyME (no son planes ni cobran)

Ya están en `content/lines.json` (`needs`) y en la home («Para tu PyME»). Esta matriz las **confirma** y las ata a las necesidades:

| Orientación | Cubre estas necesidades | Líneas | Piezas de ejemplo | Regla |
|---|---|---|---|---|
| **Empezar** | Que me encuentren · Atender 24/7 | SaaS · Studio | `landing`, `whatsapp` | sin precio propio |
| **Ordenar** | Ordenar turnos y pedidos · Vender online | SaaS · Agency | `turnos`, `pedidos`, `crm` | sin precio propio |
| **Crecer** | Fidelizar · Diagnóstico · capacitar al equipo | Studio · SaaS · Academy | `gamificacion`, `trailer`, `auditoria` | sin precio propio |

Son **orientación**: no crean un plan cobrable, no suman un total, y el copy lo dice («No son planes: son por dónde empezar»).

## 6. Packs integrales (contrato)

Un **pack integral** es una **composición de alcances existentes con partidas visibles**; nunca un precio nuevo escondido ni una pieza inventada.

1. **Cada partida se nombra**, con su origen en `items.json` / `plans.json` y su importe tal como está publicado. Ejemplo del pack vigente (`pack`, USD 700): *Adaptación de tu producto* (incluye gamificación estándar y SEO técnico) · *Landing premium adicional* · *Las dos asesorías* · *3 meses de plan mensual bonificado*.
2. **Se separan «incluido» y «extra».** Lo que el pack ya cubre aparece como «Incluido»; sobre el pack, cada extra va **a su precio de complemento** y se cobra una sola vez. La gamificación estándar existente **no se cobra dos veces** (ya lo evita `plans.json` con `items`).
3. **La web no muestra ahorro ni «antes $X»** (regla de honestidad de CLAUDE.md). La aritmética interna del pack (adaptación 500 + landing complemento 200 + dos asesorías 250 = 950 frente a 700) queda **solo** en documentos internos.
4. **Un solo plan mensual** por proyecto; el pack bonifica **solo Esencial** (USD 0, o Conectado a 45 y Automatización e IA a 120 durante los 3 meses) y desde el mes 4 rigen 30 / 75 / 150.
5. **Un total por encima de USD 1.000** sale del esquema de paquete: se muestra revisión de alcance y fases con costo total explícito (nota del tarifario).
6. **Packs nuevos** (los seis inmobiliarios de 2.4, etc.) **no se crean acá**: necesitan precio aprobado por Ignacio y viven como composición según estas reglas. Ningún importe nuevo se aprueba en 2.1.

## 7. Servicios a medida y seguridad

- **A medida** (app más allá de la primera fase, integraciones no estándar): se presenta como **«a cotizar»**, con estimación y calendario; no se promete ilimitado ni «sistema completo al precio de su primera fase».
- **Seguridad:** la única pieza publicada es la **auditoría digital** (un sitio y un recorrido, diagnóstico y prioridades). **No hay** pentest, compliance certificado ni remediación ilimitada; no se afirman credenciales ni certificaciones que Eclipse no tiene. Los rangos del catálogo v2 (seguridad 3.000–10.000, DevSecOps, compliance, evaluación de IA) son **históricos**, de un tarifario sustituido: **no se publican**.
- **Dominio, APIs, voz, mensajes, LLM, infraestructura y pauta** se identifican aparte, nunca dentro del precio salvo inclusión expresa validada.

## 8. Mapa de contenido (a dónde va cada cosa)

| Destino | Qué muestra de este modelo | Estado hoy |
|---|---|---|
| **Home · «Qué ofrecemos»** (`#servicios`) | las cinco líneas (una frase), la fila Intelligence y, plegadas, las seis familias y las 20 piezas | existe (lote 1.2); el copy se afina con §10 en el lote que implemente |
| **Home · «Para tu PyME»** (`#pyme`) | las tres orientaciones (§5.1) | existe |
| **Precios** (`#precios`) | piezas y planes con sus importes (2.2 los concilia) | existe; no cambia en 2.1 |
| **Selector** (1.3) | industria (Inmobiliarias, Ecommerce «Próximamente») | existe |
| **Gateway de EstateOS** (Fase 3/4) | accesos «Ver con guía / Branding / Intelligence / Academy» según la equivalencia de §2.1 | no existe; sitio propio (D11) |
| **Configurador** | dormido (D2); a futuro, pago con link | dormido |
| **Portal / solicitudes** | ids históricos conservados en `content/legacy.json` | sin cambios |

**Estados de capacidad que se pueden mostrar sin mentir:** *demostrada* (hay algo visible hoy), *solo descrita* (sin demo), *próximamente* y *a cotizar*. Un módulo de propietario, voz comercial, pagos, informes o consorcios se muestra como **hoja de ruta**, nunca como disponible (2.3/4.1 lo fijan).

### 8.1 Cambios que este modelo pide a futuro (propuesta, **no implementada**)

Cuando se implemente (un lote de código, no este):
- `content/lines.json`: agregar por línea la lista de ids de pieza **en referencia** (many-to-many) y `primary` para el caso de «línea principal»; **sin importes**. Los ejemplos por industria irían en mensajes (`offerings.lines.<id>`), no en componentes.
- Ningún cambio en `items.json`, `plans.json` ni `maintenance.json`; el mapeo many-to-many **no exige migración del backend** (el catálogo del BE sigue indexado por id de pieza).
- La tabla de §4 pasa a ser un **test** (cada id de `items.json` tiene exactamente una línea principal) para que el catálogo y las líneas no se desincronicen.

## 9. Choques de nombres y de datos hallados

| # | Hallazgo | Riesgo | Propuesta |
|---|---|---|---|
| H1 | `content/units.json` define las **unidades** «Eclipse Agency / Media / Market» (el pie de la web las muestra como «Próximamente») y ahora existe la **línea** «Agency» | el visitante puede leer que «Agency» es una de varias empresas; el tarifario dice «Eclipse es una empresa» con cinco líneas | **D15**: retirar o renombrar las unidades en el lote de copy (2.2) |
| H2 | El gateway de EstateOS llama «Branding» a un acceso; la línea comercial es **Studio** | dos nombres para lo mismo | **D13**: tabla de equivalencia de §2.1; «Branding» solo es el nombre del acceso |
| H3 | El **complemento de la landing** figura en 50 en la tabla del 14/10 y en **200** en la actualización del 16/10 y en `items.json` | confundir el importe vigente | rige **200** (16/10 prevalece y es lo que está en `/content`); 2.2 lo deja asentado |
| H4 | El ítem de catálogo «Automatizaciones» (500 / complemento 100 del 14/10) **se retiró**: hoy la automatización existe como **prestación de los planes** Conectado y Automatización e IA (`legacy.json`) | no hay pieza suelta «automatización» que vender | no volver a crearla en 2.1; 2.2 decide si hace falta una |
| H5 | Los niveles nuevos (**199**, y las prestaciones Studio/Academy dentro de 30/75/150) son **propuesta** en Notion y **no están en `/content`** | publicar algo no aprobado | siguen sin publicarse hasta 2.2 (aprobación + costo medido) |
| H6 | `items.json` tiene dos asesorías sueltas y su combo `asesorias`; el pack ya usa el combo | sumar las dos más el combo | regla de §6.2 y del tarifario: nunca las tres a la vez; el configurador futuro lo respeta |

## 10. Copy propuesto (es, rioplatense; en/pt cuando se implemente)

Tono: corto, concreto, sin relleno. **No** se usa «soluciones», «innovador» ni promesas de disponibilidad inexistentes. Cada texto indica su fuente.

| Elemento | Texto propuesto | Fuente |
|---|---|---|
| Título de la sección | «Cinco líneas, un solo equipo.» *(se conserva el de 1.2)* | 1.2 aceptado |
| Subtítulo | «Software, contenido, formación y equipamiento, combinados según lo que necesitás. Servimos a cualquier rubro.» | 1.2 aceptado |
| SaaS | «Software listo para usar, con tu marca.» · detalle: «Sistemas que ya funcionan —turnos, pedidos, CRM, paneles— adaptados a tu negocio. Pagás la puesta en marcha una vez y un solo plan mensual.» | tarifario 16/10 |
| Agency | «Integramos y desarrollamos lo que tu negocio necesita.» · detalle: «Conectamos tus herramientas y armamos asistentes y agentes. Si te falta una pieza que no existe hecha, la desarrollamos por fases.» | tarifario 16/10 |
| Studio | «Piezas de marca, web y video hechas por profesionales.» · detalle: «Landing, web, trailer de hasta 15 s y SEO técnico. La identidad completa y las campañas se cotizan aparte.» | tarifario 14 y 16/10 |
| Academy | «Tu equipo aprende a usar lo que le entregamos.» · detalle: «Guías, inducción y revisión de uso. Se cotiza según tu equipo.» + estado **A cotizar** | 2.1 (matriz propuesta) |
| Equipamiento | «El equipo físico que tu negocio necesita, instalado.» · detalle: «Por pedido, sin stock: cotizamos lo que tu local necesita.» + estado **A cotizar** | 2.1 (matriz propuesta) |
| Intelligence | «Medís lo que pasa para decidir con datos.» *(se conserva)* | 1.2 aceptado |
| Estado «a cotizar» | «A cotizar. Escribinos y te lo armamos.» | regla de honestidad |
| Pie de la matriz de piezas | «Un solo plan mensual por proyecto. Dominio, voz, mensajes y otros consumos externos se detallan aparte.» | tarifario 16/10 |
| Pack (partidas) | «Adaptación de tu producto · Landing premium · Las dos asesorías · 3 meses de plan bonificado.» (sin cifra de ahorro) | tarifario 16/10 |

**Pendiente de copy (no se escribió porque depende de decisiones de §12):** el texto de Academy y Equipamiento dentro de los planes mensuales (propuesta), el nombre del acceso «Branding» en el gateway, y el pie con las unidades.

## 11. Criterios de aceptación (Notion §12)

| Criterio | Estado | Evidencia |
|---|---|---|
| Cinco líneas nombradas y disponibles para cualquier industria | **Cumple** | §3 (ejemplos para inmobiliaria, restaurante y ecommerce); `lines.json` ya tiene las cinco |
| Intelligence transversal y Roofy fuera | **Cumple** | §3 «Intelligence (transversal)»; Roofy no aparece como línea ni unidad (en este programa solo es el nombre técnico del repo de EstateOS, D11) |
| Cada servicio conserva id/estado y una sola partida cobrada | **Cumple** | §2 regla de oro; §4 (20 de 20 ids, una línea principal cada uno); verificación documental en §13 |
| Packs muestran incluidos y extras | **Cumple** | §6 y §4 (ofertas) |
| No se confunden modalidades gateway con unidades comerciales | **Cumple** | §2.1 (tres ejes y tabla de equivalencia) |
| Cada afirmación con evidencia o rotulada | **Cumple** | columnas «Capacidad demostrable» (E1) y «Estado»; lo no probado está en §14 |
| Sin gastos, publicaciones ni cambios de alcance implícitos | **Cumple** | USD 0; sin código ni `/content` tocados |
| Se preservó el contenido vigente y se documentó lo que lo sustituye | **Cumple** | ids y precios intactos; las únicas sustituciones son de **presentación** (§8.1, propuesta) |

## 12. Decisiones para Ignacio

| # | Pregunta | Recomendación |
|---|---|---|
| **D12** | Las piezas de diagnóstico y asesoría (`marketing`, `auditoria`, `asesoria-*`, `asesorias`) ¿se presentan como **Intelligence** (transversal, visibles dentro de cualquier línea) con una sola partida? | **Sí**: Intelligence no es línea, pero estas piezas son su cara comercial; se muestran bajo la línea que miden |
| **D13** | El acceso del gateway «Branding» ¿queda con ese nombre aunque la línea comercial sea **Studio**? | **Sí**: «Branding» es el nombre del acceso; en toda la web comercial se dice Studio |
| **D14** | **Academy** y **Equipamiento** ¿se publican **«a cotizar»**, sin precio ni rango y sin demo, al mismo nivel conceptual que las otras tres? | **Sí**, con WhatsApp como único paso; los ejemplos de Equipamiento no se publican como oferta |
| **D15** | Las **unidades** «Eclipse Agency / Media / Market» del pie ¿se retiran o se renombran para no chocar con la línea Agency? | **Retirarlas** del pie en el lote de copy de 2.2 (conservar `units.json` como histórico) |
| (aplicado) | **1.6 · Repo y subdominio EstateOS**: por tu mensaje, el repo `roofy` se crea **al llegar a la fase de EstateOS**; en la matriz de 0.4 el lote 1.6 pasa a ejecutarse **al empezar la Fase 3** (antes de 3.1) | confirmar el momento exacto cuando se llegue |

## 13. Verificación documental (script, ejecutado en este lote)

- **Cobertura de piezas:** 20 ids en `items.json`; 20 en la tabla de §4; **0 faltantes y 0 sobrantes**.
- **Una línea principal por pieza:** 20/20 (SaaS 7, Agency 4, Studio 4, Intelligence 5).
- **Importes:** la tabla se generó desde `items.json`; no hay importes escritos a mano en §4. Los importes de planes y ofertas de §4 se contrastaron con `plans.json` y `maintenance.json` (500, 700; 30/75/150; terceros 5/15/40).
- **Rutas citadas:** los archivos `content/*.json` y `lib/pricing.ts` existen en `b9391bb`.
- **Notion:** leídas «Lote 2.1» y «Ofertas y precios»; los enlaces del prompt a páginas no leídas (2.3, Contexto) se rotulan como no leídas (arriba).
- **No se ejecutó** ningún test de producto: este lote solo comprueba documentos y evidencia.

## 14. No ejecutado y límites

- La **capacidad demostrable** es lectura de código y de la auditoría 0.1 (E1); no se re-abrió cada demo pieza por pieza en este lote (el flujo de Lumen sí se abrió y cerró en 1.5, E2).
- **No** se validó proveedor, factibilidad ni costo de ninguna pieza (chatbot, voz, asesoría económica): siguen «a validar».
- **No** hay costo interno ni horas medidas: no se afirma rentabilidad de ningún plan (ledger 0.4).
- Los niveles nuevos y las prestaciones Studio/Academy por plan son **propuesta**; 2.2 las pone a prueba con costo.

## 15. Rollback

Documental: `git revert` del commit del lote deja el repositorio como estaba. No hay cambios de producto, de contenido ni de mensajes.

## 16. Handoff

- **2.2 · Precios y catálogo coherente** (Sonnet · high): concilia el catálogo, resuelve H3–H6, decide el pie de unidades (D15) y evalúa el nivel 199 con costo medido.
- **2.3 · EstateOS · planes y bienvenida**: usa §2.1 para no mezclar el catálogo sectorial (30 / 75 / 100 / 150 / 200; Partner 500 propuesto) con el general; sus inclusiones **no** se trasladan a contratos generales.
- Implementación de §8.1 (líneas many-to-many en `lines.json` y el test de §13): lote de código a definir tras 2.2.
