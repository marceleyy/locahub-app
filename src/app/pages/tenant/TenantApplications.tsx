import { useMemo } from "react";
import { FileText, Info, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, matchScore } from "@/app/store/AppStore";
import {
  Page, PageHeader, Card, Badge, Button, Progress, StatCard,
  Alert, EmptyState,
} from "@/app/components/common/ui";

const STATUS_TONE: Record<string, any> = {
  sent: "blue", review: "amber", shortlisted: "violet",
  accepted: "green", rejected: "red", submitted: "blue",
};
const STATUS_ICON: Record<string, any> = {
  sent: Clock, review: Eye, shortlisted: Eye,
  accepted: CheckCircle2, rejected: XCircle, submitted: Clock,
};

export function TenantApplications() {
  const { t, tv, locale, money, date, market } = useI18n();
  const store = useStore();

  const me = store.activeUserOfRole("tenant", market);
  const applications = useMemo(() => {
    if (!me) return [];
    return store
      .applicationsOfTenant(me.id)
      .map((a: any) => ({ ...a, property: store.getProperty(a.propertyId) }))
      .filter((a: any) => a.property?.market === market)
      .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [store, me, market]);

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((a: any) => ["sent", "review", "shortlisted", "submitted"].includes(a.status)).length,
    accepted: applications.filter((a: any) => a.status === "accepted").length,
  }), [applications]);

  if (!me) return <Page><EmptyState label={t("profile.noTenant")} /></Page>;

  return (
    <Page>
      <PageHeader title={t("nav.applications")} subtitle={t("applications.subtitle")} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard icon={FileText} label={t("applications.total")} value={stats.total} tone="blue" />
        <StatCard icon={Clock} label={t("applications.pending")} value={stats.pending} tone="amber" />
        <StatCard icon={CheckCircle2} label={t("applications.accepted")} value={stats.accepted} tone="green" />
      </div>

      {applications.length === 0 ? (
        <EmptyState
          label={t("applications.empty")}
          description={t("applications.emptyHint")}
          action={<Button variant="accent">{t("nav.map")}</Button>}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((a: any) => {
            const Icon = STATUS_ICON[a.status] || Clock;
            const compat = a.property ? matchScore(me, a.property) : null;
            return (
              <Card key={a.id}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-balance">{a.property?.title || "—"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {a.property?.city} · <span className="tabular-nums">{money(a.property?.rent || 0)}</span>
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[a.status] || "neutral"}>
                    <Icon className="size-3" aria-hidden="true" />
                    {t(`applicationStatus.${a.status}`)}
                  </Badge>
                </div>

                <p className="mb-3 text-xs text-muted-foreground tabular-nums">
                  {t("applications.sentOn")} {date(a.createdAt)}
                </p>

                {compat && (
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("map.compatibility")}</span>
                      <span className="font-medium tabular-nums">{compat.score} / 100</span>
                    </div>
                    <Progress value={compat.score} tone={compat.score >= 70 ? "green" : "amber"} />
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {compat.factors.map((f: any, i: number) => (
                        <li key={i} className="tabular-nums">
                          {f.label[locale] || f.label.fr} : {Math.round(f.value * 100)} %
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {a.aiSummary && (
                  <p className="rounded-xl bg-muted p-3 text-sm text-pretty">{tv(a.aiSummary)}</p>
                )}

                {!a.humanReviewed && (
                  <p className="mt-3 text-xs text-muted-foreground text-pretty">{t("applications.awaitingHuman")}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <Alert tone="blue" icon={Info} title={t("legal.automatedDecision")}>
          {market === "FR" ? t("applications.rightsFR") : t("applications.rightsQC")}
        </Alert>
      </div>
    </Page>
  );
}
