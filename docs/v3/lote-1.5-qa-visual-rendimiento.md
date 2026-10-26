# Lote 1.5 · QA visual y rendimiento

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `8a6d75a`, merge del PR #19) · **Resultado:** informe de QA con evidencia + cinco correcciones puntuales de defectos hallados. Nada se publicó: el PR queda para que Ignacio lo apruebe y lo mergee (G5). Gasto externo: USD 0.
**Fuentes:** Notion «Lote 1.5 · QA visual y rendimiento» (§05, §07, §12, §13), `docs/v3/rendimiento.md` (método), `lote-1.4-motion-direccion-visual.md` §11 (rúbrica y baseline), `lote-1.1-arquitectura-wireflows.md` §8–9.

## 0. Informe en tres líneas

- **Qué cambió:** la web actual (1.2 + 1.3) se comparó contra la anterior a 1.2 (`6e34310`) con la misma matriz, los mismos scripts y el mismo método: **150 celdas** (caso × ancho × preferencia) sin desbordes ni errores; teclado, History, deep links, cinco aperturas sin acumulación, fallos de red/chunk/medios y **HTML sin JavaScript** probados. Salieron **5 defectos reales** y los cinco quedaron corregidos y re-medidos: los enlaces con `#ancla` aterrizaban hasta ~3.000 px lejos (P1, ya ocurría antes), los enlaces del header bajaban a 2,2:1 de contraste (P1, ya ocurría antes), el header del portal parpadeaba en tema oscuro (P2), tres animaciones infinitas fuera de pantalla (P2) y un texto que prometía una herramienta dormida (P2). **Cero P0/P1 abiertos.**
- **Qué quedó abierto:** las **tareas largas de la primera bajada** son mayores que en el baseline (+300 ms celular, +164 ms escritorio; A2) y falta atribuirles causa; La **prueba de usabilidad con 5 personas no se hizo** (no hay participantes: queda «no comprobada»). Solo se probó en Chromium: sin Safari/iPad reales, sin Firefox/WebKit, sin lector de pantalla, sin INP (el laboratorio no lo mide).
- **Qué necesita el OK de Ignacio:** aprobar el PR. Habilita la **Fase 2** (2.1 en adelante) y el lote nuevo **1.6 · Repo y subdominio EstateOS** (D11, ya aceptado) antes de la Fase 2 (§12).

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Baseline (build «antes») | `6e34310` (`main` tras el PR #17, antes de 1.2): `npm run build` con `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web`, servido en el puerto 4001 |
| Candidato (build «después») | `8a6d75a` (`main` con 1.2 + 1.3) + el commit `4cc518b` de las correcciones de este lote, mismo build y mismo servidor (puerto 4000). La **matriz de capturas** se tomó sobre `8a6d75a` (antes de corregir); cada defecto se volvió a medir sobre el build corregido |
| Entorno | Contenedor de 4 CPU, Chromium 1243 headless (Playwright), exportación estática bajo `/Eclipse-Web`, sin red externa (las cotizaciones caen a la de respaldo) |
| Mismo dataset | Mismos scripts para los dos builds; la preferencia de movimiento se fija por contexto (`reducedMotion`) |
| `git status` | limpio al iniciar |

**Comandos (todos ejecutados en este lote):**

| Comando | Resultado |
|---|---|
| `npm run typecheck` | salida 0 |
| `npm run lint` | salida 0 |
| `npm test` | 30 archivos, **400/400** |
| `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web npm run build` (baseline y candidato) | salida 0 los dos |
| `node tests/e2e/smoke.mjs` (candidato corregido) | **72/72** |

Preexistente: ninguno falló al iniciar, así que no hay fallos previos que separar.

## 2. Matriz caso × ancho × preferencia (E2)

8 casos × 5 anchos (360, 390, 768, 1024, 1440) × 2 preferencias (normal, *reduced*): baseline 70 celdas (sin selector), candidato 80. Evidencia: `docs/v3/qa-1.5/matriz-{base,cand}.json`, comparativas en `docs/v3/capturas/1.5/`.

| Caso | Qué se midió en cada celda | Baseline | Candidato |
|---|---|---|---|
| Home (pliegue y página completa) | desbordes, H1, CTA del hero y del header visibles, errores de consola | 20/20 sin desborde ni error | 20/20 sin desborde ni error |
| Selector | abre, dos filas, Ecommerce deshabilitado, errores | — | 10/10 |
| Demo (capa «Ver demo») | abre desde el hero (baseline) o desde el selector (candidato), errores | 10/10 | 10/10 |
| Precios | precio y mantenimiento presentes en el texto | 10/10 | 10/10 |
| Armador `/plan/` (dormido, ruta viva) | carga, errores | 10/10 | 10/10 |
| Portal (ingreso y proyectos) | carga sin loader, errores | 20/20 | 20/20 |

- **CTA, precio y desbordes (criterio binario):** el CTA del hero y el del header están visibles en las 20 celdas de pliegue de cada build; precio y mantenimiento están en las 10 celdas de Precios; **ningún desborde horizontal a 360 px** (los −15 que figuran en los estados con capa abierta son la ranura de la barra de scroll que `lockScroll` conserva a propósito, no desborde).
- **Comparación visual** (hojas antes/después en `capturas/1.5/`): el hero nuevo cabe en 360×780 con el CTA dentro del primer pliegue en los tres idiomas; desaparecen los siete rubros (queda uno); la página completa a 360 mide 16.722 px contra 15.662 px antes (más contenido: «Qué ofrecemos» y «Para tu PyME»). El **bloque negro del trailer a 360 (B4 de 1.4) ya no se reproduce**: el póster se ve. Las capturas de 768 y 1024 conservan la composición propia de cada ancho.
- **Navegadores:** solo **Chromium**. No hay WebKit ni Firefox instalados y la instalación necesita aprobación; **Safari iOS/iPad no se certifica con un emulador** (regla del lote).

## 3. Teclado, foco, History, deep links y limpieza (E2)

Evidencia: `docs/v3/qa-1.5/robustez-teclado-fallos.log`.

| Prueba | Resultado |
|---|---|
| Tab desde el inicio: primer paso = «Saltar al contenido»; 14 paradas, cada una con anillo de foco visible (la línea «SaaS» dibuja el suyo en un `::after`, verificado en captura) | pasa |
| CTA del hero alcanzable con Tab; Enter abre el selector | pasa |
| Selector: 9 Tab y 3 Shift+Tab sin salir del diálogo (cicla); Escape devuelve el foco al CTA | pasa |
| Selector → demo solo con teclado; 12 Tab sin salir de la capa, todos con anillo; Escape: URL limpia y foco en el CTA del hero | pasa |
| Recargar con el selector abierto → home limpia (estado en memoria por contrato); recargar con la demo abierta → vuelve la demo y pregunta «guía / por mi cuenta» otra vez; cerrar no saca del sitio | pasa |
| Atrás/Adelante, «Volver», Escape, entrada directa, URL inválida, `/portal` ignora la consulta | pasa (e2e 72/72 y 23 comprobaciones de 1.3) |
| **5 aperturas y cierres seguidos** (3 selector → demo, 2 solo selector): nodos del DOM, *listeners* de JS, animaciones en curso, diálogos y bloqueo de scroll | **planos**: 3.898 nodos / 422 *listeners* / 0 diálogos abiertos / sin bloqueo en las 6 lecturas; el baseline es igual (3.838 → 3.839 nodos). El heap sube ~1 MB en 5 ciclos y se aplana (también en el baseline): no es concluyente más allá de 5 |

> **Nota de método (para no repetir el error):** una primera pasada mostró «fuga» de ~1.400 nodos por apertura, en **los dos builds**. Era el propio arnés: `page.waitForSelector` devuelve un `ElementHandle` que el protocolo mantiene vivo y retenía el diálogo. Con `locator().waitFor()` la fuga desaparece. La instantánea de heap mostró la cadena de retención «(Global handles) → DevTools console». Los scripts de `docs/v3/qa-1.5/scripts/` ya usan la forma correcta.

## 4. Fallos y fallbacks (E2)

| Simulación | Resultado |
|---|---|
| Chunk del selector no llega (abortado) | no hay diálogo, sin bloqueo, el enlace va a `#contacto` |
| Chunk del cuerpo de la demo no llega (selector ya abierto) | panel «No se pudo cargar la demo» con «Reintentar» y WhatsApp; «Volver» sigue ahí; con la red de vuelta, «Reintentar» carga la demo; salir deja la página libre |
| Salir del panel de error con «Volver» | foco en el CTA, sin bloqueo |
| **Todas** las imágenes, fuentes y medios con 404 | CTA, precios y WhatsApp siguen; sin desborde; la demo abre y cierra; sin errores de página |
| `play()` rechazado (autoplay bloqueado) en el trailer | sin errores no capturados; la sección se lee |
| *Reduced motion* recorriendo toda la home | **0** pedidos de video |
| Red lenta (400 kbps, 400 ms de latencia) | el CTA del hero visible a los ~7,9 s (laboratorio, **no** una métrica de campo); precios y contacto ya vienen en el documento |
| **JavaScript desactivado** (cierra la verificación pendiente de 1.1 §8) | el HTML exportado trae H1, el CTA con `href="#contacto"`, **91** importes, 14 enlaces de WhatsApp y 2 de correo; el *loader* nunca se enciende; el aviso «La demo interactiva necesita JavaScript» se muestra |

## 5. Contraste (E2, medido; no es una certificación)

Dos métodos: (a) para texto sobre fondos planos, la razón WCAG calculada con el color computado y el fondo efectivo de los ancestros; (b) para texto sobre degradados o imágenes, el color de texto contra el píxel de fondo muestreado en la captura. Evidencia: `qa-1.5/contraste-*.log`, `scripts/{contrast15,contrastpx15,hdrlinks15}.mjs`.

| Superficie | Resultado |
|---|---|
| Home, 360 y 1440 (texto plano) | **0** elementos por debajo de AA; 46–49 sobre degradados, **todos muestreados** (46/46 y 49/49): 0 por debajo de AA |
| Selector, capa de demo y `/plan` | 0 por debajo de AA en texto plano |
| Portal (ingreso) | el aviso de 4 elementos con 1,08:1 de la primera pasada era el **parpadeo del header** (D3, §6), no un texto ilegible: medido en el instante de carga |
| **Enlaces del header sobre el cielo que cambia** (219 muestras de píxeles a cada 200 px de scroll, 1440) | baseline **mínimo 2,03:1**; candidato antes de corregir **2,19:1** (4 posiciones bajo 4,5); candidato corregido **mínimo 4,73:1, 0 posiciones bajo 4,5** (D2) |

Limitaciones: el método (b) toma el peor 25 % de los píxeles de fondo; no reemplaza una revisión con la herramienta de accesibilidad del navegador ni con lector de pantalla.

## 6. Defectos y correcciones puntuales

Severidad: **P0** bloqueo o seguridad · **P1** navegación o conversión · **P2** estética o detalle. «Ya estaba» = presente también en el baseline.

| # | Sev. | Defecto (evidencia) | Corrección | Después |
|---|---|---|---|---|
| D1 | **P1** | **Los enlaces compartidos con `#ancla` aterrizan lejos.** `/es/#precios` a 1440: a los 300 ms el scroll acierta (`top` 89 px), pero al hidratarse las secciones diferidas la página crece (13.524 → 14.462 px), el navegador no corrige y el destino queda **988 px más abajo**; `#contacto` quedaba a 2.678–4.027 px. Ya estaba (baseline: 988 en 1440 para 4 de 5 anclas; a 390, `#contacto` a 3.848 px) y 1.2 lo movió (a 390, `#precios` pasó de 80 a 231 px) | `SmoothAnchors` mantiene en el destino el enlace con que se cargó la página, como ya hacía con los clics (`keepAligned`, una línea) | 5 anclas × 2 anchos, medido a 1,5 / 3,5 / 7 s: **88 px (1440) y 80 px (390) en todas** (= altura del header + margen) |
| D2 | **P1** | **Enlaces del header ilegibles en las zonas de transición del cielo**: contraste mínimo 2,03:1 (baseline) y 2,19:1 (candidato) con la superficie al 60 % de opacidad sobre el crema | superficie oscura al 88 % | mínimo 4,73:1 |
| D3 | P2 | El header del portal arranca en tema oscuro y flipa a claro 0,26–0,46 s después: texto claro sobre crema. Ya estaba | el header del portal arranca en tema claro | 0 ms en tema oscuro (3 corridas) |
| D4 | P2 | **3 animaciones CSS infinitas** (`agent-dot`, puntos de «escribiendo» del chat) corriendo desde la carga, incluso fuera de pantalla (regla v3: nada decorativo permanente). Ya estaba | los puntos quedan quietos hasta que el chat arranca | 0 animaciones infinitas (de 10 a 7 activas, todas ya terminadas) |
| D5 | P2 | El enlace de Precios decía «Armalo pieza por pieza» (promete armador; ahora es una lista de lectura) | «Mirá las piezas, una por una» (es/en/pt) | — |

**Abiertos (ninguno P0/P1):**

| # | Sev. | Qué | Por qué queda |
|---|---|---|---|
| A1 | P2 | **Densidad de Precios** (B6 de 1.4): ~4,5 pantallas de 900 px a 1440 | rediseñarla es otro alcance («este lote no habilita un rediseño») |
| A2 | P2 | **Tareas largas de la primera bajada** mayores que en el baseline: celular 510 → 810 ms, escritorio 780 → 944 ms (mediana de 5, CPU 4×; rangos crudos en el log) | No es P1: los fps de la bajada en celular **mejoran** (31,1 → 34,3), no hay efecto en reposo y el CLS mejora. Recomendación: un lote de optimización con perfil por sección **antes de sumar peso en la Fase 3** (la integración de EstateOS se hará en el repo nuevo y no agrega a este) |
| A3 | P2 | Desplazamiento intermitente de `.hero-copy-inner` (CLS ~0,045 en 1 de 6 corridas en 1.2) | **No se reprodujo** en las corridas de rendimiento de este lote (CLS del candidato 0,0000–0,0022); se vigila, no se corrige a ciegas |
| A4 | P2 | La nota de cotización del precio sigue en «≈» de referencia sin red | es el *fallback* diseñado; con red se actualiza |

## 7. Rendimiento (E2 de laboratorio)

Método de `rendimiento.md` sin cambios: CPU **4× más lenta** emulada, gestos de **rueda** sintéticos (la inercia del dedo no se reproduce), contexto nuevo por corrida, `/es/`, loader + 9 s de espera; fases en reposo / pasada del hero a 600 px/s / primera bajada y subida a 1.500 px/s; **rondas intercaladas** (el orden alterna); **medianas**. Celular = 390×844 @2×; escritorio = 1440×900 con WebGL por software (sin GPU: los fps absolutos de escritorio dicen poco). **Chromium headless en un contenedor compartido; no es un iPad ni un celular real, ni Safari.** Los umbrales LCP ≤ 2,5 s, CLS ≤ 0,1 e INP ≤ 200 ms son objetivos de producto: aquí se reportan valores de laboratorio y **no se mide INP**.

**Corrida de 5 rondas intercaladas** (`qa-1.5/rendimiento-5-rondas.log`, con los valores crudos de cada ronda; la corrida previa de 3 rondas, `rendimiento-3-rondas.log`, da lo mismo). *Antes* = baseline `6e34310`, *después* = candidato con las correcciones de este lote. Medianas de 5.

| Celular 390×844 @2× | En reposo | Pasada del hero | Primera bajada | Subida |
|---|---|---|---|---|
| fps (antes → después) | 60,0 → 60,0 | 31,8 → **39,5** | 31,1 → **34,3** | 45,2 → **49,8** |
| frames > 33 ms | 0 → 0 % | 19,0 → **14,0 %** | 26,8 → **19,0 %** | 11,9 → **6,6 %** |
| tareas largas | 0 → 0 ms | 401 → **31 ms** | 510 → **810 ms** (18 → 18) | 21 → 7 ms |

| Escritorio 1440×900 (WebGL por software) | En reposo | Pasada del hero | Primera bajada | Subida |
|---|---|---|---|---|
| fps | 60,0 → 60,0 | 16,5 → 15,8 | 40,0 → 36,9 | 60,0 → 58,7 |
| frames > 33 ms | 0 → 0 % | 48,1 → 46,5 % | 8,8 → 12,3 % | 0,0 → 0,5 % |
| tareas largas | 0 → 0 ms | 466 → 519 ms | 780 → **944 ms** (12 → 21) | 0 → 0 ms |

| Carga | Celular antes → después | Escritorio antes → después |
|---|---|---|
| CLS (mediana; crudo) | 0,0011 → 0,0022 (0,001 ×5 → 0,002 ×5) | **0,1203 → 0,0000** (0,120 · 0,004 · 0,180 · 0,000 · 0,185 → 0,000 · 0,004 · 0,000 · 0,000 · 0,000) |
| LCP (elemento: el H1) | 672 → 692 ms | 908 → 816 ms |

Lectura honesta:
- **En reposo no hay trabajo** en ninguno de los dos builds (60 fps, 0 ms de tareas largas).
- **Celular:** el candidato mejora claramente la pasada del hero (tareas largas de 401 a 31 ms) y la subida, y la bajada tiene menos frames lentos (26,8 → 19,0 %) y más fps. Pero la bajada acumula **más tareas largas**: 510 → 810 ms; los rangos crudos casi no se tocan (443–553 antes, 532–906 después), así que la diferencia **es real**, aunque chica en fps.
- **Escritorio:** la pasada del hero queda igual (el límite es el WebGL por software, que no dice nada de una GPU real). La bajada empeora algo: 40,0 → 36,9 fps y 780 → 944 ms de tareas largas (antes 553–884, después 815–1.824 con un valor atípico). Es la misma señal que en celular.
- **CLS:** el baseline en escritorio supera el objetivo de 0,1 en 3 de 5 corridas (un salto de un SVG a los ~24 s, en la bajada) y el candidato no lo reproduce; en celular ambos son despreciables (≪ 0,1).
- **No se afirma una mejora de rendimiento global.** Lo que mejora: pasada del hero, subida en celular y CLS en escritorio. Lo que empeora: tareas largas de la primera bajada (A2). La causa **no está atribuida**: la sospecha es la hidratación de las dos secciones nuevas («Qué ofrecemos» y «Para tu PyME»), pero eso se confirma con un perfil por sección, que es trabajo de optimización y el lote lo excluye.

## 8. Puerta visual adversarial (rúbrica de 1.4 §11 contra el baseline)

| Eje | Baseline (1.4) | Ahora | Evidencia |
|---|---|---|---|
| Identidad | 2 | 2 | mismo lenguaje (eclipse-instrumento, serif, ámbar) en las nuevas superficies |
| Jerarquía | 1 | 1 | hero y selector claros; Precios sigue denso (A1) |
| Lectura | 2 | 2 | contraste medido (§5): 0 por debajo de AA tras D2 |
| Orientación | 1 | 2 | rubros una sola vez, 8 secciones numeradas, URL que dice dónde estás, anclas compartidas que aterrizan (D1) |
| Móvil | 1 | 1 | sin desborde a 360; B4 ya no se reproduce; **sin dispositivo real** |
| Acción principal | 1 | 2 | 7 CTA sólidos fuera del header, **0 pares** en un viewport; CTA y precio presentes en las 150 celdas |
| Movimiento | 2 | 2 | *reduced* ≤ 150 ms verificado, 0 animaciones infinitas (D4); la sensación en vivo no se evaluó |
| **Total** | **10/14** | **12/14** | ningún criterio crítico peor que el baseline; foco, Atrás y Escape **probados** |

Honestidad: «Ver demo» y el selector rotulan «Demo»; Ecommerce dice «Próximamente» sin planes inventados; no hay precios tachados ni ofertas inactivas visibles; los textos que prometían el armador se corrigieron (D5 y los de 1.3).

## 9. Criterios de aceptación (Notion §12)

| Criterio | Estado |
|---|---|
| Cero P0/P1 abiertos | **Cumple** (D1 y D2 corregidos y re-medidos) |
| Capturas normales/*reduced* y teclado documentadas | **Cumple** (§2, §3, `capturas/1.5/`) |
| No desaparición de CTA/precio ni desborde a 360 | **Cumple** (150 celdas) |
| Fallback completo y limpieza probados | **Cumple** (§3, §4) |
| Rendimiento comparado con método reproducible; muestra humana real o pendiente explícita | **Cumple** el método (§7, 5 rondas con valores crudos); un criterio sale peor (A2, P2, no crítico) y se informa; la **muestra humana queda pendiente de forma explícita** |
| Cada afirmación con evidencia o rotulada no probada | **Cumple** (§10 lista lo no probado) |
| Sin gastos, publicaciones ni cambios de alcance implícitos | **Cumple** (USD 0, sin merge ni deploy) |
| Se preservó el contenido vigente | **Cumple** (el inventario de 1.1 no pierde bloques; solo se quitó texto que prometía el armador) |

## 10. No ejecutado

- **Prueba de usabilidad de 30 s / 120 s con 5 personas** (protocolo en 1.1 §9): no hay participantes; **usabilidad no comprobada**, sin participantes inventados.
- Safari iOS/iPad reales, WebKit, Firefox, Android real; lector de pantalla; INP.
- Medición de campo (CrUX/RUM): no existe.
- Rediseño de Precios (A1).

## 11. Rollback

`git revert` del commit `4cc518b` deshace las cinco correcciones sin tocar nada más (header, `SmoothAnchors`, chat del agente y claves de mensajes). El resto del lote es documentación y scripts. No toca `/content`, precios ni el backend.

## 12. Handoff

- **Habilita la Fase 2** (2.1 · Arquitectura comercial, Sonnet · high).
- **D11 (resuelta por Ignacio, 26/10/2026): EstateOS en repositorio y subdominio propios.** Repo **`roofy`** «por ahora» y dominio **`roofy.eclipse-business.com`** (ya creado en Hostinger). Nuevo lote **1.6 · Repo y subdominio EstateOS** (Sonnet · high) entre 1.5 y 2.1: esqueleto, publicación de prueba y contrato de enlace con Eclipse-Web. **Ignacio crea el repositorio cuando se llegue al 1.6**; hasta entonces no se crea ni se toca nada fuera de Eclipse-Web. Efectos en 3.5–3.9, 4.1, 4.3 y el selector: ver `lote-0.4-sdd-control-financiero.md`. El modal «¿Cómo la querés ver?» («Ver con guía» / «Ver por mi cuenta») pasa a ser la primera pantalla del sitio nuevo.
- Scripts reutilizables de este QA: `docs/v3/qa-1.5/scripts/` (matriz, robustez, contraste, rendimiento, anclas, fugas).
