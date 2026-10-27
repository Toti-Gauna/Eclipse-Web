# Lote V1 · Video de Contact (segundo corte, método Kinetic Studio)

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-opus-5-5`, esfuerzo `high` · **Ramas:** `roofy` y Eclipse-Web, ambas `claude/eclipse-v3-inventory-audit-2ukttn` · **Resultado:** el tráiler **P1 · Contact** está rehecho al modo Kinetic Studio: 56 s a 120 BPM, en 16:9 y 9:16 (imagen en español), con subtítulos es/en/pt, transcripción, posters, música y manifest. Explica, capítulo por capítulo, todo lo que recibe quien contrata Contact. **No se publicó nada y no se gastó nada.**

**Por qué hay un segundo corte:** Ignacio rechazó el primero (27/10/2026). Era una demo filmada con un reloj simulado: «una presentación bastante pobre», sin los componentes reconstruidos de Kinetic Studio y sin explicar lo que el cliente recibe (la web profesional, el CRM completo, el rebranding). Confirmó la fuente: **según Notion**, Contact = web, CRM completo, chat guiado y rebranding; el WhatsApp automático va en el video de Growth y el agente de voz en el de Escalar. Las reglas para que esto no se repita en V2–V5 están en la **guía de motion §0**, que manda sobre el resto de la guía.

> **Música (27/10/2026, después del segundo corte).** Ignacio: «le falta música, no tiene alma». Medido: el audio
> existía, pero los versos (24 de 56 s) no tenían melodía y el colchón sonaba al 0,9 %; era percusión y campanitas.
>
> Ahora hay una partitura propia, tocada por una orquesta propia en `roofy` (`components/video/score/`): piano eléctrico,
> cuerdas, voz solista con vibrato y eco, bajo, arpegio, glockenspiel y batería.
> - Re mayor, I–V–vi–IV, con el motivo de seis notas de la marca como gancho.
> - Cada golpe de palabra cae en un bombo.
> - Los efectos de interfaz van ≈ 9 dB por debajo.
> - Una prueba nueva exige melodía en cada sección con imágenes, armonía bajo cada segundo y silencio al final.
> - Re-render: 16:9 5,61 MB y 9:16 2,79 MB, los dos a −16 LUFS. 102 pruebas.

## 0. Informe en tres líneas

- **Qué cambió:**
  - **Reglas (Eclipse-Web):**
    - Guía de motion §0: método Kinetic y «explicar todo lo que el plan entrega», un capítulo por entrega.
    - Biblia P1 reescrita.
    - `roofy/CLAUDE.md` y `docs/video-factory.md` con el método.
    - Una prueba que falla si un video omite un área de su plan o muestra una que no incluye.
  - **Kit de tráiler (`roofy`):**
    - Componentes de EstateOS reconstruidos para el video, con los datos y textos reales de Lumen.
    - Una línea de tiempo GSAP en pausa que se recorre cuadro por cuadro, con golpes, capítulos, titulares, lupa, dedo, destello y el borde que pasa.
    - El motor de sonido de Kinetic, copiado byte a byte.
  - **Video de Contact:**
    - Golpe de entrada («¿Consultas por todos lados? ¿Planillas que nadie sigue?»).
    - Tu web (sitio, propiedades, ficha, visita agendada).
    - Chat guiado.
    - CRM completo, siete módulos.
    - Puesta en marcha: kit de marca, de plantilla a la marca, auditoría de redes, hooks, videos y guía.
    - Resumen y cierre.
- **Qué quedó abierto:**
  - Sin locución (la voz es del lote 3.4, con gasto).
  - Imagen solo en español; inglés y portugués salen con el mismo comando cuando Ignacio apruebe.
  - La pantalla «Hoy» del CRM no tiene capítulo propio: resume las otras áreas, que sí se muestran.
  - El permiso de escritura sobre `kinetic-studio` fue denegado. No se tocó ese repo; el método se copió a `roofy`.
- **Qué necesita el OK de Ignacio:**
  - Ver los dos cortes y decidir si este es el estilo premium de los videos.
  - Aprobar los PRs (`roofy`#4 y Eclipse-Web#33).
  - Después siguen las compuertas de gasto: 3.2 (fotos con GPT), **3.3 Higgsfield (con Ignacio presente: le aviso antes)** y 3.4 (voz).

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Fuentes | Notion (lo que incluye Contact), `Toti-Gauna/kinetic-studio` en `30f1280` (motor, golpes, lupa, partitura, storyboard), biblia, guía de motion, demo de Lumen en `roofy` |
| Herramientas | GSAP (ya en el stack), Chromium + Playwright preinstalados, `ffmpeg` y `ffprobe` |
| Gasto | USD 0. Sin dependencias nuevas, sin servicios externos |

## 2. El método (guía de motion §0)

| Pieza (`roofy`) | Qué hace |
|---|---|
| `components/video/ui/` | Ventana, celular y dedo; sitio, ficha y reserva, chat, CRM (siete paneles), tarjetas lupa, kit de marca, auditoría, hooks, videos y guía. La interfaz se dibuja ×1,3 en la ventana y ×1,2 en el celular para leerse a 720p |
| `components/video/moves.ts` | Golpes sobre paneles que barren el cuadro, etiqueta de capítulo, titular en el tiempo, lupa, toque, destello |
| `components/video/films/contact/` | `STORYBOARD.md`, `script.ts` (tiempos y palabras, puro), `ContactFilm.tsx` (coreografía), `partitura.ts` (120 BPM, Re mayor, un motivo de seis notas por las seis fases) |
| `components/video/kinetic/` | Motor de sonido de Kinetic (copia byte a byte, `PROCEDENCIA.md`) y su conexión a la línea de tiempo; mezcla sin conexión con semilla |
| `scripts/render-video.mjs` | Cada cuadro es un `seek(t)` → H.264; mezcla → −16 LUFS / −1,5 dBTP; poster; subtítulos; manifest; `--stills` para la revisión |

## 3. El video de Contact (56 s)

| Tiempo | Escena | Texto en pantalla |
|---|---|---|
| 0:00–0:04 | Golpe | «¿Consultas por todos lados? ¿Planillas que nadie sigue?» |
| 0:04–0:06 | Marca: glifo 1/6, EstateOS · Contact | |
| 0:06–0:14 | 1 · Tu web | «Una web profesional.» · «Cada propiedad, con su ficha.» · «Te piden visitas desde ahí.» |
| 0:14–0:18 | 2 · Chat guiado | «Un chat guiado, siempre.» · «La consulta llega completa.» |
| 0:18–0:20 | Golpe | «Y del otro lado, tu CRM.» |
| 0:20–0:34 | 3 · CRM completo (consultas por canal, contacto con historial, pipeline, agenda, tareas, propiedades, equipo y permisos) | Un titular por módulo |
| 0:34–0:36 | Golpe | «Y lo ponemos en marcha.» |
| 0:36–0:48 | 4 · Puesta en marcha (kit, de plantilla a la marca, auditoría de perfiles, hooks, videos y guía) | «Tu marca, en todo.» · «De plantilla a tu marca.» · «Revisamos tus redes.» · «Hooks, videos y una guía.» |
| 0:48–0:52 | Resumen | «Tu web. Tu CRM. Chat guiado. Tu marca.» |
| 0:52–0:56 | Cierre: EstateOS · Contact · Producto base completo (poster) | |

Fuera del video: el WhatsApp automático, la voz, la IA, el propietario y los mapas. Tampoco hay precios ni cupos del plan: los precios que se ven son de las propiedades ficticias de Lumen.

## 4. Revisión cuadro a cuadro (antes del render completo)

Hojas de contacto con un cuadro por segundo, en los dos formatos. Defectos encontrados y corregidos:

1. El golpe inicial reaparecía de 6 a 18 s.
2. Las tarjetas lupa se encogían a su palabra más larga.
3. La interfaz quedaba ilegible a 720p.
4. La reserva se cortaba contra el borde de la ventana.
5. Las burbujas del chat salían sin relleno.
6. La ventana quedaba vacía entre módulos del CRM.
7. En el pipeline, las columnas eran angostas y la tarjeta de Carolina caía fuera de lugar.
8. La agenda no llegaba a las 18:30.
9. La auditoría y la guía operativa quedaban fuera de cuadro.
10. El 9:16 estaba cargado arriba (ahora va en la banda central).

La prueba de lectura encontró dos textos en inglés demasiado largos para su tiempo y se acortaron.

## 5. Criterios (checklist §10 de la guía, actualizado por §0)

| Criterio | Estado | Evidencia |
|---|---|---|
| Explica todo lo que el plan entrega, nada de lo que no incluye | Cumplido | Prueba contra la lente: cada área abierta de Contact aparece (salvo «Hoy», resumen); Seguimientos no |
| Componentes reconstruidos, línea de tiempo con `seek`, partitura a tempo | Cumplido | Prueba: partitura de 0 a 56 s sin huecos, en compases de 2 s; golpes y titulares en el tiempo |
| Lectura y subtítulos | Cumplido | Prueba en es/en/pt: cada titular ≥ su tiempo mínimo; subtítulos ≤ 2 líneas de 42, ≤ 15 car/s |
| Un ámbar, sello «Demo» en cada cuadro | Cumplido | Revisión de las hojas de contacto: el ámbar es solo el glifo de marca y cierre |
| Peso, audio, poster | Cumplido | §6 |
| Manifest, `catalogVersion` y hash del origen | Cumplido | Prueba del registro |
| Aprobación visual de Ignacio | **Pendiente** | Control de estilo de los videos |

## 6. Mediciones

| Archivo | Medida | Peso (objetivo) | Bitrate | Sonido | Poster |
|---|---|---|---|---|---|
| `contact-v1-es-16x9.mp4` | 1920 × 1080 · 30 fps · 56 s · H.264 High, CRF 20, AAC 128 | 5,62 MB (≤ 6 MB) | 842 kb/s | −16,1 LUFS · −1,5 dBTP | 12 KB |
| `contact-v1-es-9x16.mp4` | 720 × 1280 · 30 fps · 56 s · H.264 High, CRF 24, AAC 96 | 2,80 MB (≤ 3 MB) | 419 kb/s | −16,1 LUFS · −1,5 dBTP | 12 KB |

- **Imagen determinista:** en dos renders, 8 de 8 cuadros comparados fueron idénticos byte a byte.
- **Sonido:** dos mezclas del mismo origen difieren en 1 bit en el 0,04 % de las muestras (≈ −96 dBFS, inaudible). Es redondeo de coma flotante y el motor de Kinetic lo documenta. Por eso el manifest guarda el sha256 del archivo entregado.
- **Tiempo de render:** ≈ 2,5 min por formato (1.680 cuadros).

## 7. QA

**`roofy`:**
- `tsc` y `eslint` limpios.
- **101** pruebas verdes.
- `next build` verde: la página del tráiler no está en el export.
- `npm audit` sin vulnerabilidades.

**Navegador, contra el export:**
- A 1440 px (es) carga el corte 16:9: 56 s, poster, sin sonido, sin autoplay, `preload=none`, el precio al lado («Contact · USD 30/mes»).
- A 390 px (en) carga el 9:16 con el subtítulo inglés encendido.
- Sin desborde y consola limpia.

## 8. Riesgos y reversión

- **Peso del repo:** ≈ 8,4 MB por pieza en dos cortes. Si con siete piezas y tres idiomas molesta, los videos pasan a un almacenamiento aparte.
- **Cambios en Lumen:** el hash del origen ahora incluye los datos y los textos de Lumen. Si cambian, la prueba pide volver a renderizar.
- **Reversión:** revertir el commit de `roofy` vuelve al primer corte. El registro tiene un solo video.

## 9. Handoff

V2–V5 se hacen con el mismo kit: una carpeta en `components/video/films/<plan>/`. Cada una lleva:
- el storyboard primero, con un capítulo por lo que el plan suma (Growth: WhatsApp automático; Escalar: el agente de voz);
- `script.ts` con su `COVERS`, que la prueba compara con la lente;
- la coreografía y la partitura.

Antes vienen las compuertas de gasto 3.2, 3.3 (Higgsfield, con Ignacio presente: le aviso antes) y 3.4.
