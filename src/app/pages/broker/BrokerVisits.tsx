import { useState } from "react";
import { CalendarClock, Plus, MapPin, Video, Users } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { Page, PageHeader, Card, Badge, Button, Modal, Field, Select, Input, Avatar, EmptyState } from "@/app/components/common/ui";

export function BrokerVisits() {
  const { t, locale, date, tv } = useI18n();
  const { db, currentUser, getProperty, getUser, createVisit } = useStore();
  const [open, setOpen] = useState(false);

  const agent = currentUser?.role === "agent" ? currentUser : db.users.find((u: any) => u.role === "agent");
  const visits = db.visits.filter((v: any) => v.agentId === agent?.id).sort((a: any, b: any) => a.date.localeCompare(b.date));
  const properties = db.properties.filter((p: any) => p.agentId === agent?.id);
  const tenants = db.users.filter((u: any) => u.role === "tenant");

  const emptyForm = { propertyId: properties[0]?.id || "", tenantId: "", date: "", type: locale === "fr" ? "Visite physique" : "In-person viewing" };
  const [form, setForm] = useState<any>(emptyForm);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.propertyId || !form.date) return;
    createVisit({ ...form, agentId: agent?.id, tenantId: form.tenantId || null, status: "confirmed" });
    setForm(emptyForm);
    setOpen(false);
  };

  const grouped = visits.reduce((acc: any, v: any) => {
    const day = v.date.slice(0, 10);
    (acc[day] = acc[day] || []).push(v);
    return acc;
  }, {});

  const statusLabel = (s: string) => tv({
    confirmed: { fr: "Confirmée", en: "Confirmed" },
    pending: { fr: "À confirmer", en: "To confirm" },
    open_house: { fr: "Portes ouvertes", en: "Open house" },
    done: { fr: "Effectuée", en: "Completed" },
  }[s] || { fr: s, en: s });

  return (
    <Page>
      <PageHeader
        title={t("nav.visits")}
        subtitle={locale === "fr" ? "Planning et regroupement des visites" : "Viewing schedule and grouping"}
        action={<Button icon={Plus} variant="accent" onClick={() => setOpen(true)}>{t("agent.scheduleVisit")}</Button>}
      />

      {Object.keys(grouped).length === 0 ? (
        <Card><EmptyState label={t("common.empty")} /></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]: any) => (
            <div key={day}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-secondary" />
                {date(day, "long")}
                <Badge tone="neutral">{items.length}</Badge>
              </h3>
              <div className="space-y-2.5">
                {items.map((v: any) => {
                  const prop = getProperty(v.propertyId);
                  const tenant = v.tenantId ? getUser(v.tenantId) : null;
                  return (
                    <Card key={v.id} className="flex items-center gap-4">
                      <div className="text-center w-16 shrink-0">
                        <div className="text-lg font-bold">{v.date.slice(11, 16)}</div>
                        <div className="text-[11px] text-muted-foreground">45 min</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{prop?.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />{prop?.address}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {v.type?.toLowerCase().includes("virt") && <Video className="w-4 h-4 text-primary" />}
                        {tenant ? <Avatar user={tenant} size={30} /> : <Users className="w-4 h-4 text-muted-foreground" />}
                        <Badge tone={v.status === "confirmed" ? "green" : v.status === "open_house" ? "violet" : "amber"}>
                          {statusLabel(v.status)}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("agent.scheduleVisit")}
        width="max-w-lg"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button variant="accent" onClick={submit}>{t("common.save")}</Button></>}
      >
        <Field label={t("nav.properties")} required>
          <Select value={form.propertyId} onChange={(e: any) => set("propertyId", e.target.value)}
            options={properties.map((p: any) => ({ value: p.id, label: p.title }))} />
        </Field>
        <Field label={t("role.tenant")}>
          <Select value={form.tenantId} onChange={(e: any) => set("tenantId", e.target.value)}
            options={[{ value: "", label: locale === "fr" ? "Portes ouvertes (sans candidat)" : "Open house (no candidate)" },
              ...tenants.map((u: any) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))]} />
        </Field>
        <Field label={t("common.date")} required>
          <Input type="datetime-local" value={form.date} onChange={(e: any) => set("date", e.target.value)} />
        </Field>
        <Field label={locale === "fr" ? "Type" : "Type"}>
          <Select value={form.type} onChange={(e: any) => set("type", e.target.value)}
            options={[
              { value: locale === "fr" ? "Visite physique" : "In-person viewing", label: locale === "fr" ? "Visite physique" : "In-person viewing" },
              { value: locale === "fr" ? "Visite virtuelle" : "Virtual viewing", label: locale === "fr" ? "Visite virtuelle" : "Virtual viewing" },
              { value: locale === "fr" ? "Portes ouvertes" : "Open house", label: locale === "fr" ? "Portes ouvertes" : "Open house" },
            ]} />
        </Field>
      </Modal>
    </Page>
  );
}
