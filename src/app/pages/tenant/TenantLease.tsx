import { useMemo } from "react";
import {
  FileCheck, CalendarClock, ShieldCheck, TrendingUp, Info,
  Download, ClipboardCheck, AlertTriangle,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { leaseAlerts } from "@/app/lib/assist";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, StatCard,
  Alert, EmptyState, Table,
} from "@/app/components/common/ui";

export function TenantLease() {
  const { t, tv, locale, money, date, market, m } = useI18n();
  const store = useStore();

  const me = store.activeUserOfRole("tenant", market);
  const lease = me ? store.leaseOfTenant(me.id) : null;
  const property = lease ? store.getProperty(lease.propertyId) : null;
  const owner = lease ? store.getUser(lease.ownerId) : null;
  const inventories = useMemo(
    () => (lease ? store.db.inventories.filter((i: any) => i.leaseId === lease.id) : []),
    [store.db.inventories, lease]
  );

  const alerts = useMemo(
    () => (lease ? leaseAlerts([lease], store.db.properties, market) : []),
    [lease, store.db.properties, market]
  );

  if (!me || !lease || !property) return <Page><EmptyState label={t("payments.noLease")} /></Page>;

  const daysLeft = lease.endDate
    ? Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <Page>
      <PageHeader title={t("nav.lease")} subtitle={property.title} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={FileCheck} label={t("lease.type")} value={tv(leaseTypeLabel(lease.type))} tone="blue" />
        <StatCard icon={TrendingUp} label={t("unit.rent")} value={money(lease.rent)} tone="green" hint={`+ ${money(lease.charges)} ${t("unit.charges")}`} />
        <StatCard
          icon={CalendarClock}
          label={t("tenantFile.leaseEnd")}
          value={lease.endDate ? date(lease.endDate) : "—"}
          tone={daysLeft != null && daysLeft < 120 ? "orange" : "neutral"}
          hint={daysLeft != null ? t("lease.daysLeft", { n: String(daysLeft) }) : undefined}
        />
        <StatCard
          icon={ShieldCheck}
          label={t("lease.deposit")}
          value={lease.deposit > 0 ? money(lease.deposit) : t("lease.noDeposit")}
          tone="violet"
          hint={market === "QC" ? t("lease.depositQC") : t("lease.depositFR")}
        />
      </div>

      {alerts.map((a, i) => (
        <Alert key={i} tone={a.severity === "critical" ? "red" : "amber"} icon={AlertTriangle} title={a.title[locale] || a.title.fr}>
          {a.detail[locale] || a.detail.fr}
        </Alert>
      ))}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={FileCheck}>{t("lease.terms")}</SectionTitle>
          <dl className="space-y-2 text-sm">
            {[
              [t("lease.startDate"), date(lease.startDate)],
              [t("tenantFile.leaseEnd"), lease.endDate ? date(lease.endDate) : "—"],
              [t("lease.landlord"), owner ? `${owner.firstName} ${owner.lastName}` : "—"],
              [t("lease.signedAt"), lease.signedAt ? date(lease.signedAt) : "—"],
              [t("lease.signature"), lease.signatureLevel || "—"],
              [t("common.status"), t(`leaseStatus.${lease.status}`)],
            ].map(([k, v], i) => (
              <div key={i} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <SectionTitle icon={TrendingUp}>{t("lease.indexation")}</SectionTitle>
          {lease.indexation ? (
            <>
              <dl className="mb-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("lease.index")}</dt>
                  <dd className="font-medium">{lease.indexation.index}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("lease.lastApplied")}</dt>
                  <dd className="font-medium tabular-nums">{lease.indexation.lastApplied ? date(lease.indexation.lastApplied) : "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("lease.nextReview")}</dt>
                  <dd className="font-medium tabular-nums">{lease.indexation.nextReview ? date(lease.indexation.nextReview) : "—"}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground text-pretty">
                {market === "FR" ? t("lease.indexHintFR") : t("lease.indexHintQC")}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("lease.noIndexation")}</p>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <SectionTitle icon={Download}>{t("lease.attachments")}</SectionTitle>
        <p className="mb-3 text-xs text-muted-foreground text-pretty">
          {market === "FR" ? t("lease.attachmentsFR") : t("lease.attachmentsQC")}
        </p>
        <div className="flex flex-wrap gap-2">
          {(lease.attachments || []).map((a: string, i: number) => (
            <Button key={i} size="sm" variant="outline" icon={Download}>{a}</Button>
          ))}
          {!(lease.attachments || []).length && <p className="text-sm text-muted-foreground">{t("lease.noAttachment")}</p>}
        </div>
      </Card>

      <Card className="mt-5">
        <SectionTitle icon={ClipboardCheck}>{t("lease.inventories")}</SectionTitle>
        <Table
          columns={[t("lease.inventoryType"), t("common.date"), t("common.status"), t("lease.photos"), t("lease.disputes")]}
          rows={inventories.map((i: any) => [
            t(`inventoryType.${i.type}`),
            <span className="tabular-nums">{date(i.date)}</span>,
            <Badge tone={i.status === "signed" ? "green" : "amber"}>{t(`inventoryStatus.${i.status}`)}</Badge>,
            <span className="tabular-nums">{i.photos}</span>,
            <span className="tabular-nums">{i.disputes}</span>,
          ])}
          empty={t("lease.noInventory")}
        />
      </Card>

      <div className="mt-5">
        <Alert tone="blue" icon={Info} title={t("lease.rightsTitle")}>
          {market === "FR" ? t("lease.rightsFR") : t("lease.rightsQC")}
        </Alert>
      </div>
    </Page>
  );
}

/** Les types de bail sont propres au marché : on les rend lisibles sans les coder en dur dans l'écran. */
function leaseTypeLabel(type: string) {
  const map: Record<string, { fr: string; en: string }> = {
    vide: { fr: "Location vide (3 ans)", en: "Unfurnished (3 years)" },
    meuble: { fr: "Location meublée (1 an)", en: "Furnished (1 year)" },
    mobilite: { fr: "Bail mobilité (1 à 10 mois)", en: "Mobility lease (1–10 months)" },
    etudiant: { fr: "Bail étudiant (9 mois)", en: "Student lease (9 months)" },
    tal_12: { fr: "Bail TAL 12 mois", en: "12-month TAL lease" },
    tal_indetermine: { fr: "Bail à durée indéterminée", en: "Indefinite-term lease" },
  };
  return map[type] || { fr: type, en: type };
}
