import type { ReactNode } from 'react';

/**
 * The page's last phase: the eclipse is over and the sun stands risen behind the
 * giant title, cut by a ruled horizon. v3: static — no scroll scrub, no turning
 * rays (the page keeps its big motion for the hero and the sunrise transition).
 */
export function Dawn({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`agent-dawn ${className}`}>
      <div aria-hidden className="agent-dawn-sky">
        <div className="agent-dawn-sun">
          <div className="agent-sun-halo" />
          <div className="agent-sun-rays" />
          <div className="agent-sun-disc" />
        </div>
      </div>
      <div className="agent-dawn-type">{children}</div>
      <span aria-hidden className="agent-horizon" />
    </div>
  );
}
