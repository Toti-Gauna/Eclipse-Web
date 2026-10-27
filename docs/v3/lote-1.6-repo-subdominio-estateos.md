# Lote 1.6 · Repo y subdominio EstateOS

**Fecha:** 27/10/2026 · **Modelo efectivo:** `claude-sonnet-5-5`, esfuerzo `high` · **Ramas:** Eclipse-Web `claude/eclipse-v3-inventory-audit-2ukttn` (reiniciada desde `main` = `5844b20`, merge del PR #27) y `roofy` `claude/eclipse-v3-inventory-audit-2ukttn` (commit `509edae`) · **Resultado:** repo `roofy` con el esqueleto, contrato de enlace probado en los dos repos y publicación de prueba **preparada y apagada**. No se publicó nada.

**Fuentes leídas:** `lote-0.4` (fila 14.1 y D11), `lote-1.5` (D11), `lote-2.1`, Notion «Fase 3 · EstateOS vendible» (no hay una página propia del lote 1.6: la especificación es la fila 14.1 de la matriz), `lib/showroom.ts`, `lib/currency.ts`, `components/layout/navLinks.ts`, `.github/workflows/hostinger.yml`, `scripts/hostinger-*.sh` y la configuración de build de Eclipse-Web.
**Límites:** el subdominio **no es alcanzable desde este entorno** (el proxy responde 403 a `roofy.eclipse-business.com` y a `eclipse-business.com`), así que no verifiqué DNS, HTTPS ni qué sirve hoy; tampoco hay acceso a Hostinger.

## 0. Informe en tres líneas

- **Qué cambió:** el repo `roofy` (estaba vacío) tiene el esqueleto de EstateOS: mismo stack y versiones que Eclipse-Web, una página «en preparación» en es/en/pt con `noindex`, y el **contrato de enlace** (idioma por ruta, moneda/vista/área/utm por URL, listas cerradas) con un fixture que es **el mismo archivo en los dos repos** y se prueba de ambos lados; en Eclipse-Web quedó `lib/estateos-link.ts`, inactivo. La publicación de prueba está lista y **apagada**: el script rechaza el `public_html` del sitio principal y revierte si el chequeo falla.
- **Qué quedó abierto:** (1) `roofy` **no tiene `main`**, así que no se puede abrir un PR: el trabajo está en una rama; (2) la publicación real necesita la carpeta del subdominio, variables y secrets de Hostinger (`roofy/docs/despliegue.md`); (3) lo probé contra un árbol simulado, **no contra Hostinger**; (4) `npm audit` marca `next` como crítico en **Eclipse-Web** (ver §6); (5) la fila «Inmobiliarias» del selector sigue abriendo la demo de Lumen, como dice D11, hasta que EstateOS esté publicado.
- **Qué necesita el OK de Ignacio:** crear `main` en `roofy` (basta un commit inicial desde GitHub) para abrir el PR; los datos de Hostinger y la activación de la publicación de prueba; y decidir si arreglo el aviso de `next` en Eclipse-Web en un cambio aparte. Sigue **3.1** (Opus), que no depende de este lote.

## 1. Registro de entrada (G0)

| Dato | Valor |
|---|---|
| Repo `roofy` | Vacío (sin commits ni `main`), privado, `can_push: true` |
| Eclipse-Web | `main` `5844b20`; `git status` limpio al empezar |
| Qué se corrió | `vitest`, `eslint`, `tsc`, `next build` en `roofy`; `vitest` de Eclipse-Web (22 pruebas nuevas); un navegador real (Playwright preinstalado) contra el export servido en local; el script de publicación contra un árbol simulado |
| Contacto externo | Ninguno. Se probó el subdominio solo para saber si era alcanzable (no lo es desde acá) |
| Gasto | USD 0 |

## 2. Qué es el esqueleto

| Pieza | Decisión |
|---|---|
| Stack | Next 16 con export estático, TypeScript, Tailwind v4, next-intl (es/en/pt): **las mismas versiones** que Eclipse-Web (se partió de su lockfile). Sin GSAP ni OGL; **ninguna dependencia nueva** |
| Marca | Mismos tokens (`--void`, `--corona`, …), mismas fuentes (Geist, Geist Mono, Instrument Serif) y el mismo ícono. El visitante ve **EstateOS**; «roofy» solo existe en el repo y el subdominio |
| Página | «EstateOS · En preparación»: una frase que manda de vuelta a la demo en Eclipse, el idioma y un panel técnico «Prueba del enlace» que muestra lo que trajo la URL (se quita en 3.5). Sin precios, sin promesas de funciones, sin formularios |
| No indexable | `noindex` en las páginas, `robots.txt` con `Disallow: /` y `X-Robots-Tag`. Se quita en 3.9 con tu OK |
| Reglas del repo | `CLAUDE.md` heredado de Eclipse-Web (honestidad, tono, mobile-first, accesibilidad, movimiento reducido, un ámbar) y `README.md` |

## 3. Contrato de enlace (idioma y moneda por URL)

Resumen; la especificación completa está en `roofy/docs/contrato-enlace.md`.

- **Por qué por URL:** son orígenes distintos; la moneda que eligió el visitante vive en el `localStorage` de Eclipse y EstateOS no la puede leer.
- **Idioma** en la ruta (`/es/`, `/en/`, `/pt/`); **moneda** en `?moneda=ARS|BRL|USD`; **vista** `entrada|guia|branding|intelligence|academy` y **área** `recepcion|administracion|ventas|marketing` (solo dentro de la guía), las mismas listas del showroom; **campaña** `utm_*` con caracteres acotados.
- **Listas cerradas:** se compara contra constantes y se usa la constante; lo recibido nunca se muestra ni se arma en un `href`. Un valor inválido se descarta y la URL se limpia sin agregar historial; los parámetros ajenos se conservan. Sin datos del visitante en la URL.
- **Ida y vuelta:** Eclipse → EstateOS con `estateosUrl()`; EstateOS → Eclipse con `buildEclipseUrl()` (vuelve al mismo idioma y, si la visita traía moneda, a la misma moneda; secciones `inicio … contacto`, sin la sección de Fundadores que se quitó).
- **Cómo se evita que los dos lados se desincronicen:** `tests/fixtures/handoff-cases.json` es **el mismo archivo** en los dos repos (digest `144cfcaf…2597`). Cada lado prueba sus dos direcciones contra él y el de Eclipse-Web además fija el digest.
- **Inactivo en Eclipse-Web:** nadie llama a `estateosUrl()` todavía. Cablearlo (la fila «Inmobiliarias» y leer `moneda` al volver) es de los lotes 3.5–3.9, cuando haya algo que mostrar.

## 4. Publicación de prueba

- **Hecho:** `.github/workflows/hostinger.yml` (construye en cada push/PR; publica **solo** con `HOSTINGER_DEPLOY_ENABLED = true`), `scripts/hostinger-publish.sh` (backup, publicación y reversión) y `scripts/hostinger-smoke.sh` (chequeo público de solo lectura).
- **Seguridad del script:** rechaza el `public_html` del sitio principal (`eclipse-business.com`), rutas inesperadas y carpetas inexistentes; exige un `.htaccess` previo de EstateOS o ninguno; rechaza enlaces simbólicos y exports incompletos; usa su propia carpeta privada (`.eclipse-deploy-estateos`) separada de la del sitio de Eclipse.
- **Falta de tu lado:** confirmar la carpeta del subdominio en hPanel; cargar `HOSTINGER_HOST`, `HOSTINGER_PORT`, `HOSTINGER_USER` y `HOSTINGER_PATH` como variables y `HOSTINGER_SSH_KEY` y `HOSTINGER_KNOWN_HOSTS` como secrets (los mismos valores que usa el sitio de Eclipse); activar la variable. Pasos en `roofy/docs/despliegue.md`.

## 5. Verificación

| Qué | Resultado |
|---|---|
| `roofy`: `vitest` | 40/40 (contrato: 4 direcciones sobre el fixture, listas, digest; mensajes: mismas claves en los tres idiomas) |
| `roofy`: `lint`, `typecheck`, `build` | Sin errores; export con `/es/`, `/en/`, `/pt/`, `404.html`, `robots.txt` |
| `roofy`: `npm audit` | 0 vulnerabilidades (tras `npm audit fix`, solo lockfile) |
| Prueba de mutación | Quitar la regla «área solo con guía» hace fallar 2 pruebas del contrato; con el código restaurado, 40/40 |
| Eclipse-Web: `vitest tests/estateos-link.test.ts` | 22/22; `tsc` y `eslint` sin errores en los archivos nuevos |
| Navegador (Chromium) a 360 y 1440 px | 18 comprobaciones: la raíz redirige al idioma del navegador **conservando la query**; el panel lee moneda, vista y área; los links de idioma conservan lo recibido; «Volver a Eclipse» lleva idioma y moneda; valores inválidos se limpian de la URL **sin mostrarse**; moneda por defecto por idioma; 404 en los tres idiomas; `noindex`; primer `Tab` en el link de volver; todos los links ≥ 44 px; sin scroll horizontal; sin errores de consola |
| Script de publicación (árbol simulado) | Publicar, revertir (borra solo lo agregado) y 8 rechazos: sitio principal (con y sin barra), ruta con `..` o más profunda, carpeta inexistente, export incompleto, `.htaccess` ajeno, enlace simbólico, bloqueo activo. El sitio principal simulado quedó intacto. Las dos disposiciones de carpeta de Hostinger se aceptan |
| `smoke.sh` | Pasa contra el export servido en local; falla (código 7) contra un servidor inalcanzable |
| **No verificado** | Hostinger real (SSH, permisos, `mod_headers`), DNS y HTTPS del subdominio, el workflow en GitHub Actions (solo se validó la sintaxis del YAML) |

## 6. Hallazgos

1. **`roofy` no tiene rama `main`:** GitHub no permite abrir un PR sin una rama base. Por eso el trabajo quedó en una rama y **no hay PR**. Con un commit inicial en `main` (README desde la web de GitHub) lo abro.
2. **`npm audit` en Eclipse-Web marca 3 avisos (1 crítico, 2 altos) en el lockfile:** `next` 16.3.8 (rango afectado 16.0.0–16.4.0: RCE en la optimización de imágenes con SVG, DoS con Server Actions, RCE en funciones con `use cache`), `vite` 8.3.2 y `zod` (herramientas de desarrollo). **No aplican al sitio publicado** según el código: no hay `use server` ni `use cache`, no se usa `next/image`, `images.unoptimized` es `true` y el sitio es un export estático servido por Hostinger sin servidor de Next. Aun así conviene subir los parches: `npm audit fix` actualiza solo el lockfile (en `roofy` dejó `next` 16.4.3). **No lo hice en Eclipse-Web** porque está en producción y pide el e2e completo; es un cambio chico aparte. El CI de Eclipse-Web no corre `npm audit`, por eso no lo mostró.
3. **El mismo problema de avisos nuevos le pasó al backend** (`body-parser`, `zod`), ya resuelto en Eclipse-be #11.
4. **El sandbox no llega a `eclipse-business.com` ni al subdominio** (403 del proxy): no puedo confirmar que el subdominio de Hostinger ya resuelva, ni qué sirve hoy.

## 7. Decisiones tomadas (se pueden revertir)

| # | Decisión | Por qué |
|---|---|---|
| 1 | Mismo stack y versiones que Eclipse-Web, partiendo de su lockfile | Los componentes y tokens de 3.5–3.9 se reutilizan sin adaptar |
| 2 | Parámetros en español (`moneda`, `vista`, `area`), igual que `rubro` del showroom | Una sola convención en las URLs de Eclipse |
| 3 | Este lado tolera valores inválidos (los descarta); el showroom de Eclipse es estricto | Un enlace de afuera no debe terminar en un error |
| 4 | El contrato vive como código + fixture en cada repo, no como paquete compartido | Un paquete compartido sería una dependencia nueva para dos funciones chicas |
| 5 | Publicación apagada por una variable del repo, no por un flag en el código | Es lo que usa el sitio de Eclipse y no se activa con un cambio de código |
| 6 | Rama con el nombre de las demás (`claude/eclipse-v3-inventory-audit-2ukttn`) | Consistencia; no se tocó ninguna otra rama |

## 8. Efectos en lotes siguientes

- **3.5:** se cablea `estateosUrl()` en la fila «Inmobiliarias» (con la demo de Lumen de respaldo hasta que esté publicado) y se quita el panel de prueba.
- **3.9:** se quitan `noindex`, `robots.txt` y `X-Robots-Tag` con tu OK; antes, activar la publicación real y correr el chequeo público.
- **4.1/4.3:** consolidan en este repo, como dice D11.
