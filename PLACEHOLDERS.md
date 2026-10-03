# Placeholders — lo que hay que reemplazar por datos reales

Este mockup v1 está completo y funcionando, pero algunos datos son provisorios. Todo lo de esta lista se cambia
sin tocar componentes (env, `/content`, `/messages` o `/public`), salvo donde se indique.

## Contacto y dominio

| Qué | Dónde | Valor actual |
|---|---|---|
| **WhatsApp** | `NEXT_PUBLIC_WHATSAPP` (variable de repo en GitHub → Actions → Variables, o `.env.local`) | `5492230000000` (ficticio) |
| **Email** | `NEXT_PUBLIC_EMAIL` | `hola@eclipse.example` (ficticio) |
| **Dominio** | `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_BASE_PATH` vacío al migrar (ver README) | `https://toti-gauna.github.io/Eclipse-Web` |

## Imágenes y marca

| Qué | Dónde | Estado |
|---|---|---|
| **OG image definitiva** | `public/og-es.jpg`, `og-en.jpg`, `og-pt.jpg` (1200×630). Se regeneran con `node scripts/generate-og.mjs` | Provisoria: eclipse + "ECLIPSE" + titular, generada por código |
| **Logo / wordmark** | Texto "ECLIPSE" en Geist + eclipse en CSS/SVG (`app/icon.svg` es el favicon) | Provisorio hasta tener el logo final |
| **Logos de fundadores** | `public/founders/` + `logo` en `content/founders.json` | Sin fundadores todavía (5 slots vacíos) |

## Trailers

| Qué | Dónde | Estado |
|---|---|---|
| **Trailers en video reales** (uno por rubro) | Subir `.mp4` / `.webm` + poster a `public/trailers/` y pasar `src` al `TrailerPlayer` (acepta video o timeline GSAP) | v1: 3 mini-trailers de 15 s animados en GSAP |

## Contenido comercial a validar

| Qué | Dónde | Nota |
|---|---|---|
| Cotizaciones de respaldo | `content/rates.fallback.json` | ARS 1.450 / BRL 5,40 por USD (estimadas: desde el entorno de build no se pudo consultar las APIs). Actualizar periódicamente. |
| Números clave de los rubros | `content/verticals.json` (`keyNumber`) | "Recupera 12 turnos por semana", "100% de consultas en < 1 min", "−25% de bajas", "Recupera 1 de cada 5 carritos abandonados", "Atiende 3 llamadas a la vez en hora pico", "Asigna un técnico en menos de 15 minutos": son escenarios de las demos, rotulados "Demo". Reemplazar por resultados reales cuando haya casos. |
| Valores por defecto de la calculadora | `content/verticals.json` (`calculator`) | Estimaciones razonables por rubro; ajustarlas con datos reales. |
| Agente de voz en Plataforma | `content/plans.json` (`plataforma.items` incluye `voz`) | La regla de add-ons dice que Sistema y Plataforma ya lo incluyen; se agregó a los incluidos de Plataforma para que sea coherente. Confirmar. |
| Base del "ahorrás ≈ Y%" | `lib/pricing.ts` (`planSavings`) | Compara la suma de ítems contra el precio "desde" del plan. |
| Detalle de mantenimiento | `content/maintenance.json` | Copiado del brief (Cloudflare Pro, horas de cambios, etc.). Confirmar alcance real. |
| Unidades futuras | `content/units.json` | Media y Market sin descripción (solo nombre + "Próximamente"). |
| Badge del plan destacado | `messages/*.json` → `pricing.featured` | El brief pide "Más elegido", pero sin clientes todavía es una afirmación que no podemos respaldar (reglas de honestidad). Hoy dice **"Recomendado"**; cambiarlo a "Más elegido" cuando sea cierto. |

## Negocios de las demos (ficticios)

"Clínica Aurora", "Lumen Propiedades", "Órbita Fitness", "Bruma Tostadores", "Bodegón Lucero" y "Tuerca Hogar", y todas
las personas, propiedades, productos, precios y métricas que aparecen dentro de las demos y trailers, son ficticios y están
rotulados "Demo". Antes de una campaña grande conviene
verificar que ningún nombre coincida con una marca registrada en AR/BR.

## Pendiente fuera del alcance del mockup

- Política de privacidad y términos (no hay formularios: todo termina en WhatsApp, pero el chat de vista previa pide nombre).
- Proveedor de analítica (`lib/analytics.ts` ya reenvía a Plausible o GA4 si se carga su script).
- Revisión final del copy por hablantes nativos de pt-BR y en (ya pasó una revisión de tono y consistencia).
