'use client';

import { Suspense, useCallback, useId, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Compass, Hand, Monitor, Smartphone } from 'lucide-react';
import { DemoShowcase } from '@/components/demos/DemoShowcase';
import { ShowcasePoster } from '@/components/demos/DeviceFrame';
import type { DemoScreen } from '@/components/demos/types';
import { Tour } from '@/components/ui/tour/Tour';
import { useTourCopy } from '@/components/ui/tour/useTourCopy';
import type { TourCloseReason, TourStep } from '@/components/ui/tour/types';
import type { DemoId, Vertical } from '@/lib/content';
import type { ViewTag } from './guide';
import type { DemoOrigin } from './store';
import { ProjectBlock } from './ProjectBlock';

export interface DemoLayerBodyProps {
  demo: DemoId;
  vertical: Vertical;
  origin: DemoOrigin;
  /** The demo runs (false while the layer closes). */
  active: boolean;
  choice: 'pending' | 'done';
  hasGuide: boolean;
  guideOpen: boolean;
  /** Changes every time the guide (re)starts. */
  guideRun: number;
  steps: (TourStep & { view: ViewTag })[];
  onGuide: () => void;
  onExplore: () => void;
  onGuideClose: (reason: TourCloseReason) => void;
  dialog: () => HTMLElement | null;
  scroller: () => HTMLElement | null;
  wantThis: (className: string, extra?: Record<string, string>) => ReactNode;
  blockCtaInView: boolean;
  onBlockCta: (inView: boolean) => void;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Inside the layer's scroll: the two views (desktop left / mobile right when the showcase is
 * ≥ 880 px wide, tabs below — DemoShowcase), the "¿Cómo querés verla?" choice over both views
 * on first visit, the guide (<Tour> rendered inside the dialog) and the complete project.
 * A separate chunk: loaded on intent (hover / focus / touch of an opener) or on open.
 */
export function DemoLayerBody(props: DemoLayerBodyProps) {
  const { demo, vertical, active, choice, hasGuide, guideOpen, guideRun, steps } = props;
  const t = useTranslations('demoExperience');
  const tt = useTranslations('tour');
  const ts = useTranslations('demoShowcase');
  const business = vertical.business ?? '';
  const uid = useId();
  const views = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<DemoScreen>('phone');
  const copy = useTourCopy(tt('labelFor', { name: business }));
  const pending = choice === 'pending';

  // Tabs layout (narrow): the guide shows the view each step talks about.
  const onStep = useCallback(
    async (step: TourStep) => {
      const want = (step as TourStep & { view?: ViewTag }).view;
      const layout = views.current?.querySelector('.sc')?.getAttribute('data-layout');
      if (layout !== 'tabs' || !want || want === 'both') return;
      setView(want);
      // Wait (≤ 1.5 s) for the step's target to mount in the newly shown view.
      for (let i = 0; i < 90; i++) {
        await nextFrame();
        if (step.targets.some((sel) => views.current?.querySelector(sel))) break;
      }
    },
    [],
  );

  const captions = {
    laptop: (
      <>
        <Monitor aria-hidden strokeWidth={1.5} />
        {ts('desktop')}
      </>
    ),
    phone: (
      <>
        <Smartphone aria-hidden strokeWidth={1.5} />
        {ts('mobile')}
      </>
    ),
  };

  return (
    <>
      <section className="dx-stage" aria-label={ts('viewsLabel', { business })}>
        <div ref={views} className="dx-views" data-choice={pending ? 'pending' : undefined}>
          <div className="dx-showcase" inert={pending || undefined}>
            <Suspense fallback={<ShowcasePoster demo={demo} captions={captions} />}>
              <DemoShowcase
                demo={demo}
                business={business}
                active={active && !pending}
                fit
                view={view}
                onViewChange={setView}
              />
            </Suspense>
          </div>
          {pending ? (
            <div className="dx-choice" role="group" aria-labelledby={`${uid}-choice`}>
              <div className="dx-choice-card">
                <p id={`${uid}-choice`} className="dx-choice-title display">
                  {t('choice.title')}
                </p>
                <div className="dx-choice-options">
                  <button
                    type="button"
                    onClick={props.onGuide}
                    disabled={!hasGuide}
                    aria-describedby={hasGuide ? undefined : `${uid}-soon`}
                    className="dx-choice-option"
                    data-dx-choice="guide"
                  >
                    <Compass aria-hidden strokeWidth={1.5} className="dx-choice-icon" />
                    <span className="dx-choice-name">{tt('withGuide')}</span>
                    <span className="dx-choice-text">{t('choice.guideText')}</span>
                  </button>
                  <button type="button" onClick={props.onExplore} className="dx-choice-option" data-dx-choice="explore">
                    <Hand aria-hidden strokeWidth={1.5} className="dx-choice-icon" />
                    <span className="dx-choice-name">{tt('onMyOwn')}</span>
                    <span className="dx-choice-text">{t('choice.exploreText')}</span>
                  </button>
                </div>
                {hasGuide ? null : (
                  <p id={`${uid}-soon`} className="dx-choice-soon">
                    {t('guideSoon')}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="dx-after">{props.wantThis(`btn w-full ${props.blockCtaInView ? 'btn-ghost' : 'btn-primary'}`)}</div>
      </section>

      <ProjectBlock vertical={vertical} wantThis={props.wantThis} onBlockCta={props.onBlockCta} scroller={props.scroller} />

      {hasGuide ? (
        <Tour
          key={guideRun}
          open={guideOpen}
          steps={steps}
          copy={copy}
          root={() => views.current}
          host={props.dialog}
          scroller={props.scroller}
          onStep={onStep}
          onClose={(reason) => props.onGuideClose(reason)}
        />
      ) : null}
    </>
  );
}

