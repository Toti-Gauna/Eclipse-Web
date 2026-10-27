# Guía de motion EstateOS v1

Lote 3.1 (27/10/2026). Contrato visual de los **siete videos de motion graphics** de EstateOS (la demo general y una por
plan) y de cómo se producen. La siguen V1–V5 y la revisa la O2 de 3.9. Manda sobre cualquier preferencia de un skill
(precedencia de `CLAUDE.md`); donde no dice nada, mandan el lote 1.4 y `components/demo-experience/motion.ts`.

Las fichas de cada pieza están en `biblia-estateos.v2.md`; el porqué, en `../lote-3.1-direccion-estateos.md`.

## 1. Tesis: instrumento y ventana

Eclipse es el **instrumento** que lee el negocio (noche, filetes de 1 px, lecturas en mono, el glifo de fase) y la
interfaz de Lumen es **lo que se ilumina** dentro de él. Cuando aparece material generado (el inmueble, el local), entra
como una **ventana** enmarcada con marcas de registro, nunca a sangre completa ni como si fuera el producto.

Seis reglas que no se negocian:

1. **El producto se muestra funcionando.** Cada plano de interfaz es la interfaz real de la demo, movida por sus propias
   acciones (los *beats* del store). Nada de pantallas inventadas, botones que no existen ni números de fantasía.
2. **Una idea por plano y un movimiento por plano.** Como mucho dos movimientos principales a la vez (regla del sitio).
3. **Un solo ámbar por cuadro.** El ámbar es la luz: el dato que importa, el glifo activo o el cierre. Lumen conserva
   piedra y cobalto; nunca se recolorea como Eclipse.
4. **La honestidad se ve.** «Demo · datos ficticios» en todos los cuadros; «Recreación IA» sobre todo material generado;
   «Llamada simulada · voz sintética» sobre el agente de voz.
5. **Sin precio ni cupos dentro del video.** El precio y el estado se leen en el HTML que rodea al reproductor, con la
   versión de catálogo vigente (regla de 3.1 §09). Los cupos son propuestas a medir y no se publican en ningún lado
   (`CLAUDE.md`). El video nombra el plan y lo que suma, no cantidades.
6. **Se entiende sin sonido.** Arranca en silencio con subtítulos; la voz es un extra que el visitante activa.

## 2. Tiempo

| Token | Valor | Uso |
|---|---|---|
| `cut` | 180–240 ms | Cambio de plano: corte seco en el tiempo fuerte o fundido corto. Nunca fundidos largos |
| `ui` | 180–240 ms, `EXPO_OUT` | Respuesta de la interfaz (tarjeta que se mueve, panel que entra) |
| `reveal` | 600–900 ms, `EXPO_OUT` | Ocultación: un disco o un borde descubre el plano (firma del sitio) |
| `readout` | 700–1100 ms | Números que ruedan como instrumento (`RollingNumber`/`CountUp`) |
| `hold-texto` | ≥ 1,2 s por línea de ≤ 6 palabras; 2,2 palabras/s como techo | Tiempo de lectura de un rótulo |
| `hold-plano` | 2,5–5 s | Duración de un plano de interfaz con una acción |
| `respiro` | 400–600 ms | Pausa después de una acción importante, antes del corte |
| `cámara` | deriva de 2–4 % del cuadro en todo el plano | Cámara virtual sobre la interfaz: avance o paneo lento, sin zoom continuo |

Curvas (las del sitio, sin inventar otras): `EXPO_OUT` `cubic-bezier(0.16, 1, 0.3, 1)` para entradas y respuestas;
`EXPO_IN_OUT` `cubic-bezier(0.87, 0, 0.13, 1)` para la luz que se abre o se cierra; `IN_OUT`
`cubic-bezier(0.65, 0, 0.35, 1)` para la cámara virtual; `--ease-soft` `cubic-bezier(0.33, 1, 0.68, 1)` para fundidos.
**Nunca `ease-in` en algo que entra.** Nada rebota.

## 3. Texto en el video

- **Tipografías:** Instrument Serif para **una** frase por pieza (el titular del problema); Geist para rótulos;
  Geist Mono para lecturas, horas, cantidades y el sello «Demo». Son las fuentes del sitio, ya en el repo.
- **Tamaños mínimos** (sobre el master): 16:9 1920×1080 → rótulo ≥ 36 px, lectura mono ≥ 28 px, titular serif 96–160 px;
  9:16 1080×1920 → rótulo ≥ 44 px, lectura ≥ 34 px.
- **Subtítulos:** WebVTT por idioma, ≤ 2 líneas, ≤ 42 caracteres por línea, ≤ 15 caracteres por segundo. Están
  encendidos por defecto en la web.
- **Zonas seguras:** 16:9 con 5 % de margen. 9:16 sin texto en el 12 % superior ni en el 20 % inferior (ahí la
  interfaz de WhatsApp o de redes tapa el video cuando se comparte).
- **El texto sale de los mensajes del sitio** (`messages/*`), nunca escrito a mano en el componente del video, y se
  renderiza por idioma. El primer idioma es español (es-AR); inglés y portugués se agregan sin re-dirigir.
- **Copy:** frases cortas, concretas, con números con unidad. Nada de «soluciones», «innovador», «potenciá».

## 4. Luz, color y composición

- **Fondo:** noche (`--void`/`--night`) del instrumento; Lumen ilumina en su piedra `#ECE8E1`, tinta `#141414`, cobalto
  `#2448C8` y arena `#D9CBB3`.
- **La interfaz va dentro de un marco** con `.ticks` y un filete de 1 px; nunca con un marco de laptop o de teléfono
  (regla de las demos del sitio).
- **Escalera de fases:** cada plan es una fase del eclipse en `PhaseGlyph` (`components/ui/PhaseGlyph.tsx`, que el sitio
  ya usa como progreso): Contact `1/6` → Growth `2/6` → Escalar `3/6` → Hípergrowth `4/6` → Deluxe `5/6` → Partner `1`
  (totalidad, con el anillo de diamante). Es el único símbolo de nivel y se repite en la demo general.
- **Un movimiento de cámara por plano**, verticales rectas, nada de inclinaciones de perspectiva sobre texto (se vuelve
  ilegible).
- **Sin gradientes decorativos ni brillos al azar:** la luz viene de un lado (la corona), como en el sitio.

## 5. Filmar la interfaz

- **Se filma la demo de verdad**, montada en una página de render, y se la mueve con sus *beats* (Simular: …) o con
  acciones del store. Si una acción no existe, no se finge en el video: se construye primero (3.6–3.8c).
- **Indicador de toque:** un anillo de 1 px que marca dónde actúa el visitante (no un cursor del sistema). Dura `ui`.
- **Datos:** solo las fixtures de Lumen (personas, inmuebles y zonas inventadas). Ningún dato de cliente real, del CRM
  interno ni de prospectos.
- **Cada pieza filma solo lo que su plan incluye.** Contact no muestra los seguimientos por WhatsApp (son de Growth)
  ni presenta el chat del sitio como IA: es un chat guiado con botones (D20).
- **Recortes:** se encuadra un panel a la vez. Si el texto de la interfaz queda chico para el formato, se recorta más
  cerca; no se agranda la fuente con zoom de imagen.

## 6. Formatos y entrega

| Ítem | 16:9 | 9:16 |
|---|---|---|
| Master | 1920×1080, PNG por cuadro (sin pérdida) | 1080×1920, ídem |
| Entrega web | H.264 High, yuv420p, `+faststart`, CRF ≈ 20 | 720×1280, mismo códec |
| Cuadros por segundo | 30 de base; **V1 mide si 60 hace falta** (temblor en paneos) y fija el valor | igual |
| Peso objetivo | plan ≤ 6 MB, general ≤ 10 MB | plan ≤ 3 MB, general ≤ 5 MB |
| Poster | WebP ≤ 200 KB (último cuadro del cierre) | ídem |
| Subtítulos y transcripción | WebVTT por idioma + transcripción que describe también lo que se ve | ídem |

El 9:16 es **una composición propia** (las vistas de celular de Lumen), no un recorte del 16:9. Si un peso objetivo no
se alcanza con calidad aceptable, se informa la medición y se decide con Ignacio; no se baja la calidad para cumplir
en papel.

**Manifest por archivo:** `assetId`, pieza, versión, idioma, relación, `sourceType` (render · generado · mixto),
licencia, consentimiento, `synthetic`, poster, ancho, alto, duración, fps, códec, bytes, `catalogVersion`, hash del
origen y `approvedAt`. Los prompts, el modelo y el costo de lo generado van en el registro privado de producción.

## 7. Render determinista (cómo se fabrica cada video)

Todo con herramientas que ya están en el entorno (Chromium y Playwright preinstalados, `ffmpeg` y `ffprobe`);
**ninguna dependencia nueva**.

1. **Página de render** en `roofy` (solo desarrollo, nunca en el export): monta la pieza con su línea de tiempo GSAP
   en pausa, en un idioma y una relación.
2. **Cuadro por cuadro:** Playwright avanza la línea de tiempo (`seek`) a cada cuadro y captura un PNG. No se graba la
   pantalla en tiempo real: así no hay cuadros perdidos y el resultado es idéntico cada vez.
3. **Material generado** (el tour del inmueble, el local) se compone con `ffmpeg` en tiempos fijos, dentro de la ventana
   que deja la página.
4. **Audio:** el motor de sonido del sitio ya puede renderizar sin conexión (`OfflineAudioContext` + `pump()`,
   `lib/sound/engine.ts`): la música y los efectos (`glint`, `whoosh`, `select`) se generan a WAV sin licencias
   nuevas. La voz, si se aprueba, se suma con *ducking* (música al 25 % con rampas de 300 ms, lote 1.4).
5. **Codificación** con `ffmpeg` según §6; `ffprobe` registra duración, fps, bitrate y peso en el manifest.
6. **Re-render:** si cambia un texto o el catálogo, se vuelve a correr el mismo comando. Una prueba compara la
   `catalogVersion` del manifest con la vigente y avisa si un video quedó viejo.

## 8. Sonido

- Música: la del sitio, renderizada sin conexión; nivel de mezcla −16 LUFS integrado, picos ≤ −1 dBTP.
- Efectos: los nombres existentes de `lib/sound/types.ts`, solo en acciones (nunca en cada corte).
- Voz: opcional, rioplatense neutra, sin imitar voces reales; ≤ 2,2 palabras/s. El agente de voz de Escalar usa voces
  sintéticas con licencia y lo dice en pantalla.

## 9. El reproductor en la web

- **Nunca arranca solo.** Poster + «Ver video» (y su duración). Si el navegador bloquea la reproducción, sigue el poster.
- **Sin sonido al empezar**, subtítulos encendidos, botón de sonido aparte.
- **Saltar** siempre visible; **un solo medio activo** por vez; se pausa y libera al salir o al ocultarse.
- **Movimiento reducido o ahorro de datos:** no se ofrece reproducción automática; poster + transcripción + la demo
  interactiva, que es equivalente.
- El precio y el CTA del plan están **al lado** del video, en HTML.
- No se descarga el video entero antes de que el visitante lo pida.

## 10. QA de cada video (checklist)

- [ ] Cuadros extraídos en cada cambio de plano y revisados: legibilidad, recortes, un ámbar, sellos «Demo» y
      «Recreación IA» presentes.
- [ ] `ffprobe`: duración, fps, bitrate y peso dentro del objetivo (o medición informada).
- [ ] Subtítulos sincronizados (± 100 ms) en cada idioma entregado; transcripción completa.
- [ ] Audio: −16 LUFS ± 1, picos ≤ −1 dBTP; sin efectos en cortes.
- [ ] Cada capacidad mostrada pertenece al plan de la pieza (o a uno inferior).
- [ ] Ningún precio, dato real o interfaz inventada dentro del video.
- [ ] Manifest completo y `catalogVersion` vigente.
- [ ] 9:16 compuesto aparte, con zonas seguras respetadas.
- [ ] Aprobación visual de Ignacio registrada.

## 11. Prohibido

Precios o cupos dentro del video · interfaz generada por IA · mapas o planos generados · personas reales o caras generadas ·
direcciones, barrios o edificios reales identificables · logos de terceros · métricas de redes inventadas · rebotes,
zooms continuos, giros de cámara, *speed ramps* · música sin licencia · arranque automático con sonido · texto
horneado que no salga de los mensajes del sitio.

## 12. Estándar de interacción premium en las demos (D34)

Las demos se sienten como un producto real, no como una maqueta. Lo construye el lote 3.5b como un kit y lo usan las seis
demos. Todo responde a una acción del visitante: **nada arranca solo**.

| Estado | Cómo se ve | Tiempo |
|---|---|---|
| **Pensando** (chat, asistente, agente) | «Pensando la respuesta…» con un pulso suave (escala 0,96–1 y opacidad, nunca rebote) junto al avatar o al campo | Demora variable 1,2–2,5 s según el largo de la respuesta; nunca idéntica dos veces seguidas |
| **Escribiendo** | Tres puntos con ritmo, o el texto apareciendo de a poco | Texto progresivo a 30–45 caracteres/s; se puede tocar para verlo completo |
| **Cargando** | Esqueleto con la forma final (no un spinner genérico) | Hasta 600 ms; si una vista carga más, el esqueleto se queda |
| **Acción optimista** | La tarjeta se mueve, el turno aparece, el estado cambia al instante; se confirma después | Respuesta 160 ms; confirmación 400–700 ms |
| **Confirmación** | Aviso breve abajo («Visita agendada · Vie 18:30») con su acción de deshacer cuando corresponde | Visible 3–4 s |
| **Éxito importante** | El destello (*glint*) del sitio, una sola vez | 600–900 ms |
| **Error simulado** | Mensaje claro con cómo seguir («No hay lugar a las 18:30. Probá 19:00.»), nunca un error técnico | — |
| **Vacío** | Una línea que dice qué hacer, con la acción a mano | — |

Reglas: un solo estado de espera visible a la vez; los tiempos varían (no robóticos) pero tienen techo; el sonido solo en
acciones (`select`, `success`) si el visitante lo activó; **movimiento reducido** = los mismos estados sin pulso ni
desplazamiento (texto «Pensando…» quieto, respuesta completa al terminar la demora); el asistente y el agente siempre
llevan su sello («Demostración guionada», «Llamada simulada»); ninguna demora bloquea salir, volver o cambiar de área.

**Implementación (lote 3.5b):** kit en `roofy/components/demos/kit` (`pace.ts`, `pacer.ts`, `interaction.tsx`), con su guía
`roofy/docs/kit-interaccion.md`. Los valores exactos viven en `PACE` (`pace.ts`); si cambian, cambia esta tabla.
