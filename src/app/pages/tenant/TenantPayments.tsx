import { useMemo } from "react";
import { CreditCard, Receipt, AlertTriangle, CalendarClock, Info, Download } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { buildReceiptPdf } from "@/app/lib/documents";
import { downloadPdf } from "@/app/lib/pdf";
import { feedback } from "@/app/lib/feedback";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, StatCard,
  Table, Alert, EmptyState,
} from "@/app/components/common/ui";

export function TenantPayments() {
  const { t, money, date, market, m, locale } = useI18n();
  const store = useStore();

  const me = store.activeUserOfRole("tenant", market);
  const lease = me ? store.leaseOfTenant(me.id) : null;
  const property = lease ? store.getProperty(lease.propertyId) : null;

  const payments = useMemo(() => {
    if (!me) return [];
    return store
      .paymentsOfTenant(me.id)
      .sort((a: any, b: any) => (b.dueDate || "").localeCompare(a.dueDate || ""));
  }, [store, me]);

  const stats = useMemo(() => {
    const late = payments.filter((p: any) => p.status === "late" || p.status === "unpaid");
    const paid = payments.filter((p: any) => p.status === "paid");
    return {
      due: (lease?.rent || 0) + (lease?.charges || 0),
      lateAmount: late.reduce((a: number, p: any) => a + p.amount, 0),
      lateCount: late.length,
      paidTotal: paid.reduce((a: number, p: any) => a + p.amount, 0),
    };
  }, [payments, lease]);

  const owner = lease ? store.getUser(lease.ownerId) : null;

  /** La quittance est un droit : on l'émet à la volée si elle n'existe pas encore. */
  const getReceipt = (payment: any) => {
    if (!lease) return;
    try {
      const receipt = store.receiptOfPayment(payment.id) || store.issueReceipt(payment, lease, market);
      const doc = buildReceiptPdf({
        payment, lease, property, tenant: me, owner,
        market: m, locale, reference: receipt.reference,
      });
      downloadPdf(doc, `quittance-${receipt.reference}`);
      feedback.success(t("toast.receiptReady", { ref: receipt.reference }));
    } catch {
      feedback.error(t("toast.receiptFailed"));
    }
  };

  if (!me || !lease) return <Page><EmptyState label={t("payments.noLease")} /></Page>;

  return (
    <Page>
      <PageHeader title={t("nav.payments")} subtitle={property?.title} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CreditCard} label={t("payments.monthlyDue")} value={money(stats.due)} tone="blue" hint={t("payments.rentPlusCharges")} />
        <StatCard icon={Receipt} label={t("payments.paidToDate")} value={money(stats.paidTotal)} tone="green" />
        <StatCard
          icon={AlertTriangle}
          label={t("payments.outstanding")}
          value={money(stats.lateAmount)}
          tone={stats.lateAmount > 0 ? "red" : "neutral"}
        />
        <StatCard icon={CalendarClock} label={t("payments.nextDue")} value={date(nextDue(payments))} tone="orange" />
      </div>

      {stats.lateCount > 0 && (
        <Alert tone="red" icon={AlertTriangle} title={t("payments.lateTitle")}>
          {market === "FR" ? t("payments.lateFR") : t("payments.lateQC")}
        </Alert>
      )}

      <Card className="mb-5">
        <SectionTitle
          icon={CreditCard}
          right={<Button variant="accent" size="sm">{t("payment.pay")}</Button>}
        >
          {t("payments.payOnline")}
        </SectionTitle>
        <p className="text-sm text-muted-foreground text-pretty">
          {market === "FR" ? t("payments.methodFR") : t("payments.methodQC")}
        </p>
      </Card>

      <Card>
        <SectionTitle icon={Receipt}>{t("payment.history")}</SectionTitle>
        <Table
          columns={[t("payments.dueDate"), t("fin.amount"), t("payments.method"), t("common.status"), t("payment.receipt")]}
          rows={payments.map((p: any) => [
            <span className="tabular-nums">{date(p.dueDate)}</span>,
            <span className="tabular-nums">{money(p.amount)}</span>,
            <span className="text-muted-foreground">{p.method || "—"}</span>,
            <Badge tone={p.status === "paid" ? "green" : p.status === "late" ? "amber" : "red"}>
              {t(`payment.${p.status}`)}
              {p.daysLate ? <span className="tabular-nums"> · {p.daysLate} j</span> : null}
            </Badge>,
            p.status === "paid"
              ? (
                <Button size="sm" variant="ghost" icon={Download} onClick={() => getReceipt(p)}>
                  {store.receiptOfPayment(p.id)?.reference || t("arrears.issue")}
                </Button>
              )
              : <span className="text-muted-foreground">—</span>,
          ])}
          empty={t("payments.none")}
        />
      </Card>

      <div className="mt-5">
        <Alert tone="blue" icon={Info} title={t("payment.receipt")}>
          {market === "FR" ? t("payments.receiptFR") : t("payments.receiptQC")}
        </Alert>
      </div>
    </Page>
  );
}

function nextDue(payments: any[]) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = payments.filter((p: any) => p.dueDate > today).sort((a: any, b: any) => a.dueDate.localeCompare(b.dueDate));
  if (upcoming.length) return upcoming[0].dueDate;
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toISOString().slice(0, 10);
}
