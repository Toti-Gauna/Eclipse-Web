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


---

# Sesión de instalación del 31/10/2026 — lote premium-UI

Autorizada por Ignacio en el chat del 31/10/2026 («creá skills, instalalas para Claude»). Rama `feature/skills-premium-ui`, por PR (no se commitea a `main`). Gasto externo: USD 0. Nada se ejecutó: solo se copiaron archivos.

## Qué se instaló y de dónde

Descarga a un directorio aislado con `git clone --depth 1`, sin ejecutar nada:
- **pbakaus/impeccable** @ `b7a89176e4e87422b40f98adabceb051dbb5448b` (Apache-2.0, v4.8.0)
- **jakubkrehel/make-interfaces-feel-better** @ `35545ea1512ad59fa463e6b1f95ca9c052981fe6` (MIT)
- **emilkowalski/skills** @ `a81dbca07f2217b7103e510c0f13f8d5b017afc9` (MIT; SHA distinto al de la sesión del 26/10: las skills ya instaladas NO se actualizaron)
- **Toti-Gauna/agents**, rama `feature/eclipse-v3-premium-commerce-skills` (PR #4): skills internas de Eclipse Design

| Skill | Origen | Notas |
|---|---|---|
| `impeccable` | Impeccable | **Solo `SKILL.md`, `reference/`, `LICENSE` y `NOTICE.md`.** NO se copiaron `scripts/` (el lanzador descarga un binario en el primer uso, contra la regla «nunca buscar en la red en tiempo de ejecución»), ni el hook de `.claude/settings.json`, ni los subagentes. La skill trae su propio camino «Launcher unavailable»: lee PRODUCT.md/DESIGN.md directo. El detector (`npx impeccable detect`) lo corre Ignacio a mano si quiere, nunca el agente |
| `make-interfaces-feel-better` | Jakub Krehel | `SKILL.md` + 5 referencias + `LICENSE`; no se copió `agents/openai.yaml` |
| `break-ui` (+ `CATALOG.md`), `mobile-native` | Emil Kowalski | `CATALOG.md` contiene un emoji con ZWJ (U+200D) **a propósito**: es dato de prueba («nombres extremos»), revisado a mano |
| `ui-polish-pass`, `commerce-signature-patterns`, `isometric-scenes`, `product-configurator-3d` | Eclipse (agents) | Internas; sus comandos de instalación son informativos y no se ejecutan |

**No se instalaron:** `review-animations` e `improve-animations` (siguen excluidas a propósito según `CLAUDE.md`), `prototype`, `pick-ui-library`, los subagentes y el hook de Impeccable.

## Verificación hecha

- Escaneo de Unicode invisible en los 67 archivos: un único hallazgo, el ZWJ legítimo de `break-ui/CATALOG.md`.
- Búsqueda de comandos (`curl`, `wget`, `npm install`, `npx`, `pip install`): solo menciones en la documentación de Impeccable (`doctor.md`, `hooks.md`); no hay scripts copiados que los ejecuten.
- Frontmatter: `name` igual al nombre de la carpeta en las 8 `SKILL.md`.
- Pendiente (E2): en una conversación nueva, pedir que enumere las skills y comprobar que no instala dependencias ni llama servicios.

## Conflictos conocidos (gana `CLAUDE.md`)

- `impeccable` y `make-interfaces-feel-better` sugieren Motion/Framer Motion para ciertos casos: **no se agrega**; GSAP, WAAPI o CSS.
- `impeccable` marca fuentes «sobreusadas»: Geist, Geist Mono e Instrument Serif son la marca y no se cambian.
- Las duraciones cortas de UI no aplican a la apertura de demos (~2,4 s), al hero ni a las transiciones narrativas.
- `impeccable init`/`document` escriben `PRODUCT.md`/`DESIGN.md`: solo con OK de Ignacio, porque `CLAUDE.md` y el contrato v3 ya son la fuente de verdad.

## Hashes (SHA-256)

| Archivo | Bytes | SHA-256 |
|---|---|---|
| `.claude/skills/impeccable/LICENSE` | 10.766 | `02bb8c3b4e70190e3986c0404ad2fd8d639b4f534252d82379cc1b502b6d1812` |
| `.claude/skills/impeccable/NOTICE.md` | 503 | `c60a093c2845fd9fb82f9c6f742ece31f379f8190b535309d32d66c45ccffdcb` |
| `.claude/skills/impeccable/SKILL.md` | 12.009 | `a2ba4387401c11dc28fd58d4962df1a8dd39d5c3b1fdca45549171c6c26d6e4e` |
| `.claude/skills/impeccable/reference/adapt.md` | 11.313 | `5826bb4bca75d7b891bed17ff03bd3b685dff0e4f26d387fa6190d4ba3f065e4` |
| `.claude/skills/impeccable/reference/adapt.native.md` | 3.910 | `acbeecbcbf6558d438ed4aec6b85027d72587bf181b8ae12d4dfbe8dce62e9a5` |
| `.claude/skills/impeccable/reference/android.md` | 4.203 | `43780abcf10ac12a569d98001ae38af2b337727a0f7ce66268246ac1d54b5d34` |
| `.claude/skills/impeccable/reference/animate.md` | 5.236 | `94b4ce6299fea93d9f256b2d25705961a76bc5ea940c56db4145686ebc99df1b` |
| `.claude/skills/impeccable/reference/audit.md` | 9.584 | `a24d86f22f23ac594c87dfffce68b03cb475efbae48a84652ad9023d96295df5` |
| `.claude/skills/impeccable/reference/audit.native.md` | 8.326 | `33a4ac3906140cfd73f65cd35026867e261adf411da0fc6da95770d9b6edeb81` |
| `.claude/skills/impeccable/reference/bolder.md` | 3.497 | `bd217b7bc011c2346ce94902071ecd940aa017e8f563539e31c1ad38ce256401` |
| `.claude/skills/impeccable/reference/clarify.md` | 4.590 | `6c382f8283756e8a693d832b750f7e4cbff1ca5bdcc3825b2b4ef4da9f21876a` |
| `.claude/skills/impeccable/reference/colorize.md` | 4.537 | `d1fbd55074abb2251bdaa03749d34acc42c38e46e47549f18f5848df57d43c42` |
| `.claude/skills/impeccable/reference/component-review.md` | 8.017 | `6996198844d6459392b816e7bfb7d256f07b6884614e88069ffab5544b4886df` |
| `.claude/skills/impeccable/reference/craft-floor.md` | 4.516 | `ba01bbab98671095b76c2170324abdcceb55fd39fd281bc46daddc2b3c2b0753` |
| `.claude/skills/impeccable/reference/craft.md` | 555 | `9205e222bc6565b37fb504ceec93233c2d2a456802b69d16e6b1c44723907c4c` |
| `.claude/skills/impeccable/reference/critique.md` | 45.636 | `7f67463a6417e6df65d4b77a8ac9c79e53324877bca4a96d1fc0985a2a454b7d` |
| `.claude/skills/impeccable/reference/delight.md` | 3.716 | `56500b1f9d2fcec8324d7f448d813048b5831a46d3feeb1055bd3eb17ec3660f` |
| `.claude/skills/impeccable/reference/distill.md` | 5.529 | `09785674279df0a5df6623e5bb986f5445810e4f40ce4407d30f5c175dde279e` |
| `.claude/skills/impeccable/reference/doctor.md` | 5.617 | `5b89d4b4c2acd125bc6a4f4839b2312b8b95ea94160960e987163c714dd98f54` |
| `.claude/skills/impeccable/reference/document.md` | 27.457 | `677004e61b08d2e04d3578e394fdd991cfa33c0111a7d85b5b66c80326c615fc` |
| `.claude/skills/impeccable/reference/extract.md` | 3.337 | `29044a3df6598786b2f9023af89aa6683b9745b7cd9a0c89386da2d0e50e0166` |
| `.claude/skills/impeccable/reference/generate.md` | 13.152 | `b174077972447e829db722dacbf6d6bb643184832b42686f17492348bab9bfe8` |
| `.claude/skills/impeccable/reference/harden.md` | 10.748 | `98244db22d907a134cac0c94ffb829ba480ba61cfac67ae155ac2f46444da7c9` |
| `.claude/skills/impeccable/reference/hooks.md` | 15.165 | `f5cc9e41ae9007d6b0cbece5c72acc8f91add7062fca8248a6039dae01378690` |
| `.claude/skills/impeccable/reference/init.md` | 11.697 | `fd37f029837277e93f26d69ddb6cc74af2ffe7d71f56df9d9c04adec77ae77d7` |
| `.claude/skills/impeccable/reference/ios.md` | 3.812 | `40c87038b5f75147a5952a96237acf312a327bf70c1bcd8e0a5f064625ae9668` |
| `.claude/skills/impeccable/reference/layout.md` | 5.161 | `64802d14087fc96b38ef3881fef8098b36068d07f3b942031637b18eef3dd2af` |
| `.claude/skills/impeccable/reference/live-setup.md` | 8.186 | `6e7e3b7c4cf331cdb43f4546c164acd6c45a267ce3289dcfa87e13202d98c747` |
| `.claude/skills/impeccable/reference/live.md` | 37.244 | `3fca4b57fa81ea624882734dc0de207afe4d1f6a9d38f8eff26c12cd3f762d62` |
| `.claude/skills/impeccable/reference/mode-operate.md` | 4.716 | `7a52dd7a94ee75f6ae89542c86a1b6e1d306812b16e0d9dbf12d4acad44d148b` |
| `.claude/skills/impeccable/reference/mode-persuade.md` | 3.638 | `21e78c8a77badb3f83290cd4577ed3b24bd4dd3b57136d7da75733d4f3ee9ac0` |
| `.claude/skills/impeccable/reference/mode-read.md` | 4.396 | `a569989e6a3d6453b4c45e9474e162a15cc54e11732ac6baa7990a6e7cccc0b5` |
| `.claude/skills/impeccable/reference/new-work.md` | 63.084 | `c11c41ea944143a90c0917b08ae6442d20116ab8dca7fd51eaca490bbb020fed` |
| `.claude/skills/impeccable/reference/onboard.md` | 7.688 | `eb713f3d6686bac6431dd874f7b02358b4cf08e879e11bf747d75660dedd685a` |
| `.claude/skills/impeccable/reference/operate.md` | 4.145 | `a9d2203acd45ca33a13d5c68b02b23ed512425ac15f0e8438318ed124b43729d` |
| `.claude/skills/impeccable/reference/optimize.md` | 7.577 | `7ecc07226fa99b198eba37ea57f3c3e2465a80cc65093f0098dc888f7ee27273` |
| `.claude/skills/impeccable/reference/overdrive.md` | 9.010 | `83c7786c640b0e6ea61e2b2ff0f93193ba1f68e907b32f2bd56f32bb7a60018f` |
| `.claude/skills/impeccable/reference/polish.md` | 6.646 | `b8d49a3cab3428d9f351502e9c2c5802cef187e0d2af626ef3e1cd1837fd06bf` |
| `.claude/skills/impeccable/reference/quieter.md` | 4.951 | `b0018ae21f320aabfe3ca9d9f8e0c2c5a5bf74c6eb4e572e3d408c38cd19f5ec` |
| `.claude/skills/impeccable/reference/region-map.md` | 3.361 | `4ea8e05d0f88d24f182ad554da84317f90b9730e29fad262143ddf423a1f8645` |
| `.claude/skills/impeccable/reference/routing.md` | 3.336 | `56285b28b0ffe471761c2ad062d3f933ed2346ca1b617f1323a30fed99a1a852` |
| `.claude/skills/impeccable/reference/shape.md` | 3.547 | `a55f016c046cb6a27c55bd7f346375aeb506a755c4fbca19a5f92dbd42309c23` |
| `.claude/skills/impeccable/reference/typeset.md` | 6.263 | `c9943e06ca311258d8aa5a5c65f5beb7a46c57c5e9a2075d2a246bf1337f00bb` |
| `.claude/skills/impeccable/reference/visualize.md` | 13.956 | `a2be08335e1e5f0dab5ae445e24c0d0d5699752e9656bd5f9b8065af9b347a03` |
| `.claude/skills/impeccable/reference/degraded/asset-producer.md` | 8.429 | `a83cfd24bf58bc8997540577651a485f1eca38fd324106d8bedeab2394fb169e` |
| `.claude/skills/impeccable/reference/degraded/documenter.md` | 3.325 | `bcc05ea92faebb5c74037a9d4263a5ce9a56f5ab07c8ab3c59ee704d8cade745` |
| `.claude/skills/impeccable/reference/degraded/finish-reviewer.md` | 15.803 | `c33c4cfa7f0ce0bedde80d4fc3b595e747d0e9b43a77f06cacb8e899802f709d` |
| `.claude/skills/impeccable/reference/degraded/manual-edit-applier.md` | 7.636 | `cf9048c15e1b0935d8b38be54c4d21f77cce60e7c1ef28a6d9bab4b008977c4b` |
| `.claude/skills/make-interfaces-feel-better/LICENSE` | 1.069 | `ed1dfe988fc40511b4845ccd9050a143a2002fee3bedc8064c47fa342b5d8d4f` |
| `.claude/skills/make-interfaces-feel-better/SKILL.md` | 11.818 | `c1d508fa7bef8e47ee682b4f214c7a4ed1416b91d05a97285e555bad1c41a23e` |
| `.claude/skills/make-interfaces-feel-better/animations.md` | 12.711 | `248ad6d995b4a80038c7fec2ec2c4761fdad49738aca070bd3ca727e19a5f2c8` |
| `.claude/skills/make-interfaces-feel-better/icons.md` | 2.277 | `746601dcf81a322c8ba5cc5730f991496dd94dc63279bc363f781666f84fa6b0` |
| `.claude/skills/make-interfaces-feel-better/performance.md` | 3.046 | `f1e8b9f22de1081d1d22cd2923fdec4441ff6192082dc6988435310635e76e8f` |
| `.claude/skills/make-interfaces-feel-better/surfaces.md` | 7.239 | `36d7845774eb331d9889112c5339c80bbe72a342c61dd941372e5e168b9ebf45` |
| `.claude/skills/make-interfaces-feel-better/typography.md` | 4.690 | `518cae9f0d48d48081cd87739993d76e145c0fe2394bb9f95cbde2b003c44549` |
| `.claude/skills/break-ui/CATALOG.md` | 8.268 | `7358efcc6bb48e35187be1c064cf60022dcb18c72c18fab58b606dfc5f421f15` |
| `.claude/skills/break-ui/LICENSE` | 1.070 | `4ff5bdb7887ec1435c9cab0e8d1a7caee704d894d65c2a008ccc68b1cc2f260b` |
| `.claude/skills/break-ui/SKILL.md` | 14.380 | `e7eec1d70ac56a04255e9c0dbe98084ea3d544cc04aaad34f32c95d6fa9dff5e` |
| `.claude/skills/mobile-native/LICENSE` | 1.070 | `4ff5bdb7887ec1435c9cab0e8d1a7caee704d894d65c2a008ccc68b1cc2f260b` |
| `.claude/skills/mobile-native/SKILL.md` | 16.838 | `888b7651d66d66dbac4e72b7c554638eb19bd971d686d6cbdf030a5ef3788f55` |
| `.claude/skills/ui-polish-pass/SKILL.md` | 5.513 | `a3082e266ba160c8ad4dca23b4eb341b43fdce364a21d5aa00b1b6742ff8e2fc` |
| `.claude/skills/ui-polish-pass/references/checklist.md` | 4.596 | `f1ae4f5346d68832a35119256e665294107f59c470d66e5b7f5716125ac3a142` |
| `.claude/skills/commerce-signature-patterns/SKILL.md` | 4.779 | `ba005e7baec85807c25da8ccd40abcb5db60ef6abc3bf9bee6d6e9a7eaca9c52` |
| `.claude/skills/commerce-signature-patterns/references/patterns.md` | 10.232 | `09ea92d3e31b5d3151a35ffea6306ca10645b80ab7ecfda86d68bca49642b30f` |
| `.claude/skills/commerce-signature-patterns/references/video-sources.md` | 2.630 | `dc39a323d7439135a2c1c49c29c5ef7224eeea3b616e3c43cbd41fbe39ac58ce` |
| `.claude/skills/isometric-scenes/SKILL.md` | 4.669 | `5997900daa8aa8d064629f82ed86a685f1ad19cac9923b0ff5a285a8ca1b064e` |
| `.claude/skills/product-configurator-3d/SKILL.md` | 5.110 | `c69d201293539b6337251af845c2b73cc07da181c54a11e05e1331391d16df67` |

## Rollback

`git rm -r .claude/skills/<nombre>` por cada skill de esta sesión (lista arriba) y confirmar en una conversación nueva que Claude ya no las enumera. Las nueve skills del 26/10 no se tocaron.
