import { useMemo, useState } from "react";
import {
  User, Mail, Phone, Briefcase, ShieldCheck, FileCheck2, FileWarning,
  Info, Users, Wallet, Trash2, Ban,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Progress, StatCard,
  Alert, EmptyState, Avatar, Button, ConfirmSheet,
} from "@/app/components/common/ui";
import { DocumentCapture } from "@/app/components/common/DocumentCapture";
import { feedback } from "@/app/lib/feedback";
import { allowedDocuments, forbiddenDocuments } from "@/app/lib/scan";
import { deleteMedia, MediaThumb } from "@/app/lib/mediaDB";

export function TenantProfile() {
  const { t, tv, money, date, market, m, locale } = useI18n();
  const store = useStore();
  const [removing, setRemoving] = useState<any>(null);

  const me = store.activeUserOfRole("tenant", market);
  const lease = me ? store.leaseOfTenant(me.id) : null;
  const property = lease ? store.getProperty(lease.propertyId) : null;

  const docs = me?.documents || [];
  const verified = docs.filter((d: any) => d.verified).length;
  const monthlyIncome = useMemo(() => {
    if (!me?.income) return 0;
    return me.incomePeriod === "year" ? me.income / 12 : me.income;
  }, [me]);

  if (!me) return <Page><EmptyState label={t("profile.noTenant")} /></Page>;

  return (
    <Page>
      <PageHeader title={t("nav.profile")} subtitle={t("profile.subtitle")} />

      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar user={me} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-balance">{me.firstName} {me.lastName}</h2>
            <p className="text-sm text-muted-foreground">{me.occupation || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={me.status === "active" ? "green" : "neutral"}>{t(`common.${me.status === "active" ? "active" : "inactive"}`)}</Badge>
              <Badge tone="blue">{m.flag} {tv(m.name)}</Badge>
              {me.hasGuarantor && <Badge tone="violet">{t("profile.hasGuarantor")}</Badge>}
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
          {[
            [Mail, t("common.email"), me.email],
            [Phone, t("common.phone"), me.phone],
            [Briefcase, t("profile.employment"), me.employmentType || "—"],
          ].map(([Icon, label, value]: any, i: number) => (
            <div key={i} className="rounded-xl bg-muted p-3">
              <dt className="mb-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="size-3.5" aria-hidden="true" />{label}
              </dt>
              <dd className="truncate font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Wallet} label={t("profile.monthlyIncome")} value={money(monthlyIncome)} tone="blue" />
        <StatCard
          icon={FileCheck2}
          label={t("profile.completeness")}
          value={`${me.fileCompleteness ?? 0} %`}
          tone={(me.fileCompleteness ?? 0) >= 80 ? "green" : "amber"}
        />
        <StatCard icon={ShieldCheck} label={t("profile.documents")} value={`${verified}/${docs.length}`} tone="violet" />
        <StatCard
          icon={Users}
          label={t("profile.household")}
          value={me.householdSize ?? 1}
          tone="orange"
          hint={t("profile.householdHint")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={FileCheck2}>{t("profile.myDocuments")}</SectionTitle>
          <p className="mb-3 text-xs text-muted-foreground text-pretty">
            {market === "FR" ? t("profile.docsHintFR") : t("profile.docsHintQC")}
          </p>
          <div className="mb-4">
            <DocumentCapture
              scope="tenant-doc"
              ownerId={me.id}
              onConfirm={(doc) => {
                store.addTenantDocument(me.id, doc);
                feedback.success(
                  doc.verified ? t("doc.addedVerified", { label: doc.label }) : t("doc.addedPending", { label: doc.label })
                );
              }}
            />
          </div>

          {docs.length === 0 ? (
            <EmptyState label={t("profile.noDocument")} description={t("doc.emptyHint")} />
          ) : (
            <ul className="space-y-2">
              {docs.map((d: any) => (
                <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted p-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    {d.fileId ? (
                      <MediaThumb
                        fileId={d.fileId}
                        className="size-10 shrink-0 rounded-lg object-cover"
                        fallback={<FileCheck2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                      />
                    ) : d.verified
                      ? <FileCheck2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                      : <FileWarning className="size-4 shrink-0 text-warning" aria-hidden="true" />}
                    <span className="min-w-0">
                      <span className="block truncate">{d.label}</span>
                      {d.addedAt && (
                        <span className="block text-xs text-muted-foreground tabular-nums">{date(d.addedAt)}</span>
                      )}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Badge strong tone={d.verified ? "green" : "amber"}>
                      {d.verified ? t("profile.verified") : t("doc.toConfirm")}
                    </Badge>
                    {d.addedAt && (
                      <button
                        onClick={() => setRemoving(d)}
                        aria-label={t("common.delete")}
                        className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-background"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">{t("profile.completeness")}</span>
              <span className="font-medium tabular-nums">{me.fileCompleteness ?? 0} %</span>
            </div>
            <Progress value={me.fileCompleteness ?? 0} tone={(me.fileCompleteness ?? 0) >= 80 ? "green" : "amber"} />
          </div>
        </Card>

        <div className="space-y-5">
          {me.hasGuarantor && me.guarantor && (
            <Card>
              <SectionTitle icon={ShieldCheck}>{t("profile.guarantor")}</SectionTitle>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("common.name")}</dt>
                  <dd className="text-right font-medium">{me.guarantor.name}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("profile.relation")}</dt>
                  <dd className="text-right font-medium">{me.guarantor.relation}</dd>
                </div>
                {me.guarantor.income > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("profile.monthlyIncome")}</dt>
                    <dd className="text-right font-medium tabular-nums">{money(me.guarantor.income)}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          <Card>
            <SectionTitle icon={User}>{t("profile.currentLease")}</SectionTitle>
            {lease && property ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("common.property")}</dt>
                  <dd className="text-right font-medium">{property.title}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("unit.rent")}</dt>
                  <dd className="text-right font-medium tabular-nums">{money(lease.rent)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("tenantFile.leaseEnd")}</dt>
                  <dd className="text-right font-medium tabular-nums">{lease.endDate ? date(lease.endDate) : "—"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">{t("profile.noLease")}</p>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <SectionTitle icon={Ban}>{t("doc.forbiddenTitle")}</SectionTitle>
        <p className="mb-3 text-xs text-muted-foreground text-pretty">{t("doc.forbiddenHint")}</p>
        <ul className="space-y-1.5">
          {forbiddenDocuments(m, locale).map((label: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground text-pretty">
              <Ban className="size-4 shrink-0 text-destructive" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">{t("doc.allowedTitle")}</summary>
          <ul className="mt-2 space-y-1.5">
            {allowedDocuments(m, locale).map((label: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-pretty">
                <FileCheck2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </details>
      </Card>

      <ConfirmSheet
        open={!!removing}
        onOpenChange={(o: boolean) => !o && setRemoving(null)}
        title={t("doc.removeTitle")}
        description={removing?.label}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (removing.fileId) void deleteMedia(removing.fileId);
          store.removeTenantDocument(me.id, removing.id);
          feedback.success(t("doc.removed"));
          setRemoving(null);
        }}
      />

      <div className="mt-5">
        <Alert tone="blue" icon={Info} title={t("legal.dataRights")}>
          {market === "FR" ? t("profile.rightsFR") : t("profile.rightsQC")}
        </Alert>
      </div>
    </Page>
  );
}
