# Fichas de patrones firma

Formato fijo por ficha: **Idea** · **Anatomía** · **Estados** · **Datos** · **Tecnología** (de la escalera de `three-d-webgl`, peldaño más barato primero) · **Accesibilidad / fallback** · **Lo que se vende**.

---

## P1 — Plato en tornamesa (restaurantes, TableFlow)
- **Idea:** cada plato es una foto cenital recortada sobre un plato oscuro que gira al cambiar de ítem; al pasar el puntero aparecen líneas de precisión que nombran cada ingrediente. El menú lateral son miniaturas circulares. Agregar → carrito lateral → pedido para retirar → «Gracias, Alex».
- **Anatomía:** columna izquierda (categoría pequeña, nombre en serif grande, descripción, precio tabular, CTA «Agregar»); centro (plato 50–60 % del alto); columna derecha (lista de platos con miniatura y precio); barra superior (marca, Menú/Reservas/Contacto, carrito con contador).
- **Estados:** cambio de plato (rotación 90–180° + crossfade 400–600 ms, ease-out), hover con etiquetas (líneas SVG que se dibujan con `stroke-dashoffset`, escalonadas 60 ms), agregado (el plato «vuela» al carrito en arco con FLIP, ≤ 600 ms), carrito vacío, horario de retiro, confirmación, error de pago.
- **Datos:** JSON de platos con `ingredientes[{nombre, x, y}]` en coordenadas relativas a la foto. Precios del comercio; en demo, rotular «Demo».
- **Tecnología:** CSS `transform: rotate()` sobre PNG/WebP recortado (peldaño 1) basta. Etiquetas en SVG superpuesto. Sin Three.js.
- **Accesibilidad:** las etiquetas también se listan como texto bajo el plato; flechas ←/→ cambian plato; `prefers-reduced-motion` = crossfade sin giro.
- **Lo que se vende:** menú que aumenta ticket promedio (sugerencias «va bien con…»), pedidos para retirar sin comisión de apps, tablero de pedidos para la cocina.
- **Assets:** fotos cenitales consistentes (misma luz y plato). Si el local no las tiene: sesión de foto de producto o generación con IA rotulada; recorte con remove.bg/Photoroom o similar.

## P2 — Lookbook comprable (moda, Volta, Velmar)
- **Idea:** «Probá el look». Una fila de modelos de cuerpo entero sobre fondo neutro; al elegir uno, los demás se desenfocan y salen; el elegido queda centrado con puntos (hotspots) sobre cada prenda; panel lateral «En este look» con las 3 piezas, talles y «Agregar el look completo» con descuento por conjunto.
- **Anatomía:** encabezado «Probá el look» + subtítulo; carrusel horizontal de looks (Look 01… Look 06) con barra de progreso; vista foco; drawer derecho (desktop) o bottom sheet (móvil).
- **Estados:** fila (parallax leve por profundidad), foco (blur 8–12 px + escala 0.96 en los no elegidos), hotspot hover/focus, pieza agregada, talle agotado, conjunto completo con precio total y ahorro, volver a la fila (Escape/Atrás restauran foco).
- **Datos:** Shopify (Storefront API o sección Liquid) o catálogo propio; hotspots en coordenadas relativas. Descuento por conjunto solo si el comercio lo aprueba (regla de honestidad: nada de precios tachados inventados).
- **Tecnología:** CSS + FLIP para el paso fila → foco; imágenes AVIF/WebP recortadas con alfa. En Shopify: sección personalizada en un tema Online Store 2.0.
- **Lo que se vende:** sube el valor del carrito (comprar el conjunto), contenido de campaña reutilizable, tablero de «looks más vistos / agregados».
- **Herramientas:** tienda de desarrollo gratis en Shopify Partners; fotos con modelos reales o generadas con IA (rotuladas) y fondo homogéneo.

## P3 — Gemelo digital isométrico (logística, distribuidoras, EstateOS masterplan)
- **Idea:** la empresa vista como un videojuego: depósito, muelles, camiones, autoelevadores y pallets en vista isométrica; tarjetas flotantes con KPIs reales (camiones en predio, entregas a tiempo, stock por SKU, capacidad de bahías, carga en curso con %).
- **Anatomía:** escena isométrica central; barra superior con KPIs; panel derecho con ficha del centro (operativo, dirección, stock/capacidad, salidas de hoy, inventario con semáforo); línea de tiempo inferior de un envío (Recibido → Cargando → En tránsito → Entregado).
- **Estados:** en vivo (pulso discreto en lo que cambia), alerta (stock bajo en ámbar), selección de objeto (resalta y abre ficha), sin conexión, carga.
- **Datos:** API del cliente o planilla; en demo, datos ficticios rotulados. Ver skill `isometric-scenes` para la construcción.
- **Lo que se vende:** «tu empresa en modo videojuego»: el dueño entiende su operación de un vistazo; excelente gancho comercial para B2B.

## P4 — Configurador paramétrico (muebles a medida, cocinas, placares, aberturas)
- **Idea:** el cliente dibuja el mueble (ancho, alto, profundidad, columnas, cajones, puertas), lo gira en 3D, prueba variantes de color/material y el sistema devuelve **qué tablas comprar y qué cortes salen** (lista de cortes en mm) + presupuesto. «Lo mandás al carpintero o lo armás vos».
- **Anatomía:** panel de parámetros (sliders con valor numérico editable), visor 3D con órbita, vista despiece/explosión, grilla de variantes, lista de cortes exportable (PDF/CSV), CTA «Pedir presupuesto».
- **Datos:** reglas del fabricante (espesor de placa 18 mm, medidas de placa estándar, tapacanto, márgenes) → generador de piezas → optimizador de cortes (nesting 2D).
- **Tecnología:** ver `product-configurator-3d`.
- **Lo que se vende:** menos idas y vueltas, presupuesto instantáneo, leads calificados con medidas exactas.

## P5 — Prueba sobre el cuerpo / producto 3D (tatuajes, estética, joyería, óptica)
- **Idea:** «Miralo en el cuerpo». Hero cinematográfico del local («The Ink Experience»), luego un cuerpo 3D (hombre/mujer, tono de piel) donde se elige zona (pecho, espalda, brazo, antebrazo, muslo, pantorrilla), diseño de la colección **o «describí el tuyo»** (generación con IA), escala y rotación.
- **Estados:** sin diseño, generando (skeleton + texto honesto), diseño aplicado, zona cambiada (cámara viaja a la zona), reservar turno con el diseño adjunto.
- **Tecnología:** ver `product-configurator-3d` (decal proyectado sobre malla glTF).
- **Honestidad:** «Vista aproximada; el resultado real depende del artista y la piel». Diseños generados por IA rotulados; derechos de los diseños del artista.
- **Lo que se vende:** reservas con seña, menos indecisión, contenido viral.

## P6 — Acceso, cuota y aforo (gimnasios, clubes)
- **Idea:** el dueño pidió «algo simple»: socio entra con QR; si debe la cuota, no pasa; ve cuánta gente hay adentro; mails automáticos al socio; cada sede ve lo suyo; profes sin acceso a la plata.
- **Pantallas:** ingreso (QR + nombre + plan + «Acceso OK»), denegado (tarjeta roja «Cuota vencida — venció hace 3 días»), aforo en vivo (34/60 con barra), mail «Tu cuota vence mañana — Renovar», selector de sede, roles (Dueño / Recepción / Profe con montos ocultos), resumen (cobros del mes, caja de hoy, rutinas).
- **Lo que se vende:** software a medida entregado en 30 días a partir de un audio de requisitos; diagnóstico gratis de 20 min como gancho (ver skill de Marketing `spec-work-prospecting`).

## P7 — Localizador de sedes
- **Idea:** lista y mapa que se mueven juntos. Toggle «Abiertas ahora», orden por distancia, elegir una sede centra el mapa con su tarjeta (dirección, horario, «Cómo llegar») y dibuja una ruta punteada animada desde «Tu ubicación».
- **Tecnología:** mapa ilustrado propio (SVG) para demos de marca, o MapLibre GL / Mapbox / Google Maps para producción. Geolocalización solo con permiso explícito; sin permiso, campo de dirección.
- **Accesibilidad:** la lista es la fuente de verdad y es navegable con teclado; el mapa es complemento.

## P8 — Planes que se expanden («Matiz»)
- **Idea:** cuatro planes como tarjetas con color propio (esfera/gradiente suave); al elegir uno, se expande a panel con precio grande, lista de features y CTA; los demás se pliegan a franjas verticales con el nombre rotado y su precio. Toggle mensual/anual con ahorro.
- **Detalles:** precio con `tabular-nums` y contador animado al cambiar de período; franjas clicables (≥ 44 px); radio concéntrico; un solo CTA sólido.
- **Uso en Eclipse:** página de precios de SaaS (TableFlow, DentalOS) y de Eclipse mismo (precios: solo Ignacio).

## P9 — Documento vivo con pieles («Membrete»)
- **Idea:** una factura/presupuesto que cambia entre tres estilos (Clásico papel, Bloque de color, Oscuro técnico) reacomodando los mismos datos con animación de layout; el total cuenta con dígitos que ruedan; «Descargar PDF».
- **Uso en Eclipse:** presupuestos que el cliente recibe (aumenta percepción de valor), módulo de facturación de cualquier SaaS, pieza de branding del cliente (P «Branding» del gateway).
- **Tecnología:** mismos datos, tres hojas de estilo / variantes de tokens; View Transitions o FLIP; PDF con `@media print` o generación server-side.

## P10 — OTP de vidrio
- **Idea:** tarjeta de vidrio sobre fondo oscuro con brillos; 4–6 casillas; al completar, las casillas se conectan con líneas, colapsan en partículas y aparece «Verificado ✓» con «Verified and Secure».
- **Reglas:** ver checklist D5 de `ui-polish-pass` (pegar código, `one-time-code`, `inputmode=numeric`). La celebración dura ≤ 1 s y es saltable; reduced-motion = check estático.
- **Uso:** login de portales de clientes Eclipse, checkout, apps de salud.

## P11 — Preloader de marca
- **Idea:** mientras carga, las miniaturas de trabajos forman un arco 3D (CSS `perspective` + `rotateY` por tarjeta) que gira sobre un cielo; contador 000→100 en mono; al terminar, el arco se abre en carrusel navegable.
- **Regla:** solo si la carga es real y > 1 s; nunca un loader falso para «hacer tiempo». Saltable. Una vez por sesión de navegación, sin guardar nada en storage (regla de Eclipse-Web).

## P12 — Email de producto
- **Idea:** email vertical modular de marca de consumo: hero con producto y nombre del sabor, beneficio numérico enorme («24 g de proteína»), grilla de 4 beneficios, sección de uso, cierre con CTA y redes.
- **Ver:** skill de Ads `email-campaign-design`.
