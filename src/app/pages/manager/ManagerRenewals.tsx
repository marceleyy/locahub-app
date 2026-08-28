import { useMemo, useState } from "react";
import {
  RefreshCw, CalendarClock, Bell, Download, Send, AlertTriangle,
  Info, CheckCircle2, Lock,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { feedback } from "@/app/lib/feedback";
import { renewalWindow, renewalCap, reminderDate } from "@/app/lib/dunning";
import { buildRenewalPdf } from "@/app/lib/documents";
import { downloadPdf } from "@/app/lib/pdf";
import { recommendRent } from "@/app/lib/assist";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Modal, Field, Input, Select, StatCard, Alert, EmptyState, Progress, ChipGroup, ConfirmSheet,
} from "@/app/components/common/ui";

export function ManagerRenewals() {
  const { t, tv, locale, money, date, market, m } = useI18n();
  const store = useStore();
  const [editing, setEditing] = useState<any>(null);
  const [applying, setApplying] = useState<any>(null);

  const rows = useMemo(
    () =>
      store.db.leases
        .map((lease: any) => {
          const property = store.getProperty(lease.propertyId);
          if (!property || property.market !== market) return null;
          const window = renewalWindow(lease, property, m);
          if (!window) return null;
          return {
            lease, property, window,
            cap: renewalCap(lease, property, m),
            tenant: store.getUser(lease.tenantId),
            existing: store.renewalOfLease(lease.id),
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.window.daysToTerm - b.window.daysToTerm) as any[],
    [store.db.leases, store.db.renewals, market, m, store]
  );

  const stats = useMemo(() => ({
    total: rows.length,
    open: rows.filter((r) => r.window.isOpen).length,
    proposed: rows.filter((r) => r.existing?.status === "proposed").length,
    blocked: rows.filter((r) => r.window.blocked).length,
  }), [rows]);

  return (
    <Page wide>
      <PageHeader title={t("nav.renewals")} subtitle={t("renewals.subtitle", { mode: tv(m.renewal.label) })} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={RefreshCw} label={t("renewals.tracked")} value={stats.total} tone="blue" />
        <StatCard icon={CalendarClock} label={t("renewals.windowOpen")} value={stats.open} tone="green" />
        <StatCard icon={Send} label={t("renewals.proposed")} value={stats.proposed} tone="orange" />
        <StatCard icon={Lock} label={t("renewals.blocked")} value={stats.blocked} tone={stats.blocked ? "red" : "neutral"} />
      </div>

      <Alert tone="blue" icon={Info} title={tv(m.renewal.label)}>
        {market === "QC" ? t("renewals.modeQC") : t("renewals.modeFR")}
      </Alert>

      {rows.length === 0 ? (
        <EmptyState label={t("renewals.empty")} />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <Card key={row.lease.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-balance">{row.property.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {row.tenant ? `${row.tenant.firstName} ${row.tenant.lastName}` : t("tenantFile.vacant")}
                    {" · "}
                    <span className="tabular-nums">{money(row.lease.rent)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={row.window.daysToTerm < 90 ? "red" : row.window.daysToTerm < 200 ? "amber" : "neutral"}>
                    <span className="tabular-nums">{t("renewals.daysToTerm", { n: String(row.window.daysToTerm) })}</span>
                  </Badge>
                  {row.existing && (
                    <Badge tone={row.existing.status === "applied" ? "green" : "orange"}>
                      {t(`renewalStatus.${row.existing.status}`)}
                    </Badge>
                  )}
                </div>
              </div>

              {row.window.opensOn && row.window.closesOn && (
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground tabular-nums">
                    <span>{date(row.window.opensOn)}</span>
                    <span>{t("renewals.window")}</span>
                    <span>{date(row.window.closesOn)}</span>
                  </div>
                  <Progress
                    value={row.window.isOpen ? 60 : row.window.blocked ? 100 : 10}
                    tone={row.window.isOpen ? "green" : row.window.blocked ? "red" : "neutral"}
                  />
                </div>
              )}

              {row.window.blockReason && (
                <Alert tone={row.window.blocked ? "red" : "amber"} icon={AlertTriangle} title={t("renewals.windowTitle")}>
                  {row.window.blockReason[locale] || row.window.blockReason.fr}
                </Alert>
              )}

              <p className="mb-4 text-sm text-muted-foreground text-pretty">
                {row.window.guidance[locale] || row.window.guidance.fr}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="accent"
                  icon={RefreshCw}
                  disabled={row.window.blocked}
                  onClick={() => setEditing(row)}
                >
                  {t("renewals.oneClick")}
                </Button>
                {row.existing?.status === "proposed" && (
                  <Button variant="outline" icon={CheckCircle2} onClick={() => setApplying(row)}>
                    {t("renewals.apply")}
                  </Button>
                )}
              </div>

              {row.existing?.reminderOn && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                  <Bell className="size-3" aria-hidden="true" />
                  {t("renewals.reminderSet", { date: date(row.existing.reminderOn) })}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Écrire le nouveau loyer et la nouvelle échéance dans le bail est
          irréversible : on confirme, avec le détail chiffré sous les yeux. */}
      <ConfirmSheet
        open={!!applying}
        onOpenChange={(o: boolean) => !o && setApplying(null)}
        tone="orange"
        title={t("renewals.applyConfirmTitle")}
        description={t("renewals.applyConfirmBody")}
        confirmLabel={t("renewals.apply")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          store.applyRenewal(applying.existing.id);
          feedback.success(t("toast.renewalApplied"));
          setApplying(null);
        }}
        details={
          applying ? (
            <div className="space-y-1 rounded-xl bg-muted p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("renewals.currentRent")}</span>
                <span className="tabular-nums">{money(applying.existing.currentRent)}</span>
              </div>
              <div className="flex justify-between gap-3 font-semibold">
                <span>{t("renewals.newRent")}</span>
                <span className="tabular-nums">{money(applying.existing.newRent)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t("renewals.newTerm")}</span>
                <span className="tabular-nums">{date(applying.existing.newEndDate)}</span>
              </div>
            </div>
          ) : null
        }
      />

      <RenewalModal row={editing} onClose={() => setEditing(null)} />
    </Page>
  );
}

function RenewalModal({ row, onClose }: { row: any; onClose: () => void }) {
  const { t, tv, locale, money, date, market, m } = useI18n();
  const store = useStore();
  const [rent, setRent] = useState("");
  const [reminder, setReminder] = useState("6");
  const [note, setNote] = useState("");

  const advice = useMemo(() => (row ? recommendRent(row.property, m) : null), [row, m]);

  if (!row) return null;

  const proposed = Number(rent) || row.lease.rent;
  const cap = row.cap.cap;
  const overCap = cap != null && proposed > cap;
  const delta = proposed - row.lease.rent;
  const pct = row.lease.rent ? (delta / row.lease.rent) * 100 : 0;

  const owner = store.getUser(row.lease.ownerId);

  const submit = (downloadAfter: boolean) => {
    if (overCap) return;
    const months = Number(reminder);
    const renewal = store.createRenewal({
      leaseId: row.lease.id, propertyId: row.property.id, tenantId: row.lease.tenantId, market,
      currentRent: row.lease.rent, newRent: proposed,
      effectiveDate: row.window.effectiveDate, newEndDate: row.window.proposedEndDate,
      reminderMonths: months,
      reminderOn: reminderDate(new Date().toISOString().slice(0, 10), months),
      note: { fr: note, en: note },
    });

    // Le rappel devient une tâche réelle du planificateur, pas une simple date affichée
    store.createTask({
      market,
      title: { fr: `Relancer le renouvellement — ${row.property.title}`, en: `Follow up renewal — ${row.property.title}` },
      description: {
        fr: `Rappel programmé à la signature de la proposition ${renewal.id}. Vérifier la réponse du locataire et l'échéance du bail.`,
        en: `Reminder scheduled when proposal ${renewal.id} was issued. Check the tenant's reply and the lease term.`,
      },
      dueDate: renewal.reminderOn,
      propertyId: row.property.id,
      category: "lease",
      legal: true,
      tenantImpact: "high",
      assigneeId: store.currentUserId,
    });

    feedback.success(t("toast.renewalIssued"), { description: t("toast.renewalReminder", { date: renewal.reminderOn }) });

    if (downloadAfter) {
      const doc = buildRenewalPdf({
        lease: row.lease, property: row.property, tenant: row.tenant, owner,
        market: m, locale, newRent: proposed,
        newEndDate: row.window.proposedEndDate, effectiveDate: row.window.effectiveDate,
      });
      downloadPdf(doc, `renouvellement-${row.property.id}`);
    }
    onClose();
  };

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={t("renewals.oneClick")}
      width="max-w-2xl"
      footer={
        <>
          <Button size="lg" variant="accent" icon={Send} disabled={overCap} onClick={() => submit(false)}>
            {t("renewals.issue")}
          </Button>
          <Button size="lg" variant="outline" icon={Download} disabled={overCap} onClick={() => submit(true)}>
            {t("renewals.issueAndDownload")}
          </Button>
          <Button size="lg" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl bg-muted p-3">
            <div className="text-xs text-muted-foreground">{t("renewals.effectiveDate")}</div>
            <div className="font-medium tabular-nums">{date(row.window.effectiveDate)}</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="text-xs text-muted-foreground">{t("renewals.newTerm")}</div>
            <div className="font-medium tabular-nums">{date(row.window.proposedEndDate)}</div>
          </div>
        </div>

        <Field
          label={t("renewals.newRent")}
          hint={`${t("renewals.currentRent")} ${money(row.lease.rent)}${cap != null ? ` · ${t("renewals.cap")} ${money(cap)}` : ""}`}
        >
          <Input
            type="number"
            value={rent}
            placeholder={String(row.lease.rent)}
            onChange={(e: any) => setRent(e.target.value)}
          />
        </Field>

        {Math.abs(delta) > 0.01 && (
          <div className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
            <span className="text-muted-foreground">{t("renewals.variation")}</span>
            <span className={`font-semibold tabular-nums ${delta > 0 ? "text-secondary" : "text-success"}`}>
              {delta > 0 ? "+" : ""}{money(delta)} ({pct > 0 ? "+" : ""}{pct.toFixed(2)} %)
            </span>
          </div>
        )}

        {overCap && (
          <Alert tone="red" icon={AlertTriangle} title={t("renewals.overCapTitle")}>
            {row.cap.reason[locale] || row.cap.reason.fr}
          </Alert>
        )}

        {advice && (
          <div className="rounded-xl border border-border p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{t("forecast.rentAdvice")}</span>
              <span className="font-semibold tabular-nums">{money(advice.recommended)}</span>
            </div>
            <ul className="space-y-1">
              {advice.reasons.slice(0, 2).map((r: any, i: number) => (
                <li key={i} className="text-xs text-muted-foreground text-pretty">• {r[locale] || r.fr}</li>
              ))}
            </ul>
          </div>
        )}

        <Field label={t("renewals.reminder")} hint={t("renewals.reminderHint")}>
          <ChipGroup
            ariaLabel={t("renewals.reminder")}
            value={reminder}
            onChange={setReminder}
            options={(m.renewal.reminderPresets || [3, 6, 12]).map((n: number) => ({
              value: String(n),
              label: t("renewals.inMonths", { n: String(n) }),
            }))}
          />
        </Field>

        <Field label={t("renewals.note")}>
          <Input value={note} onChange={(e: any) => setNote(e.target.value)} placeholder={t("renewals.notePlaceholder")} />
        </Field>

        <Alert tone="amber" icon={Info} title={t("renewals.legalTitle")}>
          {tv(m.renewal.increaseRule)}
        </Alert>
      </div>
    </Modal>
  );
}
