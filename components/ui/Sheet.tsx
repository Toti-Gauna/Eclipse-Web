'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export type SheetVariant = 'drawer' | 'fullscreen' | 'center';

/**
 * Accessible modal built on the native <dialog> (focus containment, Esc, inert
 * background, top layer). Variants:
 * - drawer: full-screen bottom sheet on mobile, right-side drawer from md up
 * - fullscreen: covers the viewport (demo modal)
 * - center: centered card
 * Page scroll is locked while open (see `html:has(dialog[open])` in globals.css).
 */
export function Sheet({
  open,
  onClose,
  variant = 'drawer',
  labelledBy,
  label,
  children,
  className = '',
  panelClassName = '',
}: {
  open: boolean;
  onClose: () => void;
  variant?: SheetVariant;
  labelledBy?: string;
  label?: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<'open' | 'closed'>('closed');
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      const raf = requestAnimationFrame(() => setState('open'));
      return () => cancelAnimationFrame(raf);
    }
    if (!dialog.open) return;
    setState('closed');
    const timer = window.setTimeout(() => dialog.close(), 380);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      data-state={state}
      data-variant={variant}
      className={`sheet ${className}`}
      onClick={(e) => {
        // Click on the backdrop (the dialog box itself, outside the panel).
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div className={`sheet-panel ${panelClassName}`}>{children}</div>
    </dialog>
  );
}
