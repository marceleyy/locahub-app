import { useState } from "react";
import { UserPlus, Phone, Mail, ArrowRight } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { Page, PageHeader, Card, Badge, Button, Modal, Field, Input, Select } from "@/app/components/common/ui";

const STAGES = [
  { id: "new", fr: "Nouveau", en: "New", tone: "neutral" },
  { id: "qualified", fr: "Qualifié", en: "Qualified", tone: "blue" },
  { id: "visit_booked", fr: "Visite planifiée", en: "Viewing booked", tone: "violet" },
  { id: "application", fr: "Dossier déposé", en: "Application sent", tone: "orange" },
  { id: "won", fr: "Bail signé", en: "Lease signed", tone: "green" },
  { id: "lost", fr: "Perdu", en: "Lost", tone: "red" },
];

export function BrokerPipeline() {
  const { t, locale, money, tv } = useI18n();
  const { db, currentUser, createProspect, updateProspect } = useStore();
  const [open, setOpen] = useState(false);

  const agent = currentUser?.role === "agent" ? currentUser : db.users.find((u: any) => u.role === "agent");
  const prospects = db.prospects.filter((p: any) => p.agentId === agent?.id);

  const emptyForm = { name: "", email: "", phone: "", budget: "", city: "", source: "LocaHub", market: agent?.market || "FR" };
  const [form, setForm] = useState<any>(emptyForm);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name) return;
    createProspect({ ...form, budget: Number(form.budget) || 0, agentId: agent?.id });
    setForm(emptyForm);
    setOpen(false);
  };

  const advance = (p: any) => {
    const idx = STAGES.findIndex((s) => s.id === p.stage);
    const next = STAGES[Math.min(idx + 1, STAGES.length - 2)];
    updateProspect(p.id, { stage: next.id });
  };

  return (
    <Page wide>
      <PageHeader
        title={t("nav.pipeline")}
        subtitle={`${prospects.length} ${locale === "fr" ? "prospects actifs" : "active leads"}`}
        action={<Button icon={UserPlus} variant="accent" onClick={() => setOpen(true)}>{t("agent.newProspect")}</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STAGES.map((stage) => {
          const items = prospects.filter((p: any) => p.stage === stage.id);
          return (
            <div key={stage.id}>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <h3 className="font-semibold text-sm">{tv(stage)}</h3>
                <Badge tone={stage.tone}>{items.length}</Badge>
              </div>
              <div className="space-y-2.5 min-h-[80px]">
                {items.map((p: any) => (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.city} · {money(p.budget)}</div>
                      </div>
                      <Badge tone="neutral">{p.source}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${p.phone}`} className="p-1.5 rounded-lg hover:bg-accent" title={p.phone}>
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                      {!["won", "lost"].includes(p.stage) && (
                        <Button size="sm" variant="ghost" icon={ArrowRight} onClick={() => advance(p)}>
                          {locale === "fr" ? "Étape suivante" : "Next stage"}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("agent.newProspect")}
        width="max-w-lg"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button variant="accent" onClick={submit}>{t("common.save")}</Button></>}
      >
        <Field label={t("common.name")} required><Input value={form.name} onChange={(e: any) => set("name", e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label={t("common.email")}><Input value={form.email} onChange={(e: any) => set("email", e.target.value)} /></Field>
          <Field label={t("common.phone")}><Input value={form.phone} onChange={(e: any) => set("phone", e.target.value)} /></Field>
          <Field label={locale === "fr" ? "Budget mensuel" : "Monthly budget"}><Input type="number" value={form.budget} onChange={(e: any) => set("budget", e.target.value)} /></Field>
          <Field label={locale === "fr" ? "Ville recherchée" : "Target city"}><Input value={form.city} onChange={(e: any) => set("city", e.target.value)} /></Field>
          <Field label={locale === "fr" ? "Source" : "Source"}>
            <Select value={form.source} onChange={(e: any) => set("source", e.target.value)}
              options={["LocaHub", "SeLoger", "Leboncoin", "Kijiji", "Centris", "Facebook", locale === "fr" ? "Recommandation" : "Referral"].map((s) => ({ value: s, label: s }))} />
          </Field>
        </div>
      </Modal>
    </Page>
  );
}
