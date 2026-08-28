import { useMemo, useState } from "react";
import { UserPlus, Search, Trash2, Ban, Eye, Link2, ShieldAlert } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import {
  Page, PageHeader, Card, Button, Badge, Modal, Field, Input, Select,
  Table, Avatar, Tabs, Alert,
} from "@/app/components/common/ui";

const ROLE_TONES: Record<string, string> = { tenant: "blue", landlord: "green", agent: "orange", admin: "violet" };

export function AdminUsers() {
  const { t, locale, date } = useI18n();
  const store = useStore();
  const { db, createUser, deleteUser, suspendUser, updateUser, setCurrentUserId } = store;

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<any>(null);

  const emptyForm = {
    role: "tenant", firstName: "", lastName: "", email: "", phone: "",
    market: "FR", locale: "fr",
    // locataire
    occupation: "", income: "", incomePeriod: "month", employmentType: "CDI", householdSize: 1,
    // propriétaire
    entityType: "Particulier", taxId: "", agentId: "",
    // agent
    agency: "", licence: "", licenceType: "", licenceExpiry: "", commissionRate: "",
  };
  const [form, setForm] = useState<any>(emptyForm);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.users.filter((u: any) => {
      const roleOk = tab === "all" || u.role === tab;
      const qOk = !q || `${u.firstName} ${u.lastName} ${u.email} ${u.agency || ""}`.toLowerCase().includes(q);
      return roleOk && qOk;
    });
  }, [db.users, tab, query]);

  const submit = () => {
    if (!form.firstName || !form.lastName || !form.email) return;
    const payload: any = {
      role: form.role, firstName: form.firstName, lastName: form.lastName,
      email: form.email, phone: form.phone, market: form.market, locale: form.locale,
    };
    if (form.role === "tenant") {
      Object.assign(payload, {
        occupation: form.occupation,
        income: Number(form.income) || 0,
        incomePeriod: form.incomePeriod,
        employmentType: form.employmentType,
        householdSize: Number(form.householdSize) || 1,
        hasGuarantor: false, guarantor: null,
        score: 0, scoreVerified: false, fileCompleteness: 20,
        creditCheckConsent: false, consentDate: null,
      });
    }
    if (form.role === "landlord") {
      Object.assign(payload, {
        entityType: form.entityType, taxId: form.taxId,
        agentId: form.agentId || null, propertyIds: [],
      });
    }
    if (form.role === "agent") {
      Object.assign(payload, {
        agency: form.agency, licence: form.licence,
        licenceType: form.licenceType || (form.market === "FR" ? "Carte T + G (loi Hoguet)" : "Courtier immobilier – OACIQ"),
        licenceExpiry: form.licenceExpiry, commissionRate: Number(form.commissionRate) || 0,
        landlordIds: [],
      });
    }
    createUser(payload);
    setForm(emptyForm);
    setModalOpen(false);
  };

  const roleLabel = (r: string) => t(`role.${r}`);

  const rows = filtered.map((u: any) => [
    <div className="flex items-center gap-3">
      <Avatar user={u} size={34} />
      <div className="leading-tight">
        <div className="font-medium">{u.firstName} {u.lastName}</div>
        <div className="text-xs text-muted-foreground">{u.email}</div>
      </div>
    </div>,
    <Badge tone={ROLE_TONES[u.role]}>{roleLabel(u.role)}</Badge>,
    <span className="text-sm">{u.market === "FR" ? "🇫🇷 France" : "🇨🇦 Québec"}</span>,
    <span className="text-sm text-muted-foreground">
      {u.role === "agent" && (u.agency || "—")}
      {u.role === "landlord" && `${u.propertyIds?.length || 0} ${t("nav.properties").toLowerCase()}`}
      {u.role === "tenant" && (u.scoreVerified ? `${t("tenant.score.title")} ${u.score}` : t("tenant.file.unverified"))}
      {u.role === "admin" && "—"}
    </span>,
    <Badge tone={u.status === "active" ? "green" : "red"}>
      {u.status === "active" ? t("common.active") : t("admin.suspend")}
    </Badge>,
    <span className="text-xs text-muted-foreground">{date(u.createdAt)}</span>,
    <div className="flex items-center gap-1">
      <button onClick={() => setCurrentUserId(u.id)} className="p-1.5 rounded-lg hover:bg-accent" title={t("admin.impersonate")}>
        <Eye className="w-4 h-4 text-muted-foreground" />
      </button>
      {(u.role === "landlord" || u.role === "tenant") && (
        <button onClick={() => setLinkTarget(u)} className="p-1.5 rounded-lg hover:bg-accent" title={t("admin.assignAgent")}>
          <Link2 className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
      <button onClick={() => suspendUser(u.id)} className="p-1.5 rounded-lg hover:bg-accent" title={t("admin.suspend")}>
        <Ban className="w-4 h-4 text-muted-foreground" />
      </button>
      <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg hover:bg-destructive/5" title={t("common.delete")}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>
    </div>,
  ]);

  const agents = db.users.filter((u: any) => u.role === "agent");

  return (
    <Page wide>
      <PageHeader
        title={t("admin.users.all")}
        subtitle={`${db.users.length} ${t("admin.kpi.users").toLowerCase()}`}
        action={<Button icon={UserPlus} variant="accent" onClick={() => setModalOpen(true)}>{t("admin.createUser")}</Button>}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder={t("common.search")} className="pl-10" />
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "all", label: t("common.all") },
          { id: "tenant", label: t("role.tenant") },
          { id: "landlord", label: t("role.landlord") },
          { id: "agent", label: t("role.agent") },
          { id: "admin", label: t("role.admin") },
        ]}
      />

      <Card>
        <Table
          columns={[t("common.name"), t("common.role"), t("common.market"), t("common.details"), t("common.status"), t("common.date"), t("common.actions")]}
          rows={rows}
          empty={t("common.empty")}
        />
      </Card>

      {/* ---- Création d'utilisateur ---- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("admin.createUser")}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="accent" onClick={submit}>{t("common.save")}</Button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label={t("common.role")} required>
            <Select
              value={form.role}
              onChange={(e: any) => set("role", e.target.value)}
              options={[
                { value: "tenant", label: t("role.tenant") },
                { value: "landlord", label: t("role.landlord") },
                { value: "agent", label: t("role.agent") },
                { value: "admin", label: t("role.admin") },
              ]}
            />
          </Field>
          <Field label={t("common.market")} required>
            <Select
              value={form.market}
              onChange={(e: any) => set("market", e.target.value)}
              options={[{ value: "FR", label: "🇫🇷 France" }, { value: "QC", label: "🇨🇦 Canada – Québec" }]}
            />
          </Field>
          <Field label={locale === "fr" ? "Prénom" : "First name"} required>
            <Input value={form.firstName} onChange={(e: any) => set("firstName", e.target.value)} />
          </Field>
          <Field label={locale === "fr" ? "Nom" : "Last name"} required>
            <Input value={form.lastName} onChange={(e: any) => set("lastName", e.target.value)} />
          </Field>
          <Field label={t("common.email")} required>
            <Input type="email" value={form.email} onChange={(e: any) => set("email", e.target.value)} />
          </Field>
          <Field label={t("common.phone")}>
            <Input value={form.phone} onChange={(e: any) => set("phone", e.target.value)} />
          </Field>
          <Field label={t("common.language")}>
            <Select
              value={form.locale}
              onChange={(e: any) => set("locale", e.target.value)}
              options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]}
            />
          </Field>
        </div>

        {form.role === "tenant" && (
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">{t("role.tenant")}</p>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Field label={locale === "fr" ? "Profession" : "Occupation"}>
                <Input value={form.occupation} onChange={(e: any) => set("occupation", e.target.value)} />
              </Field>
              <Field label={locale === "fr" ? "Type de contrat" : "Contract type"}>
                <Input value={form.employmentType} onChange={(e: any) => set("employmentType", e.target.value)} />
              </Field>
              <Field label={locale === "fr" ? "Revenu" : "Income"}>
                <Input type="number" value={form.income} onChange={(e: any) => set("income", e.target.value)} />
              </Field>
              <Field label={locale === "fr" ? "Périodicité" : "Period"}>
                <Select
                  value={form.incomePeriod}
                  onChange={(e: any) => set("incomePeriod", e.target.value)}
                  options={[
                    { value: "month", label: locale === "fr" ? "Mensuel" : "Monthly" },
                    { value: "year", label: locale === "fr" ? "Annuel" : "Yearly" },
                  ]}
                />
              </Field>
            </div>
            <Alert tone="orange" icon={ShieldAlert}>
              {locale === "fr"
                ? "Ne saisissez que les données strictement nécessaires. Les pièces interdites (relevés bancaires, NAS, casier judiciaire…) ne doivent jamais être stockées."
                : "Only enter strictly necessary data. Forbidden documents (bank statements, SIN, criminal record…) must never be stored."}
            </Alert>
          </div>
        )}

        {form.role === "landlord" && (
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">{t("role.landlord")}</p>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Field label={locale === "fr" ? "Type d'entité" : "Entity type"}>
                <Select
                  value={form.entityType}
                  onChange={(e: any) => set("entityType", e.target.value)}
                  options={[
                    { value: "Particulier", label: locale === "fr" ? "Particulier" : "Individual" },
                    { value: "SCI (personne morale)", label: locale === "fr" ? "SCI / société civile" : "Property company" },
                    { value: "Société par actions", label: locale === "fr" ? "Société / inc." : "Corporation" },
                  ]}
                />
              </Field>
              <Field label={locale === "fr" ? "Identifiant fiscal (SIREN / NEQ)" : "Tax ID (SIREN / NEQ)"}>
                <Input value={form.taxId} onChange={(e: any) => set("taxId", e.target.value)} />
              </Field>
              <Field label={t("admin.assignAgent")}>
                <Select
                  value={form.agentId}
                  onChange={(e: any) => set("agentId", e.target.value)}
                  options={[{ value: "", label: t("common.none") }, ...agents.map((a: any) => ({ value: a.id, label: `${a.firstName} ${a.lastName} — ${a.agency}` }))]}
                />
              </Field>
            </div>
          </div>
        )}

        {form.role === "agent" && (
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">{t("role.agent")}</p>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Field label={locale === "fr" ? "Agence / cabinet" : "Agency"}>
                <Input value={form.agency} onChange={(e: any) => set("agency", e.target.value)} />
              </Field>
              <Field
                label={t("agent.licence")}
                hint={form.market === "FR" ? "Carte professionnelle CPI (loi Hoguet)" : "Permis OACIQ"}
                required
              >
                <Input value={form.licence} onChange={(e: any) => set("licence", e.target.value)} />
              </Field>
              <Field label={locale === "fr" ? "Échéance de la licence" : "Licence expiry"}>
                <Input type="date" value={form.licenceExpiry} onChange={(e: any) => set("licenceExpiry", e.target.value)} />
              </Field>
              <Field label={locale === "fr" ? "Taux d'honoraires (%)" : "Fee rate (%)"}>
                <Input type="number" value={form.commissionRate} onChange={(e: any) => set("commissionRate", e.target.value)} />
              </Field>
            </div>
            <Alert tone="orange" icon={ShieldAlert}>
              {locale === "fr"
                ? "Un agent ne peut être activé qu'après vérification de sa carte professionnelle en cours de validité, de sa garantie financière et de sa RC professionnelle."
                : "An agent may only be activated after verifying a valid professional licence, financial guarantee and professional liability insurance."}
            </Alert>
          </div>
        )}
      </Modal>

      {/* ---- Rattachement ---- */}
      <Modal
        open={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        title={t("admin.assignAgent")}
        width="max-w-md"
        footer={<Button variant="outline" onClick={() => setLinkTarget(null)}>{t("common.close")}</Button>}
      >
        {linkTarget && (
          <Field label={t("admin.assignAgent")}>
            <Select
              value={linkTarget.agentId || ""}
              onChange={(e: any) => {
                updateUser(linkTarget.id, { agentId: e.target.value || null });
                setLinkTarget({ ...linkTarget, agentId: e.target.value });
              }}
              options={[{ value: "", label: t("common.none") }, ...agents.map((a: any) => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }))]}
            />
          </Field>
        )}
      </Modal>
    </Page>
  );
}
