'use client';

import './sheet.css';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { lockScroll } from '@/lib/scroll-lock';

export type SheetVariant = 'drawer' | 'fullscreen' | 'center';

/**
 * Accessible modal built on the native <dialog> (focus containment, Esc, inert
 * background, top layer). Variants:
 * - drawer: always a right-side drawer — it slides in from the right and back out at every
 *   width; on phones it leaves a sliver of the page on the left (sheet.css). `surface`
 *   tunes its backdrop for a light or dark panel (the panel's own theme is the caller's). up
 * - fullscreen: covers the viewport (demo modal)
 * - center: centered card
 * Page scroll is locked while open (lib/scroll-lock.ts).
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
  surface,
}: {
  open: boolean;
  onClose: () => void;
  variant?: SheetVariant;
  labelledBy?: string;
  label?: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  /** Drawer only: the panel's surface, so the backdrop dims to match ('light' | 'dark'). */
  surface?: 'light' | 'dark';
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

  useEffect(() => (open ? lockScroll() : undefined), [open]);

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
      data-surface={surface}
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
