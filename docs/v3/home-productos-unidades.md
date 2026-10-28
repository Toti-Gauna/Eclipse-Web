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

## Decisiones que quedan para Ignacio

1. **Nombre visible: «Roofy» o «EstateOS».** D11 decía que el visitante ve «EstateOS». En esta web ahora dice «Roofy»
   (lo pediste así). El repo `roofy` y la demo todavía dicen EstateOS.
2. **Nombres de gimnasios y clínicas.** Hoy se muestran con el nombre del rubro («Gimnasios», «Clínicas»; «Academias» en
   portugués). Si van a tener nombre propio (como DentalOS y VetOS), es un cambio de una línea por idioma.
3. **Destino de «Conocer X».** Hoy cada uno abre su página dentro de Eclipse. Cuando Roofy o Handy publiquen su sitio, se
   carga el `site` en `content/products.json` y el botón pasa a llevar ahí.
4. **El selector de rubro** quedó solo en `/agency/`: desde la home, el banner de productos cumple su función.

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
