# Eclipse v3 · Fase 0 · Lote 0.3 — Skills verificadas (documental)

**Fecha:** 26/10/2026 · **Modelo y esfuerzo efectivos:** `claude-sonnet-5-5`, esfuerzo `high` (`get_session`) · **Tipo:** documental. **No se instaló, ejecutó ni compró nada.** Los paquetes del núcleo se descargaron a un directorio de auditoría aislado solo para leerlos y calcular hashes; ningún script se ejecutó. Gasto externo USD 0.

## 0. Informe en tres líneas

- **Qué cambió:** verifiqué los 10 repos del catálogo del 24/10 (9 sin cambios; `remotion-dev/skills` avanzó, pero está pospuesto) y preparé el manifiesto con SHA, archivos, hashes y pruebas de los 4 paquetes del núcleo (Frontend Design, GSAP React/Timeline/Performance, Emil, `shader-glsl`). Encontré 4 riesgos concretos que condicionan la instalación (§4).
- **Qué quedó abierto:** nada está instalado; este contenedor no tiene ninguna skill de Eclipse cargada ni `.claude/` en los repos, y la máquina de Ignacio no es accesible desde acá. El manifiesto de Emil solo se escaneó por patrones, no se leyó completo. Falta decidir el SDD del único efecto que justificaría `shader-glsl`.
- **Qué necesita el OK de Ignacio:** aprobar el manifiesto del §3 (qué paquetes entran y con qué alcance) y autorizar la sesión de instalación; el tope de gasto declarado para producción (ElevenLabs USD 11 por mes, Higgsfield USD 100 por mes, confirmados el 26/10/2026) queda registrado, no ejecutado.

## 1. Entradas

- Dependencia 0.2: cerrado (`docs/v3/lote-0.2-agentes-pr1.md`). Las correcciones de la PR #1 las aplica el ejecutor con permiso de Ignacio (26/10/2026); este lote no depende de que estén aplicadas.
- Fuentes leídas completas: lote 0.3, «Auditoría de skills · licencias y pruebas», «Stack · skills, mods y plugins» y «Diseño premium · profundidad, luz y motion».
- **Política vigente de modelos:** Sonnet habitual; Opus solo en hitos justificados y con el gate estético contra la línea base (decisión del 26/10, ver 0.2 §5).

## 2. Catálogo: decisión, cobertura y delta

| Paquete | SHA fijado (24/10) | HEAD hoy | Licencia (instrucciones) | Decisión | Cobertura real |
|---|---|---|---|---|---|
| Internas Eclipse (`agents`) | `a811427…` | igual | Propietario; sin LICENSE raíz | **Reutilizar** | 2 skills de frontend y 2 de trailer leídas (0.2); resto inventariado |
| Frontend Design (`anthropics/skills`) | `dbd4588…` | **sin cambios** | Apache-2.0 | **Núcleo** (una sola vía) | `SKILL.md` completo y licencia; sin scripts |
| GSAP React / Timeline / Performance (`greensock/gsap-skills`) | `aed9cfd…` | **sin cambios** | MIT (skill); runtime GSAP aparte | **Núcleo** | las 3 `SKILL.md` + LICENSE; las otras 5 skills del repo no auditadas |
| Emil (`emilkowalski/skills`) | no fijado antes; hoy `2d22863…` | n/a | MIT | **Núcleo** (`emil-design-eng`, `animate`, `animation-performance`) | frontmatter y escaneo de patrones de riesgo; **no leídas completas** |
| Shader GLSL (`iart-ai/webgl-animation-skills`) | `50697d6…` | **sin cambios** | MIT | **Condicionado** a un efecto concreto sobre OGL | `SKILL.md`, cookbook y LICENSE |
| Interface Design (`Dammyjay93`) | `2f9be32…` | sin cambios | MIT | Después, solo CRM (3.6) | `SKILL.md` completo (24/10) |
| Accessible/60fps (`iart-ai/web-animation-skills`) | `b6dba3e…` | sin cambios | MIT | Referencia, no pack | 2 subskills completas (24/10) |
| Higgsfield Generate | `f83af0b…` | sin cambios | MIT (skill) | Pospuesto hasta gate de assets | `higgsfield-generate` + catálogo (24/10) |
| ElevenLabs TTS/SFX | `9a1a4b7…` | sin cambios | MIT (skill) | Pospuesto hasta 3.4 | 3 skills (24/10) |
| Scrollcraft · Scroll World | `75d81f7…` · `ab91586…` | sin cambios | MIT | **Descartar como motor**; referencia | `SKILL.md` + scripts de red (24/10) |
| Remotion | `6c67adc…` | **`30d4553…` (avanzó)** | sin LICENSE raíz | Pospuesto | no reauditado: no entra al piloto |
| Impeccable, Design Motion Principles, Modern Web Guidance | sin fijar | `6743a34…`, `4a9ca87…`, `65e7edd…` | sin verificar | «Después» | solo existencia del repo; no leídos |

Rive, View Transitions y Theatre.js no son skills de este catálogo y quedan en las páginas de diseño como candidatos o pospuestos.

## 3. Manifiesto propuesto del núcleo (ninguno instalado)

Rutas relativas al repo origen, en el SHA indicado. Hash = primeros 16 caracteres de SHA-256 (se recalcula completo al instalar).

**A. Frontend Design — `anthropics/skills` @ `dbd4588f9e1033efb41dad4bef2f7947c8993d44`**
- `skills/frontend-design/SKILL.md` · 9.390 B · `d91970639e9f5c37`
- `skills/frontend-design/LICENSE.txt` · 10.174 B · `0d542e0c8804e39a`

**B. GSAP — `greensock/gsap-skills` @ `aed9cfd3277740755f6bfc1155c7aa645403b760`**
- `skills/gsap-react/SKILL.md` · 6.565 B · `88e2a5312b45e8cc`
- `skills/gsap-timeline/SKILL.md` · 4.394 B · `1a8b0f39cc4be3ed`
- `skills/gsap-performance/SKILL.md` · 4.139 B · `cb5408d6fba707aa`
- `LICENSE` · 1.066 B · `51b04b06556662dd` (se conserva junto a las tres)

**C. Emil — `emilkowalski/skills` @ `2d228630ba1446365f614a108cb8252f1feda202`** *(SHA fijado hoy; no hubo lectura previa)*
- `skills/emil-design-eng/SKILL.md` · 27.123 B · `ffbe68e6007fb42c`
- `skills/animate/SKILL.md` · 11.860 B · `b8ede161270458e6` y `skills/animate/RECIPES.md` · 7.957 B · `21ff63d84391db8d`
- `skills/animation-performance/SKILL.md` · 13.966 B · `ceb9dd3fe9126158`
- `LICENSE` · 1.070 B · `4ff5bdb7887ec143`
- **No** se copian: `animate-expo`, `apple-design`, `write-swift`, `mobile-native`, `ask-sonner`, `break-ui`, `prototype`, `pick-ui-library` ni el archivo vacío `.pl`.

**D. Shader GLSL — `iart-ai/webgl-animation-skills` @ `50697d659fbf70152f48f9f8aadf1efe78bbdde1`** *(solo si se aprueba un efecto concreto)*
- `skills/shader-glsl/SKILL.md` · 10.485 B · `5fbaf3066c303c2a`
- `skills/shader-glsl/references/glsl-cookbook.md` · 8.190 B · `5d9a14540fdc1920`
- `LICENSE` · 1.064 B · `33d6cd35a20903b5`

Total del núcleo A+B+C: 12 archivos de instrucciones, sin scripts ejecutables.

## 4. Riesgos encontrados (lectura y escaneo de los archivos del manifiesto)

1. **`gsap-react` incluye `npm install gsap` y `npm install @gsap/react`.** Ya están en `package.json` de Eclipse-Web (`gsap ^3.15.0`, `@gsap/react ^2.1.2`). Las skills son texto: instalarlas no ejecuta esos comandos, pero la sesión no debe seguirlos. La licencia MIT de la skill no define la del runtime GSAP; revisar la `LICENSE` de la versión del `package-lock.json` antes de redistribuir.
2. **`shader-glsl` asume Three.js y CDN.** Su `SKILL.md` genera un HTML único con `importmap` de `three` desde un CDN y usa `npx playwright screenshot` (descarga/autoinstalación). Eclipse usa **OGL**, no Three.js, y el plan prohíbe sumar Three.js por estética. *Condición:* adaptar a OGL, sin CDN ni `npx`, y solo para un efecto aprobado (propuesta: luz/máscara de la corona del hero).
3. **Emil: licencia solo a nivel de repo.** Las skills no declaran `license` en su frontmatter; el MIT es el del repositorio. `animate` exige extender los tokens existentes (`--ease-out`, etc.): compatible con `--ease-expo` de Eclipse, pero hay que confirmar en una lectura completa que no impone otras curvas.
4. **Solapamiento de criterios.** Emil + GSAP + `animation-performance` pueden dar tres reglas distintas de duración. Regla de Eclipse: gobierna `docs/v3` (contrato «Efemérides v3» de 1.4) y las duraciones de `motion.ts`; las skills aconsejan, no deciden. Una transición narrativa no se recorta por una regla de productividad.

Sin hallazgos de red, ejecución ni secretos en `frontend-design`, `gsap-timeline` ni `gsap-performance`.

## 5. Orden de instalación propuesto (ninguno ejecutado)

1. Internas de `agents` ya aprobadas (0.2): verificar que Claude las carga en una conversación nueva; el repo por sí solo no lo prueba.
2. **A + B** juntas (Frontend Design y las tres de GSAP), alcance de proyecto.
3. **C**: las tres skills de Emil, después de una lectura completa por la sesión de instalación.
4. **D** solo si hay un efecto aprobado; si no, no se instala.
5. Higgsfield y ElevenLabs: en el entorno de producción de assets, tras el SDD y el tope de gasto de 3.2–3.4. Interface Design: solo si 3.6 plantea un problema concreto del CRM.

## 6. Procedimientos

**Inventario previo (hecho, en este contenedor):** `~/.claude/skills` solo contiene `session-start-hook`; no hay `.claude/` en ninguno de los cinco repos; Claude Code `2.1.310`. **El entorno de Ignacio no se inspeccionó**, así que cualquier «ya instalado» allí es desconocido.

**Instalación manual:** checkout al SHA en un directorio de auditoría separado → leer `SKILL.md`, LICENSE y cada archivo referenciado → recalcular hashes y compararlos con §3 → copiar **solo** las carpetas del manifiesto a `.claude/skills/` del proyecto (si esa versión de cliente confirma esa ruta) sin sobrescribir otras skills → guardar copia del estado anterior. Nada de `curl | sh`, `@latest`, marketplace ni copiar repos enteros.

**Smoke sin gasto (conversación nueva):** que Claude enumere el nombre y la `description`, que lea el `SKILL.md` esperado y responda con un plan **sin ejecutarlo**; confirmar que no instaló dependencias ni llamó a ningún servicio. Pruebas específicas:
- *Frontend Design:* proponer el hero actual conservando Geist/Geist Mono/Instrument Serif, tokens y un único CTA ámbar sólido.
- *GSAP:* en un cambio local autorizado, montar y desmontar dos veces un componente y verificar contexto limpio, sin timelines ni listeners duplicados, y `prefers-reduced-motion`.
- *Emil:* una revisión de una transición existente (apertura de demo): debe respetar `motion.ts` y reportar, no reescribir.
- *shader-glsl:* shader estático compilado sobre OGL, con pérdida de contexto y fallback a póster.

**Retiro:** con el manifiesto, quitar solo los archivos agregados (verificando que no tengan cambios del usuario), restaurar la copia previa, confirmar que Claude ya no enumera la skill. No borrar `.claude` completo ni tocar otros proyectos.

## 7. Servicios y topes de gasto (declarados, no ejecutados)

- **ElevenLabs:** tope declarado por Ignacio **USD 11 por mes** (26/10/2026). En Notion, el plan Creator figura en USD 22/mes con promoción inicial de USD 11 (y Starter en USD 6/mes). La elegibilidad promocional no está comprobada: si no aplica, Creator (22) supera el tope y habría que usar Starter (6) o fijar otro tope.
- **Higgsfield:** tope declarado **USD 100 por mes** (26/10/2026). Las tarifas públicas por segundo (3.3) dan un orden de USD 1–5 por clip de prueba; la cotización real de la cuenta prevalece.
- **Suno:** sin tope declarado.
- Registrar un tope no autoriza comprar: cada compra pide cantidad, modelo, parámetros verificados y derechos antes de 3.2–3.4.

## 8. Criterios de aceptación de 0.3

- [x] Cada repo del catálogo tiene decisión, SHA y licencia o incertidumbre explícita (§2).
- [x] Todo candidato del núcleo tiene instalación, retiro y smoke definidos (§3, §6).
- [x] No se afirma revisión completa de lo no leído (§2, §4.3).
- [x] Scripts con red o autoinstalación identificados (§4.2).
- [x] El orden conserva el stack existente y no se ejecutó ninguna instalación (§5).
- [x] Afirmaciones de funcionamiento con evidencia o rotuladas no probadas (§6: smoke definido, no ejecutado).
- [x] Sin gastos, publicaciones ni cambios de alcance. Único cambio: este documento.
- [x] Contenido previo preservado; decisiones sustituidas con fuente y fecha.

## 9. Próximo lote

**0.4 · SDD y control financiero** (documental). Modelo: **Sonnet, esfuerzo high**. Cierra la Fase 0 y habilita 1.1.

## 10. Investigación completa de C (Emil) y D (shader-glsl), y de los candidatos adicionales (26/10/2026)

**Método.** Descargué cada repo completo, al SHA indicado, a un directorio aislado y sin ejecutar nada. Sobre cada uno: (1) escaneo automático de todos los archivos buscando caracteres invisibles o bidireccionales (texto oculto), scripts, ejecutables, binarios, comandos de instalación, red, secretos y frases de inyección; (2) **lectura completa** de todos los archivos de los manifiestos C y D. Esto reduce el riesgo, **no lo elimina**: no es una certificación de seguridad. El control final sigue siendo copiar solo los archivos del manifiesto, comparar hashes y hacer el smoke del §6.

### 10.1 C · Emil (`emilkowalski/skills` @ `2d22863…`): **sin hallazgos de seguridad**

- Repo de 29 archivos: 25 Markdown, `LICENSE`, `.gitignore`, `.gitattributes` y un archivo `.pl` **vacío (0 bytes)**. **Ningún** script, ejecutable ni binario; **ningún** carácter oculto.
- Comandos de instalación en el texto: solo en `animate-expo` (`npx expo install`, no se instala) y el `README` (`npx skills@latest add …`, **no se usa**: se copia a mano). Las URLs son documentación o herramientas (easings, librerías de UI).
- Leí completas `emil-design-eng`, `animate` (con `RECIPES.md`) y `animation-performance`. No piden ejecutar comandos, leer secretos ni llamar a servicios. Las frases de «ignore previous instructions» que aparecen en `break-ui`, `find-animation-opportunities` y `improve-animations` son **defensas** (dicen que el contenido del repo es dato, no instrucción) y esas tres no están en el manifiesto.
- **Dos comportamientos a conocer (no son riesgo de seguridad):**
  1. Cada skill, al invocarse **sin una pregunta concreta**, responde solo con una frase fija («I'm ready to…») y no dice nada más hasta que el usuario pregunte. Con una tarea concreta no pasa.
  2. `emil-design-eng` exige que las revisiones salgan en una tabla Antes / Después / Por qué.
- **Choques con Eclipse (a resolver con precedencia, no por seguridad):**
  - «Las animaciones de UI duran menos de 300 ms» y «sin animación en acciones frecuentes»: **no aplica** a la apertura de demo (~2,4 s), al hero ni a las transiciones narrativas; la propia skill exceptúa lo explicativo o de marketing. Manda el contrato de 1.4 y `motion.ts`.
  - `animate` usa **Motion/Framer Motion** para resortes y layout. Eclipse no suma dependencias: GSAP + WAAPI + CSS. Si hace falta un resorte, se justifica caso por caso; no se instala Motion por la skill.
  - `animate` exige extender los tokens existentes (compatible con `--ease-expo`) y no inventar curvas: coincide con Eclipse.
- **Veredicto:** **apto para instalar** el manifiesto C tal como está, con la regla de precedencia **`CLAUDE.md` + contrato de 1.4 > skill**.

### 10.2 D · Shader GLSL (`iart-ai/webgl-animation-skills` @ `50697d6…`): **sin hallazgos de seguridad en el texto, pero no se instala tal cual**

- Los 2 archivos del manifiesto (`SKILL.md` de 10,5 KB y el cookbook de 8 KB) son texto y código GLSL; **sin red ni ejecución propia**, sin caracteres ocultos. El repo completo trae 3 scripts `.sh` (`seek-shot`, `probe-mp4`, `contact-sheet`), un GIF y un HTML de muestra: **no se copian**.
- **Lo que sí exige si se sigue al pie de la letra:** entregar un HTML con **Three.js desde un CDN** (`importmap`), y verificar con `npx playwright screenshot` (descarga/ejecución de paquetes). Eso contradice el plan: Eclipse usa **OGL**, no sumó Three.js y no carga CDN.
- **Licencias de los snippets:** la skill es MIT, pero el cookbook copia código de terceros: el ruido simplex «Ashima/Gustavson» figura como «dominio público» y, según mi conocimiento, es MIT (Ashima Arts); las paletas coseno son de Inigo Quilez (corresponde atribución). *Verificar la licencia de cada snippet antes de pegarlo en el producto.*
- **Veredicto:** **no instalar la skill externa**. Cuando se apruebe un efecto concreto (propuesta: luz y máscara de la corona del hero), **escribir una skill interna `eclipse-glsl-ogl`** que tome del cookbook solo las funciones necesarias, con atribución, sobre OGL, sin CDN ni `npx`, con pérdida de contexto y póster de respaldo. Es más seguro y queda alineada con el stack.

### 10.3 Resultado de los demás candidatos

| Candidato | Contenido | Hallazgos | Veredicto |
|---|---|---|---|
| **GSAP** (resto del repo `greensock/gsap-skills`) | 8 skills de texto (`gsap-core`, `scrolltrigger`, `plugins`, `utils`, `frameworks`, + las 3 del manifiesto) y ejemplos con `package.json` | Sin ejecución en las skills; `npm install gsap` ya está en el proyecto. Los ejemplos (Nuxt, Vue, React, Vite) **no se copian** | **Apto**: sumar `gsap-scrolltrigger` y `gsap-core`, porque el hero ya usa ScrollTrigger |
| **Accessible Animation / 60fps** (`iart-ai/web-animation-skills`) | 6 archivos de texto en las 2 skills (+ scripts y 7 skills más fuera del manifiesto) | Sugieren `npx playwright screenshot` y CDN en demos; sin red propia | **Apto como referencia** (copiar solo esas 2 carpetas) |
| **Interface Design** (`Dammyjay93`) | `.claude/skills/interface-design` + plugin y marketplace | El `pre-commit` del repo es de sus mantenedores (no se copia); el README propone `npx skills add -y` (no se usa). Sin scripts en la skill | **Apto** solo para el CRM (3.6, 3.7), copiando solo la carpeta de la skill |
| **Design Motion Principles** (`kylezantos`) | 15 Markdown y 2 plantillas HTML | Sin scripts ni red; los HTML no contienen `<script>`. Es una **interpretación** del trabajo de Emil Kowalski, Jakub Krehel y Jhey Tompkins, no una skill escrita por ellos; **se solapa con Emil** | **Apto como complemento de revisión adversarial**; no instalar junto con todo Emil para repetir criterio |
| **Modern Web Guidance** (Google Chrome) | 219 guías Markdown de plataforma web + `package.json` con CLI | **Riesgo alto si se instala como skill:** su `SKILL.md` se declara «MANDATORY: Execute FIRST» para toda tarea web y manda ejecutar `npx modern-web-guidance@latest search/retrieve` (red + código remoto sin versión fija) | **No instalar la skill ni el CLI.** Sí **extraer como referencia estática** unas pocas guías (View Transitions, animaciones guiadas por scroll, `dialog`/`popover`, `@starting-style`) a una skill interna, respetando Apache-2.0 |
| **Impeccable** (`pbakaus`) | 4.357 archivos: CLI en Node, crates de Rust, extensión de navegador, VSCode, ~58 comandos y copias para ~20 agentes | **Riesgo alto:** el plugin instala **hooks** (`SessionStart`, `PostToolUse` en Edit/Write y `Stop`) que ejecutan un binario propio; `live` levanta un servidor local e inyecta scripts en el navegador; su `SKILL.md` pide correr `scripts/impeccable context` y empuja a diseño «audaz» (`bolder`, `overdrive`) que choca con conservar Efemérides; se solapa con Frontend Design | **No instalar ahora.** Si se reabre: solo la carpeta `reference/` de críticas, sin hooks, sin binario y sin modo `live`, tras auditar el binario |

## 11. Lista recomendada para una experiencia súper premium: 4 de núcleo + 6 más

**Núcleo (4)** — son los de §3, ahora con su investigación completa:
1. **Frontend Design** (Anthropic): composición, tipografía y contraste, subordinado a Efemérides. *Apto.*
2. **GSAP React / Timeline / Performance**: ciclo de vida limpio y secuencias. *Apto.*
3. **Emil** (`emil-design-eng`, `animate`, `animation-performance`): pulido y decisiones de movimiento. *Apto, con precedencia de `CLAUDE.md`.*
4. **Shader GLSL**: **como skill interna `eclipse-glsl-ogl`** (no la externa). *Condicionado a un efecto aprobado.*

**Los 6 más que recomiendo** (en orden de impacto):
5. **GSAP ScrollTrigger + Core** (mismo repo, MIT): el hero ya fija y escala con ScrollTrigger; la skill evita errores de pin, scrub y limpieza. *Apto.*
6. **Design Motion Principles**: revisión adversarial de movimiento con tres criterios distintos; sirve de segundo par de ojos de Emil, sin duplicarlo. *Apto, solo auditoría.*
7. **Accessible Animation + 60fps**: listas de verificación de movimiento reducido y rendimiento para el gate de 1.5. *Apto como referencia.*
8. **Guías estáticas de Modern Web Guidance** (View Transitions, scroll-driven, `dialog`, `@starting-style`), extraídas a una skill interna: continuidad espacial sin librería. *Apto solo extraídas.*
9. **Interface Design**, solo para el CRM de Lumen y los paneles de 3.6–3.7. *Apto, acotado.*
10. **Playwright para QA visual:** no requiere instalar nada nuevo, el proyecto ya tiene `@playwright/test` y `scripts/shot.mjs`. Se usa para las capturas antes/después de cada lote. *Ya disponible.*

**Con gate de gasto (se instalan cuando llegue su lote):** Higgsfield Generate y ElevenLabs TTS/SFX (topes: USD 100 y USD 11 por mes), con el audit del CLI y del schema; Suno sigue manual.

**No recomendados:** Impeccable (hooks y binario, solapamiento y estilo contrario a la marca), Scrollcraft y Scroll World (motores de scroll), Remotion, Theatre.js, Three.js y Lenis por estética, y cualquier skill que se instale con `npx … @latest`.

**Precedencia de reglas** para toda skill instalada: `Eclipse-Web/CLAUDE.md` → contrato «Efemérides v3» (lote 1.4) → decisiones de Ignacio → las skills. Las skills asesoran; no deciden.

**Manifiesto actualizado (propuesto, pendiente de aprobación):** A, B (+ `gsap-scrolltrigger`, `gsap-core`), C, y como referencia revisable 6 y 7; D se reemplaza por una skill interna cuando haya efecto aprobado; 8 y 9 se preparan en su lote. Nada está instalado.

## 12. Agentes de diseño y publicidad (26/10/2026)

Pedido de Ignacio: un agente de diseño «súper pro» y otro de publicidad. Se resolvió con **skills internas** (sin instalar nada externo): PR #2 de `agents` (borrador). Design: `brand-contract`, `typography-atlas`, `visual-styles-atlas`, `motion-atlas`, `three-d-webgl`, `higgsfield-direction`, `design-review-rubric`. Ads: `ad-brief-strategy`, `ad-hooks-copy`, `ad-video-direction`, `ad-platform-playbook`, `ad-compliance-honesty`, `ad-measurement-testing`. Las skills externas del §11 siguen siendo asesoras; la identidad visual la fija `brand-contract` y, por encima, `Eclipse-Web/CLAUDE.md`.

## 13. Aceptación del manifiesto (26/10/2026)

Ignacio aprobó el manifiesto **A, B y C** (Frontend Design; GSAP React/Timeline/Performance, con ScrollTrigger y Core; Emil: `emil-design-eng`, `animate`, `animation-performance`). **D** (`shader-glsl` externa) **no se instala**: se reemplaza por una skill interna sobre OGL cuando haya un efecto aprobado. Estado de 0.3: **aceptado con alcance A, B, C**. **Nada está instalado**: el lote 0.4 excluye instalar, así que la instalación va en una sesión propia, con el procedimiento del §6 (checkout al SHA, hashes, copia solo de las carpetas del manifiesto, rollback) y su OK de ejecución; propuesta: justo antes de 1.4, que es el primer lote que las usa.
