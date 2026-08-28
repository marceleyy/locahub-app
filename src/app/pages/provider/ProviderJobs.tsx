import { useMemo, useState } from "react";
import {
  ClipboardList, Check, X, Clock, MapPin, CalendarClock, AlertTriangle,
  CheckCircle2, Receipt, Info,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { feedback } from "@/app/lib/feedback";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Modal, Field,
  Input, Textarea, StatCard, Tabs, Alert, EmptyState, ChipGroup,
} from "@/app/components/common/ui";
import { DictationInput } from "@/app/components/common/DictationInput";

const PRIORITY_TONE: Record<string, any> = { urgent: "red", high: "orange", normal: "amber", low: "neutral" };
const STATUS_TONE: Record<string, any> = {
  offered: "amber", accepted: "blue", declined: "neutral",
  completed: "green", invoiced: "violet",
};

/** Prestataire courant : en production, l'utilisateur authentifié. */
export function useCurrentProvider() {
  const { market } = useI18n();
  const store = useStore();
  return useMemo(
    () => store.db.providers.find((p: any) => p.market === market) || store.db.providers[0] || null,
    [store.db.providers, market]
  );
}

export function ProviderJobs() {
  const { t, tv, money, date, m } = useI18n();
  const store = useStore();
  const provider = useCurrentProvider();
  const [tab, setTab] = useState("offered");
  const [declining, setDeclining] = useState<any>(null);
  const [invoicing, setInvoicing] = useState<any>(null);
  const [closing, setClosing] = useState<any>(null);
  const [note, setNote] = useState("");

  const jobs = useMemo(
    () => (provider ? store.jobsOfProvider(provider.id) : []),
    [store.db.jobs, provider, store]
  );

  const filtered = useMemo(() => {
    if (tab === "offered") return jobs.filter((j: any) => j.status === "offered");
    if (tab === "active") return jobs.filter((j: any) => j.status === "accepted");
    return jobs.filter((j: any) => ["completed", "invoiced", "declined"].includes(j.status));
  }, [jobs, tab]);

  const stats = useMemo(() => ({
    offered: jobs.filter((j: any) => j.status === "offered").length,
    active: jobs.filter((j: any) => j.status === "accepted").length,
    toInvoice: jobs.filter((j: any) => j.status === "completed").length,
    pipeline: jobs.filter((j: any) => ["offered", "accepted"].includes(j.status)).reduce((a: number, j: any) => a + (j.estimatedAmount || 0), 0),
  }), [jobs]);

  if (!provider) return <Page><EmptyState label={t("provider.noAccount")} /></Page>;

  return (
    <Page wide>
      <PageHeader title={t("nav.jobs")} subtitle={t("provider.jobsSubtitle", { name: provider.name })} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label={t("provider.offered")} value={stats.offered} tone={stats.offered ? "orange" : "neutral"} hint={t("provider.offeredHint")} />
        <StatCard icon={Clock} label={t("provider.active")} value={stats.active} tone="blue" />
        <StatCard icon={Receipt} label={t("provider.toInvoice")} value={stats.toInvoice} tone={stats.toInvoice ? "green" : "neutral"} />
        <StatCard icon={CheckCircle2} label={t("provider.pipeline")} value={money(stats.pipeline)} tone="violet" />
      </div>

      <Tabs
        items={[
          { id: "offered", label: t("provider.tab.offered") },
          { id: "active", label: t("provider.tab.active") },
          { id: "done", label: t("provider.tab.done") },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-5 space-y-4">
        {filtered.length === 0 ? (
          <EmptyState label={t("provider.noJob")} description={t("provider.noJobHint")} />
        ) : (
          filtered.map((job: any) => {
            const property = store.getProperty(job.propertyId);
            return (
              <Card key={job.id}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-balance">{tv(job.title)}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden="true" />{property?.address || property?.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge strong tone={PRIORITY_TONE[job.priority]}>{t(`priorityLevel.${job.priority}`)}</Badge>
                    <Badge strong tone={STATUS_TONE[job.status]}>{t(`jobStatus.${job.status}`)}</Badge>
                  </div>
                </div>

                <p className="mb-3 text-sm text-muted-foreground text-pretty">{tv(job.description)}</p>

                <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">{t("provider.offeredOn")} {date(job.offeredAt)}</span>
                  <span className="tabular-nums">{t("intervention.sla", { n: String(job.slaHours) })}</span>
                  {job.estimatedAmount > 0 && <span className="tabular-nums">{t("provider.estimate")} {money(job.estimatedAmount)}</span>}
                  {job.scheduledFor && (
                    <span className="flex items-center gap-1 tabular-nums">
                      <CalendarClock className="size-3" aria-hidden="true" />{date(job.scheduledFor)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.status === "offered" && (
                    <>
                      <Button variant="accent" icon={Check} onClick={() => { store.answerJob(job.id, true); feedback.success(t("toast.jobAccepted")); }}>
                        {t("provider.accept")}
                      </Button>
                      <Button variant="outline" icon={X} onClick={() => { setDeclining(job); setNote(""); }}>
                        {t("provider.decline")}
                      </Button>
                    </>
                  )}
                  {job.status === "accepted" && (
                    <Button variant="accent" size="lg" icon={CheckCircle2} onClick={() => setClosing(job)}>
                      {t("provider.markDone")}
                    </Button>
                  )}
                  {job.status === "completed" && (
                    <Button variant="accent" icon={Receipt} onClick={() => setInvoicing(job)}>
                      {t("provider.submitInvoice")}
                    </Button>
                  )}
                  {job.status === "invoiced" && (
                    <Badge tone="violet"><Receipt className="size-3" aria-hidden="true" />{t("provider.invoiceSent")}</Badge>
                  )}
                </div>

                {job.providerNote && (
                  <p className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground text-pretty">
                    {t("provider.yourNote")} {job.providerNote}
                  </p>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Card className="mt-5">
        <SectionTitle icon={Info}>{t("provider.rulesTitle")}</SectionTitle>
        <p className="text-sm text-muted-foreground text-pretty">
          {m.code === "FR" ? t("provider.rulesFR") : t("provider.rulesQC")}
        </p>
      </Card>

      <Modal
        open={!!declining}
        onClose={() => setDeclining(null)}
        title={t("provider.declineTitle")}
        footer={
          <>
            <Button
              size="lg"
              variant="danger"
              onClick={() => { store.answerJob(declining.id, false, note); feedback.info(t("toast.jobDeclined")); setDeclining(null); }}
            >
              {t("provider.confirmDecline")}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setDeclining(null)}>{t("common.cancel")}</Button>
          </>
        }
      >
        <Field label={t("provider.declineReason")} hint={t("provider.declineHint")}>
          <DictationInput
            value={note}
            onChange={setNote}
            aria-label={t("provider.declineReason")}
          />
        </Field>
      </Modal>

      <CloseJobSheet job={closing} onClose={() => setClosing(null)} onInvoice={(j: any) => { setClosing(null); setInvoicing(j); }} />

      <InvoiceModal job={invoicing} onClose={() => setInvoicing(null)} />
    </Page>
  );
}

/**
 * Feuille de clôture d'intervention, pensée pour une main gantée.
 *
 * Trois gestes maximum : une pression sur l'issue, une dictée du compte-rendu,
 * une pression sur le bouton pleine largeur en bas. Le changement de statut
 * s'applique en optimiste, la vue est à jour avant toute validation.
 */
function CloseJobSheet({ job, onClose, onInvoice }: { job: any; onClose: () => void; onInvoice: (job: any) => void }) {
  const { t, tv, money } = useI18n();
  const store = useStore();
  const [outcome, setOutcome] = useState("resolved");
  const [report, setReport] = useState("");

  if (!job) return null;

  const OUTCOMES = [
    { value: "resolved", label: t("provider.outcome.resolved") },
    { value: "partial", label: t("provider.outcome.partial") },
    { value: "revisit", label: t("provider.outcome.revisit") },
    { value: "blocked", label: t("provider.outcome.blocked") },
  ];

  const finish = (thenInvoice: boolean) => {
    // Mutation optimiste : la carte bascule avant tout aller-retour réseau
    store.mutate({
      apply: (prev: any) => ({
        ...prev,
        jobs: prev.jobs.map((j: any) =>
          j.id === job.id
            ? {
                ...j,
                status: "completed",
                completedAt: new Date().toISOString().slice(0, 10),
                outcome,
                report,
              }
            : j
        ),
      }),
    });
    feedback.success(t("toast.jobCompleted"));
    onClose();
    if (thenInvoice) onInvoice(job);
  };

  return (
    <>
      <Modal
        open={!!job}
        onClose={onClose}
        title={t("provider.closeTitle")}
        description={tv(job.title)}
        footer={
          <>
            <Button size="lg" variant="accent" icon={Receipt} onClick={() => finish(true)}>
              {t("provider.closeAndInvoice")}
            </Button>
            <Button size="lg" variant="outline" icon={CheckCircle2} onClick={() => finish(false)}>
              {t("provider.closeOnly")}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label={t("provider.outcome")} hint={t("provider.outcomeHint")}>
            <ChipGroup
              ariaLabel={t("provider.outcome")}
              value={outcome}
              onChange={setOutcome}
              options={OUTCOMES}
            />
          </Field>

          <Field label={t("provider.report")} hint={t("provider.reportHint")}>
            <DictationInput
              value={report}
              onChange={setReport}
              placeholder={t("provider.reportPlaceholder")}
              aria-label={t("provider.report")}
            />
          </Field>

          {job.estimatedAmount > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
              <span className="text-muted-foreground">{t("provider.estimate")}</span>
              <span className="font-semibold tabular-nums">{money(job.estimatedAmount)}</span>
            </div>
          )}

          {outcome === "revisit" && (
            <Alert tone="amber" icon={Clock} title={t("provider.revisitTitle")}>
              {t("provider.revisitBody")}
            </Alert>
          )}
        </div>
      </Modal>
    </>
  );
}

function InvoiceModal({ job, onClose }: { job: any; onClose: () => void }) {
  const { t, tv, money, m } = useI18n();
  const store = useStore();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [recoverable, setRecoverable] = useState(false);

  if (!job) return null;
  const value = Number(amount) || 0;
  const overrun = job.estimatedAmount > 0 ? ((value - job.estimatedAmount) / job.estimatedAmount) * 100 : 0;

  return (
    <Modal
      open={!!job}
      onClose={onClose}
      title={t("provider.submitInvoice")}
      footer={
        <>
          <Button
            size="lg"
            variant="accent"
            disabled={!label.trim() || value <= 0}
            onClick={() => {
              store.submitJobInvoice(job.id, {
                label: { fr: label, en: label },
                amount: value,
                category: job.trade,
                recoverable,
              });
              feedback.success(t("toast.invoiceSubmitted"));
              setLabel(""); setAmount(""); setRecoverable(false);
              onClose();
            }}
          >
            {t("provider.send")}
          </Button>
          <Button size="lg" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
        </>
      }
    >
      <div className="space-y-1">
        <div className="mb-4 rounded-xl bg-muted p-3 text-sm">
          <div className="font-medium">{tv(job.title)}</div>
          {job.estimatedAmount > 0 && (
            <div className="text-xs text-muted-foreground tabular-nums">
              {t("provider.estimate")} {money(job.estimatedAmount)}
            </div>
          )}
        </div>

        <Field label={t("fin.label")} required>
          <Input value={label} onChange={(e: any) => setLabel(e.target.value)} placeholder={t("provider.labelPlaceholder")} />
        </Field>
        <Field label={t("fin.amount")} required hint={t("provider.amountHint")}>
          <Input type="number" value={amount} onChange={(e: any) => setAmount(e.target.value)} />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={recoverable} onChange={(e) => setRecoverable(e.target.checked)} className="size-4 rounded" />
          {t("provider.recoverable")}
        </label>

        {Math.abs(overrun) > 20 && value > 0 && (
          <Alert tone={overrun > 0 ? "amber" : "blue"} icon={AlertTriangle} title={t("provider.overrunTitle")}>
            {t("provider.overrunBody", { pct: `${overrun > 0 ? "+" : ""}${overrun.toFixed(0)}` })}
          </Alert>
        )}

        <p className="mt-3 text-xs text-muted-foreground text-pretty">
          {m.code === "FR" ? t("provider.invoiceHintFR") : t("provider.invoiceHintQC")}
        </p>
      </div>
    </Modal>
  );
}
