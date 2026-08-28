import { useMemo, useState } from "react";
import {
  Banknote, TrendingUp, TrendingDown, Gauge, AlertTriangle, Percent,
  Receipt, ArrowRight, Layers,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { computeYields, whatIf, compareInvoices } from "@/app/lib/finance";
import {
  Page, PageHeader, Card, SectionTitle, Badge, StatCard, Table, Tabs, Alert, Progress, Select, ChipGroup,
} from "@/app/components/common/ui";

export function ManagerFinance() {
  const { t, tv, locale, money, percent, date, market, m } = useI18n();
  const store = useStore();
  const [tab, setTab] = useState("overview");
  const [horizon, setHorizon] = useState("year");

  const units = store.db.properties.filter((p: any) => p.market === market);
  const invoices = store.db.invoices.filter((i: any) => i.market === market);

  const portfolio = useMemo(() => {
    let gross = 0, noi = 0, debt = 0, cash = 0, invested = 0, potential = 0;
    let occupiedCount = 0;
    const rows: any[] = [];
    units.forEach((u: any) => {
      const eco = store.economicsOf(u.id);
      if (!eco) return;
      const y = computeYields({ rent: u.rent, charges: u.charges, ...eco });
      gross += y.grossRent; noi += y.noi; debt += y.debtService;
      cash += y.cashFlow; invested += y.totalInvested; potential += u.rent * 12;
      if (u.status === "occupied") occupiedCount++;
      rows.push({ unit: u, y, eco });
    });
    const occupancy = units.length ? occupiedCount / units.length : 0;
    return {
      gross, noi, debt, cash, invested, potential, occupancy,
      rows,
      grossYield: invested ? gross / invested : 0,
      netYield: invested ? noi / invested : 0,
      unpaidRate: rows.length ? rows.reduce((a, r) => a + r.eco.unpaidRate, 0) / rows.length : 0,
      maintenanceCost: invoices.reduce((a: number, i: any) => a + i.amount, 0),
    };
  }, [units, invoices, store]);

  const divisor = horizon === "day" ? 365 : horizon === "month" ? 12 : 1;
  const per = (v: number) => money(v / divisor);

  const anomalies = useMemo(() => compareInvoices(invoices), [invoices]);

  const levers = useMemo(() => [
    whatIf(portfolio.potential, portfolio.occupancy, 2, t("lever.occupancyUp")),
    whatIf(portfolio.potential, portfolio.occupancy, -2, t("lever.occupancyDown")),
    whatIf(portfolio.potential, 1 - portfolio.unpaidRate, 1, t("lever.arrearsDown")),
  ], [portfolio, t]);

  return (
    <Page wide>
      <PageHeader
        title={t("nav.finance")}
        subtitle={t("finance.subtitle", { market: m.name[locale] || m.name.fr })}
        action={
          <ChipGroup
            ariaLabel={t("finance.horizon")}
            value={horizon}
            onChange={setHorizon}
            options={[
              { value: "day", label: t("finance.perDay") },
              { value: "month", label: t("finance.perMonth") },
              { value: "year", label: t("finance.perYear") },
            ]}
          />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Banknote} label={t("fin.grossRent")} value={<span className="tabular-nums">{per(portfolio.gross)}</span>} tone="blue" />
        <StatCard icon={TrendingUp} label={t("fin.noi")} value={<span className="tabular-nums">{per(portfolio.noi)}</span>} tone="green" />
        <StatCard
          icon={Layers}
          label={t("fin.cashFlow")}
          value={<span className="tabular-nums">{per(portfolio.cash)}</span>}
          tone={portfolio.cash >= 0 ? "green" : "red"}
          hint={t("fin.afterDebt")}
        />
        <StatCard icon={Gauge} label={t("fin.netYield")} value={<span className="tabular-nums">{percent(portfolio.netYield * 100, 2)}</span>} tone="orange" />
      </div>

      <Tabs
        items={[
          { id: "overview", label: t("finance.tab.overview") },
          { id: "levers", label: t("finance.tab.levers") },
          { id: "invoices", label: t("finance.tab.invoices") },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-5 space-y-5">
        {tab === "overview" && (
          <>
            <Card>
              <SectionTitle icon={Layers}>{t("finance.byUnit")}</SectionTitle>
              <Table
                columns={[t("common.property"), t("fin.rent"), t("fin.operatingExpenses"), t("fin.noi"), t("fin.cashFlow"), t("fin.netYield")]}
                rows={portfolio.rows.map(({ unit, y }: any) => [
                  <div>
                    <div className="font-medium">{unit.title}</div>
                    <div className="text-xs text-muted-foreground">{unit.city}</div>
                  </div>,
                  <span className="tabular-nums">{money(unit.rent)}</span>,
                  <span className="tabular-nums text-muted-foreground">{money(y.operatingExpenses)}</span>,
                  <span className="tabular-nums">{money(y.noi)}</span>,
                  <span className={`tabular-nums ${y.cashFlow >= 0 ? "text-success" : "text-destructive"}`}>{money(y.cashFlow)}</span>,
                  <span className="tabular-nums">{percent(y.netYield * 100, 2)}</span>,
                ])}
              />
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <div className="text-sm text-muted-foreground mb-2">{t("finance.occupancy")}</div>
                <div className="text-2xl font-bold tabular-nums mb-2">{percent(portfolio.occupancy * 100, 0)}</div>
                <Progress value={portfolio.occupancy * 100} tone="green" />
              </Card>
              <Card>
                <div className="text-sm text-muted-foreground mb-2">{t("finance.arrears")}</div>
                <div className="text-2xl font-bold tabular-nums mb-2">{percent(portfolio.unpaidRate * 100, 1)}</div>
                <Progress value={portfolio.unpaidRate * 100 * 10} tone="red" />
              </Card>
              <Card>
                <div className="text-sm text-muted-foreground mb-2">{t("finance.maintenanceCost")}</div>
                <div className="text-2xl font-bold tabular-nums mb-2">{money(portfolio.maintenanceCost)}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {units.length ? money(portfolio.maintenanceCost / units.length) : money(0)} {t("finance.perUnit")}
                </div>
              </Card>
            </div>

            <Alert tone="blue" icon={Receipt} title={t("finance.taxTitle")}>
              {market === "FR" ? t("finance.taxFR") : t("finance.taxQC")}
            </Alert>
          </>
        )}

        {tab === "levers" && (
          <>
            <Card>
              <SectionTitle icon={Percent}>{t("finance.leversTitle")}</SectionTitle>
              <p className="text-sm text-muted-foreground mb-4 text-pretty">{t("finance.leversHint")}</p>
              <div className="space-y-3">
                {levers.map((l, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-muted">
                    <div className="flex items-center gap-3 min-w-0">
                      {l.deltaMoney >= 0
                        ? <TrendingUp className="size-5 text-success shrink-0" />
                        : <TrendingDown className="size-5 text-destructive shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-balance">{l.label}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {percent(Math.abs(l.deltaPercent), 0)} → {percent(l.newValue * 100, 1)}
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold tabular-nums shrink-0 ${l.deltaMoney >= 0 ? "text-success" : "text-destructive"}`}>
                      {l.deltaMoney >= 0 ? "+" : ""}{money(l.deltaMoney)}
                      <span className="text-xs font-normal text-muted-foreground"> / {t("finance.year")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle icon={ArrowRight}>{t("finance.actions")}</SectionTitle>
              <ul className="space-y-3">
                {portfolio.rows
                  .filter((r: any) => r.y.cashFlow < 0 || r.y.netYield < 0.03 || r.eco.vacancyRate > 0.06)
                  .map((r: any, i: number) => (
                    <li key={i} className="flex gap-3 text-sm border-b border-border pb-3">
                      <AlertTriangle className="size-4 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{r.unit.title}</div>
                        <p className="text-muted-foreground text-pretty">
                          {r.y.cashFlow < 0 && t("finance.diagNegative") + " "}
                          {r.eco.vacancyRate > 0.06 && t("finance.diagVacancy") + " "}
                          {r.y.netYield < 0.03 && t("finance.diagYield")}
                        </p>
                      </div>
                    </li>
                  ))}
                {portfolio.rows.every((r: any) => r.y.cashFlow >= 0 && r.y.netYield >= 0.03 && r.eco.vacancyRate <= 0.06) && (
                  <li className="text-sm text-muted-foreground">{t("finance.noAction")}</li>
                )}
              </ul>
            </Card>
          </>
        )}

        {tab === "invoices" && (
          <>
            {anomalies.length > 0 && (
              <Card className="border-l-4 border-l-destructive">
                <SectionTitle icon={AlertTriangle}>{t("finance.anomalies")}</SectionTitle>
                <p className="text-sm text-muted-foreground mb-3 text-pretty">{t("finance.anomaliesHint")}</p>
                <div className="space-y-2">
                  {anomalies.map((a, i) => {
                    const inv = invoices.find((x: any) => x.id === a.invoiceId);
                    return (
                      <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-destructive/5">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{inv ? tv(inv.label) : a.invoiceId}</div>
                          <div className="text-xs text-muted-foreground text-pretty">{a.reason[locale] || a.reason.fr}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold tabular-nums">{money(a.observed)}</div>
                          {a.expected > 0 && (
                            <div className="text-xs text-muted-foreground tabular-nums">{t("finance.expected")} {money(a.expected)}</div>
                          )}
                        </div>
                        <Badge tone={a.severity === "high" ? "red" : "amber"}>{t(`severity.${a.severity}`)}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <Card>
              <SectionTitle icon={Receipt}>{t("finance.allInvoices")}</SectionTitle>
              <Table
                columns={[t("common.date"), t("fin.label"), t("fin.provider"), t("common.property"), t("fin.amount"), t("common.status")]}
                rows={[...invoices]
                  .sort((a: any, b: any) => b.date.localeCompare(a.date))
                  .map((i: any) => [
                    <span className="tabular-nums">{date(i.date)}</span>,
                    tv(i.label),
                    store.getProvider(i.providerId)?.name || "—",
                    <span className="text-xs text-muted-foreground">{store.getProperty(i.propertyId)?.city || "—"}</span>,
                    <span className="tabular-nums">{money(i.amount)}</span>,
                    <button onClick={() => store.updateInvoice(i.id, { status: i.status === "paid" ? "unpaid" : "paid" })} aria-label={t("invoice.toggle")}>
                      <Badge tone={i.status === "paid" ? "green" : "red"}>{t(`invoice.${i.status}`)}</Badge>
                    </button>,
                  ])}
              />
            </Card>
          </>
        )}
      </div>
    </Page>
  );
}
