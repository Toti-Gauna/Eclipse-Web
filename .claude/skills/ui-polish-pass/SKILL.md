---
name: ui-polish-pass
description: "Pasada de terminación premium sobre una pantalla o componente ya construido: detalles que hacen que una interfaz se sienta cara (radios concéntricos, sombras en capas, números tabulares, press 0.96, entradas escalonadas, estados completos, detector de «AI slop»). Sintetiza Impeccable, make-interfaces-feel-better y las skills de Emil Kowalski adaptadas al contrato de marca de Eclipse. Usala después de construir y antes de `design-review-rubric`."
---
# UI Polish Pass

## Propósito
Lo que separa una demo «linda» de un producto que se puede cobrar caro casi nunca es el layout: es la suma de 20 detalles chicos. Esta skill los revisa en orden fijo, sobre **una superficie acotada** (un componente o una sección, nunca «toda la web» de una vez), y entrega una tabla de cambios aplicables.

No reemplaza a `brand-contract` (Eclipse sigue siendo Eclipse: Geist / Geist Mono / Instrument Serif, paleta Efemérides) ni a `design-review-rubric` (el gate final). Va **entre** los dos.

## Fuentes (verificar vigente antes de instalar cualquiera)
| Fuente | Qué aporta | Licencia | Instalación (solo con sesión autorizada y OK de Ignacio) |
|---|---|---|---|
| **Impeccable** — `pbakaus/impeccable` | 24 comandos (`critique`, `audit`, `polish`, `bolder`, `quieter`, `distill`, `harden`, `adapt`, `live`…) + detector determinista de 62 reglas de «AI slop», sin LLM | Apache-2.0 | `npx impeccable install` → `/impeccable init` (escribe `PRODUCT.md`) → `/impeccable document` (escribe `DESIGN.md`). CI: `npx impeccable detect src/` y `npx impeccable detect http://localhost:3000` |
| **make-interfaces-feel-better** — `jakubkrehel/make-interfaces-feel-better` | 19 principios de terminación con valores exactos y formato de revisión `quick`/`full` | MIT | `npx skills@latest add jakubkrehel/make-interfaces-feel-better` |
| **Emil Kowalski skills** — `emilkowalski/skill` | `emil-design-eng`, `animate`, `review-animations`, `animation-performance`, `break-ui`, `mobile-native`, `remove-animations` | MIT | `npx skills@latest add emilkowalski/skills` (ya seleccionadas en el lote 0.3: `emil-design-eng`, `animate`, `animation-performance`) |

Confirmar autor, licencia, SHA y scripts antes de instalar: el nombre de una skill no prueba que el repo sea el oficial. Impeccable instala un **hook** que escanea cada archivo de UI que edita el agente: decidir con Ignacio si se activa en `Eclipse-Web`. Si se usa la regla `overused-font`, registrar Geist como fuente de marca para que no la marque (`npx impeccable ignores add-value overused-font Geist --reason "Brand font"`).

## Procedimiento (siempre en este orden)
1. **Acotar:** nombrar la superficie (`PricingCards`, `CheckoutSheet`, sección hero de TableFlow) y el sistema de estilos real del proyecto (Tailwind, CSS Modules…). Nunca introducir un segundo sistema de estilos para un arreglo.
2. **Detector:** si Impeccable está instalado, `npx impeccable detect <ruta|url>` y pegar los hallazgos. Si no, recorrer a mano la lista «Señales de plantilla» de abajo.
3. **Estados:** recorrer hover, focus-visible, active/pressed, disabled, loading, empty, error, éxito y datos extremos (`break-ui`: nombres de 60 caracteres, 0 ítems, 10 000 ítems, precios de 8 dígitos). Un componente premium sin estado vacío diseñado no es premium.
4. **Superficies y tipografía:** checklist de `references/checklist.md` (secciones A y B).
5. **Movimiento:** sección C del checklist; ver la animación al 10 % de velocidad en DevTools → Animations. Lo que se ve raro lento, se siente raro rápido.
6. **Móvil nativo:** sección D (100dvh, safe areas, inputs ≥ 16 px para que iOS no haga zoom, tap highlight, hover pegado).
7. **Reporte** con el formato de abajo y aplicar solo lo que respeta `brand-contract`.
8. Pasar a `design-review-rubric` con capturas antes/después.

## Señales de plantilla («AI slop») que bloquean una entrega premium
- Degradé violeta→azul, glow genérico, emojis como íconos.
- Tarjetas dentro de tarjetas; un ícono en cuadradito redondeado arriba de cada título.
- Texto gris sobre fondo de color; contraste insuficiente.
- Tres columnas de features idénticas como único recurso de layout.
- Botones píldora en todo; todos los radios iguales.
- Hero con titular centrado + subtítulo + 2 botones + mockup flotando, sin una idea visual propia.
- `transition: all`, animaciones de entrada en cada sección al hacer scroll.
- Números que saltan de ancho al cambiar (sin `tabular-nums`).
Regla: **cada pantalla tiene una idea visual central** (el plato que gira, el depósito isométrico, la factura que cambia de piel). Si no se puede nombrar, la pantalla todavía es una plantilla.

## Formato de reporte
Modo (`quick` = solo ALTA/MEDIA, máx. 5; `full` = máx. 15) · alcance exacto · sistema de estilos.

| Severidad | Ubicación (`archivo:línea` o pantalla/componente) | Antes | Después | Por qué (principio + impacto) |
|---|---|---|---|---|

- **ALTA:** vuelve algo inaccesible, engañoso, ilegible o molesto en cada uso.
- **MEDIA:** problema visible de usabilidad o consistencia.
- **BAJA:** pulido aislado (solo en `full`).
Consolidar un problema sistémico en una sola fila con todas las ubicaciones. No rellenar para llegar al tope. No decir que se revisó algo que no se miró.

## Qué requiere OK de Ignacio
Instalar cualquiera de las tres fuentes, activar el hook de Impeccable, sumar `motion`/`framer-motion` a un proyecto que no lo tiene.
