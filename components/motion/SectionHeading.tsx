import type { ReactNode } from 'react';
import { LightSweep } from './LightSweep';

/**
 * Display heading (serif, italic amber keyword via <em>) with the light sweep.
 * Pass the already-translated rich text as children:
 *   <SectionHeading id="pricing-title" eyebrow={t('eyebrow')}>{t.rich('title', { em })}</SectionHeading>
 */
export function SectionHeading({
  id,
  eyebrow,
  children,
  sub,
  align = 'left',
  as: Tag = 'h2',
  className = '',
}: {
  id?: string;
  eyebrow?: ReactNode;
  children: ReactNode;
  sub?: ReactNode;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const center = align === 'center';
  return (
    <header className={`${center ? 'mx-auto text-center' : ''} max-w-3xl ${className}`}>
      {eyebrow ? (
        <p data-reveal className="eyebrow mb-4">
          {eyebrow}
        </p>
      ) : null}
      <Tag id={id} data-reveal className="display text-[2.6rem] sm:text-5xl md:text-6xl lg:text-[4.25rem]">
        <LightSweep>{children}</LightSweep>
      </Tag>
      {sub ? (
        <p data-reveal className={`mt-5 text-base text-fg-muted sm:text-lg ${center ? 'mx-auto' : ''} max-w-2xl`}>
          {sub}
        </p>
      ) : null}
    </header>
  );
}
