'use client';

import { ArrowRight, ChefHat, MessageCircle, QrCode } from 'lucide-react';
import { BrowserFrame } from '../../kit';
import { QR_TABLE, SITE_URL } from '../data';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { StageStamp, TicketCard, ViewHead } from '../ui';
import { QrMark } from './Menu';
import { CustomerApp } from './Customer';

/**
 * The carta as customers see it (QR on the table / the bodegón's own site), usable on the
 * desktop too: order or book here and it lands on the kitchen display and the floor plan.
 */
export function LaptopQr() {
  const { view, state, go, loop } = useRestaurant();
  const x = useRestaurantText();
  const { t } = x;
  const mine = view.tickets.filter((tk) => tk.mine).sort((a, b) => b.num - a.num);
  const latest = mine[0] ?? null;
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead rubric={t('qr.rubric')} title={t('qr.title')} sub={t('qr.subtitle')} />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-start gap-[1.1em]">
        <BrowserFrame url={`${SITE_URL}/carta?mesa=${QR_TABLE}`} variant="mobile" className="rl-qrframe" >
          <div className="rl rl-customer-root" data-tour="order">
            <CustomerApp key={loop} />
          </div>
        </BrowserFrame>
        <div className="flex min-w-0 flex-col gap-[0.75em]">
          <div className="rl-qr">
            <QrMark className="rl-qr-code" />
            <div className="min-w-0">
              <p className="rl-rubric">{t('menu.qr.title')}</p>
              <p className="rl-qr-url demo-mono">
                {SITE_URL}/carta?mesa={QR_TABLE}
              </p>
              <p className="text-[0.7em] text-[var(--demo-muted)]">{t('menu.qr.body')}</p>
            </div>
          </div>
          <ol className="rl-steps">
            {(['scan', 'kitchen', 'whatsapp'] as const).map((k, i) => {
              const Icon = k === 'scan' ? QrCode : k === 'kitchen' ? ChefHat : MessageCircle;
              return (
                <li key={k}>
                  <span className="rl-steps-n demo-mono">{i + 1}</span>
                  <Icon aria-hidden strokeWidth={1.7} />
                  <span className="min-w-0">{t(`qr.steps.${k}`)}</span>
                </li>
              );
            })}
          </ol>
          <section className="rl-panel">
            <h3 className="rl-rubric">{t('qr.yours')}</h3>
            {latest ? (
              <div className="flex flex-col gap-[0.55em]">
                <p className="flex items-center gap-[0.5em] text-[0.74em]">
                  <span className="demo-mono">#{latest.num}</span>
                  <StageStamp stage={latest.stage} channel={latest.channel} />
                  <span className="text-[var(--demo-muted)]">{t('qr.count', { count: state.orders.length })}</span>
                </p>
                <TicketCard ticket={latest} bump className="rl-qr-ticket" />
                <button type="button" className="rl-linkbtn self-start" onClick={() => go('kitchen')}>
                  {t('qr.toKitchen')}
                  <ArrowRight aria-hidden strokeWidth={1.8} />
                </button>
              </div>
            ) : (
              <p className="text-[0.72em] text-[var(--demo-muted)]">{t('qr.empty')}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
