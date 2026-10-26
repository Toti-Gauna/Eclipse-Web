# Skills instaladas (proyecto Eclipse-Web)

**Sesión de instalación del 26/10/2026**, autorizada por Ignacio («antes de arrancar con 1.1, hacé eso»), siguiendo `lote-0.3-skills-verificadas.md` §5–§6. Alcance: **A, B y C** del manifiesto aprobado. **D (`shader-glsl`) no se instaló.** Modelo: `claude-sonnet-5-5` · high. Gasto externo: USD 0.

## Qué se instaló y de dónde

Descarga a un directorio aislado, al SHA fijado, sin ejecutar nada (`git fetch --depth 1 <sha>`):
- **anthropics/skills** @ `dbd4588f9e1033efb41dad4bef2f7947c8993d44`
- **emilkowalski/skills** @ `2d228630ba1446365f614a108cb8252f1feda202`
- **greensock/gsap-skills** @ `aed9cfd3277740755f6bfc1155c7aa645403b760`

| Skill | Origen | Notas |
|---|---|---|
| `frontend-design` | Anthropic (A) | licencia Apache-2.0 en `LICENSE.txt` |
| `gsap-react`, `gsap-timeline`, `gsap-performance` | GSAP (B) | MIT; hashes del manifiesto verificados |
| `gsap-core`, `gsap-scrolltrigger` | GSAP (B, ampliación aprobada en el manifiesto actualizado de 0.3 §11) | **no tenían hash en el manifiesto original**: se leyeron completas y se escanearon en esta sesión (sin Unicode oculto, sin comandos, solo enlaces a gsap.com) |
| `emil-design-eng`, `animate` (+ `RECIPES.md`), `animation-performance` | Emil Kowalski (C) | MIT del repo; hashes del manifiesto verificados |

**No se copiaron:** `animate-expo`, `apple-design`, `write-swift`, `mobile-native`, `ask-sonner`, `break-ui`, `prototype`, `pick-ui-library`, `gsap-plugins`, `gsap-utils`, `gsap-frameworks`, `.pl`, ejemplos ni scripts. Las skills instaladas **mencionan** algunas de esas (por ejemplo `pick-ui-library`, `review-animations`, `gsap-plugins`): no existen aquí y no hay que buscarlas ni instalarlas.

## Verificación hecha (E1 + comparación de hashes)

- Los **11 archivos con hash en el manifiesto** coincidieron en tamaño y SHA-256 con lo registrado en 0.3 §3 (0 diferencias).
- Los 2 archivos nuevos de GSAP: lectura completa y escaneo de Unicode invisible y de patrones de ejecución/red: sin hallazgos.
- **19 archivos copiados**; cada copia es **idéntica byte a byte** al origen (SHA-256 recalculado, 0 diferencias). La `LICENSE` del repo de origen se conserva dentro de cada carpeta (GSAP y Emil, MIT; Anthropic, `LICENSE.txt`).
- Frontmatter de las 9 `SKILL.md`: `name` igual al nombre de la carpeta y `description` presente.
- Antes de instalar: `.claude/` **no existía** en Eclipse-Web (nada que pisar ni copiar). `.claude` no está en `.gitignore`: las skills quedan versionadas con el proyecto. `vitest` solo corre `tests/**`; `eslint` y `tsc` no leen Markdown, así que no afectan los chequeos del repo.
- **No ejecutado:** el *smoke* en una conversación nueva (que Claude enumere las skills y responda con un plan sin ejecutarlo). Las skills de proyecto se cargan al **abrir** una sesión; esta sesión ya estaba abierta. **Primera tarea de la sesión de 1.1:** pedir que enumere nombre y descripción de las 9 skills y comprobar que no instala dependencias ni llama a servicios. Hasta entonces es *E1 (instalado y verificado en disco)*, no *E2 (cargado y probado)*.
- **Actualización (26/10/2026, misma sesión):** tras el push, el cliente listó las 9 skills con su nombre y descripción (coinciden con los `SKILL.md`): evidencia parcial de que se **enumeran**. Sigue pendiente comprobar, en la sesión de 1.1, que responden con un plan sin instalar dependencias ni llamar a servicios.

## Hashes completos (SHA-256) de lo instalado

| Archivo | Bytes | SHA-256 |
|---|---|---|
| `.claude/skills/animate/LICENSE` | 1.070 | `4ff5bdb7887ec1435c9cab0e8d1a7caee704d894d65c2a008ccc68b1cc2f260b` |
| `.claude/skills/animate/RECIPES.md` | 7.957 | `21ff63d84391db8d96ecdf9170095f55a42c836ccc36fd3269c4772bab031ba2` |
| `.claude/skills/animate/SKILL.md` | 11.860 | `b8ede161270458e6ae2e45e8a1985373515d4c63de5568ddb0f9012d7634356c` |
| `.claude/skills/animation-performance/LICENSE` | 1.070 | `4ff5bdb7887ec1435c9cab0e8d1a7caee704d894d65c2a008ccc68b1cc2f260b` |
| `.claude/skills/animation-performance/SKILL.md` | 13.966 | `ceb9dd3fe912615830f725a0120ccf8d012d15a6218001a5cd6c15d38e39a957` |
| `.claude/skills/emil-design-eng/LICENSE` | 1.070 | `4ff5bdb7887ec1435c9cab0e8d1a7caee704d894d65c2a008ccc68b1cc2f260b` |
| `.claude/skills/emil-design-eng/SKILL.md` | 27.123 | `ffbe68e6007fb42cb8149f089b400a1ca007d59ba23e8948e2be4476f3175939` |
| `.claude/skills/frontend-design/LICENSE.txt` | 10.174 | `0d542e0c8804e39aa7f37eb00da5a762149dc682d7829451287e11b938e94594` |
| `.claude/skills/frontend-design/SKILL.md` | 9.390 | `d91970639e9f5c37682ac7ab60094d35f1c7c1f38d731bd56396563aee10c1d3` |
| `.claude/skills/gsap-core/LICENSE` | 1.066 | `51b04b06556662dd817e8f4aa6d06bc7139dc73739e1319a7233cfde3e147b90` |
| `.claude/skills/gsap-core/SKILL.md` | 14.792 | `3887b47e050ab5afbe2a9a820f23d39fa02ab785e06a343be44c6f91d84d12b3` |
| `.claude/skills/gsap-performance/LICENSE` | 1.066 | `51b04b06556662dd817e8f4aa6d06bc7139dc73739e1319a7233cfde3e147b90` |
| `.claude/skills/gsap-performance/SKILL.md` | 4.139 | `cb5408d6fba707aabcbfe3320317a14c1f8fca6070074e5261047930f50d441e` |
| `.claude/skills/gsap-react/LICENSE` | 1.066 | `51b04b06556662dd817e8f4aa6d06bc7139dc73739e1319a7233cfde3e147b90` |
| `.claude/skills/gsap-react/SKILL.md` | 6.565 | `88e2a5312b45e8cc7b3c496637ff5bc9af2ae9c925b555c8b235b34cbc989d74` |
| `.claude/skills/gsap-scrolltrigger/LICENSE` | 1.066 | `51b04b06556662dd817e8f4aa6d06bc7139dc73739e1319a7233cfde3e147b90` |
| `.claude/skills/gsap-scrolltrigger/SKILL.md` | 18.390 | `9351b6666a4749c0740406ea363aaccb99a087ff45cc5e8b99a0f367facf3ef4` |
| `.claude/skills/gsap-timeline/LICENSE` | 1.066 | `51b04b06556662dd817e8f4aa6d06bc7139dc73739e1319a7233cfde3e147b90` |
| `.claude/skills/gsap-timeline/SKILL.md` | 4.394 | `1a8b0f39cc4be3ed3d834b89672e4ae2f151b901dc3450bebf10bbc45379fe02` |

## Cómo se desinstala (rollback)

`git rm -r .claude/skills` (o borrar solo la carpeta de una skill) y confirmar en una conversación nueva que Claude ya no la enumera. No tocar otros directorios de `.claude`. Estado previo: no existía `.claude/`. Reinstalar = repetir este procedimiento al mismo SHA y comparar con la tabla de hashes de arriba.

## Reglas de uso (precedencia)

Ver `CLAUDE.md` § «Skills de proyecto». Resumen: **`CLAUDE.md` y el contrato visual v3 mandan sobre las skills**; las skills aconsejan, no deciden.
