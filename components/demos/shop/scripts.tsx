'use client';

import { useMemo } from 'react';
import type { ChatScript } from '../kit';
import { COUPON, productById, type Line } from './data';
import { BOT_FLOW, WA_FLOW, botGoto, buildScript, stepLine, waGoto } from './story';
import { Bag, BagStack, useShopMoney, useShopText } from './ui';

/** The bot's pick inside the chat: the bag, what it is, its price. */
export function ProductCard({ line }: { line: Line }) {
  const { product, variant, t } = useShopText();
  const money = useShopMoney();
  const p = productById(line.product);
  return (
    <span className="shop-chatcard">
      <span className="shop-chatcard-art" style={{ background: p.tint }}>
        <Bag product={line.product} size={line.size} text={false} />
      </span>
      <span className="min-w-0 flex-1 leading-[1.25]">
        <span className="block truncate font-semibold">{product(line.product)}</span>
        <span className="block truncate text-[0.88em] opacity-80">{variant(line)}</span>
        <span className="block truncate text-[0.88em] opacity-80">{t(`products.${line.product}.notes`)}</span>
      </span>
      <span className="shop-chatcard-price demo-mono">{money.fmt(money.line(line))}</span>
    </span>
  );
}

/** The cart inside the recovery message: tiny bags + the total with the coupon. */
export function CartCard({ lines }: { lines: Line[] }) {
  const { t, items } = useShopText();
  const money = useShopMoney();
  const tot = money.totals(lines, true);
  return (
    <span className="shop-cartcard">
      <BagStack lines={lines} max={3} />
      <span className="min-w-0 flex-1 leading-[1.3]">
        <span className="block font-semibold">{t('wa.cartItems', { count: items(lines) })}</span>
        <span className="block text-[0.9em]">
          {t('wa.withCoupon', { code: COUPON.code })} <b className="demo-mono">{money.fmt(tot.total)}</b>
        </span>
      </span>
    </span>
  );
}

/** Every script of the demo, in the current locale. */
export function useShopScripts() {
  const { t } = useShopText();
  return useMemo(() => {
    const botContent = (step: string) => {
      const line = stepLine(step);
      return { text: t(`bot.${step}`), card: line ? <ProductCard line={line} /> : undefined };
    };
    const botLabel = (step: string, id: string) => t(`bot.replies.${id}`);
    /** Inés's chat (autoplay) and the visitor's own (they pick). */
    const bot: ChatScript = buildScript(BOT_FLOW, botGoto, botContent, botLabel, true);
    const botMine: ChatScript = buildScript(BOT_FLOW, botGoto, botContent, botLabel, false);

    /** The recovery message: `name` null = the visitor. */
    const wa = (name: string | null, lines: Line[], auto: boolean): ChatScript =>
      buildScript(
        WA_FLOW,
        waGoto,
        (step) => {
          if (step === 'msg') {
            return {
              text: name ? t('wa.msg', { name, code: COUPON.code, pct: Math.round(COUPON.pct * 100) }) : t('wa.msgYou', { code: COUPON.code, pct: Math.round(COUPON.pct * 100) }),
              card: lines.length ? <CartCard lines={lines} /> : undefined,
            };
          }
          return { text: t(`wa.${step}`) };
        },
        (_step, id) => t(`wa.replies.${id}`),
        auto,
      );
    /** Structure only (timing + branches), for the story derivation. */
    const waShape = wa('', [], true);
    return { bot, botMine, wa, waShape };
  }, [t]);
}
export type ShopScripts = ReturnType<typeof useShopScripts>;
