/**
 * The portal's message namespace. Portal pages translate on the server and pass plain
 * strings to their few client components, so this namespace never needs to be in the
 * client messages: the root layout can leave it out of the landing payload (~18 KB raw,
 * ~6 KB gzip per locale), the same way it leaves out DEMO_NAMESPACES.
 */
export const PORTAL_NAMESPACES = ['portal'] as const;
