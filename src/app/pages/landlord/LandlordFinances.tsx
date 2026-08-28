import { useMemo, useState } from "react";
import {
  Wallet, TrendingUp, Receipt, Banknote, Calendar, AlertTriangle, Info, Layers,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import {
  computeYields, amortization, amortizationByYear, compareInvoices,
} from "@/app/lib/finance";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Select, StatCard, Table, Tabs, Alert, EmptyState, ChipGroup,
} from "@/app/components/common/ui";

export function LandlordFinances() {
  const { t, tv, locale, money, date, percent, market, m } = useI18n();
  const store = useStore();

  const [tab, setTab] = useState("overview");
  const [horizon, setHorizon] = useState("year");

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
          return { property: p, eco, y: computeYields({ rent: p.rent, charges: p.charges, ...eco }) };
        })
        .filter(Boolean) as any[],
    [properties, store]
  );

  const invoices = useMemo(
    () => store.db.invoices.filter((i: any) => properties.some((p: any) => p.id === i.propertyId)),
    [store.db.invoices, properties]
  );

  const totals = useMemo(() => {
    const gross = rows.reduce((a, r) => a + r.y.grossRent, 0);
    const costs = rows.reduce((a, r) => a + r.y.operatingExpenses, 0);
    const debt = rows.reduce((a, r) => a + r.y.debtService, 0);
    const cash = rows.reduce((a, r) => a + r.y.cashFlow, 0);
    const maintenance = invoices.reduce((a: number, i: any) => a + i.amount, 0);
    const unpaid = invoices.filter((i: any) => i.status === "unpaid").reduce((a: number, i: any) => a + i.amount, 0);
    return { gross, costs, debt, cash, maintenance, unpaid, noi: gross - costs };
  }, [rows, invoices]);

  const divisor = horizon === "day" ? 365 : horizon === "month" ? 12 : 1;
  const per = (v: number) => money(v / divisor);

  const debtSchedule = useMemo(() => {
    const merged = new Map<number, { year: number; interest: number; principal: number; balance: number }>();
    rows.forEach((r) => {
      amortizationByYear(amortization(r.eco.loanPrincipal, r.eco.loanRate, r.eco.loanYears))
        .slice(0, 8)
        .forEach((y) => {
          const cur = merged.get(y.year) || { year: y.year, interest: 0, principal: 0, balance: 0 };
          cur.interest += y.interest; cur.principal += y.principal; cur.balance += y.balance;
          merged.set(y.year, cur);
        });
    });
    return [...merged.values()].sort((a, b) => a.year - b.year);
  }, [rows]);

  const anomalies = useMemo(() => compareInvoices(invoices), [invoices]);

  if (!owner) return <Page><EmptyState label={t("dashboard.noOwner")} /></Page>;
  if (rows.length === 0) return <Page><PageHeader title={t("nav.finances")} /><EmptyState label={t("analytics.empty")} /></Page>;

  return (
    <Page wide>
      <PageHeader
        title={t("nav.finances")}
        subtitle={t("finance.subtitle", { market: tv(m.name) })}
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

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Wallet} label={t("fin.grossRent")} value={per(totals.gross)} tone="blue" />
        <StatCard icon={Receipt} label={t("fin.operatingExpenses")} value={per(totals.costs)} tone="orange" />
        <StatCard icon={Banknote} label={t("fin.debtService")} value={per(totals.debt)} tone="violet" />
        <StatCard
          icon={TrendingUp}
          label={t("fin.cashFlow")}
          value={per(totals.cash)}
          tone={totals.cash >= 0 ? "green" : "red"}
          hint={t("fin.afterDebt")}
        />
      </div>

      <Tabs
        items={[
          { id: "overview", label: t("finance.tab.overview") },
          { id: "debt", label: t("finances.debt") },
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
                columns={[t("common.property"), t("fin.rent"), t("fin.operatingExpenses"), t("fin.debtService"), t("fin.cashFlow"), t("fin.netYield")]}
                rows={rows.map((r) => [
                  <div>
                    <div className="font-medium">{r.property.title}</div>
                    <div className="text-xs text-muted-foreground">{r.property.city}</div>
                  </div>,
                  <span className="tabular-nums">{money(r.property.rent)}</span>,
                  <span className="tabular-nums text-muted-foreground">{money(r.y.operatingExpenses)}</span>,
                  <span className="tabular-nums text-muted-foreground">{money(r.y.debtService)}</span>,
                  <span className={`tabular-nums ${r.y.cashFlow >= 0 ? "text-success" : "text-destructive"}`}>{money(r.y.cashFlow)}</span>,
                  <span className="tabular-nums">{percent(r.y.netYield * 100, 2)}</span>,
                ])}
              />
            </Card>

            <Card>
              <SectionTitle icon={TrendingUp}>{t("finances.breakdown")}</SectionTitle>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows.map((r) => ({
                    name: r.property.city,
                    [t("analytics.revenue")]: Math.round(r.y.grossRent),
                    [t("analytics.expenses")]: Math.round(r.y.operatingExpenses),
                    [t("fin.debtService")]: Math.round(r.y.debtService),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip formatter={(v: any) => money(Number(v))} />
                    <Legend />
                    <Bar dataKey={t("analytics.revenue")} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={t("analytics.expenses")} fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={t("fin.debtService")} fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Alert tone="blue" icon={Info} title={t("finance.taxTitle")}>
              {market === "FR" ? t("finance.taxFR") : t("finance.taxQC")}
            </Alert>
          </>
        )}

        {tab === "debt" && (
          <Card>
            <SectionTitle icon={Calendar}>{t("fin.schedule")}</SectionTitle>
            <Table
              columns={[t("fin.year"), t("fin.interest"), t("fin.principal"), t("fin.balance")]}
              rows={debtSchedule.map((r) => [
                <span className="tabular-nums">{r.year}</span>,
                <span className="tabular-nums text-muted-foreground">{money(r.interest)}</span>,
                <span className="tabular-nums">{money(r.principal)}</span>,
                <span className="tabular-nums">{money(r.balance)}</span>,
              ])}
            />
            <p className="mt-3 text-xs text-muted-foreground text-pretty">{t("finances.debtHint")}</p>
          </Card>
        )}

        {tab === "invoices" && (
          <>
            {anomalies.length > 0 && (
              <Card className="border-l-4 border-l-destructive">
                <SectionTitle icon={AlertTriangle}>{t("finance.anomalies")}</SectionTitle>
                <div className="space-y-2">
                  {anomalies.map((a, i) => {
                    const inv = invoices.find((x: any) => x.id === a.invoiceId);
                    return (
                      <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-destructive/5 p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{inv ? tv(inv.label) : a.invoiceId}</div>
                          <div className="text-xs text-muted-foreground text-pretty">{a.reason[locale] || a.reason.fr}</div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{money(a.observed)}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <Card>
              <SectionTitle
                icon={Receipt}
                right={totals.unpaid > 0 ? <Badge tone="red"><span className="tabular-nums">{money(totals.unpaid)}</span></Badge> : undefined}
              >
                {t("finance.allInvoices")}
              </SectionTitle>
              <Table
                columns={[t("common.date"), t("fin.label"), t("fin.provider"), t("fin.amount"), t("fin.recoverable"), t("common.status")]}
                rows={[...invoices]
                  .sort((a: any, b: any) => b.date.localeCompare(a.date))
                  .map((i: any) => [
                    <span className="tabular-nums">{date(i.date)}</span>,
                    tv(i.label),
                    store.getProvider(i.providerId)?.name || "—",
                    <span className="tabular-nums">{money(i.amount)}</span>,
                    i.recoverable ? <Badge tone="blue">{t("common.yes")}</Badge> : <span className="text-muted-foreground">{t("common.no")}</span>,
                    <Badge tone={i.status === "paid" ? "green" : "red"}>{t(`invoice.${i.status}`)}</Badge>,
                  ])}
                empty={t("fin.noInvoice")}
              />
            </Card>
          </>
        )}
      </div>
    </Page>
  );
}
