'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, UserRound } from 'lucide-react';
import { useSound } from '@/components/sound/SoundContext';
import { Card, ChatWidget, Kpi, Pill, runChat, type ChatRun, type ChatScript } from '../../kit';
import { FREE_SHIPPING_USD, STORY, TOP_QUESTIONS } from '../data';
import { addTime, botPick } from '../story';
import { useShop } from '../context';
import { useShopScripts } from '../scripts';
import { BrumaMark, PersonAvatar, useShopMoney, useShopText, ViewHead } from '../ui';

type ConvId = 'ines' | 'you' | 'faq' | 'martin' | 'sofia' | 'joaquin';

/** Earlier conversations (static transcripts). */
function useStaticScripts(): Record<'faq' | 'martin' | 'sofia' | 'joaquin', ChatScript> {
  const t = useTranslations('demoShop.chat.convs');
  const money = useShopMoney();
  return useMemo(() => {
    const two = (id: string, values: Record<string, string> = {}, note?: string): ChatScript => ({
      start: 'q',
      steps: {
        q: { from: 'user', text: t(`${id}.q`, values), next: 'a' },
        a: { from: 'bot', text: t(`${id}.a`, values), next: note ? 'n' : undefined },
        ...(note ? { n: { from: 'note' as const, text: note } } : {}),
      },
    });
    return {
      faq: two('faq', { amount: money.fmt(money.local(FREE_SHIPPING_USD)) }),
      martin: two('martin'),
      sofia: two('sofia', {}, t('sofia.note')),
      joaquin: two('joaquin', {}, t('joaquin.note')),
    };
  }, [t, money]);
}

interface Conv {
  id: ConvId;
  who: 'ines' | 'you' | 'visitor' | 'martin' | 'sofia' | 'joaquin';
  line: string;
  state: 'live' | 'bot' | 'sale' | 'human';
  time: string;
}

function useConvs(): Conv[] {
  const t = useTranslations('demoShop.chat');
  const { view, state } = useShop();
  const { product, fmt } = useShopText();
  const ines = view.ines;
  const out: Conv[] = [];
  if (state.mine.chat) out.push({ id: 'you', who: 'you', line: t('lines.you'), state: 'live', time: fmt.time(view.clock) });
  if (view.t >= view.faqAt) out.push({ id: 'faq', who: 'visitor', line: t('convs.faq.q'), state: 'bot', time: fmt.time(view.clock) });
  if (view.t >= STORY.chatStart) {
    const pick = botPick(ines.chat.chosen);
    const added = addTime(ines.chat) !== null;
    const line =
      ines.status === 'recovered'
        ? t('lines.inesPaid')
        : added && pick
          ? t('lines.inesAdded', { product: product(pick.product) })
          : pick
            ? t('lines.inesPick', { product: product(pick.product) })
            : t('lines.inesAsk');
    out.push({ id: 'ines', who: 'ines', line, state: ines.status === 'recovered' ? 'sale' : 'live', time: fmt.time(view.clock) });
  }
  out.push({ id: 'joaquin', who: 'joaquin', line: t('convs.joaquin.q'), state: 'sale', time: fmt.time(1062) });
  out.push({ id: 'sofia', who: 'sofia', line: t('convs.sofia.q'), state: 'human', time: fmt.time(1041) });
  out.push({ id: 'martin', who: 'martin', line: t('convs.martin.q'), state: 'bot', time: fmt.time(1017) });
  return out;
}

function Transcript({ id }: { id: ConvId }) {
  const t = useTranslations('demoShop.chat');
  const { view, state, business } = useShop();
  const { person } = useShopText();
  const scripts = useShopScripts();
  const statics = useStaticScripts();
  let run: ChatRun;
  let title = t('visitor');
  if (id === 'ines') {
    run = view.ines.chat;
    title = person('ines');
  } else if (id === 'you' && state.mine.chat) {
    run = runChat(scripts.botMine, 0, state.mine.chat, { instant: true });
    title = person('you');
  } else {
    const key = id === 'you' ? 'faq' : id;
    run = runChat(statics[key], 0, {}, { instant: true });
    if (id !== 'faq') title = person(id as 'martin' | 'sofia' | 'joaquin');
  }
  return (
    <ChatWidget
      variant="widget"
      run={{ ...run, awaiting: null }}
      title={title}
      subtitle={t('onSite')}
      avatar={<BrumaMark />}
      label={t('transcriptLabel', { name: title, business })}
      announce={false}
      composer={false}
      className="shop-transcript"
    />
  );
}

function ConvList({ selected, onSelect, limit = 6 }: { selected: ConvId; onSelect: (id: ConvId) => void; limit?: number }) {
  const t = useTranslations('demoShop.chat');
  const { person } = useShopText();
  const convs = useConvs().slice(0, limit);
  return (
    <ul className="shop-convs" aria-label={t('list')}>
      {convs.map((c) => (
        <li key={c.id}>
          <button type="button" className="shop-conv" aria-pressed={selected === c.id} onClick={() => onSelect(c.id)}>
            {c.who === 'visitor' ? (
              <span className="shop-conv-anon" aria-hidden>
                <UserRound strokeWidth={1.7} />
              </span>
            ) : (
              <PersonAvatar id={c.who} />
            )}
            <span className="min-w-0 flex-1 text-left leading-[1.2]">
              <span className="flex items-center gap-[0.4em]">
                <span className="truncate font-semibold">{c.who === 'visitor' ? t('visitor') : person(c.who)}</span>
              </span>
              <span className="block truncate text-[0.8em] text-[var(--demo-muted)]">{c.line}</span>
            </span>
            <Pill tone={c.state === 'sale' ? 'accent' : c.state === 'human' ? 'warn' : c.state === 'live' ? 'ok' : 'neutral'} icon={c.state === 'bot' ? Bot : undefined}>
              {t(`states.${c.state}`)}
            </Pill>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ChatKpis() {
  const t = useTranslations('demoShop.chat');
  const { view } = useShop();
  const { fmt } = useShopText();
  const c = view.chats;
  return (
    <div className="shop-kpis">
      <Kpi label={t('kpis.total')} value={c.total} />
      <Kpi label={t('kpis.byBot')} value={Math.round((c.byBot / c.total) * 100)} format={(n) => fmt.pct(n / 100)} />
      <Kpi label={t('kpis.sales')} value={c.sales} emphasis />
      <Kpi label={t('kpis.human')} value={c.human} />
    </div>
  );
}

function TopQuestions() {
  const t = useTranslations('demoShop.chat');
  const max = TOP_QUESTIONS[0].count;
  return (
    <Card className="shop-topq">
      <h3 className="shop-card-title">{t('top')}</h3>
      <ol>
        {TOP_QUESTIONS.map((q, i) => (
          <li key={q.id} style={{ '--i': i } as CSSProperties}>
            <span className="min-w-0 flex-1 truncate">{t(`topq.${q.id}`)}</span>
            <span className="shop-topq-track" aria-hidden>
              <span style={{ transform: `scaleX(${q.count / max})` }} />
            </span>
            <b className="demo-mono">{q.count}</b>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function useSelected() {
  const { active } = useShop();
  const { play } = useSound();
  const [selected, setSelected] = useState<ConvId>('ines');
  return [
    selected,
    (id: ConvId) => {
      setSelected(id);
      if (active) play('select');
    },
  ] as const;
}

export function LaptopChat() {
  const t = useTranslations('demoShop.chat');
  const [selected, select] = useSelected();
  return (
    <div className="shop-chatview">
      <ViewHead title={t('title')} sub={t('sub')} />
      <ChatKpis />
      <div className="shop-chatview-row">
        <div className="flex min-w-0 flex-col gap-[0.8em]">
          <Card className="shop-convs-card">
            <ConvList selected={selected} onSelect={select} />
          </Card>
          <TopQuestions />
        </div>
        <Transcript id={selected} />
      </div>
    </div>
  );
}

export function PhoneChat() {
  const t = useTranslations('demoShop.chat');
  const [selected, select] = useSelected();
  return (
    <div className="shop-chatview" data-screen="phone">
      <ViewHead title={t('title')} sub={t('sub')} />
      <ChatKpis />
      <Card className="shop-convs-card">
        <ConvList selected={selected} onSelect={select} limit={4} />
      </Card>
      <div className="shop-chatview-transcript">
        <Transcript id={selected} />
      </div>
    </div>
  );
}
