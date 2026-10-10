/**
 * The portal's message namespaces. Portal pages translate on the server and pass plain
 * strings to their few client components, so these namespaces never need to be in the
 * client messages: the root layout can leave them out of the landing payload (~18 KB raw,
 * ~6 KB gzip per locale for `portal`), the same way it leaves out DEMO_NAMESPACES.
 *
 * `portalLive` is the live portal's copy (auth screens, projects, requests). Its client
 * components read it through the portal layout's own provider (live mode only).
 */
export const PORTAL_NAMESPACES = ['portal', 'portalLive'] as const;
