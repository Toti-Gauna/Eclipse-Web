'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { localeTags, type Locale } from '@/i18n/routing';
import { l, type DemoId, type Vertical } from '@/lib/content';
import { TrailerPlayer, type TrailerTrigger } from './TrailerPlayer';
import { buildVerticalTimeline, TRAILER_DURATION, TRAILER_POSTER_AT, type MockAnimator, type TrailerNumber } from './timeline';
import { formatTrailerNumber, SceneDemo, SceneFigure, SceneLogo, SceneProblem, TrailerHudContent } from './scenes';

/** Props every `<Vertical>Trailer` accepts. */
export interface TrailerComponentProps {
  className?: string;
  trigger?: TrailerTrigger;
  /** Force-pause (e.g. while a modal covers the trailer). */
  paused?: boolean;
}

/**
 * The 5-scene trailer of a rubro (problem → pain number → demo screen → result
 * → Eclipse). The vertical files only provide the pain number, the mock screen
 * and its animation; copy lives in `trailers.<demoId>` and `/content`.
 */
export function VerticalTrailer({
  vertical,
  copyKey,
  pain,
  screen,
  callout,
  mock,
  className = '',
  trigger = 'auto',
  paused = false,
}: {
  vertical: Vertical;
  copyKey: DemoId;
  /** The pain number of the demo scenario (from /content). */
  pain: TrailerNumber;
  screen: ReactNode;
  callout?: ReactNode;
  mock?: MockAnimator;
} & TrailerComponentProps) {
  const t = useTranslations('trailers');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const localeTag = localeTags[locale];

  const business = vertical.business ?? '';
  const key = vertical.keyNumber;
  const result = useMemo<TrailerNumber>(
    () => ({ value: key?.value ?? 0, prefix: key?.prefix ?? '', suffix: key?.suffix ?? '' }),
    [key],
  );

  const timeline = useCallback(
    (root: HTMLElement) => buildVerticalTimeline(root, { localeTag, pain, result, mock }),
    [localeTag, pain, result, mock],
  );

  const line1 = t(`${copyKey}.problem1`);
  const line2 = t(`${copyKey}.problem2`);
  const painValue = formatTrailerNumber(pain, localeTag);
  const painLabel = t(`${copyKey}.pain`);
  const feature = t(`${copyKey}.feature`);
  const demoLabel = tc('demo');

  return (
    <TrailerPlayer
      id={vertical.id}
      title={t('title', { business })}
      timeline={timeline}
      durationS={TRAILER_DURATION}
      posterAt={TRAILER_POSTER_AT}
      trigger={trigger}
      paused={paused}
      trackProps={{ vertical: vertical.id }}
      description={t('summary', {
        problem: `${line1} ${line2}`,
        pain: `${painValue} ${painLabel}`,
        feature,
        result: key ? l(key.headline, locale) : '',
      })}
      hud={<TrailerHudContent demoLabel={demoLabel} business={business} />}
      className={className}
    >
      <SceneProblem kicker={l(vertical.name, locale)} line1={line1} line2={line2} />
      <SceneFigure name="pain" tag={t('scenario')} demoLabel={demoLabel} value={painValue} label={painLabel} />
      <SceneDemo eyebrow={t('solution')} title={feature} screen={screen} callout={callout} />
      <SceneFigure
        name="result"
        poster
        tag={t('withEclipse')}
        demoLabel={demoLabel}
        value={formatTrailerNumber(result, localeTag)}
        label={key ? l(key.label, locale) : ''}
      />
      <SceneLogo brand={t('brand')} endLine={t('endLine')} />
    </TrailerPlayer>
  );
}
