import { useState } from "react";
import { Wrench, Plus, Clock, CheckCircle2, AlertOctagon } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { Page, PageHeader, Card, Badge, Button, Modal, Field, Input, Select, Textarea, Tabs, Alert, EmptyState } from "@/app/components/common/ui";

const PRIORITY_TONE: Record<string, string> = { high: "red", medium: "amber", low: "neutral" };
const STATUS_TONE: Record<string, string> = { open: "orange", progress: "blue", done: "green" };

export function Maintenance() {
  const { t, locale, money, date, tv } = useI18n();
  const { db, getProperty, createTicket, updateTicket, currentUser } = useStore();
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);

  const emptyForm = { propertyId: db.properties[0]?.id || "", title: "", category: "", priority: "medium", description: "" };
  const [form, setForm] = useState<any>(emptyForm);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const list = tab === "all" ? db.tickets : db.tickets.filter((x: any) => x.status === tab);

  const submit = () => {
    if (!form.title) return;
    const prop = getProperty(form.propertyId);
    createTicket({
      propertyId: form.propertyId,
      ownerId: prop?.ownerId, agentId: prop?.agentId,
      tenantId: currentUser?.role === "tenant" ? currentUser.id : null,
      title: { fr: form.title, en: form.title },
      category: form.category, priority: form.priority,
      slaHours: form.priority === "high" ? 24 : form.priority === "medium" ? 72 : 168,
      estimatedCost: 0, chargeableTo: "owner",
    });
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <Page wide>
      <PageHeader
        title={t("maintenance.title")}
        subtitle={locale === "fr" ? "Suivi des demandes, délais d'intervention et prestataires" : "Request tracking, response times and vendors"}
        action={<Button icon={Plus} variant="accent" onClick={() => setOpen(true)}>{t("maintenance.new")}</Button>}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "all", label: t("common.all") },
          { id: "open", label: t("maintenance.status.open") },
          { id: "progress", label: t("maintenance.status.progress") },
          { id: "done", label: t("maintenance.status.done") },
        ]}
      />

      {list.length === 0 ? (
        <Card><EmptyState label={t("common.empty")} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((tk: any) => {
            const prop = getProperty(tk.propertyId);
            return (
              <Card key={tk.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge tone={PRIORITY_TONE[tk.priority]}>
                    {tk.priority === "high" && <AlertOctagon className="w-3 h-3" />}
                    {t(`maintenance.priority.${tk.priority}`)}
                  </Badge>
                  <Badge tone={STATUS_TONE[tk.status]}>{t(`maintenance.status.${tk.status}`)}</Badge>
                </div>
                <h3 className="font-semibold text-sm mb-1">{tv(tk.title)}</h3>
                <p className="text-xs text-muted-foreground mb-3">{prop?.title}</p>
                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5"><Wrench className="w-3 h-3" />{tk.category}{tk.vendor ? ` · ${tk.vendor}` : ""}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{t("maintenance.sla")} : {tk.slaHours} h</div>
                  {tk.estimatedCost > 0 && <div className="flex items-center gap-1.5">≈ {money(tk.estimatedCost)}</div>}
                  <div>{date(tk.createdAt)}</div>
                </div>
                <div className="mt-auto flex gap-2">
                  {tk.status !== "done" && (
                    <Button size="sm" variant="outline" icon={CheckCircle2}
                      onClick={() => updateTicket(tk.id, { status: tk.status === "open" ? "progress" : "done" })}>
                      {tk.status === "open" ? t("maintenance.status.progress") : t("maintenance.status.done")}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <Alert tone="blue" icon={Wrench}>
          {locale === "fr"
            ? "Le bailleur doit délivrer un logement décent et en bon état d'usage, et assurer les réparations autres que locatives. Au Québec, le locataire peut faire exécuter une réparation urgente et nécessaire aux frais du locateur après l'avoir avisé (ou avoir tenté de l'aviser). Tracer chaque signalement et chaque intervention protège les deux parties."
            : "The landlord must provide a decent dwelling in good working order and carry out non-tenant repairs. In Quebec, a tenant may carry out urgent and necessary repairs at the landlord's expense after notifying (or attempting to notify) them. Logging every report and every intervention protects both parties."}
        </Alert>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("maintenance.new")}
        width="max-w-lg"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button variant="accent" onClick={submit}>{t("common.save")}</Button></>}
      >
        <Field label={t("nav.properties")} required>
          <Select value={form.propertyId} onChange={(e: any) => set("propertyId", e.target.value)}
            options={db.properties.map((p: any) => ({ value: p.id, label: p.title }))} />
        </Field>
        <Field label={locale === "fr" ? "Objet" : "Subject"} required>
          <Input value={form.title} onChange={(e: any) => set("title", e.target.value)} />
        </Field>
        <Field label={locale === "fr" ? "Catégorie" : "Category"}>
          <Select value={form.category} onChange={(e: any) => set("category", e.target.value)}
            options={(locale === "fr"
              ? ["Plomberie", "Électricité", "Chauffage", "Menuiserie", "Serrurerie", "Nuisibles", "Parties communes", "Autre"]
              : ["Plumbing", "Electrical", "Heating", "Carpentry", "Locks", "Pests", "Common areas", "Other"]
            ).map((c) => ({ value: c, label: c }))} />
        </Field>
        <Field label={locale === "fr" ? "Priorité" : "Priority"} hint={locale === "fr" ? "Urgente = risque pour la sécurité ou la santé" : "Urgent = safety or health risk"}>
          <Select value={form.priority} onChange={(e: any) => set("priority", e.target.value)}
            options={[
              { value: "high", label: t("maintenance.priority.high") },
              { value: "medium", label: t("maintenance.priority.medium") },
              { value: "low", label: t("maintenance.priority.low") },
            ]} />
        </Field>
        <Field label={locale === "fr" ? "Description" : "Description"}>
          <Textarea value={form.description} onChange={(e: any) => set("description", e.target.value)} />
        </Field>
      </Modal>
    </Page>
  );
}
