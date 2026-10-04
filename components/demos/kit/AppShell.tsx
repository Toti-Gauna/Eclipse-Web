'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Ellipsis, Menu, PanelLeftClose, PanelLeftOpen, X, type LucideIcon } from 'lucide-react';
import { prefersReducedMotion, useReducedMotion } from '@/components/motion/useReducedMotion';
import { useSound } from '@/components/sound/SoundContext';
import { legacyTheme, themeVars, type DemoTheme } from './theme';
import { BrandName, LiveDot } from './primitives';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** A count, or 'live' for a pulsing dot (e.g. a call in progress). */
  badge?: number | 'live';
  /** Laptop sidebar: caption printed above this item (starts a group). */
  group?: string;
}
/** v1 name. */
export type DemoTab = NavItem;

export interface AppShellProps {
  screen: 'phone' | 'laptop';
  /** Palette + personality. Without it the v1 look is used with `accent`. */
  theme?: DemoTheme;
  /** v1: brand color when there is no theme. */
  accent?: string;
  /** Fictional business name, without the " — Demo" suffix. */
  business: string;
  logo: ReactNode;
  logoStyle?: 'tile' | 'plain';
  nav?: NavItem[];
  /** id of the current nav item. */
  current?: string;
  onNavigate?: (id: string) => void;
  /** Laptop: section title (left of the top bar). Phone: unused. */
  title?: ReactNode;
  /** Right side of the phone app bar / the laptop top bar. */
  headerRight?: ReactNode;
  /** Laptop: bottom of the sidebar (status, user…). Hidden on the rail. */
  sidebarFooter?: ReactNode;
  /** Laptop: start on the icon rail. */
  defaultCollapsed?: boolean;
  /** Phone: bottom tab bar (overflow goes to a "More" drawer) or a drawer only. */
  phoneNav?: 'tabs' | 'drawer';
  /** Phone tab bar: at most this many tabs (the last one becomes "More" when there are more). */
  maxTabs?: number;
  /** Phone: `bare` keeps only the status bar (the children draw their own chrome, e.g. a browser). */
  chrome?: 'app' | 'bare';
  /** Phone status bar clock (default "9:41"). */
  statusTime?: string;
  /** A full-screen layer above the app (e.g. what the patient sees). Keep passing it while it closes. */
  overlay?: ReactNode;
  /** Shows `overlay` (revealed by a passing disc, hidden the same way). */
  overlayOpen?: boolean;
  /** Where the overlay's disc starts, as CSS positions (default: top right). */
  overlayOrigin?: [string, string];
  /** Padding around the content (default true). */
  padded?: boolean;
  /**
   * @deprecated No-op since v3: the showcase's views never overlap (frameless split),
   * so the laptop content needs no room for a phone. Kept so older call sites compile.
   */
  safeArea?: boolean;
  contentClassName?: string;
  /** false while hidden: loops pause and no sounds play. */
  active?: boolean;
  /** Called with the demo root element (pairing: `usePairedStore().ref`). */
  rootRef?: (el: HTMLDivElement | null) => void;
  children: ReactNode;

  /** v1 aliases */
  tabs?: NavItem[];
  activeTab?: string;
  onTab?: (id: string) => void;
}

/** Keeps the overlay mounted while it animates out (`closing`). */
function useOverlayPresence(open: boolean, reduced: boolean, ms = 450): { shown: boolean; closing: boolean } {
  const [prevOpen, setPrevOpen] = useState(open);
  const [closing, setClosing] = useState(false);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setClosing(!open && !reduced);
  }
  useEffect(() => {
    if (!closing) return;
    const id = window.setTimeout(() => setClosing(false), ms);
    return () => window.clearTimeout(id);
  }, [closing, ms]);
  return { shown: open || closing, closing };
}

function StatusBar({ time }: { time: string }) {
  return (
    <div aria-hidden className="demo-status">
      <span className="demo-num">{time}</span>
      <span className="demo-status-icons">
        <svg viewBox="0 0 20 14" fill="currentColor">
          <rect x="1" y="9" width="3" height="4" rx="1" />
          <rect x="6" y="6.5" width="3" height="6.5" rx="1" />
          <rect x="11" y="4" width="3" height="9" rx="1" />
          <rect x="16" y="1" width="3" height="12" rx="1" opacity="0.35" />
        </svg>
        <svg viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2.5 5.5a11 11 0 0 1 15 0M5.5 8.6a6.5 6.5 0 0 1 9 0" />
          <circle cx="10" cy="11.6" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg viewBox="0 0 26 14" fill="none">
          <rect x="1" y="1.5" width="21" height="11" rx="3.2" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.4" />
          <rect x="3" y="3.5" width="14" height="7" rx="1.6" fill="currentColor" />
          <path d="M24 5.5v3" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}

function NavBadge({ badge, rail = false }: { badge: NavItem['badge']; rail?: boolean }) {
  if (badge === undefined) return null;
  if (badge === 'live') return <LiveDot className={rail ? 'demo-side-dot' : ''} />;
  return <span className="demo-navbadge">{badge}</span>;
}

/**
 * App chrome shared by every demo.
 * - laptop: collapsible sidebar (labels ↔ icon rail, remembered for the instance) + top bar.
 *   The showcase shows it next to the phone, never under it (v3), so it uses its full width.
 * - phone: status bar, app bar (brand + "Demo"), content, bottom tab bar (or a drawer).
 * Sizes are `em` (see demo.css); colors come from `theme`.
 */
export function AppShell(props: AppShellProps) {
  const {
    screen,
    theme,
    accent = '#2f8f83',
    business,
    logo,
    logoStyle = 'tile',
    title,
    headerRight,
    sidebarFooter,
    defaultCollapsed = false,
    phoneNav = 'tabs',
    maxTabs = 5,
    chrome = 'app',
    statusTime = '9:41',
    overlay,
    overlayOpen = false,
    overlayOrigin,
    padded = true,
    contentClassName = '',
    active: on = true,
    rootRef,
    children,
  } = props;
  const nav = props.nav ?? props.tabs ?? [];
  const current = props.current ?? props.activeTab;
  const navigate = props.onNavigate ?? props.onTab;

  const t = useTranslations('demoKit.shell');
  const tc = useTranslations('common');
  const td = useTranslations('demoShowcase');
  const { play } = useSound();
  const uid = useId();
  const sideId = `${uid}-side`;
  const navLabel = `${td(screen === 'laptop' ? 'laptopLabel' : 'phoneLabel', { business })} — ${tc('sections')}`;

  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawer, setDrawer] = useState(false);
  const rootEl = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const flipFrom = useRef<number | null>(null);
  const drawerButton = useRef<HTMLButtonElement>(null);
  const drawerPanel = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { shown: overlayShown, closing } = useOverlayPresence(overlayOpen && !!overlay, reduced);

  // Stable, so pairing only runs when the root mounts.
  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      rootEl.current = el;
      rootRef?.(el);
    },
    [rootRef],
  );

  const go = (id: string) => {
    if (id === current) return;
    if (on) play('select');
    navigate?.(id);
    rootEl.current?.querySelector('.demo-content')?.scrollTo({ top: 0 });
  };

  // Sidebar: FLIP the main panel (layout changes once, the slide is a transform).
  const toggleSidebar = () => {
    flipFrom.current = mainRef.current?.getBoundingClientRect().left ?? null;
    setCollapsed((c) => !c);
    if (on) play('toggle');
  };
  useLayoutEffect(() => {
    const main = mainRef.current;
    const from = flipFrom.current;
    flipFrom.current = null;
    if (!main || from === null || prefersReducedMotion()) return;
    const box = main.getBoundingClientRect();
    const scale = main.offsetWidth ? box.width / main.offsetWidth : 1;
    const dx = (from - box.left) / (scale || 1);
    if (Math.abs(dx) < 1) return;
    main.animate([{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }], {
      duration: 560,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
  }, [collapsed]);

  // Drawer: focus in, Escape out, focus back.
  useEffect(() => {
    if (!drawer) return;
    drawerPanel.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Closes the drawer only, not the dialog the showcase may sit in ("Abrir demo").
      e.preventDefault();
      e.stopPropagation();
      setDrawer(false);
      drawerButton.current?.focus({ preventScroll: true });
    };
    const panel = drawerPanel.current;
    panel?.addEventListener('keydown', onKey);
    return () => panel?.removeEventListener('keydown', onKey);
  }, [drawer]);
  const closeDrawer = (focusBack = true) => {
    setDrawer(false);
    if (on) play('close');
    if (focusBack) drawerButton.current?.focus({ preventScroll: true });
  };

  const style = {
    ...themeVars(theme ?? legacyTheme(accent)),
    ...(overlayOrigin ? { '--demo-ox': overlayOrigin[0], '--demo-oy': overlayOrigin[1] } : null),
  } as CSSProperties;
  const mode = theme?.mode ?? 'light';
  const brand = <BrandName business={business} logo={logo} logoStyle={logoStyle} />;
  const overlayLayer = overlayShown ? (
    <div className="demo-overlay" data-state={closing ? 'closing' : 'open'} inert={closing} style={screen === 'phone' ? { top: '2.35em' } : undefined}>
      {overlay}
    </div>
  ) : null;

  if (screen === 'laptop') {
    return (
      <div
        ref={setRoot}
        className="demo-root"
        data-screen="laptop"
        data-mode={mode}
        data-side={collapsed ? 'collapsed' : 'expanded'}
        data-paused={on ? undefined : ''}
        style={style}
      >
        <nav id={sideId} aria-label={navLabel} className="demo-side">
          <div className="demo-side-head">
            <BrandName business={business} logo={logo} logoStyle={logoStyle} stacked />
          </div>
          <ul className="demo-side-list">
            {nav.map((item) => {
              const Icon = item.icon;
              const isOn = item.id === current;
              return (
                <li key={item.id}>
                  {item.group ? <p className="demo-label demo-side-group">{item.group}</p> : null}
                  <button
                    type="button"
                    className="demo-side-item"
                    aria-current={isOn ? 'page' : undefined}
                    onClick={() => go(item.id)}
                  >
                    <Icon aria-hidden strokeWidth={isOn ? 2 : 1.6} />
                    <span className="demo-side-label">{item.label}</span>
                    {item.badge !== undefined ? (
                      <span className="demo-side-badge">
                        <NavBadge badge={item.badge} />
                      </span>
                    ) : null}
                    {collapsed && item.badge === 'live' ? <NavBadge badge="live" rail /> : null}
                    <span aria-hidden className="demo-side-tip">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {sidebarFooter ? <div className="demo-side-foot">{sidebarFooter}</div> : null}
        </nav>
        <div ref={mainRef} className="demo-main">
          <header className="demo-top">
            <button
              type="button"
              className="demo-side-toggle"
              aria-expanded={!collapsed}
              aria-controls={sideId}
              aria-label={collapsed ? t('expand') : t('collapse')}
              onClick={toggleSidebar}
            >
              {collapsed ? <PanelLeftOpen aria-hidden strokeWidth={1.6} /> : <PanelLeftClose aria-hidden strokeWidth={1.6} />}
            </button>
            <span className="demo-top-brand" aria-hidden>
              {brand}
              <span className="h-[1.2em] w-px bg-[var(--demo-line-strong)]" />
            </span>
            {title !== undefined ? <div className="demo-top-title">{title}</div> : null}
            <div className="demo-top-right">{headerRight}</div>
          </header>
          <div
            className={`demo-scroll demo-content ${contentClassName}`}
            data-padded={padded ? undefined : 'false'}
          >
            {children}
          </div>
        </div>
        {overlayLayer}
      </div>
    );
  }

  // Phone
  if (chrome === 'bare') {
    return (
      <div ref={setRoot} className="demo-root" data-screen="phone" data-mode={mode} data-paused={on ? undefined : ''} style={style}>
        <StatusBar time={statusTime} />
        <div className="relative flex min-h-0 flex-1 flex-col" inert={overlayShown}>
          {children}
        </div>
        <span aria-hidden className="demo-home-indicator" />
        {overlayLayer}
      </div>
    );
  }
  const useDrawer = phoneNav === 'drawer';
  const overflow = !useDrawer && nav.length > maxTabs;
  const tabs = overflow ? nav.slice(0, maxTabs - 1) : nav;
  const inMore = overflow && !tabs.some((n) => n.id === current);
  return (
    <div ref={setRoot} className="demo-root" data-screen="phone" data-mode={mode} data-paused={on ? undefined : ''} style={style}>
      <StatusBar time={statusTime} />
      <div className="contents" inert={drawer || overlayShown}>
        <header className="demo-appbar">
          {useDrawer && nav.length ? (
            <button
              ref={drawerButton}
              type="button"
              className="demo-side-toggle -ml-[0.4em]"
              aria-expanded={drawer}
              aria-controls={sideId}
              aria-label={t('menu')}
              onClick={() => {
                setDrawer(true);
                if (on) play('open');
              }}
            >
              <Menu aria-hidden strokeWidth={1.8} />
            </button>
          ) : null}
          {brand}
          {headerRight ? <div className="demo-appbar-right">{headerRight}</div> : null}
        </header>
        <div className={`demo-scroll demo-content ${contentClassName}`} data-padded={padded ? undefined : 'false'}>
          {children}
        </div>
        {!useDrawer && nav.length ? (
          <nav aria-label={navLabel} className="demo-tabbar">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isOn = item.id === current;
              return (
                <button key={item.id} type="button" className="demo-tab" aria-current={isOn ? 'page' : undefined} onClick={() => go(item.id)}>
                  <span className="demo-tab-icon">
                    <Icon aria-hidden strokeWidth={isOn ? 2 : 1.6} />
                    <NavBadge badge={item.badge} />
                  </span>
                  <span className="demo-tab-label">{item.label}</span>
                </button>
              );
            })}
            {overflow ? (
              <button
                ref={drawerButton}
                type="button"
                className="demo-tab"
                aria-current={inMore ? 'page' : undefined}
                aria-expanded={drawer}
                aria-controls={sideId}
                onClick={() => {
                  setDrawer(true);
                  if (on) play('open');
                }}
              >
                <span className="demo-tab-icon">
                  <Ellipsis aria-hidden strokeWidth={inMore ? 2 : 1.6} />
                </span>
                <span className="demo-tab-label">{t('more')}</span>
              </button>
            ) : null}
            <span aria-hidden className="demo-home-indicator" />
          </nav>
        ) : (
          <span aria-hidden className="demo-home-indicator" />
        )}
      </div>
      {useDrawer || overflow ? (
        <div className="demo-drawer" data-open={drawer ? '' : undefined}>
          <div className="demo-drawer-scrim" onClick={() => closeDrawer(false)} />
          <nav ref={drawerPanel} id={sideId} aria-label={navLabel} className="demo-drawer-panel" inert={!drawer}>
            <button
              type="button"
              className="demo-side-toggle absolute right-[0.6em] top-[0.6em]"
              aria-label={t('close')}
              onClick={() => closeDrawer()}
            >
              <X aria-hidden strokeWidth={1.8} />
            </button>
            <div className="mb-[1em] ml-[0.3em]">
              <BrandName business={business} logo={logo} logoStyle={logoStyle} stacked />
            </div>
            <ul className="demo-side-list">
              {nav.map((item) => {
                const Icon = item.icon;
                const isOn = item.id === current;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="demo-side-item"
                      aria-current={isOn ? 'page' : undefined}
                      onClick={() => {
                        go(item.id);
                        closeDrawer(false);
                      }}
                    >
                      <Icon aria-hidden strokeWidth={isOn ? 2 : 1.6} />
                      <span className="demo-side-label">{item.label}</span>
                      {item.badge !== undefined ? (
                        <span className="demo-side-badge">
                          <NavBadge badge={item.badge} />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
      {overlayLayer}
    </div>
  );
}

/**
 * v1 API (gym / real estate): same chrome, legacy props. New demos use `AppShell`.
 */
export function DemoShell(props: {
  screen: 'phone' | 'laptop';
  business: string;
  accent: string;
  logo: ReactNode;
  tabs?: NavItem[];
  activeTab?: string;
  onTab?: (id: string) => void;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return <AppShell {...props} />;
}
