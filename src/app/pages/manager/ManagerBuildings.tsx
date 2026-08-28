import { useMemo, useState } from "react";
import {
  Building2, Wrench, Users, Scale, TrendingUp, ArrowLeft, Gauge,
  Layers, ShieldCheck, AlertTriangle, Calendar, Banknote,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck } from "@/app/store/AppStore";
import { computeYields, performanceScore, amortizationByYear, amortization, runScenario, DEFAULT_SCENARIOS } from "@/app/lib/finance";
import { forecastWorks, recommendRent } from "@/app/lib/assist";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Progress,
  Tabs, Table, EmptyState, StatCard, Alert, toneSolid,
} from "@/app/components/common/ui";

export function ManagerBuildings() {
  const { t, market } = useI18n();
  const store = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  const buildings = store.db.buildings.filter((b: any) => b.market === market);

  if (selected) {
    return <BuildingDetail id={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <Page wide>
      <PageHeader title={t("nav.buildings")} subtitle={t("buildings.subtitle")} />

      {buildings.length === 0 ? (
        <EmptyState label={t("buildings.empty")} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buildings.map((b: any) => {
            const units = store.unitsOfBuilding(b.id);
            const occupied = units.filter((u: any) => u.status === "occupied").length;
            return (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-balance">{b.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{b.address}</p>
                  </div>
                  <Badge tone={b.coownership ? "violet" : "neutral"}>
                    {b.coownership ? t("buildings.coownership") : t("buildings.soleOwner")}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <div className="text-lg font-bold tabular-nums">{b.yearBuilt}</div>
                    <div className="text-xs text-muted-foreground">{t("buildings.year")}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <div className="text-lg font-bold tabular-nums">{b.unitsTotal}</div>
                    <div className="text-xs text-muted-foreground">{t("buildings.lots")}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <div className="text-lg font-bold tabular-nums">{units.length}</div>
                    <div className="text-xs text-muted-foreground">{t("buildings.managed")}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{b.heating}</span>
                  <span className="tabular-nums">{occupied}/{units.length} {t("buildings.occupied")}</span>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setSelected(b.id)}>
                  {t("buildings.openFile")}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Dossier intelligent                                                 */
/* ------------------------------------------------------------------ */

function BuildingDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, tv, locale, m, money, date, percent } = useI18n();
  const store = useStore();
  const [tab, setTab] = useState("financial");

  const b = store.getBuilding(id);
  const units = store.unitsOfBuilding(id);
  const tickets = store.db.tickets.filter((x: any) => units.some((u: any) => u.id === x.propertyId));
  const invoices = store.db.invoices.filter((x: any) => units.some((u: any) => u.id === x.propertyId));

  if (!b) return <Page><EmptyState label={t("buildings.empty")} /></Page>;

  return (
    <Page wide>
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> {t("common.back")}
      </button>

      <PageHeader title={b.name} subtitle={b.address} />

      <Tabs
        items={[
          { id: "financial", label: t("file.financial") },
          { id: "technical", label: t("file.technical") },
          { id: "tenant", label: t("file.tenant") },
          { id: "legal", label: t("file.legal") },
          { id: "forecast", label: t("file.forecast") },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-5">
        {tab === "financial" && <FinancialFile building={b} units={units} invoices={invoices} />}
        {tab === "technical" && <TechnicalFile building={b} tickets={tickets} />}
        {tab === "tenant" && <TenantFile units={units} />}
        {tab === "legal" && <LegalFile building={b} units={units} />}
        {tab === "forecast" && <ForecastFile building={b} units={units} tickets={tickets} />}
      </div>
    </Page>
  );
}

/* ---------------------------------------------------------- Financier */

function FinancialFile({ building, units, invoices }: any) {
  const { t, tv, money, percent, date } = useI18n();
  const store = useStore();

  const agg = useMemo(() => {
    let gross = 0, noi = 0, debt = 0, cash = 0, invested = 0;
    const rows: any[] = [];
    units.forEach((u: any) => {
      const eco = store.economicsOf(u.id);
      if (!eco) return;
      const y = computeYields({ rent: u.rent, charges: u.charges, ...eco });
      gross += y.grossRent; noi += y.noi; debt += y.debtService; cash += y.cashFlow; invested += y.totalInvested;
      rows.push({ unit: u, y });
    });
    return { gross, noi, debt, cash, invested, rows, netYield: invested ? noi / invested : 0 };
  }, [units, store]);

  const loanRows = useMemo(() => {
    const eco = store.economicsOf(units[0]?.id);
    if (!eco) return [];
    return amortizationByYear(amortization(eco.loanPrincipal, eco.loanRate, eco.loanYears)).slice(0, 8);
  }, [units, store]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Banknote} label={t("fin.grossRent")} value={<span className="tabular-nums">{money(agg.gross)}</span>} tone="blue" hint={t("fin.perYear")} />
        <StatCard icon={TrendingUp} label={t("fin.noi")} value={<span className="tabular-nums">{money(agg.noi)}</span>} tone="green" hint={t("fin.noiHint")} />
        <StatCard icon={Gauge} label={t("fin.netYield")} value={<span className="tabular-nums">{percent(agg.netYield * 100, 2)}</span>} tone="orange" />
        <StatCard
          icon={Layers}
          label={t("fin.cashFlow")}
          value={<span className="tabular-nums">{money(agg.cash)}</span>}
          tone={agg.cash >= 0 ? "green" : "red"}
          hint={t("fin.afterDebt")}
        />
      </div>

      <Card>
        <SectionTitle icon={Layers}>{t("fin.byUnit")}</SectionTitle>
        <Table
          columns={[t("common.property"), t("fin.rent"), t("fin.noi"), t("fin.debtService"), t("fin.cashFlow"), "DSCR"]}
          rows={agg.rows.map(({ unit, y }: any) => [
            <span className="font-medium">{unit.title}</span>,
            <span className="tabular-nums">{money(unit.rent)}</span>,
            <span className="tabular-nums">{money(y.noi)}</span>,
            <span className="tabular-nums">{money(y.debtService)}</span>,
            <span className={`tabular-nums ${y.cashFlow >= 0 ? "text-success" : "text-destructive"}`}>{money(y.cashFlow)}</span>,
            <Badge tone={y.dscr >= 1.25 ? "green" : y.dscr >= 1 ? "amber" : "red"}>
              <span className="tabular-nums">{y.dscr === Infinity ? "—" : y.dscr.toFixed(2)}</span>
            </Badge>,
          ])}
        />
        <p className="text-xs text-muted-foreground mt-3 text-pretty">{t("fin.dscrHint")}</p>
      </Card>

      {loanRows.length > 0 && (
        <Card>
          <SectionTitle icon={Calendar}>{t("fin.schedule")}</SectionTitle>
          <Table
            columns={[t("fin.year"), t("fin.payment"), t("fin.interest"), t("fin.principal"), t("fin.balance")]}
            rows={loanRows.map((r: any) => [
              <span className="tabular-nums">{r.year}</span>,
              <span className="tabular-nums">{money(r.payment)}</span>,
              <span className="tabular-nums text-muted-foreground">{money(r.interest)}</span>,
              <span className="tabular-nums">{money(r.principal)}</span>,
              <span className="tabular-nums">{money(r.balance)}</span>,
            ])}
          />
        </Card>
      )}

      <Card>
        <SectionTitle icon={Banknote}>{t("fin.invoices")}</SectionTitle>
        <Table
          columns={[t("common.date"), t("fin.label"), t("fin.provider"), t("fin.amount"), t("fin.recoverable"), t("common.status")]}
          rows={invoices.map((i: any) => [
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
    </div>
  );
}

/* ---------------------------------------------------------- Technique */

function TechnicalFile({ building, tickets }: any) {
  const { t, tv, money, date, locale } = useI18n();
  const now = new Date().getFullYear();

  const equipment = Object.entries(building.equipment || {}) as [string, number][];
  const labels: Record<string, string> = {
    boiler: t("equip.boiler"), roof: t("equip.roof"), facade: t("equip.facade"),
    windows: t("equip.windows"), electrical: t("equip.electrical"),
    elevator: t("equip.elevator"), plumbing: t("equip.plumbing"),
  };
  const lifespan: Record<string, number> = { boiler: 18, roof: 40, facade: 15, windows: 30, electrical: 35, elevator: 25, plumbing: 45 };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={Building2}>{t("tech.identity")}</SectionTitle>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            [t("buildings.year"), building.yearBuilt],
            [t("tech.floors"), building.floors],
            [t("tech.structure"), building.structure],
            [t("tech.heating"), building.heating],
            [t("tech.syndic"), building.syndic || t("buildings.soleOwner")],
            [t("tech.commonAreas"), (building.commonAreas || []).join(", ")],
          ].map(([k, v], i) => (
            <div key={i} className="flex justify-between gap-4 border-b border-border pb-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <SectionTitle icon={Wrench}>{t("tech.equipment")}</SectionTitle>
        <p className="text-xs text-muted-foreground mb-4 text-pretty">{t("tech.equipmentHint")}</p>
        <div className="space-y-3">
          {equipment.map(([key, year]) => {
            const life = lifespan[key] || 25;
            const used = Math.min(100, ((now - year) / life) * 100);
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{labels[key] || key}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {year} · {t("tech.remaining", { n: Math.max(0, year + life - now) })}
                  </span>
                </div>
                <Progress value={used} tone={used > 85 ? "red" : used > 65 ? "orange" : "green"} />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <SectionTitle icon={Wrench}>{t("tech.worksDone")}</SectionTitle>
          {(building.worksDone || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("tech.noWorks")}</p>
          ) : (
            <ul className="space-y-2.5">
              {building.worksDone.map((w: any, i: number) => (
                <li key={i} className="flex justify-between gap-3 text-sm border-b border-border pb-2">
                  <span className="text-pretty">{tv(w.label)}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">{w.year} · {money(w.cost)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle icon={AlertTriangle}>{t("tech.interventions")}</SectionTitle>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("tech.noIntervention")}</p>
          ) : (
            <ul className="space-y-2.5">
              {tickets.slice(0, 6).map((x: any) => (
                <li key={x.id} className="text-sm border-b border-border pb-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-pretty">{tv(x.title)}</span>
                    <Badge tone={x.status === "resolved" ? "green" : x.priority === "urgent" ? "red" : "amber"}>
                      {t(`ticket.${x.status}`)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums mt-0.5">{date(x.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Locataire */

function TenantFile({ units }: any) {
  const { t, money, date } = useI18n();
  const store = useStore();

  return (
    <div className="space-y-5">
      {units.map((u: any) => {
        const lease = store.db.leases.find((l: any) => l.propertyId === u.id);
        const tenant = lease ? store.getUser(lease.tenantId) : null;
        const payments = lease ? store.paymentsOfLease(lease.id) : [];
        const late = payments.filter((p: any) => p.status === "late" || p.status === "unpaid");

        return (
          <Card key={u.id}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-balance">{u.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {u.area} {t("unit.area")} · <span className="tabular-nums">{money(u.rent)}</span> {t("unit.perMonth")}
                </p>
              </div>
              <Badge tone={u.status === "occupied" ? "green" : "amber"}>{t(`propertyStatus.${u.status}`)}</Badge>
            </div>

            {tenant ? (
              <>
                <dl className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
                  <div className="p-3 rounded-xl bg-muted">
                    <dt className="text-xs text-muted-foreground">{t("tenantFile.occupant")}</dt>
                    <dd className="font-medium">{tenant.firstName} {tenant.lastName}</dd>
                  </div>
                  <div className="p-3 rounded-xl bg-muted">
                    <dt className="text-xs text-muted-foreground">{t("tenantFile.leaseEnd")}</dt>
                    <dd className="font-medium tabular-nums">{lease.endDate ? date(lease.endDate) : "—"}</dd>
                  </div>
                  <div className="p-3 rounded-xl bg-muted">
                    <dt className="text-xs text-muted-foreground">{t("tenantFile.arrears")}</dt>
                    <dd className={`font-medium tabular-nums ${late.length ? "text-destructive" : ""}`}>
                      {late.length ? money(late.reduce((a: number, p: any) => a + p.amount, 0)) : t("common.none")}
                    </dd>
                  </div>
                </dl>

                <Table
                  columns={[t("common.date"), t("fin.amount"), t("common.status")]}
                  rows={payments.slice(0, 6).map((p: any) => [
                    <span className="tabular-nums">{date(p.date)}</span>,
                    <span className="tabular-nums">{money(p.amount)}</span>,
                    <Badge tone={p.status === "paid" ? "green" : p.status === "late" ? "amber" : "red"}>{t(`payment.${p.status}`)}</Badge>,
                  ])}
                  empty={t("tenantFile.noPayment")}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("tenantFile.vacant")}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- Juridique */

function LegalFile({ building, units }: any) {
  const { t, tv, m, date } = useI18n();

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={ShieldCheck}>{t("legalFile.insurance")}</SectionTitle>
        <dl className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-muted">
            <dt className="text-xs text-muted-foreground">{t("legalFile.insurer")}</dt>
            <dd className="font-medium">{building.insurance?.insurer}</dd>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <dt className="text-xs text-muted-foreground">{t("legalFile.policy")}</dt>
            <dd className="font-medium">{building.insurance?.policy}</dd>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <dt className="text-xs text-muted-foreground">{t("legalFile.renewal")}</dt>
            <dd className="font-medium tabular-nums">{building.insurance?.renewal ? date(building.insurance.renewal) : "—"}</dd>
          </div>
        </dl>
      </Card>

      {units.map((u: any) => {
        const issues = complianceCheck(u, m);
        return (
          <Card key={u.id}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-balance">{u.title}</h3>
              <Badge tone={issues.some((i: any) => i.level === "blocking") ? "red" : issues.length ? "amber" : "green"}>
                {issues.length ? t("compliance.issues", { n: issues.length }) : t("compliance.ok")}
              </Badge>
            </div>

            {issues.length > 0 && (
              <div className="space-y-2 mb-4">
                {issues.map((i: any, k: number) => (
                  <Alert key={k} tone={i.level === "blocking" ? "red" : "amber"} icon={AlertTriangle} title={t(`compliance.${i.level}`)}>
                    {tv(i)}
                  </Alert>
                ))}
              </div>
            )}

            <h4 className="text-sm font-semibold mb-2">{t("legalFile.mandatoryDocs")}</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {(m.mandatoryDocs || []).map((doc: any) => {
                const value = u.legal?.diagnostics?.[doc.id];
                const state = value === undefined ? "na" : value === null ? "missing" : "ok";
                return (
                  <div key={doc.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted text-sm">
                    <span className="text-pretty">{tv(doc)}</span>
                    {state === "ok" && <Badge tone="green"><span className="tabular-nums">{date(value)}</span></Badge>}
                    {state === "missing" && <Badge tone="red">{t("legalFile.missing")}</Badge>}
                    {state === "na" && <span className="text-xs text-muted-foreground">{t("legalFile.na")}</span>}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- Prévision */

function ForecastFile({ building, units, tickets }: any) {
  const { t, tv, locale, money, percent, m } = useI18n();
  const store = useStore();
  const [scenario, setScenario] = useState<"pessimistic" | "realistic" | "optimistic">("realistic");

  const works = useMemo(() => forecastWorks(building, tickets), [building, tickets]);

  const results = useMemo(() => {
    const unit = units[0];
    const eco = unit ? store.economicsOf(unit.id) : null;
    if (!unit || !eco) return null;
    const input = { rent: unit.rent, charges: unit.charges, ...eco };
    return {
      unit,
      pessimistic: runScenario(input, "pessimistic", DEFAULT_SCENARIOS.pessimistic),
      realistic: runScenario(input, "realistic", DEFAULT_SCENARIOS.realistic),
      optimistic: runScenario(input, "optimistic", DEFAULT_SCENARIOS.optimistic),
    };
  }, [units, store]);

  const score = useMemo(() => {
    const unit = units[0];
    const eco = unit ? store.economicsOf(unit.id) : null;
    if (!unit || !eco) return null;
    const y = computeYields({ rent: unit.rent, charges: unit.charges, ...eco });
    const open = tickets.filter((x: any) => x.status !== "resolved").length;
    return performanceScore({
      netYield: y.netYield,
      occupancyRate: 1 - eco.vacancyRate,
      unpaidRate: eco.unpaidRate,
      tenantSatisfaction: unit.ratings?.overall || 3.5,
      avgResolutionDays: 4.2,
      energyGrade: unit.energy?.grade || "D",
      openTickets: open,
    });
  }, [units, tickets, store]);

  const advice = units[0] ? recommendRent(units[0], m) : null;
  const active = results ? results[scenario] : null;

  return (
    <div className="space-y-5">
      {score && (
        <Card>
          <SectionTitle icon={Gauge}>{t("forecast.score")}</SectionTitle>
          <div className="flex items-center gap-5 mb-4">
            <div className={`size-20 rounded-2xl grid place-items-center shrink-0 ${toneSolid(score.total >= 68 ? "green" : score.total >= 54 ? "orange" : "red")}`}>
              <div className="text-2xl font-bold tabular-nums leading-none">{score.total}</div>
              <div className="text-xs opacity-90">{score.grade}</div>
            </div>
            <p className="text-sm text-muted-foreground text-pretty">{t("forecast.scoreHint")}</p>
          </div>
          <div className="space-y-2.5">
            {score.factors.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{f.label[locale] || f.label.fr} <span className="text-xs text-muted-foreground">({Math.round(f.weight * 100)} %)</span></span>
                  <span className="text-muted-foreground tabular-nums">{f.detail[locale] || f.detail.fr}</span>
                </div>
                <Progress value={f.value} tone={f.value >= 70 ? "green" : f.value >= 45 ? "orange" : "red"} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle icon={Wrench}>{t("forecast.works")}</SectionTitle>
        <p className="text-xs text-muted-foreground mb-3 text-pretty">{t("forecast.worksHint")}</p>
        {works.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("forecast.noWorks")}</p>
        ) : (
          <Table
            columns={[t("forecast.item"), t("forecast.dueYear"), t("forecast.cost"), t("forecast.confidence"), t("forecast.basis")]}
            rows={works.map((w) => [
              w.item[locale] || w.item.fr,
              <span className="tabular-nums">{w.dueYear}</span>,
              <span className="tabular-nums">{money(w.estimatedCost)}</span>,
              <Badge tone={w.confidence === "high" ? "red" : w.confidence === "medium" ? "amber" : "neutral"}>{t(`confidence.${w.confidence}`)}</Badge>,
              <span className="text-xs text-muted-foreground text-pretty">{w.basis[locale] || w.basis.fr}</span>,
            ])}
          />
        )}
      </Card>

      {advice && (
        <Card>
          <SectionTitle icon={TrendingUp}>{t("forecast.rentAdvice")}</SectionTitle>
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <span className="text-3xl font-bold tabular-nums">{money(advice.recommended)}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {money(advice.floor)} – {money(advice.ceiling)}
            </span>
            {advice.capped && <Badge tone="red">{t("forecast.capped")}</Badge>}
          </div>
          <ul className="space-y-1.5">
            {advice.reasons.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2 text-pretty">
                <span className="text-secondary">•</span>{r[locale] || r.fr}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {active && results && (
        <Card>
          <SectionTitle icon={TrendingUp}>{t("forecast.scenarios")}</SectionTitle>
          <Tabs
            items={[
              { id: "pessimistic", label: t("scenario.pessimistic") },
              { id: "realistic", label: t("scenario.realistic") },
              { id: "optimistic", label: t("scenario.optimistic") },
            ]}
            value={scenario}
            onChange={(v: any) => setScenario(v)}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
            <StatCard label={t("forecast.cumulativeCash")} value={<span className="tabular-nums">{money(active.cumulativeCashFlow)}</span>} tone={active.cumulativeCashFlow >= 0 ? "green" : "red"} />
            <StatCard label={t("forecast.resale")} value={<span className="tabular-nums">{money(active.netResale)}</span>} tone="blue" hint={t("forecast.resaleHint")} />
            <StatCard label="TRI / IRR" value={<span className="tabular-nums">{active.irr != null ? percent(active.irr * 100, 2) : "—"}</span>} tone="orange" />
            <StatCard label="VAN / NPV" value={<span className="tabular-nums">{money(active.npv)}</span>} tone={active.npv >= 0 ? "green" : "red"} hint={t("forecast.npvHint")} />
          </div>
          <Table
            columns={[t("fin.year"), t("fin.rent"), t("fin.costs"), t("fin.debtService"), t("fin.cashFlow")]}
            rows={active.perYear.map((r) => [
              <span className="tabular-nums">{r.year}</span>,
              <span className="tabular-nums">{money(r.rent)}</span>,
              <span className="tabular-nums text-muted-foreground">{money(r.costs)}</span>,
              <span className="tabular-nums text-muted-foreground">{money(r.debt)}</span>,
              <span className={`tabular-nums ${r.cashFlow >= 0 ? "text-success" : "text-destructive"}`}>{money(r.cashFlow)}</span>,
            ])}
          />
          <p className="text-xs text-muted-foreground mt-3 text-pretty">{t("forecast.disclaimer")}</p>
        </Card>
      )}
    </div>
  );
}
