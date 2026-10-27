# Lote 3.5b · Kit de interacción premium (D34)

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-opus-5-5`, esfuerzo `high` (Ignacio cambió la sesión a Opus al empezar; `get_session` lo confirma) · **Ramas:** `roofy` y Eclipse-Web, ambas `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciadas desde `main` después del merge de 3.5) · **Resultado:** el estándar de la guía de motion §12 existe como kit en `roofy` y Lumen ya lo usa en todos sus chats, en la reserva de visitas, en el pipeline, en las fichas del sitio y en «Consultas». **No se publicó nada.**

**Fuentes leídas:** `estateos/guia-motion.v1.md` §12, `lote-3.1-direccion-estateos.md` (D34), `lote-3.5-base-roofy.md`, el código del kit de demos y de Lumen en `roofy`.

## 0. Informe en tres líneas

- **Qué cambió:** en EstateOS, Lumi ahora piensa antes de contestar («Pensando la respuesta…» con un pulso suave, 1,2–2,5 s, nunca igual dos veces seguidas) y escribe de a poco (30–45 caracteres/s; tocar muestra la respuesta entera). Las opciones esperan a que la respuesta termine. El escritorio y el celular muestran la misma espera al mismo tiempo. Agendar una visita y mover una tarjeta son instantáneos y se confirman con un aviso con «Deshacer». Agendar tiene un destello y un error simulado si el horario se ocupó mientras elegías. Abrir una ficha muestra un esqueleto breve. «Consultas» vacía dice qué hacer y trae el botón. Todo con el sello «Demostración guionada» y con movimiento reducido.
- **Qué quedó abierto:** el kit está en `roofy` y no en Eclipse-Web (allá la demo de Lumen sigue como estaba; se porta solo si se decide). La «Llamada simulada» y el resto de las pantallas llegan con cada demo por plan (3.6–3.8d), que usan este kit. No probé en un celular ni un Safari reales. Los tiempos los fijé dentro de los rangos de §12; hay que sentirlos en una pasada con Ignacio.
- **Qué necesita el OK de Ignacio:** aprobar los dos PRs. Sigue **3.6 · Demo Contact** (Opus · high), el control de estilo de las demos.

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Base | `roofy` `main` `ef0a2ba` (merge del PR #2); Eclipse-Web `main` `1c4cf33` (merge del PR #31) |
| Qué se corrió | `tsc`, `eslint`, `vitest`, `next build` y `npm audit` en `roofy`; Chromium (Playwright preinstalado) contra el export servido en local, con movimiento normal y reducido |
| Gasto | USD 0. Sin dependencias nuevas |

## 2. El kit (en `roofy/components/demos/kit`)

| Pieza | Qué hace |
|---|---|
| `pace.ts` | Tiempos de §12, puros y deterministas por mensaje: cuánto piensa una respuesta, a qué velocidad se escribe, en qué orden llegan (una por vez), qué se ve en cada instante y qué pasa al tocar. Sin React: se prueba con números |
| `pacer.ts` | El reloj real de una conversación: agenda los mensajes nuevos y despierta solo cuando algo cambia (cada 50 ms solo mientras se escribe). Lo que la conversación ya tenía la primera vez, o lo que pasó mientras nadie la miraba, aparece entero (es historia, no se repite) |
| `interaction.tsx` | `usePacedChat` y `PaceScopeProvider` (el ritmo de una conversación se comparte entre todas sus vistas), `ThinkingBubble`, `WrittenText`, `Seal`, `ConfirmProvider` / `useConfirm` / `ConfirmToast`, `Glint`, `useSimulatedLoad` / `Skeleton`, `SimError`, `EmptyState` |
| `ChatWidget` / `ChatPeek` | Piensan y escriben solos; las opciones esperan; `paceKey` comparte el ritmo; `pace={false}` para vistas previas |

Guía de uso para las demos siguientes: `roofy/docs/kit-interaccion.md`.

## 3. Decisiones tomadas dentro del lote

- **Tiempos deterministas por mensaje** (no al azar): así dos vistas de la misma historia quedan sincronizadas, y aun así dos respuestas seguidas nunca esperan lo mismo (diferencia mínima de 160 ms).
- **Una respuesta que la historia ya mostró «escribiendo» no vuelve a pensar**: las simulaciones (beats) ya tienen su espera; repetirla alargaría la historia.
- **Un solo aviso por acción.** El aviso de historia «Tu visita» de Lumen se quitó. La reserva del visitante la confirma el aviso del kit (desde el sitio) o la respuesta de Lumi (desde el chat), nunca los dos.
- **La confirmación llega a los 450 ms**, dentro del rango 400–700 ms de §12, y **espera mientras el puntero o el foco están encima**, para que «Deshacer» siempre se alcance con teclado.
- **Error simulado solo donde hay un camino real**: elegir un horario, que el chat lo ocupe y confirmar. No se inventó un error que no pueda pasar.
- **Sin carga falsa al cambiar de pestaña** en la app (es una acción frecuente). El esqueleto aparece solo al abrir una ficha del sitio, donde una carga es creíble.

## 4. Criterios (§12)

| Estado | Estado del criterio | Evidencia |
|---|---|---|
| Pensando 1,2–2,5 s, pulso suave, nunca igual dos veces | Cumplido | Pruebas de `pace.ts` (200 pares consecutivos); en el navegador, tres respuestas seguidas pensaron 1,55 s, 1,33 s y 1,65 s |
| Escribiendo 30–45 c/s, tocar para verla entera | Cumplido | Pruebas; con teclado, Enter sobre la burbuja la completa |
| Cargando ≤ 600 ms con la forma final | Cumplido | Esqueleto de la ficha 450 ms (se ve a los 120 ms y no está a los 820 ms) |
| Acción optimista + confirmación 3–4 s | Cumplido | Visita y tarjeta cambian al instante; aviso a los 450 ms, se va solo a los 3,6 s |
| «Deshacer» | Cumplido | La visita se borra de la agenda y vuelve el formulario; la tarjeta vuelve a «Nuevo» |
| Destello una vez en un éxito importante | Cumplido | Visita agendada (760 ms); no aparece con movimiento reducido |
| Error simulado con cómo seguir | Cumplido | «No hay lugar a las 12:00. Probá 14:30.» + «Agendar 14:30» |
| Vacío con la acción | Cumplido | «Consultas» antes de las 23:40: «Simular la consulta» juega el primer beat |
| Un solo estado de espera a la vez | Cumplido | Pruebas del orden de entrega; las opciones no vuelven hasta que la respuesta termina |
| Movimiento reducido | Cumplido | Las mismas esperas, «Pensando…» quieto y la respuesta entera; sin escritura ni destello |
| Sello del asistente | Cumplido | «Demostración guionada» en los tres chats de Lumi (es/en/pt) |
| Nada bloquea salir o cambiar de área | Cumplido | Todo es local al componente; al volver a un chat, lo que pasó mientras tanto aparece entero |
| Escritorio y celular en paso | Cumplido | Simular la consulta: los dos piensan a los 1,54 s y escriben a los 2,50 s |

## 5. QA

`roofy`: `tsc` y `eslint` limpios, **80 pruebas** (22 nuevas: `pace.test.ts` y `pacer.test.ts`), `next build` verde, `npm audit` 0. Navegador: 5 anchos × 3 idiomas sin desborde ni errores de consola, blancos táctiles ≥ 44 px en la barra y la entrada; recorrido completo (chat, error, reserva, deshacer, aviso que se va solo, pipeline, deshacer) con movimiento normal y reducido; celular a 360 px (chat pensando, aviso de reserva en la capa del comprador); teclado en inglés y portugués.

## 6. Riesgos y reversión

- **Sensación de los tiempos:** están dentro de los rangos, pero lo que se siente bien hay que mirarlo en vivo (pasada con Ignacio antes de replicar en 3.6–3.8d).
- **La demo de Lumen en Eclipse-Web no tiene el kit.** Es a propósito (cada demo evoluciona con su producto, `docs/procedencia-lumen.md` en `roofy`), pero las dos versiones se separan un poco más.
- Reversión: el kit es aditivo; quitar el PR de `roofy` devuelve los chats instantáneos de 3.5. Eclipse-Web solo cambia documentación.

## 7. Handoff

Habilita **3.6 · Demo Contact** (Opus · high, control de estilo de las demos), que construye sus pantallas con este kit. Las compuertas de gasto (3.2 fotos, 3.3 Higgsfield con Ignacio presente, 3.4 voz) siguen cerradas.
