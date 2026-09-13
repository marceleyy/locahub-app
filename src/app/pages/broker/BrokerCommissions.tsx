import { Percent, Wallet, AlertTriangle, Calculator } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { Page, PageHeader, Card, StatCard, SectionTitle, Table, Badge, Alert } from "@/app/components/common/ui";

export function BrokerCommissions() {
  const { t, locale, money, m } = useI18n();
  const { db, currentUser, getProperty } = useStore();

  const agent = currentUser?.role === "agent" ? currentUser : db.users.find((u: any) => u.role === "agent");
  const portfolio = db.properties.filter((p: any) => p.agentId === agent?.id);
  const rate = (agent?.commissionRate || 7) / 100;

  const managementFees = portfolio.reduce((a: number, p: any) => a + p.rent * rate, 0);
  const lettingFees = portfolio.filter((p: any) => p.status === "available").reduce((a: number, p: any) => a + p.rent * 0.8, 0);

  const monthly = ["03", "04", "05", "06", "07", "08"].map((mth, i) => ({
    month: mth,
    [locale === "fr" ? "Gestion" : "Management"]: Math.round(managementFees * (0.9 + i * 0.02)),
    [locale === "fr" ? "Location" : "Letting"]: Math.round(lettingFees * (i % 3 === 0 ? 1 : 0.3)),
  }));

  const rows = portfolio.map((p: any) => [
    <span className="text-sm font-medium">{p.title}</span>,
    <span className="text-sm">{money(p.rent)}</span>,
    <Badge tone="orange">{(rate * 100).toFixed(1)} %</Badge>,
    <span className="text-sm font-semibold">{money(p.rent * rate)}</span>,
    <span className="text-sm text-muted-foreground">
      {p.market === "FR"
        ? (locale === "fr" ? "Honoraires de location plafonnés par zone" : "Letting fees capped by zone")
        : (locale === "fr" ? "Rétribution libre, contrat de courtage OACIQ" : "Free-to-set, OACIQ brokerage contract")}
    </span>,
  ]);

  return (
    <Page wide>
      <PageHeader title={t("nav.commissions")} subtitle={agent?.agency} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label={locale === "fr" ? "Honoraires de gestion / mois" : "Management fees / month"} value={money(managementFees)} tone="orange" />
        <StatCard icon={Percent} label={locale === "fr" ? "Taux moyen" : "Average rate"} value={`${(rate * 100).toFixed(1)} %`} tone="blue" />
        <StatCard icon={Calculator} label={locale === "fr" ? "Honoraires de location en cours" : "Letting fees in progress"} value={money(lettingFees)} tone="green" />
        <StatCard icon={Wallet} label={locale === "fr" ? "Lots gérés" : "Units managed"} value={portfolio.length} tone="violet" />
      </div>

      <Card className="mb-6">
        <SectionTitle icon={Percent}>{locale === "fr" ? "Évolution des honoraires" : "Fee trend"}</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey={locale === "fr" ? "Gestion" : "Management"} stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
            <Bar dataKey={locale === "fr" ? "Location" : "Letting"} stackId="a" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="mb-5">
        <SectionTitle icon={Wallet}>{locale === "fr" ? "Détail par mandat" : "Breakdown per mandate"}</SectionTitle>
        <Table
          columns={[t("nav.properties"), t("property.rent"), locale === "fr" ? "Taux" : "Rate", t("agent.commission"), t("agent.commissionCap")]}
          rows={rows}
          empty={t("common.empty")}
        />
      </Card>

      <Alert tone="orange" icon={AlertTriangle} title={t("agent.commissionCap")}>
        {locale === "fr"
          ? "France : les honoraires de mise en location facturés au locataire sont plafonnés par mètre carré selon la zone (visite, dossier, rédaction du bail) plus un plafond distinct pour l'état des lieux, et la part locataire ne peut jamais dépasser la part bailleur. Québec : aucun plafond réglementaire, mais toute rétribution de courtage doit figurer dans un contrat écrit conforme à l'OACIQ, et il est interdit d'exiger des frais du locataire pour la simple location d'un logement."
          : "France: letting fees charged to the tenant are capped per square metre by zone (viewing, file, lease drafting) plus a separate cap for the condition report, and the tenant's share can never exceed the landlord's. Quebec: no statutory cap, but any brokerage remuneration must be set out in a written OACIQ-compliant contract, and charging the tenant a fee simply to rent a dwelling is prohibited."}
      </Alert>
    </Page>
  );
}
