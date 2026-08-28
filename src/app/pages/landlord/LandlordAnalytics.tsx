import { useMemo } from "react";
import { TrendingUp, Gauge, Building2, AlertTriangle, Percent, Info } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { computeYields, performanceScore, whatIf } from "@/app/lib/finance";
import {
  Page, PageHeader, Card, SectionTitle, Badge, StatCard, Table,
  Progress, Alert, EmptyState,
} from "@/app/components/common/ui";

export function LandlordAnalytics() {
  const { t, tv, locale, money, percent, market, m } = useI18n();
  const store = useStore();

  const owner = store.activeUserOfRole("landlord", market);
  const properties = useMemo(
    () => (owner ? store.propertiesOfOwner(owner.id).filter((p: any) => p.market === market) : []),
    [store, owner, market]
  );

  const rows = useMemo(
    () =>
      properties
        .map((p: any) => {
          const eco = store.economicsOf(p.id);
          if (!eco) return null;
          const y = computeYields({ rent: p.rent, charges: p.charges, ...eco });
          const tickets = store.ticketsOfProperty(p.id);
          const score = performanceScore({
            netYield: y.netYield,
            occupancyRate: 1 - eco.vacancyRate,
            unpaidRate: eco.unpaidRate,
            tenantSatisfaction: p.ratings?.overall || 3.5,
            avgResolutionDays: 4.2,
            energyGrade: p.energy?.grade || "D",
            openTickets: tickets.filter((x: any) => x.status !== "resolved").length,
          });
          return { property: p, y, eco, score };
        })
        .filter(Boolean) as any[],
    [properties, store]
  );

  const totals = useMemo(() => {
    const gross = rows.reduce((a, r) => a + r.y.grossRent, 0);
    const noi = rows.reduce((a, r) => a + r.y.noi, 0);
    const invested = rows.reduce((a, r) => a + r.y.totalInvested, 0);
    const vacancy = rows.length ? rows.reduce((a, r) => a + r.eco.vacancyRate, 0) / rows.length : 0;
    return { gross, noi, invested, vacancy, netYield: invested ? noi / invested : 0 };
  }, [rows]);

  /** Série mensuelle reconstruite depuis le portefeuille du marché affiché. */
  const series = useMemo(() => {
    const months = locale === "fr"
      ? ["Mars", "Avr", "Mai", "Juin", "Juil", "Août"]
      : ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    const monthlyRent = totals.gross / 12;
    const monthlyCost = rows.reduce((a, r) => a + r.y.operatingExpenses, 0) / 12;
    return months.map((label, i) => ({
      month: label,
      revenue: Math.round(monthlyRent * (0.96 + i * 0.012)),
      expenses: Math.round(monthlyCost * (1.08 - i * 0.02)),
    }));
  }, [totals, rows, locale]);

  const levers = useMemo(() => {
    const occupancy = 1 - totals.vacancy;
    return [
      whatIf(totals.gross, occupancy, 2, t("lever.occupancyUp")),
      whatIf(totals.gross, occupancy, -2, t("lever.occupancyDown")),
    ];
  }, [totals, t]);

  if (!owner) return <Page><EmptyState label={t("dashboard.noOwner")} /></Page>;
  if (rows.length === 0) return <Page><PageHeader title={t("nav.analytics")} /><EmptyState label={t("analytics.empty")} /></Page>;

  return (
    <Page wide>
      <PageHeader title={t("nav.analytics")} subtitle={t("analytics.subtitle", { market: tv(m.name) })} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label={t("fin.grossRent")} value={money(totals.gross)} tone="blue" hint={t("fin.perYear")} />
        <StatCard icon={Gauge} label={t("fin.netYield")} value={percent(totals.netYield * 100, 2)} tone="green" />
        <StatCard icon={Building2} label={t("finance.occupancy")} value={percent((1 - totals.vacancy) * 100, 1)} tone="orange" />
        <StatCard icon={AlertTriangle} label={t("analytics.vacancyCost")} value={money(totals.gross * totals.vacancy)} tone="red" hint={t("fin.perYear")} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={TrendingUp}>{t("analytics.revenueTrend")}</SectionTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name={t("analytics.revenue")} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" name={t("analytics.expenses")} stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Gauge}>{t("analytics.yieldByUnit")}</SectionTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.map((r) => ({ name: r.property.city, yield: Number((r.y.netYield * 100).toFixed(2)) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} unit="%" />
                <Tooltip formatter={(v: any) => `${v} %`} />
                <Bar dataKey="yield" name={t("fin.netYield")} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <SectionTitle icon={Gauge}>{t("analytics.scoreboard")}</SectionTitle>
        <Table
          columns={[t("common.property"), t("forecast.score"), t("fin.netYield"), t("finance.occupancy"), t("unit.energy"), t("fin.cashFlow")]}
          rows={rows.map((r) => [
            <div>
              <div className="font-medium">{r.property.title}</div>
              <div className="text-xs text-muted-foreground">{r.property.city}</div>
            </div>,
            <Badge tone={r.score.grade === "A" || r.score.grade === "B" ? "green" : r.score.grade === "C" ? "amber" : "red"}>
              <span className="tabular-nums">{r.score.total} · {r.score.grade}</span>
            </Badge>,
            <span className="tabular-nums">{percent(r.y.netYield * 100, 2)}</span>,
            <span className="tabular-nums">{percent((1 - r.eco.vacancyRate) * 100, 0)}</span>,
            <Badge tone={["A", "B", "C"].includes(r.property.energy?.grade) ? "green" : r.property.energy?.grade === "D" ? "amber" : "red"}>
              {r.property.energy?.grade || "—"}
            </Badge>,
            <span className={`tabular-nums ${r.y.cashFlow >= 0 ? "text-success" : "text-destructive"}`}>{money(r.y.cashFlow)}</span>,
          ])}
        />
      </Card>

      <Card className="mt-5">
        <SectionTitle icon={Percent}>{t("finance.leversTitle")}</SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground text-pretty">{t("finance.leversHint")}</p>
        <div className="space-y-3">
          {levers.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
              <span className="text-sm font-medium text-balance">{l.label}</span>
              <span className={`text-lg font-bold tabular-nums ${l.deltaMoney >= 0 ? "text-success" : "text-destructive"}`}>
                {l.deltaMoney >= 0 ? "+" : ""}{money(l.deltaMoney)}
                <span className="text-xs font-normal text-muted-foreground"> / {t("finance.year")}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-5">
        <SectionTitle icon={Gauge}>{t("analytics.weakest")}</SectionTitle>
        {(() => {
          const worst = [...rows].sort((a, b) => a.score.total - b.score.total)[0];
          return (
            <>
              <p className="mb-3 text-sm">
                <span className="font-medium">{worst.property.title}</span>
                <span className="text-muted-foreground"> — {worst.score.total}/100</span>
              </p>
              <div className="space-y-2.5">
                {worst.score.factors.map((f: any) => (
                  <div key={f.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{f.label[locale] || f.label.fr}</span>
                      <span className="text-muted-foreground tabular-nums">{f.detail[locale] || f.detail.fr}</span>
                    </div>
                    <Progress value={f.value} tone={f.value >= 70 ? "green" : f.value >= 45 ? "amber" : "red"} />
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </Card>

      <div className="mt-5">
        <Alert tone="blue" icon={Info} title={t("analytics.methodTitle")}>
          {t("analytics.methodBody")}
        </Alert>
      </div>
    </Page>
  );
}
