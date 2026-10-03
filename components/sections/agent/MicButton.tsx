'use client';

import { useEffect, useId, useState } from 'react';
import { Mic } from 'lucide-react';

/** 'hold' = shown by hover/focus (stays while hovered or focused), 'tap' = shown by a tap (hides by itself). */
type TipState = false | 'hold' | 'tap';

/**
 * Decorative voice button of the agent preview. It only shows its tooltip
 * ("Agente de voz — disponible en tu demo") on hover, focus or tap; Esc hides it.
 * The tooltip is hoverable and always referenced by aria-describedby.
 */
export function MicButton({ label, tip }: { label: string; tip: string }) {
  const tipId = `${useId()}-tip`;
  const [open, setOpen] = useState<TipState>(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const timer = open === 'tap' ? window.setTimeout(() => setOpen(false), 2800) : undefined;
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [open]);

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen('hold')}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={tipId}
        onFocus={() => setOpen('hold')}
        onBlur={() => setOpen(false)}
        // A tap shows the tooltip for a moment. The button does nothing else: it's a preview.
        onClick={() => setOpen((o) => (o === 'hold' ? o : 'tap'))}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong text-fg-muted transition-colors hover:border-[color:var(--accent)] hover:text-accent"
      >
        <Mic aria-hidden className="size-[1.1rem]" strokeWidth={1.5} />
      </button>
      <span role="tooltip" id={tipId} data-open={open ? '' : undefined} className="agent-tip">
        {tip}
      </span>
    </span>
  );
}
