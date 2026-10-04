# Rendimiento v3 — el "lag" del motivo Eclipse, medido antes y después

Reporte de partida (Notion): *"el movimiento del Eclipse lagea al bajar; la causa técnica está por medir"*. Este
documento registra cómo se midió, qué hacía la v2, qué se cambió y los números antes/después. Todo sale de corridas
reales; nada está estimado.

## Cómo se midió

- **Builds comparados:** *antes* = `main` (dce1040, v2) y *después* = v2 + solo los cambios de hero/movimiento de la v3,
  para aislar el efecto de esta área. Los dos con `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web`, servidos con gzip bajo
  `/Eclipse-Web` como en GitHub Pages.
- **Arnés:** Playwright + Chrome DevTools Protocol sobre Chromium 141 headless, **CPU 4× más lenta** (emulada), contexto
  nuevo por corrida, `/es/`, espera del loader + 10 s. Fases:
  - **en reposo:** 5 s arriba sin tocar nada (lo que se anima solo);
  - **hero:** gesto de rueda a lo largo del hero a 600 px/s, pausa, vuelta arriba;
  - **primera bajada / subida:** toda la página a 1500 px/s (en la primera bajada se hidratan las secciones diferidas).
- **Qué se registra:** intervalos de frame (fps, p95, % de frames > 33 ms), tareas largas, *long animation frames* con
  atribución de script, tiempo ocupado del hilo principal, estilo + layout, script y heap.
- **Configuraciones:** celular 390×844 @2x con corona CSS (iPhone y Android de ≤ 4 núcleos), celular con corona WebGL
  (Android medio de 8 núcleos), iPad 1024×1366 @2x (corona CSS; en v2 el hero quedaba fijado) y escritorio 1440×900
  (WebGL, hero fijado).
- **A/B intercalado:** por configuración, 3 rondas; cada ronda corre *antes* y *después* seguidos (orden alternado).
  Las tablas muestran medianas de 3.
- **Atribución:** perfiles de CPU mapeados a archivos con source maps, trazas con stacks de estilo/layout forzado y un
  script que cuenta cada lectura de `getComputedStyle`, posición de scroll y geometría durante el scroll.

## Límites (leer antes de citar números)

- Chromium headless en un contenedor compartido de 4 CPU, con CPU limitada por emulación (solo el hilo principal).
  **No se midió un iPad ni un celular reales, ni Safari/WebKit.**
- **Sin GPU:** WebGL corre en SwiftShader y la composición es por software. Los fps absolutos de escritorio y del celular
  con WebGL dicen poco de una GPU real; lo que sí se traslada es *cuántas veces* se le pide trabajo a la GPU (cada frame
  vs. solo cuando algo cambia).
- El scroll es un gesto de **rueda** sintético: los gestos táctiles sintéticos no scrollean en este Chromium headless,
  así que no se reproduce la inercia del dedo ni el cambio de alto de la barra del navegador.
- Las fases *hero* y *bajada* incluyen trabajo de otras secciones (hidratación diferida, trailers de las demos): es parte
  de lo que siente el visitante, pero no todo depende del hero.

## Qué costaba en la v2

1. **El hero se animaba siempre, aunque nadie tocara la página.** En reposo, el hilo principal estaba 41–100 % ocupado
   (4× CPU) y el compositor dibujaba cada frame: 25 estrellas SVG titilando (la opacidad en SVG no se compone: repinta
   cada frame), la corona CSS con dos capas difuminadas girando y "respirando", la deriva del dial y la línea de "Bajá
   para ver más". En el tamaño iPad, eso solo bajaba el reposo a ~34–40 fps.
2. **La corona WebGL dibujaba cada frame** mientras el hero estaba en pantalla (ya se pausaba fuera de pantalla, en
   pestaña oculta o bajo la demo, pero nunca en reposo).
3. **Lecturas de layout en cada frame de scroll:** el eclipse del logo leía `scrollHeight` en cada frame (526 ms de JS
   propio en una bajada; 115 lecturas forzadas) justo después de las escrituras de GSAP; el riel lateral leía scroll,
   alto de página y la posición de cada zona clara por frame; los dos repintaban su SVG en cada frame.
4. **~56 entradas de una sola vez con GSAP/ScrollTrigger** (Reveal, DrawLine, Occult, LightSweep, CountUp): cada una se
   actualizaba en cada evento de scroll hasta dispararse y leía estilos computados al crearse, mientras su sección se
   hidrataba.
5. **Hidratación diferida durante el scroll:** el trabajo de React al recrear el DOM de cada sección es lo más pesado de
   la primera bajada (~0,9–1,2 s por pasada a 4×).
6. En el iPad el hero quedaba **fijado** (pin): con el dedo, el tramo "retenido" se siente como que la página no sigue.

## Qué se cambió (y qué se descartó)

| # | Cambio | Resultado medido |
|---|---|---|
| 1 | Sin animación decorativa permanente en el hero: estrellas quietas (mismas posiciones), corona CSS estática, el dial gira solo al apuntar un rubro, sin línea de scroll | Reposo: 0 ms de estilo/layout |
| 2 | Corona WebGL a demanda: dibuja mientras cambia algo (entrada de 6 s, scroll, reveal, rubro) y conserva el último cuadro; resolución máxima 1,5× → 1,25× (mismo aspecto lado a lado en pantalla 2×) | Celular WebGL en reposo: 99,8 % → 9,5 % ocupado |
| 3 | Sin parallax por giroscopio en pantallas táctiles (el sensor nunca se queda quieto); con mouse sigue | Con el celular "en la mano": 71 % → 12 % ocupado |
| 4 | Hero fijado solo con mouse/trackpad; en táctil hace scrub sin pin | iPad, pasada del hero: 35,9 → 38,2 fps, frames lentos 24 → 18 % |
| 5 | Eclipse del logo y riel lateral: leen el scroll de un ScrollTrigger, cachean medidas y tocan el SVG solo cuando cambia algo visible | Eclipse del logo: 526 → 14 ms por bajada |
| 6 | Reveal, DrawLine, Occult, LightSweep y CountUp: mismas props y aspecto, con transiciones CSS y un IntersectionObserver compartido (`components/motion/observeEnter.ts`) | Primera bajada: script −12 a −18 %, tareas largas −11 a −14 % |
| 7 | Secciones despertadas por el scroll: render en una transición de React (foco, toque y #hash siguen siendo inmediatos) | Tareas largas −17 %; fps sin cambio (se informa como tal) |

Descartados por no mostrar mejora medible: dejar las capas del scrub siempre en GPU (`force3D`) y promover las capas de
estrellas durante el parallax.

## Resultados — A/B final (medianas de 3, CPU 4×; *antes → después*)

| Configuración | En reposo: fps · hilo ocupado | Pasada del hero: fps · frames > 33 ms | Primera bajada: fps · tareas largas | Subida: fps · frames > 33 ms |
|---|---|---|---|---|
| Celular (corona CSS) | 59,9 → 59,8 · 52,9 → 9,0 % | 39,1 → 44,4 · 13,7 → 8,5 % | 35,6 → 39,5 · 2128 → 1364 ms | 49,3 → 54,5 · 6,8 → 3,4 % |
| Celular (corona WebGL) | 35,0 → 59,7 · 99,8 → 9,5 % | 34,6 → 40,9 · 23,5 → 15,1 % | 36,3 → 38,9 · 1982 → 1253 ms | 35,0 → 53,6 · 19,7 → 4,0 % |
| iPad | 39,9 → 59,9 · 40,8 → 9,4 % | 23,5 → 37,9 · 42,4 → 18,7 % | 31,3 → 35,3 · 3361 → 1654 ms | 30,9 → 48,8 · 28,0 → 7,0 % |
| Escritorio (WebGL por software) | 10,8 → 59,7 · 89,5 → 9,7 % | 7,7 → 12,9 · 100 → 75 % | 29,5 → 32,1 · 5146 → 3456 ms | 15,4 → 41,4 · 71,2 → 14,1 % |

"Hilo ocupado" incluye el propio medidor de frames (~9–10 % en reposo). En celular el hero de la v3 es más alto (CTA y
atajos), así que su pasada recorre ~12 % más; en el iPad la v3 no fija el hero y la página es 1366 px más corta.

## Lighthouse (móvil, export servido con gzip; corridas intercaladas v2/v3 en la misma máquina)

| Página | Performance | TBT | LCP | CLS | Accesibilidad · Best practices · SEO |
|---|---|---|---|---|---|
| `/es/` v2 (3 corridas) | 70 · 80 · 82 (mediana 80) | 360–440 ms (370) | 2,9–5,0 s | 0 | 100 · 96 · 100 |
| `/es/` v3 (3 corridas) | 80 · 82 · 84 (mediana 82) | 230–320 ms (300) | 3,5–3,8 s | 0 | 100 · 96 · 100 |
| `/es/plan/` v2 (5 corridas) | 84–91 (mediana 86) | 190–270 ms (210) | 2,9–3,5 s | 0 | 100 · 96 · 100 |
| `/es/plan/` v3 (5 corridas) | 80–86 (mediana 84) | 160–390 ms (300) | 2,7–4,4 s | 0 | 100 · 96 · 100 |
| `/es/portal/…` v3 (ingreso, proyectos ×2, detalle) | 91–95 | 90–170 ms | 2,9–3,4 s | 0 | 100 · 96 · 63\* |

\* El portal es `noindex` a propósito (es un mockup de una zona privada): Lighthouse lo penaliza en SEO. Los 4 puntos
de *best practices* que faltan en todas las páginas son errores de consola de las APIs de cotización, bloqueadas en el
entorno de medición.

En `/plan` el TBT simulado subió ~90 ms de mediana (más UI hidratada: progreso y total fijos, categorías plegables,
header nuevo); la diferencia de score está dentro del ruido de Lighthouse en esta página, pero se informa.

## Conclusiones

1. **El "lag" tenía una causa medible en el propio hero: nunca dejaba de animarse.** Con la página quieta, la v2 tenía
   el hilo principal 41–100 % ocupado y el compositor dibujando cada frame; todo lo que se scrolleaba competía con eso.
   Ahora: ~9–10 % en reposo, 0 ms de estilo/layout y ~60 fps quieto en las cuatro configuraciones.
2. **Bajar por el hero es más fluido donde se reportó el problema:** iPad 23,5 → 37,9 fps (frames lentos 42 → 19 %),
   celular 39,1 → 44,4, Android con WebGL 34,6 → 40,9. Al volver a subir: 49 → 55, 35 → 54 y 31 → 49 fps.
3. **La primera bajada mejora menos** (+3–4 fps, −35 a −50 % de tiempo en tareas largas): la domina la hidratación
   diferida, que recrea el DOM de cada sección. Hidratar "en el lugar" (hidratación selectiva con Suspense) la atacaría
   de raíz, pero arriesga desajustes con el estado del cliente (moneda, rubro elegido); no se intentó.
4. **Reducido, no resuelto en términos absolutos:** con CPU 4× nada llega a 60 fps sostenidos mientras se scrollea, y no
   hubo GPU real ni dispositivos reales. **Próximo paso antes de dar por cerrado el reporte:** probar en un iPad y en un
   Android medio reales, bajando y subiendo por el hero (y en Safari).
5. Costos que quedan fuera de esta área, con evidencia: los trailers de las demos leen estilos computados al arrancar
   (~40–50 ms por pasada a 4×) y el listener de rueda de ScrollTrigger fuerza una lectura de scroll por evento (solo
   escritorio, interno de GSAP).

---

## Fase 2 (demos manuales, capa de «Ver demo», guía) — antes / después

Mismo arnés, mismos gestos y configuraciones que arriba. *Antes* = `main` con el PR #4 (843b157); *después* = esta
rama. A/B intercalado, 3 rondas, medianas, CPU 4× (`ab3`).

| Configuración | En reposo: fps · hilo ocupado | Pasada del hero: fps · frames > 33 ms | Primera bajada: fps · tareas largas | Subida: fps |
|---|---|---|---|---|
| Celular (corona CSS) | 59,9 → 59,7 · 8,1 → 7,6 % | 47,8 → 45,0 · 6,0 → 7,5 % | 44,7 → 43,4 · 547 → 563 ms | 56,7 → 56,0 |
| Celular (corona WebGL) | 59,7 → 59,9 · 8,2 → 7,2 % | 41,0 → 41,1 · 10,8 → 10,4 % | 41,0 → 41,6 · 604 → 718 ms | 54,2 → 54,6 |
| iPad | 59,7 → 59,7 · 7,9 → 7,6 % | 39,1 → 40,0 · 17,5 → 15,1 % | 46,8 → 45,7 · 602 → 1090 ms | 54,6 → 54,1 |
| Escritorio (WebGL por software) | 59,9 → 59,7 · 6,3 → 6,5 % | 18,4 → 18,2 · 60,6 → 61,2 % | 38,6 → 37,8 · 2150 → 2314 ms | 46,5 → 46,3 |

Lectura:
- **El motivo Eclipse no empeoró:** en reposo sigue a ~60 fps con el hilo ~7–8 % ocupado (el propio medidor) y la
  pasada del hero queda igual dentro del ruido en las cuatro configuraciones.
- **Primera bajada en iPad: +~0,5 s de tareas largas** (957–1296 ms vs. 332–637 ms por corrida; −1 fps). La
  atribución (LoAF) muestra más trabajo de React al hidratar secciones (`MessagePort.onmessage`: 38 → 50 frames,
  +121 ms) y más lecturas de layout en scroll (+51 ms). Son secciones con más UI que antes (Precios con el bonus,
  la calculadora con su barra, la sala de demos). No cambia la fluidez de la subida ni del hero; queda anotado.
- **Apertura de la capa de demo** (CPU 4×, build de producción): 180–450 ms del clic a la capa abierta; durante el
  reveal, mediana de frame 17 ms y p95 33–100 ms (1–2 tareas largas: el clic y montar la demo). La demo en vivo se
  monta recién después del reveal, para que la luz descubra primero el póster.

Mismos límites que arriba: Chromium headless sin GPU, rueda sintética, sin dispositivos ni Safari reales.

## Fase 3 — apertura centrada de «Ver demo» (antes/después)

Misma medición de la apertura (`perf` de la capa): build de producción, CPU 4×, 2 rondas, *antes* = `main`
(dd90541, apertura de ~0,8 s desde el clic) y *después* = esta rama (eclipse centrado del tamaño del hero, ~2,4 s).
Ventana de la apertura: del clic a 2,7 s (en *antes* incluye además montar la demo; en *después* la demo se monta
justo al terminar). Cierre: 1,8 s desde Escape.

| Caso | Del clic a la capa abierta | Apertura: frame p50 · p95 · máx · tareas largas | Cierre: p50 · p95 · máx |
|---|---|---|---|
| 1440 desde el hero | 259–435 → 277–343 ms | 17 · 33–50 · 217–317 ms · 431–783 ms → 17 · 33 · 150–200 ms · 264–325 ms | 17 · 67–133 · 200–267 → 17 · 33–50 · 133–217 |
| 1440 desde Demos | 325–414 → 368–396 ms | 17 · 33–50 · 467–483 ms · 756–917 ms → 17 · 33–50 · 233–267 ms · 361–410 ms | 17 · 167–300 · 350–433 → 17 · 67–117 · 283–317 |
| 360 desde el hero | 163–199 → 232–297 ms | 17 · 17–33 · 150–183 ms · 223–354 ms → 17 · 17 · 200–283 ms · 197–333 ms | 17 · 17 · 100–133 → 17 · 17–33 · 167–183 |

Lectura: la apertura nueva es más larga pero no más pesada por frame (mediana 17 ms, p95 ≤ 50 ms, como antes); las
tareas largas dentro de la ventana bajan porque la demo se monta después de la luz. Solo anima transform, opacity y
clip-path (corona CSS, sin WebGL). Mismos límites: Chromium headless sin GPU, sin dispositivos ni Safari reales.
