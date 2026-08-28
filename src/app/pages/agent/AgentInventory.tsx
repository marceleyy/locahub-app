import { ClipboardCheck, Camera, PenLine, AlertTriangle, Plus } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { Page, PageHeader, Card, Badge, Button, Table, Alert, SectionTitle } from "@/app/components/common/ui";

export function AgentInventory() {
  const { t, locale, date, tv } = useI18n();
  const { db, getProperty } = useStore();

  const statusLabel = (s: string) => tv({
    signed: { fr: "Signé", en: "Signed" },
    scheduled: { fr: "Planifié", en: "Scheduled" },
    draft: { fr: "Brouillon", en: "Draft" },
    disputed: { fr: "Contesté", en: "Disputed" },
  }[s] || { fr: s, en: s });

  const rows = db.inventories.map((inv: any) => {
    const prop = getProperty(inv.propertyId);
    return [
      <div className="leading-tight">
        <div className="font-medium text-sm">{prop?.title}</div>
        <div className="text-xs text-muted-foreground">{prop?.address}</div>
      </div>,
      <Badge tone={inv.type === "entry" ? "blue" : "orange"}>
        {inv.type === "entry" ? t("agent.inventoryEntry") : t("agent.inventoryExit")}
      </Badge>,
      <span className="text-sm">{date(inv.date)}</span>,
      <span className="text-sm flex items-center gap-1"><Camera className="w-3.5 h-3.5 text-muted-foreground" />{inv.photos}</span>,
      inv.disputes > 0
        ? <Badge tone="red"><AlertTriangle className="w-3 h-3" />{inv.disputes}</Badge>
        : <span className="text-sm text-muted-foreground">—</span>,
      <Badge tone={inv.status === "signed" ? "green" : inv.status === "scheduled" ? "amber" : "neutral"}>{statusLabel(inv.status)}</Badge>,
      <Button size="sm" variant="outline" icon={PenLine}>{t("common.view")}</Button>,
    ];
  });

  return (
    <Page wide>
      <PageHeader
        title={t("nav.inventory")}
        subtitle={locale === "fr" ? "États des lieux photo, horodatés et contradictoires" : "Time-stamped photo condition reports, signed by both parties"}
        action={<Button icon={Plus} variant="accent">{t("common.new")}</Button>}
      />

      <div className="mb-5">
        <Alert tone="blue" icon={ClipboardCheck} title={locale === "fr" ? "Valeur probante" : "Evidential value"}>
          {locale === "fr"
            ? "Un état des lieux n'a de force qu'établi de façon contradictoire, daté et signé par les deux parties, avec un exemplaire remis au locataire. Photos horodatées et signature électronique conservées 5 ans minimum. En France, l'absence d'état des lieux d'entrée fait présumer que le logement a été reçu en bon état."
            : "A condition report only carries weight when established jointly, dated and signed by both parties, with a copy given to the tenant. Time-stamped photos and e-signatures kept for at least 5 years. In France, the absence of a move-in report creates a presumption that the property was received in good condition."}
        </Alert>
      </div>

      <Card className="mb-4">
        <SectionTitle icon={ClipboardCheck}>{t("nav.inventory")}</SectionTitle>
        <Table
          columns={[t("nav.properties"), locale === "fr" ? "Type" : "Type", t("common.date"), "Photos", locale === "fr" ? "Litiges" : "Disputes", t("common.status"), ""]}
          rows={rows}
          empty={t("common.empty")}
        />
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { fr: "Pièce par pièce", en: "Room by room", d: { fr: "Grille standardisée : murs, sols, plafonds, ouvrants, équipements, avec 4 niveaux d'état.", en: "Standard grid: walls, floors, ceilings, openings, fixtures, with 4 condition levels." } },
          { fr: "Relevés obligatoires", en: "Mandatory readings", d: { fr: "Compteurs eau, électricité, gaz, nombre de clés remises, détecteur de fumée testé.", en: "Water, electricity, gas meters, keys handed over, smoke detector tested." } },
          { fr: "Comparaison entrée/sortie", en: "Move-in vs move-out", d: { fr: "Différentiel automatique et calcul de vétusté avant toute retenue sur dépôt.", en: "Automatic diff and wear-and-tear allowance before any deposit deduction." } },
        ].map((c, i) => (
          <Card key={i}>
            <h3 className="font-semibold text-sm mb-2">{tv(c)}</h3>
            <p className="text-sm text-muted-foreground">{tv(c.d)}</p>
          </Card>
        ))}
      </div>
    </Page>
  );
}
