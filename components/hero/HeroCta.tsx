'use client';

import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { useSound } from '@/components/sound/SoundContext';
import { track } from '@/lib/analytics';

/**
 * The hero's one solid amber action: «Quiero potenciar mi negocio». A REAL link to the contact
 * section (it works without JS and is announced as what it does: it goes to the contact
 * block, where the WhatsApp action lives). Lote 1.3 upgrades it to open the rubro selector;
 * until then it never opens WhatsApp by itself under a new label (lote 1.2 §07.3).
 */
export function HeroCta({ className }: { className?: string }) {
  const t = useTranslations('hero');
  const { play } = useSound();
  return (
    <a
      href={`#${SECTION_IDS.agent}`}
      className={className}
      onClick={() => {
        track('hero_cta_clicked', { target: SECTION_IDS.agent });
        play('glint');
      }}
    >
      {t('ctaPotenciar')}
    </a>
  );
}
