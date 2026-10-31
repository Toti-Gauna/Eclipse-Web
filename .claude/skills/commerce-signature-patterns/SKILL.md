---
name: commerce-signature-patterns
description: "Atlas de «interacciones firma» por rubro para demos y productos premium de Eclipse: menú giratorio de restaurante, lookbook comprable de moda, gemelo digital isométrico de logística, configurador paramétrico de muebles, prueba 3D sobre el cuerpo, control de acceso de gimnasio, localizador de sedes, planes que se expanden, factura con pieles, OTP de vidrio, preloader de marca y email de producto. Usala al definir la idea visual central de una demo o vertical (TableFlow, Volta, Velmar, EstateOS, DentalOS…)."
---
# Commerce Signature Patterns

## Propósito
Un comercio no compra «una web linda»: compra **una sola interacción que su cliente recuerda y que le resuelve algo**. Esta skill elige esa interacción por rubro, define su anatomía y sus estados, y la baja a una especificación implementable con el stack de Eclipse. Las fichas completas están en `references/patterns.md`; el origen de cada patrón (videos de referencia analizados el 31/10/2026) en `references/video-sources.md`.

## Regla de oro
**Una idea visual central por pantalla, y que sea funcional.** El plato que gira *es* el menú; el depósito isométrico *es* el tablero; el cuerpo 3D *es* el cotizador. Si el efecto se puede quitar sin perder función, es decoración y va a `remove-animations`.

## Elegir el patrón
| Rubro / producto Eclipse | Patrón firma | Ficha |
|---|---|---|
| Restaurantes / TableFlow | **Plato en tornamesa** + etiquetas de ingredientes al hover + carrito → pedido para retirar | P1 |
| Moda / Volta, Velmar | **Lookbook comprable**: fila de modelos → foco en uno → hotspots → «Comprar el look completo» | P2 |
| Logística, distribuidoras, depósitos | **Gemelo digital isométrico** con KPIs vivos | P3 (+ skill `isometric-scenes`) |
| Muebles a medida, carpintería, cocinas, aberturas | **Configurador paramétrico** con lista de cortes y presupuesto | P4 (+ `product-configurator-3d`) |
| Tatuajes, estética, ópticas, joyería, indumentaria | **Prueba sobre el cuerpo / producto 3D** | P5 (+ `product-configurator-3d`) |
| Gimnasios, clubes, coworkings | **Acceso por QR + cuota + aforo en vivo** | P6 |
| Cadenas con sucursales, inmobiliarias, clínicas (DentalOS) | **Localizador**: lista y mapa sincronizados + ruta | P7 |
| SaaS, planes, membresías | **Planes que se expanden** (el elegido se abre, los demás se pliegan) | P8 |
| Servicios B2B, estudios, Eclipse mismo | **Documento vivo**: factura/presupuesto con pieles intercambiables | P9 |
| Fintech, salud, cualquier login | **OTP de vidrio** con verificación celebrada | P10 |
| Portfolio, agencia, lanzamientos | **Preloader de marca** (arco 3D de trabajos + contador) | P11 |
| E-commerce de consumo masivo | **Email de producto** modular (hero, beneficio numérico, grilla, CTA) | P12 (+ skill de Ads `email-campaign-design`) |
| EstateOS / inmobiliarias | P3 (masterplan isométrico) + P7 (localizador de unidades) + P5 (recorrido 3D) | — |

## Procedimiento
1. **Brief del comercio** (con `eclipse-ux-ui`): qué vende, a quién, cuál es la decisión difícil del cliente final (elegir plato, ver si el talle/estilo le queda, saber cuánto cuesta un mueble), y qué dato operativo le duele al dueño.
2. **Elegir 1 patrón firma + 2 de soporte** de la tabla. Escribir en una línea por qué ese patrón resuelve la decisión difícil.
3. **Abrir la ficha** en `references/patterns.md` y completar: anatomía, estados, datos (de dónde salen, qué es ficticio y se rotula «Demo»), tecnología según la escalera de `three-d-webgl`, accesibilidad y fallback.
4. **Assets:** fotos de producto con fondo consistente (para tornamesa/lookbook), modelos 3D o ilustraciones isométricas; si se generan con IA, rotularlo y pasar por `higgsfield-direction`. Nunca usar marca, logo o productos reales de terceros en una demo pública sin permiso: los videos de referencia usan Nike/Barebells como *spec work*; Eclipse usa marcas ficticias o del prospecto con su OK.
5. **Construir la versión mínima** que muestra la idea central funcionando de punta a punta (incluido el estado de éxito: «Gracias, Alex — retiro 19:30»).
6. `ui-polish-pass` → `design-review-rubric` con capturas en 360/390/768/1024/1440.

## Qué hace que se pueda cobrar como premium
- La interacción **termina en una acción de negocio** (pedido, carrito, reserva, presupuesto, lead), no en un «wow».
- Hay **un tablero para el dueño** detrás (Intelligence): pedidos, aforo, stock, conversiones, con datos rotulados.
- Se puede **re-pielar por marca** en horas (tokens + assets), lo que vuelve el patrón un producto repetible para todo el rubro.
- Funciona en el teléfono del cliente final con composición propia, no un escritorio comprimido.
