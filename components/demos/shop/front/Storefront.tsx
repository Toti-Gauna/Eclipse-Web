'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Award, Clock3, LayoutDashboard, MessageCircleMore, Package, ShoppingBag, Store, X } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { ChatPeek, ChatWidget, DemoBadge, PushBanner, runChat, type ChatRun } from '../../kit';
import { COUPON, STORY, type ProductId } from '../data';
import { PHASE_SCREEN, act, inesWaRun, stepLine, type InesPhase } from '../story';
import { useShop } from '../context';
import { useShopScripts } from '../scripts';
import { BrumaMark, useShopText } from '../ui';
import { FrontProvider, useFront, type FrontApi, type FrontScreen, type FrontUi } from './context';
import { Catalog, ProductPage } from './Catalog';
import { CartSheet, Checkout, OrderDone } from './Checkout';
import { ClubPage } from './Club';
import { LockScreen, WhatsAppScreen } from './Lock';

const START: FrontUi = { screen: 'catalog', product: 'cerrado', size: 's250', grind: 'beans', sheet: null, cat: 'all', pay: 'card', delivery: 'home' };


/**
 * The customer's side: Bruma's online store.
 * - phone next to the laptop: Inés's evening, beat by beat (bot → cart → checkout → leaves →
 *   WhatsApp → pays). Touching the store makes it the visitor's own session until the next beat.
 * - phone alone / desktop: always the visitor's own session (cart, bot, checkout, their order).
 *   Leaving the checkout with a full cart abandons it; "Simular: 30 minutos después" sends their
 *   own recovery message (if the automation is on). Everything is local and answers at once.
 */
export function Storefront({ variant, onPanel, homeIndicator = false }: { variant: 'phone' | 'desktop'; onPanel?: () => void; homeIndicator?: boolean }) {
  const { view, state, store, active, paired } = useShop();
  const scripts = useShopScripts();
  const { play } = useSound();
  const { person } = useShopText();
  const tl = useTranslations('demoShop.front.later');
  // Inés's evening until the visitor touches the phone; the next beat takes it back (ShopDemo → act.resume).
  const story = variant === 'phone' && paired && !onPanel && state.manual === null;
  const [ui, setUi] = useState<FrontUi>(START);
  const [orderKey, setOrderKey] = useState<string | null>(null);
  /** The visitor reached the checkout in this session (leaving the cart after that abandons it). */
  const [reached, setReached] = useState(false);

  const ines = view.ines;
  const phase = ines.phase;
  const storyUi: FrontUi = { ...START, ...PHASE_SCREEN[phase], product: ines.pick?.product ?? 'cerrado' };
  const shown = story ? storyUi : ui;
  const mine = state.mine;

  /* What's in the cart ---------------------------------------------------- */
  const lines = story ? (phase === 'paid' ? [] : ines.lines) : mine.lines;
  const coupon = story ? phase === 'checkout2' || phase === 'paying' || phase === 'paid' : mine.coupon;

  /* Chats ------------------------------------------------------------------ */
  const mineChat = runChat(scripts.botMine, 0, mine.chat ?? {}, { instant: true });
  const chat: ChatRun | null = story ? (view.t >= STORY.chatStart ? ines.chat : null) : mineChat;
  const mineWa = mine.recovery?.sent ? runChat(scripts.wa(null, mine.lines, false), 0, mine.waPicks, { instant: true }) : null;
  const inesWa = story && ines.sent && ines.pushAt !== null && view.t >= ines.pushAt ? inesWaRun(scripts.wa(person('ines'), ines.lines, true), view.t - ines.pushAt, state.wa) : null;
  const wa = story ? inesWa : mineWa;

  /* Actions ---------------------------------------------------------------- */
  const change: FrontApi['act'] = (fn, sound = 'select') => {
    let base = ui;
    // A takeover starts a new session: a checkout reached before a beat took the phone back doesn't count.
    let wasReached = reached;
    if (story) {
      // The visitor takes over Inés's phone: their session starts where she was (and with her cart).
      store.update(act.takeOver(ines.lines));
      const safe = shown.screen === 'lock' || shown.screen === 'whatsapp' || shown.screen === 'order' ? 'catalog' : shown.screen;
      base = { ...shown, screen: safe, sheet: shown.sheet === 'chat' ? null : shown.sheet };
      wasReached = base.screen === 'checkout';
    }
    const next = { ...base, ...fn(base) };
    setUi(next);
    // Reaching the checkout and then leaving the cart behind (not back to it, not paying) abandons it.
    const seeded = story ? ines.lines.length : mine.lines.length;
    const inCart = next.screen === 'checkout' || next.sheet === 'cart';
    if (next.screen === 'checkout') setReached(true);
    else if (wasReached && !inCart && next.screen !== 'order') {
      setReached(false);
      if (seeded) store.update(act.mineLeave());
    } else if (wasReached !== reached) setReached(wasReached);
    if (sound && active) play(sound);
  };

  const api: FrontApi = {
    variant,
    story,
    ui: shown,
    lines,
    coupon,
    orderKey: story ? 's-ines' : orderKey,
    tap: story ? storyTap(phase, view.t, ines) : null,
    pressing: story && phase === 'paying',
    chat,
    act: change,
    add: (line, openCart = false) => {
      change(() => (openCart ? { sheet: 'cart' } : {}), null);
      store.update(act.mineAdd(line));
      if (active) play('success', { volume: 0.5 });
    },
    setQty: (index, qty) => {
      change(() => ({}), null);
      store.update(act.mineQty(index, qty));
      if (active) play('tick', { pitch: qty });
    },
    pay: () => {
      change(() => ({}), null);
      store.update(act.minePay(shown.pay));
      setOrderKey(`mine-${mine.orders.length}`);
      setUi((u) => ({ ...u, screen: 'order', sheet: null }));
      setReached(false);
      if (active) play('success');
    },
    pickChat: (step, reply) => {
      if (story) {
        store.update(act.pickBot(step, reply));
        if (active) play('select');
        return;
      }
      store.update(act.mineChatPick(step, reply));
      const line = reply === 'add' ? stepLine(step) : null;
      if (line) store.update(act.mineAdd(line));
      if (active) play(line ? 'success' : 'select', line ? { volume: 0.5 } : undefined);
    },
    openChat: () => change(() => ({ sheet: 'chat' }), 'open'),
    onPanel,
  };

  const pickWa = (step: string, reply: string) => {
    if (story && ines.pushAt !== null) {
      store.update(act.pickWa(step, reply, ines.pushAt));
      if (active) play('select');
      return;
    }
    store.update(act.mineWaPick(step, reply));
    if (reply === 'back') change(() => ({ screen: 'checkout', sheet: null }), 'open');
    else if (active) play('select');
  };
  const backToCart = () => {
    store.update(act.mineWaPick('msg', 'back'));
    change(() => ({ screen: 'checkout', sheet: null }), 'open');
  };

  const full = shown.screen === 'lock' || shown.screen === 'whatsapp';
  const own = !story;
  const pending = own && !!mine.abandoned && !mine.recovery && !!mine.lines.length;
  const minePush = own && variant === 'phone' && !!mine.recovery?.sent && !mine.waOpened && !mine.coupon && shown.screen !== 'whatsapp';
  const desktopNotice = own && variant === 'desktop' && !!mine.recovery?.sent && !mine.coupon;
  const unsent = own && mine.recovery?.sent === false && !!mine.lines.length;

  return (
    <FrontProvider value={api}>
      <div className="sf" data-variant={variant} data-screen={shown.screen} data-story={story ? '' : undefined}>
        {full ? null : <FrontHeader />}
        <div className="sf-body demo-scroll" key={`${shown.screen}-${shown.screen === 'product' ? shown.product : ''}`}>
          <div className="sf-view">{renderScreen(shown.screen)}</div>
        </div>
        {shown.screen === 'lock' ? <LockScreen /> : null}
        {shown.screen === 'whatsapp' && wa ? <WhatsAppScreen run={wa} onPick={pickWa} onBack={story ? undefined : () => change(() => ({ screen: 'catalog' }), 'close')} /> : null}
        {!full && variant === 'phone' && shown.screen !== 'checkout' ? <FrontNav /> : null}
        {!full ? <ChatDock /> : null}
        {shown.sheet === 'cart' ? <CartSheet /> : null}
        {pending && !full ? (
          <div className="sf-later" role="group" aria-label={tl('label')}>
            <LaterBar
              onSimulate={() => {
                store.update(act.mineRecover());
                if (active) play('select');
              }}
            />
          </div>
        ) : null}
        {unsent && !full ? <UnsentNote /> : null}
        {minePush ? (
          <div className="sf-push">
            <MinePush
              onOpen={() => {
                store.update(act.mineWaOpen());
                change(() => ({ screen: 'whatsapp', sheet: null }), 'open');
              }}
            />
          </div>
        ) : null}
        {desktopNotice ? <DesktopRecovery onBack={backToCart} /> : null}
        {homeIndicator && !full ? <span aria-hidden className="demo-home-indicator" /> : null}
      </div>
    </FrontProvider>
  );
}

function renderScreen(screen: FrontScreen): ReactNode {
  switch (screen) {
    case 'product':
      return <ProductPage />;
    case 'checkout':
      return <Checkout />;
    case 'order':
      return <OrderDone />;
    case 'club':
      return <ClubPage />;
    case 'lock':
    case 'whatsapp':
      return null;
    default:
      return <Catalog />;
  }
}

/** Which control Inés is touching (a tap ring, only inside the beat that plays it). */
function storyTap(phase: InesPhase, t: number, ines: { addAt: number | null; backAt: number | null }): string | null {
  const near = (at: number | null, ms = 650) => at !== null && t >= at && t < at + ms;
  if (phase === 'chat' && t >= STORY.chatOpen - 400 && t < STORY.chatOpen + 250) return 'launcher';
  if (phase === 'cart' && ines.addAt !== null && near(ines.addAt + 1250, 500)) return 'checkout';
  if (phase === 'checkout2' && ines.backAt !== null && near(ines.backAt + 1500, 550)) return 'pay';
  return null;
}

/* ------------------------------------------------------------------ */
/* Chrome                                                               */
/* ------------------------------------------------------------------ */
function FrontHeader() {
  const f = useFront();
  const t = useTranslations('demoShop.front');
  const { business } = useShop();
  const { items } = useShopText();
  const count = items(f.lines);
  return (
    <header className="sf-head">
      <button type="button" className="sf-brand" onClick={() => f.act(() => ({ screen: 'catalog', sheet: null, cat: 'all' }), 'select')}>
        <span className="sf-brand-mark" aria-hidden>
          <BrumaMark />
        </span>
        <span className="sf-brand-name">
          {business}
          <span className="sr-only"> — Demo</span>
        </span>
        <DemoBadge />
      </button>
      {f.variant === 'desktop' ? (
        <nav className="sf-links" aria-label={t('nav.label')}>
          <button type="button" aria-pressed={f.ui.screen === 'catalog' && f.ui.cat === 'coffee'} onClick={() => f.act(() => ({ screen: 'catalog', cat: 'coffee', sheet: null }))}>
            {t('cats.coffee')}
          </button>
          <button type="button" aria-pressed={f.ui.screen === 'catalog' && f.ui.cat === 'gear'} onClick={() => f.act(() => ({ screen: 'catalog', cat: 'gear', sheet: null }))}>
            {t('cats.gear')}
          </button>
          <button type="button" aria-current={f.ui.screen === 'club' ? 'page' : undefined} onClick={() => f.act(() => ({ screen: 'club', sheet: null }))}>
            {t('nav.club')}
          </button>
        </nav>
      ) : null}
      <span className="sf-head-right">
        {f.onPanel ? (
          <button type="button" className="sf-panelbtn" onClick={f.onPanel}>
            <LayoutDashboard aria-hidden strokeWidth={1.8} />
            {t('panel')}
          </button>
        ) : null}
        <button
          type="button"
          className="sf-cartbtn"
          aria-label={t('cart.open', { count })}
          aria-expanded={f.ui.sheet === 'cart'}
          data-tour="store"
          onClick={() => f.act((u) => ({ sheet: u.sheet === 'cart' ? null : 'cart' }), f.ui.sheet === 'cart' ? 'close' : 'open')}
        >
          <ShoppingBag aria-hidden strokeWidth={1.8} />
          {count ? (
            <span key={count} className="sf-cartcount demo-mono" aria-hidden>
              {count}
            </span>
          ) : null}
        </button>
      </span>
    </header>
  );
}

/** Phone: the store's bottom nav (a floating pill). */
function FrontNav() {
  const f = useFront();
  const t = useTranslations('demoShop.front.nav');
  const items: { id: FrontScreen; icon: typeof Store; label: string }[] = [
    { id: 'catalog', icon: Store, label: t('store') },
    { id: 'club', icon: Award, label: t('club') },
    { id: 'order', icon: Package, label: t('order') },
  ];
  const current = f.ui.screen === 'product' ? 'catalog' : f.ui.screen;
  return (
    <nav className="sf-nav" aria-label={t('label')}>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <button key={it.id} type="button" aria-current={current === it.id ? 'page' : undefined} onClick={() => f.act(() => ({ screen: it.id, sheet: null }))}>
            <Icon aria-hidden strokeWidth={current === it.id ? 2 : 1.7} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** The site bot: a peek with the greeting, the launcher, or the open chat. */
function ChatDock() {
  const f = useFront();
  const t = useTranslations('demoShop.front.chat');
  const { business, announce, view } = useShop();
  const open = f.ui.sheet === 'chat';
  if (open && f.chat) {
    return (
      <div className="sf-chat" role="dialog" aria-label={t('title')}>
        <ChatWidget
          variant="widget"
          run={f.chat}
          title={t('title')}
          subtitle={t('subtitle')}
          avatar={<BrumaMark />}
          label={t('label', { business })}
          announce={announce && !f.story}
          onPick={f.pickChat}
          composer={t('composer')}
          className="sf-chat-widget"
        />
        <button type="button" className="sf-chat-close" aria-label={t('close')} onClick={() => f.act(() => ({ sheet: null }), 'close')}>
          <X aria-hidden strokeWidth={2} />
        </button>
      </div>
    );
  }
  // Story: the greeting peeks out before Inés opens the chat (inside beat 1).
  const peek = f.story && f.chat && view.t < STORY.chatOpen;
  if (peek && f.chat) {
    return (
      <ChatPeek
        run={f.chat}
        title={t('title')}
        avatar={<MessageCircleMore strokeWidth={1.8} />}
        onPick={f.pickChat}
        onOpen={f.openChat}
        openLabel={t('open')}
        className={`sf-peek ${f.tap === 'launcher' ? 'sf-tap' : ''}`}
      />
    );
  }
  return (
    <button type="button" className={`sf-launcher ${f.tap === 'launcher' ? 'sf-tap' : ''}`} onClick={f.openChat} aria-label={t('open')} data-tour="bot">
      <MessageCircleMore aria-hidden strokeWidth={1.8} />
      {f.variant === 'desktop' ? <span>{t('ask')}</span> : null}
    </button>
  );
}

/** The visitor left their checkout: they decide when "30 minutes later" happens. */
function LaterBar({ onSimulate }: { onSimulate: () => void }) {
  const t = useTranslations('demoShop.front.later');
  return (
    <div className="sf-later-bar">
      <Clock3 aria-hidden strokeWidth={1.8} />
      <span className="min-w-0 flex-1">{t('left')}</span>
      <button type="button" className="sf-later-go" onClick={onSimulate}>
        {t('simulate')}
      </button>
    </div>
  );
}

function UnsentNote() {
  const t = useTranslations('demoShop.front.later');
  return (
    <p className="sf-later sf-later-note" role="status">
      {t('unsent')}
    </p>
  );
}

function MinePush({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('demoShop.front');
  const { business } = useShop();
  return (
    <PushBanner
      app="WhatsApp"
      icon={
        <span className="sf-push-icon">
          <BrumaMark />
        </span>
      }
      time={t('lock.later')}
      title={business}
      body={t('lock.pushYou', { code: COUPON.code, pct: Math.round(COUPON.pct * 100) })}
      onOpen={onOpen}
      openLabel={t('lock.openPush')}
    />
  );
}

function DesktopRecovery({ onBack }: { onBack: () => void }) {
  const t = useTranslations('demoShop.front');
  return (
    <div className="sf-recovery" role="status">
      <span className="sf-push-icon" aria-hidden>
        <BrumaMark />
      </span>
      <p className="min-w-0 flex-1">{t('lock.desktop')}</p>
      <button type="button" className="sf-cta sf-cta-sm" onClick={onBack}>
        {t('lock.back')}
      </button>
    </div>
  );
}

export type { ProductId };
