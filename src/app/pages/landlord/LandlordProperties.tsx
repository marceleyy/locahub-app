import { useMemo, useState } from "react";
import {
  Building2, MapPin, Gauge, AlertTriangle, Users, Wrench, Search,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck } from "@/app/store/AppStore";
import { computeYields, performanceScore } from "@/app/lib/finance";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Input, Select, StatCard, Progress, Tabs, EmptyState, Alert, ChipGroup,
} from "@/app/components/common/ui";

export function LandlordProperties() {
  const { t, tv, locale, money, percent, market, m } = useI18n();
  const store = useStore();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const owner = store.activeUserOfRole("landlord", market);
  const properties = useMemo(() => {
    if (!owner) return [];
    let list = store.propertiesOfOwner(owner.id).filter((p: any) => p.market === market);
    if (status !== "all") list = list.filter((p: any) => p.status === status);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p: any) => `${p.title} ${p.city} ${p.address}`.toLowerCase().includes(q));
    }
    return list;
  }, [store, owner, market, status, query]);

  if (!owner) return <Page><EmptyState label={t("dashboard.noOwner")} /></Page>;

  return (
    <Page wide>
      <PageHeader
        title={t("nav.properties")}
        subtitle={t("properties.subtitle", { market: tv(m.name) })}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder={t("properties.search")} className="pl-9" aria-label={t("properties.search")} />
        </div>
        <ChipGroup
          ariaLabel={t("common.status")}
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: t("common.all") },
            { value: "occupied", label: t("propertyStatus.occupied") },
            { value: "available", label: t("propertyStatus.available") },
          ]}
        />
      </div>

      {properties.length === 0 ? (
        <EmptyState label={t("properties.empty")} description={t("properties.emptyHint")} />
      ) : (
        <div className="space-y-4">
          {properties.map((p: any) => (
            <PropertyCard
              key={p.id}
              property={p}
              open={openId === p.id}
              onToggle={() => setOpenId(openId === p.id ? null : p.id)}
            />
          ))}
        </div>
      )}
    </Page>
  );
}

function PropertyCard({ property, open, onToggle }: any) {
  const { t, tv, locale, money, percent, date, m, market } = useI18n();
  const store = useStore();
  const [tab, setTab] = useState("finance");

  const eco = store.economicsOf(property.id);
  const yields = eco ? computeYields({ rent: property.rent, charges: property.charges, ...eco }) : null;
  const lease = store.db.leases.find((l: any) => l.propertyId === property.id);
  const tenant = lease ? store.getUser(lease.tenantId) : null;
  const tickets = store.ticketsOfProperty(property.id);
  const issues = complianceCheck(property, m);
  const blocking = issues.filter((i: any) => i.level === "blocking");

  const score = useMemo(() => {
    if (!yields || !eco) return null;
    return performanceScore({
      netYield: yields.netYield,
      occupancyRate: 1 - eco.vacancyRate,
      unpaidRate: eco.unpaidRate,
      tenantSatisfaction: property.ratings?.overall || 3.5,
      avgResolutionDays: 4.2,
      energyGrade: property.energy?.grade || "D",
      openTickets: tickets.filter((x: any) => x.status !== "resolved").length,
    });
  }, [yields, eco, property, tickets]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-balance">{property.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />{property.address}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {score && <Badge tone={score.grade === "A" || score.grade === "B" ? "green" : score.grade === "C" ? "amber" : "red"}>{t("forecast.score")} {score.grade}</Badge>}
          <Badge tone={property.status === "occupied" ? "green" : "amber"}>{t(`propertyStatus.${property.status}`)}</Badge>
          {blocking.length > 0 && <Badge tone="red"><AlertTriangle className="size-3" />{t("compliance.blocking")}</Badge>}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Building2} label={t("unit.surface")} value={`${property.area} ${t("unit.area")}`} tone="blue" />
        <StatCard icon={Users} label={t("unit.rent")} value={money(property.rent)} tone="orange" />
        {yields && <StatCard icon={Gauge} label={t("fin.netYield")} value={percent(yields.netYield * 100, 2)} tone="green" />}
        {yields && (
          <StatCard
            icon={Wrench}
            label={t("fin.cashFlow")}
            value={money(yields.cashFlow)}
            tone={yields.cashFlow >= 0 ? "green" : "red"}
          />
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onToggle}>
        {open ? t("properties.collapse") : t("properties.expand")}
      </Button>

      {open && (
        <div className="mt-4 border-t border-border pt-4">
          <Tabs
            items={[
              { id: "finance", label: t("file.financial") },
              { id: "tenant", label: t("file.tenant") },
              { id: "legal", label: t("file.legal") },
            ]}
            value={tab}
            onChange={setTab}
          />

          <div className="mt-4">
            {tab === "finance" && yields && (
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                {[
                  [t("fin.grossRent"), money(yields.grossRent)],
                  [t("fin.operatingExpenses"), money(yields.operatingExpenses)],
                  [t("fin.noi"), money(yields.noi)],
                  [t("fin.debtService"), money(yields.debtService)],
                  ["DSCR", yields.dscr === Infinity ? "—" : yields.dscr.toFixed(2)],
                  [t("fin.netYield"), percent(yields.netYield * 100, 2)],
                ].map(([k, v], i) => (
                  <div key={i} className="flex justify-between gap-3 rounded-xl bg-muted p-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {tab === "tenant" && (
              tenant && lease ? (
                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  {[
                    [t("tenantFile.occupant"), `${tenant.firstName} ${tenant.lastName}`],
                    [t("lease.startDate"), date(lease.startDate)],
                    [t("tenantFile.leaseEnd"), lease.endDate ? date(lease.endDate) : "—"],
                    [t("lease.deposit"), lease.deposit > 0 ? money(lease.deposit) : t("lease.noDeposit")],
                  ].map(([k, v], i) => (
                    <div key={i} className="flex justify-between gap-3 rounded-xl bg-muted p-3">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-medium tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">{t("tenantFile.vacant")}</p>
              )
            )}

            {tab === "legal" && (
              issues.length === 0 ? (
                <p className="text-sm text-success">{t("compliance.ok")}</p>
              ) : (
                <div className="space-y-2">
                  {issues.map((i: any, k: number) => (
                    <Alert key={k} tone={i.level === "blocking" ? "red" : "amber"} icon={AlertTriangle} title={t(`compliance.${i.level}`)}>
                      {tv(i)}
                    </Alert>
                  ))}
                </div>
              )
            )}
          </div>

          {score && (
            <div className="mt-5">
              <SectionTitle icon={Gauge}>{t("forecast.score")}</SectionTitle>
              <div className="space-y-2.5">
                {score.factors.map((f) => (
                  <div key={f.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{f.label[locale] || f.label.fr}</span>
                      <span className="text-muted-foreground tabular-nums">{f.detail[locale] || f.detail.fr}</span>
                    </div>
                    <Progress value={f.value} tone={f.value >= 70 ? "green" : f.value >= 45 ? "amber" : "red"} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
