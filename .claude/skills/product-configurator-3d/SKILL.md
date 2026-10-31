---
name: product-configurator-3d
description: "Configuradores de producto vendibles: paramétricos (muebles a medida con lista de cortes y presupuesto), prueba sobre el cuerpo (tatuajes, joyería, indumentaria) y objetos en tornamesa. Cubre modelo de datos, generación de geometría, decals, variantes, exportación, cotización y presupuesto de rendimiento. Usala cuando la demo de un rubro necesita que el cliente final «arme» o «se pruebe» el producto."
---
# Product Configurator 3D

## Propósito
El configurador es el producto premium más fácil de justificar: reemplaza idas y vueltas por WhatsApp con un presupuesto exacto y un lead calificado. Esta skill define cómo construirlo sin convertirlo en un proyecto de videojuego.

## Antes de tocar 3D: ¿hace falta?
Seguir la escalera de `three-d-webgl`. Muchas veces alcanza con **imágenes por capas** (variantes de color pre-renderizadas) o **una tornamesa de 24–36 fotos**. Pasar a Three.js/R3F solo si el cliente necesita cambiar **dimensiones** o **posición sobre una superficie** en tiempo real. Requiere SDD y OK de dependencias.

## Stack recomendado (cuando sí hace falta)
| Necesidad | Herramienta |
|---|---|
| Escena React | `three` + `@react-three/fiber` + `@react-three/drei` (`OrbitControls`, `Environment`, `ContactShadows`, `Decal`, `useGLTF`) |
| Modelos | glTF/GLB comprimido con Draco o Meshopt; texturas KTX2. Pipeline con `gltf-transform` |
| Modelos de base | Blender (gratis); cuerpos humanos base: MakeHuman (CC0) o un asset con licencia comercial verificada; generación IA de mallas (Meshy, Tripo, Rodin) solo como borrador y con licencia verificada |
| Optimizar cortes (nesting 2D) | algoritmo guillotina/skyline propio o librería de bin packing (verificar licencia) |
| Exportar | PDF de la lista de cortes y del presupuesto (server-side o `@media print`); CSV para el carpintero |
| Imágenes de diseño generadas por texto | proveedor de imágenes vía backend (nunca la API key en el cliente), con tope de gasto aprobado |

## Tipo A — Paramétrico (muebles, placares, cocinas, aberturas)
1. **Modelo de datos** (fuente de verdad, no la malla):
   ```ts
   type Mueble = { ancho: number; alto: number; fondo: number; espesor: 18 | 15;
     columnas: number; cajones: number; puertas: number; material: string; color: string };
   ```
2. **Generador de piezas**: función pura `despiezar(mueble) → Pieza[]` (`{nombre: 'Lateral', largo, ancho, espesor, cantidad, tapacanto}`), con reglas del fabricante (descuento de espesores, luz de cajones, fondo de 3 mm encastrado). Testearla con casos borde: ancho mínimo/máximo, 0 cajones.
3. **Geometría** derivada de las piezas (cajas simples), así la vista 3D y la lista de cortes **nunca se contradicen**.
4. **Vistas:** armado, explosión (piezas separadas), cotas, y variantes en grilla 2×2.
5. **Salida:** lista de cortes en mm, placas necesarias (tamaño estándar a verificar con el proveedor local), metros de tapacanto, herrajes, precio estimado. «Lo mandás al carpintero o lo armás vos».
6. **Validaciones:** límites físicos (un estante de 120 cm sin apoyo se pandea: avisar), valores numéricos editables además del slider.

## Tipo B — Sobre el cuerpo o una superficie (tatuajes, joyería, prendas, revestimientos)
1. Malla base por variante (hombre/mujer) con UVs limpias; tonos de piel como material, no como textura distinta.
2. **Zonas** predefinidas (pecho, espalda, brazo, antebrazo, muslo, pantorrilla) con posición de cámara y punto de proyección para cada una; la cámara viaja con ease-out 600–900 ms.
3. **Decal** (`<Decal>` de drei o `DecalGeometry`) con la imagen del diseño en PNG con alfa; controles de escala y rotación; blend multiply para que tome el tono de piel.
4. **Diseño por texto** («describí el tuyo»): llamada a backend, estado «generando» honesto, resultado en blanco y negro con fondo transparente, botón «Reservar con este diseño» que adjunta la imagen.
5. **Aviso visible:** vista aproximada; diseños IA rotulados.

## Tipo C — Tornamesa / showroom (platos, zapatillas, productos)
Preferir secuencia de fotos o video corto con scrub. Si es 3D: un solo objeto, `Environment` HDRI liviano, sombra de contacto, rotación automática que se detiene al interactuar.

## Presupuesto de rendimiento (medir en móvil medio)
GLB ≤ 2–3 MB por escena inicial; texturas ≤ 2K; ≤ 100 draw calls; render bajo demanda (`frameloop="demand"`) en vez de 60 fps constantes; cargar el visor solo cuando entra al viewport, con póster mientras tanto; DPR limitado a 1.5–2.

## Accesibilidad y respaldo
Todos los parámetros operables con teclado y con valores numéricos; el resultado (lista de cortes, precio, zona elegida) existe como texto; póster/imágenes si WebGL falla; `prefers-reduced-motion` desactiva rotación automática y viajes de cámara largos.

## Entrega
Modelo de datos + función de despiece testeada · escena mínima con una variante · salida (PDF/CSV/lead) funcionando · mediciones de peso y fps · qué requiere OK (dependencias, generación IA paga, compra de modelos).
