'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ASKED, LISTINGS, type Listing } from '../data';
import { useEstate } from '../context';
import { Facade } from '../facade';
import { useEstateText, ViewHead } from '../ui';

/** Each listing's numbers this week, including tonight's inquiry, visit and reservation. */
function useListingStats() {
  const { view, recent } = useEstate();
  return (l: Listing) => {
    const inquiries = l.inquiries + (l.id === ASKED && view.t >= view.inquiryAt ? 1 : 0);
    const visits = l.visits + view.visits.filter((v) => v.listing === l.id && (v.who === 'carolina' || v.who === 'you')).length;
    const reserved = view.outcome === 'reserve' && view.outcomeAt !== null && view.t >= view.outcomeAt && view.listing === l.id;
    const fresh = (view.listing === l.id && recent(view.bookedAt, 2400)) || (reserved && recent(view.outcomeAt, 2400));
    return { inquiries, visits, reserved, fresh };
  };
}

export function PhoneListings() {
  const t = useTranslations('demoRealEstate');
  const x = useEstateText();
  const stats = useListingStats();
  return (
    <div className="flex flex-col gap-[0.9em] pt-[0.3em]">
      <ViewHead title={t('listings.title')} sub={t('listings.sub', { count: LISTINGS.length })} />
      <ul className="flex flex-col gap-[0.8em]">
        {LISTINGS.map((l) => {
          const s = stats(l);
          return (
            <li key={l.id} className={`re-lcard ${s.fresh ? 'demo-fresh' : ''}`}>
              <div className="re-lcard-img">
                <Facade listing={l} label={t('listing.photo', { street: l.street })} />
                <span className="re-status" data-reserved={s.reserved ? '' : undefined}>
                  {s.reserved ? t('listing.reserved') : t('listing.available')}
                </span>
              </div>
              <div className="re-lcard-body">
                <p className="re-lcard-price demo-display">{x.price(l.price)}</p>
                <p className="text-[0.78em] font-semibold">{l.street}</p>
                <p className="text-[0.68em] text-[var(--demo-muted)]">
                  {x.title(l.id)} · {x.rooms(l.id, true)} · {t('listing.area', { count: l.area })}
                </p>
                <p className="re-lcard-meta demo-num">
                  {t('listing.inquiries', { count: s.inquiries })} · {t('listing.visits', { count: s.visits })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LaptopListings() {
  const t = useTranslations('demoRealEstate');
  const x = useEstateText();
  const stats = useListingStats();
  const max = Math.max(...LISTINGS.map((l) => stats(l).inquiries));
  return (
    <div className="flex flex-col gap-[1em]">
      <ViewHead title={t('listings.title')} sub={t('listings.sub', { count: LISTINGS.length })} />
      <table className="re-table">
        <caption className="sr-only">{t('listings.caption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('listings.cols.property')}</th>
            <th scope="col" className="text-right">
              {t('listings.cols.price')}
            </th>
            <th scope="col" className="text-right">
              {t('listings.cols.area')}
            </th>
            <th scope="col">{t('listings.cols.inquiries')}</th>
            <th scope="col" className="text-right">
              {t('listings.cols.visits')}
            </th>
            <th scope="col">{t('listings.cols.status')}</th>
          </tr>
        </thead>
        <tbody>
          {LISTINGS.map((l) => {
            const s = stats(l);
            return (
              <tr key={l.id} className={s.fresh ? 'demo-fresh' : undefined}>
                <th scope="row">
                  <span className="flex items-center gap-[0.8em]">
                    <span className="re-table-img">
                      <Facade listing={l} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.82em] font-semibold">{l.street}</span>
                      <span className="block truncate text-[0.66em] font-normal text-[var(--demo-muted)]">
                        {x.title(l.id)} · {x.rooms(l.id, true)}
                      </span>
                    </span>
                  </span>
                </th>
                <td className="demo-num text-right">{x.price(l.price)}</td>
                <td className="demo-num text-right">{t('listing.area', { count: l.area })}</td>
                <td>
                  <span className="re-table-bar" aria-hidden>
                    <span style={{ '--v': s.inquiries / max } as CSSProperties} />
                  </span>
                  <span className="demo-num">{s.inquiries}</span>
                </td>
                <td className="demo-num text-right">{s.visits}</td>
                <td>
                  <span className="re-status" data-reserved={s.reserved ? '' : undefined}>
                    {s.reserved ? t('listing.reserved') : t('listing.available')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
