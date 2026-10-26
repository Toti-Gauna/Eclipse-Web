# Lote 1.2 · Home, loader y hero

**Fecha:** 26/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Rama:** `claude/eclipse-v3-inventory-audit-2ukttn` · **Resultado:** código de la home (Eclipse-Web). Nada se publicó: el PR se abre para que Ignacio lo apruebe y lo mergee (G5). Gasto externo: USD 0.
**Fuentes:** `lote-1.1-arquitectura-wireflows.md`, `lote-1.4-motion-direccion-visual.md` (§5.1–5.3, §5.7, §6, §9, §11), decisiones D8 / D9 / D10 de Ignacio, `CLAUDE.md`, `content/*.json`.

## 0. Informe en tres líneas

- **Qué cambió:** el hero dice «Potenciá y visibilizá tu negocio, y fidelizá clientes con Eclipse.» (D8) con **una** acción («Quiero potenciar mi negocio», enlace real) y una entrada directa a la demo de Inmobiliarias; **Fundadores salió** (D9); nueva sección **«Qué ofrecemos»** (SaaS · Agency · Studio · Academy · Equipamiento + Intelligence) y **«Para tu PyME»**; las 5 demos en *standby* dejaron de verse en hero, Demos y chat del agente; índice de secciones 01–08 renumerado. Rúbrica de 1.4 sobre lo nuevo: **12/14**, sin ejes en 0; ningún par de CTA ámbar en un mismo viewport (antes: un par).
- **Qué quedó abierto:** el CTA del hero baja a `#contacto` hasta que 1.3 conecte el selector; el builder («Armá tu plan») sigue accesible desde header, Precios y footer hasta 1.3/D6; la escena de Academy y Equipamiento es solo texto (no hay material); B4 (póster del trailer en móvil) y B6 (densidad de Precios) no se tocaron; mediciones de rendimiento y bloqueantes binarios completos van a 1.5.
- **Qué necesita el OK de Ignacio:** aprobar el PR; **D6** (qué reemplaza a los botones de plan/pieza ahora que el builder está dormido; recomiendo WhatsApp con el plan o la pieza elegida) y **D7** (cuándo construir Ecommerce; recomiendo después de EstateOS, con la fila «Próximamente»). Habilita **1.3 · Header y selector inmersivo** (Sonnet · high).

## 1. Qué se hizo, por pieza

| Pieza | Cambio | Dónde |
|---|---|---|
| Hero (D8) | Titular nuevo en es/en/pt; subtítulo y etiqueta conservados. CTA único `data-hero-cta` → `<a href="#contacto">` (`track('hero_cta_clicked')`, sonido `glint`). Debajo, «O mirá una demo ahora» con una sola tecla (`02 Inmobiliarias`) que abre la demo en la capa «Ver demo». Sin «Otro» ni rubros en *standby* | `components/hero/{Hero,HeroCta,HeroState,VerticalChips}.tsx`, `messages/*` |
| Fundadores (D9) | Sección, componentes, CSS, enlaces del índice y textos visibles eliminados. El contenido histórico sigue en `content/` (oferta fundador inactiva) y en `docs/v3/inventario.md` | `components/sections/founders/*` (borrado), `navLinks.ts`, `sectionIndex.ts`, `app/[locale]/page.tsx` |
| Standby de demos | `showcaseVerticals = verticals.filter(v => v.demo && !v.standby)`; hero, Demos y chat del agente usan solo esa lista (más «Otro» en el chat). Clinic, gym, restaurant, academy y Bruma siguen en el repo, con su copy y tests | `lib/content.ts`, `content/verticals.json`, `ExamplesSection.tsx`, `AgentChat.tsx` |
| Qué ofrecemos (§5.2) | Cinco líneas con escena activa (vista previa a la derecha en escritorio; acordeón en móvil con la primera abierta también en el HTML del servidor, regla de alturas). Intelligence como línea transversal. «Ver las 20 piezas, una por una» queda plegado. Sin precios ni «Sumar» (Precios sigue siendo el único lugar donde se agregan piezas) | `components/sections/services/{ServicesSection,LinesIndex}.tsx`, `lines.css`, `content/lines.json` |
| Para tu PyME (§5.3) | Tres puntos de partida (Empezar · Ordenar · Crecer), cada uno con las líneas que combina; dos enlaces: la cuenta y los precios. «No son planes»: no hay precio ni paquete inventado | `components/sections/pyme/*` |
| Orden de la home (D4) | Qué ofrecemos → Para tu PyME → Demos → [amanecer] → Precios → Calculadora → Cómo trabajamos → Contacto. **Desvío respecto de la regla v3 anterior:** las demos quedan antes del amanecer; los ids no cambian | `app/[locale]/page.tsx` |
| Loader | Sin cambios de comportamiento: se conserva (`data-loader="done"` en la home y en `/plan/`; el portal no lo carga) | — |

Copy de las líneas: sale de 2.1 («SaaS producto y uso; Agency integración/desarrollo; Studio creación profesional; Academy capacitación; Equipamiento hardware/instalación por pedido; Intelligence medición»). Es mínimo a propósito y 2.1 lo afina.

## 2. Puerta estética contra el baseline (1.4 §11)

Capturas finales: `docs/v3/capturas/despues-1.2/` (360, 390, 768, 1024, 1440, normal y *reduced*; mismo script `fullshot.mjs` que el baseline). Mismas condiciones que el baseline (Chromium headless 1×, `cv-off` para forzar secciones diferidas).

| Eje | Baseline | Ahora | Por qué |
|---|---|---|---|
| Identidad | 2 | 2 | Eclipse-instrumento, serif extremo y luz ámbar intactos; las líneas usan los mismos tokens |
| Jerarquía | 1 | 1 | El hero y Qué ofrecemos son claros; Precios sigue largo (B6, fuera de este lote) |
| Lectura | 2 | 2 | Titular de 3 líneas en 360, CTA dentro del primer pliegue en 6 viewports × 3 idiomas |
| Orientación | 1 | 2 | Los rubros aparecen una vez como acción (B3 resuelto); 8 secciones numeradas y sin Fundadores |
| Móvil | 1 | 1 | Sin desborde; B4 (póster del trailer) sin verificar en dispositivo |
| Acción principal | 1 | 2 | 7 CTA sólidos fuera del header, **0 pares** en un mismo viewport (360/1024/1440; antes 8 y un par, B1) |
| Movimiento | 2 | 2 | Panel de línea 0,28 s `--ease-expo`, solo `opacity`/`transform`, solo tras la primera interacción; *reduced* = fundido de 0,15 s |
| **Total** | **10/14** | **12/14** | Cumple el umbral (≥ 12, ningún 0). **No es 14:** Jerarquía y Móvil siguen en 1 por defectos fuera del alcance |

Defectos de 1.4 §5.7: **B1 resuelto** (se fue con Fundadores), **B3 resuelto** (hero, Demos y chat), **B5 parcial** (sin franja muerta en Fundadores; la columna derecha de Qué ofrecemos queda vacía bajo la vista previa en escritorio, ahora con la escena activa arriba).

## 3. Verificación (E2)

| Chequeo | Resultado |
|---|---|
| `npx tsc --noEmit`, `npx eslint` | sin errores |
| `npx vitest run` | 29 archivos, **388 pruebas** pasan (pruebas de contenido actualizadas: `showcaseVerticals`, líneas, sin fundadores) |
| `NEXT_PUBLIC_BASE_PATH=/Eclipse-Web npm run build` | exporta; sin `id="fundadores"`; H1 y CTA en el HTML del servidor en es/en/pt |
| `tests/e2e/smoke.mjs` sobre `out/` | **61/61** (ajustados: chips del hero, `#servicios` con el enlace a precios plegado, foco de anclas en `#contacto` en vez de `#fundadores`, una sola demo en la sala) |
| Desborde horizontal | 0 px en 360, 390, 768, 1024 y 1440 |
| Portal y `/plan/` | `/{es,en,pt}/portal/` y `/es/portal/proyectos/` sin loader y sin errores; `/plan/` y las tres portadas con `data-loader="done"` |
| Cambio de layout (A/B contra `main`, CPU ×4) | mismo desplazamiento intermitente de `.hero-copy-inner` (~0,044–0,048 en 1 de 6 corridas) en `main` y en la rama: **no es nuevo**, queda para 1.5 |

## 4. No ejecutado

- Medición de rendimiento antes/después con método de `rendimiento.md`: solo el A/B de CLS/LCP/TBT de control; el informe formal es de 1.5. No se hace ninguna afirmación de mejora.
- Prueba con teclado y lector de pantalla completas, contraste medido y foco de Atrás: 1.5.
- Prueba de 5 personas del selector: 1.3/1.5.

## 5. Rollback

`git revert` del commit de 1.2 devuelve la home de 1.4 (con Fundadores y los siete rubros). No toca `/content` comercial ni el backend. Las capturas nuevas son solo documentación.

## 6. Decisiones y handoff

- **D6** — Los botones «Armá tu plan», «Sumar» y los de pieza apuntan todavía al builder (dormido en 1.1). **Recomendación:** que lleven a WhatsApp con el plan o la pieza en el mensaje (`lib/whatsapp.ts`), sin precios.
- **D7** — Ecommerce como apartado propio. **Recomendación:** después de EstateOS; mientras tanto, la fila «Próximamente» del selector (1.3).
- Para 1.3: conectar `hero_cta_clicked` y la entrada directa al selector; decidir el destino real de «Armá tu plan» del header y del footer.
- Siguiente lote: **1.3 · Header y selector inmersivo — Sonnet · high.**
