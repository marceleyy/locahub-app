import { ScrollText, Download, Shield } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { Page, PageHeader, Card, Table, Badge, Button, Alert, Avatar } from "@/app/components/common/ui";

export function AdminAudit() {
  const { t, date, tv, locale } = useI18n();
  const { db, getUser } = useStore();

  const rows = db.audit.map((a: any) => {
    const actor = getUser(a.actorId);
    return [
      <span className="text-xs text-muted-foreground whitespace-nowrap">{date(a.at)}</span>,
      <div className="flex items-center gap-2">
        {actor && <Avatar user={actor} size={26} />}
        <span className="text-sm">{actor ? `${actor.firstName} ${actor.lastName}` : a.actorId}</span>
      </div>,
      <Badge tone={a.action.startsWith("delete") ? "red" : a.action.startsWith("create") ? "green" : "neutral"}>{a.action}</Badge>,
      <span className="text-sm text-muted-foreground">{tv(a.detail)}</span>,
      <span className="text-xs font-mono text-muted-foreground">{a.target}</span>,
      <span className="text-xs text-muted-foreground">{a.ip}</span>,
    ];
  });

  return (
    <Page wide>
      <PageHeader
        title={t("admin.audit.title")}
        subtitle={t("admin.audit.desc")}
        action={<Button variant="outline" icon={Download}>{t("common.export")}</Button>}
      />

      <div className="mb-5">
        <Alert tone="blue" icon={Shield} title={locale === "fr" ? "Pourquoi ce journal" : "Why this log exists"}>
          {locale === "fr"
            ? "Le RGPD (art. 32) et la loi 25 imposent de pouvoir démontrer qui a consulté ou modifié une donnée personnelle, et quand. Conservez ce journal séparément des données métier, en lecture seule, avec une durée de rétention définie (12 à 36 mois selon votre analyse de risque)."
            : "GDPR (art. 32) and Law 25 require you to demonstrate who accessed or modified personal data, and when. Keep this log separate from business data, read-only, with a defined retention period (12–36 months based on your risk assessment)."}
        </Alert>
      </div>

      <Card>
        <Table
          columns={[t("common.date"), locale === "fr" ? "Auteur" : "Actor", "Action", t("common.details"), "ID", "IP"]}
          rows={rows}
          empty={t("common.empty")}
        />
      </Card>
    </Page>
  );
}
