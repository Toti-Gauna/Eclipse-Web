'use client';

import type { CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Zap } from 'lucide-react';
import { localeTags, type Locale } from '@/i18n/routing';
import { verticalById, type Vertical } from '@/lib/content';
import { pop, type MockAnimator, type TrailerNumber } from './timeline';
import { VerticalTrailer, type TrailerComponentProps } from './VerticalTrailer';

const VERTICAL = verticalById('inmobiliarias') as Vertical;

/** Demo scenario: unanswered inquiries per week (the rubro's default in /content). */
const PAIN: TrailerNumber = { value: VERTICAL.calculator.lostPerWeek, prefix: '', suffix: '' };

/** Chat at 23:41: the question lands, the agent types and answers with the listing. */
const animateMock: MockAnimator = (tl, q, at) => {
  const [sep] = q('[data-trl="sep"]');
  const [question] = q('[data-trl="q"]');
  const [typing] = q('[data-trl="typing"]');
  const [answer] = q('[data-trl="a"]');
  const [listing] = q('[data-trl="listing"]');
  const [callout] = q('[data-trl="callout"]');
  pop(tl, sep, at - 0.7);
  pop(tl, question, at - 0.5, { x: -10, y: 6 });
  if (typing) {
    tl.fromTo(typing, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, at + 0.05);
    tl.fromTo(
      typing.children,
      { yPercent: 0 },
      { yPercent: -55, duration: 0.18, stagger: 0.09, repeat: 3, yoyo: true, ease: 'sine.inOut', immediateRender: false },
      at + 0.15,
    );
    tl.fromTo(typing, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15, ease: 'none', immediateRender: false }, at + 0.9);
  }
  pop(tl, answer, at + 0.95, { x: 10, y: 6 });
  pop(tl, listing, at + 1.35, { y: 14 });
  pop(tl, callout, at + 1.2, { scale: 0.7, y: 16 });
};

function RealEstateScreen({ business }: { business: string }) {
  const t = useTranslations('trailers.realEstate.screen');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const time = new Intl.DateTimeFormat(localeTags[locale], { hour: 'numeric', minute: '2-digit', hour12: locale === 'en' }).format(new Date(2026, 0, 5, 23, 41));

  return (
    <div className="mk" style={{ '--mk-accent': '#3552c4' } as CSSProperties}>
      <div className="mk-bar">
        <span className="mk-logo" />
        <span>{business}</span>
        <span className="mk-demo">{tc('demo')}</span>
        <span className="mk-online">{t('online')}</span>
      </div>
      <div className="mk-chat">
        <span className="mk-sep" data-trl="sep">
          {time}
        </span>
        <p className="mk-bubble mk-bubble--in" data-trl="q">
          {t('question')}
        </p>
        <div className="mk-reply">
          <span className="mk-typing" data-trl="typing">
            <span />
            <span />
            <span />
          </span>
          <p className="mk-bubble mk-bubble--out" data-trl="a">
            {t('answer')}
          </p>
          <div className="mk-listing mk-card" data-trl="listing">
            <span className="mk-photo" />
            <div>
              <b>{t('listing')}</b>
              <small>{t('listingMeta')}</small>
              <span className="mk-cta">{t('cta')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepliedCallout() {
  const t = useTranslations('trailers.realEstate.screen');
  return (
    <p className="trl-callout" data-trl="callout">
      <Zap aria-hidden strokeWidth={1.8} />
      {t('replied')}
    </p>
  );
}

/** "Lumen Propiedades — Demo": a late-night inquiry answered in seconds. */
export function RealEstateTrailer(props: TrailerComponentProps) {
  return (
    <VerticalTrailer
      vertical={VERTICAL}
      copyKey="realEstate"
      pain={PAIN}
      screen={<RealEstateScreen business={VERTICAL.business ?? ''} />}
      callout={<RepliedCallout />}
      mock={animateMock}
      {...props}
    />
  );
}

export default RealEstateTrailer;
