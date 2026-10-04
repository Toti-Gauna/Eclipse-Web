'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { ArrowLeft, Bike, CalendarCheck, Check, MessageCircle, Minus, Plus, ShoppingBag, UtensilsCrossed, Wheat } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { BrandName, Button, PushBanner } from '../../kit';
import { CATEGORIES, MENU, QR_TABLE, SITE_URL, STAGES, TODAY, dishById, isOpenDay, itemCount, itemList, type DishId, type Items } from '../data';
import { act, bestTable, bookTimes, bookableTables, dayTables, isSoldOut, type OrderMode, type Ticket } from '../story';
import { weekdayOf } from '../../kit';
import { useRestaurant } from '../context';
import { useRestaurantText } from '../text';
import { LuceroMark } from '../ui';

type Screen = 'menu' | 'cart' | 'status' | 'book' | 'booked';

const MODES: OrderMode[] = ['table', 'delivery', 'pickup'];
const MODE_ICON = { table: UtensilsCrossed, delivery: Bike, pickup: ShoppingBag } as const;

/** Customer status steps; the last one depends on how they ordered. */
function lastStep(mode: OrderMode) {
  return mode === 'delivery' ? 'out' : mode === 'pickup' ? 'picked' : 'served';
}

/**
 * The visitor's order as the customer follows it: a receipt with a 4-step rail. It moves when
 * the kitchen display moves the ticket (the visitor does that on the staff side).
 */
function OrderStatus({ ticket, mode, onAgain }: { ticket: Ticket | null; mode: OrderMode; onAgain: () => void }) {
  const x = useRestaurantText();
  const { t, fmt } = x;
  if (!ticket) return null;
  const step = STAGES.indexOf(ticket.stage);
  const steps = ['received', 'cooking', 'ready', lastStep(mode)] as const;
  return (
    <div className="rl-cx-status demo-pop">
      <div className="rl-cx-receipt">
        <p className="rl-rubric">{t('customer.status.title')}</p>
        <p className="rl-cx-num demo-mono">#{ticket.num}</p>
        {mode === 'table' ? (
          <p className="rl-cx-eta">
            <span>{t('customer.status.atTable', { n: QR_TABLE })}</span>
          </p>
        ) : (
          <p className="rl-cx-eta">
            <span>{t(mode === 'delivery' ? 'customer.status.arrives' : 'customer.status.ready')}</span>
            <span className="demo-mono">{ticket.eta !== undefined ? fmt.time(ticket.eta) : ''}</span>
          </p>
        )}
        {mode === 'delivery' ? (
          <div className="rl-cx-route">
            <span className="rl-cx-route-end">{t('customer.status.route.from')}</span>
            <span className="rl-cx-route-track" aria-hidden>
              <span className="rl-cx-route-rider" data-wait={ticket.stage === 'out' ? undefined : ''} data-out={ticket.stage === 'out' ? '' : undefined}>
                <Bike strokeWidth={1.8} />
              </span>
            </span>
            <span className="rl-cx-route-end">{t('customer.status.route.to')}</span>
            <p className="rl-cx-route-note">
              {ticket.stage === 'out' ? t('customer.status.route.rider', { name: t('people.rider.name') }) : t('customer.status.route.riderWait')}
            </p>
          </div>
        ) : null}
        <ol className="rl-cx-steps" aria-label={t('customer.status.progress')}>
          {steps.map((s, i) => (
            <li key={s} data-done={i < step || (i === step && i === steps.length - 1) ? '' : undefined} data-now={i === step ? '' : undefined} aria-current={i === step ? 'step' : undefined}>
              <span aria-hidden className="rl-cx-step-dot">
                {i < step || (i === step && i === steps.length - 1) ? <Check strokeWidth={2.6} /> : null}
              </span>
              <span>{t(`customer.status.steps.${s}`)}</span>
            </li>
          ))}
        </ol>
        <p className="sr-only" aria-live="polite">
          {t('customer.status.now', { step: t(`customer.status.steps.${steps[step]}`) })}
        </p>
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
        {ticket.note ? <p className="rl-cx-notes">«{ticket.note}»</p> : null}
        <p className="rl-cx-wa">
          <MessageCircle aria-hidden strokeWidth={1.8} />
          {t('customer.status.whatsapp')}
        </p>
        <p className="rl-cx-hint">{t('customer.status.kitchenHint')}</p>
      </div>
      <button type="button" className="rl-linkbtn self-center" onClick={onAgain}>
        {t('customer.status.again')}
      </button>
    </div>
  );
}

/**
 * A push when the visitor's order changes stage (they moved it on the kitchen display).
 * Transient and local: it starts from that change and leaves after 4 s.
 */
function usePush(ticket: Ticket | null) {
  const key = ticket ? `${ticket.id}:${ticket.stage}` : null;
  const [prev, setPrev] = useState(key);
  const [push, setPush] = useState<{ key: string; ticket: Ticket } | null>(null);
  if (prev !== key) {
    setPrev(key);
    const sameTicket = prev && ticket && prev.split(':')[0] === ticket.id;
    setPush(sameTicket && (ticket.stage === 'ready' || ticket.stage === 'out') ? { key: key!, ticket } : null);
  }
  useEffect(() => {
    if (!push) return;
    const id = window.setTimeout(() => setPush(null), 4000);
    return () => window.clearTimeout(id);
  }, [push]);
  return push?.ticket ?? null;
}

/**
 * What a customer sees (QR on the table / the bodegón's site): the carta with prices and stock →
 * their order (quantities, a note, how they want it) → its status, or book a table on one of the
 * next nights. Nothing plays on its own; what they do lands on the staff side (kitchen display,
 * floor plan). `onClose`: opened from the staff app (phone). `embedded`: inside the laptop's frame.
 */
export function CustomerApp({ onClose }: { onClose?: () => void }) {
  const { view, state, store, active, business } = useRestaurant();
  const x = useRestaurantText();
  const { t, fmt } = x;
  const { play } = useSound();
  const noteId = useId();

  const [screenState, setScreen] = useState<Screen>('menu');
  const [cart, setCart] = useState<Items>({});
  const [mode, setMode] = useState<OrderMode>('table');
  const [note, setNote] = useState('');
  const [people, setPeople] = useState(2);
  const [bookDay, setBookDay] = useState(TODAY);
  const [time, setTime] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [bookedKey, setBookedKey] = useState<string | null>(null);

  const myOrder = orderId ? (state.orders.find((o) => o.id === orderId) ?? null) : null;
  const ticket = myOrder ? (view.tickets.find((tk) => tk.mine === myOrder.id) ?? null) : null;
  const myBooking = bookedKey ? (state.bookings.find((b) => `${b.day}-${b.table}` === bookedKey) ?? null) : null;
  const screen: Screen = screenState === 'status' && !ticket ? 'menu' : screenState === 'booked' && !myBooking ? 'book' : screenState;
  const push = usePush(ticket);

  const sound = (name: 'select' | 'success' | 'open' | 'close') => {
    if (active) play(name);
  };
  const add = (dish: DishId, delta: number) => {
    setCart((c) => {
      const n = Math.max(0, (c[dish] ?? 0) + delta);
      const next = { ...c, [dish]: n };
      if (!n) delete next[dish];
      return next;
    });
    sound('select');
  };
  const count = itemCount(cart);
  const total = x.sum(cart);

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
              setScreen(k === 'book' ? (myBooking ? 'booked' : 'book') : ticket ? 'status' : 'menu');
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
        mode={myOrder?.mode ?? 'table'}
        onAgain={() => {
          setOrderId(null);
          setScreen('menu');
          sound('select');
        }}
      />
    );
  } else if (screen === 'cart') {
    body = (
      <div className="rl-cx-cart demo-view">
        <button type="button" className="rl-cx-back" onClick={() => setScreen('menu')}>
          <ArrowLeft aria-hidden strokeWidth={2} />
          {t('customer.backToMenu')}
        </button>
        <h3 className="rl-cx-h demo-display">{t('customer.cart.title')}</h3>
        <ul className="rl-cx-items">
          {itemList(cart).map(([d, n]) => (
            <li key={d}>
              <span className="min-w-0 flex-1 truncate">{x.dish(d)}</span>
              <span className="rl-stepper">
                <button type="button" aria-label={t('customer.less', { dish: x.dish(d) })} onClick={() => add(d, -1)}>
                  <Minus strokeWidth={2} />
                </button>
                <span className="demo-mono" aria-live="polite">
                  {n}
                </span>
                <button type="button" aria-label={t('customer.more', { dish: x.dish(d) })} onClick={() => add(d, 1)} disabled={isSoldOut(state.soldOut, d) || n >= 9}>
                  <Plus strokeWidth={2} />
                </button>
              </span>
              <span className="demo-mono w-[4.6em] text-right">{x.cash(x.price(d) * n)}</span>
            </li>
          ))}
          <li className="rl-cx-total">
            <span className="flex-1">{t('customer.total')}</span>
            <span className="demo-mono" aria-live="polite">
              {x.cash(total)}
            </span>
          </li>
        </ul>
        <label className="rl-cx-notefield" htmlFor={noteId}>
          <span className="rl-rubric">{t('customer.cart.note')}</span>
          <input id={noteId} type="text" value={note} maxLength={60} placeholder={t('customer.cart.notePlaceholder')} onChange={(e) => setNote(e.target.value)} autoComplete="off" />
        </label>
        <p className="rl-rubric">{t('customer.cart.how')}</p>
        <div className="rl-cx-modes" role="group" aria-label={t('customer.cart.how')}>
          {MODES.map((m) => {
            const Icon = MODE_ICON[m];
            return (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m);
                  sound('select');
                }}
              >
                <Icon aria-hidden strokeWidth={1.7} />
                <span>{t(`customer.cart.${m}`, { n: QR_TABLE })}</span>
                <span className="demo-mono text-[0.86em] opacity-80">{t(`customer.cart.${m}Eta`)}</span>
              </button>
            );
          })}
        </div>
        <p className="rl-cx-note">{t(mode === 'table' ? 'customer.cart.qr' : 'customer.cart.direct')}</p>
        <Button
          className="rl-cx-confirm"
          disabled={!count}
          onClick={() => {
            const id = `you-${state.orders.length + 1}`;
            store.update(act.order(cart, mode, note));
            setOrderId(id);
            setCart({});
            setNote('');
            setScreen('status');
            sound('success');
          }}
        >
          {t('customer.cart.confirm', { total: x.cash(total) })}
        </Button>
        <p className="rl-cx-fine">{t('customer.cart.demo')}</p>
      </div>
    );
  } else if (screen === 'booked' && myBooking) {
    body = (
      <div className="rl-cx-booked demo-pop" role="status">
        <CalendarCheck aria-hidden className="rl-cx-booked-icon" strokeWidth={1.4} />
        <h3 className="rl-cx-h demo-display">{t('customer.book.doneTitle')}</h3>
        <p className="rl-cx-booked-line demo-mono">
          {myBooking.day === TODAY ? t('customer.book.tonightShort') : x.dayOf(myBooking.day, 'short')} · {fmt.time(myBooking.time)} · {t('floor.people', { count: myBooking.people })} ·{' '}
          {t('table.label', { n: myBooking.table })}
        </p>
        <p className="rl-cx-wa">
          <MessageCircle aria-hidden strokeWidth={1.8} />
          {t('customer.book.whatsapp')}
        </p>
        <button
          type="button"
          className="rl-linkbtn"
          onClick={() => {
            setBookedKey(null);
            setScreen('book');
            sound('select');
          }}
        >
          {t('customer.book.again')}
        </button>
      </div>
    );
  } else if (screen === 'book' || screen === 'booked') {
    const days: number[] = [];
    for (let d = TODAY; days.length < 3 && d < TODAY + 7; d++) if (isOpenDay(weekdayOf(d))) days.push(d);
    const times = bookTimes(bookDay, view);
    const chosen = time !== null && times.includes(time) ? time : (times[0] ?? null);
    const table = bestTable(bookableTables(bookDay, dayTables(bookDay, state, view), view), people);
    body = (
      <div className="rl-cx-book demo-view">
        <h3 className="rl-cx-h demo-display">{t('customer.book.title')}</h3>
        <p className="rl-rubric">{t('customer.book.when')}</p>
        <div className="rl-chips" role="group" aria-label={t('customer.book.when')}>
          {days.map((d) => (
            <button key={d} type="button" className="rl-chip" aria-pressed={bookDay === d} onClick={() => (setBookDay(d), sound('select'))}>
              {d === TODAY ? t('customer.book.tonightShort') : x.dayOf(d, 'short')}
            </button>
          ))}
        </div>
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
        {times.length ? (
          <div className="rl-chips" role="group" aria-label={t('floor.form.time')}>
            {times.map((m) => (
              <button key={m} type="button" className="rl-chip demo-mono" aria-pressed={chosen === m} onClick={() => (setTime(m), sound('select'))}>
                {fmt.time(m)}
              </button>
            ))}
          </div>
        ) : (
          <p className="rl-cx-note">{t('customer.book.late')}</p>
        )}
        <p className="rl-cx-note" aria-live="polite">
          {table ? t('customer.book.table', { n: table.id }) : t('customer.book.full')}
        </p>
        <Button
          icon={CalendarCheck}
          disabled={!table || chosen === null}
          onClick={() => {
            if (!table || chosen === null) return;
            store.update(act.book({ day: bookDay, table: table.id, time: chosen, people, via: 'web' }));
            setBookedKey(`${bookDay}-${table.id}`);
            setScreen('booked');
            sound('success');
          }}
        >
          {t('customer.book.confirm')}
        </Button>
        <p className="rl-cx-fine">{t('customer.cart.demo')}</p>
      </div>
    );
  } else {
    body = (
      <div className="rl-cx-menu" data-tour="order">
        <p className="rl-cx-hello demo-display">{t('customer.menu.hello')}</p>
        <p className="rl-cx-qr demo-mono">{t('customer.menu.qr', { n: QR_TABLE })}</p>
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
                    disabled={off || n >= 9}
                    data-count={n || undefined}
                    aria-label={n ? t('customer.addMore', { dish: x.dish(d.id), count: n }) : t('customer.add', { dish: x.dish(d.id) })}
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
      <div className="rl-cx-body demo-scroll">{body}</div>
      {screen === 'menu' && count ? (
        <button
          type="button"
          className="rl-cx-cartbar demo-pop"
          onClick={() => {
            setScreen('cart');
            sound('open');
          }}
        >
          <span className="rl-cx-cartbar-n demo-mono">{count}</span>
          <span className="flex-1 text-left">{t('customer.viewCart')}</span>
          <span className="demo-mono">{x.cash(total)}</span>
        </button>
      ) : null}
      {push ? (
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
            body={t(push.stage === 'ready' ? (push.channel === 'pickup' ? 'customer.push.ready' : 'customer.push.readySalon') : push.channel === 'delivery' ? 'customer.push.out' : push.channel === 'pickup' ? 'customer.push.picked' : 'customer.push.served', {
              num: push.num,
              time: push.eta !== undefined ? fmt.time(push.eta) : '',
            })}
          />
        </div>
      ) : null}
    </div>
  );
}
