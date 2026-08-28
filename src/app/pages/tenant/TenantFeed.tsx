import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Heart, MessageCircle, Bookmark, Share2, Star, MapPin, Bed, Bath, Ruler, Volume2, ThermometerSun, Sparkles, TrendingDown, TrendingUp, Zap, SlidersHorizontal, Search, Send, History, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, matchScore, marketGap } from "@/app/store/AppStore";
import { Page, Card, Badge, Button, Modal, Field, Input, Select, EmptyState, Progress, Alert } from "@/app/components/common/ui";
import { feedback } from "@/app/lib/feedback";
import { completenessOf } from "@/app/store/AppStore";

export function TenantFeed() {
  const { t, locale, money, date, m, market, tv } = useI18n();
  const { db, currentUser, createApplication, updateApplication } = useStore();

  const tenant =
    currentUser?.role === "tenant"
      ? currentUser
      : db.users.find((u: any) => u.role === "tenant" && u.market === market) || db.users.find((u: any) => u.role === "tenant");

  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ maxRent: "", minArea: "", furnished: "any", city: "" });

  const toggle = (list: string[], setList: any, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const properties = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = db.properties.filter((p: any) => {
      if (p.market !== market) return false;
      if (q && !`${p.title} ${p.city} ${p.district} ${p.address}`.toLowerCase().includes(q)) return false;
      if (filters.maxRent && p.rent > Number(filters.maxRent)) return false;
      if (filters.minArea && p.area < Number(filters.minArea)) return false;
      if (filters.furnished !== "any" && String(p.furnished) !== filters.furnished) return false;
      if (filters.city && p.city !== filters.city) return false;
      return true;
    });

    if (sort === "price") out = [...out].sort((a: any, b: any) => a.rent - b.rent);
    else if (sort === "rating") out = [...out].sort((a: any, b: any) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0));
    else out = [...out].sort((a: any, b: any) => (matchScore(tenant, b) as any).score - (matchScore(tenant, a) as any).score);

    return out;
  }, [db.properties, market, query, sort, filters, tenant]);

  const cities = Array.from(new Set(db.properties.filter((p: any) => p.market === market).map((p: any) => p.city)));

  /**
   * Candidature en un geste.
   *
   * Aucune confirmation bloquante : le bouton bascule d'abord, la candidature
   * est créée dans la foulée. Le seul filet est un bouton « Annuler » dans le
   * toast, qui vaut mieux qu'une boîte de dialogue posée avant chaque envoi —
   * on ne fait pas payer à tout le monde le prix d'une erreur rare.
   *
   * Le dossier reste envoyé même incomplet : c'est au gestionnaire de le
   * réclamer, pas à l'interface de bloquer le candidat.
   */
  const apply = (p: any) => {
    if (applied.includes(p.id)) return;
    const ms = matchScore(tenant, p) as any;

    setApplied((prev: string[]) => [...prev, p.id]);
    const application = createApplication({
      propertyId: p.id, tenantId: tenant?.id, score: ms.score,
      status: "sent", rank: 1, aiSummary: null,
    });

    const completeness = completenessOf(tenant?.documents);
    feedback.success(t("tenant.feed.applySent", { title: p.title }), {
      description: completeness < 80 ? t("tenant.feed.applyIncomplete", { pct: String(completeness) }) : undefined,
      action: {
        label: t("common.undo"),
        onClick: () => {
          setApplied((prev: string[]) => prev.filter((x) => x !== p.id));
          if (application?.id) updateApplication(application.id, { status: "withdrawn" });
          feedback.info(t("tenant.feed.applyUndone"));
        },
      },
    });
  };

  return (
    <Page>
      <div className="max-w-2xl mx-auto">
        {/* Recherche */}
        <Card className="mb-5">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder={t("tenant.feed.searchPlaceholder")} className="pl-10" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button size="sm" variant="outline" icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)}>{t("common.filters")}</Button>
            {[
              { id: "relevance", label: t("tenant.feed.sortRelevance") },
              { id: "price", label: t("tenant.feed.sortPrice") },
              { id: "rating", label: t("tenant.feed.sortRating") },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={`px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition ${
                  sort === s.id ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Card>

        {properties.length === 0 && <Card><EmptyState label={t("common.empty")} /></Card>}

        <div className="space-y-6">
          {properties.map((p: any) => {
            const ms = matchScore(tenant, p) as any;
            const gap = marketGap(p);
            const prevRent = p.legal?.sectionG?.lowestRent12m ?? p.legal?.previousRent;
            const utilitiesTotal = Object.values(p.utilities || {}).reduce((a: any, b: any) => a + (Number(b) || 0), 0);

            return (
              <Card key={p.id} padded={false} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" loading="lazy" />}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <Badge tone="blue" className="shadow-sm">
                      <Sparkles className="w-3 h-3" /> {t("tenant.feed.matchScore")} {ms.score}%
                    </Badge>
                    {gap < -3 && (
                      <Badge tone="green" className="shadow-sm">
                        <TrendingDown className="w-3 h-3" /> {gap}%
                      </Badge>
                    )}
                    {gap > 5 && (
                      <Badge tone="red" className="shadow-sm">
                        <TrendingUp className="w-3 h-3" /> +{gap}%
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <Badge tone="neutral" className="shadow-sm">
                      <Zap className="w-3 h-3" /> {p.energy?.grade}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 px-4 pt-3">
                  <button onClick={() => toggle(liked, setLiked, p.id)} className="flex items-center gap-1.5 text-sm">
                    <Heart className={`w-5 h-5 transition ${liked.includes(p.id) ? "fill-destructive text-destructive scale-110" : "text-muted-foreground"}`} />
                    <span className="text-muted-foreground">{p.likes + (liked.includes(p.id) ? 1 : 0)}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{p.comments}</span>
                  </button>
                  <button className="text-muted-foreground"><Share2 className="w-5 h-5" /></button>
                  <button onClick={() => toggle(saved, setSaved, p.id)} className="ml-auto">
                    <Bookmark className={`w-5 h-5 transition ${saved.includes(p.id) ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
                  </button>
                </div>

                <div className="p-4">
                  <Link to={`/tenant/property/${p.id}`}>
                    <h3 className="font-semibold mb-1 hover:text-primary transition">{p.title}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> {p.district}, {p.city}
                  </p>

                  <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                    <span className="text-2xl font-bold">{money(p.rent)}</span>
                    <span className="text-sm text-muted-foreground">/ {t("common.month")}</span>
                    {p.charges > 0 && <span className="text-xs text-muted-foreground">+ {money(p.charges)} {t("property.charges").toLowerCase()}</span>}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
                    <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{p.bedrooms}</span>
                    <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{p.bathrooms}</span>
                    <span className="flex items-center gap-1"><Ruler className="w-4 h-4" />{p.area} {m.areaUnit}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />{p.ratings?.overall?.toFixed(1)} ({p.reviewCount})
                    </span>
                  </div>

                  {prevRent && (
                    <div className="rounded-xl bg-secondary/5 border border-secondary/30 p-3 mb-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-secondary mb-1">
                        <History className="w-3.5 h-3.5" />
                        {tv(m.disclosure.previousRent.label)}
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-bold">{money(prevRent)}</span>
                        {p.rent > prevRent && (
                          <span className="text-xs text-destructive font-medium">
                            +{Math.round(((p.rent - prevRent) / prevRent) * 1000) / 10} % {locale === "fr" ? "depuis" : "since"}{" "}
                            {date(p.legal?.sectionG?.sinceDate || p.legal?.previousRentDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                        {tv(m.disclosure.previousRent.legalBasis)}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { icon: ThermometerSun, label: t("property.rating.insulation"), value: p.ratings?.insulation },
                      { icon: Volume2, label: t("property.rating.noise"), value: p.ratings?.noise },
                      { icon: Sparkles, label: t("property.rating.cleanliness"), value: p.ratings?.cleanliness },
                    ].map((r, i) => (
                      <div key={i} className="rounded-xl bg-muted/60 p-2.5 text-center">
                        <r.icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm font-semibold">{r.value?.toFixed(1)}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">{r.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-muted/60 mb-4">
                    <span className="text-muted-foreground">{t("property.totalCost")}</span>
                    <span className="font-semibold">{money(p.rent + (p.charges || 0) + Number(utilitiesTotal))} / {t("common.month")}</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{t("tenant.feed.matchScore")}</span>
                      <span className="font-semibold">{ms.score}%</span>
                    </div>
                    <Progress value={ms.score} tone={ms.score > 70 ? "green" : "orange"} />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ms.factors?.map((f: any) => (
                        <span key={f.key} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                          {tv(f.label)} {Math.round(f.value * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Cible massive : c'est l'action que le locataire vient chercher */}
                    <Button
                      size="lg"
                      variant={applied.includes(p.id) ? "outline" : "accent"}
                      icon={applied.includes(p.id) ? CheckCircle2 : Send}
                      onClick={() => apply(p)}
                      disabled={applied.includes(p.id)}
                      className="flex-1"
                    >
                      {applied.includes(p.id) ? t("tenant.feed.applied") : t("tenant.feed.applyOneClick")}
                    </Button>
                    <Link to={`/tenant/property/${p.id}`} className="shrink-0">
                      <Button size="lg" variant="outline" aria-label={t("common.details")}>
                        {t("common.details")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6">
          <Alert tone="blue">{t("legal.automatedDecisionInfo")}</Alert>
        </div>
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t("common.filters")}
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFilters({ maxRent: "", minArea: "", furnished: "any", city: "" })}>{t("common.reset")}</Button>
            <Button onClick={() => setFiltersOpen(false)}>{t("common.confirm")}</Button>
          </>
        }
      >
        <Field label={locale === "fr" ? "Loyer maximum" : "Maximum rent"}>
          <Input type="number" value={filters.maxRent} onChange={(e: any) => setFilters({ ...filters, maxRent: e.target.value })} />
        </Field>
        <Field label={`${t("property.surface")} min (${m.areaUnit})`}>
          <Input type="number" value={filters.minArea} onChange={(e: any) => setFilters({ ...filters, minArea: e.target.value })} />
        </Field>
        <Field label={t("property.furnished")}>
          <Select
            value={filters.furnished}
            onChange={(e: any) => setFilters({ ...filters, furnished: e.target.value })}
            options={[
              { value: "any", label: t("common.all") },
              { value: "true", label: t("property.furnished") },
              { value: "false", label: t("property.unfurnished") },
            ]}
          />
        </Field>
        <Field label={locale === "fr" ? "Ville" : "City"}>
          <Select
            value={filters.city}
            onChange={(e: any) => setFilters({ ...filters, city: e.target.value })}
            options={[{ value: "", label: t("common.all") }, ...cities.map((c: any) => ({ value: c, label: c }))]}
          />
        </Field>
      </Modal>
    </Page>
  );
}
