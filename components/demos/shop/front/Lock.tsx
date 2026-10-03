'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, LayoutDashboard, Store } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { ChatWidget, PushBanner, upperFirst, type ChatRun } from '../../kit';
import { COUPON } from '../data';
import { act, clockAt } from '../story';
import { useShop } from '../context';
import { BrumaMark, useShopText } from '../ui';
import { useFront } from './context';

function PanelButton({ className = '' }: { className?: string }) {
  const f = useFront();
  const t = useTranslations('demoShop.front');
  if (!f.onPanel) return null;
  return (
    <button type="button" className={`sf-panelbtn ${className}`} onClick={f.onPanel}>
      <LayoutDashboard aria-hidden strokeWidth={1.8} />
      {t('panel')}
    </button>
  );
}

/**
 * Inés put the phone away: the lock screen. Half an hour later (the clock jumps) the
 * recovery message lands as a notification — or nothing does, if the automation is off.
 */
export function LockScreen() {
  const f = useFront();
  const t = useTranslations('demoShop.front.lock');
  const { view, store, business, active } = useShop();
  const { fmt, person, items } = useShopText();
  const { play } = useSound();
  const ines = view.ines;
  const pushOn = !!ines.sent && ines.pushAt !== null && view.t >= ines.pushAt;
  const jumping = ines.jumpAt !== null && view.t >= ines.jumpAt && view.t < ines.jumpAt + 2200;
  const off = ines.sent === false;
  const time = fmt.time(view.clock);
  const date = upperFirst(fmt.date(new Date(Date.UTC(2026, 9, 6)), { weekday: 'long', day: 'numeric', month: 'long' }));
  return (
    <div className="sf-lock" data-off={off ? '' : undefined}>
      <span className="sf-lock-wall" aria-hidden>
        <BrumaMark />
      </span>
      <div className="sf-lock-top">
        <PanelButton />
      </div>
      <p className="sf-lock-date">{date}</p>
      <p className="sf-lock-time demo-display" aria-live="off">
        <span key={time}>{time}</span>
      </p>
      {ines.jumpAt !== null && view.t < ines.jumpAt ? (
        <p className="sf-lock-left">{t('left', { name: person('ines'), count: items(ines.lines) })}</p>
      ) : (
        <p className="sf-lock-jump demo-mono" data-on={jumping ? '' : undefined} aria-hidden={!jumping}>
          {t('jump')}
        </p>
      )}
      <div className="sf-lock-stack">
        {pushOn ? (
          <PushBanner
            app="WhatsApp"
            icon={
              <span className="sf-push-icon">
                <BrumaMark />
              </span>
            }
            time={t('now')}
            title={business}
            body={t('push', { name: person('ines'), code: COUPON.code, pct: Math.round(COUPON.pct * 100) })}
            onOpen={() => {
              store.update(act.openWa());
              store.engage();
              if (active) play('open');
            }}
            openLabel={t('openPush')}
          />
        ) : null}
        {off && ines.jumpAt !== null && view.t >= ines.jumpAt ? (
          <p className="sf-lock-note" role="status">
            {t('off', { name: person('ines') })}
          </p>
        ) : null}
      </div>
      <button type="button" className="sf-lock-store" onClick={() => f.act(() => ({ screen: 'catalog' }))}>
        <Store aria-hidden strokeWidth={1.8} />
        {t('toStore')}
      </button>
    </div>
  );
}

/** The WhatsApp thread with the store (the recovery message + its buttons). */
export function WhatsAppScreen({ run, onPick, onBack }: { run: ChatRun; onPick: (step: string, reply: string) => void; onBack?: () => void }) {
  const f = useFront();
  const t = useTranslations('demoShop.front.lock');
  const { view, business, announce } = useShop();
  const { fmt } = useShopText();
  const ines = view.ines;
  const stamp = (at: number) => fmt.time(f.story && ines.pushAt !== null ? clockAt(ines.pushAt + at, ines.jumpAt) : view.clock);
  return (
    <div className="sf-wa">
      <div className="sf-wa-bar">
        {onBack ? (
          <button type="button" className="sf-back" onClick={onBack}>
            <ArrowLeft aria-hidden strokeWidth={2} />
            {t('toStore')}
          </button>
        ) : (
          <span className="sf-wa-app">WhatsApp</span>
        )}
        <PanelButton />
      </div>
      <ChatWidget
        variant="whatsapp"
        run={run}
        title={business}
        subtitle={t('business')}
        avatar={<BrumaMark />}
        label={t('threadLabel', { business })}
        announce={announce}
        stamp={stamp}
        dateLabel={t('today')}
        onPick={onPick}
        composer={t('composer')}
        className="sf-wa-chat"
      />
    </div>
  );
}
