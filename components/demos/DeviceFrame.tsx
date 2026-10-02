import type { ReactNode } from 'react';

/**
 * Device mockup. The screen is a CSS container (`container-type: size`, name
 * `screen`), so demos size everything in cqw/cqh and look identical at any scale.
 * - phone: 9 / 19.5 screen
 * - laptop: 16 / 10 screen + base
 */
export function DeviceFrame({
  kind,
  label,
  children,
  className = '',
}: {
  kind: 'phone' | 'laptop';
  /** Accessible name for the device region (e.g. "Demo navegable de Clínica Aurora"). */
  label: string;
  children: ReactNode;
  className?: string;
}) {
  if (kind === 'phone') {
    return (
      <div role="region" aria-label={label} className={`device-phone relative ${className}`}>
        <div className="relative aspect-[9/19.5] w-full rounded-[13%/6%] bg-[#0b0b10] p-[3.2%] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8),0_0_0_1px_rgb(255_255_255/0.08),inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <div className="device-screen relative h-full w-full overflow-hidden rounded-[10.5%/4.9%] bg-dawn text-ink [container-name:screen] [container-type:size]">
            {children}
          </div>
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[2.2%] h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-[#0b0b10]" />
        </div>
      </div>
    );
  }
  return (
    <div role="region" aria-label={label} className={`device-laptop relative ${className}`}>
      <div className="relative rounded-[2.2%/3.4%] bg-[#0b0b10] p-[1.6%] pb-[2.4%] shadow-[0_50px_100px_-40px_rgb(0_0_0/0.85),0_0_0_1px_rgb(255_255_255/0.08)]">
        <div className="device-screen relative aspect-[16/10] w-full overflow-hidden rounded-[0.6%] bg-dawn text-ink [container-name:screen] [container-type:size]">
          {children}
        </div>
      </div>
      <div aria-hidden className="relative left-1/2 aspect-[100/2.4] w-[112%] -translate-x-1/2 rounded-b-[50%_100%] bg-gradient-to-b from-[#2a2a33] to-[#121218] shadow-[0_20px_40px_-20px_rgb(0_0_0/0.9)]" />
    </div>
  );
}
