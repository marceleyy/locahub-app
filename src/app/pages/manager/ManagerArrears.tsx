import { useMemo, useState } from "react";
import {
  AlertTriangle, Mail, Send, Download, Receipt, Clock, CheckCircle2,
  ShieldAlert, Info, FileText, MessageSquare, Eye,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { feedback } from "@/app/lib/feedback";
import { openArrears, dunningPlan } from "@/app/lib/dunning";
import { buildDunningBody, buildDunningPdf, buildReceiptPdf } from "@/app/lib/documents";
import { downloadPdf } from "@/app/lib/pdf";
import { deliver, checkDeliverable, deliveryMessage, DeliveryError } from "@/app/lib/transport";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Modal, Textarea,
  StatCard, Table, Tabs, Alert, EmptyState, Progress, ChipGroup, Field,
} from "@/app/components/common/ui";

const TONE: Record<string, any> = { friendly: "amber", firm: "orange", legal: "red" };

const CHANNELS = ["email", "sms", "postal", "registered"] as const;
const CHANNEL_ICON: Record<string, any> = { email: Mail, sms: MessageSquare, postal: Send, registered: ShieldAlert };

/**
 * Le canal n'est pas neutre juridiquement : une mise en demeure envoyée par
 * simple courriel ne prouve rien devant un juge. On laisse le choix, mais on
 * dit ce qu'il coûte.
 */
function channelHint(draft: any, t: any) {
  if (draft.step.tone === "legal" && draft.channel !== "registered") return t("arrears.channelLegalWarning");
  if (draft.channel === "sms") return t("arrears.channelSmsHint");
  if (draft.channel === "postal") return t("arrears.channelPostalHint");
  if (draft.channel === "registered") return t("arrears.channelRegisteredHint");
  return t("arrears.channelEmailHint");
}

export function ManagerArrears() {
  const { t, tv, locale, money, date, market, m } = useI18n();
  const store = useStore();
  const [tab, setTab] = useState("arrears");
  const [draft, setDraft] = useState<any>(null);
  const [receiptSheet, setReceiptSheet] = useState<any>(null);

  const arrears = useMemo(
    () => openArrears(store.db.payments, store.db.leases, store.db.properties, market),
    [store.db.payments, store.db.leases, store.db.properties, market]
  );

  const plans = useMemo(
    () => arrears.map((a: any) => ({ ...a, plan: dunningPlan(a.payment, a.lease, m, store.db.dunningLog) })),
    [arrears, m, store.db.dunningLog]
  );

  const paidPayments = useMemo(
    () =>
      store.db.payments
        .filter((p: any) => p.status === "paid")
        .map((p: any) => {
          const lease = store.db.leases.find((l: any) => l.id === p.leaseId);
          const property = lease ? store.getProperty(lease.propertyId) : null;
          return { payment: p, lease, property };
        })
        .filter((r: any) => r.property?.market === market)
        .sort((a: any, b: any) => b.payment.dueDate.localeCompare(a.payment.dueDate)),
    [store.db.payments, store.db.leases, market, store]
  );

  const totals = useMemo(() => ({
    count: plans.length,
    amount: plans.reduce((a: number, r: any) => a + r.payment.amount, 0),
    due: plans.filter((r: any) => r.plan.nextStep?.state === "due").length,
    legal: plans.filter((r: any) => r.plan.steps.some((s: any) => s.tone === "legal" && s.state === "due")).length,
  }), [plans]);

  const openDraft = (row: any, step: any) => {
    const tenant = store.getUser(row.payment.tenantId);
    const owner = store.getUser(row.lease?.ownerId);
    const stepRule = m.dunning.steps.find((s: any) => s.id === step.id);
    const { subject, body } = buildDunningBody({
      step: stepRule, payment: row.payment, lease: row.lease, property: row.property,
      tenant, owner, market: m, locale, daysLate: row.plan.daysLate,
    });
    setDraft({ row, step, stepRule, tenant, owner, subject, body, channel: stepRule.channel });
  };

  /**
   * Envoi optimiste : la ligne bascule en « envoyée » avant que le transport
   * n'ait répondu. Si l'envoi échoue, l'instantané pris avant la mutation est
   * restauré et la ligne disparaît — l'utilisateur n'a jamais une trace
   * mensongère à l'écran.
   */
  const send = async () => {
    if (!draft) return;
    const payload = draft;
    setDraft(null);

    try {
      await store.sendDunning(
        payload.row.payment,
        payload.step.id,
        payload.channel,
        payload.body,
        () =>
          deliver({
            channel: payload.channel,
            to: {
              name: `${payload.tenant?.firstName ?? ""} ${payload.tenant?.lastName ?? ""}`.trim(),
              email: payload.tenant?.email,
              phone: payload.tenant?.phone,
              address: payload.row.property?.address,
            },
            subject: payload.subject,
            body: payload.body,
          })
      );
      feedback.success(t("toast.dunningSent"), { description: t(`channel.${payload.channel}`) });
    } catch (err) {
      const code = err instanceof DeliveryError ? err.code : "network";
      // La mutation a déjà été annulée par la couche optimiste
      feedback.error(t("toast.dunningFailed"), {
        description: deliveryMessage(code, locale),
        action: { label: t("common.retry"), onClick: () => setDraft(payload) },
      });
    }
  };

  const downloadNotice = () => {
    if (!draft) return;
    const doc = buildDunningPdf({
      step: draft.stepRule, payment: draft.row.payment, lease: draft.row.lease,
      property: draft.row.property, tenant: draft.tenant, owner: draft.owner,
      market: m, locale, daysLate: draft.row.plan.daysLate,
    });
    downloadPdf(doc, `${draft.step.id}-${draft.row.payment.id}`);
  };



  return (
    <Page wide>
      <PageHeader title={t("nav.arrears")} subtitle={t("arrears.subtitle")} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={AlertTriangle} label={t("arrears.count")} value={totals.count} tone={totals.count ? "red" : "green"} />
        <StatCard icon={Receipt} label={t("arrears.amount")} value={money(totals.amount)} tone={totals.amount ? "red" : "neutral"} />
        <StatCard icon={Clock} label={t("arrears.actionDue")} value={totals.due} tone="orange" hint={t("arrears.actionDueHint")} />
        <StatCard icon={ShieldAlert} label={t("arrears.legalStage")} value={totals.legal} tone={totals.legal ? "red" : "neutral"} />
      </div>

      <ChipGroup
        ariaLabel={t("nav.arrears")}
        value={tab}
        onChange={setTab}
        options={[
          { value: "arrears", label: t("arrears.tab.open") },
          { value: "receipts", label: t("arrears.tab.receipts") },
        ]}
      />

      <div className="mt-5 space-y-5">
        {tab === "arrears" && (
          plans.length === 0 ? (
            <EmptyState label={t("arrears.empty")} description={t("arrears.emptyHint")} icon={CheckCircle2} />
          ) : (
            <>
              {plans.map((row: any) => {
                const tenant = store.getUser(row.payment.tenantId);
                const progress = (row.plan.steps.filter((s: any) => s.state === "sent").length / row.plan.steps.length) * 100;
                return (
                  <Card key={row.payment.id}>
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-balance">
                          {tenant ? `${tenant.firstName} ${tenant.lastName}` : "—"}
                        </h3>
                        <p className="text-sm text-muted-foreground">{row.property?.title}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold tabular-nums text-destructive">{money(row.payment.amount)}</span>
                        <Badge tone={row.plan.daysLate > 30 ? "red" : "amber"}>
                          <span className="tabular-nums">{t("arrears.daysLate", { n: String(row.plan.daysLate) })}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Progress value={progress} tone={progress >= 66 ? "red" : "amber"} />
                    </div>

                    <ol className="space-y-2">
                      {row.plan.steps.map((s: any) => (
                        <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Badge tone={s.state === "sent" ? "green" : s.state === "due" ? TONE[s.tone] : "neutral"}>
                              {s.state === "sent" ? <CheckCircle2 className="size-3" aria-hidden="true" /> : <Clock className="size-3" aria-hidden="true" />}
                              J+{s.offsetDays}
                            </Badge>
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{tv(s.label)}</div>
                              <div className="text-xs text-muted-foreground tabular-nums">
                                {s.state === "sent" ? `${t("arrears.sentOn")} ${date(s.sentAt)}` : `${t("arrears.plannedFor")} ${date(s.dueOn)}`}
                                {" · "}{t(`channel.${s.channel}`)}
                              </div>
                            </div>
                          </div>
                          {s.state !== "sent" && (
                            <Button
                              size="sm"
                              variant={s.state === "due" ? "accent" : "outline"}
                              icon={Mail}
                              onClick={() => openDraft(row, s)}
                            >
                              {s.state === "due" ? t("arrears.sendNow") : t("arrears.prepare")}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ol>

                    {row.plan.guarantorDueOn && (
                      <p className="mt-3 text-xs text-muted-foreground text-pretty">
                        {t("arrears.guarantorHint", { date: date(row.plan.guarantorDueOn) })}
                      </p>
                    )}
                  </Card>
                );
              })}

              <Card>
                <SectionTitle icon={Info}>{t("arrears.rulesTitle")}</SectionTitle>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(m.dunning.warnings || []).map((w: any, i: number) => (
                    <li key={i} className="flex gap-2 text-pretty"><span className="text-secondary">•</span>{tv(w)}</li>
                  ))}
                </ul>
              </Card>
            </>
          )
        )}

        {tab === "receipts" && (
          <Card>
            <SectionTitle icon={Receipt}>{t("arrears.receiptsTitle")}</SectionTitle>
            <p className="mb-4 text-xs text-muted-foreground text-pretty">{tv(m.receipt.condition)} — {tv(m.receipt.legalBasis)}</p>
            <Table
              columns={[t("payments.dueDate"), t("tenantFile.occupant"), t("common.property"), t("fin.amount"), t("payment.receipt"), ""]}
              rows={paidPayments.map((row: any) => {
                const tenant = store.getUser(row.payment.tenantId);
                const existing = store.receiptOfPayment(row.payment.id);
                return [
                  <span className="tabular-nums">{date(row.payment.dueDate)}</span>,
                  tenant ? `${tenant.firstName} ${tenant.lastName}` : "—",
                  <span className="text-xs text-muted-foreground">{row.property?.city}</span>,
                  <span className="tabular-nums">{money(row.payment.amount)}</span>,
                  existing
                    ? <Badge tone="green">{existing.reference}</Badge>
                    : <Badge tone="neutral">{t("arrears.notIssued")}</Badge>,
                  <Button size="sm" variant="outline" icon={Eye} onClick={() => setReceiptSheet(row)}>
                    {existing ? t("arrears.open") : t("arrears.issue")}
                  </Button>,
                ];
              })}
              empty={t("payments.none")}
            />
          </Card>
        )}
      </div>

      <ReceiptSheet row={receiptSheet} onClose={() => setReceiptSheet(null)} />

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft ? `${tv(draft.step.label)} — ${draft.subject}` : ""}
        width="max-w-3xl"
        footer={
          <>
            <Button
              size="lg"
              variant="accent"
              icon={Send}
              disabled={
                !!checkDeliverable(draft?.channel, {
                  email: draft?.tenant?.email,
                  phone: draft?.tenant?.phone,
                  address: draft?.row.property?.address,
                })
              }
              onClick={send}
            >
              {t("arrears.confirmSend")}
            </Button>
            <Button size="lg" variant="outline" icon={FileText} onClick={downloadNotice}>{t("arrears.downloadPdf")}</Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <div className="text-xs text-muted-foreground">{t("arrears.recipient")}</div>
                <div className="font-medium">{draft.tenant?.firstName} {draft.tenant?.lastName}</div>
                <div className="text-xs text-muted-foreground">{draft.tenant?.email}</div>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <div className="text-xs text-muted-foreground">{t("arrears.stage")}</div>
                <div className="font-medium">{tv(draft.step.label)}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {t("arrears.daysLate", { n: String(draft.row.plan.daysLate) })}
                </div>
              </div>
            </div>

            <Field label={t("arrears.channel")} hint={channelHint(draft, t)}>
              <ChipGroup
                ariaLabel={t("arrears.channel")}
                value={draft.channel}
                onChange={(v: string) => setDraft({ ...draft, channel: v })}
                options={CHANNELS.map((c) => ({ value: c, label: t(`channel.${c}`), icon: CHANNEL_ICON[c] }))}
              />
            </Field>

            {(() => {
              const blocked = checkDeliverable(draft.channel, {
                email: draft.tenant?.email,
                phone: draft.tenant?.phone,
                address: draft.row.property?.address,
              });
              if (!blocked) return null;
              return (
                <Alert tone="red" icon={AlertTriangle} title={t("arrears.cannotSend")}>
                  {deliveryMessage(blocked, locale)}
                </Alert>
              );
            })()}

            <Textarea
              value={draft.body}
              onChange={(e: any) => setDraft({ ...draft, body: e.target.value })}
              className="min-h-[280px] font-mono text-xs"
              aria-label={t("arrears.body")}
            />

            {draft.step.tone === "legal" && (
              <Alert tone="red" icon={ShieldAlert} title={t("arrears.legalWarning")}>
                {tv(m.dunning.escalation)}
              </Alert>
            )}
            <p className="text-xs text-muted-foreground text-pretty">{t("arrears.editableHint")}</p>
          </div>
        )}
      </Modal>
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Quittance : aperçu et transmission                                  */
/* ------------------------------------------------------------------ */

/**
 * Tiroir de quittance.
 *
 * L'action principale est en bas, pleine largeur : sur un téléphone tenu d'une
 * main, c'est le seul endroit qu'on atteint sans changer de prise. Le
 * téléchargement, lui, ne dépend d'aucun réseau et ne passe donc pas par la
 * mécanique optimiste.
 */
function ReceiptSheet({ row, onClose }: { row: any; onClose: () => void }) {
  const { t, tv, locale, money, date, market, m } = useI18n();
  const store = useStore();
  const [channel, setChannel] = useState("email");

  if (!row) return null;

  const tenant = store.getUser(row.payment.tenantId);
  const owner = store.getUser(row.lease?.ownerId);
  const existing = store.receiptOfPayment(row.payment.id);

  const build = () => {
    const receipt = existing || store.issueReceipt(row.payment, row.lease, market);
    const doc = buildReceiptPdf({
      payment: row.payment, lease: row.lease, property: row.property,
      tenant, owner, market: m, locale, reference: receipt.reference,
    });
    return { receipt, doc };
  };

  const download = () => {
    try {
      const { receipt, doc } = build();
      downloadPdf(doc, `quittance-${receipt.reference}`);
      feedback.success(t("toast.receiptReady", { ref: receipt.reference }));
      onClose();
    } catch {
      // La génération elle-même peut échouer : police absente, mémoire saturée
      feedback.error(t("toast.receiptFailed"));
    }
  };

  const send = async () => {
    let built;
    try {
      built = build();
    } catch {
      feedback.error(t("toast.receiptFailed"));
      return;
    }
    const { receipt, doc } = built;
    const blob = doc.toBlob();
    onClose();

    try {
      await store.sendReceipt(receipt.id, channel, () =>
        deliver({
          channel: channel as any,
          to: {
            name: `${tenant?.firstName ?? ""} ${tenant?.lastName ?? ""}`.trim(),
            email: tenant?.email,
            phone: tenant?.phone,
            address: row.property?.address,
          },
          subject: `${tv(m.receipt.name)} — ${receipt.reference}`,
          body: t("receipt.emailBody", { ref: receipt.reference }),
          attachments: [{ name: `quittance-${receipt.reference}.pdf`, size: blob.size }],
        })
      );
      feedback.success(t("toast.receiptSent"), { description: t(`channel.${channel}`) });
    } catch (err) {
      const code = err instanceof DeliveryError ? err.code : "network";
      feedback.error(t("toast.receiptSendFailed"), {
        description: deliveryMessage(code, locale),
        action: { label: t("common.retry"), onClick: () => setTimeout(send, 0) },
      });
    }
  };

  const blocked = checkDeliverable(channel as any, {
    email: tenant?.email, phone: tenant?.phone, address: row.property?.address,
  }, [{ size: 200_000 }]);

  const period = new Intl.DateTimeFormat(m.intlLocale[locale], { month: "long", year: "numeric" })
    .format(new Date(row.payment.dueDate));

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={tv(m.receipt.name)}
      description={period}
      footer={
        <>
          <Button size="lg" variant="accent" icon={Send} disabled={!!blocked} onClick={send}>
            {t("receipt.send")}
          </Button>
          <Button size="lg" variant="outline" icon={Download} onClick={download}>
            {t("receipt.download")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Aperçu du contenu réel du document, pas une capture */}
        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">{tv(m.receipt.name)}</span>
            {existing && <Badge tone="green"><span className="tabular-nums">{existing.reference}</span></Badge>}
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("tenantFile.occupant")}</dt>
              <dd className="text-right">{tenant ? `${tenant.firstName} ${tenant.lastName}` : "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("payments.dueDate")}</dt>
              <dd className="tabular-nums">{date(row.payment.dueDate)}</dd>
            </div>
            {m.receipt.mustSplit ? (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("fin.rent")}</dt>
                  <dd className="tabular-nums">{money(row.lease?.rent ?? 0)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("unit.charges")}</dt>
                  <dd className="tabular-nums">{money(row.lease?.charges ?? 0)}</dd>
                </div>
              </>
            ) : (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t("fin.rent")}</dt>
                <dd className="tabular-nums">{money(row.lease?.rent ?? 0)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-border pt-1.5 font-semibold">
              <dt>{t("arrears.totalPaid")}</dt>
              <dd className="tabular-nums">{money(row.payment.amount)}</dd>
            </div>
          </dl>
        </div>

        <Field label={t("arrears.channel")} hint={t("receipt.channelHint")}>
          <ChipGroup
            ariaLabel={t("arrears.channel")}
            value={channel}
            onChange={setChannel}
            options={["email", "postal"].map((c) => ({ value: c, label: t(`channel.${c}`), icon: CHANNEL_ICON[c] }))}
          />
        </Field>

        {blocked && (
          <Alert tone="red" icon={AlertTriangle} title={t("arrears.cannotSend")}>
            {deliveryMessage(blocked, locale)}
          </Alert>
        )}

        <p className="text-xs text-muted-foreground text-pretty">{tv(m.receipt.legalBasis)} — {tv(m.receipt.condition)}</p>
      </div>
    </Modal>
  );
}
