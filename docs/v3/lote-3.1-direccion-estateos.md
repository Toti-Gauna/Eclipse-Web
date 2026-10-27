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
  **guía de motion** (tiempos, curvas, texto, luz, formatos y un **render cuadro por cuadro** con herramientas que ya
  tenemos, sin dependencias ni licencias nuevas) y las doce escenas de la v1 repartidas sin perder ninguna. Lo único que
  se genera con IA es el **tour de 15 s de Los Aromos 88** (Growth), y la campaña de Escalar lo reutiliza.
- **Qué quedó abierto:** muchas demos por plan **no tienen hoy una pantalla que filmar** (panel del propietario, equipo,
  llamadas, documentación, asistente del CRM, administración de consorcios, sedes): van a dos lotes nuevos, **3.8b y
  3.8c**. Además, la demo de Lumen vive en Eclipse-Web y hay que llevarla a `roofy` (3.5), el contrato de enlace suma el
  parámetro `plan`, y nada se cotizó todavía en la cuenta real.
- **Qué necesita el OK de Ignacio:** aprobar la dirección y las siete fichas; decidir **D32** (recreación del local con
  fotos fijas o con clips); confirmar el **orden ajustado**, que pone 3.5 antes del piloto V1 (§8). Después sigue
  **3.5 · Integración base en `roofy`** (Sonnet · high).

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
| **D30** | Modelos: **Opus high** en 3.1, 3.2, 3.3 y en los videos V1–V5 (calidad visual y gasto); **Sonnet** en integración y áreas (3.5–3.8c, 3.4), y en 3.9 con la revisión O2 de Opus | §8 y matriz 0.4 |
| **D31** | Un lote por pieza, **con un piloto primero** que fija el estilo antes de replicarlo; no las siete juntas | §8 (Ignacio pidió el camino y autorizó 3.1 sobre él; el orden se ajustó, ver §8) |
| **D32** *(propuesta, a decidir)* | Recreación del local de Lumen (Growth y apertura de la demo general): **fotos fijas por defecto**; los clips de 6 s y 5 s de la v1 solo con gate de gasto y después del piloto | Biblia v2 §3, §5 (P2, P0), §8 |

## 3. Direcciones evaluadas (una sola sesión, sin renders)

Puntaje de 1 a 5, con los criterios del prompt más honestidad y mantenimiento (siete piezas, tres idiomas).

| Criterio | 1 · Realismo editorial (fotorrealismo IA en todas las piezas) | **2 · Instrumento y ventana** (interfaz real + IA solo enmarcada) | 3 · Recorrido lúdico (personajes, gamificación) |
|---|---|---|---|
| Coherencia Eclipse/Lumen | 3 | **5** | 2 (rompe el tono premium) |
| Claridad comercial | 3 (muestra ambiente, no producto) | **5** (muestra la capacidad trabajando) | 3 |
| Control del visitante | 4 | **5** | 4 |
| Continuidad entre piezas | 2 (deriva generativa en siete piezas) | **5** (render determinista) | 4 |
| Costo | 1 (decenas de clips) | **4** (15 s generados; hasta 31 s con todo lo opcional) | 3 |
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
| Generación | Muchos clips | Modelos y texturas | 2 clips | **15 s (hasta 31 s con opcionales)** |
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
| **P2 Growth** | V3 | 40 s | Tour de 15 s del inmueble, imágenes y motion, propietario, mapas y métricas, Academy, seguimientos | **Tour de 15 s (3 tomas) y fotos** |
| **P3 Escalar** | V4 | 40 s | Coordinación del equipo, campaña 16:9 + 9:16, agente de voz, kit de tours | Nada nuevo (reusa el tour); voz con licencia |
| **P4 Hípergrowth** | V2 | 35 s | Intelligence por canal y motivo, recomendaciones con fuente, documentación | Nada |
| **P5 Deluxe** | V2 | 35 s | Asistente dentro del CRM (guionado), administración de consorcios con marca | Nada |
| **P6 Partner** (propuesta) | V2 | 30 s | Sedes con permisos y visión consolidada, revisión mensual | Nada |
| **P0 Demo general** | V5 | 65 s | Eclipse → llegada → escalera de los seis planes → «¿Cómo la querés ver?» | Nada propio (reusa) |

Reglas de las siete: el precio **no** va dentro del video (está en el HTML de al lado), los **cupos tampoco** (son
propuestas y no se publican), y cada pieza filma solo lo que su plan incluye.

## 6. Brechas: lo que hay que construir para poder filmar

La demo de Lumen hoy cubre el CRM (Hoy, Consultas, Pipeline, Visitas, Seguimientos, Propiedades) y el sitio con su chat.
Todo lo demás no existe como pantalla (`catalogo-estateos.v3.json`, campo `evidence`).

| Pieza | Falta | Lote |
|---|---|---|
| Contact | Que el chat del sitio se presente como **chat guiado** (D20), no como asistente 24/7; los seguimientos por WhatsApp pasan a Growth en la lente del plan | 3.5 |
| Todas | Lumen dentro de `roofy`, lente por plan (áreas activas o bloqueadas), entrada «¿Cómo la querés ver?», reproductor, parámetro `plan` en el contrato de enlace | 3.5 |
| Growth | **Panel del propietario** (`owner_panel`) | 3.8b |
| Escalar | **Tablero del equipo** (`team_coordination`), **registro del agente de voz** con transcripción (`voice_agent`) | 3.8b |
| Hípergrowth | **Documentación de operaciones** (`compliance_docs`, sin asesoramiento jurídico) | 3.8c |
| Deluxe | **Asistente del CRM** guionado (`crm_chatbot`) y **administración de consorcios** (`administration`) | 3.8c |
| Partner | **Sedes** con visión consolidada (`multi_site`) | 3.8c |

Criterio para 3.8b y 3.8c: **una pantalla funcional por capacidad**, con datos ficticios y acciones locales, rotulada;
no un producto completo. Lo que se vende sigue siendo «objetivo» (`target_not_available`) hasta que exista de verdad.

## 7. Costos

Nada autorizado. Tasas de la v1 (no validadas hoy): tour de 15 s USD 2,16–3,09 por intento; con todo lo opcional y dos
intentos, ≈ USD 8,93–12,75 de video, más fotos y voz a cotizar (biblia v2 §8). El gate de gasto de 3.2, 3.3 y 3.4 pide
tope en USD y tu OK, después del piloto V1.

## 8. Camino de la Fase 3 (ajustado)

**Cambio respecto de lo que te mostré:** el piloto V1 no puede ir antes de 3.5, porque filma la demo de Lumen **dentro de
`roofy`**, con la lente del plan, y Lumen todavía vive en Eclipse-Web. El punto de control del estilo sigue antes de
replicar y antes de gastar.

| # | Lote | Modelo · esfuerzo | Entrega | Gasto | Tu decisión |
|---|---|---|---|---|---|
| 1 | **3.1** Dirección | Opus · high | Este lote | No | Aprobar la dirección y D32 |
| 2 | **3.5** Integración base | Sonnet · high | Lumen en `roofy`, entrada general, lente por plan, reproductor, `plan` en el contrato | No | — |
| 3 | **V1** Sistema de motion + Contact | Opus · high | Render cuadro por cuadro, audio sin conexión, subtítulos, posters, manifest y **el video de Contact** | No | **¿Es premium?** (punto de control) |
| 4 | **3.6** CRM y flujos | Sonnet · high | Consulta → visita → seguimiento completo | No | — |
| 5 | **3.7** Propiedades | Sonnet · medium | Ficha de Los Aromos 88 con lugar para el tour | No | — |
| 6 | **3.8** Intelligence | Sonnet · high | Mapa con fuente o tabla, datos ficticios | No | Mapa o tabla |
| 7 | **3.8b** Pantallas Growth + Escalar | Sonnet · high | Propietario, Equipo, Llamadas | No | Alcance |
| 8 | **3.8c** Pantallas Hípergrowth + Deluxe + Partner | Sonnet · high | Documentación, Asistente del CRM, Consorcios, Sedes | No | Alcance |
| 9 | **3.2** Fotos clave | Opus · high | 3 fotos del inmueble (+ 4 del local si D32) | **Sí (gate)** | Tope en USD |
| 10 | **3.3** Higgsfield | Opus · high | Tour de 15 s (+ clips del local si D32) | **Sí (gate)** | Tope en USD |
| 11 | **3.4** Voz y sonido | Sonnet · medium | Llamada de Escalar, locuciones opcionales | **Sí (gate)** | Plan de voz |
| 12 | **V2** Hípergrowth + Deluxe + Partner | Opus · high | Tres videos | No | Aprobar |
| 13 | **V3** Growth | Opus · high | Video con el tour | — | Aprobar |
| 14 | **V4** Escalar | Opus · high | Video con campaña y voz | — | Aprobar |
| 15 | **V5** Demo general | Opus · high | Video general | No | Aprobar |
| 16 | **3.9** QA y lanzamiento | Sonnet · high + O2 Opus · high | QA de las siete piezas, plan de release y rollback | No | **OK final** (quita `noindex`) |

Los lotes 9–11 pueden adelantarse en paralelo con 4–8, **siempre después de aprobar V1**. Dependencias completas en la
matriz de `lote-0.4-sdd-control-financiero.md`.

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

- **Las pantallas nuevas (3.8b/3.8c) crecen como productos.** Mitigación: una pantalla por capacidad y alcance aprobado
  antes de empezar.
- **Lumen en dos repos** mientras el selector de Eclipse siga abriendo la demo vieja (D11). Mitigación: Eclipse-Web queda
  como respaldo sin cambios hasta 3.9; 4.3 decide la extracción común.
- **Que el piloto no llegue a premium.** Es para eso: se corrige en V1 antes de multiplicar.
- **Deriva del tour generado** (la casa cambia entre tomas). Mitigación: tres fotos aprobadas como imagen inicial,
  máximo dos intentos por toma y corte honesto en lugar de pagar otro render.
- **Rollback:** documental; revertir el commit. La biblia v1 sigue intacta en Notion.

## 11. Qué necesita el OK de Ignacio

1. **Aprobar la dirección** (instrumento y ventana) y las siete fichas, o corregir las que quieras.
2. **D32:** recreación del local con fotos fijas (USD 0 de video) o con los dos clips de la v1 (gate de gasto después de V1).
3. **Confirmar el orden ajustado** (3.5 antes de V1).

## 12. Handoff

Habilita **3.5 · Integración base en `roofy`** (Sonnet · high): traer Lumen a `roofy`, entrada «¿Cómo la querés ver?»,
lente por plan con áreas bloqueadas «Desde <plan>», reproductor con poster y transcripción, chat guiado en la lente de
Contact, y el parámetro `plan` en el contrato de enlace (los dos repos, fixture compartido). No autoriza compras,
generación ni publicación.
