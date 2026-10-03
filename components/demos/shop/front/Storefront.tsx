'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Award, LayoutDashboard, MessageCircleMore, Package, ShoppingBag, Store, X } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { ChatPeek, ChatWidget, DemoBadge, PushBanner, runChat, type ChatRun } from '../../kit';
import { COUPON, MINE_RECOVERY_MS, STORY, type ProductId } from '../data';
import { act, steeredPicks, stepLine, type InesPhase } from '../story';
import { useShop } from '../context';
import { useShopScripts } from '../scripts';
import { BrumaMark, useShopText } from '../ui';
import { FrontProvider, useFront, useWallElapsed, type FrontApi, type FrontScreen, type FrontSheet, type FrontUi } from './context';
import { Catalog, ProductPage } from './Catalog';
import { CartSheet, Checkout, OrderDone } from './Checkout';
import { ClubPage } from './Club';
import { LockScreen, WhatsAppScreen } from './Lock';

const START: FrontUi = { screen: 'catalog', product: 'cerrado', size: 's250', grind: 'beans', sheet: null, cat: 'all', pay: 'card', delivery: 'home' };

const PHASE_SCREEN: Record<InesPhase, { screen: FrontScreen; sheet: FrontSheet }> = {
  catalog: { screen: 'catalog', sheet: null },
  chat: { screen: 'catalog', sheet: 'chat' },
  cart: { screen: 'catalog', sheet: 'cart' },
  checkout: { screen: 'checkout', sheet: null },
  locked: { screen: 'lock', sheet: null },
  whatsapp: { screen: 'whatsapp', sheet: null },
  checkout2: { screen: 'checkout', sheet: null },
  paying: { screen: 'checkout', sheet: null },
  paid: { screen: 'order', sheet: null },
};

/** Plays the soft "bubble" sound when a new bot message lands in a visible chat. */
function useBubbleSound(run: ChatRun | null, enabled: boolean) {
  const { play } = useSound();
  const seen = useRef<number | null>(null);
  const count = run?.items.filter((i) => i.from === 'bot').length ?? 0;
  useEffect(() => {
    const first = seen.current === null;
    const grew = !first && count > (seen.current ?? 0);
    seen.current = count;
    if (grew && enabled) play('type', { volume: 0.6 });
  }, [count, enabled, play]);
}

/**
 * The customer's side: Bruma's online store.
 * - phone: plays Inés's evening (bot → cart → checkout → leaves → WhatsApp → pays) until
 *   the visitor touches it; then it's their own session (cart, bot, recovery, order).
 * - desktop: the same store in a browser (the owner's "Store" view), always the visitor's.
 */
export function Storefront({ variant, onPanel, homeIndicator = false }: { variant: 'phone' | 'desktop'; onPanel?: () => void; homeIndicator?: boolean }) {
  const { view, state, store, active, reduced, announce } = useShop();
  const scripts = useShopScripts();
  const { play } = useSound();
  const { person } = useShopText();
  const story = variant === 'phone' && !state.manual;
  const [ui, setUi] = useState<FrontUi>(START);
  const [leftAt, setLeftAt] = useState<number | null>(null);
  const [orderKey, setOrderKey] = useState<string | null>(null);

  const ines = view.ines;
  const phase = ines.phase;
  const storyUi: FrontUi = { ...START, ...PHASE_SCREEN[phase], product: ines.pick?.product ?? 'cerrado' };
  const shown = story ? storyUi : ui;

  /* What's in the cart ---------------------------------------------------- */
  const lines = story ? (phase === 'paid' ? [] : ines.lines) : state.mine.lines;
  const coupon = story ? phase === 'checkout2' || phase === 'paying' || phase === 'paid' : state.mine.coupon;

  /* Chats ------------------------------------------------------------------ */
  const mineChatAt = useWallElapsed(state.mine.chat?.start ?? null, active);
  const mineChat = state.mine.chat ? runChat(scripts.botMine, mineChatAt, state.mine.chat.picks, { instant: reduced }) : null;
  const chat: ChatRun | null = story ? (view.t >= STORY.chatStart ? ines.chat : null) : mineChat;

  const ab = state.mine.abandoned;
  const mineWaAt = useWallElapsed(ab?.sent ? ab.wall : null, active);
  const mineWa = ab?.sent ? runChat(scripts.wa(null, state.mine.lines, false), mineWaAt, state.mine.waPicks, { instant: reduced }) : null;
  const inesWaScript = scripts.wa(person('ines'), ines.lines, true);
  const inesWa =
    story && ines.sent && ines.pushAt !== null && view.t >= ines.pushAt ? runChat(inesWaScript, view.t - ines.pushAt, steeredPicks(inesWaScript, state.wa), { instant: reduced }) : null;
  const wa = story ? inesWa : mineWa;

  const sounds = active && (announce || variant === 'phone');
  useBubbleSound(shown.sheet === 'chat' || (story && phase === 'catalog') ? chat : null, sounds);
  useBubbleSound(shown.screen === 'whatsapp' ? wa : null, sounds);

  /* The visitor leaves a full cart → their own recovery (real time) ---------- */
  useEffect(() => {
    if (leftAt === null || story || ab || !state.mine.lines.length || !active) return;
    const id = window.setTimeout(
      () => {
        store.update(act.mineAbandon(Date.now()));
        setLeftAt(null);
      },
      Math.max(0, leftAt + MINE_RECOVERY_MS - Date.now()),
    );
    return () => window.clearTimeout(id);
  }, [leftAt, story, ab, state.mine.lines.length, active, store]);

  /* Actions ---------------------------------------------------------------- */
  const inCart = (u: FrontUi) => u.sheet === 'cart' || u.screen === 'checkout';
  const change: FrontApi['act'] = (fn, sound = 'select') => {
    let base = ui;
    if (story) {
      // The visitor takes over Inés's phone: their session starts where she was (and with her cart).
      store.update(act.takeOver(ines.lines));
      const safe = shown.screen === 'lock' || shown.screen === 'whatsapp' || shown.screen === 'order' ? 'catalog' : shown.screen;
      base = { ...shown, screen: safe, sheet: shown.sheet === 'chat' ? null : shown.sheet };
    }
    const next = { ...base, ...fn(base) };
    setUi(next);
    const seeded = story ? ines.lines.length : state.mine.lines.length;
    if (inCart(base) && !inCart(next) && seeded && next.screen !== 'order') setLeftAt(Date.now());
    if (inCart(next)) setLeftAt(null);
    store.engage();
    if (sound && active) play(sound);
  };

  const apiRef: FrontApi = {
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
      setOrderKey(`mine-${state.mine.orders.length}`);
      setUi((u) => ({ ...u, screen: 'order', sheet: null }));
      setLeftAt(null);
      if (active) play('success');
    },
    pickChat: (step, reply) => {
      if (story) {
        store.update(act.pickBot(step, reply));
        store.engage();
        if (active) play('select');
        return;
      }
      const wall = Date.now();
      store.update(act.mineChatPick(step, reply, wall));
      const line = reply === 'add' ? stepLine(step) : null;
      if (line) store.update(act.mineAdd(line));
      store.engage();
      if (active) play(line ? 'success' : 'select', line ? { volume: 0.5 } : undefined);
    },
    openChat: () => {
      change(() => ({ sheet: 'chat' }), 'open');
      if (!state.mine.chat) store.update(act.mineChat(Date.now()));
    },
    onPanel,
  };

  const pickWa = (step: string, reply: string) => {
    if (story && ines.pushAt !== null) {
      store.update(act.pickWa(step, reply, ines.pushAt));
      store.engage();
      if (active) play('select');
      return;
    }
    store.update(act.mineWaPick(step, reply, Date.now()));
    if (reply === 'back') change(() => ({ screen: 'checkout', sheet: null }), 'open');
    else {
      store.engage();
      if (active) play('select');
    }
  };

  const minePush = !story && variant === 'phone' && ab?.sent && !state.mine.waOpened && shown.screen !== 'whatsapp';
  const desktopNotice = variant === 'desktop' && ab?.sent && !state.mine.coupon;
  const full = shown.screen === 'lock' || shown.screen === 'whatsapp';

  return (
    <FrontProvider value={apiRef}>
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
        {desktopNotice ? (
          <DesktopRecovery
            onBack={() => {
              store.update(act.mineWaPick('msg', 'back', Date.now()));
              change(() => ({ screen: 'checkout', sheet: null }), 'open');
            }}
          />
        ) : null}
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

/** Which control Inés is touching (a tap ring in story mode). */
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
          <button type="button" onClick={() => f.act(() => ({ screen: 'catalog', cat: 'coffee', sheet: null }))}>
            {t('cats.coffee')}
          </button>
          <button type="button" onClick={() => f.act(() => ({ screen: 'catalog', cat: 'gear', sheet: null }))}>
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
          announce={announce}
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
  // Story: the greeting peeks out before Inés opens the chat.
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
    <button type="button" className={`sf-launcher ${f.tap === 'launcher' ? 'sf-tap' : ''}`} onClick={f.openChat} aria-label={t('open')}>
      <MessageCircleMore aria-hidden strokeWidth={1.8} />
      {f.variant === 'desktop' ? <span>{t('ask')}</span> : null}
    </button>
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
      time={t('lock.now')}
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
