import { useMemo, useState } from "react";
import {
  Wrench, Camera, Sparkles, Send, Check, AlertTriangle, Clock,
  Star, ShieldCheck, X, Info,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { feedback } from "@/app/lib/feedback";
import { DictationInput } from "@/app/components/common/DictationInput";
import { triageTicket, suggestProviders } from "@/app/lib/assist";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Field,
  Input, Textarea, Select, Alert, Progress, EmptyState,
} from "@/app/components/common/ui";

const PRIORITY_TONE: Record<string, string> = { urgent: "red", high: "orange", normal: "amber", low: "neutral" };

/**
 * Fiche d'intervention partagée locataire / propriétaire / gestionnaire.
 * Le triage propose une priorité et un prestataire ; la validation reste humaine.
 */
export function InterventionForm() {
  const { t, tv, locale, money, market } = useI18n();
  const store = useStore();
  const { db, currentUserId } = store;

  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [chosenProvider, setChosenProvider] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const me = db.users.find((u: any) => u.id === currentUserId);
  const isManager = me?.role === "agent" || me?.role === "admin" || me?.role === "landlord";

  const myProperties = useMemo(() => {
    if (isManager) return db.properties.filter((p: any) => p.market === market);
    const lease = store.leaseOfTenant(currentUserId);
    const p = lease ? store.getProperty(lease.propertyId) : null;
    return p ? [p] : db.properties.filter((x: any) => x.market === market).slice(0, 1);
  }, [db.properties, market, isManager, currentUserId, store]);

  const triage = useMemo(() => (description.length > 8 ? triageTicket(`${title} ${description}`) : null), [title, description]);

  const providers = useMemo(
    () => (triage ? suggestProviders(db.providers.filter((p: any) => p.market === market), triage.trade) : []),
    [triage, db.providers, market]
  );

  const submit = () => {
    if (!description.trim()) return;
    const t2 = triageTicket(`${title} ${description}`);
    store.createTicket({
      market,
      propertyId: propertyId || myProperties[0]?.id,
      title: { fr: title || t2.categoryLabel.fr, en: title || t2.categoryLabel.en },
      description: { fr: description, en: description },
      category: t2.category,
      priority: t2.priority,
      status: "open",
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: currentUserId,
      slaHours: t2.slaHours,
      photos,
      proposedProviderId: chosenProvider,
      providerApproved: false,
    });
    feedback.success(t("toast.reportSent"));
    setSent(true);
  };

  const reset = () => {
    setSent(false); setDescription(""); setTitle(""); setPhotos([]); setChosenProvider(null);
  };

  if (sent) {
    return (
      <Page>
        <Card className="text-center py-10">
          <div className="size-16 rounded-2xl bg-success-subtle grid place-items-center mx-auto mb-4">
            <Check className="size-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("intervention.sentTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto text-pretty">{t("intervention.sentBody")}</p>
          <Button onClick={reset}>{t("intervention.newReport")}</Button>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title={t("nav.intervention")} subtitle={t("intervention.subtitle")} />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionTitle icon={Wrench}>{t("intervention.describe")}</SectionTitle>

          {myProperties.length > 1 && (
            <Field label={t("common.property")} required>
              <Select
                value={propertyId}
                onChange={(e: any) => setPropertyId(e.target.value)}
                options={[{ value: "", label: t("common.select") }, ...myProperties.map((p: any) => ({ value: p.id, label: p.title }))]}
              />
            </Field>
          )}

          <Field label={t("intervention.title")}>
            <Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder={t("intervention.titlePlaceholder")} />
          </Field>

          <Field label={t("intervention.description")} required hint={t("intervention.descriptionHint")}>
            <DictationInput
              value={description}
              onChange={setDescription}
              placeholder={t("intervention.descriptionPlaceholder")}
              aria-label={t("intervention.description")}
              className="min-h-[140px]"
            />
          </Field>

          <Field label={t("intervention.photos")} hint={t("intervention.photosHint")}>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt="" className="size-20 rounded-xl object-cover" />
                  <button
                    aria-label={t("common.delete")}
                    onClick={() => setPhotos((x) => x.filter((_, k) => k !== i))}
                    className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-foreground text-background grid place-items-center"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setPhotos((x) => [...x, `https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=200&q=60&sig=${x.length}`])}
                className="size-20 rounded-xl border-2 border-dashed border-border grid place-items-center hover:bg-accent"
                aria-label={t("intervention.addPhoto")}
              >
                <Camera className="size-5 text-muted-foreground" />
              </button>
            </div>
          </Field>

          <Button variant="accent" icon={Send} className="w-full mt-2" disabled={!description.trim()} onClick={submit}>
            {t("intervention.send")}
          </Button>
        </Card>

        {/* ------------------------------------------- Qualification */}
        <div className="space-y-5">
          <Card>
            <SectionTitle icon={Sparkles}>{t("intervention.analysis")}</SectionTitle>
            {!triage ? (
              <EmptyState label={t("intervention.waiting")} />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={PRIORITY_TONE[triage.priority]}>
                    <AlertTriangle className="size-3" />{t(`priorityLevel.${triage.priority}`)}
                  </Badge>
                  <Badge tone="blue">{triage.categoryLabel[locale] || triage.categoryLabel.fr}</Badge>
                  <Badge tone="neutral">
                    <Clock className="size-3" />
                    <span className="tabular-nums">{t("intervention.sla", { n: String(triage.slaHours) })}</span>
                  </Badge>
                </div>

                <Alert tone="amber" icon={Info} title={t("intervention.advice")}>
                  {triage.advice[locale] || triage.advice.fr}
                </Alert>

                {triage.matched.length > 0 && (
                  <p className="text-xs text-muted-foreground text-pretty">
                    {t("intervention.matchedOn")} {triage.matched.slice(0, 4).map((k) => `« ${k} »`).join(", ")}
                  </p>
                )}

                <p className="text-xs text-muted-foreground text-pretty border-t border-border pt-3">
                  {t("intervention.humanReview")}
                </p>
              </div>
            )}
          </Card>

          {triage && providers.length > 0 && (
            <Card>
              <SectionTitle icon={ShieldCheck}>{t("intervention.suggestedProviders")}</SectionTitle>
              <p className="text-xs text-muted-foreground mb-3 text-pretty">{t("intervention.providersHint")}</p>
              <div className="space-y-3">
                {providers.map((p: any) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border transition ${chosenProvider === p.id ? "border-secondary bg-secondary/5" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {money(p.avgHourlyRate)}/h · {p.city}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="size-3.5 fill-warning text-warning" />
                        <span className="text-sm font-semibold tabular-nums">{p.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{t("intervention.matchScore")}</span>
                        <span className="tabular-nums font-medium">{p.matchScore}/100</span>
                      </div>
                      <Progress value={p.matchScore} tone={p.matchScore >= 75 ? "green" : "orange"} />
                    </div>

                    <details className="text-xs text-muted-foreground mb-2">
                      <summary className="cursor-pointer">{t("intervention.whyThisOne")}</summary>
                      <ul className="mt-1.5 space-y-1">
                        {p.factors.map((f: any, i: number) => (
                          <li key={i} className="flex justify-between gap-2">
                            <span>{f.label[locale] || f.label.fr}</span>
                            <span className="tabular-nums">{Math.round(f.value)}/100</span>
                          </li>
                        ))}
                      </ul>
                    </details>

                    <Button
                      size="sm"
                      variant={chosenProvider === p.id ? "accent" : "outline"}
                      className="w-full"
                      onClick={() => setChosenProvider(chosenProvider === p.id ? null : p.id)}
                    >
                      {chosenProvider === p.id ? t("intervention.selected") : t("intervention.propose")}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
