---
name: isometric-scenes
description: "Construir ilustraciones isométricas y gemelos digitales «en modo videojuego» para landings y tableros: sistema de grilla, paleta y luz fija, kit de piezas reutilizables por rubro (depósito, camión, casa, panel solar, edificio, local), y cómo animarlas y conectarlas a datos. Usala para heros explicativos (Generar → Almacenar → Compartir), masterplans de EstateOS y dashboards de operación."
---
# Isometric Scenes

## Propósito
Una ilustración isométrica explica **qué hace un negocio de un vistazo** y, conectada a datos, convierte un tablero aburrido en algo que el dueño quiere abrir. Antes era trabajo de ilustrador; con código y un kit de piezas se genera por rubro en horas. Lo difícil no es el código: es que la escena explique algo verdadero del cliente.

## Escalera técnica (parar en el primer peldaño que alcanza)
| Peldaño | Cuándo | Cómo |
|---|---|---|
| 1. **SVG isométrico** | Heros, ilustraciones de pasos, íconos de sección | Proyección 2:1 (ángulo 26.565°): punto 3D `(x,y,z)` → `sx = (x - y)·w/2`, `sy = (x + y)·h/2 - z·h`. Caras: superior clara, izquierda media, derecha oscura (luz fija desde arriba-izquierda) |
| 2. **CSS 3D** | Bloques simples que se apilan o se levantan al hover | Contenedor `transform: rotateX(60deg) rotateZ(-45deg)`, caras con `translateZ` |
| 3. **Canvas 2D** | Muchas entidades moviéndose (camiones, autoelevadores, gente) | Ordenar por `x + y` (algoritmo del pintor) y redibujar con `requestAnimationFrame` solo mientras haya movimiento |
| 4. **Three.js / R3F con cámara ortográfica** | Escena navegable (zoom, rotar 90°, seleccionar objetos) o modelos glTF | `OrthographicCamera` con rotación (`Math.atan(1/Math.sqrt(2))`, 45°); requiere SDD y OK de dependencias (ver `three-d-webgl`) |

## Sistema visual (fijarlo antes de dibujar la primera pieza)
- **Grilla:** módulo base (p. ej. 32 px de lado de baldosa); todo se alinea a la grilla.
- **Luz única** y tres tonos por material (superior / izquierda / derecha) derivados con OKLCH bajando L en pasos de 6–10.
- **Paleta corta:** 1 neutro de suelo, 2 materiales, 1 color de marca del cliente para lo importante, 1 color de alerta. En Eclipse, el ámbar solo para el foco.
- **Grosor de línea** constante o sin líneas (estilo «clay»); no mezclar.
- **Escala humana:** personas o vehículos pequeños para que se entienda el tamaño.
- **Dos variantes de tema:** claro (papel, verde/gris) y oscuro técnico (wireframe con líneas finas), como los ejemplos de energía y aviación.

## Kit de piezas por rubro (componentes parametrizados)
| Rubro | Piezas |
|---|---|
| Logística | depósito con muelles, camión (cabina + caja, color), autoelevador, pallet/caja, estantería, bahía numerada |
| Energía | panel solar, batería, aerogenerador, casa con techo solar, poste, cargador de auto |
| Inmobiliaria (EstateOS) | lote, edificio por pisos (parametrizar pisos y unidades), amenity, árbol, calle, cartel «Vendido/Disponible» |
| Restaurante / retail | local con toldo, mesa, mostrador, moto de delivery, góndola |
| Industria | nave, cinta, máquina, contenedor |
Cada pieza: función `pieza({ x, y, z, ancho, largo, alto, color, estado })` que devuelve SVG (o malla). Las escenas se componen desde JSON, para poder **re-generarlas por cliente** cambiando datos, no dibujos.

## Conectar a datos (gemelo digital)
- Cada entidad tiene `id` que coincide con el dato real (camión `TRK-2127`, bahía 3).
- Estados visuales mapeados: operativo / cargando (barra % sobre el objeto) / alerta (ámbar) / fuera de servicio (desaturado).
- Selección → tarjeta flotante con KPIs y acción («Ver envío»). La tarjeta es HTML accesible, no texto dentro del canvas.
- En demo: datos ficticios rotulados «Demo».

## Movimiento
Vehículos que recorren rutas fijas a velocidad constante (lineal está bien acá: es movimiento mecánico), objetos que se elevan 4–8 px al hover, aparición de la escena por capas (suelo → edificios → vehículos → etiquetas) una sola vez. Pausar todo cuando la escena sale del viewport (`IntersectionObserver`) y con `prefers-reduced-motion`.

## Accesibilidad y respaldo
Texto alternativo que describa lo que la escena explica (no «ilustración isométrica»); los KPIs existen también como lista/tabla; póster estático si falla el canvas/WebGL; 360 px con encuadre propio (recortar la escena, no achicarla hasta que no se lea).

## Skills externas relacionadas (verificar antes de instalar)
`isometric-design` de `sickn33/agentic-awesome-skills` (recetas de CSS isométrico). Instalar solo con sesión autorizada y OK de Ignacio.
