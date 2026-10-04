'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Bath, CalendarCheck, CalendarDays, Check, ChevronLeft, ChevronRight, MessageCircle, Ruler, Square, X } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { BrowserFrame, Button, ChatPeek, ChatWidget, DemoBadge, PushBanner, SiteSection } from '../../kit';
import { ASKED, CAL_DAYS, LISTINGS, SITE_TIMES, SITE_URL, STORY, listingById, listingPath, type ListingId, type Scene, type ZoneId } from '../data';
import { act, freeSiteSlots, isVisitFree, parseSlotReply } from '../story';
import { useEstate } from '../context';
import { Facade, FloorPlan, MapBlock } from '../facade';
import { useEstateChats } from '../scripts';
import { LumenMark, useEstateText, ViewHead } from '../ui';
import { LiveChat } from './Inbox';
import { FollowThread } from './Followups';

type Page = { name: 'home' } | { name: 'listing'; id: ListingId };
const SCENES: Scene[] = ['day', 'dusk', 'night'];
const MAX_PRICES = [150_000, 200_000, 260_000] as const;

/* ------------------------------------------------------------------ */
/* Booking (the site's "Book a visit")                                   */
/* ------------------------------------------------------------------ */
function BookingWidget({ listing, compact, onSeeAgenda }: { listing: ListingId; compact: boolean; onSeeAgenda?: (day: number) => void }) {
  const t = useTranslations('demoRealEstate.site.booking');
  const { view, store, active } = useEstate();
  const x = useEstateText();
  const { play } = useSound();
  const [day, setDay] = useState<number | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [done, setDone] = useState<{ day: number; start: number } | null>(null);
  const times = day === null ? [] : SITE_TIMES[day].filter((m) => isVisitFree(view, day, m));

  if (done) {
    const bookedDay = done.day;
    return (
      <div className="re-book" data-compact={compact ? '' : undefined} data-state="booked" role="status">
        <span className="re-book-check" aria-hidden>
          <Check strokeWidth={2.2} />
        </span>
        <p className="re-book-title demo-display">{t('booked')}</p>
        <p className="text-[0.74em] leading-[1.45]">{t('bookedBody', { slot: x.slotLong(done), street: listingById(listing).street })}</p>
        <div className="flex flex-wrap gap-[0.4em]">
          {onSeeAgenda ? (
            <Button variant="secondary" icon={CalendarDays} onClick={() => onSeeAgenda(bookedDay)}>
              {t('seeAgenda')}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => setDone(null)}>
            {t('again')}
          </Button>
        </div>
      </div>
    );
  }
  const choose = (fn: () => void) => {
    fn();
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
          {day === null ? <span className="text-[0.7em] text-[var(--demo-muted)]">{t('pickDay')}</span> : null}
          {day !== null && !times.length ? <span className="text-[0.7em] text-[var(--demo-muted)]">{t('none')}</span> : null}
          {times.map((m) => (
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
          store.update(act.book({ day, start, listing, advisor: 'marcos', via: 'site' }));
          if (active) play('success');
          setDone({ day, start });
          setDay(null);
          setStart(null);
        }}
      >
        {t('confirm')}
      </Button>
      <p className="re-book-note">{t('note')}</p>
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
  const [max, setMax] = useState(0);
  const results = LISTINGS.filter((l) => (zone === 'all' || l.zone === zone) && l.rooms >= rooms && (!max || l.price <= max));
  const zones = [...new Set(LISTINGS.map((l) => l.zone))];
  return (
    <>
      <header className="re-site-hero">
        <p className="demo-site-kicker">{t('site.kicker')}</p>
        <h3 className="demo-site-title demo-display">{t.rich('site.title', { em: (c) => <em>{c}</em> })}</h3>
        {compact ? null : <p className="demo-site-body">{t('site.body')}</p>}
        <form className="re-search" onSubmit={(e) => e.preventDefault()} aria-label={t('site.search.label')}>
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
          <label>
            <span className="re-label">{t('site.search.price')}</span>
            <select value={max} onChange={(e) => setMax(Number(e.target.value))}>
              <option value={0}>{t('site.search.priceAny')}</option>
              {MAX_PRICES.map((n) => (
                <option key={n} value={n}>
                  {t('site.search.priceMax', { amount: x.fmt.num(n) })}
                </option>
              ))}
            </select>
          </label>
        </form>
      </header>
      <SiteSection kicker={<span aria-live="polite">{t('site.search.results', { count: results.length })}</span>}>
        {results.length ? (
          <ul className="re-results" data-compact={compact ? '' : undefined}>
            {results.map((l) => (
              <ListingCardLink key={l.id} id={l.id} onOpen={() => open(l.id)} />
            ))}
          </ul>
        ) : (
          <p className="re-empty">{t('site.search.none')}</p>
        )}
      </SiteSection>
    </>
  );
}

function ListingPage({ id, compact, back, onAsk, onSeeAgenda }: { id: ListingId; compact: boolean; back: () => void; onAsk?: () => void; onSeeAgenda?: (day: number) => void }) {
  const t = useTranslations('demoRealEstate');
  const { view } = useEstate();
  const x = useEstateText();
  const l = listingById(id);
  const reserved = view.outcome === 'reserve' && view.outcomeAt !== null && view.t >= view.outcomeAt && view.listing === id;
  const [booking, setBooking] = useState(!compact);
  const [photo, setPhoto] = useState(Math.max(0, SCENES.indexOf(l.scene)));
  const facts = [
    { icon: Square, text: x.rooms(id) },
    { icon: Ruler, text: t('listing.area', { count: l.area }) },
    { icon: Bath, text: t('listing.baths', { count: l.baths }) },
  ];
  const step = (d: 1 | -1) => setPhoto((p) => (p + d + SCENES.length) % SCENES.length);
  return (
    <div className="re-listing" data-compact={compact ? '' : undefined}>
      <div className="re-listing-gallery">
        <Facade listing={{ ...l, scene: SCENES[photo] }} label={t('listing.photoN', { street: l.street, n: photo + 1, total: SCENES.length })} className="re-listing-photo" />
        <span className="re-listing-count demo-num" aria-live="polite">
          {t('site.gallery', { n: photo + 1, total: SCENES.length })}
        </span>
        <span className="re-gallery-nav">
          <button type="button" aria-label={t('site.prevPhoto')} onClick={() => step(-1)}>
            <ChevronLeft aria-hidden strokeWidth={1.8} />
          </button>
          <button type="button" aria-label={t('site.nextPhoto')} onClick={() => step(1)}>
            <ChevronRight aria-hidden strokeWidth={1.8} />
          </button>
        </span>
        {reserved ? (
          <span className="re-status re-listing-status" data-reserved="">
            {t('listing.reserved')}
          </span>
        ) : null}
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
          <Button icon={CalendarCheck} onClick={() => setBooking(true)} aria-expanded={booking} data-tour="site">
            {t('site.book')}
          </Button>
          {onAsk ? (
            <Button variant="secondary" icon={MessageCircle} onClick={onAsk}>
              {t('site.ask')}
            </Button>
          ) : null}
        </div>
        {booking ? <BookingWidget listing={id} compact={compact} onSeeAgenda={onSeeAgenda} /> : null}
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
function PublicSite({
  compact,
  page,
  setPage,
  onAsk,
  onSeeAgenda,
}: {
  compact: boolean;
  page: Page;
  setPage: (p: Page) => void;
  onAsk?: () => void;
  onSeeAgenda?: (day: number) => void;
}) {
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
          <button type="button" className="re-site-navlink" aria-current={page.name === 'home' ? 'page' : undefined} onClick={() => setPage({ name: 'home' })}>
            {t('site.nav.all', { count: LISTINGS.length })}
          </button>
        )}
      </nav>
      {page.name === 'home' ? (
        <HomePage compact={compact} open={(id) => setPage({ name: 'listing', id })} />
      ) : (
        <ListingPage key={page.id} id={page.id} compact={compact} back={() => setPage({ name: 'home' })} onAsk={onAsk} onSeeAgenda={onSeeAgenda} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The visitor's own chat with Lumi (qualifies them; books a visit)     */
/* ------------------------------------------------------------------ */
/** The visitor's own chat run + its pick handler (a slot reply books the visit). */
function useOwnChat() {
  const { view, state, store, active } = useEstate();
  const chats = useEstateChats();
  const { play } = useSound();
  return {
    run: chats.own(view, state, freeSiteSlots(view)),
    pick: (step: string, reply: string) => {
      store.update(act.ownPick(step, reply));
      const slot = step === 'match' ? parseSlotReply(reply) : null;
      if (slot && view.own) store.update(act.book({ ...slot, listing: view.own.match, advisor: 'marcos', via: 'chat' }));
      if (active) play(slot ? 'success' : 'select');
    },
  };
}

export function OwnChat({ className = '', announce: announceProp }: { className?: string; announce?: boolean }) {
  const t = useTranslations('demoRealEstate');
  const { business, announce } = useEstate();
  const { run, pick } = useOwnChat();
  return (
    <ChatWidget
      variant="widget"
      run={run}
      title={business}
      subtitle={t('chat.subtitle')}
      avatar={<LumenMark />}
      label={t('own.label', { business })}
      announce={announceProp ?? announce}
      onPick={pick}
      composer={t('chat.composer')}
      className={`re-chat ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Laptop: the site in a browser, with Lumi's chat docked               */
/* ------------------------------------------------------------------ */
function SiteChatDock() {
  const t = useTranslations('demoRealEstate.chat');
  const { active } = useEstate();
  const own = useOwnChat();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="re-dock">
        <OwnChat announce={false} />
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
      run={own.run}
      title={t('subtitle')}
      avatar={<LumenMark />}
      onPick={(step, reply) => {
        own.pick(step, reply);
        setOpen(true);
      }}
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
  const { seeVisits } = useEstate();
  const [page, setPage] = useState<Page>({ name: 'listing', id: ASKED });
  return (
    <div className="flex h-full min-h-0 flex-col gap-[0.9em]">
      <ViewHead title={t('nav.site')} sub={t('site.viewSub', { url: SITE_URL })} />
      <div className="re-site-frame">
        <BrowserFrame url={page.name === 'home' ? SITE_URL : listingPath(page.id)} className="h-full">
          <PublicSite compact={false} page={page} setPage={setPage} onSeeAgenda={seeVisits} />
        </BrowserFrame>
        <SiteChatDock />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The buyer's phone                                                    */
/* ------------------------------------------------------------------ */
/**
 * Next to the laptop: Carolina's phone — the site with Lumi's chat (it opens inside beat 1) and,
 * after the visit, the WhatsApp follow-up (it opens inside beat 4). The visitor can browse and
 * answer for her at rest; a later beat takes the screen again.
 * Opened from the phone app (`onClose`): the visitor's own visit to the site and their own chat.
 */
export function BuyerPhone({ onClose }: { onClose?: () => void }) {
  const t = useTranslations('demoRealEstate');
  const { view, business, active, seeVisits } = useEstate();
  const x = useEstateText();
  const { play } = useSound();
  const own = !!onClose;
  const [page, setPage] = useState<Page>({ name: 'listing', id: ASKED });
  const [chatOv, setChatOv] = useState<{ open: boolean; at: number } | null>(null);
  const [screenOv, setScreenOv] = useState<{ screen: 'site' | 'whatsapp'; at: number } | null>(null);

  // What the story shows, and when it last changed (a visitor's choice wins until the story changes again).
  const threadAt = view.followStart !== null ? view.followStart + STORY.openThread : null;
  const storyScreen = !own && threadAt !== null && view.t >= threadAt ? 'whatsapp' : 'site';
  const storyScreenAt = storyScreen === 'whatsapp' ? threadAt! : -1;
  const screen = screenOv && screenOv.at >= storyScreenAt ? screenOv.screen : storyScreen;
  const storyChat = !own && view.t >= STORY.chatOpen;
  const chatOpen = chatOv && chatOv.at >= (storyChat ? STORY.chatOpen : -1) ? chatOv.open : storyChat;
  const followAt = view.followStart;
  const pushVisible = !own && followAt !== null && view.follow !== null && screen === 'site' && view.t >= followAt && view.t < (threadAt ?? 0);
  const l = listingById(view.listing);

  const setChat = (open: boolean) => {
    setChatOv({ open, at: view.t });
    if (active) play(open ? 'open' : 'close');
  };
  const seeAgenda = onClose
    ? (day: number) => {
        onClose();
        seeVisits(day);
      }
    : undefined;

  return (
    <div className="re-buyer" data-view={screen}>
      {onClose ? (
        <div className="re-buyer-bar">
          <button type="button" className="re-back" onClick={onClose}>
            <ArrowLeft aria-hidden strokeWidth={2} />
            {t('buyer.backToApp')}
          </button>
          <span className="re-label truncate">{t('buyer.you')}</span>
        </div>
      ) : null}
      {screen === 'whatsapp' && view.follow ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="re-buyer-bar">
            <button type="button" className="re-back" onClick={() => setScreenOv({ screen: 'site', at: view.t })}>
              <ArrowLeft aria-hidden strokeWidth={2} />
              {t('buyer.backToSite')}
            </button>
            <span className="re-label truncate">{t('buyer.jump', { date: x.day(view.clock.day) })}</span>
          </div>
          <FollowThread announce={false} className="re-buyer-wa" />
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <BrowserFrame url={page.name === 'home' ? SITE_URL : listingPath(page.id)} variant="mobile" className="min-h-0 flex-1">
            <PublicSite compact page={page} setPage={setPage} onAsk={() => setChat(true)} onSeeAgenda={seeAgenda} />
          </BrowserFrame>
          {chatOpen ? (
            <div className="re-sheet" data-tour="chat">
              {own ? <OwnChat /> : <LiveChat announce={false} />}
              <button type="button" className="re-sheet-close" aria-label={t('chat.close')} onClick={() => setChat(false)}>
                <X aria-hidden strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button type="button" className="re-launcher" onClick={() => setChat(true)} data-tour="chat">
              <LumenMark />
              {t('chat.open')}
            </button>
          )}
          {!own && view.follow && screen === 'site' && !pushVisible ? (
            <button type="button" className="re-wabtn" onClick={() => setScreenOv({ screen: 'whatsapp', at: view.t })}>
              <MessageCircle aria-hidden strokeWidth={1.9} />
              {t('buyer.openThread')}
            </button>
          ) : null}
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
              setScreenOv({ screen: 'whatsapp', at: view.t });
              if (active) play('open');
            }}
            openLabel={t('buyer.openPush')}
          />
        </div>
      ) : null}
    </div>
  );
}
