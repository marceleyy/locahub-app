import { useMemo, useState } from "react";
import { HardHat, Plus, Star, Phone, Mail, ShieldCheck, Clock, Trash2, Search } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Modal, Field,
  Input, Textarea, Select, Table, EmptyState, Progress,
} from "@/app/components/common/ui";

const TRADES = ["plumber", "electrician", "hvac", "gas", "locksmith", "pest", "painter", "damp", "elevator", "general", "security"];

export function ManagerProviders() {
  const { t, tv, money, date, market, percent } = useI18n();
  const store = useStore();
  const [query, setQuery] = useState("");
  const [trade, setTrade] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const providers = useMemo(() => {
    let list = store.db.providers.filter((p: any) => p.market === market);
    if (trade) list = list.filter((p: any) => p.trades.includes(trade));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p: any) => `${p.name} ${p.contact} ${p.city}`.toLowerCase().includes(q));
    }
    return list.sort((a: any, b: any) => b.rating - a.rating);
  }, [store.db.providers, market, trade, query]);

  const current = open ? store.getProvider(open) : null;
  const currentInvoices = open ? store.invoicesOfProvider(open) : [];
  const unpaid = currentInvoices.filter((i: any) => i.status === "unpaid");

  return (
    <Page wide>
      <PageHeader
        title={t("nav.providers")}
        subtitle={t("providers.subtitle")}
        action={<Button icon={Plus} variant="accent" onClick={() => setCreating(true)}>{t("providers.new")}</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder={t("providers.search")} className="pl-9" aria-label={t("providers.search")} />
        </div>
        <Select
          aria-label={t("providers.trade")}
          value={trade}
          onChange={(e: any) => setTrade(e.target.value)}
          options={[{ value: "", label: t("providers.allTrades") }, ...TRADES.map((x) => ({ value: x, label: t(`trade.${x}`) }))]}
        />
      </div>

      {providers.length === 0 ? (
        <EmptyState label={t("providers.empty")} action={<Button icon={Plus} onClick={() => setCreating(true)}>{t("providers.new")}</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers.map((p: any) => {
            const invoices = store.invoicesOfProvider(p.id);
            const due = invoices.filter((i: any) => i.status === "unpaid");
            const expiring = p.validUntil && new Date(p.validUntil).getTime() - Date.now() < 90 * 86400000;
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-balance">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.contact} · {p.city}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="size-4 fill-warning text-warning" />
                    <span className="font-semibold text-sm tabular-nums">{p.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.trades.slice(0, 3).map((x: string) => <Badge key={x} tone="blue">{t(`trade.${x}`)}</Badge>)}
                </div>

                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t("providers.onTime")}</span>
                      <span className="tabular-nums">{percent(p.onTimeRate * 100, 0)}</span>
                    </div>
                    <Progress value={p.onTimeRate * 100} tone={p.onTimeRate >= 0.9 ? "green" : p.onTimeRate >= 0.8 ? "orange" : "red"} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span className="tabular-nums">{t("providers.jobs", { n: p.jobsCompleted })}</span>
                  <span className="tabular-nums">{money(p.avgHourlyRate)}/h</span>
                  {due.length > 0 && <Badge tone="red">{t("providers.unpaid", { n: due.length })}</Badge>}
                  {expiring && <Badge tone="amber">{t("providers.insuranceExpiring")}</Badge>}
                </div>

                <Button variant="outline" className="w-full" onClick={() => setOpen(p.id)}>{t("common.view")}</Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------ Fiche détaillée */}
      <Modal open={!!current} onClose={() => setOpen(null)} title={current?.name || ""} width="max-w-3xl">
        {current && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <a href={`tel:${current.phone}`} className="flex items-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted">
                <Phone className="size-4 text-muted-foreground" /> {current.phone}
              </a>
              <a href={`mailto:${current.email}`} className="flex items-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted truncate">
                <Mail className="size-4 text-muted-foreground shrink-0" /> <span className="truncate">{current.email}</span>
              </a>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ShieldCheck className="size-3.5" /> {t("providers.insurance")}
                </div>
                <div className="text-sm font-medium">{current.insurance}</div>
                <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {t("providers.validUntil")} {date(current.validUntil)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="size-3.5" /> {t("providers.availability")}
                </div>
                <div className="text-sm font-medium">{tv(current.availability)}</div>
              </div>
            </div>

            {current.notes && (
              <div className="p-3 rounded-xl border border-border">
                <div className="text-xs text-muted-foreground mb-1">{t("providers.notes")}</div>
                <p className="text-sm text-pretty">{tv(current.notes)}</p>
              </div>
            )}

            <div>
              <SectionTitle icon={HardHat}>{t("providers.history")}</SectionTitle>
              <Table
                columns={[t("common.date"), t("fin.label"), t("common.property"), t("fin.amount"), t("common.status")]}
                rows={currentInvoices.map((i: any) => {
                  const prop = store.getProperty(i.propertyId);
                  return [
                    <span className="tabular-nums">{date(i.date)}</span>,
                    tv(i.label),
                    <span className="text-muted-foreground text-xs">{prop?.city || "—"}</span>,
                    <span className="tabular-nums">{money(i.amount)}</span>,
                    <button
                      onClick={() => store.updateInvoice(i.id, { status: i.status === "paid" ? "unpaid" : "paid" })}
                      aria-label={t("invoice.toggle")}
                    >
                      <Badge tone={i.status === "paid" ? "green" : "red"}>{t(`invoice.${i.status}`)}</Badge>
                    </button>,
                  ];
                })}
                empty={t("providers.noHistory")}
              />
              {unpaid.length > 0 && (
                <p className="text-sm text-destructive mt-3 tabular-nums">
                  {t("providers.dueTotal")} {money(unpaid.reduce((a: number, i: any) => a + i.amount, 0))}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("providers.rate")}</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    aria-label={`${n} / 5`}
                    onClick={() => store.updateProvider(current.id, { rating: n })}
                    className="p-0.5"
                  >
                    <Star className={`size-5 ${n <= current.rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
              <Button
                variant="danger"
                icon={Trash2}
                size="sm"
                onClick={() => { store.deleteProvider(current.id); setOpen(null); }}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <NewProviderModal open={creating} onClose={() => setCreating(false)} />
    </Page>
  );
}

function NewProviderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, market } = useI18n();
  const store = useStore();
  const [form, setForm] = useState<any>({ name: "", contact: "", phone: "", email: "", city: "", trades: ["general"], avgHourlyRate: "", insurance: "", validUntil: "", notes: "" });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const toggleTrade = (x: string) =>
    set("trades", form.trades.includes(x) ? form.trades.filter((y: string) => y !== x) : [...form.trades, x]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("providers.new")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="accent"
            onClick={() => {
              if (!form.name.trim()) return;
              store.createProvider({
                ...form,
                market,
                avgHourlyRate: Number(form.avgHourlyRate) || 60,
                availability: { fr: "À préciser", en: "To be confirmed" },
                notes: { fr: form.notes, en: form.notes },
              });
              onClose();
            }}
          >
            {t("common.create")}
          </Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-x-4">
        <Field label={t("providers.company")} required><Input value={form.name} onChange={(e: any) => set("name", e.target.value)} /></Field>
        <Field label={t("providers.contactName")}><Input value={form.contact} onChange={(e: any) => set("contact", e.target.value)} /></Field>
        <Field label={t("common.phone")}><Input value={form.phone} onChange={(e: any) => set("phone", e.target.value)} /></Field>
        <Field label={t("common.email")}><Input type="email" value={form.email} onChange={(e: any) => set("email", e.target.value)} /></Field>
        <Field label={t("common.city")}><Input value={form.city} onChange={(e: any) => set("city", e.target.value)} /></Field>
        <Field label={t("providers.hourlyRate")}><Input type="number" value={form.avgHourlyRate} onChange={(e: any) => set("avgHourlyRate", e.target.value)} /></Field>
      </div>

      <Field label={t("providers.trades")} hint={t("providers.tradesHint")}>
        <div className="flex flex-wrap gap-2">
          {TRADES.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => toggleTrade(x)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                form.trades.includes(x) ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent"
              }`}
            >
              {t(`trade.${x}`)}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-x-4">
        <Field label={t("providers.insurance")} hint={t("providers.insuranceHint")}>
          <Input value={form.insurance} onChange={(e: any) => set("insurance", e.target.value)} />
        </Field>
        <Field label={t("providers.validUntil")}>
          <Input type="date" value={form.validUntil} onChange={(e: any) => set("validUntil", e.target.value)} />
        </Field>
      </div>
      <Field label={t("providers.notes")}>
        <Textarea value={form.notes} onChange={(e: any) => set("notes", e.target.value)} />
      </Field>
    </Modal>
  );
}
