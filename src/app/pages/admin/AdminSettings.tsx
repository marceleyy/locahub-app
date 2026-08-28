import { useState } from "react";
import { Settings, Globe, Database, RotateCcw, KeyRound, Percent } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { Page, PageHeader, Card, SectionTitle, Button, Badge, Field, Input, Select, Alert, Table } from "@/app/components/common/ui";

export function AdminSettings() {
  const { t, locale, market, setMarket, setLocale, m, tv } = useI18n();
  const { resetDemo, db } = useStore();
  const [fee, setFee] = useState("7.5");

  const sources = m.dataSources || [];

  return (
    <Page>
      <PageHeader title={t("nav.settings")} subtitle={locale === "fr" ? "Paramètres de la plateforme et des marchés" : "Platform and market settings"} />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle icon={Globe}>{locale === "fr" ? "Langue et marché par défaut" : "Default language and market"}</SectionTitle>
          <Field label={t("common.language")}>
            <Select value={locale} onChange={(e: any) => setLocale(e.target.value)}
              options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]} />
          </Field>
          <Field label={t("common.market")}>
            <Select value={market} onChange={(e: any) => setMarket(e.target.value)}
              options={[{ value: "FR", label: "France" }, { value: "QC", label: "Canada – Québec" }]} />
          </Field>
          <p className="text-xs text-muted-foreground">
            {locale === "fr"
              ? "Le marché conditionne la devise, le vocabulaire juridique, les documents obligatoires et les règles de conformité."
              : "The market drives currency, legal wording, mandatory documents and compliance rules."}
          </p>
        </Card>

        <Card>
          <SectionTitle icon={Percent}>{locale === "fr" ? "Modèle économique" : "Business model"}</SectionTitle>
          <Field label={locale === "fr" ? "Commission plateforme sur honoraires (%)" : "Platform fee on agent commission (%)"}>
            <Input type="number" value={fee} onChange={(e: any) => setFee(e.target.value)} />
          </Field>
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p>· {locale === "fr" ? "Abonnement propriétaire par lot géré" : "Landlord subscription per managed unit"}</p>
            <p>· {locale === "fr" ? "Abonnement agence par utilisateur" : "Agency subscription per seat"}</p>
            <p>· {locale === "fr" ? "Frais sur paiement de loyer (payés par le bailleur)" : "Rent payment fee (paid by the landlord)"}</p>
            <p>· {locale === "fr" ? "Options : assurance loyers impayés, signature, états des lieux" : "Add-ons: rent insurance, e-signature, condition reports"}</p>
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <SectionTitle icon={Database}>{t("market.sources")}</SectionTitle>
        <Table
          columns={[locale === "fr" ? "Source" : "Source", "URL", locale === "fr" ? "Accès" : "Access"]}
          rows={sources.map((s: any) => [
            <span className="text-sm font-medium">{s.name}</span>,
            <span className="text-xs text-muted-foreground break-all">{s.url}</span>,
            <Badge tone={s.type === "open" ? "green" : s.type === "paid" ? "orange" : "blue"}>
              {s.type === "open" ? (locale === "fr" ? "Ouvert" : "Open") : s.type === "paid" ? (locale === "fr" ? "Payant" : "Paid") : (locale === "fr" ? "Sur consentement" : "With consent")}
            </Badge>,
          ])}
        />
      </Card>

      <Card className="mb-4">
        <SectionTitle icon={KeyRound}>{locale === "fr" ? "Sécurité et conservation" : "Security and retention"}</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="font-medium mb-1">{locale === "fr" ? "Dossiers non retenus" : "Rejected applications"}</div>
            <div className="text-muted-foreground text-xs">{locale === "fr" ? "Purge automatique à 30 jours" : "Auto-purge after 30 days"}</div>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="font-medium mb-1">{locale === "fr" ? "Pièces des locataires en place" : "Active tenants' documents"}</div>
            <div className="text-muted-foreground text-xs">{locale === "fr" ? "Durée du bail + 5 ans (prescription)" : "Lease term + 5 years (limitation period)"}</div>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="font-medium mb-1">{locale === "fr" ? "Chiffrement" : "Encryption"}</div>
            <div className="text-muted-foreground text-xs">{locale === "fr" ? "Au repos (AES-256) et en transit (TLS 1.3)" : "At rest (AES-256) and in transit (TLS 1.3)"}</div>
          </div>
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="font-medium mb-1">{locale === "fr" ? "Hébergement" : "Hosting"}</div>
            <div className="text-muted-foreground text-xs">{locale === "fr" ? "UE pour la France, Canada pour le Québec" : "EU for France, Canada for Quebec"}</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={RotateCcw}>{locale === "fr" ? "Données de démonstration" : "Demo data"}</SectionTitle>
        <p className="text-sm text-muted-foreground mb-4">
          {locale === "fr"
            ? `Base locale : ${db.users.length} utilisateurs, ${db.properties.length} biens. Les modifications sont enregistrées dans le navigateur.`
            : `Local store: ${db.users.length} users, ${db.properties.length} properties. Changes are saved in the browser.`}
        </p>
        <Button variant="outline" icon={RotateCcw} onClick={resetDemo}>{t("common.resetDemo")}</Button>
      </Card>
    </Page>
  );
}
