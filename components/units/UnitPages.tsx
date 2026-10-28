import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SkyTransition } from '@/components/sections/SkyTransition';
import { MEDIA_FRAMES, MediaFrame } from '@/components/sections/media/MediaFrames';
import { UnitHero, UnitLedger, UnitNote, UnitOthers, UnitPhases } from './UnitBlocks';
import { UnitAsk } from './UnitAsk';
import { UnitPlansText } from './UnitPlansText';

const em = (chunks: ReactNode) => <em>{chunks}</em>;

const MEDIA_METHOD = ['brief', 'script', 'make', 'review', 'delivery'] as const;
const ACADEMY_OFFER = ['guides', 'marketing', 'routes', 'practice', 'physical', 'progress'] as const;
const INTELLIGENCE_OFFER = ['sales', 'leads', 'ops', 'loyalty', 'branches'] as const;

/**
 * /media/ — Eclipse Media (night): what it makes (each piece with its frame of the contact sheet),
 * how a piece is made (five phases), how our own trailers are made, the conditions and the rest
 * of Eclipse. Copy: `media.page` (the home's section shares `media.frames` and `media.note`).
 */
export function MediaUnitPage() {
  const t = useTranslations('media');
  const tn = useTranslations('nav');
  return (
    <main id="main" className="bg-night">
      <UnitHero
        id="media"
        name={tn('media')}
        statement={t.rich('page.title', { em })}
        lead={t('page.lead')}
        cta={
          <UnitAsk unit="media" origin="media" message={t('page.ask')}>
            {t('page.cta')}
          </UnitAsk>
        }
      />
      <UnitLedger
        id="offer"
        title={t('page.offerTitle')}
        rows={MEDIA_FRAMES.map((id) => ({ key: id, name: t(`page.offer.${id}.name`), text: t(`page.offer.${id}.text`), art: <MediaFrame id={id} /> }))}
      />
      <UnitPhases title={t('page.methodTitle')} steps={MEDIA_METHOD.map((id) => ({ key: id, name: t(`page.method.${id}.name`), text: t(`page.method.${id}.text`) }))} />
      <UnitNote title={t('page.craftTitle')}>
        <p>{t('page.craft')}</p>
        <p className="u-muted">{t('note')}</p>
        <p className="u-muted">{t('page.aiNote')}</p>
      </UnitNote>
      <UnitOthers current="media" />
      <SkyTransition from="night" to="dawn" />
    </main>
  );
}

/**
 * /academy/ — Eclipse Academy (dawn, a notebook's light): what you'll find (six kinds of
 * content), where it comes in the plans (the level from content/levels.json) and its honest
 * status (the library is being produced; the how-to guides come first).
 */
export function AcademyUnitPage() {
  const t = useTranslations('units');
  const tn = useTranslations('nav');
  return (
    <main id="main" className="bg-dawn">
      <UnitHero
        light
        id="academy"
        name={tn('academy')}
        statement={t.rich('academy.title', { em })}
        lead={t('academy.lead')}
        cta={
          <UnitAsk unit="academy" message={t('academy.ask')}>
            {t('ask')}
          </UnitAsk>
        }
      />
      <UnitLedger
        light
        id="offer"
        title={t('academy.offerTitle')}
        rows={ACADEMY_OFFER.map((id) => ({ key: id, name: t(`academy.offer.${id}.name`), text: t(`academy.offer.${id}.text`) }))}
      />
      <UnitNote light title={t('plansTitle')}>
        <UnitPlansText unit="academy" level="growth" />
        <p className="u-muted">{t('academy.status')}</p>
      </UnitNote>
      <UnitOthers light current="academy" />
    </main>
  );
}

/**
 * /intelligence/ — Eclipse Intelligence (night, the instrument): what it measures, its one
 * principle (every number with its source), where it comes in the plans and its status.
 */
export function IntelligenceUnitPage() {
  const t = useTranslations('units');
  const tn = useTranslations('nav');
  return (
    <main id="main" className="bg-night">
      <UnitHero
        id="intelligence"
        name={tn('intelligence')}
        statement={t.rich('intelligence.title', { em })}
        lead={t('intelligence.lead')}
        cta={
          <UnitAsk unit="intelligence" message={t('intelligence.ask')}>
            {t('ask')}
          </UnitAsk>
        }
      />
      <UnitLedger
        id="offer"
        title={t('intelligence.offerTitle')}
        rows={INTELLIGENCE_OFFER.map((id) => ({ key: id, name: t(`intelligence.offer.${id}.name`), text: t(`intelligence.offer.${id}.text`) }))}
      />
      <UnitNote title={t('intelligence.principleTitle')}>
        <p>{t('intelligence.principle')}</p>
      </UnitNote>
      <UnitNote title={t('plansTitle')}>
        <UnitPlansText unit="intelligence" level="hipergrowth" />
        <p className="u-muted">{t('intelligence.status')}</p>
      </UnitNote>
      <UnitOthers current="intelligence" />
      <SkyTransition from="night" to="dawn" />
    </main>
  );
}
