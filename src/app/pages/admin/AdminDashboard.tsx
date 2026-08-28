import { Link } from "react-router";
import { Users, Building2, FileCheck, Wallet, ShieldAlert, ArrowRight, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck } from "@/app/store/AppStore";
import { getMarket } from "@/app/config/markets";
import { Page, PageHeader, Card, StatCard, Badge, SectionTitle, Button, Alert } from "@/app/components/common/ui";

export function AdminDashboard() {
  const { t, locale, money, date, tv } = useI18n();
  const { db } = useStore();

  const activeLeases = db.leases.filter((l: any) => l.status !== "ended");
  const gmv = db.payments.filter((p: any) => p.status === "paid").reduce((a: number, p: any) => a + p.amount, 0);

  const roleData = ["tenant", "landlord", "agent", "admin"].map((r) => ({
    name: t(`role.${r}`),
    value: db.users.filter((u: any) => u.role === r).length,
  }));
  const COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-2)", "var(--chart-4)"];

  const marketData = ["FR", "QC"].map((code) => ({
    name: code === "FR" ? "France" : "Québec",
    [t("nav.users")]: db.users.filter((u: any) => u.market === code).length,
    [t("nav.properties")]: db.properties.filter((p: any) => p.market === code).length,
  }));

  // Anomalies de conformité tous marchés confondus
  const issues = db.properties.flatMap((p: any) => {
    const found = complianceCheck(p, getMarket(p.market));
    return found.map((i: any) => ({ ...i, property: p }));
  });
  const blocking = issues.filter((i: any) => i.level === "blocking");

  return (
    <Page wide>
      <PageHeader
        title={t("admin.title")}
        subtitle={locale === "fr" ? "Vue consolidée France + Canada" : "Consolidated view, France + Canada"}
        action={
          <Link to="/admin/users">
            <Button variant="accent" icon={Users}>{t("admin.createUser")}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label={t("admin.kpi.users")} value={db.users.length} tone="blue" delta="+4" />
        <StatCard icon={Building2} label={t("admin.kpi.properties")} value={db.properties.length} tone="orange" />
        <StatCard icon={FileCheck} label={t("admin.kpi.leases")} value={activeLeases.length} tone="green" />
        <StatCard icon={Wallet} label={t("admin.kpi.gmv")} value={money(gmv)} tone="violet" hint={locale === "fr" ? "Cumul encaissé (démo)" : "Collected to date (demo)"} />
      </div>

      {blocking.length > 0 && (
        <div className="mb-6">
          <Alert tone="red" icon={ShieldAlert} title={`${blocking.length} ${t("admin.compliance.blocking").toLowerCase()}`}>
            {locale === "fr"
              ? "Des biens ne peuvent pas être mis en location en l'état. Consultez le tableau de conformité."
              : "Some properties cannot legally be let as they stand. See the compliance board."}
            <div className="mt-3">
              <Link to="/admin/compliance">
                <Button size="sm" variant="danger" icon={ArrowRight}>{t("admin.compliance.title")}</Button>
              </Link>
            </div>
          </Alert>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <SectionTitle icon={Building2}>{locale === "fr" ? "Répartition par marché" : "Breakdown by market"}</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={marketData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey={t("nav.users")} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey={t("nav.properties")} fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon={Users}>{locale === "fr" ? "Types de comptes" : "Account types"}</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {roleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={Activity} right={<Link to="/admin/audit" className="text-sm text-primary">{t("common.view")}</Link>}>
          {t("admin.audit.title")}
        </SectionTitle>
        <div className="space-y-3">
          {db.audit.slice(0, 5).map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 text-sm">
              <Badge tone="neutral">{a.action}</Badge>
              <div className="flex-1">
                <div>{tv(a.detail)}</div>
                <div className="text-xs text-muted-foreground">{date(a.at)} · {a.ip}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}
