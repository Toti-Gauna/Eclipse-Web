'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Bath, CalendarCheck, Check, ChevronLeft, MessageCircle, Ruler, Square, X } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { BrowserFrame, Button, ChatPeek, DemoBadge, PushBanner, SiteSection } from '../../kit';
import { ASKED, CAL_DAYS, LISTINGS, SITE_TIMES, SITE_URL, STORY, listingById, listingPath, type ListingId, type ZoneId } from '../data';
import { act, isVisitFree } from '../story';
import { useEstate } from '../context';
import { Facade, FloorPlan, MapBlock } from '../facade';
import { LumenMark, useEstateText, ViewHead } from '../ui';
import { LiveChat, useInquiry } from './Inbox';
import { FollowThread } from './Followups';

type Page = { name: 'home' } | { name: 'listing'; id: ListingId };

/* ------------------------------------------------------------------ */
/* Booking (the site's "Book a visit")                                   */
/* ------------------------------------------------------------------ */
function BookingWidget({ listing, compact }: { listing: ListingId; compact: boolean }) {
  const t = useTranslations('demoRealEstate.site.booking');
  const { view, store, active } = useEstate();
  const x = useEstateText();
  const { play } = useSound();
  const [day, setDay] = useState<number | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [done, setDone] = useState<{ day: number; start: number } | null>(null);
  const times = day === null ? [] : SITE_TIMES[day].filter((m) => isVisitFree(view.visits, day, m));

  if (done) {
    return (
      <div className="re-book" data-compact={compact ? '' : undefined} data-state="booked" role="status">
        <span className="re-book-check" aria-hidden>
          <Check strokeWidth={2.2} />
        </span>
        <p className="re-book-title demo-display">{t('booked')}</p>
        <p className="text-[0.74em] leading-[1.45]">{t('bookedBody', { slot: x.slotLong(done), street: listingById(listing).street })}</p>
        <Button variant="ghost" onClick={() => setDone(null)}>
          {t('again')}
        </Button>
      </div>
    );
  }
  const choose = (fn: () => void) => {
    fn();
    store.engage();
    store.update(act.touchBuyer());
    if (active) play('select');
  };
  return (
    <div className="re-book" data-compact={compact ? '' : undefined}>
      <p className="re-book-title demo-display">{t('title')}</p>
      <fieldset className="re-book-step">
        <legend>{t('day')}</legend>
        <div className="re-book-options">
          {CAL_DAYS.map((d) => (
            <button key={d} type="button" className="re-chip" aria-pressed={day === d} onClick={() => choose(() => (setDay(d), setStart(null)))}>
              {x.day(d)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="re-book-step" disabled={day === null}>
        <legend>{t('time')}</legend>
        <div className="re-book-options">
          {day !== null && !times.length ? <span className="text-[0.7em] text-[var(--demo-muted)]">{t('none')}</span> : null}
          {(day === null ? SITE_TIMES[CAL_DAYS[0]] : times).map((m) => (
            <button key={m} type="button" className="re-chip demo-num" aria-pressed={start === m} onClick={() => choose(() => setStart(m))}>
              {x.fmt.time(m)}
            </button>
          ))}
        </div>
      </fieldset>
      <Button
        disabled={day === null || start === null}
        className="re-book-go"
        icon={CalendarCheck}
        onClick={() => {
          if (day === null || start === null) return;
          store.update(act.book({ day, start, listing, via: 'site' }));
          store.engage();
          if (active) play('success');
          setDone({ day, start });
          setDay(null);
          setStart(null);
        }}
      >
        {t('confirm')}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pages                                                                */
/* ------------------------------------------------------------------ */
function ListingCardLink({ id, onOpen }: { id: ListingId; onOpen: () => void }) {
  const t = useTranslations('demoRealEstate');
  const x = useEstateText();
  const l = listingById(id);
  return (
    <li>
      <button type="button" className="re-result" onClick={onOpen}>
        <span className="re-result-img">
          <Facade listing={l} />
        </span>
        <span className="re-result-price demo-display">{x.price(l.price)}</span>
        <span className="block truncate text-[0.76em] font-semibold">{l.street}</span>
        <span className="block truncate text-[0.66em] text-[var(--demo-muted)]">
          {x.title(id)} · {x.rooms(id, true)} · {t('listing.area', { count: l.area })}
        </span>
      </button>
    </li>
  );
}

function HomePage({ compact, open }: { compact: boolean; open: (id: ListingId) => void }) {
  const t = useTranslations('demoRealEstate');
  const x = useEstateText();
  const [zone, setZone] = useState<ZoneId | 'all'>('all');
  const [rooms, setRooms] = useState(0);
  const results = LISTINGS.filter((l) => (zone === 'all' || l.zone === zone) && l.rooms >= rooms);
  const zones = [...new Set(LISTINGS.map((l) => l.zone))];
  const search = (
    <form className="re-search" onSubmit={(e) => e.preventDefault()} aria-label={t('site.search.go')}>
      <label>
        <span className="re-label">{t('site.search.op')}</span>
        <select disabled defaultValue="buy">
          <option value="buy">{t('site.search.opValue')}</option>
        </select>
      </label>
      <label>
        <span className="re-label">{t('site.search.zone')}</span>
        <select value={zone} onChange={(e) => setZone(e.target.value as ZoneId | 'all')}>
          <option value="all">{t('site.search.zoneAll')}</option>
          {zones.map((z) => (
            <option key={z} value={z}>
              {x.zone(z)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="re-label">{t('site.search.rooms')}</span>
        <select value={rooms} onChange={(e) => setRooms(Number(e.target.value))}>
          <option value={0}>{t('site.search.roomsAny')}</option>
          {[2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {t('site.search.roomsMin', { count: n })}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
  return (
    <>
      <header className="re-site-hero">
        <p className="demo-site-kicker">{t('site.kicker')}</p>
        <h3 className="demo-site-title demo-display">{t.rich('site.title', { em: (c) => <em>{c}</em> })}</h3>
        {compact ? null : <p className="demo-site-body">{t('site.body')}</p>}
        {search}
      </header>
      <SiteSection kicker={t('site.search.results', { count: results.length })}>
        <ul className="re-results" data-compact={compact ? '' : undefined}>
          {results.map((l) => (
            <ListingCardLink key={l.id} id={l.id} onOpen={() => open(l.id)} />
          ))}
        </ul>
      </SiteSection>
    </>
  );
}

function ListingPage({ id, compact, back, onAsk }: { id: ListingId; compact: boolean; back: () => void; onAsk?: () => void }) {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const x = useEstateText();
  const l = listingById(id);
  const reserved = view.outcome === 'reserve' && view.outcomeAt !== null && view.t >= view.outcomeAt && view.listing === id;
  const [booking, setBooking] = useState(!compact);
  const facts = [
    { icon: Square, text: x.rooms(id) },
    { icon: Ruler, text: t('listing.area', { count: l.area }) },
    { icon: Bath, text: t('listing.baths', { count: l.baths }) },
  ];
  return (
    <div className="re-listing" data-compact={compact ? '' : undefined}>
      <div className="re-listing-gallery">
        <Facade listing={l} label={t('listing.photo', { street: l.street })} className="re-listing-photo" />
        <span className="re-listing-count demo-num" aria-hidden>
          {t('site.gallery', { n: 1, total: 3 })}
        </span>
        {reserved ? <span className="re-status re-listing-status" data-reserved="">{t('listing.reserved')}</span> : null}
      </div>
      <div className="re-listing-info">
        <button type="button" className="re-crumbs" onClick={back}>
          <ChevronLeft aria-hidden strokeWidth={1.8} />
          {t('site.crumbs', { zone: x.zone(l.zone) })}
        </button>
        <h3 className="re-listing-title demo-display">{l.street}</h3>
        <p className="re-listing-price demo-num">{x.price(l.price)}</p>
        <p className="text-[0.68em] text-[var(--demo-muted)]">{l.fees ? t('listing.fees', { amount: l.fees }) : t('listing.noFees')}</p>
        <ul className="re-facts">
          {facts.map((f) => (
            <li key={f.text}>
              <f.icon aria-hidden strokeWidth={1.5} />
              {f.text}
            </li>
          ))}
        </ul>
        <ul className="re-features" aria-label={t('site.features')}>
          {l.features.map((f) => (
            <li key={f}>{t(`features.${f}`)}</li>
          ))}
        </ul>
        <div className="re-listing-actions">
          <Button icon={CalendarCheck} onClick={() => setBooking(true)} aria-expanded={booking}>
            {t('site.book')}
          </Button>
          {onAsk ? (
            <Button variant="secondary" icon={MessageCircle} onClick={onAsk}>
              {t('site.ask')}
            </Button>
          ) : null}
        </div>
        {booking ? <BookingWidget listing={id} compact={compact} /> : null}
      </div>
      <div className="re-listing-blocks">
        <figure className="re-block">
          <figcaption className="re-label">{t('site.plan')}</figcaption>
          <FloorPlan
            labels={{
              living: t('site.planRooms.living'),
              bed: t('site.planRooms.bed'),
              kitchen: t('site.planRooms.kitchen'),
              bath: t('site.planRooms.bath'),
              balcony: t('site.planRooms.balcony'),
            }}
          />
        </figure>
        <figure className="re-block">
          <figcaption className="re-label">{t('site.map')}</figcaption>
          <MapBlock />
          <p className="mt-[0.4em] text-[0.66em] text-[var(--demo-muted)]">{x.zone(l.zone)}</p>
        </figure>
      </div>
    </div>
  );
}

/** Lumen's public site: search → listing → book a visit (kit site classes, own pages). */
function PublicSite({ compact, page, setPage, onAsk }: { compact: boolean; page: Page; setPage: (p: Page) => void; onAsk?: () => void }) {
  const t = useTranslations('demoRealEstate');
  const { business } = useEstate();
  return (
    <div className="demo-site re-site" data-compact={compact ? '' : undefined}>
      <nav className="demo-site-nav" aria-label={business}>
        <button type="button" className="demo-site-brand" onClick={() => setPage({ name: 'home' })}>
          <span className="re-site-mark" aria-hidden>
            <LumenMark />
          </span>
          <span className="truncate">{business}</span>
          <DemoBadge />
        </button>
        {compact ? null : (
          <ul className="demo-site-links" aria-hidden>
            {(['buy', 'rent', 'sell', 'contact'] as const).map((k) => (
              <li key={k}>{t(`site.nav.${k}`)}</li>
            ))}
          </ul>
        )}
      </nav>
      {page.name === 'home' ? (
        <HomePage compact={compact} open={(id) => setPage({ name: 'listing', id })} />
      ) : (
        <ListingPage key={page.id} id={page.id} compact={compact} back={() => setPage({ name: 'home' })} onAsk={onAsk} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Laptop: the site in a browser, with its chat docked                  */
/* ------------------------------------------------------------------ */
function SiteChatDock() {
  const t = useTranslations('demoRealEstate.chat');
  const { active } = useEstate();
  const { run, pick } = useInquiry();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="re-dock">
        <LiveChat announce={false} />
        <button
          type="button"
          className="re-dock-close"
          aria-label={t('close')}
          onClick={() => {
            setOpen(false);
            if (active) play('close');
          }}
        >
          <X aria-hidden strokeWidth={2} />
        </button>
      </div>
    );
  }
  return (
    <ChatPeek
      run={run}
      title={t('subtitle')}
      avatar={<LumenMark />}
      onPick={pick}
      onOpen={() => {
        setOpen(true);
        if (active) play('open');
      }}
      openLabel={t('expand')}
      className="re-peek"
    />
  );
}

export function LaptopSite() {
  const t = useTranslations('demoRealEstate');
  const [page, setPage] = useState<Page>({ name: 'listing', id: ASKED });
  return (
    <div className="flex h-full min-h-0 flex-col gap-[0.9em]">
      <ViewHead title={t('nav.site')} sub={SITE_URL} />
      <div className="re-site-frame">
        <BrowserFrame url={page.name === 'home' ? SITE_URL : listingPath(page.id)} className="h-full">
          <PublicSite compact={false} page={page} setPage={setPage} />
        </BrowserFrame>
        <SiteChatDock />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The buyer's phone: the site + its chat → WhatsApp after the visit    */
/* ------------------------------------------------------------------ */
export function BuyerPhone({ onClose }: { onClose?: () => void }) {
  const t = useTranslations('demoRealEstate');
  const { view, state, store, paired, business, active } = useEstate();
  const x = useEstateText();
  const { play } = useSound();
  const auto = paired && !onClose && !state.buyerManual;
  const [page, setPage] = useState<Page>({ name: 'listing', id: ASKED });
  const [screenOverride, setScreen] = useState<'site' | 'whatsapp' | null>(null);
  const [chatOverride, setChat] = useState<boolean | null>(null);

  const followAt = view.followStart;
  const threadAt = followAt !== null ? followAt + STORY.openThread : null;
  const screen = screenOverride ?? (auto && threadAt !== null && view.t >= threadAt ? 'whatsapp' : 'site');
  const chatOpen = chatOverride ?? (onClose ? true : view.t >= STORY.chatOpen);
  const pushVisible = followAt !== null && view.follow !== null && screen === 'site' && view.t >= followAt && view.t - followAt < (auto ? STORY.openThread : 4200);
  const touch = () => store.update(act.touchBuyer());
  const l = listingById(view.listing);

  return (
    <div className="re-buyer" data-view={screen}>
      {onClose ? (
        <div className="re-buyer-bar">
          <button type="button" className="re-back" onClick={onClose}>
            <ArrowLeft aria-hidden strokeWidth={2} />
            {t('buyer.backToApp')}
          </button>
          <span className="re-label truncate">{t('top.buyer')}</span>
        </div>
      ) : null}
      {screen === 'whatsapp' && view.follow ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="re-buyer-bar">
            <button
              type="button"
              className="re-back"
              onClick={() => {
                touch();
                setScreen('site');
              }}
            >
              <ArrowLeft aria-hidden strokeWidth={2} />
              {t('buyer.backToSite')}
            </button>
            <span className="re-label truncate">{t('buyer.jump', { date: x.day(view.clock.day) })}</span>
          </div>
          <FollowThread announce={!paired} className="re-buyer-wa" />
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <BrowserFrame url={page.name === 'home' ? SITE_URL : listingPath(page.id)} variant="mobile" className="min-h-0 flex-1">
            <PublicSite
              compact
              page={page}
              setPage={(p) => {
                touch();
                setPage(p);
              }}
              onAsk={() => {
                touch();
                setChat(true);
                if (active) play('open');
              }}
            />
          </BrowserFrame>
          {chatOpen ? (
            <div className="re-sheet">
              <LiveChat />
              <button
                type="button"
                className="re-sheet-close"
                aria-label={t('chat.close')}
                onClick={() => {
                  touch();
                  setChat(false);
                  if (active) play('close');
                }}
              >
                <X aria-hidden strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="re-launcher"
              onClick={() => {
                touch();
                setChat(true);
                if (active) play('open');
              }}
            >
              <LumenMark />
              {t('chat.open')}
            </button>
          )}
        </div>
      )}
      {pushVisible ? (
        <div className="re-push">
          <PushBanner
            app={t('buyer.app')}
            icon={
              <span className="re-push-icon">
                <MessageCircle strokeWidth={2} />
              </span>
            }
            time={t('buyer.now')}
            title={business}
            body={t('buyer.push', { street: l.street })}
            onOpen={() => {
              touch();
              setScreen('whatsapp');
              if (active) play('open');
            }}
            openLabel={t('buyer.openPush')}
          />
        </div>
      ) : null}
    </div>
  );
}
