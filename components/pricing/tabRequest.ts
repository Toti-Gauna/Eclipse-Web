/**
 * "Ver precios de …" in 03 · Soluciones asks 04 · Precios to show tab B (Pieza por pieza).
 * Precios may still be dormant (LazyHydrate) when the link is clicked, so the request is kept
 * here until BuyTabs mounts and takes it; once mounted it also hears new requests.
 */
let pending = false;
const listeners = new Set<() => void>();

export function requestPiecesTab() {
  pending = true;
  listeners.forEach((l) => l());
}

/** True once per request. */
export function takePiecesRequest(): boolean {
  const was = pending;
  pending = false;
  return was;
}

export function onPiecesRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
