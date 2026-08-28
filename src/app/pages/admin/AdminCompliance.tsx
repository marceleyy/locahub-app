import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, FileText, Ban, Zap, Scale } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck } from "@/app/store/AppStore";
import { getMarket } from "@/app/config/markets";
import { Page, PageHeader, Card, StatCard, Badge, SectionTitle, Tabs, Alert, EmptyState } from "@/app/components/common/ui";

export function AdminCompliance() {
  const { t, locale, tv, m, market } = useI18n();
  const { db } = useStore();
  const [tab, setTab] = useState<string>(market);

  const scoped = db.properties.filter((p: any) => p.market === tab);
  const marketCfg = getMarket(tab as any);

  const rows = scoped.map((p: any) => ({ property: p, issues: complianceCheck(p, marketCfg) }));
  const blocking = rows.filter((r) => r.issues.some((i: any) => i.level === "blocking"));
  const warnings = rows.filter((r) => r.issues.some((i: any) => i.level === "warning") && !r.issues.some((i: any) => i.level === "blocking"));
  const ok = rows.filter((r) => r.issues.length === 0);

  return (
    <Page wide>
      <PageHeader title={t("admin.compliance.title")} subtitle={t("legal.disclaimer")} />

      <Tabs value={tab} onChange={setTab} items={[{ id: "FR", label: "🇫🇷 France" }, { id: "QC", label: "🇨🇦 Canada – Québec" }]} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={ShieldX} label={t("admin.compliance.blocking")} value={blocking.length} tone="red" />
        <StatCard icon={ShieldAlert} label={t("admin.compliance.warning")} value={warnings.length} tone="orange" />
        <StatCard icon={ShieldCheck} label={t("admin.compliance.ok")} value={ok.length} tone="green" />
      </div>

      {/* Règles applicables au marché */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <SectionTitle icon={Ban}>{t("legal.depositRule")}</SectionTitle>
          <p className="text-sm text-muted-foreground">{tv(marketCfg.deposit.note)}</p>
        </Card>
        <Card>
          <SectionTitle icon={Zap}>{t("legal.energyRule")}</SectionTitle>
          <p className="text-sm text-muted-foreground">{tv(marketCfg.energy.note)}</p>
        </Card>
        <Card>
          <SectionTitle icon={Scale}>{t("legal.rentControl")}</SectionTitle>
          <p className="text-sm text-muted-foreground mb-2">{tv(marketCfg.rentControl.note)}</p>
          {marketCfg.rentControl.cities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {marketCfg.rentControl.cities.map((c: string) => <Badge key={c} tone="blue">{c}</Badge>)}
            </div>
          )}
        </Card>
        <Card>
          <SectionTitle icon={FileText}>{t("legal.docsRequired")}</SectionTitle>
          <ul className="text-sm text-muted-foreground space-y-1">
            {marketCfg.mandatoryDocs.map((d: any) => <li key={d.id}>· {tv(d)}</li>)}
          </ul>
        </Card>
      </div>

      {/* Pièces autorisées / interdites au dossier */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <SectionTitle icon={ShieldCheck}>{t("legal.docsAllowed")}</SectionTitle>
          <ul className="text-sm space-y-1.5">
            {marketCfg.applicationDocs.allowed.map((d: any, i: number) => (
              <li key={i} className="flex gap-2"><span className="text-success">✓</span>{tv(d)}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle icon={ShieldX}>{t("legal.docsForbidden")}</SectionTitle>
          <ul className="text-sm space-y-1.5 mb-3">
            {marketCfg.applicationDocs.forbidden.map((d: any, i: number) => (
              <li key={i} className="flex gap-2"><span className="text-destructive">✕</span>{tv(d)}</li>
            ))}
          </ul>
          <Alert tone="red">{tv(marketCfg.applicationDocs.penaltyNote)}</Alert>
        </Card>
      </div>

      {/* Détail par bien */}
      <Card>
        <SectionTitle icon={ShieldAlert}>
          {locale === "fr" ? "Anomalies détectées par bien" : "Issues detected per property"}
        </SectionTitle>
        {rows.filter((r) => r.issues.length > 0).length === 0 ? (
          <EmptyState label={t("admin.compliance.ok")} />
        ) : (
          <div className="space-y-4">
            {rows.filter((r) => r.issues.length > 0).map(({ property, issues }) => (
              <div key={property.id} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div>
                    <div className="font-medium">{property.title}</div>
                    <div className="text-xs text-muted-foreground">{property.address}</div>
                  </div>
                  <Badge tone={issues.some((i: any) => i.level === "blocking") ? "red" : "amber"}>
                    {issues.length} {locale === "fr" ? "point(s)" : "issue(s)"}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {issues.map((i: any, idx: number) => (
                    <li key={idx} className="flex gap-2.5 text-sm">
                      {i.level === "blocking"
                        ? <ShieldX className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        : <ShieldAlert className="w-4 h-4 text-secondary shrink-0 mt-0.5" />}
                      <span className="text-muted-foreground">{tv(i)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Alert tone="blue">{t("common.legalNotice")} {m.regulator ? "" : ""}</Alert>
      </div>
    </Page>
  );
}
