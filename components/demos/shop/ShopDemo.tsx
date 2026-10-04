'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Award, LayoutDashboard, MessageCircleQuestion, Package, ShoppingCart, Store } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById } from '@/lib/content';
import { AppShell, upperFirst, usePairedStore, useStory, type NavItem, type ShellLayout } from '../kit';
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
 * Shell variant: a shop owner's app, playful and product-first — no sidebar, the content uses the
 * full width and the sections sit in a floating pill dock at the bottom (desktop); on the phone a
 * classic shopping-app tab bar, with the store one tap away in the app bar.
 */
const LAYOUT: ShellLayout = { nav: 'dock', density: 'regular', icons: 'line' };

/**
 * Bruma Tostadores (vertical "tiendas", specialty coffee sold online).
 * - laptop: the owner's panel: today's sales and shelf, the fulfillment board (advance orders),
 *   abandoned carts + WhatsApp recovery, the site bot, Club Bruma, and the store in a browser
 *   (catalog → product → cart → checkout, all local).
 * - phone next to the laptop: the CUSTOMER's phone — Inés's evening plays on it beat by beat;
 *   touching it turns it into the visitor's own session until the next beat.
 * - phone alone: the owner's app, with the store one tap away ("Tienda").
 * Nothing plays on its own: the visitor plays five beats from the SimBar (see story.ts).
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
  const view = useMemo(() => deriveShop(snap.state, snap.t, scripts.bot, scripts.waShape), [snap.state, snap.t, scripts]);

  const [tab, setTab] = useState<ShopTab>('today');
  const [storeOpen, setStoreOpen] = useState(false);
  const customerPhone = screen === 'phone' && paired;
  const announce = screen === 'laptop' || !paired;
  const playing = !!snap.playing;
  const segFrom = snap.segment?.from ?? null;

  const newOrders = view.orders.filter((o) => o.stage === 'new').length;
  const nav: NavItem[] = [
    { id: 'today', label: t('nav.today'), icon: LayoutDashboard },
    { id: 'orders', label: t('nav.orders'), icon: Package, badge: newOrders || undefined, tour: 'orders' },
    { id: 'carts', label: t('nav.carts'), icon: ShoppingCart, tour: 'recovery' },
    { id: 'chat', label: t(screen === 'phone' ? 'nav.chatShort' : 'nav.chat'), icon: MessageCircleQuestion, tour: 'bot' },
    { id: 'club', label: t('nav.club'), icon: Award, tour: 'club' },
    ...(screen === 'laptop' ? [{ id: 'site', label: t('nav.site'), icon: Store, tour: 'store' }] : []),
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
    playing,
    recent: (at, ms = 2600) => playing && segFrom !== null && at != null && at > segFrom && snap.t - at < ms,
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
  const sim = {
    store,
    label: (id: string) => t(!view.recoveryOn && (id === 'recovery' || id === 'paid') ? `sim.off.${id}` : `sim.${id}`),
    note: t('sim.note'),
    tour: 'sim',
    announce,
  };

  if (customerPhone) {
    return (
      <ShopProvider value={ctx}>
        <AppShell screen="phone" chrome="bare" theme={SHOP_THEME} business={business} logo={<BrumaMark />} active={active} rootRef={ref} statusTime={clock} sim={sim}>
          <Storefront key={snap.loop} variant="phone" />
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
          <span aria-hidden className="shop-toppill-dot" />
          {t('top.open')}
        </span>
        <button type="button" className="shop-topbtn" onClick={() => setTab('site')}>
          <Store aria-hidden strokeWidth={1.8} />
          {t('top.store')}
        </button>
      </>
    ) : (
      <button type="button" className="shop-topbtn" onClick={ctx.openStore} aria-haspopup="dialog" data-tour="store">
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
        layout={LAYOUT}
        phoneNav="tabs"
        maxTabs={5}
        active={active}
        rootRef={ref}
        statusTime={clock}
        sim={sim}
        overlay={screen === 'phone' ? <Storefront key={snap.loop} variant="phone" onPanel={ctx.closeStore} homeIndicator /> : undefined}
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

