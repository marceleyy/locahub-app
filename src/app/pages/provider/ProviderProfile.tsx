import { useMemo } from "react";
import { HardHat, ShieldCheck, Star, Clock, Phone, Mail, Info, AlertTriangle } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import {
  Page, PageHeader, Card, SectionTitle, Badge, StatCard, Progress, Alert, EmptyState,
} from "@/app/components/common/ui";
import { useCurrentProvider } from "@/app/pages/provider/ProviderJobs";

export function ProviderProfile() {
  const { t, tv, money, date, percent, m } = useI18n();
  const store = useStore();
  const provider = useCurrentProvider();

  const jobs = useMemo(() => (provider ? store.jobsOfProvider(provider.id) : []), [store.db.jobs, provider, store]);
  const accepted = jobs.filter((j: any) => j.status !== "declined" && j.status !== "offered").length;
  const acceptRate = jobs.length ? accepted / jobs.filter((j: any) => j.status !== "offered").length : 1;

  if (!provider) return <Page><EmptyState label={t("provider.noAccount")} /></Page>;

  const expiring = provider.validUntil && new Date(provider.validUntil).getTime() - Date.now() < 90 * 86400000;

  return (
    <Page>
      <PageHeader title={provider.name} subtitle={t("provider.profileSubtitle")} />

      {expiring && (
        <Alert tone="red" icon={AlertTriangle} title={t("providers.insuranceExpiring")}>
          {m.code === "FR" ? t("provider.insuranceExpiringFR") : t("provider.insuranceExpiringQC")}
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Star} label={t("provider.rating")} value={provider.rating.toFixed(1)} tone="amber" hint="/ 5" />
        <StatCard icon={Clock} label={t("providers.onTime")} value={percent(provider.onTimeRate * 100, 0)} tone={provider.onTimeRate >= 0.9 ? "green" : "orange"} />
        <StatCard icon={HardHat} label={t("provider.completed")} value={provider.jobsCompleted} tone="blue" />
        <StatCard icon={ShieldCheck} label={t("provider.acceptRate")} value={percent(acceptRate * 100, 0)} tone="violet" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={HardHat}>{t("provider.identity")}</SectionTitle>
          <dl className="space-y-2 text-sm">
            {[
              [t("providers.contactName"), provider.contact],
              [t("common.city"), provider.city],
              [t("providers.hourlyRate"), money(provider.avgHourlyRate)],
              [t("providers.availability"), tv(provider.availability)],
            ].map(([k, v], i) => (
              <div key={i} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${provider.phone}`} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm hover:bg-accent">
              <Phone className="size-4" aria-hidden="true" />{provider.phone}
            </a>
            <a href={`mailto:${provider.email}`} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm hover:bg-accent">
              <Mail className="size-4" aria-hidden="true" />{provider.email}
            </a>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={ShieldCheck}>{t("providers.insurance")}</SectionTitle>
          <p className="mb-2 text-sm font-medium">{provider.insurance}</p>
          <p className="mb-4 text-xs text-muted-foreground tabular-nums">
            {t("providers.validUntil")} {date(provider.validUntil)}
          </p>
          <SectionTitle icon={HardHat}>{t("providers.trades")}</SectionTitle>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {provider.trades.map((x: string) => <Badge key={x} tone="blue">{t(`trade.${x}`)}</Badge>)}
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">{t("providers.onTime")}</span>
              <span className="font-medium tabular-nums">{percent(provider.onTimeRate * 100, 0)}</span>
            </div>
            <Progress value={provider.onTimeRate * 100} tone={provider.onTimeRate >= 0.9 ? "green" : "orange"} />
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Alert tone="blue" icon={Info} title={t("provider.visibilityTitle")}>
          {t("provider.visibilityBody")}
        </Alert>
      </div>
    </Page>
  );
}
