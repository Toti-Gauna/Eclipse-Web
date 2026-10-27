# Lote 3.1 · Dirección de EstateOS (siete piezas)

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-opus-5-5`, esfuerzo `high` (Ignacio cambió la sesión a Opus para este
lote; `get_session`: modelo y último modelo servido `claude-opus-5-5`, `effort_level: high`) · **Rama:**
`claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `923081b`, merge del PR #28) · **Resultado:**
**documental**. No se tocó código de producto ni se generó, grabó o compró nada.

**Entregables:** `estateos/biblia-estateos.v2.md` (las siete piezas, continuidad, prompts, costos) ·
`estateos/guia-motion.v1.md` (cómo se mueven y cómo se fabrican los videos) · este informe · camino de la Fase 3 en la
matriz de `lote-0.4-sdd-control-financiero.md`.

**Fuentes leídas:** Notion «Lote 3.1 · Dirección cinematográfica Opus» (prompt 01–16), «Biblia EstateOS · escenas y
producción» y las **doce fichas de escena** completas (00–11), «Fase 3 · EstateOS vendible», «Lote 3.5», «3.6», «3.7» y
«3.8»; `lote-1.4-motion-direccion-visual.md` (§4–§7), `lote-2.3` §9–§10, `estateos/catalogo-estateos.v3.json`
(planes, 22 capacidades, definiciones de cupo); código: `components/demo-experience/motion.ts`,
`components/demos/real-estate/{data.ts,story.ts,tour.ts,facade.tsx}`, `components/ui/PhaseGlyph.tsx`,
`lib/sound/engine.ts`. Capturas nuevas de la demo de Lumen (escritorio 1440 y celular 390) para saber qué se puede filmar.
**Límites:** no se consultó la cuenta de Higgsfield ni de ElevenLabs (las tasas son las que registró la v1 y no están
validadas hoy); no hay fuente cartográfica de barrios verificada (el dataset municipal respondió 403 en la auditoría).

## 0. Informe en tres líneas

- **Qué cambió:** quedó la dirección de las **siete piezas** que pediste (la demo general y una por plan), cada una con su
  video de motion graphics: guion plano a plano, qué muestra y qué no, qué se genera y qué es interfaz real. Está la
  **guía de motion** (tiempos, curvas, texto, luz, formatos, un **render cuadro por cuadro** con herramientas que ya
  tenemos y el **estándar de interacción premium** de las demos). Las doce escenas de la v1 quedan repartidas sin perder
  ninguna. Con tus decisiones del mismo día (D32–D36): las pantallas que faltan se construyen **completas**, Lumen va a
  **pantalla completa** con la vista de celular en un botón, y el local de Lumen se recrea con **fotos de GPT animadas con
  Higgsfield**, que hacemos juntos.
- **Qué quedó abierto:** construir todo lo que hoy no existe como pantalla (propietario, equipo, llamadas, documentación,
  asistente del CRM, consorcios, sedes, mapas, recreación del local): ahora son **seis lotes de demo, uno por plan**. La
  demo de Lumen vive en Eclipse-Web y hay que llevarla a `roofy` (3.5); el enlace suma el parámetro `plan`; el acceso a
  Higgsfield (no aparece en el directorio de conectores) y a la generación de fotos con GPT (cuenta de Ignacio) está por
  resolver; nada se cotizó todavía.
- **Qué necesita el OK de Ignacio:** aprobar la dirección, las siete fichas y el camino de §8; los topes de gasto de 3.2
  (fotos), 3.3 (Higgsfield) y 3.4 (voz) cuando lleguen. Después sigue **3.5 · Base en `roofy`** (Sonnet · high).

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Rama y HEAD | `claude/eclipse-v3-inventory-audit-2ukttn` = `main` `923081b`; `git status` limpio |
| Qué se corrió | lecturas; capturas de la demo de Lumen con el Chromium preinstalado (export local de Eclipse-Web); verificación de que hay `ffmpeg`, `ffprobe`, Playwright y Chromium; ningún build ni test (documental) |
| Opus | Una intervención, este lote: dirección creativa (lo que la política reserva a Opus) |
| Gasto | USD 0 |

## 2. Decisiones de Ignacio registradas (27/10/2026)

| # | Decisión | Dónde queda |
|---|---|---|
| **D28** | Cada plan tiene su propia demo, abierta desde «Ver con guía» con un botón «Ver demo de <plan>»; muestra lo que el plan suma, porque no todo se muestra igual para todos | Biblia v2 §2 y §5 |
| **D29** | Además, una **demo general** de todos los planes cuya entrada ofrece «Ver con guía» y «Ver por mi cuenta»; **cada demo lleva un video de motion graphics** (siete en total) | Biblia v2 §2, §5; guía de motion |
| **D30** | Modelos: **Opus high** donde se juega la calidad (dirección, kit premium, las seis demos, fotos, Higgsfield y los cinco videos); **Sonnet** en la base de `roofy`, la voz y el QA (con la revisión final de Opus) | §8 y matriz 0.4 |
| **D31** | Un lote por pieza, **con un piloto primero** que fija el estilo antes de replicarlo; no las siete juntas | §8 (Ignacio pidió el camino y autorizó 3.1 sobre él; el orden se ajustó, ver §8) |
| **D32** | Recreación del local de Lumen (Growth y apertura de la demo general): **fotos creadas con GPT y animadas con Higgsfield**, para una entrada única e inmersiva | Biblia v2 §3, §5 (P2, P0), §7–§8; lotes 3.2 y 3.3 |
| **D33** | **Todas las pantallas que faltan se construyen completas, desde cero**, para salir a vender con cada plan mostrando todo lo que incluye (reemplaza «una pantalla por capacidad») | §6 y §8 (seis lotes de demo, uno por plan) |
| **D34** | **Estándar de interacción premium** en todas las demos: por ejemplo, el chat tarda en responder, muestra «Pensando la respuesta…» con un pulso y escribe de a poco | Guía de motion §12; lote 3.5b |
| **D35** | **Lumen a pantalla completa en cada demo**; la vista de celular se abre con un botón abajo a la derecha de la barra inferior y es interactiva (en un teléfono se invierte) | Biblia v2 §2; lote 3.5 |
| **D36** | **Higgsfield se hace con Ignacio presente:** al llegar a 3.3 se le avisa antes de empezar | §8; lote 3.3 |

## 3. Direcciones evaluadas (una sola sesión, sin renders)

Puntaje de 1 a 5, con los criterios del prompt más honestidad y mantenimiento (siete piezas, tres idiomas).

| Criterio | 1 · Realismo editorial (fotorrealismo IA en todas las piezas) | **2 · Instrumento y ventana** (interfaz real + IA solo enmarcada) | 3 · Recorrido lúdico (personajes, gamificación) |
|---|---|---|---|
| Coherencia Eclipse/Lumen | 3 | **5** | 2 (rompe el tono premium) |
| Claridad comercial | 3 (muestra ambiente, no producto) | **5** (muestra la capacidad trabajando) | 3 |
| Control del visitante | 4 | **5** | 4 |
| Continuidad entre piezas | 2 (deriva generativa en siete piezas) | **5** (render determinista) | 4 |
| Costo | 1 (decenas de clips) | **4** (26 s generados: tour y local; 31 s con una toma vertical extra) | 3 |
| Móvil | 3 | **4** (9:16 compuesto aparte) | 4 |
| Honestidad | 2 (el video sugiere funciones que no existen) | **5** | 4 |
| Mantenimiento (precios, textos, idiomas) | 1 | **5** (se vuelve a renderizar desde el código) | 3 |
| **Total** | 19 | **38** | 27 |

**Elegida: 2 · instrumento y ventana.** Eclipse es el instrumento que lee el negocio; la interfaz de Lumen es lo que se
ilumina; lo generado entra como una ventana rotulada. **Descartes:** la 1 porque multiplica el gasto y la deriva
generativa por siete y vende ambiente en lugar de producto; la 3 porque choca con la dirección «Efemérides» (precisa,
editorial) y con el público: dueños de inmobiliarias que evalúan una herramienta de trabajo.

## 4. Arquitectura

| Criterio | A · Clips entre pantallas | B · 3D navegable | C · Híbrida con el host actual | **C + R · Híbrida con render determinista** |
|---|---|---|---|---|
| Calidad visual | Alta en planos, cortes visibles | Alta solo con modelado excelente | Alta | **Alta, y la interfaz se ve nítida** |
| Desarrollo | Bajo–medio | Alto | Medio | Medio (más la página de render) |
| Generación | Muchos clips | Modelos y texturas | 2 clips | **26 s (31 s con la toma vertical extra)** |
| Mantenimiento | Re-exportar clips | Alto | Bajo–medio | **Bajo: se re-renderiza solo** |
| Móvil | Bueno con posters | Costoso | Bueno | **Bueno: 9:16 propio** |
| Accesibilidad | Buena si la navegación está afuera | Exige HTML equivalente | Alta | **Alta: transcripción + demo equivalente** |
| Próximos rubros | Reusa host | Rehacer | Reusa contratos | **Reusa contratos y la fábrica de videos** |

**Recomendación: C + R.** Se mantiene el reveal WAAPI, GSAP para el motion de la interfaz y OGL solo en el hero; no se
agrega Three.js. Lo nuevo es **R**: una página de render (solo desarrollo, en `roofy`) que mueve la línea de tiempo
cuadro por cuadro con Playwright, compone lo generado con `ffmpeg` y renderiza la música y los efectos del propio motor
del sitio sin conexión (`OfflineAudioContext`, ya soportado en `lib/sound/engine.ts`). Detalle en la guía de motion §7.

## 5. Las siete piezas (resumen)

| Pieza | Lote | Duración | Qué muestra | Se genera con IA |
|---|---|---|---|---|
| **P1 Contact** (piloto) | V1 | 35 s | Web, CRM, chat guiado con botones, marca | Nada |
| **P2 Growth** | V2 | 40 s | Tour de 15 s del inmueble, imágenes y motion, propietario, mapas y métricas, Academy, seguimientos | **Fotos (GPT) animadas con Higgsfield: tour de 15 s y llegada al local** |
| **P3 Escalar** | V3 | 40 s | Coordinación del equipo, campaña 16:9 + 9:16, agente de voz, kit de tours | Nada nuevo (reusa el tour); voz con licencia |
| **P4 Hípergrowth** | V4 | 35 s | Intelligence por canal y motivo, recomendaciones con fuente, documentación | Nada |
| **P5 Deluxe** | V4 | 35 s | Asistente dentro del CRM (guionado), administración de consorcios con marca | Nada |
| **P6 Partner** (propuesta) | V4 | 30 s | Sedes con permisos y visión consolidada, revisión mensual | Nada |
| **P0 Demo general** | V5 | 65 s | Eclipse → llegada → escalera de los seis planes → «¿Cómo la querés ver?» | Nada propio (reusa) |

Reglas de las siete: el precio **no** va dentro del video (está en el HTML de al lado), los **cupos tampoco** (son
propuestas y no se publican), y cada pieza filma solo lo que su plan incluye.

## 6. Brechas: lo que hay que construir (D33: completo)

La demo de Lumen hoy cubre el CRM (Hoy, Consultas, Pipeline, Visitas, Seguimientos, Propiedades) y el sitio con su chat.
El resto no existe como pantalla (`catalogo-estateos.v3.json`, campo `evidence`). Por D33 **se construye completo**, en
el lote de demo de cada plan (§8).

| Plan | Hay que construir | Lote |
|---|---|---|
| Todos | Lumen en `roofy` a pantalla completa con la barra inferior y la vista de celular en un botón (D35), entrada «¿Cómo la querés ver?», demo por plan con áreas bloqueadas, reproductor, parámetro `plan` en el enlace | 3.5 |
| Todos | Kit de interacción premium (D34) | 3.5b |
| Contact | Chat del sitio presentado como **chat guiado** (D20), CRM completo (contactos, oportunidades, agenda, tareas, historial, roles básicos), ficha web completa, entregables de la puesta en marcha de marca | 3.6 |
| Growth | Recreación inmersiva del local (D32), panel del propietario, mapas y métricas, Academy inicial, archivo privado por inmueble, galería de producción mensual, seguimientos automáticos | 3.7 |
| Escalar | Tablero del equipo (reparto, carga, metas, conversiones, estancadas), campañas 16:9 y 9:16, agente de voz con llamada y transcripción, kit de tours, borradores de contratos | 3.8 |
| Hípergrowth | Intelligence (por canal, motivos de pérdida, recomendaciones explicables), documentación de operaciones (sin asesoramiento jurídico) | 3.8b |
| Deluxe | Asistente dentro del CRM (con fuentes y confirmación antes de modificar), administración de consorcios (unidades, expensas, reclamos, comunicaciones) | 3.8c |
| Partner | Varias sedes con permisos y visión consolidada, revisión mensual | 3.8d |

Todo con datos ficticios y acciones locales, rotulado «Demo». Lo que se vende sigue siendo «objetivo»
(`target_not_available`) hasta que el producto real exista: una demo completa no es el producto.

## 7. Costos

Nada autorizado. Tasas de la v1 (no validadas hoy): tour de 15 s USD 2,16–3,09 por intento; con todo (tour, local y la toma vertical) y dos
intentos, ≈ USD 8,93–12,75 de video, más fotos y voz a cotizar (biblia v2 §8). Las fotos con GPT tienen su propio costo, a cotizar según la cuenta de Ignacio. El gate de gasto de 3.2, 3.3 y 3.4 pide
tope en USD y tu OK.

## 8. Camino de la Fase 3 (con D32–D36)

| # | Lote | Modelo · esfuerzo | Entrega | Gasto | Decisión de Ignacio |
|---|---|---|---|---|---|
| 1 | **3.1** Dirección | Opus · high | Este lote | No | Aprobar |
| 2 | **3.5** Base en `roofy` | Sonnet · high | Lumen en `roofy` a pantalla completa, barra inferior con la vista de celular (D35), entrada «¿Cómo la querés ver?», demo por plan con áreas bloqueadas, reproductor, parámetro `plan` en el enlace (los dos repos) | No | — |
| 3 | **3.5b** Kit de interacción premium | Opus · high | Pensando, escribiendo, respuesta progresiva, carga, confirmación, error y éxito (D34) | No | — |
| 4 | **3.6** Demo Contact | Opus · high | Web, ficha, chat guiado, CRM completo y puesta en marcha de marca, con el kit | No | **¿Es premium?** (control de estilo de las demos) |
| 5 | **V1** Video de Contact + fábrica de videos | Opus · high | Render cuadro por cuadro, audio sin conexión, subtítulos, posters, manifest y el video de Contact | No | **¿Es premium?** (control de estilo de los videos) |
| 6 | **3.2 (A1)** Fotos con GPT | Opus · high | Prompts, referencias y revisión de las fotos del local de Lumen y de Los Aromos 88 | **Sí (gate)** | Tope y quién genera |
| 7 | **3.3 (A2)** Animación con Higgsfield | Opus · high | Acceso (conector, skill oficial o API), cotización real y clips: llegada, umbral y tour de 15 s. **Con Ignacio presente (D36)** | **Sí (gate)** | Tope en USD |
| 8 | **3.4 (A3)** Voz y sonido | Sonnet · medium | Voces con licencia para el agente de Escalar y locuciones opcionales | **Sí (gate)** | Elegir la voz |
| 9 | **3.7** Demo Growth | Opus · high | Recreación inmersiva del local, propietario, mapas y métricas, Academy, archivo, producción mensual, seguimientos | — | Aprobar |
| 10 | **3.8** Demo Escalar | Opus · high | Equipo, campañas, agente de voz, kit de tours, borradores de contratos | — | Aprobar |
| 11 | **3.8b** Demo Hípergrowth | Opus · high | Intelligence y documentación de operaciones | No | Aprobar |
| 12 | **3.8c** Demo Deluxe | Opus · high | Asistente del CRM y administración de consorcios | No | Aprobar |
| 13 | **3.8d** Demo Partner | Opus · high | Varias sedes y revisión mensual | No | Aprobar |
| 14 | **V2** Video de Growth | Opus · high | Con la recreación del local y el tour | — | Aprobar |
| 15 | **V3** Video de Escalar | Opus · high | Con campaña y llamada | — | Aprobar |
| 16 | **V4** Videos de Hípergrowth, Deluxe y Partner | Opus · high | Tres videos (se separan si alguno pierde calidad) | No | Aprobar |
| 17 | **V5** Video general | Opus · high | Eclipse, llegada al local, los seis planes y la elección | No | Aprobar |
| 18 | **3.9** QA y lanzamiento | Sonnet · high + O2 Opus · high | QA de todo en móvil y escritorio, plan de lanzamiento y rollback | No | **OK final** (quita `noindex`) |

Los antiguos 3.6 (CRM), 3.7 (propiedades), 3.8 (Intelligence), 3.8b y 3.8c (pantallas faltantes) se reparten en las seis
demos por plan; los números 3.6–3.8d se reutilizan para ellas. Orden: la base (3.5 → 3.5b → 3.6 → V1) fija los dos
estilos; 3.2 → 3.3 y 3.4 corren en paralelo cuando estén los topes; cada demo de plan va después de 3.6 (Growth necesita
3.3; Escalar, 3.4); cada video después de su demo y de V1; V5 al final. Dependencias completas en la matriz 0.4.

## 9. Criterios de aceptación del prompt (§12)

| Criterio | Estado |
|---|---|
| Las escenas tienen objetivo, disparador, duración, composición, cámara, luz, inicio/final, prompt, audio, transición, fallback, desktop/móvil, aprobación y costo | **Cumple, adaptado a D29:** las doce escenas de la v1 conservan sus fichas en Notion y se reparten en las piezas (biblia v2 §3); cada una de las siete piezas tiene esos campos (comunes + ficha) y su guion plano a plano |
| Arquitecturas A/B/C comparadas en siete criterios | Cumple (§4), con la variante C + R |
| El shotlist mantiene fachada y recepción como anclas | Cumple (biblia v2 §6; P2 y P0) |
| La selección de áreas no es un scroll obligado | Cumple (biblia v2 §2: índice, guía o exploración libre) |
| El uso de Opus se justifica por entregable | Cumple (G0 y D30) |
| Cada afirmación de funcionamiento tiene evidencia o se rotula | Cumple: render sin conexión (`engine.ts`), herramientas presentes, capacidades con su `evidence` del catálogo; lo que no existe está en §6 |
| No hay gastos, publicaciones ni cambios de alcance implícitos | Cumple: USD 0; el cambio de alcance es explícito (D28–D31) |
| Se preservó el contenido previo vigente | Cumple: la v1 se conserva y su reparto está documentado |

## 10. Riesgos y rollback

- **Seis demos completas es mucho trabajo (D33).** Mitigación: un lote por plan, el control de estilo en Contact antes de
  replicar, y el alcance de cada demo listado en §6.
- **Lumen en dos repos** mientras el selector de Eclipse siga abriendo la demo vieja (D11). Mitigación: Eclipse-Web queda
  como respaldo sin cambios hasta 3.9; 4.3 decide la extracción común.
- **Que el piloto no llegue a premium.** Es para eso: se corrige en V1 antes de multiplicar.
- **Deriva del tour generado** (la casa cambia entre tomas). Mitigación: tres fotos aprobadas como imagen inicial,
  máximo dos intentos por toma y corte honesto en lugar de pagar otro render.
- **Rollback:** documental; revertir el commit. La biblia v1 sigue intacta en Notion.

## 11. Qué necesita el OK de Ignacio

1. **Aprobar la dirección** (instrumento y ventana), las siete fichas y el camino de §8.
2. Cuando lleguen: el **tope y quién genera** las fotos con GPT (3.2), el **acceso y el tope** de Higgsfield (3.3, con
   Ignacio presente) y la **voz** (3.4).

## 12. Handoff

Habilita **3.5 · Base en `roofy`** (Sonnet · high): traer Lumen a `roofy` a pantalla completa con la barra inferior y la
vista de celular en un botón (D35), entrada «¿Cómo la querés ver?», demo por plan con áreas bloqueadas «Desde <plan>»,
reproductor con poster y transcripción, chat guiado en Contact y el parámetro `plan` en el contrato de enlace (los dos
repos, fixture compartido). No autoriza compras, generación ni publicación.
