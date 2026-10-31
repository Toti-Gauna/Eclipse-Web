# Checklist de terminación (valores concretos)

Fuentes: make-interfaces-feel-better (Jakub Krehel, MIT), skills de Emil Kowalski (MIT), Impeccable (Paul Bakaus, Apache-2.0). Adaptado a Eclipse. Donde un valor choca con `brand-contract` o `motion-atlas`, gana Eclipse.

## A. Superficies
| # | Regla | Valor / técnica |
|---|---|---|
| A1 | Radios concéntricos | `radio_exterior = radio_interior + padding`. Contenedor 24 px con padding 8 px → hijo 16 px |
| A2 | Sombras para elevación, bordes para estructura | Sombra en capas y transparente: `0 1px 2px oklch(0 0 0/.06), 0 8px 24px oklch(0 0 0/.08)`. Bordes solo para separadores, selección y foco |
| A3 | Contorno de imágenes | `outline: 1px solid oklch(0 0 0/.1)` en claro, `oklch(1 0 0/.1)` en oscuro, `outline-offset:-1px`. Nunca un gris tintado |
| A4 | Alineación óptica | Íconos de play, flechas y botones con ícono se corrigen a ojo (1–2 px), no al centro geométrico |
| A5 | Área táctil | ≥ 44×44 px en táctil, ≥ 40×40 en escritorio denso; extender con `::after`; nunca superponer áreas |
| A6 | Vidrio (glassmorphism) | `backdrop-filter: blur(16–24px) saturate(140%)` + borde interior `inset 0 1px 0 oklch(1 0 0/.12)` + fondo con algo detrás que valga la pena desenfocar. Respaldo sólido con `@supports not (backdrop-filter: blur(1px))` |

## B. Tipografía y datos
| # | Regla | Valor |
|---|---|---|
| B1 | Números que cambian (precios, contadores, totales, cronómetros) | `font-variant-numeric: tabular-nums` (Geist Mono ya es tabular) |
| B2 | Titulares | `text-wrap: balance`; cuerpo `text-wrap: pretty` |
| B3 | Suavizado en macOS | `-webkit-font-smoothing: antialiased` en el root |
| B4 | Precio premium | Entero grande + decimales en superíndice o a la mitad del tamaño (`$1.364⁰⁰`); moneda alineada arriba |
| B5 | Jerarquía por peso y tamaño, no por color | Máximo 3 tamaños por tarjeta |
| B6 | Íconos | Trazo 1.5 px junto a texto 400; 2 px junto a 600. Un solo set por superficie. `currentColor`; contorno por defecto, relleno = activo |

## C. Movimiento
| # | Regla | Valor |
|---|---|---|
| C1 | ¿Se anima? | Interacciones muy frecuentes: nada o ≤ 150 ms de opacidad/color. El «momento» vive en lo infrecuente |
| C2 | Easing | Entradas y salidas con ease-out (`cubic-bezier(0.2,0,0,1)` o el token de Eclipse). Nunca `ease-in` para entrar |
| C3 | Duraciones | UI 150–250 ms; paneles 250–400 ms; momentos de marca hasta ~800 ms y saltables |
| C4 | Interrumpible | Cambios de estado con CSS transitions; keyframes solo para secuencias que corren una vez |
| C5 | Entrada escalonada | Separar en bloques semánticos y escalonar ~60–100 ms; nunca en listas que se repiten |
| C6 | Salida | Más suave que la entrada: `translateY(4–8px)` + opacidad, no la altura completa |
| C7 | Cambio de ícono | opacity 0→1, scale 0.25→1, blur 4px→0; con Motion: `spring, duration .3, bounce 0` |
| C8 | Press | `scale(0.96)` en botones; nunca menos de 0.95 |
| C9 | Primer render | Sin animación de entrada al cargar (`AnimatePresence initial={false}`) salvo el momento de bienvenida deliberado |
| C10 | Propiedades | Nunca `transition: all`; animar solo `transform`, `opacity`, `clip-path`, `filter`. `will-change` solo si hay tirón en el primer frame |
| C11 | Expansión de tarjeta (acordeón tipo «Matiz») | El elegido crece con `flex-grow`/`grid-template-columns` animado o FLIP; los demás se pliegan a una franja vertical con el nombre rotado y el precio visible. Teclado: flechas mueven, Enter elige |
| C12 | Reduced motion | `prefers-reduced-motion`: estático o fade ≤ 150 ms. El movimiento nunca es el único feedback |

## D. Móvil que se siente app
| # | Regla |
|---|---|
| D1 | `100dvh` en vez de `100vh`; `env(safe-area-inset-*)` en barras fijas |
| D2 | Inputs con `font-size ≥ 16px` (evita zoom en iOS); `inputmode` correcto (`numeric` para OTP, `tel`, `email`) |
| D3 | `-webkit-tap-highlight-color: transparent` + estado `:active` propio |
| D4 | Hover solo con `@media (hover:hover) and (pointer:fine)` |
| D5 | OTP: `autocomplete="one-time-code"`, pegar el código completo reparte los dígitos, borrar retrocede, error sacude 1 vez y explica |
| D6 | Hojas inferiores (bottom sheets) en vez de modales centrados para carrito, filtros y detalle |

## E. Estados obligatorios de un componente vendible
Vacío diseñado (con acción) · cargando (skeleton con la forma real, no spinner genérico) · error con salida · éxito con confirmación clara y siguiente paso · datos extremos · offline (si aplica) · deshabilitado con motivo.
