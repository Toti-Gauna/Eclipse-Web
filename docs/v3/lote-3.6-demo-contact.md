# Lote 3.6 · Demo Contact

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-opus-5-5`, esfuerzo `high` · **Ramas:** `roofy` y Eclipse-Web, ambas `claude/eclipse-v3-inventory-audit-2ukttn` (desde `main` después del merge de 3.5b) · **Resultado:** la demo de Contact en EstateOS muestra todo lo que el plan incluye (D33): web completa, CRM completo, chat guiado y la puesta en marcha de marca. Es el **control de estilo de las demos**: si Ignacio la aprueba como premium, el mismo nivel se replica en 3.7–3.8d. **No se publicó nada.**

**Fuentes leídas:** `lote-3.1-direccion-estateos.md` §5–6 (brechas de Contact), `estateos/biblia-estateos.v2.md` (P1 Contact), `estateos/catalogo-estateos.v3.json` (plan `contact`, capacidades `web`, `crm_core`, `guided_chat`, `setup_brand`, decisiones D19–D21), `estateos/guia-motion.v1.md` §12 y el código de Lumen y del kit en `roofy`.

## 0. Informe en tres líneas

- **Qué cambió:** con `?plan=contact`, la demo de Lumen ya no dice «en preparación».
  - **Sitio:** la ficha web se completó (descripción, detalles, quién te atiende, compartir y similares).
  - **Chat:** el chat del sitio es el **chat guiado** con botones de D20, sin IA.
  - **CRM:** suma **Contactos** (ficha con historial, notas y tareas), **Tareas** (por día, con «hecha» y «Deshacer») y **Equipo** (dos roles, tabla de permisos y «Ver como», que filtra de verdad lo que ve un asesor).
  - **Marca:** muestra los entregables de la puesta en marcha (kit de marca, la web con y sin la marca, auditoría de dos perfiles, 12 hooks, 6 videos de ejemplo con guion y la guía operativa).
  - **Historia y guía:** la historia termina con la visita agendada (3 eventos; el seguimiento por WhatsApp es de Growth) y la guía tiene seis pasos propios.
- **Qué quedó abierto:** los números de la semana de Lumen («Primera respuesta 6 s», la lista de conversaciones) mezclan canales que en Contact no responden solos. El número clave ya cuenta solo el sitio y la lista ya no atribuye respuestas automáticas a WhatsApp ni a portales, pero el promedio de 6 s se revisa al construir Growth. El estilo lo tiene que juzgar Ignacio en vivo. No probé en un celular ni un Safari reales.
- **Qué necesita el OK de Ignacio:** decidir si Contact **es premium** (control de estilo) y aprobar los dos PRs. Sigue **V1 · Video de Contact + fábrica de videos** (Opus · high), el control de estilo de los videos.

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Base | `roofy` `main` `219f3d6` (merge de 3.5b); Eclipse-Web `main` `e392e22` |
| Qué se corrió | `tsc`, `eslint`, `vitest`, `next build` y `npm audit` en `roofy`; Chromium contra el export servido en local |
| Gasto | USD 0. Sin dependencias nuevas |

## 2. Qué se construyó (en `roofy`)

| Capacidad del catálogo | Antes | Ahora |
|---|---|---|
| `guided_chat` (D20) | El chat se presentaba como «asistente IA» y las consultas de WhatsApp y portales decían «IA · N s» | **Chat guiado** en todas las vistas (botones, guion fijo). Solo las consultas del sitio dicen «respondida en N s»; las demás muestran su canal. En Contact, el número clave cuenta las consultas del sitio. Una prueba falla si vuelve «IA»/«AI» en los textos de la demo |
| `crm_core` | Hoy, Consultas, Pipeline, Visitas | Más **Contactos** (lista y ficha: datos ficticios, qué busca, visitas, tareas, historial con notas), **Tareas** (por día, completar y deshacer, nueva tarea), **Equipo** (administradora y asesor, permisos por rol, invitaciones locales y «Ver como»: un asesor ve solo sus contactos y tareas, y la marca en solo lectura) |
| `web` | Ficha con fotos, plano, mapa y reserva | Más descripción, detalles (tipo, superficie, antigüedad, orientación, expensas, apto crédito), quién te atiende, compartir y propiedades similares |
| `setup_brand` | No existía | Área **Marca**: los seis entregables de la puesta en marcha (D19: incluida, acotada; lo que exceda se cotiza), el kit de marca, la web y una ficha con «Plantilla base» / «Con tu marca» (el plano 6 del video P1), la auditoría de dos perfiles (antes y después), 12 hooks para copiar, 6 videos de ejemplo con guion y la guía operativa |

Además, todo usa el kit de 3.5b: completar una tarea, guardar una nota, agregar una tarea, invitar o copiar se confirma con un aviso, con «Deshacer» cuando corresponde.

## 3. Decisiones tomadas dentro del lote

- **Chat guiado en todas las vistas, no solo en Contact.** Ningún plan del catálogo vende un asistente con IA en el sitio: presentarlo así en la demo general prometía algo que no está a la venta.
- **La historia de Contact termina con la visita.** Los beats de seguimiento por WhatsApp pertenecen a `whatsapp_auto` (Growth): `beatLimitFor` los quita según el catálogo, no a mano.
- **Dos roles, no más.** El catálogo dice «roles básicos». Administradora y asesor alcanzan para mostrar permisos reales («Ver como» cambia lo que se ve). Los permisos más finos quedan para planes superiores si el catálogo los suma.
- **Los videos de Marca son ejemplos con guion, no videos.** El catálogo los define como «ejemplos educativos, no anuncios exclusivos». La producción mensual es de Growth y la pantalla lo dice.
- **Notas e invitaciones se escriben de verdad pero quedan en la demo.** Nada se envía y el texto lo aclara.

## 4. Criterios

| Criterio | Estado | Evidencia |
|---|---|---|
| Todo lo que Contact incluye está en pantalla | Cumplido | `web`, `crm_core`, `guided_chat` y `setup_brand` mapeados a áreas (`TAB_CAPABILITY`); `PLAN_DEMO_STATUS.contact = built` y el aviso de «en preparación» desaparece |
| Lo que no incluye se ve bloqueado y con su plan | Cumplido | «Seguimientos» con candado («Desde Growth · USD 75/mes»); simulación de 3 eventos en lugar de 5 |
| Cada control funciona con datos locales | Cumplido | Nota guardada y deshecha; tarea completada (aparece en el historial); tarea agregada y deshecha; «Ver como Marcos» (8 → 4 contactos, marca en solo lectura, sin invitar) y vuelta; hook copiado; guion de un video; similar abre otra ficha; compartir |
| La historia de Contact | Cumplido | Tres simulaciones: Carolina queda en «Visita» con su historial y la tarea de confirmar la visita |
| Guía propia | Cumplido | Seis pasos: simular (texto propio de Contact), chat guiado, sitio, contactos, pipeline, marca |
| Sin texto fijo, tres idiomas | Cumplido | Paridad de claves (prueba de mensajes) y textos revisados en es/en/pt |
| Mobile-first y sin errores | Cumplido | 3 idiomas × 360/1024/1440 px en las áreas nuevas sin desborde; 15 casos de la base (3.5) sin desborde ni errores |
| Movimiento reducido | Cumplido | El cambio de marca se descubre con un borde que pasa (`clip-path`), que con movimiento reducido es instantáneo; el resto usa el kit |
| ¿Es premium? | **Lo decide Ignacio** | Control de estilo de las demos |

## 5. QA

`roofy`: `tsc` y `eslint` limpios, **89 pruebas** (9 nuevas: `contact.test.ts` y el límite de beats), `next build` verde, `npm audit` 0. Navegador: recorrido completo de cada área nueva, regresión del 3.5b (chat, reserva, error, deshacer, pipeline) y de la base del 3.5 (15 casos), las dos guías (Contact y general).

## 6. Riesgos y reversión

- **Volumen de textos** (263 claves nuevas por idioma): están revisados, pero conviene una lectura de Ignacio en portugués.
- **La demo de Lumen de Eclipse-Web sigue diciendo «asistente IA».** Es otra copia (la de la landing) y este lote no la toca; si se quiere el mismo criterio allá, es un cambio aparte.
- Reversión: el lote es aditivo en `roofy` salvo el cambio de textos del chat; revertir el PR vuelve al estado de 3.5b.

## 7. Handoff

Si Contact se aprueba como premium, habilita **V1** (video de Contact + fábrica de videos, Opus · high), que filma esta demo cuadro por cuadro. Si no, se corrige acá antes de replicar el nivel en 3.7–3.8d. Las compuertas de gasto (3.2 fotos, 3.3 Higgsfield con Ignacio presente, 3.4 voz) siguen cerradas.
