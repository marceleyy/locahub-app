import { useMemo } from "react";
import { Receipt, Clock, CheckCircle2, TrendingUp, Info } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import {
  Page, PageHeader, Card, SectionTitle, Badge, StatCard, Table, Alert, EmptyState,
} from "@/app/components/common/ui";
import { useCurrentProvider } from "@/app/pages/provider/ProviderJobs";

export function ProviderInvoices() {
  const { t, tv, money, date, m } = useI18n();
  const store = useStore();
  const provider = useCurrentProvider();

  const invoices = useMemo(
    () =>
      provider
        ? [...store.invoicesOfProvider(provider.id)].sort((a: any, b: any) => b.date.localeCompare(a.date))
        : [],
    [store.db.invoices, provider, store]
  );

  const stats = useMemo(() => {
    const paid = invoices.filter((i: any) => i.status === "paid");
    const unpaid = invoices.filter((i: any) => i.status === "unpaid");
    const oldest = unpaid.length
      ? Math.max(...unpaid.map((i: any) => Math.floor((Date.now() - new Date(i.date).getTime()) / 86400000)))
      : 0;
    return {
      total: invoices.reduce((a: number, i: any) => a + i.amount, 0),
      paid: paid.reduce((a: number, i: any) => a + i.amount, 0),
      due: unpaid.reduce((a: number, i: any) => a + i.amount, 0),
      oldest,
    };
  }, [invoices]);

  if (!provider) return <Page><EmptyState label={t("provider.noAccount")} /></Page>;

  return (
    <Page wide>
      <PageHeader title={t("nav.invoices")} subtitle={t("provider.invoicesSubtitle")} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label={t("provider.billed")} value={money(stats.total)} tone="blue" />
        <StatCard icon={CheckCircle2} label={t("provider.settled")} value={money(stats.paid)} tone="green" />
        <StatCard icon={Receipt} label={t("provider.outstanding")} value={money(stats.due)} tone={stats.due ? "orange" : "neutral"} />
        <StatCard
          icon={Clock}
          label={t("provider.oldestDue")}
          value={stats.oldest ? t("provider.days", { n: String(stats.oldest) }) : "—"}
          tone={stats.oldest > 45 ? "red" : "neutral"}
          hint={t("provider.paymentTermHint")}
        />
      </div>

      <Card>
        <SectionTitle icon={Receipt}>{t("provider.allInvoices")}</SectionTitle>
        <Table
          columns={[t("common.date"), t("fin.label"), t("common.property"), t("fin.amount"), t("fin.recoverable"), t("common.status")]}
          rows={invoices.map((i: any) => {
            const property = store.getProperty(i.propertyId);
            return [
              <span className="tabular-nums">{date(i.date)}</span>,
              <div>
                <div>{tv(i.label)}</div>
                {i.submittedBy === "provider" && (
                  <div className="text-xs text-muted-foreground">{t("provider.selfSubmitted")}</div>
                )}
              </div>,
              <span className="text-xs text-muted-foreground">{property?.city || "—"}</span>,
              <span className="tabular-nums">{money(i.amount)}</span>,
              i.recoverable ? <Badge tone="blue">{t("common.yes")}</Badge> : <span className="text-muted-foreground">{t("common.no")}</span>,
              <Badge tone={i.status === "paid" ? "green" : "orange"}>{t(`invoice.${i.status}`)}</Badge>,
            ];
          })}
          empty={t("provider.noInvoice")}
        />
      </Card>

      <div className="mt-5">
        <Alert tone="blue" icon={Info} title={t("provider.termsTitle")}>
          {m.code === "FR" ? t("provider.termsFR") : t("provider.termsQC")}
        </Alert>
      </div>
    </Page>
  );
}
