# Lote V1 · Video de Contact + fábrica de videos

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-opus-5-5`, esfuerzo `high` · **Ramas:** `roofy` y Eclipse-Web, ambas `claude/eclipse-v3-inventory-audit-2ukttn` (sobre 3.6) · **Resultado:** la fábrica de videos de EstateOS existe y el primer video, **P1 · Contact — «Ninguna consulta se pierde»**, está renderizado en 16:9 y 9:16 (es) con subtítulos en es/en/pt, posters, audio y manifest. Es el **control de estilo de los videos**: si Ignacio lo aprueba, V2–V5 se fabrican igual. **No se publicó nada y no se gastó nada.**

**Fuentes leídas:** `estateos/biblia-estateos.v2.md` §5 (ficha P1), `estateos/guia-motion.v1.md` (§1–§11), `lote-3.6-demo-contact.md` y el código de Lumen, del kit, del motor de sonido y del reproductor en `roofy`.

## 0. Informe en tres líneas

- **Qué cambió:**
  - **3.6 aceptado:** Ignacio aprobó el estilo de las demos («todos son premium, incluido Contact»).
  - **Fábrica (en `roofy`):** filma la demo real de Lumen cuadro por cuadro, sin grabar pantalla ni sumar dependencias.
    - Cada plano es una toma: Lumen se monta de cero, se juega con sus propios botones fuera de cámara y se filma en el momento justo.
    - Playwright simula el reloj de la página y las animaciones CSS se fijan a ese reloj, así que el mismo comando da los mismos cuadros.
    - El audio sale del motor de sonido del propio sitio, sin conexión y con semilla fija, normalizado a −16 LUFS.
  - **Video de Contact:** 36,4 s, siete planos (oficina cerrada a las 23:40 → chat guiado en el celular de Carolina → la consulta en el CRM → la tarjeta pasa a «Calificado» → la visita del viernes 18:30 → la marca → cierre con la fase 1/6).
  - **Reproductor:** elige el corte 9:16 en pantallas verticales, arranca sin sonido, tiene subtítulos en los tres idiomas y muestra el precio del plan al lado del video, en HTML.
- **Qué quedó abierto:** sin locución (la voz es del lote 3.4, con gasto); los subtítulos repiten las palabras de pantalla. Solo se renderizó la imagen en español; inglés y portugués salen con el mismo comando cuando Ignacio apruebe el estilo. No probé el reproductor en un celular ni en un Safari reales.
- **Qué necesita el OK de Ignacio:** ver el video (los dos cortes) y decidir si es premium (control de estilo de los videos), y aprobar los PRs. Después siguen las compuertas de gasto: **3.2 Fotos con GPT** (Opus · high), **3.3 Higgsfield** (con Ignacio presente: le aviso antes) y **3.4 Voz**. 3.7 (Growth) puede ir en paralelo.

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Base | `roofy` y Eclipse-Web en la rama de 3.6 (PR `roofy`#4 y Eclipse-Web#33, abiertos) |
| Herramientas | Chromium + Playwright preinstalados, `ffmpeg` 6 y `ffprobe` (con `libx264`, `libwebp`, `loudnorm`, `ebur128`) |
| Gasto | USD 0. Sin dependencias nuevas, sin servicios externos |

## 2. La fábrica

| Pieza | Qué hace |
|---|---|
| Página de render (`app/[locale]/render/page.dev.tsx`) | Solo existe en `next dev` (`pageExtensions`): nunca llega al export |
| Escenario (`components/video/RenderStage.tsx`) | Monta la toma de cada plano, ejecuta sus pasos (los botones reales de la demo), encuadra la cámara virtual y compone la noche, el marco con marcas de registro, el sello «Demo · datos ficticios», los rótulos y el anillo de toque |
| Pieza (`components/video/pieces/contact.ts`) | La ficha P1 en código: planos, tomas para 16:9 y 9:16, pasos y tiempos medidos |
| Tiempo y reglas (`components/video/timeline.ts`) | Las curvas del sitio, los formatos, las reglas de lectura (§2) y de subtítulos (§3), WebVTT. Puro y probado |
| Reloj (`components/video/clock.ts`) | Fija las animaciones CSS y Web Animations al reloj simulado en cada cuadro |
| Audio (`components/video/audio.ts`) | Música y efectos del motor del sitio en un `OfflineAudioContext`, con semilla fija; efectos solo en acciones |
| Driver (`scripts/render-video.mjs`) | Cuadros → H.264 (CRF 20, `+faststart`), mezcla → −16 LUFS / −1,5 dBTP, poster WebP, subtítulos, manifest; `--stills` y `--probe` para dirigir |
| Registro y manifest (`content/estateos-videos.json`) | Lo que lee el reproductor y el manifest de §6 por archivo: medidas de `ffprobe`, sha256, LUFS, `catalogVersion`, hash del origen y `approvedAt` |

Guía de uso: `roofy/docs/video-factory.md`.

## 3. El video de Contact

| # | Tiempo | Plano (16:9 escritorio · 9:16 app del celular) | Lo que pasa en cámara |
|---|---|---|---|
| 1 | 0:00–0:04 | «Hoy» de Lumen a oscuras | La luz descubre la pantalla con un borde que pasa. Lectura `Jue 8 · 23:40` y el titular serif «Oficina cerrada.» |
| 2 | 0:04–0:12 | Celular de Carolina: el sitio y el chat | Carolina escribe; el chat guiado piensa, escribe y pregunta; ella toca «Con crédito hipotecario» (anillo de toque) |
| 3 | 0:12–0:18 | CRM: Consultas | La conversación llega completa; al responder el presupuesto, su ficha se completa (USD 150–200k) |
| 4 | 0:18–0:24 | Pipeline | La tarjeta de Carolina viaja de «Nuevo» a «Calificado» |
| 5 | 0:24–0:29 | Visitas | La visita del viernes 18:30 cae en la agenda («Visita agendada»). Lectura `Vie 9 · 18:30 / Olmos 1420` |
| 6 | 0:29–0:33 | Marca | Se toca «Con tu marca» y la web pasa de la plantilla base a Lumen con un borde que pasa |
| 7 | 0:33–0:36 | Cierre | Fase 1/6, «Contact», «web · CRM · chat guiado». El precio está al lado, en HTML |

Solo muestra lo que Contact incluye: ningún seguimiento por WhatsApp, ninguna IA, ningún precio ni cupo dentro del video. Los planos 3 y 4 muestran el mismo instante (la respuesta de Carolina) desde dos lugares del CRM: la ficha que se completa y la tarjeta que se mueve.

## 4. Decisiones tomadas dentro del lote

- **Una función del tiempo en vez de una línea de tiempo GSAP.** La guía proponía pausar una línea de tiempo y buscar cada cuadro. Calcular cada estilo como función del tiempo con las mismas curvas es más simple y más determinista. La guía (§7) se actualizó.
- **Cada plano es una toma.** La historia de la demo dura 19,5 s y el video necesita mostrar momentos precisos. Montar Lumen de cero en cada plano y jugarlo fuera de cámara hasta el momento justo da el control de un rodaje sin tocar la demo.
- **30 cuadros por segundo** (medido; §6 de la guía actualizado).
- **Subtítulos = las palabras de pantalla.** Mientras no haya locución, el subtítulo repite los rótulos. Se encienden solos cuando el visitante lee otro idioma que el de la imagen; en español las palabras ya están en el cuadro.
- **Masters no guardados.** Los PNG no se guardan: el mismo comando los reproduce idénticos. Se guarda el MP4 de entrega.
- **La barra «Simular» no sale en cámara.** El driver la usa (son los botones reales), pero no es parte del producto que se muestra.
- **Ventana 16:9 con la proporción del área de trabajo del CRM** (1248 × 820): el encuadre no corta la barra superior ni los costados.

## 5. Criterios (checklist §10 de la guía)

| Criterio | Estado | Evidencia |
|---|---|---|
| Cuadros revisados en cada cambio de plano: legibilidad, recortes, un ámbar, sello «Demo» | Cumplido | Cuadros extraídos del MP4 en cada plano de los dos cortes. El sello está en todos; el único ámbar propio es el glifo del cierre (la marca de arriba es clara) |
| `ffprobe`: duración, fps, bitrate y peso dentro del objetivo | Cumplido | Ver §6 |
| Subtítulos sincronizados en cada idioma | Cumplido | Cada subtítulo empieza cuando su rótulo entra y termina en el corte; ≤ 2 líneas, ≤ 42 car, ≤ 15 car/s (probado) |
| Audio −16 LUFS ± 1, picos ≤ −1 dBTP, sin efectos en cortes | Cumplido | Ver §6; efectos solo en las respuestas de Carolina, la visita y el toque de marca |
| Cada capacidad mostrada pertenece al plan | Cumplido | Prueba: ninguna toma reproduce más de los 3 beats de Contact ni abre Seguimientos |
| Ningún precio, dato real o interfaz inventada | Cumplido | Prueba sobre los textos del video; todo lo filmado es la demo real con sus datos ficticios |
| Manifest completo y `catalogVersion` vigente | Cumplido | Prueba: cada archivo existe, su sha256 y su peso coinciden, el catálogo es el vigente y el hash del origen coincide |
| 9:16 compuesto aparte, zonas seguras | Cumplido | Vistas del celular (app de Lumen), nada de texto en el 12 % superior ni en el 20 % inferior |
| Aprobación visual de Ignacio | **Pendiente** | Control de estilo de los videos |

## 6. Mediciones

| Archivo | Medida | Peso (objetivo) | Bitrate | Sonido | Poster |
|---|---|---|---|---|---|
| `contact-v1-es-16x9.mp4` | 1920 × 1080 · 30 fps · 36,4 s · H.264 High | 5,13 MB (≤ 6 MB) | 1.182 kb/s | −16,1 LUFS · −1,5 dBTP | 9,3 KB |
| `contact-v1-es-9x16.mp4` | 720 × 1280 · 30 fps · 36,4 s · H.264 High | 2,91 MB (≤ 3 MB) | 671 kb/s | −16,1 LUFS · −1,3 dBTP | 10,5 KB |

- **Determinismo:** dos renders del plano del pipeline (con la tarjeta en vuelo): 18 de 18 cuadros idénticos byte a byte.
- **Cuadros por segundo:** la cámara se acerca como mucho un 3 % por plano; el borde que más se mueve hace ≈ 0,3 px por cuadro a 30 fps. Un paneo tiembla a partir de ≈ 1 px por cuadro, así que 60 fps no aporta nada visible y duplica el render y el peso.
- **Tiempo de render:** ≈ 4 min por corte de 36 s en este contenedor (1.092 cuadros).

## 7. QA

`roofy`: `tsc` y `eslint` limpios, **101** pruebas (nuevas: `video.test.ts` y el registro en `videos.test.ts`), `next build` verde (la página de render no está en el export), `npm audit` 0. Navegador, contra el export: el botón «Ver el video» aparece con Contact y no con Growth; el reproductor abre con poster, sin sonido, sin autoplay, `preload=none`, el precio al lado («Contact · USD 30/mes») y vuelve el foco al cerrar. A 1440 px carga el 16:9 sin subtítulo encendido (español); a 390 px en inglés carga el 9:16 con el subtítulo inglés encendido. Reproduce sin errores y sin desborde; consola limpia.

## 8. Riesgos y reversión

- **Peso del repo:** los MP4 viven en `public/videos/` (≈ 8 MB por pieza en dos cortes). Con siete piezas y tres idiomas puede superar los 150 MB; si molesta, los videos pasan a un almacenamiento aparte y el registro guarda la URL. No hace falta decidirlo ahora.
- **Si cambia la demo:** la prueba del hash del origen cubre la pieza, el escenario y sus textos, pero no la demo de Lumen. Un cambio de Lumen se revisa mirando los cuadros (`--stills`) y se vuelve a renderizar.
- **Reversión:** el lote es aditivo; revertir el PR de `roofy` deja el registro vacío y el botón «Ver el video» desaparece.

## 9. Handoff

Si el video se aprueba como premium, V2–V5 usan esta fábrica: cada pieza es un archivo en `components/video/pieces/`. Antes vienen las compuertas de gasto de 3.2 (fotos con GPT) y 3.3 (Higgsfield, con Ignacio presente: aviso antes de empezar), y 3.4 (voz). Las demos 3.7–3.8d pueden avanzar en paralelo.
