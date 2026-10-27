# Biblia EstateOS v2 — siete piezas

Lote 3.1 (27/10/2026), dirección Opus. **Estado: dirección para aprobar. No se generó, grabó ni compró nada.**
Reemplaza como columna vertebral a la biblia v1 de Notion («Biblia EstateOS · escenas y producción», doce escenas
lineales), que **se conserva**: sus escenas se reparten en las siete piezas (§3) y sus contratos comunes (preámbulo,
prohibiciones, licencias, manifest) siguen vigentes. Cómo se mueve y cómo se fabrica cada video:
`guia-motion.v1.md`. Por qué esta dirección: `../lote-3.1-direccion-estateos.md`.

## 1. Promesa

Un dueño de inmobiliaria **ve su negocio funcionando** antes de hablar con nadie: primero el recorrido completo, después
el plan que le sirve, con lo que ese plan suma y nada más. El video invita; la demo interactiva demuestra; el precio está
siempre a la vista, al lado.

## 2. Cómo se recorre (D28, D29)

```text
Eclipse (selector «Inmobiliarias») ──▶ roofy.eclipse-business.com/<idioma>/?moneda=…
                                          │
                                          ▼
                     DEMO GENERAL · «¿Cómo la querés ver?»   (en cada visita, nada se recuerda)
                     ├─ Ver con guía ─▶ video general (opcional) ─▶ recorrido por las áreas
                     │                    └─ en cada plan: «Ver demo de Contact / Growth / …»
                     │                         └─▶ video del plan ─▶ demo del plan (solo lo que suma)
                     └─ Ver por mi cuenta ─▶ todas las áreas; cada una dice «Incluido desde <plan>»
                                              y las que el plan elegido no incluye se ven bloqueadas
                                              con «Desde <plan> · USD <precio>/mes» (precio en HTML)
```

- La demo de un plan muestra **lo que ese plan suma**, con un acceso «Incluye lo de <plan anterior>».
- Áreas: Administración (CRM), Ventas y propiedad, Marketing, Branding, Intelligence, Academy, y las nuevas de 3.8b/3.8c
  (Propietario, Equipo, Llamadas, Documentación, Asistente del CRM, Administración de consorcios, Sedes).
- **Nuevo en el contrato de enlace (para 3.5):** un parámetro `plan=contact|growth|escalar|hipergrowth|deluxe|partner`
  para abrir directo la demo de un plan. Va en los dos repos con el fixture compartido (lote 1.6).

## 3. Las doce escenas de la v1 en las siete piezas

| Escena v1 | Pieza que la usa | Cómo |
|---|---|---|
| 00 Eclipse | General | Apertura: el reveal existente (`motion.ts`), sin un segundo eclipse |
| 01 Descenso costero, 02 Fachada, 03 Umbral, 04 Recepción | **Growth** (recreación del local) y General (apertura) | Es exactamente lo que vende «Recreación del local» (`local_recreation`, Growth). Con fotos fijas por defecto; clips solo con gate (D32) |
| 05 Administración | Contact | El CRM de Lumen haciendo su trabajo: consulta → calificación → visita |
| 06 Ventas y propiedad | Contact (ficha web) y **Growth** (tour de 15 s del inmueble) | La ficha es Contact; el tour generado es la producción mensual de Growth |
| 07 Marketing | Growth (imágenes, motion) y **Escalar** (campaña 2 × 15 s) | Mismo material del inmueble, adaptado |
| 08 Branding | Contact (puesta en marcha de marca) | La marca de la inmobiliaria en web, fichas y redes |
| 09 Intelligence | Growth (mapas y métricas) y **Hípergrowth** (análisis y recomendaciones) | Datos ficticios rotulados; mapa solo con fuente licenciada |
| 10 Academy | Growth (Academy inicial) y Escalar (kit de tours) | Guías reales en HTML |
| 11 Salida al eclipse | General | Cierre: vuelve al eclipse y a Eclipse |

## 4. Escalera de fases

Cada plan es una fase del eclipse en `PhaseGlyph`: Contact `1/6`, Growth `2/6`, Escalar `3/6`, Hípergrowth `4/6`,
Deluxe `5/6`, Partner `1` (totalidad con el anillo de diamante). Abre y cierra cada video del plan y ordena la demo
general. Es el único símbolo de nivel.

## 5. Fichas

Formato común de cada video: **problema** (una lectura en mono y un titular serif) → **la capacidad trabajando**
(interfaz real) → **el resultado** (una lectura que rueda, de fixture y rotulada) → **cierre** (plan, fase y lo que
suma; el precio y el CTA están en el HTML de al lado). Duraciones propuestas; cada lote V las ajusta midiendo.

**Ni precios ni cupos dentro de los videos:** los cupos son propuestas a medir y no se publican (regla de `CLAUDE.md`); el
video nombra la capacidad, no la cantidad. Los números que aparecen son de las fixtures de la demo y llevan el sello «Demo».

Campos comunes a todas las fichas, salvo que la ficha diga otra cosa:

- **Disparador:** el visitante toca «Ver demo de <plan>» (guía) o «Ver video» en el plan; nunca arranca solo.
- **Paleta:** instrumento Eclipse (noche, ámbar como única luz) + Lumen (piedra, tinta, cobalto, arena).
- **Cámara:** virtual sobre la interfaz, deriva de 2–4 % por plano, verticales rectas, un movimiento por plano.
- **Luz:** la del sitio: corona desde un lado; la interfaz de Lumen iluminada, el resto en penumbra ordenada.
- **Referencias a preservar:** hoja de continuidad (§6), interfaz real de Lumen en su HEAD, fixtures de `data.ts`.
- **Prohibido:** lo de `guia-motion.v1.md` §11 y el contrato común de la v1.
- **Audio:** música del sitio renderizada sin conexión + efectos en acciones; voz opcional (3.4).
- **Fallback:** poster + transcripción + la demo interactiva del plan (equivalente). Nunca un bloqueo.
- **Desktop:** 16:9 con la interfaz de escritorio. **Móvil:** 9:16 compuesto aparte con las vistas de celular.
- **Aprobación:** Ignacio aprueba el video completo; Opus redacta y revisa en el lote V.

### P1 · Contact — «Ninguna consulta se pierde» · lote V1 (piloto)

| Campo | Definición |
|---|---|
| Objetivo | Que el dueño vea que con el producto base **ninguna consulta queda sin respuesta ni sin próximo paso**, aunque la oficina esté cerrada |
| Duración | 35 s (± 5) |
| Fase | `1/6` |
| Qué muestra | Web pública (`web`), CRM completo (`crm_core`), chat guiado con botones (`guided_chat`, sin IA ni WhatsApp, D20), puesta en marcha de marca (`setup_brand`) |
| Qué NO muestra | Seguimientos automáticos por WhatsApp (Growth), asistente con IA (Deluxe), propietario, mapas |
| Inicio / final | Inicio: «Hoy» de Lumen a oscuras, 23:40. Final: tarjeta de Carolina en «Visita» y la agenda del viernes con su turno; cierre con la fase `1/6` |
| Generación | **Ninguna.** Todo es render de la interfaz real |
| Locución opcional | «Son las 23:40 y la oficina está cerrada. Igual, la consulta entra, se ordena y termina con una visita en la agenda.» (22 palabras, ≈ 10 s) |
| Transición | Corte al cierre; del cierre, el visitante sigue a la demo de Contact |
| Costo | USD 0 externo |
| Depende de | 3.5 (Lumen en `roofy`, lente por plan, copy de chat guiado), guía de motion |
| Aprobación especial | **Es el piloto:** si Ignacio no lo aprueba como premium, no se hacen V2–V5 ni se gasta en 3.2–3.4 |

| # | Tiempo | Plano | Acción en la interfaz | Texto en pantalla (es) |
|---|---|---|---|---|
| 1 | 0:00–0:04 | «Hoy» a oscuras; lectura mono arriba a la izquierda | La oficina figura cerrada; se enciende el panel | `JUE 8 OCT · 23:40` / titular: «Oficina cerrada.» |
| 2 | 0:04–0:12 | Celular: el sitio, ficha de Olmos 1420 | Carolina abre el chat; responde con botones: compra · crédito · USD 150–200k | «Chat guiado: responde con botones, a cualquier hora.» |
| 3 | 0:12–0:18 | CRM: Consultas | La consulta aparece con lo que respondió | «La consulta cae en el CRM, completa.» |
| 4 | 0:18–0:24 | Pipeline | La tarjeta pasa de Nuevo a Calificado | «Cada consulta tiene estado y próximo paso.» |
| 5 | 0:24–0:29 | Visitas | El turno del viernes 18:30 aparece en la agenda | Lectura: `VIE 9 · 18:30 · Olmos 1420` |
| 6 | 0:29–0:32 | Marca | La web y una ficha toman la marca de la inmobiliaria (preset de Lumen) | «Con tu marca, desde la puesta en marcha.» |
| 7 | 0:32–0:35 | Cierre | Fase `1/6`, nombre del plan y tres renglones | «Contact · web · CRM · chat guiado» |

### P2 · Growth — «Tu inmueble, mejor contado» · lote V3

| Campo | Definición |
|---|---|
| Objetivo | Mostrar lo que suma Growth sobre Contact: **producción mensual** (tour de 15 s, imágenes, motion), **panel del propietario**, mapas y métricas, Academy inicial, seguimientos automáticos y la recreación del local |
| Duración | 40 s (± 5) |
| Fase | `2/6` |
| Caso | Los Aromos 88 (Colinas): casa de 5 ambientes, 210 m², jardín, pileta, cochera, USD 320.000, **41 días publicada**, 6 consultas, 2 visitas (todo de `data.ts`) |
| Inicio / final | Inicio: ficha de Los Aromos 88 con la lectura «41 días publicada». Final: el propietario ve su inmueble con el tour nuevo y las consultas de la semana |
| Generación | **Sí (gate):** tour de 15 s del inmueble (3 tomas de 5 s, desde 3 fotos fijas) y 4 imágenes finales (3.2/3.3). Recreación del local: fotos fijas por defecto; clips opcionales (D32) |
| Locución opcional | «Una propiedad publicada hace 41 días. Este mes recibe su tour, imágenes nuevas y un seguimiento que su propietario ve en tiempo real.» (23 palabras) |
| Costo | Ver §8 (tour 15 s y 4 imágenes) |
| Depende de | V1 aprobado, 3.2, 3.3, 3.7 (ficha), 3.8 (mapa o tabla), 3.8b (panel del propietario) |

| # | Tiempo | Plano | Acción | Texto en pantalla (es) |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Ficha de Los Aromos 88 (interfaz) | La lectura «41 días» rueda | `41 DÍAS PUBLICADA · 6 CONSULTAS` |
| 2 | 0:04–0:19 | **Ventana** con el tour de 15 s (3 tomas: llegada por el jardín, living vidriado, pileta) | El tour corre dentro del marco con marcas de registro | Sello: «Recreación IA · propiedad ficticia» / «Un tour de 15 s, desde tus fotos» |
| 3 | 0:19–0:24 | Las 4 imágenes finales en grilla editorial + una pieza de motion de plantilla | Entran por ocultación | «Imágenes y motion para tus publicaciones» |
| 4 | 0:24–0:30 | Panel del propietario (3.8b) | El propietario ve consultas, visitas y el tour de su casa | «Tu propietario ve cómo avanza su inmueble.» |
| 5 | 0:30–0:34 | Mapa (si hay fuente) o tabla por zona + Academy | Filtro por zona; una guía de Academy | «Mapas, métricas y Academy para el equipo.» |
| 6 | 0:34–0:37 | Seguimientos | Mensaje automático programado (simulado) | «Seguimientos automáticos por WhatsApp» |
| 7 | 0:37–0:40 | Cierre | Fase `2/6` | «Growth · producción mensual · propietario · datos» |

Variante extendida (opcional, D32): 8 s de **recreación del local** con las fotos fijas KEY-FACADE → KEY-RECEPTION
(o los clips 01 y 03 de la v1 si se aprueban) antes del cierre: «Al empezar, recreamos tu local».

### P3 · Escalar — «Tu equipo coordinado, tu campaña afuera» · lote V4

| Campo | Definición |
|---|---|
| Objetivo | Mostrar lo que suma Escalar: **coordinación del equipo**, **campaña de dos piezas de 15 s** (16:9 y 9:16), **agente de voz**, kit de tours y borradores de contratos |
| Duración | 40 s (± 5) |
| Fase | `3/6` |
| Inicio / final | Inicio: tablero del equipo con una consulta estancada. Final: la campaña en dos formatos y una visita agendada por teléfono |
| Generación | La campaña **reutiliza** las tomas del tour de Growth (sin generación nueva por defecto). Voz: dos voces sintéticas con licencia para la llamada (3.4, gate) |
| Locución opcional | «Cuando el equipo crece, ninguna consulta se pierde: se reparten, se miden y se atienden por teléfono. Y cada propiedad sale con su campaña.» (24 palabras) |
| Costo | Voz (3.4); campaña sin costo de generación extra |
| Depende de | V1, V3 (tomas del tour), 3.4, 3.8b (Equipo y Llamadas) |

| # | Tiempo | Plano | Acción | Texto en pantalla (es) |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Equipo (3.8b): carga por asesor | Una consulta lleva 3 días sin respuesta | `CONSULTA SIN RESPUESTA · 3 DÍAS` |
| 2 | 0:04–0:11 | Equipo | Se reasigna a otra asesora; la carga se equilibra | «Distribuí y reasigná según la carga.» |
| 3 | 0:11–0:25 | **Dos ventanas**: 16:9 y 9:16 lado a lado | Las dos piezas de la campaña corren sincronizadas | Sello: «Recreación IA» / «Campaña: 2 piezas de 15 s» |
| 4 | 0:25–0:34 | Llamadas (3.8b): forma de onda + transcripción en vivo | El agente agenda una visita por teléfono | Sello: «Llamada simulada · voz sintética» |
| 5 | 0:34–0:37 | Academy: kit de tours | Guía para vender tours a propietarios | «Kit para vender tours a tus propietarios.» |
| 6 | 0:37–0:40 | Cierre | Fase `3/6` | «Escalar · equipo · campañas · voz» |

### P4 · Hípergrowth — «Decidir con datos» · lote V2

| Campo | Definición |
|---|---|
| Objetivo | Mostrar Intelligence (por canal, motivos de pérdida, recomendaciones explicables) y la documentación de operaciones (`compliance_docs`, sin asesoramiento jurídico) |
| Duración | 35 s (± 5) |
| Fase | `4/6` |
| Generación | Ninguna. Datos ficticios rotulados en cada lectura (3.8) |
| Locución opcional | «¿Dónde se pierden las consultas? Por canal, por motivo y con una recomendación que dice de dónde sale.» (18 palabras) |
| Costo | USD 0 externo |
| Depende de | V1, 3.8, 3.8c (Documentación) |

| # | Tiempo | Plano | Acción | Texto en pantalla (es) |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Intelligence | Lectura de pérdidas del período | Titular: «¿Dónde se pierden?» / `DATOS FICTICIOS` |
| 2 | 0:04–0:13 | Por canal (portal, web, WhatsApp, cartel) | Gráfico y tabla con el mismo total | «Mismo total en gráfico y tabla.» |
| 3 | 0:13–0:20 | Motivos de pérdida | Se filtra un motivo | «Motivos de pérdida, por período.» |
| 4 | 0:20–0:26 | Recomendación | Recomendación con su fuente y fecha | «Cada recomendación dice de dónde sale.» |
| 5 | 0:26–0:32 | Documentación (3.8c) | Operación con un faltante y un vencimiento | «Faltantes y vencimientos de cada operación.» |
| 6 | 0:32–0:35 | Cierre | Fase `4/6` | «Hípergrowth · Intelligence · documentación» |

### P5 · Deluxe — «Nuevos servicios, con tu marca» · lote V2

| Campo | Definición |
|---|---|
| Objetivo | Mostrar el **asistente dentro del CRM** (responde al equipo con fuentes y pide confirmación antes de modificar) y la **administración de consorcios** con la marca de la inmobiliaria |
| Duración | 35 s (± 5) |
| Fase | `5/6` |
| Generación | Ninguna. El asistente es una **demostración guionada** rotulada (3.8c); no hay un modelo de lenguaje detrás |
| Locución opcional | «Preguntale al CRM lo que necesitás, y sumá la administración de consorcios con tu propia marca.» (16 palabras) |
| Costo | USD 0 externo |
| Depende de | V1, 3.8c (Asistente del CRM y Administración de consorcios) |

| # | Tiempo | Plano | Acción | Texto en pantalla (es) |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Asistente del CRM | El equipo pregunta: «¿Qué visitas tengo mañana?» | Sello: «Demostración guionada» |
| 2 | 0:04–0:13 | Asistente | Respuesta con la fuente (agenda) y una acción que pide confirmación | «Responde con fuente y confirma antes de cambiar algo.» |
| 3 | 0:13–0:20 | Consorcio Demo | Expensas del mes generadas | `CONSORCIO DEMO · EXPENSAS DE OCTUBRE` |
| 4 | 0:20–0:29 | Reclamos | Un reclamo pasa de abierto a asignado y se notifica (simulado) | «Reclamos y comunicaciones, ordenados.» |
| 5 | 0:29–0:32 | Marca | La administración lleva la marca de la inmobiliaria | «Con tu marca.» |
| 6 | 0:32–0:35 | Cierre | Fase `5/6` | «Deluxe · asistente · administración» |

### P6 · Partner — «Varias sedes, una visión» · lote V2 (propuesta)

| Campo | Definición |
|---|---|
| Objetivo | Mostrar varias sedes con permisos y visión consolidada, y la revisión mensual de 45 min. Es un plan **propuesto**: el cierre lo dice |
| Duración | 30 s (± 5) |
| Fase | `1` (totalidad) |
| Generación | Ninguna |
| Locución opcional | «Varias sedes, cada una con su equipo, y una sola vista para decidir. Una vez por mes, la revisamos juntos.» (20 palabras) |
| Costo | USD 0 externo |
| Depende de | V1, 3.8c (Sedes) |

| # | Tiempo | Plano | Acción | Texto en pantalla (es) |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Selector de sedes | Sedes ficticias (Centro, Norte, Puerto) | `SEDES · DEMO` |
| 2 | 0:04–0:15 | Vista consolidada | Consultas y visitas por sede, mismo total | «Cada sede con sus permisos.» |
| 3 | 0:15–0:24 | Revisión mensual | Agenda de 45 min con tres puntos | «Revisión mensual de 45 min.» |
| 4 | 0:24–0:30 | Cierre | Totalidad con el anillo de diamante | «Partner · propuesta · alcance a acordar» |

### P0 · Demo general — «EstateOS» · lote V5

| Campo | Definición |
|---|---|
| Objetivo | En poco más de un minuto, entender **todo lo que hace EstateOS** y que se elige por niveles; terminar en «¿Cómo la querés ver?» |
| Duración | 65 s (± 10) |
| Disparador | «Ver con guía» en la entrada general → «Ver el video» (opcional; se puede ir directo al recorrido) |
| Inicio / final | Inicio: el eclipse (reveal existente). Final: las dos opciones de la entrada |
| Generación | Reusa lo de V1–V4: no genera nada propio. La apertura usa la recreación del local (fotos fijas o clips, D32) |
| Locución opcional | «Esto es EstateOS: tu inmobiliaria, de la primera consulta a la operación. Empieza simple y crece con vos, nivel por nivel.» (21 palabras) |
| Costo | USD 0 externo propio |
| Depende de | V2, V3, V4 |

| # | Tiempo | Plano | Contenido |
|---|---|---|---|
| 1 | 0:00–0:03 | Eclipse | Reveal existente; un solo eclipse |
| 2 | 0:03–0:11 | Llegada | Fachada → recepción de Lumen (fotos fijas con deriva 2–4 %, o clips 01/03 si D32 los aprueba) |
| 3 | 0:11–0:15 | Recepción | Índice de áreas en HTML; aparece la escalera de fases |
| 4 | 0:15–0:57 | Escalera | Seis tramos de ≈ 7 s, el plano estrella de cada video (P1 → P6); la fase sube en cada tramo |
| 5 | 0:57–1:05 | Cierre | «¿Cómo la querés ver?» · Ver con guía · Ver por mi cuenta · sello «Demo · datos ficticios» |

## 6. Hoja de continuidad

- **La inmobiliaria Lumen** (ficticia): la de la v1, sin cambios. Exterior de dos plantas, tres paños verticales de
  piedra clara, puerta central de acero oscuro y vidrio; interior con mostrador recto de travertino a la izquierda con
  inserto cobalto, panel de roble, pasillo central y administración a la derecha. Amanecer desde la izquierda. Ciudad
  costera imaginaria, sin direcciones ni edificios reales.
- **Los Aromos 88 (Colinas)**, para Growth y Escalar: casa de **una planta** (como su ilustración en `facade.tsx`), losa
  plana que vuela sobre el frente, living con ventanal de parantes verticales a la izquierda, volumen de color arena a
  la derecha con puerta oscura, **pileta rectangular al frente**, árbol a la derecha, lomas suaves detrás, luz de día.
  Solo lo que dice `data.ts`: 5 ambientes, 3 dormitorios, 3 baños, 210 m², jardín, pileta, cochera. No se agregan vista
  al mar, balcones, quincho ni nada que no figure.
- **Personas:** ninguna en imágenes ni clips. En la interfaz, solo las personas ficticias de `data.ts` (Carolina,
  asesores Julia R. y Marcos V., etc.). Si 3.8b suma asesores al tablero del equipo, son nombres ficticios nuevos en los
  mensajes del sitio.
- **Marca:** Eclipse con sus tokens; Lumen con los suyos. Ninguna marca generada por IA, ningún logo de terceros.
- **Sellos:** «Demo · datos ficticios» en todos los cuadros; «Recreación IA · propiedad ficticia» en el tour y la
  campaña; «Llamada simulada · voz sintética»; «Demostración guionada» en el asistente.

## 7. Prompts de generación (para 3.2 y 3.3; nada se genera en 3.1)

Preámbulo común de la v1, sin cambios, para la inmobiliaria Lumen. Para el inmueble se usa este preámbulo:

> Photorealistic architectural photography of a clearly fictional single-storey contemporary house. Flat cantilevered
> concrete roof slab over the front; to the left a wide living room glazed with slim vertical mullions; to the right a
> sand-coloured solid volume with a dark door; a rectangular swimming pool in front of the glazing; a single tree on the
> right; gentle green hills behind. Daylight from camera-left, soft shadows. Straight verticals, realistic materials,
> calm editorial composition. No people, no text, no logos, no house numbers, no identifiable real location.

**Fotos fijas (3.2), una por toma, máximo 2 intentos cada una:**

1. `KEY-COLINAS-EXT` — preámbulo + «Three-quarter view from the garden, the pool in the foreground, the full facade
   visible, eye-level 35 mm look.»
2. `KEY-COLINAS-LIVING` — preámbulo + «Interior of the glazed living room looking out to the pool through the mullions,
   oak floor, sand and stone tones, eye-level 28 mm look, nothing added that is not listed.»
3. `KEY-COLINAS-POOL` — preámbulo + «Pool-side view toward the house at the same hour, the tree on the right, calm water,
   50 mm look.»

**Tomas del tour (3.3), 5 s cada una, desde la foto aprobada como imagen inicial:**

1. Desde `KEY-COLINAS-EXT`: «A single slow forward move along the garden toward the house, keeping the pool on the left
   and the tree on the right; preserve the roof slab, glazing and volumes exactly; settle for the last second. No cuts,
   no zoom reversal, no camera roll, no new rooms or objects, no people, no text.»
2. Desde `KEY-COLINAS-LIVING`: «A slow lateral move across the living room parallel to the glazing, revealing the pool
   outside; keep the mullions straight; settle for the last second. No warping glass, no added furniture, no people.»
3. Desde `KEY-COLINAS-POOL`: «A slow push-in over the water toward the house facade; preserve geometry and light;
   settle for the last second. No reflections that invent architecture, no people, no text.»

**Recreación del local (opcional, D32):** los prompts de las escenas 01 (descenso, 6 s) y 03 (umbral, 5 s) de la v1, sin
cambios, con sus anclas KEY-AERIAL, KEY-FACADE, KEY-THRESHOLD y KEY-RECEPTION.

**Campaña de Escalar:** no se pide video nuevo; se monta con las tres tomas del tour, en 16:9 y 9:16, más tipografía y
motion del sitio. Si el 9:16 recortado pierde la casa, se cotiza **una** toma vertical extra (no automática).

Antes de generar, 3.3 lista los modelos disponibles en la cuenta y exporta el esquema real del elegido; un *negative
prompt* va como campo solo si el esquema lo admite. El prompt de cámara es dirección visual, no una garantía.

## 8. Costos a cotizar (nada autorizado)

Tasas publicitadas que figuran en la biblia v1 (Higgsfield, Seedance 2.5): USD 0,144/s en promoción y 0,2057/s de
lista. Son ilustrativas: manda la cotización real de la cuenta.

| Pieza generada | Segundos | 1 intento (0,144 · 0,2057) | 2 intentos |
|---|---|---|---|
| Tour de Los Aromos 88 (3 tomas) | 15 s | USD 2,16 · 3,09 | USD 4,32 · 6,17 |
| Recreación del local, opcional (01 + 03) | 11 s | USD 1,58 · 2,26 | USD 3,17 · 4,53 |
| Toma vertical extra para la campaña, solo si hace falta | 5 s | USD 0,72 · 1,03 | USD 1,44 · 2,06 |
| Fotos fijas: 3 del inmueble (+ 4 del local si D32) | — | a cotizar por modelo, aspecto y resolución | máx. 2 por foto |
| Voz (3.4): llamada de Escalar y locuciones opcionales | ≈ 60 s + opcionales | plan de voz a validar (la v1 registró ElevenLabs Starter USD 6/mes, no verificado hoy) | — |

Peor caso de video con todo lo opcional y dos intentos (62 s): ≈ USD 8,93 en promoción o 12,75 de lista, más fotos y voz.
**Nada de esto se gasta sin el gate de gasto de 3.2, 3.3 y 3.4.**

## 9. Voz (brief para 3.4)

- **Locución de los videos (opcional):** una voz rioplatense neutra, cálida y sin tono publicitario; ritmo ≤ 2,2
  palabras/s; misma voz en las siete piezas.
- **Llamada de Escalar:** dos voces sintéticas distintas (agente e interesado), con licencia comercial; guion de
  ≈ 30 s que termina con una visita agendada; en pantalla dice «Llamada simulada · voz sintética».
- **Nunca** clonar ni imitar una voz real; nunca la voz arranca sola.

## 10. Qué se aprueba ahora

Ignacio aprueba (o corrige) en este lote: la dirección «instrumento y ventana», el recorrido de §2, el reparto de §3,
las siete fichas, la hoja de continuidad y los límites de intentos. Las fotos, los clips y la voz se aprueban **uno por
uno** en sus lotes, después del piloto V1.
