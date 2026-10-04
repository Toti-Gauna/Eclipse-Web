# Inventario de contenidos v2 → v3

Inventario trazable del sitio v2 (rama `main`, commit dce1040) generado desde las fuentes reales
(`/content/*.json` y `messages/es.json`). Cada bloque indica dónde queda en la v3. Nada de esta lista se
borra: lo que deja de verse en superficie queda plegado (acordeón, tab o "Ver la cuenta") y sigue siendo
accesible con teclado y lector de pantalla. Los textos se muestran en español; en/pt tienen las mismas claves.

## Secciones y orden

| v2 (orden actual) | id | v3 (orden nuevo) |
|---|---|---|
| 01 Hero — "Antes de hablar, te mostramos tu negocio funcionando." | `#inicio` | 01 Hero (misma promesa) + atajos a Demos, Soluciones, Precios y Armar plan |
| 02 Calculadora — "¿Cuánto te cuesta no tener esto?" | `#problema` | 05 Calculadora de oportunidad (resumen compacto + "Ver la cuenta") |
| 03 Servicios — "Lo que construimos, pieza por pieza." | `#servicios` | 03 Soluciones: índice de 6 familias, una abierta por vez |
| 04 Sala de demos — "Mirá un negocio como el tuyo funcionando." | `#ejemplos` | 02 Demos: selector por rubro, vista desktop izquierda y mobile derecha, sin marcos |
| 05 Proceso — "Primero ves tu demo. Después hablamos." | `#proceso` | 06 Cómo trabajamos: 5 etapas compactas con plazo y detalle expandible |
| 06 Precios — "Cuánto cuesta y cómo se paga." | `#precios` | 04 Precios: tabs Paquetes / Pieza por pieza + mantenimiento visible |
| 07 Fundadores — "Clientes fundadores" | `#fundadores` | 07 Programa fundador: "recibís / te pedimos" juntos |
| 08 Cierre — "Tu negocio, a plena luz." + chat del agente | `#contacto` | 08 Preguntas, contacto y condiciones (incluye el chat del agente y el cierre) |

Header v2: Servicios · Ejemplos · Precios · Fundadores · Idioma y moneda · Sonido · "Armá tu plan" → v3: Servicios · Demos · Precios · Cómo trabajamos · "Pedí tu demo" (primario) · "Armá tu plan" (secundario) · "Ingresar" (portal demo) · preferencias agrupadas.

## Demos y trailers (6)

| Rubro | Demo | Negocio (ficticio) | Número clave (escenario Demo) | Dolor |
|---|---|---|---|---|
| Clínicas | `clinic` | Clínica Aurora | Recupera 12 turnos por semana | Turnos perdidos y ausencias |
| Inmobiliarias | `realEstate` | Lumen Propiedades | Responde el 100% de las consultas en < 1 min | Consultas sin responder fuera de horario |
| Gimnasios | `gym` | Órbita Fitness | −25% de bajas con misiones y rachas | Bajas de socios |
| Tiendas online | `shop` | Bruma Tostadores | Recupera 1 de cada 5 carritos abandonados | Carritos abandonados y consultas sin responder |
| Restaurantes | `restaurant` | Bodegón Lucero | Atiende 3 llamadas a la vez en hora pico | Pedidos y reservas perdidos en hora pico |
| Academias y cursos | `academy` | Atrio Idiomas | 82% de los alumnos termina el curso | Alumnos que abandonan a mitad de curso |

Cada demo conserva su comportamiento (navegable, loop con historia, interacciones) y su trailer de 15 s.

## Soluciones: 6 familias y 16 piezas (precio suelto, pago único)

**Web y marca** — Landing premium con motion graphics (USD 250) · Web multipágina (USD 450) · SEO + analytics (USD 150) · Trailer en motion graphics (USD 250)

**Gestión y operación** — Sistema de turnos (USD 400) · Sistema de pedidos (USD 400) · Automatizaciones (recordatorios, mails, seguimiento) (USD 300) · Dashboard interno (USD 400) · CRM + documentación interna (USD 600) · Gamificación y misiones (USD 700)

**Venta online** — E-commerce completo (USD 1.200)

**Apps a medida** — App on-demand (USD 3.500)

**IA y agentes** — Agente de voz con IA (USD 600) · Chatbot IA en WhatsApp/web (USD 350)

**Estrategia y crecimiento** — Marketing + estudio de mercado (USD 400) · Auditoría digital (USD 150)

## Paquetes (7)

| Paquete | Grupo | Desde | Hasta | Incluye (ids) | Mantenimiento sugerido |
|---|---|---|---|---|---|
| Diagnóstico | starter | USD 150 | USD 250 | auditoria |  |
| Presencia | starter | USD 250 | USD 400 | landing |  |
| Voz | starter | USD 500 | USD 700 | voz | esencial |
| Automatiza | starter | USD 400 | USD 700 | chatbot, automatizacion | esencial |
| Sistema (Recomendado) | complete | USD 1.000 | USD 1.500 | turnos, pedidos, automatizacion, dashboard, landing, voz | crecimiento |
| Comercio | complete | USD 2.000 | USD 3.500 | ecommerce, turnos, pedidos, automatizacion, dashboard, landing, gamificacion | escala |
| Plataforma | complete | USD 4.000 | USD 7.000 | app-ondemand, landing, crm, gamificacion, voz | escala |

## Mantenimiento

- **Esencial** USD 25/mes — Hosting, SSL, Backups semanales, 1 cambio menor por mes
- **Crecimiento** USD 79/mes — Todo lo de Esencial, Base de datos, Monitoreo, 3 h de cambios por mes, Reporte mensual
- **Escala** USD 199/mes — Todo lo de Crecimiento, Cloudflare Pro, Backups diarios, Respuesta en 24 h, 8 h de cambios por mes
- Pago anual: se cobran 10 meses (mientras la oferta anual esté activa). Uso del agente de voz: USD 49/mes + minutos según uso, siempre mensual.

## Ofertas reales (content/offers.json)

- **Precio fundador −20%** (activa) — Para los primeros 5 negocios. Incluye el primer mes de mantenimiento bonificado y prioridad en la cola.
- **Combo voz** (activa) — Agente de voz con IA a USD 300 en planes desde Sistema.
- **Pago anual: 2 meses gratis** (activa) — Pagás el mantenimiento anual y te bonificamos 2 meses.
- **Referidos** (activa) — 1 mes de mantenimiento gratis por cada cliente referido que cierre.

## Programa fundador

- Plazas: 5 (ocupadas: 0). Dato real del producto: se muestran las plazas.
- Trato (founders.deal): title: "Un trato de ida y vuelta" · get: "Lo que recibís" · give: "Lo que te pedimos" · priceText: "Sobre el total del desarrollo, mientras queden lugares." · maintenanceTitle: "Primer mes de mantenimiento" · maintenanceText: "El plan de mantenimiento que elijas, sin costo el primer mes." · priorityTitle: "Prioridad en la cola" · priorityText: "Tu proyecto arranca primero y tus pedidos pasan adelante." · testimonialTitle: "Tu testimonio" · testimonialText: "Con tus palabras: cómo te fue trabajando con nosotros." · caseTitle: "Tu caso, contado acá" · caseText: "Tu negocio y tus resultados, contados en esta sección." · referralTitle: "Un referido" · referralText: "Nos presentás a un negocio que pueda necesitarnos." · priceTitle: "Precio fundador" · priceValue: "−{percent}%" · maintenanceValue: "bonificado" · priorityValue: "arrancás primero" · testimonialValue: "con tus palabras" · caseValue: "con tu permiso" · referralValue: "1 negocio"

## Cómo trabajamos (5 etapas)

- **Demo de tu negocio** — Con tu nombre, tu rubro y tus servicios. Te llega por WhatsApp y la probás antes de cualquier llamada.
- **Llamada y propuesta** — Hablamos de lo que viste y te mandamos la propuesta por escrito: alcance, precio y plazos.
- **Seña y construcción** (Según alcance) — Con la seña arrancamos. Construimos sobre la demo que ya aprobaste y ves cada avance.
- **Entrega y capacitación** (Con tu equipo) — Lo publicamos, lo dejamos andando y te enseñamos a usarlo, a vos y a tu equipo.
- **Mantenimiento y mejoras** — Hosting, backups y cambios todos los meses. Tu sistema crece con tu negocio.
- Plazos: demo en 48 h, propuesta ≤ 24 h, construcción según alcance, entrega con tu equipo, mantenimiento desde el plan Esencial. La etapa de proyecto arranca con la seña ("Con la seña arrancamos. Construimos sobre la demo que ya aprobaste y ves cada avance.").

## Calculadora de oportunidad

- Entradas por rubro (7): pérdidas por semana, ticket/cuota en la moneda del visitante, horas por semana en tareas repetitivas. Supuestos: 1 mes = {weeks} semanas · 1 hora de tu equipo = {rate}. Tu número real puede ser otro.
- Resultado: pérdida por mes, por año, referencia en USD, desglose (ingresos que se escapan / horas del equipo), "Ver la cuenta", marco honesto: "Estimación con tus números". CTA de demo con el rubro y los números en el mensaje.

## Armador de plan (Objetivo → Piezas → Mantenimiento → Resumen)

- Objetivos (7): Que me encuentren · Atender 24/7 · Ordenar turnos y pedidos · Vender online · Fidelizar clientes · Una app propia · No sé: quiero un diagnóstico
- Piezas por categoría con precio e "incluida en el paquete X"; detección de paquete que conviene; un solo switch mensual/anual; uso del agente de voz aparte; precio fundador opt-in; resumen con pago único vs por mes, copiar link (URL compartible), copiar resumen y vista previa del mensaje de WhatsApp.

## Preferencias y contacto

- Idioma: Español (Argentina) · English · Português (Brasil). Moneda: USD (referencia) · ARS (dólar MEP) · BRL (ref. BCE), con cotización, fuente, fecha y la regla del "≈". Sonido: efectos y música ambiente (apagados por defecto).
- Contacto: WhatsApp y email (variables de entorno). Footer: Desarrollo, IA y automatización para negocios que no pueden esperar. / Eclipse es más que un estudio. Próximamente. · Unidades: Eclipse Agency, Eclipse Media, Eclipse Market.

## Fuera de alcance (no se tocan)

- Precios, monedas, descuentos, oferta fundador, plazos y condiciones: idénticos a `/content`.
- Lógica de precios (`lib/pricing.ts`), cotizaciones (`lib/currency.ts`), mensajes de WhatsApp (`lib/plan-message.ts`).
- Comportamiento interno de las 6 demos y sus historias.
