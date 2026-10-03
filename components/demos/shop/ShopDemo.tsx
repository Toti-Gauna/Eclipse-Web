'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Award, LayoutDashboard, MessageCircleQuestion, Package, ShoppingCart, Store } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, LiveDot, upperFirst, usePairedStore, useStory, type NavItem } from '../kit';
import type { DemoProps } from '../types';
import { SHOP_THEME } from './data';
import { createShopStore, deriveShop } from './story';
import { ShopProvider, type ShopCtx, type ShopTab } from './context';
import { useShopScripts } from './scripts';
import { Announcer, BrumaMark, useShopText } from './ui';
import { Storefront } from './front/Storefront';
import { LaptopToday, PhoneToday, ShopToasts } from './views/Today';
import { LaptopOrders, PhoneOrders } from './views/Orders';
import { LaptopCarts, PhoneCarts } from './views/Carts';
import { LaptopClub, PhoneClub } from './views/Club';
import { LaptopChat, PhoneChat } from './views/Chat';
import { LaptopSite } from './views/Site';
import './shop.css';

const VIEWS: Record<ShopTab, Record<DemoProps['screen'], () => ReactNode>> = {
  today: { phone: PhoneToday, laptop: LaptopToday },
  orders: { phone: PhoneOrders, laptop: LaptopOrders },
  carts: { phone: PhoneCarts, laptop: LaptopCarts },
  club: { phone: PhoneClub, laptop: LaptopClub },
  chat: { phone: PhoneChat, laptop: LaptopChat },
  site: { phone: PhoneToday, laptop: LaptopSite },
};

/**
 * Bruma Tostadores (vertical "tiendas", specialty coffee sold online).
 * - laptop: the owner's panel (collapsible sidebar): today's sales and shelf, the
 *   fulfillment board, abandoned carts + WhatsApp recovery, Club Bruma, the site bot,
 *   and the live store in a browser.
 * - phone next to the laptop: the CUSTOMER's phone — Inés's evening plays on it.
 * - phone alone: the store first (same story), with the owner's app one tap away.
 * One story (30 s loop, see story.ts) drives every screen.
 */
export default function ShopDemo({ screen, active }: DemoProps) {
  const vertical = verticalById('tiendas')!;
  const business = vertical.business ?? '';
  const ticketUsd = vertical.calculator.ticketUsd;
  const t = useTranslations('demoShop');
  const { fmt } = useShopText();
  const { play } = useSound();

  const { store, paired, ref } = usePairedStore('shop', createShopStore);
  const snap = useStory(store, active);
  const scripts = useShopScripts();
  const view = useMemo(() => deriveShop(snap.state, snap.t, snap.reduced, scripts.bot, scripts.waShape), [snap.state, snap.t, snap.reduced, scripts]);

  const [tab, setTab] = useState<ShopTab>('today');
  const [storeOpen, setStoreOpen] = useState(true);
  const customerPhone = screen === 'phone' && paired;
  const announce = screen === 'laptop' || !paired;

  // Sound: an order / a recovered cart / a level-up lands (one instance per pair, only while visible).
  const last = view.events[view.events.length - 1];
  const heard = useRef<string | null>(null);
  useEffect(() => {
    const id = last?.id ?? null;
    const first = heard.current === null;
    heard.current = id ?? '';
    if (first || !active || !announce || !last || last.at < 0) return;
    if (['order', 'recovered', 'levelup'].includes(last.kind)) play('success', { volume: last.kind === 'order' ? 0.5 : 1 });
  }, [last, active, announce, play]);

  const ines = view.ines;
  const cartLive = ['abandoned', 'sent', 'read', 'back'].includes(ines.status);
  const newOrders = view.orders.filter((o) => o.stage === 'new').length;
  const nav: NavItem[] = [
    { id: 'today', label: t('nav.today'), icon: LayoutDashboard },
    { id: 'orders', label: t('nav.orders'), icon: Package, badge: newOrders || undefined },
    { id: 'carts', label: t('nav.carts'), icon: ShoppingCart, badge: cartLive ? 'live' : undefined, group: screen === 'laptop' ? t('nav.groupAuto') : undefined },
    ...(screen === 'laptop' ? [{ id: 'chat', label: t('nav.chat'), icon: MessageCircleQuestion, badge: ines.phase === 'chat' ? ('live' as const) : undefined }] : []),
    { id: 'club', label: t('nav.club'), icon: Award, group: screen === 'laptop' ? t('nav.groupClients') : undefined },
    ...(screen === 'phone' ? [{ id: 'chat', label: t('nav.chatShort'), icon: MessageCircleQuestion, badge: ines.phase === 'chat' ? ('live' as const) : undefined }] : []),
    ...(screen === 'laptop' ? [{ id: 'site', label: t('nav.site'), icon: Store, group: t('nav.groupChannel') }] : []),
  ];

  const ctx: ShopCtx = {
    screen,
    paired,
    store,
    state: snap.state,
    view,
    t: snap.t,
    loop: snap.loop,
    reduced: snap.reduced,
    active,
    announce,
    business,
    ticketUsd,
    go: (id) => setTab(id),
    openStore: () => {
      setStoreOpen(true);
      if (active) play('open');
    },
    closeStore: () => {
      setStoreOpen(false);
      if (active) play('close');
    },
  };

  const clock = fmt.time(view.clock);

  if (customerPhone) {
    return (
      <ShopProvider value={ctx}>
        <AppShell screen="phone" chrome="bare" theme={SHOP_THEME} business={business} logo={<BrumaMark />} active={active} rootRef={ref} statusTime={clock}>
          <Storefront variant="phone" />
        </AppShell>
      </ShopProvider>
    );
  }

  const View = VIEWS[tab][screen];
  const date = upperFirst(fmt.date(new Date(Date.UTC(2026, 9, 6)), { weekday: 'long', day: 'numeric', month: 'long' }));
  const headerRight =
    screen === 'laptop' ? (
      <>
        <span className="shop-toppill">
          <LiveDot color="var(--demo-ok)" />
          {t('top.live', { count: 14 + Math.round(Math.sin(view.t / 5000) * 3) })}
        </span>
        <button type="button" className="shop-topbtn" onClick={() => setTab('site')}>
          <Store aria-hidden strokeWidth={1.8} />
          {t('top.store')}
        </button>
      </>
    ) : (
      <button type="button" className="shop-topbtn" onClick={ctx.openStore} aria-haspopup="dialog">
        <Store aria-hidden strokeWidth={1.8} />
        {t('top.store')}
      </button>
    );

  return (
    <ShopProvider value={ctx}>
      <AppShell
        screen={screen}
        theme={SHOP_THEME}
        business={business}
        logo={<BrumaMark />}
        nav={nav}
        current={tab}
        onNavigate={(id) => setTab(id as ShopTab)}
        title={
          screen === 'laptop' ? (
            <>
              <p className="shop-toptitle">{nav.find((n) => n.id === tab)?.label}</p>
              <p className="shop-topdate">
                {date} · <span className="demo-mono">{clock}</span>
              </p>
            </>
          ) : undefined
        }
        headerRight={headerRight}
        sidebarFooter={<SidebarFooter on={view.recoveryOn} />}
        active={active}
        rootRef={ref}
        statusTime={clock}
        overlay={screen === 'phone' ? <Storefront variant="phone" onPanel={ctx.closeStore} homeIndicator /> : undefined}
        overlayOpen={screen === 'phone' && storeOpen}
        overlayOrigin={['80%', '5%']}
      >
        <div className="shop" data-screen={screen}>
          <ShopToasts placement={screen === 'phone' ? 'top' : 'bottom-right'} />
          <div key={tab} className="demo-view">
            <View />
          </div>
          <Announcer />
        </div>
      </AppShell>
    </ShopProvider>
  );
}

function SidebarFooter({ on }: { on: boolean }) {
  const t = useTranslations('demoShop');
  return (
    <div className="shop-sidefoot" data-off={on ? undefined : ''}>
      <span className="shop-sidefoot-icon" aria-hidden>
        <ShoppingCart strokeWidth={1.8} />
      </span>
      <span className="min-w-0 leading-[1.25]">
        <span className="block truncate text-[0.74em] font-semibold">{t('side.title')}</span>
        <span className="shop-sidefoot-sub block truncate text-[0.64em]">{on ? t('side.on') : t('side.off')}</span>
      </span>
    </div>
  );
}
