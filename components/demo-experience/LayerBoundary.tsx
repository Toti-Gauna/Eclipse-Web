'use client';

import { Component, type ReactNode } from 'react';

/**
 * Catches a failed chunk (or a render error) of the demo layer's body. The layer's own bar —
 * «Volver», the guide and WhatsApp — sits outside it, so the visitor can always retry or leave
 * and the page never stays locked behind a dead dialog.
 */
export class LayerBoundary extends Component<{ children: ReactNode; fallback: (retry: () => void) => ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  retry = () => this.setState({ failed: false });

  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children;
  }
}
