# Home de productos y páginas por unidad (28/10/2026)

**Pedido de Ignacio:** «la web de Eclipse: el hero más un banner que muestre lo que ofrece cada pantalla —Roofy, Foody,
Markyt y Handy—, con SVG propios y que cada uno diga "Conocer X". Después Eclipse Media y Equipamiento, y nada más. El
header lleva a Eclipse Media, Academy, Intelligence y Agency, cada una una página distinta. Súper premium, con GSAP.»

## Qué cambió

| Antes (v3e) | Ahora |
|---|---|
| Home: hero · qué ofrecemos · PyME · demos · precios · calculadora · cómo trabajamos · contacto | Home: **hero · productos · Eclipse Media · equipamiento** · pie |
| Header: Servicios · Demos · Precios · Cómo trabajamos (anclas) | Header: **Media · Academy · Intelligence · Agency** (páginas) |
| «Potenciar mi negocio» (hero, header) abría el selector de rubro | Lleva al banner de productos (`/#productos`) |
| — | `/media/`, `/academy/`, `/intelligence/`, `/agency/` y `/productos/<id>/` en es/en/pt |

**Nada se borró.** Toda la landing v3 se mudó entera a `/agency/` con sus mismos ids (`#servicios`, `#ejemplos`,
`#precios`, `#problema`, `#proceso`, `#contacto`): el inventario (`docs/v3/inventario.md`) sigue completo allí. Un enlace
compartido antes (`/es/#precios`) se redirige solo a `/es/agency/#precios` y cae en la sección (prueba e2e).

## Home

1. **Hero:** el mismo H1 y la misma acción «Quiero potenciar mi negocio», ahora un enlace real al banner; la llave
   directa a la demo de Lumen sigue debajo.
2. **Productos (`#productos`):** una pantalla por producto. Cada una dice para qué rubro es, qué resuelve (una línea),
   cuatro puntos, su estado y «Conocer <producto>».
   - Con mouse/trackpad en pantallas anchas, las cuatro pantallas son un **recorrido horizontal fijado**: el scroll pasa
     de un producto al siguiente. Cada lámina se dibuja al entrar, con profundidad (la lámina y el texto se mueven a
     distinto ritmo) y un disco con corona que cruza por detrás. Abajo, un riel dice dónde estás y salta a cualquiera;
     el foco del teclado dentro de otra pantalla también la trae.
   - En celulares y tablets táctiles, en pantallas bajas y con movimiento reducido, las pantallas se apilan y cada lámina
     se dibuja una vez al llegar (o ya está dibujada).
   - El HTML del servidor mide lo mismo que la versión hidratada (medido: 4.052 px el banner en los dos casos a 1440 × 900).
3. **Eclipse Media (`#media`):** una hoja de contacto con seis cuadros (tráileres, motion, imágenes de producto, redes,
   lanzamientos y temporadas, modelos 3D) y «Conocer Eclipse Media». Al entrar, un cabezal la recorre y expone cuadro por
   cuadro.
4. **Equipamiento (`#equipamiento`, amanecer):** un plano de despiece con seis partes numeradas y su lista con «A cotizar».
   Al entrar, el kit se desarma: cada parte sale del centro a su lugar. Señalar una fila ilumina su parte.
   «Pedir una cotización» por WhatsApp.

**Láminas SVG propias:** Roofy (la fachada con una ventana encendida, la ficha y la agenda de visitas), Foody (el plato
como el disco del eclipse, la campana que se levanta como la luna, la carta con QR), Markyt (la bolsa, la etiqueta, el
catálogo y el envío), Handy (una ciudad costera inventada, la casa y el alfiler con su zona); más los seis cuadros de
Media, el despiece de Equipamiento y un emblema por unidad. Todas en el lenguaje de «Efemérides»: líneas finas, un solo
punto ámbar y nada de texto.

**Movimiento:** GSAP (`@/components/motion/gsap`), solo `transform`, `opacity` y `clip-path`. El fijado existe solo con
mouse/trackpad (la misma regla que el hero); movimiento reducido = todo quieto y visible.

## Honestidad

| Producto | Estado en la web | Fuente |
|---|---|---|
| **Roofy** (inmobiliarias) | Disponible · desde USD 30/mes (de `content/levels.json`) · demo de Lumen · seis niveles | Catálogo EstateOS vigente |
| **Foody** (gastronomía) | En preparación · sin precio publicado · juegos/pasaportes y 3D marcados «En diseño» | Notion «V6 · Gastronomía» (planificación; nombre provisorio) |
| **Markyt** (ecommerce) | En preparación · sin precio publicado · regalos/gamificación y estudio «En diseño» | Notion «V5 · Ecommerce» (los precios de EstateOS son solo hipótesis) |
| **Handy** (servicios para el hogar) | Lanza el 10/11/2026 · seis rubros previstos, cada uno se habilita con especialistas verificados | Notion «Contexto Handy» |

- Ningún precio está escrito en los textos: la prueba `tests/products.test.ts` lo verifica.
- Academy dice que la biblioteca está en producción (las guías de uso van primero). Intelligence dice en qué nivel llega
  en Roofy (Hípergrowth) y que en los demás productos llega con sus niveles superiores. Equipamiento: por pedido, contra
  cotización y anticipo, sin stock propio.
- Media: «si una pieza usa IA, respetamos las condiciones de cada proveedor y los derechos de terceros».

## Páginas

- **`/media/`:** qué producimos (cada pieza con su cuadro), cómo trabajamos (brief → guion y cuadros → producción →
  revisión y aprobación → entrega), cómo hacemos nuestros tráileres, las condiciones y las otras unidades.
- **`/academy/`** (amanecer): qué vas a encontrar (guías, marketing por rubro, rutas por nivel y rol, práctica, marketing
  físico, progreso), en qué plan llega y su estado.
- **`/intelligence/`:** qué mide, su principio («cada número con su fuente»), en qué plan llega y su estado.
- **`/agency/`:** intro con el texto aprobado de la línea Agency, un índice de la página y toda la landing v3 debajo
  (con su propia capa «Ver demo» y el selector de rubro).
- **`/productos/<id>/`:** el producto en grande, qué incluye, lo que está en diseño, cómo empezar y los otros productos.
  En Roofy, «Ver la demo» abre Lumen directo y siguen los seis niveles.

## Segunda vuelta (28/10/2026, pedido de Ignacio)

- **«Potenciar mi negocio» abajo a la derecha.** Salió del header y flota abajo a la derecha en todas las páginas
  comerciales, en celular y en escritorio (`components/layout/FloatingCta.tsx`).
  - Se corre (baja y sale del orden de tabulación) mientras se ve el botón del hero, el banner de productos (adonde
    lleva) u otro botón ámbar de la página, como el del pie: nunca hay dos ámbar sólidos en pantalla.
  - En el menú del celular sigue estando.
  - El pie tiene más aire abajo para que el botón no tape el ©.
- **Gimnasios, DentalOS, Clínicas y VetOS, «Próximamente».** Cuatro pantallas más en el banner, cada una con su SVG
  (pesas y la racha del socio; la muela con el turno reprogramado; el pulso, la campana y la agenda con una ausencia;
  la huella, la ficha del tutor y la visita a domicilio).
  - En lugar de «Conocer» dicen «Próximamente» y ofrecen «Avisame cuando esté» por WhatsApp.
  - Sin precio y sin página propia.
  - Los puntos salen de la investigación de Notion (DentalOS 16/10, vetOs/VetCare 17/10, sin implementación) y, para
    gimnasios y clínicas, de lo que muestran las demos Órbita y Aurora (en standby).
  - El banner pasa de cuatro a ocho pantallas; el riel de abajo salta a cualquiera.
- **Verificación de esta vuelta:**
  - `vitest`: 478 pruebas.
  - e2e: **99/99**. Comprueba las ocho pantallas, los cuatro «Próximamente» sin precio y con aviso por WhatsApp, que el
    header ya no tiene el botón, y que el flotante aparece abajo a la derecha donde no hay otro botón y se corre sobre el
    hero y el banner.
  - Capturas: `1440-dentalos`, `1440-vetos`, `1440-boton-flotante` y `360-boton-flotante`.

## Tercera vuelta (28/10/2026, pedido de Ignacio)

**Pedido:** «más animaciones, que aparezcan más rápido, todo en movimiento, cada uno por área; pantallas de carga entre
páginas; que "Conocer X" se ponga todo blanco, como la demo de Lumen; una publicidad de lo que Eclipse ofrece y de cómo
es un ecosistema, con Kinetic Studio, después de la pantalla de carga, en cada refresh, con música divertida, para celu y
escritorio, con zoom, con SVG de lo que incluye cada uno y los planes con precio, y al final un botón "Activar Eclipse"
que lleve a la home; personajes, objetos que se mueven y transiciones, sin perder la estética minimalista».

### El comercial «Eclipse en 40 segundos» (`components/intro/`)

Sale después de la pantalla de carga en **cada carga de la home** (no se recuerda nada) y termina en «Activar Eclipse».
Capturas: `capturas/comercial/1440-comercial.jpg` y `390-comercial.jpg`.

| Segundo | Escena | Qué pasa |
|---|---|---|
| 0–4 | Encendido | El eclipse sale de la pantalla de carga, la luna se desliza, el anillo de diamante, «ECLIPSE» letra por letra y las cuatro cosas que hacemos. |
| 4–8 | Golpes | «Webs.» «Sistemas.» «Contenido.» «Todo conectado.»: una palabra cada dos tiempos, cada una en su panel (claro, oscuro con corona, ceniza, claro). |
| 8–12 | Ecosistema | Eclipse en el centro, los ocho productos en una órbita y las cinco unidades en otra; giran y los datos viajan al centro. Gente caminando por la calle de abajo. |
| 12–24 | Zoom | La cámara entra en Roofy y después cada producto tiene su pantalla: la lámina que se dibuja y se mueve (el visitante, el especialista, la campana…), qué incluye con un ícono por punto y su estado real (solo Roofy con precio). |
| 24–28 | Lo que viene | Gimnasios, DentalOS, Clínicas y VetOS con su lámina y «Próximamente». |
| 28–32 | Unidades | Media, Academy, Intelligence, Agency y Equipamiento, conectados por una línea con paquetes que viajan. |
| 32–38 | Planes | Los seis niveles crecen como barras y cada precio sube como un instrumento, en la moneda del visitante (de `content/levels.json`); Partner dice «Propuesta». |
| 38–40 | Cierre | La luna se va del sol, «Tu negocio, a plena luz.» y «Activar Eclipse». Al tocarlo, el eclipse del comercial vuela y aterriza sobre el del hero. |

- **Método Kinetic Studio:** una línea de tiempo de GSAP en una grilla de 120 BPM, armada con las piezas del sitio (el
  eclipse, las láminas, los textos y los precios del catálogo); no hay video ni imágenes.
- **Música:** una composición propia (melodía, armonía, bajo; do mayor, I–V–vi–IV) tocada por la orquesta de los tráileres
  de roofy. Se genera en el navegador recién cuando el visitante toca «Activar sonido» (el sonido arranca apagado, como en
  todo el sitio) y desde ahí la música marca el reloj de la película. Al final queda un loop suave de dos compases.
- **Celular y escritorio:** escenario de 1600 × 900 en pantallas apaisadas y de 540 × 1080 en verticales, cada uno con su
  composición; se escala a la pantalla y, si se gira el teléfono, se rearma en el mismo segundo.
- **Control:** «Saltar» y Escape en todo momento; la regla de abajo muestra el avance.
- **Cuándo no sale:** con un enlace a una sección (`/es/#productos`, también los viejos `/#precios`) o a la vitrina
  (`?rubro=`), en las otras páginas y al volver a la home navegando dentro del sitio. Con movimiento reducido es una
  tarjeta quieta con lo mismo (productos, unidades, los seis planes con precio) y «Activar Eclipse».

### Pantallas de carga entre páginas (`components/layout/PageTransition.tsx`)

- **Todas las páginas:** al tocar un enlace a otra página, la noche se cierra desde el punto del toque, el eclipse y el
  nombre del destino ocupan la pantalla mientras carga y la noche se abre sobre la página nueva.
- **«Conocer X» (y todo enlace a un producto):** la apertura de la demo de Lumen en corto: la luna se corre, el anillo de
  diamante y la luz inunda la pantalla. La página del producto sale de esa luz y ahora es toda clara.
- Captura: `capturas/comercial/1440-transiciones.jpg`, `1440-pagina-roofy-clara.jpg`, `360-pagina-roofy-clara.jpg`.

### Todo en movimiento

- Cada lámina, después de dibujarse, sigue contando su historia en bucle:
  - **Roofy:** un visitante camina hasta la puerta, sale humo de la chimenea, la consulta viaja de la ventana a la
    ficha y llena su barra, la visita late en la agenda.
  - **Foody:** la campana se levanta y sale el vapor; se escanea el QR de la carta.
  - **Markyt:** la etiqueta se balancea, el paquete viaja a la caja y aparece el ✓; cambia la variante elegida.
  - **Handy:** el especialista camina con su caja de herramientas, el alfiler flota y marca su zona, la llave gira.
  - **Gimnasios:** la barra sube, el anillo de la racha gira, la clase se mueve en la grilla.
  - **DentalOS:** el turno viaja a su nuevo lugar, aparece el mensaje y brilla la muela.
  - **Clínicas:** el pulso recorre la línea, suena la campana y el recordatorio llega a la agenda.
  - **VetOS:** las huellas caminan hasta la visita a domicilio y la llamada del tutor llega al paciente.
- También los seis cuadros de Media, el despiece de Equipamiento (flota y sus partes trabajan) y los emblemas de cada
  unidad (un alumno sube los niveles de Academy, la aguja de Intelligence mide, los paquetes llegan al centro de Agency).
- Aparecen antes: cada lámina empieza a dibujarse apenas asoma en la pantalla.
- Reglas que se mantienen: solo `transform`, `opacity` y `clip-path`; cada bucle corre solo mientras se ve y con la
  pestaña visible; con movimiento reducido todo queda quieto. Esto es una excepción a la regla de v3 «sin animación
  decorativa permanente», por decisión de Ignacio (anotada en `CLAUDE.md`).

### Verificación de esta vuelta

- `vitest`: 488 pruebas (nueva `tests/intro.test.ts`: tiempos sobre la grilla, música completa con melodía/armonía/bajo,
  escenario dentro de la pantalla, planes del catálogo, cuándo sale y cuándo no).
- e2e: **118/118**. Suma el comercial (sale después del loader, sonido apagado, cuatro productos + cuatro que vienen +
  cinco unidades + seis precios, «Saltar» y Escape devuelven la home con el foco en el H1, vuelve a salir al refrescar,
  nunca con un enlace a sección ni en otras páginas, tarjeta quieta con movimiento reducido), las pantallas de carga
  (noche hacia Media, luz hacia Roofy y página clara) y que las láminas se muevan.
- Navegador: sin errores de consola y sin scroll horizontal a 390 px; el sonido arranca y el comercial sigue su reloj.

## Decisiones que quedan para Ignacio

1. **Nombre visible: «Roofy» o «EstateOS».** D11 decía que el visitante ve «EstateOS». En esta web ahora dice «Roofy»
   (lo pediste así). El repo `roofy` y la demo todavía dicen EstateOS.
2. **Nombres de gimnasios y clínicas.** Hoy se muestran con el nombre del rubro («Gimnasios», «Clínicas»; «Academias» en
   portugués). Si van a tener nombre propio (como DentalOS y VetOS), es un cambio de una línea por idioma.
3. **Destino de «Conocer X».** Hoy cada uno abre su página dentro de Eclipse. Cuando Roofy o Handy publiquen su sitio, se
   carga el `site` en `content/products.json` y el botón pasa a llevar ahí.
4. **El selector de rubro** quedó solo en `/agency/`: desde la home, el banner de productos cumple su función.
5. **El comercial en cada refresh.** Hoy sale en cada carga de la home (como pediste); si querés que salga una vez por
   visita, es un cambio de una línea en `components/intro/introScript.ts`.
6. **La música del comercial.** Para escucharla: abrir la home y tocar «Activar sonido». Si querés otro carácter (más
   rápida, otro instrumento al frente), se cambia en `components/intro/score/jingle.ts`.

## Verificación

- `npx tsc --noEmit` limpio · `npx eslint .` 0 errores (5 avisos viejos en `docs/v3/qa-1.5/scripts`).
- `npx vitest run`: 37 archivos, **477 pruebas**. La nueva `tests/products.test.ts` (10) verifica:
  - los cuatro productos;
  - que solo Roofy tenga precio y que salga del catálogo;
  - la fecha de Handy en los tres idiomas;
  - que los textos estén completos y sin cifras;
  - el índice de las dos páginas;
  - el header;
  - la redirección de los enlaces viejos.
- `npm run build` (export estático): ok, con las páginas nuevas en es/en/pt.
- `node tests/e2e/smoke.mjs` contra el export servido en `/Eclipse-Web`: **97/97**. Agrega la home nueva, el recorrido
  fijado y su riel, las cuatro páginas de unidad, las de producto, la demo desde la página de Roofy y la redirección de
  `#precios`. El selector, la demo y los precios se prueban ahora en `/agency/`.
- Navegador: sin scroll horizontal a 360 px en las nueve páginas, un solo H1 en cada una y sin errores de consola. También
  se probaron el teclado en el banner (el foco trae la pantalla), movimiento reducido (sin fijado) y la navegación desde
  una página de unidad al banner (cae en el banner).
- Capturas: `docs/v3/capturas/home-productos/` (1440 y 360).
