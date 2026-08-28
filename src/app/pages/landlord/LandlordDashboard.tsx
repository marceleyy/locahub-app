import { useMemo } from "react";
import {
  Building2, Wallet, TrendingUp, Users, AlertTriangle, CalendarClock,
  Wrench, ArrowRight, Gauge,
} from "lucide-react";
import { Link } from "react-router";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck } from "@/app/store/AppStore";
import { computeYields } from "@/app/lib/finance";
import { leaseAlerts } from "@/app/lib/assist";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, StatCard,
  Progress, Alert, EmptyState,
} from "@/app/components/common/ui";

export function LandlordDashboard() {
  const { t, tv, locale, money, date, percent, market, m } = useI18n();
  const store = useStore();

  const owner = store.activeUserOfRole("landlord", market);
  const properties = useMemo(
    () => (owner ? store.propertiesOfOwner(owner.id).filter((p: any) => p.market === market) : []),
    [store, owner, market]
  );

  const totals = useMemo(() => {
    let gross = 0, noi = 0, cash = 0, invested = 0;
    properties.forEach((p: any) => {
      const eco = store.economicsOf(p.id);
      if (!eco) return;
      const y = computeYields({ rent: p.rent, charges: p.charges, ...eco });
      gross += y.grossRent; noi += y.noi; cash += y.cashFlow; invested += y.totalInvested;
    });
    const occupied = properties.filter((p: any) => p.status === "occupied").length;
    return {
      gross, noi, cash, invested,
      netYield: invested ? noi / invested : 0,
      occupancy: properties.length ? occupied / properties.length : 0,
      occupied,
    };
  }, [properties, store]);

  const leases = useMemo(
    () => (owner ? store.leasesOfOwner(owner.id) : []),
    [store, owner]
  );
  const alerts = useMemo(
    () => leaseAlerts(leases, store.db.properties, market).slice(0, 3),
    [leases, store.db.properties, market]
  );

  const arrears = useMemo(() => {
    if (!owner) return [];
    return store.paymentsOfOwner(owner.id).filter((p: any) => p.status === "late" || p.status === "unpaid");
  }, [store, owner]);

  const openTickets = useMemo(
    () => store.db.tickets.filter((x: any) => properties.some((p: any) => p.id === x.propertyId) && x.status !== "resolved"),
    [store.db.tickets, properties]
  );

  const issues = useMemo(
    () => properties.flatMap((p: any) => complianceCheck(p, m).map((i: any) => ({ ...i, property: p }))),
    [properties, m]
  );
  const blocking = issues.filter((i: any) => i.level === "blocking");

  if (!owner) return <Page><EmptyState label={t("dashboard.noOwner")} /></Page>;

  return (
    <Page wide>
      <PageHeader
        title={t("dashboard.greeting", { name: owner.firstName })}
        subtitle={t("dashboard.subtitle", { market: tv(m.name), n: String(properties.length) })}
      />

      {blocking.length > 0 && (
        <Alert tone="red" icon={AlertTriangle} title={t("dashboard.blockingTitle")}>
          {blocking.map((i: any) => `${i.property.title} — ${tv(i)}`).join(" · ")}
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Wallet} label={t("fin.grossRent")} value={money(totals.gross)} tone="blue" hint={t("fin.perYear")} />
        <StatCard
          icon={TrendingUp}
          label={t("fin.cashFlow")}
          value={money(totals.cash)}
          tone={totals.cash >= 0 ? "green" : "red"}
          hint={t("fin.afterDebt")}
        />
        <StatCard icon={Gauge} label={t("fin.netYield")} value={percent(totals.netYield * 100, 2)} tone="orange" />
        <StatCard
          icon={Building2}
          label={t("finance.occupancy")}
          value={percent(totals.occupancy * 100, 0)}
          tone={totals.occupancy >= 0.9 ? "green" : "amber"}
          hint={`${totals.occupied}/${properties.length}`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionTitle
              icon={Building2}
              right={<Link to="/landlord/properties"><Button size="sm" variant="ghost" icon={ArrowRight}>{t("common.view")}</Button></Link>}
            >
              {t("dashboard.myProperties")}
            </SectionTitle>
            {properties.length === 0 ? (
              <EmptyState label={t("dashboard.noProperty")} />
            ) : (
              <div className="space-y-2.5">
                {properties.map((p: any) => {
                  const eco = store.economicsOf(p.id);
                  const y = eco ? computeYields({ rent: p.rent, charges: p.charges, ...eco }) : null;
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-muted p-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">{p.city}</div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{money(p.rent)}</span>
                      {y && (
                        <Badge tone={y.cashFlow >= 0 ? "green" : "red"}>
                          <span className="tabular-nums">{y.cashFlow >= 0 ? "+" : ""}{money(y.cashFlow)}</span>
                        </Badge>
                      )}
                      <Badge tone={p.status === "occupied" ? "green" : "amber"}>{t(`propertyStatus.${p.status}`)}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle icon={CalendarClock}>{t("calendar.leaseAlerts")}</SectionTitle>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("calendar.noAlert")}</p>
            ) : (
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
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle icon={Users}>{t("dashboard.arrears")}</SectionTitle>
            {arrears.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.noArrears")}</p>
            ) : (
              <ul className="space-y-2">
                {arrears.map((p: any) => {
                  const tenant = store.getUser(p.tenantId);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-destructive/5 p-3 text-sm">
                      <span className="truncate">{tenant ? `${tenant.firstName} ${tenant.lastName}` : "—"}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-destructive">{money(p.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle icon={Wrench}>{t("dashboard.openTickets")}</SectionTitle>
            {openTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("tech.noIntervention")}</p>
            ) : (
              <ul className="space-y-2">
                {openTickets.slice(0, 5).map((x: any) => (
                  <li key={x.id} className="rounded-xl bg-muted p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-pretty">{tv(x.title)}</span>
                      <Badge tone={x.priority === "urgent" ? "red" : "amber"}>{t(`ticket.${x.status}`)}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">{date(x.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle icon={AlertTriangle}>{t("common.compliance")}</SectionTitle>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">{t("dashboard.conformRate")}</span>
              <span className="font-medium tabular-nums">
                {properties.length ? Math.round(((properties.length - new Set(issues.map((i: any) => i.property.id)).size) / properties.length) * 100) : 100} %
              </span>
            </div>
            <Progress
              value={properties.length ? ((properties.length - new Set(issues.map((i: any) => i.property.id)).size) / properties.length) * 100 : 100}
              tone={blocking.length ? "red" : issues.length ? "amber" : "green"}
            />
            <p className="mt-3 text-xs text-muted-foreground text-pretty">
              {issues.length ? t("dashboard.issuesFound", { n: String(issues.length) }) : t("compliance.ok")}
            </p>
          </Card>
        </div>
      </div>
    </Page>
  );
}
