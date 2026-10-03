'use client';

import { useState, type ReactNode } from 'react';
import { ArrowLeft, Bike, CalendarCheck, Check, MessageCircle, Minus, Plus, ShoppingBag, Wheat } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { BrandName, Button, PushBanner } from '../../kit';
import { BOOK_TIMES, CATEGORIES, MENU, SITE_URL, STORY, dishById, itemCount, itemList, type DishId, type Items } from '../data';
import { act, bestTable, isSoldOut, substitute, type Ticket } from '../story';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { LuceroMark } from '../ui';

type Screen = 'menu' | 'cart' | 'status' | 'book' | 'booked';
type Mode = 'delivery' | 'pickup';

const W = STORY.web;
/** Autoplay target being "tapped" now (a ring on it). */
const tapping = (t: number, at: number) => t >= at - 650 && t < at + 150;

/** Sofía's order as the customer's phone plays it (follows the stock). */
function useAutoplay() {
  const { view, state } = useRestaurant();
  const t = view.t;
  const first = substitute(state, 'ravioles', W.add1) ?? 'ravioles';
  const second = substitute(state, 'flan', W.add2) ?? 'flan';
  const cart: Items = {};
  if (t >= W.add1) cart[first] = 1;
  if (t >= W.add2) cart[second] = (cart[second] ?? 0) + 1;
  const screen: Screen = t >= W.place ? 'status' : t >= W.cart ? 'cart' : 'menu';
  const tap = tapping(t, W.add1) ? `add-${first}` : tapping(t, W.add2) ? `add-${second}` : tapping(t, W.cart) ? 'cartbar' : tapping(t, W.mode) ? 'mode-delivery' : tapping(t, W.place) ? 'confirm' : null;
  return { cart, screen, tap, mode: 'delivery' as Mode, ticket: view.tickets.find((tk) => tk.id === 'web-sofia') ?? null };
}

const STEPS = ['received', 'cooking', 'ready', 'out'] as const;
function stepOf(tk: Ticket): number {
  if (tk.stage === 'new') return 0;
  if (tk.stage === 'cooking') return 1;
  if (tk.stage === 'ready') return 2;
  return 3;
}

/** Live order status: a receipt with a 4-step rail and the promised time. */
function OrderStatus({ ticket, mode, onAgain }: { ticket: Ticket | null; mode: Mode; onAgain?: () => void }) {
  const x = useRestaurantText();
  const { t, fmt } = x;
  if (!ticket) {
    return (
      <div className="rl-cx-status">
        <p className="rl-cx-wait demo-mono">{t('customer.status.sending')}</p>
      </div>
    );
  }
  const step = stepOf(ticket);
  const label = (s: (typeof STEPS)[number]) => (s === 'out' ? t(mode === 'delivery' ? 'customer.status.steps.out' : 'customer.status.steps.picked') : t(`customer.status.steps.${s}`));
  return (
    <div className="rl-cx-status demo-pop">
      <div className="rl-cx-receipt">
        <p className="rl-rubric">{t('customer.status.title')}</p>
        <p className="rl-cx-num demo-mono">#{ticket.num}</p>
        <p className="rl-cx-eta">
          <span>{t(mode === 'delivery' ? 'customer.status.arrives' : 'customer.status.ready')}</span>
          <span className="demo-mono">{ticket.eta !== undefined ? fmt.time(ticket.eta) : ''}</span>
        </p>
        {mode === 'delivery' ? (
          <div className="rl-cx-route">
            <span className="rl-cx-route-end">{t('customer.status.route.from')}</span>
            <span className="rl-cx-route-track" aria-hidden>
              {ticket.stage === 'out' || ticket.stage === 'done' ? (
                <span className="rl-cx-route-run demo-loop">
                  <span className="rl-cx-route-rider">
                    <Bike strokeWidth={1.8} />
                  </span>
                </span>
              ) : (
                <span className="rl-cx-route-rider" data-wait="">
                  <Bike strokeWidth={1.8} />
                </span>
              )}
            </span>
            <span className="rl-cx-route-end">{t('customer.status.route.to')}</span>
            <p className="rl-cx-route-note">
              {ticket.stage === 'out' || ticket.stage === 'done' ? t('customer.status.route.rider', { name: t('people.rider.name') }) : t('customer.status.route.riderWait')}
            </p>
          </div>
        ) : null}
        <ol className="rl-cx-steps" aria-label={t('customer.status.progress')}>
          {STEPS.map((s, i) => (
            <li key={s} data-done={i < step ? '' : undefined} data-now={i === step ? '' : undefined} aria-current={i === step ? 'step' : undefined}>
              <span aria-hidden className="rl-cx-step-dot">
                {i < step ? <Check strokeWidth={2.6} /> : null}
              </span>
              <span>{label(s)}</span>
            </li>
          ))}
        </ol>
        <ul className="rl-cx-items">
          {itemList(ticket.items).map(([d, n]) => (
            <li key={d}>
              <span className="demo-mono">{n}×</span>
              <span className="min-w-0 flex-1 truncate">{x.dish(d)}</span>
              <span className="demo-mono">{x.cash(x.price(d) * n)}</span>
            </li>
          ))}
          <li className="rl-cx-total">
            <span className="flex-1">{t('customer.total')}</span>
            <span className="demo-mono">{x.cash(x.sum(ticket.items))}</span>
          </li>
        </ul>
        <p className="rl-cx-wa">
          <MessageCircle aria-hidden strokeWidth={1.8} />
          {t('customer.status.whatsapp')}
        </p>
      </div>
      {onAgain ? (
        <button type="button" className="rl-linkbtn self-center" onClick={onAgain}>
          {t('customer.status.again')}
        </button>
      ) : null}
    </div>
  );
}

/**
 * What a customer sees (QR / web): the carta with prices and stock → their order →
 * live status (+ WhatsApp), or book a table. Next to the laptop it plays Sofía's order
 * until the visitor touches it; opened from the staff app (`onClose`), the visitor orders.
 */
export function CustomerApp({ onClose, auto: autoAllowed = false }: { onClose?: () => void; auto?: boolean }) {
  const { view, state, store, active, business } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const { play } = useSound();
  const autoplay = useAutoplay();
  const auto = autoAllowed && !state.manual;

  const [screenState, setScreen] = useState<Screen>('menu');
  const [cartState, setCart] = useState<Items>({});
  const [modeState, setMode] = useState<Mode>('delivery');
  const [people, setPeople] = useState(2);
  const [time, setTime] = useState(BOOK_TIMES[1]);
  const [orderIndex, setOrderIndex] = useState<number | null>(null);

  const myOrder = orderIndex !== null ? (state.orders[orderIndex] ?? null) : null;
  // A new loop drops the story's orders: back to the carta instead of a status with no order.
  const screen: Screen = auto ? autoplay.screen : screenState === 'status' && !myOrder ? 'menu' : screenState;
  const cart = auto ? autoplay.cart : cartState;
  const mode = auto ? autoplay.mode : modeState;
  const tap = auto ? autoplay.tap : null;

  const takeOver = () => {
    // The visitor is using it: hold the story's loop restart while they do.
    store.engage();
    if (!auto) return;
    store.update(act.touch());
    setCart(autoplay.screen === 'status' ? {} : autoplay.cart);
    setScreen(autoplay.screen === 'status' ? 'menu' : autoplay.screen);
  };
  const sound = (name: 'select' | 'success' | 'open' | 'close') => {
    if (active) play(name);
  };

  const ticket = auto ? autoplay.ticket : myOrder ? (view.tickets.find((tk) => tk.mine === myOrder.id) ?? null) : null;
  const myBooking = [...state.bookings].reverse().find((b) => b.via === 'web') ?? null;

  const add = (dish: DishId, delta: number) => {
    takeOver();
    setCart((c) => {
      const base = auto ? autoplay.cart : c;
      const n = Math.max(0, (base[dish] ?? 0) + delta);
      const next = { ...base, [dish]: n };
      if (!n) delete next[dish];
      return next;
    });
    sound('select');
  };
  const count = itemCount(cart);
  const total = x.sum(cart);

  // Push: the order left the kitchen (delivery) or is ready (take-away).
  const pushAt = ticket ? (mode === 'delivery' ? ticket.plan.out : ticket.plan.ready) : undefined;
  const push = ticket && pushAt !== undefined && pushAt >= 0 && view.t >= pushAt && view.t - pushAt < 4200;

  const header = (
    <header className="rl-cx-head">
      {onClose ? (
        <button type="button" className="rl-cx-back" onClick={onClose}>
          <ArrowLeft aria-hidden strokeWidth={2} />
          {t('customer.backToStaff')}
        </button>
      ) : null}
      <div className="rl-cx-brand">
        <BrandName business={business} logo={<LuceroMark />} />
        <p className="rl-cx-url demo-mono">{SITE_URL}</p>
      </div>
      <div className="rl-cx-tabs" role="group" aria-label={t('customer.tabsLabel')}>
        {(['order', 'book'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={(screen === 'book' || screen === 'booked' ? 'book' : 'order') === k}
            onClick={() => {
              takeOver();
              setScreen(k === 'book' ? (myBooking ? 'booked' : 'book') : orderIndex !== null ? 'status' : 'menu');
              sound('select');
            }}
          >
            {t(`customer.tabs.${k}`)}
          </button>
        ))}
      </div>
    </header>
  );

  let body: ReactNode;
  if (screen === 'status') {
    body = (
      <OrderStatus
        ticket={ticket}
        mode={mode}
        onAgain={
          auto
            ? undefined
            : () => {
                setOrderIndex(null);
                setScreen('menu');
                sound('select');
              }
        }
      />
    );
  } else if (screen === 'cart') {
    body = (
      <div className="rl-cx-cart demo-view">
        <button type="button" className="rl-cx-back" onClick={() => (takeOver(), setScreen('menu'))}>
          <ArrowLeft aria-hidden strokeWidth={2} />
          {t('customer.backToMenu')}
        </button>
        <h3 className="rl-cx-h demo-display">{t('customer.cart.title')}</h3>
        <ul className="rl-cx-items" aria-live="polite">
          {itemList(cart).map(([d, n]) => (
            <li key={d}>
              <span className="min-w-0 flex-1 truncate">{x.dish(d)}</span>
              <span className="rl-stepper">
                <button type="button" aria-label={t('customer.less', { dish: x.dish(d) })} onClick={() => add(d, -1)}>
                  <Minus strokeWidth={2} />
                </button>
                <span className="demo-mono">{n}</span>
                <button type="button" aria-label={t('customer.more', { dish: x.dish(d) })} onClick={() => add(d, 1)} disabled={isSoldOut(state.soldOut, d)}>
                  <Plus strokeWidth={2} />
                </button>
              </span>
              <span className="demo-mono w-[4.6em] text-right">{x.cash(x.price(d) * n)}</span>
            </li>
          ))}
          <li className="rl-cx-total">
            <span className="flex-1">{t('customer.total')}</span>
            <span className="demo-mono">{x.cash(total)}</span>
          </li>
        </ul>
        <p className="rl-rubric">{t('customer.cart.how')}</p>
        <div className="rl-cx-modes" role="group" aria-label={t('customer.cart.how')}>
          {(['delivery', 'pickup'] as const).map((m) => {
            const Icon = m === 'delivery' ? Bike : ShoppingBag;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                data-tap={tap === `mode-${m}` ? '' : undefined}
                onClick={() => {
                  takeOver();
                  setMode(m);
                  sound('select');
                }}
              >
                <Icon aria-hidden strokeWidth={1.7} />
                <span>{t(`customer.cart.${m}`)}</span>
                <span className="demo-mono text-[0.86em] opacity-80">{t(`customer.cart.${m}Eta`)}</span>
              </button>
            );
          })}
        </div>
        <p className="rl-cx-note">{t('customer.cart.direct')}</p>
        <Button
          className="rl-cx-confirm"
          data-tap={tap === 'confirm' ? '' : undefined}
          disabled={!count}
          onClick={() => {
            store.update(act.order(cart, mode));
            store.engage(16_000);
            setOrderIndex(state.orders.length);
            setCart({});
            setScreen('status');
            sound('success');
          }}
        >
          {t('customer.cart.confirm', { total: x.cash(total) })}
        </Button>
      </div>
    );
  } else if (screen === 'book' || screen === 'booked') {
    const table = bestTable(view, people);
    body =
      screen === 'booked' && myBooking ? (
        <div className="rl-cx-booked demo-pop">
          <CalendarCheck aria-hidden className="rl-cx-booked-icon" strokeWidth={1.4} />
          <h3 className="rl-cx-h demo-display">{t('customer.book.doneTitle')}</h3>
          <p className="rl-cx-booked-line demo-mono">
            {fmt.time(myBooking.time)} · {t('floor.people', { count: myBooking.people })} · {t('table.label', { n: myBooking.table })}
          </p>
          <p className="rl-cx-wa">
            <MessageCircle aria-hidden strokeWidth={1.8} />
            {t('customer.book.whatsapp')}
          </p>
        </div>
      ) : (
        <div className="rl-cx-book demo-view">
          <h3 className="rl-cx-h demo-display">{t('customer.book.title')}</h3>
          <p className="rl-cx-note">{t('customer.book.tonight', { day: x.weekday() })}</p>
          <p className="rl-rubric">{t('floor.form.people')}</p>
          <span className="rl-stepper rl-stepper-lg">
            <button type="button" aria-label={t('customer.book.fewer')} disabled={people <= 1} onClick={() => (setPeople((p) => Math.max(1, p - 1)), sound('select'))}>
              <Minus strokeWidth={2} />
            </button>
            <span className="demo-mono" aria-live="polite">
              {t('floor.people', { count: people })}
            </span>
            <button type="button" aria-label={t('customer.book.more')} disabled={people >= 6} onClick={() => (setPeople((p) => Math.min(6, p + 1)), sound('select'))}>
              <Plus strokeWidth={2} />
            </button>
          </span>
          <p className="rl-rubric">{t('floor.form.time')}</p>
          <div className="rl-chips" role="group" aria-label={t('floor.form.time')}>
            {BOOK_TIMES.map((m) => (
              <button key={m} type="button" className="rl-chip demo-mono" aria-pressed={time === m} onClick={() => (setTime(m), sound('select'))}>
                {fmt.time(m)}
              </button>
            ))}
          </div>
          <p className="rl-cx-note">{table ? t('customer.book.table', { n: table.id }) : t('customer.book.full')}</p>
          <Button
            icon={CalendarCheck}
            disabled={!table}
            onClick={() => {
              if (!table) return;
              store.update(act.book({ table: table.id, time, people, via: 'web' }));
              store.engage();
              setScreen('booked');
              sound('success');
            }}
          >
            {t('customer.book.confirm')}
          </Button>
        </div>
      );
  } else {
    body = (
      <div className="rl-cx-menu">
        <p className="rl-cx-hello demo-display">{t('customer.menu.hello')}</p>
        {CATEGORIES.map((cat) => (
          <section key={cat} className="rl-cx-cat">
            <h3 className="rl-carta-h">{t(`cats.${cat}`)}</h3>
            {MENU.filter((d) => d.cat === cat).map((d) => {
              const off = isSoldOut(state.soldOut, d.id);
              const n = cart[d.id] ?? 0;
              return (
                <div key={d.id} className="rl-cx-dish" data-off={off ? '' : undefined}>
                  <div className="min-w-0 flex-1">
                    <p className="rl-line-row">
                      <span className="rl-line-name">{x.dish(d.id)}</span>
                      {dishById(d.id).gf ? <Wheat role="img" aria-label={t('menu.gf')} className="rl-line-tag" data-tone="olive" strokeWidth={1.8} /> : null}
                      <span aria-hidden className="rl-leader" />
                      <span className="rl-line-price demo-mono">{off ? t('menu.out') : x.cash(x.price(d.id))}</span>
                    </p>
                    <p className="rl-line-desc">{t(`dishes.${d.id}.desc`)}</p>
                  </div>
                  <button
                    type="button"
                    className="rl-cx-add"
                    disabled={off}
                    data-tap={tap === `add-${d.id}` ? '' : undefined}
                    data-count={n || undefined}
                    aria-label={t('customer.add', { dish: x.dish(d.id) })}
                    onClick={() => add(d.id, 1)}
                  >
                    {n ? <span className="demo-mono">{n}</span> : <Plus strokeWidth={2} />}
                  </button>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="rl-cx" data-screen={screen}>
      {header}
      <div className="rl-cx-body demo-scroll" onPointerDown={takeOver}>
        {body}
      </div>
      {screen === 'menu' && count ? (
        <button
          type="button"
          className="rl-cx-cartbar demo-pop"
          data-tap={tap === 'cartbar' ? '' : undefined}
          onClick={() => {
            takeOver();
            setScreen('cart');
            sound('open');
          }}
        >
          <span className="rl-cx-cartbar-n demo-mono">{count}</span>
          <span className="flex-1 text-left">{t('customer.viewCart')}</span>
          <span className="demo-mono">{x.cash(total)}</span>
        </button>
      ) : null}
      {push && ticket ? (
        <div className="rl-cx-push">
          <PushBanner
            app={t('customer.push.app')}
            icon={
              <span className="rl-cx-push-icon">
                <MessageCircle strokeWidth={2} />
              </span>
            }
            time={t('customer.push.now')}
            title={business}
            body={t(mode === 'delivery' ? 'customer.push.out' : 'customer.push.ready', { num: ticket.num, time: ticket.eta !== undefined ? fmt.time(ticket.eta) : '' })}
          />
        </div>
      ) : null}
    </div>
  );
}
