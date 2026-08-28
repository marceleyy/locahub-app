import { useMemo, useState } from "react";
import {
  MapPin, SlidersHorizontal, Heart, Users, Check, X, TreePine,
  Building2, ArrowUpDown, Info,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, matchScore } from "@/app/store/AppStore";
import {
  Page, PageHeader, Card, Badge, Button, Modal, Field, Input, Select, EmptyState, Progress, Alert, ChipGroup,
} from "@/app/components/common/ui";

const TYPES = [
  { value: "", key: "type.any" },
  { value: "0", key: "type.studio" },
  { value: "1", key: "type.t1" },
  { value: "2", key: "type.t2" },
  { value: "3", key: "type.t3" },
  { value: "4", key: "type.t4" },
  { value: "5", key: "type.t5plus" },
];

export function TenantMap() {
  const { t, locale, money, market, m } = useI18n();
  const store = useStore();
  const { db, currentUserId } = store;

  const [filters, setFilters] = useState({ type: "", maxRent: "", city: "", furnished: "", garden: false, elevator: false });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [sort, setSort] = useState("match");

  const tenant = db.users.find((u: any) => u.id === currentUserId && u.role === "tenant") || db.users.find((u: any) => u.role === "tenant");

  const results = useMemo(() => {
    let list = db.properties.filter((p: any) => p.market === market && p.status !== "occupied");

    if (filters.type) {
      const n = Number(filters.type);
      list = list.filter((p: any) => (n === 5 ? p.rooms >= 5 : n === 0 ? p.rooms <= 1 && p.area < 30 : p.rooms === n));
    }
    if (filters.maxRent) list = list.filter((p: any) => p.rent + p.charges <= Number(filters.maxRent));
    if (filters.city) list = list.filter((p: any) => p.city.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.furnished) list = list.filter((p: any) => String(p.furnished) === filters.furnished);
    if (filters.garden) list = list.filter((p: any) => (p.features || []).some((f: string) => /jardin|terrasse|balcon|garden|terrace|balcony/i.test(f)));
    if (filters.elevator) list = list.filter((p: any) => p.elevator);

    const scored = list.map((p: any) => ({ ...p, match: tenant ? matchScore(tenant, p) : null }));
    if (sort === "price") scored.sort((a: any, b: any) => a.rent - b.rent);
    else if (sort === "area") scored.sort((a: any, b: any) => b.area - a.area);
    else scored.sort((a: any, b: any) => (b.match?.score || 0) - (a.match?.score || 0));
    return scored;
  }, [db.properties, market, filters, sort, tenant]);

  // Projection linéaire des coordonnées sur la surface de la carte
  const bounds = useMemo(() => {
    if (!results.length) return null;
    const lats = results.map((p: any) => p.lat);
    const lngs = results.map((p: any) => p.lng);
    const pad = 0.25;
    return {
      minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad,
    };
  }, [results]);

  const position = (p: any) => {
    if (!bounds) return { left: "50%", top: "50%" };
    const x = ((p.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = ((bounds.maxLat - p.lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { left: `${Math.max(6, Math.min(94, x))}%`, top: `${Math.max(8, Math.min(92, y))}%` };
  };

  const current = selected ? results.find((p: any) => p.id === selected) : null;
  const activeFilters = Object.values(filters).filter((v) => v && v !== "").length;

  return (
    <Page wide>
      <PageHeader
        title={t("nav.map")}
        subtitle={t("map.subtitle", { n: String(results.length) })}
        action={
          <div className="flex gap-2">
            <ChipGroup
              ariaLabel={t("map.sort")}
              value={sort}
              onChange={setSort}
              options={[
                { value: "match", label: t("map.sortMatch") },
                { value: "price", label: t("map.sortPrice") },
                { value: "area", label: t("map.sortArea") },
              ]}
            />
            <Button icon={SlidersHorizontal} variant="outline" onClick={() => setShowFilters(true)}>
              {t("map.filters")}{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ---------------------------------------------------- Carte */}
        <div className="lg:col-span-3">
          <Card padded={false} className="overflow-hidden">
            <div
              className="relative h-[420px] lg:h-[560px] bg-muted"
              style={{
                backgroundImage:
                  "linear-gradient(0deg, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            >
              {results.length === 0 && (
                <div className="absolute inset-0 grid place-items-center">
                  <p className="text-sm text-muted-foreground">{t("map.noResult")}</p>
                </div>
              )}

              {results.map((p: any) => {
                const isActive = selected === p.id;
                return (
                  <button
                    key={p.id}
                    aria-label={`${p.title} — ${money(p.rent)}`}
                    onClick={() => setSelected(p.id)}
                    className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                    style={position(p)}
                  >
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap tabular-nums ${
                        isActive ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground"
                      }`}
                    >
                      <MapPin className="size-3" />
                      {money(p.rent)}
                    </span>
                  </button>
                );
              })}

              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background/90 text-xs text-muted-foreground">
                <Info className="size-3.5" />
                {t("map.schematic")}
              </div>
            </div>
          </Card>

          {current && (
            <Card className="mt-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-balance">{current.title}</h3>
                  <p className="text-sm text-muted-foreground">{current.address}</p>
                </div>
                <button
                  aria-label={t("map.favorite")}
                  onClick={() => setFavorites((f) => (f.includes(current.id) ? f.filter((x) => x !== current.id) : [...f, current.id]))}
                  className="p-2 rounded-xl hover:bg-accent"
                >
                  <Heart className={`size-5 ${favorites.includes(current.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center mb-4">
                {[
                  [money(current.rent), t("unit.rent")],
                  [`${current.area} ${t("unit.area")}`, t("unit.surface")],
                  [current.rooms, t("unit.rooms")],
                  [current.energy?.grade || "—", t("unit.energy")],
                ].map(([v, l], i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted">
                    <div className="font-bold tabular-nums">{v}</div>
                    <div className="text-xs text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>

              {current.match && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("map.compatibility")}</span>
                    <span className="font-semibold tabular-nums">{current.match.score} / 100</span>
                  </div>
                  <Progress value={current.match.score} tone={current.match.score >= 70 ? "green" : "orange"} />
                </div>
              )}

              <Button variant="accent" className="w-full" onClick={() => setApplying(current.id)}>
                {t("map.apply")}
              </Button>
            </Card>
          )}
        </div>

        {/* ---------------------------------------------------- Liste */}
        <div className="lg:col-span-2 space-y-3 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1">
          {results.length === 0 ? (
            <EmptyState label={t("map.noResult")} action={<Button onClick={() => setFilters({ type: "", maxRent: "", city: "", furnished: "", garden: false, elevator: false })}>{t("map.clearFilters")}</Button>} />
          ) : (
            results.map((p: any) => (
              <Card
                key={p.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${selected === p.id ? "ring-2 ring-secondary" : ""}`}
              >
                <button className="w-full text-left" onClick={() => setSelected(p.id)}>
                  <div className="flex gap-3">
                    {p.images?.[0] && (
                      <img src={p.images[0]} alt="" className="size-20 rounded-xl object-cover shrink-0" loading="lazy" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-balance line-clamp-1">{p.title}</h4>
                      <p className="text-xs text-muted-foreground mb-1.5">{p.district || p.city}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="font-semibold tabular-nums">{money(p.rent)}</span>
                        <span className="text-muted-foreground tabular-nums">+{money(p.charges)} {t("unit.charges")}</span>
                        <span className="text-muted-foreground tabular-nums">{p.area} {t("unit.area")}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.match && (
                          <Badge tone={p.match.score >= 70 ? "green" : "amber"}>
                            <span className="tabular-nums">{p.match.score}%</span>
                          </Badge>
                        )}
                        {p.furnished && <Badge tone="blue">{t("unit.furnished")}</Badge>}
                        {p.elevator && <Badge tone="neutral"><Building2 className="size-3" />{t("unit.elevator")}</Badge>}
                        {(p.features || []).some((f: string) => /jardin|terrasse|balcon|garden|terrace|balcony/i.test(f)) && (
                          <Badge tone="green"><TreePine className="size-3" />{t("unit.outdoor")}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- Filtres */}
      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title={t("map.filters")}
        footer={
          <>
            <Button variant="outline" onClick={() => setFilters({ type: "", maxRent: "", city: "", furnished: "", garden: false, elevator: false })}>
              {t("map.clearFilters")}
            </Button>
            <Button variant="accent" onClick={() => setShowFilters(false)}>{t("map.showResults", { n: String(results.length) })}</Button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label={t("map.type")}>
            <ChipGroup
              ariaLabel={t("map.type")}
              value={filters.type || "any"}
              onChange={(v: string) => setFilters((f) => ({ ...f, type: v === "any" ? "" : v }))}
              options={TYPES.map((x) => ({ value: x.value || "any", label: t(x.key) }))}
            />
          </Field>
          <Field label={t("map.maxBudget")} hint={t("map.maxBudgetHint")}>
            <Input type="number" value={filters.maxRent} onChange={(e: any) => setFilters((f) => ({ ...f, maxRent: e.target.value }))} />
          </Field>
          <Field label={t("map.area")}>
            <Input value={filters.city} onChange={(e: any) => setFilters((f) => ({ ...f, city: e.target.value }))} placeholder={market === "FR" ? "Paris, Lyon…" : "Montréal, Québec…"} />
          </Field>
          <Field label={t("map.furnishing")}>
            <ChipGroup
              ariaLabel={t("map.furnishing")}
              value={filters.furnished || "any"}
              onChange={(v: string) => setFilters((f) => ({ ...f, furnished: v === "any" ? "" : v }))}
              options={[
                { value: "any", label: t("type.any") },
                { value: "true", label: t("unit.furnished") },
                { value: "false", label: t("unit.unfurnished") },
              ]}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4 mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.garden} onChange={(e) => setFilters((f) => ({ ...f, garden: e.target.checked }))} className="size-4 rounded" />
            {t("map.outdoorSpace")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.elevator} onChange={(e) => setFilters((f) => ({ ...f, elevator: e.target.checked }))} className="size-4 rounded" />
            {t("unit.elevator")}
          </label>
        </div>
      </Modal>

      <JointApplicationModal propertyId={applying} onClose={() => setApplying(null)} />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Candidature groupée : couple, colocation, garant                     */
/* ------------------------------------------------------------------ */

function JointApplicationModal({ propertyId, onClose }: { propertyId: string | null; onClose: () => void }) {
  const { t, m, locale, money } = useI18n();
  const store = useStore();
  const { db, currentUserId } = store;

  const [mode, setMode] = useState<"alone" | "joint">("alone");
  const [coApplicants, setCoApplicants] = useState<string[]>([]);
  const [invite, setInvite] = useState("");
  const [sent, setSent] = useState(false);

  const property = propertyId ? store.getProperty(propertyId) : null;
  const others = db.users.filter((u: any) => u.role === "tenant" && u.id !== currentUserId);
  const me = db.users.find((u: any) => u.id === currentUserId) || db.users.find((u: any) => u.role === "tenant");

  if (!property) return null;

  const incomes = [me, ...coApplicants.map((id) => db.users.find((u: any) => u.id === id))]
    .filter(Boolean)
    .reduce((a: number, u: any) => a + (u.income || 0), 0);
  const ratio = property.rent > 0 ? incomes / property.rent : 0;

  const submit = () => {
    store.createApplication({
      propertyId: property.id,
      tenantId: me?.id,
      coApplicantIds: mode === "joint" ? coApplicants : [],
      status: "submitted",
      submittedAt: new Date().toISOString().slice(0, 10),
      humanReviewed: false,
    });
    setSent(true);
  };

  return (
    <Modal
      open={!!propertyId}
      onClose={() => { setSent(false); setMode("alone"); setCoApplicants([]); onClose(); }}
      title={t("apply.title")}
      footer={
        sent ? (
          <Button onClick={() => { setSent(false); setMode("alone"); setCoApplicants([]); onClose(); }}>{t("common.close")}</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button variant="accent" onClick={submit}>{t("apply.submit")}</Button>
          </>
        )
      }
    >
      {sent ? (
        <div className="text-center py-6">
          <div className="size-14 rounded-2xl bg-success-subtle grid place-items-center mx-auto mb-4">
            <Check className="size-7 text-success" />
          </div>
          <h3 className="font-semibold mb-1">{t("apply.sentTitle")}</h3>
          <p className="text-sm text-muted-foreground text-pretty">{t("apply.sentBody")}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-3 rounded-xl bg-muted">
            <div className="font-medium text-sm">{property.title}</div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {money(property.rent)} + {money(property.charges)} {t("unit.charges")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "alone", label: t("apply.alone"), icon: Users },
              { id: "joint", label: t("apply.joint"), icon: Users },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id as any)}
                className={`p-4 rounded-xl border text-left transition ${
                  mode === opt.id ? "border-secondary bg-secondary/5" : "border-border hover:bg-accent"
                }`}
              >
                <opt.icon className="size-5 mb-2 text-muted-foreground" />
                <div className="text-sm font-medium">{opt.label}</div>
              </button>
            ))}
          </div>

          {mode === "joint" && (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-2">{t("apply.coApplicants")}</h4>
                <p className="text-xs text-muted-foreground mb-3 text-pretty">{t("apply.coApplicantsHint")}</p>
                <div className="space-y-2">
                  {others.map((u: any) => {
                    const checked = coApplicants.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setCoApplicants((c) => (checked ? c.filter((x) => x !== u.id) : [...c, u.id]))}
                          className="size-4 rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {u.income ? `${money(u.income)} ${t("apply.monthlyIncome")}` : t("apply.noIncome")}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <Field label={t("apply.inviteByEmail")} hint={t("apply.inviteHint")}>
                <div className="flex gap-2">
                  <Input type="email" value={invite} onChange={(e: any) => setInvite(e.target.value)} placeholder="nom@exemple.com" />
                  <Button variant="outline" disabled={!invite.includes("@")} onClick={() => setInvite("")}>{t("apply.invite")}</Button>
                </div>
              </Field>
            </>
          )}

          <div className="p-4 rounded-xl border border-border">
            <div className="flex justify-between text-sm mb-1">
              <span>{t("apply.combinedIncome")}</span>
              <span className="font-semibold tabular-nums">{money(incomes)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>{t("apply.ratio")}</span>
              <span className={`font-semibold tabular-nums ${ratio >= 3 ? "text-success" : "text-secondary"}`}>
                {ratio.toFixed(1)}×
              </span>
            </div>
            <Progress value={Math.min(100, (ratio / 4) * 100)} tone={ratio >= 3 ? "green" : "orange"} />
            <p className="text-xs text-muted-foreground mt-2 text-pretty">{t("apply.ratioHint")}</p>
          </div>

          <Alert tone="blue" icon={Info} title={t("apply.rightsTitle")}>
            {t("apply.rightsBody")}
          </Alert>
        </div>
      )}
    </Modal>
  );
}
