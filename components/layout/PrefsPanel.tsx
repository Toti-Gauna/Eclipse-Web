'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { routing, localeTags, type Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useSound } from '@/components/sound/SoundContext';
import { useSoundStatus } from '@/components/sound/SoundProvider';
import type { Currency } from '@/lib/currency';
import { LocaleHrefs, rememberLocale } from './LocaleSwitcher';
import './prefs.css';

/** USD first: it is the currency prices are set in. */
const CURRENCY_ORDER: readonly Currency[] = ['USD', 'ARS', 'BRL'];

function Switch({
  checked,
  label,
  hint,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint: string;
  onChange: (on: boolean) => void;
}) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-l`}
      aria-describedby={`${id}-h`}
      data-sound-control
      onClick={() => onChange(!checked)}
      className="prefs-row prefs-switch"
    >
      <span className="prefs-name">
        <span id={`${id}-l`}>{label}</span>
        <span id={`${id}-h`} className="prefs-sub">
          {hint}
        </span>
      </span>
      <span aria-hidden className="prefs-track">
        <span className="prefs-thumb" />
      </span>
    </button>
  );
}

/**
 * Language, currency and sound — the same content in the header popover, the mobile
 * menu and the footer. Languages are real links (a full document navigation); the
 * currency is a radio group with today's rate and its source; sound has two switches.
 *
 * layout="stack": one column (popover, menu). layout="band": three columns from md (footer).
 */
export function PrefsPanel({ layout = 'stack', className = '' }: { layout?: 'stack' | 'band'; className?: string }) {
  const t = useTranslations('prefs');
  const locale = useLocale() as Locale;
  const { currency, setCurrency, rates, formatRate, symbol } = useCurrency();
  const { enabled, music, setEnabled, setMusic, play } = useSound();
  const { supported } = useSoundStatus();
  const id = useId();
  const date = new Intl.DateTimeFormat(localeTags[locale], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${rates.updatedAt}T12:00:00Z`),
  );
  const live = rates.source === 'live';

  return (
    <div className={`prefs prefs-${layout} ${className}`}>
      <div role="group" aria-labelledby={`${id}-lang`} className="prefs-group">
        <p id={`${id}-lang`} className="prefs-label">
          <span aria-hidden className="prefs-index">
            01
          </span>
          {t('language')}
        </p>
        <LocaleHrefs>
          {(hrefFor) => (
            <ul className="prefs-list">
              {routing.locales.map((l) => {
                const active = l === locale;
                return (
                  <li key={l}>
                    <a
                      href={hrefFor(l)}
                      hrefLang={localeTags[l]}
                      lang={localeTags[l]}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => rememberLocale(locale, l)}
                      className="prefs-row"
                    >
                      <span aria-hidden className="prefs-mark" />
                      <span className="prefs-name">{t(`languages.${l}`)}</span>
                      <span aria-hidden className="prefs-code">
                        {l.toUpperCase()}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </LocaleHrefs>
      </div>

      <fieldset className="prefs-group" aria-describedby={`${id}-note`}>
        <legend className="prefs-label">
          <span aria-hidden className="prefs-index">
            02
          </span>
          {t('currency')}
        </legend>
        <div className="prefs-list">
          {CURRENCY_ORDER.map((c) => (
            <label key={c} className="prefs-row prefs-radio">
              <input
                type="radio"
                name={`${id}-currency`}
                value={c}
                checked={currency === c}
                onChange={() => {
                  setCurrency(c);
                  play('select');
                }}
                aria-labelledby={`${id}-${c}`}
                aria-describedby={`${id}-${c}-sub`}
                className="sr-only"
              />
              <span aria-hidden className="prefs-mark" />
              <span className="prefs-name">
                <span id={`${id}-${c}`}>
                  <span className="prefs-lead">{c}</span> {t(`currencies.${c}`)}
                </span>
                <span id={`${id}-${c}-sub`} className="prefs-sub readout">
                  {c === 'USD' ? t('base') : t('rate', { amount: formatRate(c), source: t(`rateSource.${c}`) })}
                </span>
              </span>
              <span aria-hidden className="prefs-code">
                {symbol(c)}
              </span>
            </label>
          ))}
        </div>
        <div id={`${id}-note`} className="prefs-foot">
          <p>{t('note')}</p>
          <p className="prefs-source" data-live={live || undefined}>
            {t(live ? 'live' : 'fallback', { date })}
          </p>
        </div>
      </fieldset>

      {supported ? (
        <div role="group" aria-labelledby={`${id}-sound`} className="prefs-group">
          <p id={`${id}-sound`} className="prefs-label">
            <span aria-hidden className="prefs-index">
              03
            </span>
            {t('sound')}
          </p>
          <div className="prefs-list">
            <Switch
              checked={enabled}
              label={t('effects')}
              hint={t('effectsHint')}
              onChange={(on) => {
                setEnabled(on);
                if (on) play('toggle');
              }}
            />
            <Switch checked={music} label={t('music')} hint={t('musicHint')} onChange={setMusic} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
