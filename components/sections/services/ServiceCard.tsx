import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { ContentIcon } from '@/components/ui/Icon';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { Money } from '@/components/ui/Money';
import { serviceFromUsd, serviceIcon, type Service } from './services';

/**
 * One "Qué hacemos" card. Hover / keyboard focus (and, on touch screens, reaching
 * the middle of the viewport — see <ServiceGlow>) "lights" it: the icon gets an
 * eclipse corona and the border warms. Pure CSS, opacity/transform only.
 */
export function ServiceCard({ service }: { service: Service }) {
  const t = useTranslations('services');
  const titleId = `service-${service.id}-title`;
  const title = t(`items.${service.id}.title`);
  const icon = serviceIcon(service);
  const fromUsd = serviceFromUsd(service);

  return (
    <article aria-labelledby={titleId} data-service-card className="svc-card flex w-full flex-col p-6 sm:p-7 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <span className="svc-icon" aria-hidden>
          <span className="svc-icon-corona" />
          <span className="svc-icon-ring" />
          <span className="svc-icon-disc">
            <ContentIcon name={icon} className="svc-icon-base" />
            <ContentIcon name={icon} className="svc-icon-lit" />
          </span>
        </span>
        {fromUsd !== null ? (
          <p className="pt-1 text-right leading-tight">
            <span className="block text-[0.68rem] uppercase tracking-[0.16em] text-fg-muted">{t('from')}</span>
            <Money usd={fromUsd} className="mt-1 block text-[0.95rem] text-fg" />
          </p>
        ) : null}
      </div>

      <h3 id={titleId} className="display mt-9 text-[1.95rem] leading-[1.02] sm:text-[2.1rem] lg:text-[1.9rem] xl:text-[2.1rem]">
        {title}
      </h3>
      <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-fg-muted">{t(`items.${service.id}.description`)}</p>

      <div className="mt-7">
        <p className="eyebrow flex items-center gap-2 !text-[0.68rem] text-accent">
          <span aria-hidden className="svc-result-dot" />
          {t('resultLabel')}
        </p>
        <p className="mt-2.5 text-[1.02rem] leading-snug text-fg">{t(`items.${service.id}.result`)}</p>
      </div>

      <div className="mt-7 border-t border-line pt-2">
        <BuildPlanButton
          source="services"
          preset={{ items: [...service.items] }}
          className="svc-add -mx-1 flex min-h-12 w-[calc(100%+0.5rem)] items-center justify-between gap-3 rounded-full px-1 text-left text-[0.95rem] font-medium"
        >
          <span>
            {t('add')}
            <span className="sr-only">: {title}</span>
          </span>
          <span aria-hidden className="svc-add-icon">
            <Plus strokeWidth={1.5} className="size-4" />
          </span>
        </BuildPlanButton>
      </div>
    </article>
  );
}
