# Integración con el backend (fase 8)

La web pública puede conectarse al backend real (`Eclipse-be`, Express/Prisma, OpenAPI **0.7.0**) para tres cosas:
cuentas de cliente, solicitudes de plan desde «Armá tu plan» y el portal (proyectos, avances y documentos).
**Sin backend configurado el sitio es exactamente el de siempre**: portal de demostración con fixtures rotulados
«Demo» y el flujo por WhatsApp.

## Modos y variables

| Variable | Valor | Efecto |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | vacío (default) | Sin backend. Modo `demo`. |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3000`, `https://api.eclipse-business.com` | Origen del API, sin `/` final, sin path/query/credenciales (si no es válido se ignora y queda `demo`). |
| `NEXT_PUBLIC_PORTAL_MODE` | `live` | Con URL válida: portal y solicitudes contra el API. Cualquier otro valor: `demo`. |

El modo se resuelve **en build** (`lib/env.ts` → `resolvePortalConfig`, con tests): `IS_LIVE`, `API_BASE_URL`.
Son valores públicos; no hay secretos del lado del cliente ni se ponen en `.env` claves, hashes ni conexiones.

- **demo:** `/portal/` es el ingreso de demostración, `/portal/proyectos/` y `/portal/proyectos/<id>/` usan
  `lib/portal/fixtures.ts`, el aviso «Vista de demostración» está en cada pantalla y las pantallas nuevas
  (registro, solicitudes…) muestran «necesita el portal conectado». Ninguna pantalla hace requests de red.
- **live:** el portal **nunca** usa fixtures ni muestra datos inventados. El aviso y el badge «Demo» desaparecen,
  `/portal/proyectos/<id>/` queda como una página inerte (`demo-off`) y el copy de los fixtures (`portal.demo`,
  `notice`, `login`, `guide`) no viaja al navegador (ver `app/[locale]/portal/layout.tsx`).

## Rutas

| Ruta (todas bajo `/[locale]/portal/`, `noindex`) | Modo | Qué hace |
|---|---|---|
| `/` | ambos | demo: ingreso de ejemplo · live: **login real** (`?next=` seguro, `?expired=1`) |
| `registro/` | live | Crear cuenta. Respuesta neutra (202 igual para email nuevo o existente). |
| `verificar-email/` | live | Destino del link del correo (`#token=…`) + reenvío de enlace. |
| `recuperar-contrasena/` | live | Pedir el enlace; con `#token=…`, formulario de contraseña nueva. |
| `proyectos/` | ambos | demo: fixtures · live: `GET /client/projects` (tabla en escritorio, tarjetas en celular). |
| `proyecto/?id=<uuid>` | live | Detalle. **Una sola página estática** que lee el id en runtime (los ids reales no existen al build); el id se valida como UUID antes de pedir nada. |
| `solicitudes/` | live | Historial de solicitudes de plan (estado, estimación, respuesta pública). |
| `solicitud/?id=<uuid>` | live | Detalle de una solicitud (y cancelación si está abierta). |
| `proyectos/<id>/` | demo | Detalle de los fixtures (sin cambios). |

Los links de los correos del backend (`CLIENT_VERIFY_EMAIL_URL`, `CLIENT_PASSWORD_RESET_URL`) deben apuntar a
`https://<dominio>/<locale>/portal/verificar-email/` y `…/recuperar-contrasena/` (el servidor de pruebas usa `es`).

Desconocido vs ajeno: el API devuelve el mismo 404 y la web muestra el mismo estado «no encontramos…» para ambos.
Sin email verificado el API responde 403 a proyectos y altas de solicitud: la web muestra el estado «verificá tu email»
(con reenvío) en vez de un error.

## Cómo se usan cookies y CSRF (`lib/api/`)

- Las cookies de sesión (`eclipse-client-access`, `eclipse-client-refresh`, `eclipse-preauth`) son **HttpOnly** y las
  pone el API; el código no las lee ni las escribe. Todas las llamadas usan `credentials: 'include'`; el navegador
  envía el `Origin` (debe estar en `ALLOWED_ORIGINS` del backend).
- **CSRF anónimo** (registro, login, verificación y recuperación): `GET /auth/csrf` → `{csrfToken}`, cacheado en
  memoria 5 min (la cookie dura 10) y enviado como `X-CSRF-Token`; ante un 403 se pide uno nuevo y se reintenta una vez.
- **CSRF de sesión**: lo devuelve el login; tras un reload se recupera con `GET /auth/client/csrf`. Solo en memoria.
  Un 403 en una mutación con sesión hace una recuperación y un reintento (si el token no cambió, el 403 es real).
- **401 → un refresh**: `POST /auth/client/refresh` con `{}` (single-flight: llamadas simultáneas comparten **un**
  refresh, porque el backend revoca la familia ante un refresh reutilizado) y **un** reintento. Si el refresh se
  rechaza, la sesión terminó: el contexto pasa a anónimo y la pantalla vuelve al login (`?expired=1`). Un fallo de
  red durante el refresh **no** cierra la sesión.
- Errores `{error:{code,message},requestId}` → `ApiError` (`code`, `status`, `requestId`, `retryAfter`); la UI
  nunca muestra texto del servidor, solo copy traducido por tipo (`errorKind`) y la referencia para soporte.
- Timeouts (15 s; 60 s en descargas), cancelación con `AbortController`, sin logs de cuerpos.
- **Nada de tokens, CSRF, refresh o contraseñas en `localStorage`/`sessionStorage`/cookies propias/URLs** (hay tests
  que lo verifican, también en el navegador). Lo único que guarda el armador en `sessionStorage` es la selección del plan
  (preexistente, no sensible).
- Tokens de enlaces (verificación/reset): llegan en el **fragmento**, la página los lee, los borra de la barra
  (`history.replaceState`) y los envía en el cuerpo JSON de un POST **solo al tocar un botón** (abrir el link no
  consume nada; así los scanners de enlaces no lo gastan). El token vive en memoria de React.
- `session` (`components/providers/SessionProvider.tsx`): `disabled | unknown | loading | anonymous | authenticated |
  error`. No pide nada hasta que una pantalla lo necesita: las páginas públicas de la landing no llaman al API.

## «Armá tu plan» → solicitud

- WhatsApp queda **igual** (botón del dock). En modo live el resumen suma el bloque **Enviar solicitud**
  (`components/plan-builder/RequestAction.tsx`).
- Anónimo: enlaces a ingresar / crear cuenta con `?next=/plan/?<selección>` (la selección ya vive en el link del plan,
  `lib/plan-url.ts`); al volver, el armador abre el resumen con lo mismo. `next` solo admite rutas internas
  `/portal/…` y `/plan/…` (`safeNext`, con tests).
- Con sesión verificada: nombre + teléfono E.164 (se normalizan separadores, nunca se adivina el país) + mensaje opcional.
  `GET /catalog/plans` aporta `catalogVersion`; se envía la **selección** (jamás precios) a
  `POST /client/plan-requests` con `Idempotency-Key`. Éxito solo con 201/200. Fallo de red/5xx: «Reintentar» reutiliza
  la **misma** clave (no duplica); cambiar el contenido la renueva. 409 → se relee el catálogo y se pide revisar.
- **Mapeo** (`lib/plan-request.ts`): los ids de paquetes, piezas, mantenimientos, rubros y objetivos son idénticos en la
  web y en el backend; solo cambia la unidad (USD vs centavos). `toApiSelection` descarta extras repetidos de un
  paquete (y su bonus) y conserva los tres significados de `maintenance` (omitido / `null` / id).
  `catalogMismatches(catalog)` compara contenido y catálogo (precios, rangos, piezas, bonus, combo, fundador, enums):
  hoy da **0 diferencias** (snapshot `tests/fixtures/backend-catalog.v1.json`, versión `v1-c37904…`); si algún día
  difiere, el formulario avisa que vale la estimación del equipo y la confirmación muestra el total del servidor.
  Si cambian precios en `/content`, hay que actualizar el snapshot desde el backend (el test falla a propósito).
- Historial (`solicitudes/`): estado, estimación guardada por el servidor, respuesta pública (texto plano, escapado) y
  cancelación de solicitudes abiertas (`POST …/cancel` con `version`; 409 = el equipo la cambió). Notas internas: el API
  no las devuelve.

## Proyectos (live)

`GET /client/projects` y `/client/projects/:id` se adaptan a las vistas existentes (clases `pt-*`, `PortalTabs`,
`PhaseGlyph`): etapa (`preparation|build|eclipse_review|client_review|delivery|support` + estado `paused|closed`),
próximo hito, **tu acción** = actualizaciones publicadas `action_required` abiertas (fecha límite / resuelto),
cronograma de 5 pasos, actualizaciones, hitos, alcance (versión vigente + historial) y cambios, documentos y guía de
etapas. Documentos: `GET /client/projects/:id/documents` y descarga con `fetch` + credenciales → Blob → guardar (la URL
del API nunca es un `<a href>`).

El DTO del cliente **no trae dinero, notas, bloqueos ni personas de Eclipse**, y la web no inventa nada: no hay código
de proyecto, empresa, responsable de Eclipse, plan de mantenimiento ni fechas por etapa; las acciones del cliente
(aprobar, subir archivos, decidir cambios) no existen en el API, así que se responde por WhatsApp y el equipo marca
el pedido como resuelto. La lista no muestra «requiere tu acción» por proyecto (no viene en el DTO de lista; evitar
N+1). Sin guías de primera visita en live.

## Dominio y despliegue

Las cookies del API son `SameSite=Lax` y host-only (`__Host-` en producción). Funcionan solo **mismo sitio**:

- Producción prevista: `eclipse-business.com` + `www`/`interno`/`api` comparten el dominio registrable → el modo
  `live` funciona.
- Desarrollo: web en `http://localhost:3001` + API en `http://localhost:3000` (mismo sitio; **no** usar `127.0.0.1` para
  el API: es otro host y el navegador no enviaría las cookies).
- **GitHub Pages (`*.github.io`) ↔ Render (`*.onrender.com`) es cross-site y NO está soportado en modo live.** Ese
  despliegue debe seguir en `demo` (sin `NEXT_PUBLIC_API_BASE_URL`).

El backend debe tener el origen de la web en `ALLOWED_ORIGINS`, `AUTH_ENABLED=true`, y para verificación/recuperación
SMTP + `CLIENT_VERIFY_EMAIL_URL` / `CLIENT_PASSWORD_RESET_URL` (ver `Eclipse-be/docs/email.md`).

```sh
# build live local (sin basePath) y servirlo en el origen que el backend permite
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 NEXT_PUBLIC_PORTAL_MODE=live NEXT_PUBLIC_SITE_URL=http://localhost:3001 npm run build
npx serve@14 out -l 3001
```

El HTML exportado no contiene datos privados: todas las pantallas privadas se renderizan en el cliente después de
consultar el API (`useSearchParams` bajo `Suspense`), y `out/` no tiene contraseñas, tokens ni secretos.

## Pruebas

- `npm test`: cliente del API (CSRF, refresh single-flight, reintento, idempotencia, timeouts, sin storage), mapeo del plan
  y del proyecto, validación de UUID/`next`/teléfono/contraseña, token en fragmento, config del modo, paridad i18n.
- `E2E_API=http://127.0.0.1:3000 BASE_URL=http://localhost:3001 npm run test:e2e:live` — corre en Chromium contra el
  servidor de pruebas del backend (`tests/e2e/server.ts`, ver su `docs/e2e.md`) y el export live servido en `:3001`:
  registro → mail → verificación → login → solicitud → historial → respuesta del equipo → proyecto/actualización/documento
  (creados con un script admin: `tests/e2e/lib/backend.mjs`) → descarga → segundo cliente sin acceso → refresh con el
  access token borrado → logout, con capturas a 360 y 1440 px y chequeo de overflow. Sin `E2E_API` se saltea.
  El limitador de credenciales del servidor de pruebas es chico (50 intentos por ventana): no repetir la corrida varias
  veces seguidas.

## Compatibilidad con el contrato

| Endpoint (`/api/v1`) | Uso en la web |
|---|---|
| `GET /auth/csrf`, `POST /auth/client/{register,login}`, `email-verification/{request,confirm}`, `password-reset/{request,confirm}` | auth anónima |
| `GET /auth/client/{me,csrf}`, `POST /auth/client/{refresh,logout}` | sesión |
| `GET /catalog/plans` | `catalogVersion` + detección de deriva |
| `GET/POST /client/plan-requests`, `GET /client/plan-requests/:id`, `POST …/:id/cancel` | solicitudes |
| `GET /client/projects`, `GET /client/projects/:id` | proyectos |
| `GET /client/projects/:id/documents`, `GET /client/documents/:id/content` | documentos |

OpenAPI **0.7.0**. Backend: `Eclipse-be` `main` en `a43d354` (merge de la fase 7) más el servidor de pruebas
`7047567` (rama `feat/phase-8-integration-support`). Campos tolerados cuando el API los devuelve `null` aunque el
esquema diga `string` (`milestones[].description`, `changeRequests[].description`).

## Límites conocidos

- No hay polling: se vuelve a pedir al enfocar la pestaña (si pasaron >30 s), con «Actualizar» y después de cada acción.
- No hay guías de primera visita ni «Más información» propios del modo live más allá de las tarjetas reutilizadas.
- Paginación: se muestra la primera página (50 solicitudes, la página por defecto de proyectos); `nextCursor` no se sigue.
- El estado «en pausa» no trae motivo en el DTO del cliente: la web lo dice y deriva a WhatsApp.
- La sesión no se sincroniza entre pestañas (cada una la revalida al volver a enfocarse).
- Cambio de contraseña con sesión iniciada, alta de colaboradores y respuesta a pedidos del equipo: no existen en el API.
