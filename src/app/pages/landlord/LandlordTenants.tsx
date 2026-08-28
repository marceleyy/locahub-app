import { useMemo, useState } from "react";
import { Users, Search, AlertTriangle, CalendarClock, Mail, Phone, Info } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { leaseAlerts } from "@/app/lib/assist";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Input, StatCard,
  Table, Alert, EmptyState, Avatar, Progress,
} from "@/app/components/common/ui";

export function LandlordTenants() {
  const { t, locale, money, date, market } = useI18n();
  const store = useStore();
  const [query, setQuery] = useState("");

  const owner = store.activeUserOfRole("landlord", market);

  const rows = useMemo(() => {
    if (!owner) return [];
    return store
      .leasesOfOwner(owner.id)
      .map((lease: any) => {
        const property = store.getProperty(lease.propertyId);
        const tenant = store.getUser(lease.tenantId);
        const payments = store.paymentsOfLease(lease.id);
        const late = payments.filter((p: any) => p.status === "late" || p.status === "unpaid");
        return { lease, property, tenant, payments, late };
      })
      .filter((r: any) => r.property?.market === market && r.tenant)
      .filter((r: any) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return `${r.tenant.firstName} ${r.tenant.lastName} ${r.property.title}`.toLowerCase().includes(q);
      });
  }, [store, owner, market, query]);

  const alerts = useMemo(
    () => (owner ? leaseAlerts(store.leasesOfOwner(owner.id), store.db.properties, market) : []),
    [store, owner, market]
  );

  const stats = useMemo(() => ({
    total: rows.length,
    late: rows.filter((r: any) => r.late.length > 0).length,
    lateAmount: rows.reduce((a: number, r: any) => a + r.late.reduce((s: number, p: any) => s + p.amount, 0), 0),
    expiring: alerts.filter((a) => a.kind === "ending").length,
  }), [rows, alerts]);

  if (!owner) return <Page><EmptyState label={t("dashboard.noOwner")} /></Page>;

  return (
    <Page wide>
      <PageHeader title={t("nav.tenants")} subtitle={t("tenants.subtitle")} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label={t("tenants.active")} value={stats.total} tone="blue" />
        <StatCard icon={AlertTriangle} label={t("tenants.withArrears")} value={stats.late} tone={stats.late ? "red" : "neutral"} />
        <StatCard icon={AlertTriangle} label={t("tenantFile.arrears")} value={money(stats.lateAmount)} tone={stats.lateAmount ? "red" : "neutral"} />
        <StatCard icon={CalendarClock} label={t("tenants.expiring")} value={stats.expiring} tone="amber" />
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder={t("tenants.search")} className="pl-9" aria-label={t("tenants.search")} />
      </div>

      {rows.length === 0 ? (
        <EmptyState label={t("tenants.empty")} />
      ) : (
        <div className="space-y-4">
          {rows.map(({ lease, property, tenant, payments, late }: any) => {
            const paidRate = payments.length
              ? (payments.filter((p: any) => p.status === "paid").length / payments.length) * 100
              : 100;
            return (
              <Card key={lease.id}>
                <div className="mb-4 flex flex-wrap items-start gap-4">
                  <Avatar user={tenant} size={48} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-balance">{tenant.firstName} {tenant.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{property.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <a href={`mailto:${tenant.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="size-3" aria-hidden="true" />{tenant.email}
                      </a>
                      <a href={`tel:${tenant.phone}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="size-3" aria-hidden="true" />{tenant.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {late.length > 0
                      ? <Badge strong tone="red">{t("tenants.arrearsCount", { n: String(late.length) })}</Badge>
                      : <Badge strong tone="green">{t("tenants.upToDate")}</Badge>}
                    <Badge tone="neutral">
                      <span className="tabular-nums">{lease.endDate ? date(lease.endDate) : "—"}</span>
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("tenants.paymentReliability")}</span>
                    <span className="font-medium tabular-nums">{Math.round(paidRate)} %</span>
                  </div>
                  <Progress value={paidRate} tone={paidRate >= 95 ? "green" : paidRate >= 80 ? "amber" : "red"} />
                </div>

                <Table
                  columns={[t("payments.dueDate"), t("fin.amount"), t("payments.method"), t("common.status")]}
                  rows={payments.slice(0, 4).map((p: any) => [
                    <span className="tabular-nums">{date(p.dueDate)}</span>,
                    <span className="tabular-nums">{money(p.amount)}</span>,
                    <span className="text-muted-foreground">{p.method || "—"}</span>,
                    <Badge tone={p.status === "paid" ? "green" : p.status === "late" ? "amber" : "red"}>{t(`payment.${p.status}`)}</Badge>,
                  ])}
                  empty={t("tenantFile.noPayment")}
                />
              </Card>
            );
          })}
        </div>
      )}

      {alerts.length > 0 && (
        <Card className="mt-5">
          <SectionTitle icon={CalendarClock}>{t("calendar.leaseAlerts")}</SectionTitle>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="rounded-xl bg-muted p-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-balance">{a.title[locale] || a.title.fr}</span>
                  <Badge tone={a.severity === "critical" ? "red" : "amber"}>
                    <span className="tabular-nums">{a.daysLeft} j</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground text-pretty">{a.detail[locale] || a.detail.fr}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-5">
        <Alert tone="blue" icon={Info} title={t("tenants.rightsTitle")}>
          {market === "FR" ? t("tenants.rightsFR") : t("tenants.rightsQC")}
        </Alert>
      </div>
    </Page>
  );
}
