import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft, MapPin, Bed, Bath, Ruler, Star, Zap, History, Send, Heart,
  ShieldCheck, FileText, Building2, Info, Play, MessageCircle, Flag,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, matchScore, marketGap, complianceCheck } from "@/app/store/AppStore";
import { getMarket } from "@/app/config/markets";
import {
  Page, Card, Badge, Button, SectionTitle, RatingBar, Alert, Progress, Tabs, EmptyState,
} from "@/app/components/common/ui";

export function PropertyDetail() {
  const { id } = useParams();
  const { t, locale, money, date, tv } = useI18n();
  const { db, getProperty, getUser, currentUser, createApplication } = useStore();
  const [tab, setTab] = useState("overview");
  const [applied, setApplied] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const p = getProperty(id || "");
  if (!p) return <Page><Card><EmptyState label={t("common.empty")} /></Card></Page>;

  const marketCfg = getMarket(p.market);
  const tenant = currentUser?.role === "tenant" ? currentUser : db.users.find((u: any) => u.role === "tenant");
  const ms = matchScore(tenant, p) as any;
  const gap = marketGap(p);
  const issues = complianceCheck(p, marketCfg);
  const owner = getUser(p.ownerId);
  const agent = p.agentId ? getUser(p.agentId) : null;
  const prevRent = p.legal?.sectionG?.lowestRent12m ?? p.legal?.previousRent;
  const utilities = Object.entries(p.utilities || {});
  const utilitiesTotal = utilities.reduce((a: number, [, v]: any) => a + (Number(v) || 0), 0);
  const similar = db.properties.filter((x: any) => x.id !== p.id && x.market === p.market && x.city === p.city).slice(0, 3);

  const apply = () => {
    if (applied) return;
    createApplication({ propertyId: p.id, tenantId: tenant?.id, score: ms.score, status: "sent", rank: 1, aiSummary: null });
    setApplied(true);
  };

  const utilityLabel = (key: string) => {
    const found = marketCfg.utilities.find((u: any) => u.id === key);
    return found ? tv(found) : key;
  };

  return (
    <Page>
      <Link to="/tenant/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> {t("common.back")}
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Galerie */}
          <Card padded={false} className="overflow-hidden mb-4">
            <div className="relative aspect-video bg-muted">
              {p.images?.[imgIndex] && <img src={p.images[imgIndex]} alt={p.title} className="w-full h-full object-cover" />}
              <button className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-background/90 flex items-center justify-center hover:scale-105 transition shadow-lg">
                <Play className="w-5 h-5 ml-0.5" />
              </button>
              <Badge tone="neutral" className="absolute bottom-3 left-3 shadow-sm">{t("property.virtualTour")}</Badge>
            </div>
            {p.images?.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {p.images.map((src: string, i: number) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${i === imgIndex ? "border-primary" : "border-transparent opacity-70"}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="mb-4">
            <h1 className="text-2xl font-bold mb-1">{p.title}</h1>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm mb-4">
              <MapPin className="w-4 h-4" /> {p.address}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
              <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-muted-foreground" />{p.bedrooms} {t("property.bedrooms").toLowerCase()}</span>
              <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-muted-foreground" />{p.bathrooms}</span>
              <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4 text-muted-foreground" />{p.area} {marketCfg.areaUnit}</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-muted-foreground" />{p.energy?.grade}</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-warning text-warning" />{p.ratings?.overall?.toFixed(1)} ({p.reviewCount})</span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{p.description}</p>

            <div className="flex flex-wrap gap-2">
              {p.features?.map((f: string) => <Badge key={f} tone="blue">{f}</Badge>)}
            </div>
          </Card>

          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: "overview", label: t("property.ratings") },
              { id: "costs", label: t("property.utilities") },
              { id: "market", label: t("property.marketComparison") },
              { id: "legal", label: t("legal.title") },
            ]}
          />

          {tab === "overview" && (
            <Card>
              <SectionTitle icon={Star}>{t("property.ratings")}</SectionTitle>
              <div className="space-y-3 mb-5">
                <RatingBar label={t("property.rating.insulation")} value={p.ratings?.insulation || 0} />
                <RatingBar label={t("property.rating.noise")} value={p.ratings?.noise || 0} />
                <RatingBar label={t("property.rating.cleanliness")} value={p.ratings?.cleanliness || 0} />
                <RatingBar label={t("property.rating.landlord")} value={p.ratings?.landlord || 0} />
                <RatingBar label={t("property.rating.neighborhood")} value={p.ratings?.neighborhood || 0} />
              </div>
              <Alert tone="blue" icon={ShieldCheck}>{t("property.reviewsVerifiedOnly")}</Alert>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" icon={MessageCircle}>{t("property.reviews")}</Button>
                <Button variant="ghost" size="sm" icon={Flag}>{t("property.report")}</Button>
              </div>
            </Card>
          )}

          {tab === "costs" && (
            <Card>
              <SectionTitle icon={Info}>{t("property.utilities")}</SectionTitle>
              <div className="space-y-2 mb-4">
                {utilities.map(([k, v]: any) => (
                  <div key={k} className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0">
                    <span className="text-muted-foreground">{utilityLabel(k)}</span>
                    <span className="font-medium">{Number(v) > 0 ? money(Number(v)) : (locale === "fr" ? "Inclus" : "Included")}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-primary/10 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">{t("property.rent")} + {t("property.charges").toLowerCase()}</span>
                  <span className="font-semibold">{money(p.rent + (p.charges || 0))}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{t("property.utilities")}</span>
                  <span className="font-semibold">{money(utilitiesTotal)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-primary/30">
                  <span className="font-semibold">{t("property.totalCost")}</span>
                  <span className="text-xl font-bold text-primary">{money(p.rent + (p.charges || 0) + utilitiesTotal)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {p.market === "QC"
                  ? (locale === "fr" ? "Estimation basée sur la consommation moyenne déclarée par les anciens occupants (Hydro-Québec)." : "Estimate based on average consumption reported by previous occupants (Hydro-Québec).")
                  : (locale === "fr" ? "Estimation basée sur le DPE et les charges de copropriété communiquées par le bailleur." : "Estimate based on the energy certificate and building charges provided by the landlord.")}
              </p>
            </Card>
          )}

          {tab === "market" && (
            <Card>
              <SectionTitle icon={Building2}>{t("property.marketComparison")}</SectionTitle>
              <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                <div className="p-4 rounded-xl bg-muted/60">
                  <div className="text-xs text-muted-foreground mb-1">P25</div>
                  <div className="font-bold">{money(p.marketP25 || 0)}</div>
                </div>
                <div className="p-4 rounded-xl bg-primary/10">
                  <div className="text-xs text-muted-foreground mb-1">{t("market.medianRent")}</div>
                  <div className="font-bold text-primary">{money(p.marketMedian || 0)}</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/60">
                  <div className="text-xs text-muted-foreground mb-1">P75</div>
                  <div className="font-bold">{money(p.marketP75 || 0)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t("property.priceGap")}</span>
                <Badge tone={gap > 5 ? "red" : gap < -3 ? "green" : "neutral"}>{gap > 0 ? "+" : ""}{gap} %</Badge>
              </div>

              {prevRent && (
                <div className="rounded-xl bg-secondary/5 border border-secondary/30 p-4 mt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-secondary mb-2">
                    <History className="w-4 h-4" />{tv(marketCfg.disclosure.previousRent.label)}
                  </div>
                  <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                    <span className="text-2xl font-bold">{money(prevRent)}</span>
                    <span className="text-sm text-muted-foreground">
                      → {money(p.rent)} {p.rent > prevRent && `(+${Math.round(((p.rent - prevRent) / prevRent) * 1000) / 10} %)`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tv(marketCfg.disclosure.previousRent.legalBasis)}</p>
                </div>
              )}

              <div className="mt-5">
                <SectionTitle icon={MapPin}>{t("property.similar")}</SectionTitle>
                <div className="space-y-2">
                  {similar.map((s: any) => (
                    <Link key={s.id} to={`/tenant/property/${s.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-accent transition">
                      {s.images?.[0] && <img src={s.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.area} {marketCfg.areaUnit} · {s.district}</div>
                      </div>
                      <span className="font-semibold text-sm">{money(s.rent)}</span>
                    </Link>
                  ))}
                  {similar.length === 0 && <EmptyState label={t("common.empty")} />}
                </div>
              </div>
            </Card>
          )}

          {tab === "legal" && (
            <Card>
              <SectionTitle icon={FileText}>{t("legal.docsRequired")}</SectionTitle>
              <div className="space-y-2 mb-5">
                {marketCfg.mandatoryDocs.map((doc: any) => {
                  const value = (p.legal?.diagnostics || {})[doc.id];
                  return (
                    <div key={doc.id} className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0">
                      <span className="text-muted-foreground">{tv(doc)}</span>
                      {value ? <Badge tone="green">{date(value)}</Badge>
                        : value === null ? <Badge tone="red">{locale === "fr" ? "Manquant" : "Missing"}</Badge>
                        : <Badge tone="neutral">{locale === "fr" ? "Non applicable" : "N/A"}</Badge>}
                    </div>
                  );
                })}
              </div>

              {issues.map((i: any, idx: number) => (
                <div key={idx} className="mb-2">
                  <Alert tone={i.level === "blocking" ? "red" : "orange"}>{tv(i)}</Alert>
                </div>
              ))}

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="font-medium mb-1">{t("legal.depositRule")}</div>
                  <p className="text-muted-foreground text-xs">{tv(marketCfg.deposit.note)}</p>
                </div>
                <div>
                  <div className="font-medium mb-1">{t("legal.noticeRule")}</div>
                  <p className="text-muted-foreground text-xs">{tv(marketCfg.noticePeriods.tenant)}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-4">
            <Card>
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="text-3xl font-bold">{money(p.rent)}</span>
                <span className="text-sm text-muted-foreground">/ {t("common.month")}</span>
              </div>
              {p.charges > 0 && (
                <p className="text-sm text-muted-foreground mb-3">+ {money(p.charges)} {t("property.charges").toLowerCase()}</p>
              )}
              <div className="text-sm text-muted-foreground mb-4">
                {t("property.deposit")} : <span className="font-medium text-foreground">
                  {marketCfg.deposit.allowed ? money(p.deposit || 0) : (locale === "fr" ? "Interdit au Québec" : "Prohibited in Quebec")}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{t("tenant.feed.matchScore")}</span>
                  <span className="font-semibold">{ms.score}%</span>
                </div>
                <Progress value={ms.score} tone={ms.score > 70 ? "green" : "orange"} />
              </div>

              <Button variant="accent" icon={Send} onClick={apply} disabled={applied} className="w-full mb-2">
                {applied ? t("tenant.feed.applied") : t("tenant.feed.applyOneClick")}
              </Button>
              <Button variant="outline" icon={Heart} className="w-full">{t("nav.favorites")}</Button>

              <p className="text-xs text-muted-foreground mt-3 text-center">
                {t("property.availableFrom")} {date(p.availableFrom)}
              </p>
            </Card>

            <Card>
              <SectionTitle icon={Building2}>{locale === "fr" ? "Contact" : "Contact"}</SectionTitle>
              <div className="text-sm space-y-2">
                <div>
                  <div className="text-muted-foreground text-xs">{t("role.landlord")}</div>
                  <div className="font-medium">{owner ? `${owner.firstName} ${owner.lastName}` : "—"}</div>
                </div>
                {agent && (
                  <div>
                    <div className="text-muted-foreground text-xs">{t("role.agent")}</div>
                    <div className="font-medium">{agent.firstName} {agent.lastName}</div>
                    <div className="text-xs text-muted-foreground">{agent.agency}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t("agent.licence")} : {agent.licence}</div>
                  </div>
                )}
              </div>
              <Link to="/tenant/messages">
                <Button variant="outline" size="sm" icon={MessageCircle} className="w-full mt-3">{t("messages.title")}</Button>
              </Link>
            </Card>

            <Card>
              <SectionTitle icon={ShieldCheck}>{t("legal.docsForbidden")}</SectionTitle>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                {marketCfg.applicationDocs.forbidden.slice(0, 4).map((d: any, i: number) => (
                  <li key={i} className="flex gap-2"><span className="text-destructive">✕</span>{tv(d)}</li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-3">{tv(marketCfg.applicationDocs.penaltyNote)}</p>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
