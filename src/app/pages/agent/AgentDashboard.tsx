import { Link } from "react-router";
import { Briefcase, CalendarClock, Users, Timer, TrendingUp, AlertTriangle, BadgeCheck, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck } from "@/app/store/AppStore";
import { getMarket } from "@/app/config/markets";
import { Page, PageHeader, Card, StatCard, Badge, SectionTitle, Button, Alert, Avatar, Progress } from "@/app/components/common/ui";

export function AgentDashboard() {
  const { t, locale, money, date, tv } = useI18n();
  const { db, currentUser, getUser, getProperty } = useStore();

  const agent = currentUser?.role === "agent" ? currentUser : db.users.find((u: any) => u.role === "agent");
  const portfolio = db.properties.filter((p: any) => p.agentId === agent?.id);
  const visits = db.visits.filter((v: any) => v.agentId === agent?.id);
  const prospects = db.prospects.filter((p: any) => p.agentId === agent?.id);

  const managedRent = portfolio.reduce((a: number, p: any) => a + p.rent, 0);
  const avgDaysToLet = portfolio.length
    ? Math.round(portfolio.reduce((a: number, p: any) => a + (p.daysToLet || 0), 0) / portfolio.length)
    : 0;
  const converted = prospects.filter((p: any) => ["application", "won"].includes(p.stage)).length;
  const conversion = prospects.length ? Math.round((converted / prospects.length) * 100) : 0;

  const alerts = portfolio.flatMap((p: any) =>
    complianceCheck(p, getMarket(p.market)).map((i: any) => ({ ...i, property: p }))
  );

  const funnel = [
    { stage: locale === "fr" ? "Vues" : "Views", value: portfolio.reduce((a: number, p: any) => a + (p.views || 0), 0) },
    { stage: locale === "fr" ? "Contacts" : "Leads", value: prospects.length * 12 },
    { stage: locale === "fr" ? "Visites" : "Viewings", value: visits.length * 6 },
    { stage: locale === "fr" ? "Dossiers" : "Applications", value: db.applications.length * 3 },
    { stage: locale === "fr" ? "Baux" : "Leases", value: db.leases.filter((l: any) => l.agentId === agent?.id).length * 2 },
  ];

  const upcoming = [...visits].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  return (
    <Page wide>
      <PageHeader
        title={`${t("nav.dashboard")} — ${agent?.firstName || ""} ${agent?.lastName || ""}`}
        subtitle={agent?.agency}
        action={
          <Link to="/agent/pipeline">
            <Button variant="accent" icon={Users}>{t("agent.newProspect")}</Button>
          </Link>
        }
      />

      {agent?.licence && (
        <div className="mb-5">
          <Alert tone="green" icon={BadgeCheck} title={t("agent.licence")}>
            {agent.licence} — {agent.licenceType}
            {agent.licenceExpiry && ` · ${locale === "fr" ? "valide jusqu'au" : "valid until"} ${date(agent.licenceExpiry)}`}
            {agent.financialGuarantee && ` · ${agent.financialGuarantee}`}
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Briefcase} label={t("agent.mandates")} value={portfolio.length} tone="orange" hint={money(managedRent) + " / " + t("common.month")} />
        <StatCard icon={CalendarClock} label={t("agent.visitsToday")} value={visits.filter((v: any) => v.status === "confirmed").length} tone="blue" />
        <StatCard icon={TrendingUp} label={t("agent.conversionRate")} value={`${conversion} %`} tone="green" />
        <StatCard icon={Timer} label={t("agent.avgLettingTime")} value={`${avgDaysToLet} j`} tone="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <SectionTitle icon={TrendingUp}>{locale === "fr" ? "Entonnoir de mise en location" : "Letting funnel"}</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={funnel}>
              <defs>
                <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={2} fill="url(#funnelGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon={CalendarClock} right={<Link to="/agent/visits" className="text-sm text-secondary">{t("common.view")}</Link>}>
            {t("nav.visits")}
          </SectionTitle>
          <div className="space-y-3">
            {upcoming.map((v: any) => {
              const prop = getProperty(v.propertyId);
              const tenant = v.tenantId ? getUser(v.tenantId) : null;
              return (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="text-center shrink-0 w-14">
                    <div className="text-xs text-muted-foreground">{v.date.slice(5, 10).split("-").reverse().join("/")}</div>
                    <div className="font-semibold text-sm">{v.date.slice(11, 16)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{prop?.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {tenant ? `${tenant.firstName} ${tenant.lastName}` : v.type}
                    </div>
                  </div>
                  {tenant && <Avatar user={tenant} size={28} />}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle icon={AlertTriangle}>{t("landlord.alerts")}</SectionTitle>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.compliance.ok")}</p>
          ) : (
            <div className="space-y-2.5">
              {alerts.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-muted/50">
                  <Badge tone={a.level === "blocking" ? "red" : "amber"}>
                    {a.level === "blocking" ? t("admin.compliance.blocking") : t("admin.compliance.warning")}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-muted-foreground">{tv(a)}</div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">{a.property.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={Briefcase} right={<Link to="/agent/portfolio" className="text-sm text-secondary">{t("common.view")}</Link>}>
            {t("nav.portfolio")}
          </SectionTitle>
          <div className="space-y-3">
            {portfolio.slice(0, 4).map((p: any) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="font-medium truncate mr-2">{p.title}</span>
                  <span className="text-muted-foreground shrink-0">{money(p.rent)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={100 - (p.vacancyRisk || 0)} tone={p.vacancyRisk > 30 ? "red" : "green"} height={5} />
                  <span className="text-xs text-muted-foreground w-24 shrink-0 text-right">
                    {t("landlord.vacancyRisk")} {p.vacancyRisk}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/agent/commissions">
              <Button variant="outline" size="sm" icon={ArrowRight}>{t("nav.commissions")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    </Page>
  );
}
