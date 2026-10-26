# Lote 2.4 · Packs inmobiliarios

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `medium` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `f9cfa44`, merge del PR #24) · **Resultado:** **documental**. No se tocó código de producto ni `/content`. Se agregaron el catálogo versionado de packs (`docs/v3/estateos/packs-inmobiliarios.v1.json`) y una prueba que lo vigila (`tests/packs-inmobiliarios.test.ts`). No se generó ningún medio, no se gastó, instaló ni publicó nada. Gasto externo: USD 0.

**Fuentes leídas:** Notion «Lote 2.4 · Packs inmobiliarios» (prompt 01–16); el catálogo y las unidades de 2.3 (`docs/v3/lote-2.3-estateos-planes-bienvenida.md`, `estateos/catalogo-estateos.v1.json`); el modelo de planes de 2.3b; código del demo de Lumen (`components/demos/real-estate/{data,facade}.ts*`).
**Límites:** no leí la biblia de 3.1 (el prompt la da como referencia, no como requisito); las tarifas de generación de video, voz y mensajería **no están validadas** (los hosts de tarifas no abren desde este entorno): los números de costo son supuestos o referencias secundarias, rotulados como tales. Los formatos de cada red social son de referencia y se revalidan al producir.

## 0. Informe en tres líneas

- **Qué cambió:** quedaron escritas **seis fichas de pack** (Panorama Inmobiliario, Video de Propiedad, Voz Comercial, Branding Inmobiliario, Kit de Redes, Presentación 2D) con brief, insumos, entregables, cantidades, revisiones, formatos, licencia, estado sintético, motores de costo, trabajo humano y exclusiones, en un catálogo versionado con digest y una prueba que lo vigila; un **modelo de presupuesto** (fórmula, supuestos, costo marginal vs. suscripción mínima); la **equivalencia de cada pack con los cupos de los planes** (qué consume un pack cuando el plan ya lo incluye, para no cobrar dos veces); la **regla de geometría del plano 2D** y la definición de los **cuatro canales** del kit de redes.
- **Qué quedó abierto:** **todo precio sigue «A cotizar»** (sin tarifas validadas ni gasto aprobado); el factor de intentos (supuesto 3) y las horas humanas por pack **se miden en el primer cliente**; hay tres solapamientos con lo ya definido (Panorama ↔ campaña, Branding ↔ puesta en marcha, Branding ↔ imágenes) que necesitan tu criterio; no se produjo nada.
- **Qué necesita el OK de Ignacio:** **D24–D26** (§11) y, como siempre, D19, D20, D21 y D23 del lote 2.3 (D22 diferida al primer cliente). Siguiente: **2.5 · Conversión y seguimiento** (Sonnet · medium).

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Rama y HEAD | `claude/eclipse-v3-inventory-audit-2ukttn` = `main` `f9cfa44`; `git status` limpio al empezar |
| Qué se corrió | lecturas; un script que genera el JSON de packs y su digest; cálculo de equivalencias y de costos ilustrativos; `tsc`, `eslint`, `vitest` |
| Estado del demo | Lumen usa **fachadas vectoriales** como «fotos» y un **plano ilustrativo** dibujado a mano (`facade.tsx` `FloorPlan`), no derivado de datos reales; las propiedades son ficticias |
| Gasto | USD 0 |

## 2. Principios y solapamientos resueltos

**Principios (del prompt):** cada pack es **opcional** (no se compra los seis para usar EstateOS); se compara por **resultado, insumos y entregables**; **ningún precio sin tarifa validada**; **una revisión consolidada por pieza**; costo de reintentos y de mano de obra incluidos en la cotización; presupuesto publicitario y gastos de terceros, explícitos y aparte; los textos, mapas y planos viven en HTML/SVG, nunca dentro de un video generado; sin material de propiedades ajenas.

| # | Solapamiento detectado | Resolución propuesta |
|---|---|---|
| S1 | **Panorama** (15–20 s, 16:9 + 9:16, un concepto) es casi lo mismo que una **campaña** de los planes (dos piezas de 15 s, 16:9 y 9:16, mismo concepto) | Panorama **consume una campaña** del cupo si dura hasta 15 s; de 16 a 20 s se cobra la diferencia («A cotizar»). Sin cupo, se cotiza completo. **D24** |
| S2 | **Video de Propiedad** (15–30 s, un inmueble) es el **tour** de los planes (15 s, máx. 3 tomas) | Hasta 15 s consume **1 tour**; de 16 a 30 s consume **2 tours** o se cobra la diferencia. **D24** |
| S3 | **Branding** incluye «tres plantillas» y la **puesta en marcha** (2.3) también menciona «plantillas» | La puesta en marcha adapta la **identidad al producto** (plantillas del sitio y del CRM); el pack Branding hace los **materiales comerciales** (cartel, ficha, 3 plantillas de comunicación). No se cobra dos veces; si el cliente compró la puesta en marcha, el brief del pack parte de esa identidad. **D25** |
| S4 | **Branding y Kit de Redes** usan el cupo de **imágenes** del plan | Kit de Redes = **4 imágenes** (una por canal). Branding = **5 imágenes** (cartel + ficha + 3 plantillas) *— interpretación propuesta, a aceptar en D24* |
| S5 | **Voz Comercial** y los **minutos del agente de voz** | Son cosas distintas: la voz comercial es una locución para una pieza; los minutos son tiempo conectado de un agente. **No hay cupo** de plan para la voz comercial: siempre «A cotizar» |
| S6 | **Presentación 2D** no tiene unidad en los planes | Siempre «A cotizar» y requiere geometría validada (§6) |

## 3. Las seis fichas

Todas: **precio «A cotizar»**; opcionales; gates G1–G6 (G4 antes de producir); registro de asset con fuente, licencia, estado sintético, autorización y versión; **1 ronda de revisión consolidada** (un error imputable a Eclipse no consume otra pieza); exclusiones comunes: publicación, pauta, exclusividad o propiedad perpetua de los modelos, material ajeno, «ilimitado por mes».

### 3.1 Panorama Inmobiliario
- **Resultado:** una pieza breve que presenta una zona o un proyecto, con entorno conceptual si no hay fuentes autorizadas.
- **Insumos:** zona/proyecto, público y objetivo; logo y paleta; referencias autorizadas del lugar (si hay); frase o CTA.
- **Entregables y cantidades:** 1 video 16:9 de **15–20 s** + 1 adaptación 9:16 del mismo concepto + póster y subtítulos + manifest. **Un concepto.**
- **Formatos:** 16:9 1920×1080; 9:16 1080×1920.
- **Estado sintético:** entorno conceptual generado, rotulado «recreación IA / concepto»; no acredita vistas, terminaciones ni geografía real.
- **Costo directo (motores):** segundos generados = segundos entregados × factor de intentos; las imágenes de referencia listadas en el brief; modelo por confirmar en la cuenta (G4); edición y subtítulos; 1 ronda; almacenamiento del master, la adaptación y el póster.
- **Trabajo humano:** guion y storyboard de una escena; selección de tomas y montaje; revisión y entrega.
- **Exclusiones:** vuelo de dron real o filmación; música sin licencia verificada; más de un concepto.

### 3.2 Video de Propiedad
- **Resultado:** un recorrido corto de **un** inmueble con el material que aporta la inmobiliaria.
- **Insumos:** fotos nítidas y consistentes con autorización del titular; datos verificables (superficie, ambientes, zona); logo y CTA.
- **Entregables y cantidades:** 1 video de **15–30 s**, **máx. 3 tomas**, una relación de aspecto (a elegir) + póster y subtítulos + manifest con la fuente de cada toma.
- **Estado sintético:** si hay recreación IA, se rotula; **no se inventan** vistas, terminaciones ni dimensiones; sin continuidad espacial comprobable se hace **presentación animada de fotos rotulada**.
- **Costo directo:** segundos generados × intentos; las fotos aportadas y autorizadas como referencia; modelo por confirmar; montaje y rotulado; 1 ronda; almacenamiento de originales + master + póster.
- **Trabajo humano:** revisión de fotos y consistencia; guion corto y montaje; control de rotulado y revisión.
- **Exclusiones:** 360°, escaneo, recorrido libre o levantamiento; inventar ambientes, vistas o terminaciones; más de un inmueble.

### 3.3 Voz Comercial
- **Resultado:** la locución de una pieza con una **voz licenciada**.
- **Insumos:** guion (se ajusta a **80 palabras**); pronunciaciones difíciles (zonas, calles, marca); la pieza donde se usa.
- **Entregables y cantidades:** 1 audio de hasta ≈ 32 s (80 palabras a ≈ 2,5 palabras/s) + transcript + versión sin música + manifest. **1 guion, 1 voz, 1 ronda de pronunciación.**
- **Licencia:** voz de catálogo con licencia comercial verificada; **la clonación o la voz de una persona real exige consentimiento específico y NO está incluida**.
- **Estado sintético:** voz sintética rotulada; no se imita a personas reales.
- **Costo directo:** audio generado ≈ 32 s por toma × intentos; modelo de voz por confirmar (G4); ajuste de ritmo y mezcla; almacenamiento.
- **Trabajo humano:** ajuste del guion; control de pronunciación y mezcla; revisión.
- **Exclusiones:** clonación; más de una voz o idioma; más de 80 palabras (se cotiza aparte).

### 3.4 Branding Inmobiliario
- **Resultado:** los materiales comerciales de la inmobiliaria con su identidad ya definida.
- **Insumos:** identidad existente (o la definida en la puesta en marcha); texto y datos de la ficha tipo; fotos autorizadas.
- **Entregables y cantidades:** **1 cartel**, **1 ficha** de propiedad tipo y **3 plantillas** editables + archivos fuente y exportables + manifest.
- **Formatos:** cartel (formato a elegir); ficha A4; plantillas editables y exportables.
- **Licencia:** editables de uso del cliente; tipografías y recursos solo con licencia comprobada. **Sin imágenes sintéticas por defecto.**
- **Costo directo:** 5 piezas gráficas finales (cartel + ficha + 3 plantillas); diagramación; 1 ronda; almacenamiento de fuentes.
- **Trabajo humano:** diagramación y adaptación; revisión de legibilidad y accesibilidad; entrega de editables.
- **Exclusiones:** **identidad completa nueva** (se cotiza aparte); sesión fotográfica; impresión o producción física.

### 3.5 Kit de Redes
- **Resultado:** un mismo concepto adaptado a los cuatro canales, listo para que lo publique la inmobiliaria.
- **Insumos:** concepto/mensaje y público; identidad; imágenes o video autorizados; CTA y destino.
- **Entregables y cantidades:** **1 concepto**, **4 piezas** (una por canal), **1 archivo editable por canal**, textos de apoyo y CTA por canal, manifest.
- **Canales:** ver §7.
- **Costo directo:** 4 imágenes finales; adaptación de encuadre y texto por canal; 1 ronda para el conjunto; almacenamiento de editables.
- **Trabajo humano:** adaptación por canal; revisión de CTA y legibilidad; entrega.
- **Exclusiones:** **publicación, programación o gestión de las cuentas**; **pauta o presupuesto publicitario**; calendario editorial continuo.

### 3.6 Presentación 2D
- **Resultado:** una planta **ilustrativa** de un inmueble, dibujada a partir de datos validados.
- **Insumos:** plano base autorizado **o** medidas completas de cada ambiente; autorización del titular; etiquetas y datos a mostrar. **Sin geometría validada no se dibuja** (§6).
- **Entregables y cantidades:** **1 planta** en SVG/HTML accesible (textos y leyenda reales) + exportable para impresión + registro de la fuente de geometría y de las validaciones + manifest.
- **Costo directo:** horas de dibujo según complejidad; 1 ronda; almacenamiento del plano base y del SVG. **No hay generación libre de geometría.**
- **Trabajo humano:** validación de la geometría; dibujo y leyenda; revisión con el titular.
- **Exclusiones:** relevamiento o medición en el inmueble; **plano técnico, de obra o habilitante**; deducir una distribución desde una foto.

## 4. Modelo de presupuesto

**Fórmula (por pack, por pedido):**

`costo_directo = Σ (cantidad generada × tarifa de la unidad) + horas_humanas × c + almacenamiento + licencias`

con `cantidad generada = cantidad entregada × factor de intentos` y `c` = costo horario interno (desconocido).

| Concepto | Qué se mide | Estado |
|---|---|---|
| Imágenes / segundos de video / segundos de audio **entregados** | ficha de cada pack (§3) | **definido** |
| **Factor de intentos** | veces que hay que generar para obtener una pieza aprobada | **supuesto de planificación: 3 (rango 2–5)**; se mide en el primer cliente; no es una cifra medida |
| Tarifa por unidad, modelo y parámetros | la cuenta del proveedor | **sin validar** (G2/G4) |
| Horas de producción y revisión, `c` | primer cliente | **faltan** |
| Almacenamiento | tamaño de originales + master + póster | pequeño; se estima al producir |
| Licencia | condiciones por plan/cuenta/fecha de cada proveedor | **por verificar** (G3) |

**Costo marginal vs. suscripción mínima:** las herramientas suelen tener una **suscripción mínima fija** (los topes que declaraste son Higgsfield 100/mes y ElevenLabs 11/mes, pero el gasto autorizado sigue en USD 0 hasta G4). Esa suscripción es un **costo fijo compartido**: el costo por pack = costo marginal + (suscripción ÷ packs producidos en el mes). Con pocos clientes, la suscripción pesa más que el marginal; por eso cotizar sin medir sería adivinar.

**Orden de magnitud con una referencia secundaria no validada** (precio «desde» de un modelo de video: ≈ 0,084 USD por segundo, de un blog de terceros; la voz y los demás modelos no tienen tarifa hallada):

| Pack | Segundos generados (entregados × 3) | Rango con factor 2–5 | Solo el modelo de video, a 0,084 USD/s |
|---|---:|---:|---:|
| Panorama (20 s) | 60 s | 40–100 s | ≈ 5,0 USD (3,4–8,4) |
| Video de Propiedad (30 s) | 90 s | 60–150 s | ≈ 7,6 USD (5,0–12,6) |

Lectura: si esa referencia fuera cierta, el **costo del modelo** sería chico; lo que pesa es la **mano de obra** (guion, selección, montaje, revisión), que todavía no se midió. **No es una cotización.** Todo precio nuevo permanece **«A cotizar»**.

## 5. Equivalencia con los cupos de los planes

Regla: **si el plan ya incluye la unidad en su cupo mensual, el pack la consume del cupo y no se cobra de nuevo.** Lo que excede el cupo o la equivalencia se cotiza. Los cupos son **propuesta** (2.3); los números de abajo son el máximo teórico si **todo** el cupo del mes se destinara a ese pack.

| Pack | Equivale a | Cubre | Más allá |
|---|---|---|---|
| Panorama | 1 campaña | hasta 15 s | 16–20 s: diferencia A cotizar |
| Video de Propiedad | 1 tour (15 s) | hasta 15 s | 16–30 s: 2 tours o diferencia |
| Kit de Redes | 4 imágenes | las 4 piezas | diferencia A cotizar |
| Branding | 5 imágenes *(interpretación)* | cartel + ficha + 3 plantillas | diferencia A cotizar |
| Voz Comercial | — (no hay cupo) | — | siempre A cotizar |
| Presentación 2D | — (no hay cupo) | — | siempre A cotizar |

Máximo de packs por mes que cabrían en el cupo propuesto de cada plan:

| Plan | Video de Propiedad (tours) | Panorama (campañas) | Kit de Redes (÷4 imágenes) | Branding (÷5 imágenes) |
|---|---:|---:|---:|---:|
| Contact | 0 | 0 | 0 | 0 |
| Growth | 1 | 0 | 1 | 0 |
| Escalar | 2 | 1 | 2 | 1 |
| Hípergrowth | 3 | 2 | 3 | 2 |
| Deluxe | 4 | 3 | 4 | 3 |
| Partner | 8 | 5 | 6 | 4 |

(Las imágenes se comparten entre Kit y Branding, y los tours entre los packs y los tours sueltos: el máximo de uno resta al otro.) En **Contact** todo pack es extra.

## 6. Presentación 2D: regla de geometría

**Una foto no determina una distribución.** Para dibujar la planta hace falta una de dos fuentes:
1. un **plano base autorizado** del inmueble; o
2. **medidas completas** de cada ambiente (largo × ancho), ubicación de las aberturas relevantes y espesor de muros cuando afecte la superficie.

Datos mínimos (propuesta de esquema, no existe aún): `inmueble`, `escala`, `orientacion`, `ambientes[]` (nombre, polígono cerrado o largo × ancho), `aberturas[]`, `superficieDeclarada`, `fuente` (plano base / medición), `autorizacion`.

Validaciones antes de dibujar: (1) la suma de superficies coincide con la declarada dentro de una **tolerancia acordada**; (2) cada ambiente es un polígono cerrado; (3) hay escala y orientación declaradas. **Si falla alguna, no se dibuja** y se pide el dato faltante (sin «arreglarlo» a ojo). Etiqueta fija: «Ilustrativo: no es un plano técnico ni un documento habilitante». El plano es **HTML/SVG** con textos reales (accesible), no una imagen generada. El demo de Lumen **ya tiene** una planta ilustrativa de 3 ambientes; sirve como muestra rotulada, no como evidencia de que un plano real salga de una foto.

## 7. Kit de Redes: los cuatro canales (adaptación definida, sin envío)

| Canal | Formato de referencia | CTA típico |
|---|---|---|
| Instagram | 4:5 1080×1350 (feed) y 9:16 1080×1920 (reels/stories) | enlace en bio o mensaje directo |
| Facebook | 4:5 1080×1350 o 1:1 1080×1080 | botón de WhatsApp o enlace |
| TikTok | 9:16 1080×1920 | enlace en perfil o comentario fijado |
| LinkedIn | 1,91:1 1200×627 o 1:1 1080×1080 | enlace o mensaje |

Un concepto, cuatro piezas, un editable por canal. **Se entrega el archivo; no se publica ni se pauta.** Los formatos son de referencia (no pude abrir las guías de cada red) y se **revalidan al producir**.

## 8. Material, licencias y estado sintético

Cada asset de cualquier pack lleva en su manifest: **fuente · licencia · estado · autorización · versión del catálogo**, con estos estados posibles: *real autorizado* · *recreación IA* · *concepto* · *vectorial* · *ilustrativo*. Los insumos **privados** del cliente (fotos, planos, guion) se separan de los assets **publicables**; no se mezclan fixtures con datos reales ni se reutilizan datos del portal interno en la demo pública. Ningún pack se produce con propiedades que no sean del cliente o sin autorización del titular. Música y voces: derechos por verificar antes de usar (G3).

## 9. Flujo de pedido y producción

| Etapa | Entrada | Acción | Salida | Error | Vacío | Recuperación |
|---|---|---|---|---|---|---|
| Elegir | configurador (módulo «Studio») | marcar un pack (desmarcado por defecto) | resumen con «A cotizar» | pack ya cubierto por el cupo | sin packs elegidos | el plan sigue funcionando sin packs |
| Propuesta | pedido | Eclipse devuelve alcance, cantidades y precio | propuesta | faltan insumos | — | lista de insumos pendientes |
| G3 | insumos y derechos | se revisa material, licencias y autorización | «apto» o «bloqueado» | material ajeno o sin permiso | — | pedir autorización o reemplazar el material |
| G4 | cantidad, modelo, techo | se aprueba el gasto | orden de producción | sin techo aprobado | — | no se produce |
| Producción y revisión | brief + storyboard | generar/montar; 1 ronda | entrega + manifest | geometría incompleta (2D); pronunciación fallida | — | pedir el dato; repetir la toma dentro de la ronda |
| G5/G6 | pieza final | QA y autorización de publicación | entrega al cliente | rótulos faltantes | — | corregir antes de entregar |

## 10. Criterios de aceptación (§12 del prompt)

| Criterio | Estado | Dónde |
|---|---|---|
| Seis fichas con cantidades, revisiones y exclusiones | **Cumplido** | §3; JSON y prueba |
| Todo precio nuevo permanece a cotizar | **Cumplido** | JSON (`price: A cotizar`); la prueba rechaza cualquier importe |
| El plano 2D exige una fuente de geometría | **Cumplido** | §6; JSON `geometryRule` |
| Cada asset tiene fuente, licencia y estado sintético | **Cumplido** | §8; `assetRecord` en cada pack |
| Los cuatro canales tienen adaptación definida, sin envío | **Cumplido** | §7 |
| Cada afirmación de funcionamiento con evidencia o rotulada | **Cumplido** | nada se afirma como funcionando; todo es propuesta o supuesto rotulado |
| Sin gastos, publicaciones ni cambios de alcance implícitos | **Cumplido** | USD 0; el único cambio de alcance (equivalencias con cupos) está marcado para decisión |
| Contenido vigente preservado; sustituciones documentadas | **Cumplido** | §2 (S1–S6) |

## 11. Decisiones para Ignacio

| # | Decisión | Recomendación |
|---|---|---|
| **D24** | **Equivalencia packs ↔ cupos:** Panorama = 1 campaña (hasta 15 s), Video de Propiedad = 1 tour (hasta 15 s; 16–30 s = 2 tours), Kit de Redes = 4 imágenes, Branding = 5 imágenes | Aceptar; evita cobrar dos veces y deja claro qué es extra |
| **D25** | **Branding vs. puesta en marcha:** la puesta en marcha adapta la identidad al producto y el pack Branding hace los materiales comerciales | Aceptar esa frontera |
| **D26** | **Presentación 2D:** el cliente aporta el plano o las medidas; Eclipse **no mide** en el inmueble | Aceptar |

D19, D20, D21 y D23 (lote 2.3) siguen abiertas; D22, diferida al primer cliente.

## 12. No ejecutado, límites y rollback

- **No ejecutado:** generación de cualquier medio; cotización con tarifas validadas; medición del factor de intentos y de las horas humanas; revisión jurídica de licencias; build ni e2e (no se tocó código de producto).
- **Evidencia:** `tests/packs-inmobiliarios.test.ts` (9 casos sobre el JSON), suite completa, `tsc`, `eslint`.
- **Rollback:** borrar `docs/v3/estateos/packs-inmobiliarios.v1.json`, `tests/packs-inmobiliarios.test.ts` y este documento; no hay migraciones ni datos externos. El catálogo no está conectado a ningún componente.

## 13. Handoff

Habilita **2.5 · Conversión y seguimiento** (pitch, propuesta desglosada, cadencia, métricas): la propuesta debe separar mensualidad, puesta en marcha, packs y consumos, y mostrar «A cotizar» sin sumar. Alimenta **3.1–3.4** (producción: el storyboard y el gasto se aprueban antes de producir cualquier pack) y la **3.7** (presentación de propiedades: la regla de geometría del 2D). No autoriza producir ni gastar.
