import { useMemo, useState } from "react";
import { Building2, Plus, Trash2, Search, AlertTriangle } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck } from "@/app/store/AppStore";
import { getMarket } from "@/app/config/markets";
import {
  Page, PageHeader, Card, Button, Badge, Modal, Field, Input, Select, Table, Tabs,
} from "@/app/components/common/ui";

export function AdminProperties() {
  const { t, locale, money } = useI18n();
  const { db, createProperty, deleteProperty } = useStore();

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const owners = db.users.filter((u: any) => u.role === "landlord");
  const agents = db.users.filter((u: any) => u.role === "agent");

  const empty = {
    market: "FR", title: "", city: "", district: "", address: "",
    rent: "", charges: "", deposit: "", area: "", rooms: "", bedrooms: "", bathrooms: "",
    furnished: "false", ownerId: owners[0]?.id || "", agentId: "", energyGrade: "D", availableFrom: "",
  };
  const [form, setForm] = useState<any>(empty);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.properties.filter((p: any) => {
      const okTab = tab === "all" || p.market === tab;
      const okQ = !q || `${p.title} ${p.city} ${p.address}`.toLowerCase().includes(q);
      return okTab && okQ;
    });
  }, [db.properties, tab, query]);

  const submit = () => {
    if (!form.title || !form.ownerId) return;
    createProperty({
      market: form.market,
      ownerId: form.ownerId,
      agentId: form.agentId || null,
      title: form.title,
      city: form.city,
      district: form.district,
      address: form.address,
      rent: Number(form.rent) || 0,
      charges: Number(form.charges) || 0,
      deposit: Number(form.deposit) || 0,
      area: Number(form.area) || 0,
      rooms: Number(form.rooms) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      furnished: form.furnished === "true",
      availableFrom: form.availableFrom,
      energy: { grade: form.energyGrade, primaryConsumption: 0, ghg: null },
      legal: {
        rentControlZone: false, referenceRent: null, referenceRentIncreased: null,
        rentSupplement: 0, previousRent: null, previousRentDate: null,
        tightMarketZone: false, permitToRent: false, diagnostics: {},
      },
      marketMedian: Number(form.rent) || 0,
      daysToLet: 0, vacancyRisk: 0,
    });
    setForm(empty);
    setOpen(false);
  };

  const energyOptions =
    form.market === "FR"
      ? ["A", "B", "C", "D", "E", "F", "G"].map((g) => ({ value: g, label: `DPE ${g}` }))
      : ["86-100", "71-85", "51-70", "0-50"].map((g) => ({ value: g, label: `ÉnerGuide ${g}` }));

  const rows = filtered.map((p: any) => {
    const issues = complianceCheck(p, getMarket(p.market));
    const owner = db.users.find((u: any) => u.id === p.ownerId);
    const agent = db.users.find((u: any) => u.id === p.agentId);
    return [
      <div className="leading-tight">
        <div className="font-medium">{p.title}</div>
        <div className="text-xs text-muted-foreground">{p.city} · {p.district}</div>
      </div>,
      <Badge tone={p.market === "FR" ? "blue" : "orange"}>{p.market === "FR" ? "🇫🇷 FR" : "🇨🇦 QC"}</Badge>,
      <span className="text-sm">{owner ? `${owner.firstName} ${owner.lastName}` : "—"}</span>,
      <span className="text-sm text-muted-foreground">{agent ? `${agent.firstName} ${agent.lastName}` : "—"}</span>,
      <span className="font-medium">{money(p.rent)}</span>,
      issues.length ? (
        <Badge tone={issues.some((i: any) => i.level === "blocking") ? "red" : "amber"}>
          <AlertTriangle className="w-3 h-3" /> {issues.length}
        </Badge>
      ) : (
        <Badge tone="green">{t("admin.compliance.ok")}</Badge>
      ),
      <button onClick={() => deleteProperty(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/5">
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>,
    ];
  });

  return (
    <Page wide>
      <PageHeader
        title={t("nav.properties")}
        subtitle={`${db.properties.length} ${locale === "fr" ? "biens enregistrés" : "properties registered"}`}
        action={<Button icon={Plus} variant="accent" onClick={() => setOpen(true)}>{t("common.add")}</Button>}
      />

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder={t("common.search")} className="pl-10" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[{ id: "all", label: t("common.all") }, { id: "FR", label: "🇫🇷 France" }, { id: "QC", label: "🇨🇦 Québec" }]}
      />

      <Card>
        <Table
          columns={[t("nav.properties"), t("common.market"), t("role.landlord"), t("role.agent"), t("property.rent"), t("common.compliance"), ""]}
          rows={rows}
          empty={t("common.empty")}
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${t("common.add")} — ${t("nav.properties")}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="accent" onClick={submit}>{t("common.save")}</Button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label={t("common.market")} required>
            <Select value={form.market} onChange={(e: any) => set("market", e.target.value)}
              options={[{ value: "FR", label: "🇫🇷 France" }, { value: "QC", label: "🇨🇦 Québec" }]} />
          </Field>
          <Field label={t("role.landlord")} required>
            <Select value={form.ownerId} onChange={(e: any) => set("ownerId", e.target.value)}
              options={owners.map((o: any) => ({ value: o.id, label: `${o.firstName} ${o.lastName}` }))} />
          </Field>
          <Field label={t("role.agent")}>
            <Select value={form.agentId} onChange={(e: any) => set("agentId", e.target.value)}
              options={[{ value: "", label: t("common.none") }, ...agents.map((a: any) => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }))]} />
          </Field>
          <Field label={locale === "fr" ? "Titre de l'annonce" : "Listing title"} required>
            <Input value={form.title} onChange={(e: any) => set("title", e.target.value)} />
          </Field>
          <Field label={locale === "fr" ? "Ville" : "City"}>
            <Input value={form.city} onChange={(e: any) => set("city", e.target.value)} />
          </Field>
          <Field label={locale === "fr" ? "Quartier" : "District"}>
            <Input value={form.district} onChange={(e: any) => set("district", e.target.value)} />
          </Field>
          <Field label={locale === "fr" ? "Adresse complète" : "Full address"}>
            <Input value={form.address} onChange={(e: any) => set("address", e.target.value)} />
          </Field>
          <Field label={t("property.rent")} required>
            <Input type="number" value={form.rent} onChange={(e: any) => set("rent", e.target.value)} />
          </Field>
          <Field label={t("property.charges")}>
            <Input type="number" value={form.charges} onChange={(e: any) => set("charges", e.target.value)} />
          </Field>
          <Field
            label={t("property.deposit")}
            hint={form.market === "QC" ? (locale === "fr" ? "Interdit au Québec — laisser à 0" : "Prohibited in Quebec — leave at 0") : undefined}
          >
            <Input type="number" value={form.deposit} onChange={(e: any) => set("deposit", e.target.value)} />
          </Field>
          <Field label={`${t("property.surface")} (${form.market === "FR" ? "m²" : "pi²"})`}>
            <Input type="number" value={form.area} onChange={(e: any) => set("area", e.target.value)} />
          </Field>
          <Field label={t("property.rooms")}>
            <Input type="number" value={form.rooms} onChange={(e: any) => set("rooms", e.target.value)} />
          </Field>
          <Field label={t("property.bedrooms")}>
            <Input type="number" value={form.bedrooms} onChange={(e: any) => set("bedrooms", e.target.value)} />
          </Field>
          <Field label={t("property.bathrooms")}>
            <Input type="number" value={form.bathrooms} onChange={(e: any) => set("bathrooms", e.target.value)} />
          </Field>
          <Field label={t("property.furnished")}>
            <Select value={form.furnished} onChange={(e: any) => set("furnished", e.target.value)}
              options={[{ value: "false", label: t("common.no") }, { value: "true", label: t("common.yes") }]} />
          </Field>
          <Field label={t("property.energy")}>
            <Select value={form.energyGrade} onChange={(e: any) => set("energyGrade", e.target.value)} options={energyOptions} />
          </Field>
          <Field label={t("property.availableFrom")}>
            <Input type="date" value={form.availableFrom} onChange={(e: any) => set("availableFrom", e.target.value)} />
          </Field>
        </div>
      </Modal>
    </Page>
  );
}
