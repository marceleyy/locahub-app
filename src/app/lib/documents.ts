/**
 * Fabriques de documents.
 *
 * Chaque fonction produit à la fois un rendu PDF et un corps texte, pour que
 * la relance envoyée par courriel et la pièce jointe disent exactement la même
 * chose. Toutes les règles de fond viennent de `config/markets.ts` : ce module
 * ne décide de rien, il met en forme.
 */

import { PdfDocument } from "@/app/lib/pdf";

export type Loc = "fr" | "en";
interface L { fr: string; en: string }

const tv = (v: any, l: Loc): string => (v == null ? "" : typeof v === "string" ? v : v[l] ?? v.fr ?? "");

const fmtMoney = (amount: number, market: any, locale: Loc) => {
  try {
    return new Intl.NumberFormat(market.intlLocale[locale], {
      style: "currency", currency: market.currency, maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${market.currencySymbol}`;
  }
};

const fmtDate = (iso: string, market: any, locale: Loc) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(market.intlLocale[locale], { day: "numeric", month: "long", year: "numeric" }).format(d);
  } catch {
    return iso;
  }
};

/** Période couverte, à partir de la date d'échéance. */
export function periodOf(dueDate: string, locale: Loc, market: any) {
  const d = new Date(dueDate);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat(market.intlLocale[locale], { month: "long", year: "numeric" }).format(d),
  };
}

/* ------------------------------------------------------------------ */
/* Quittance de loyer                                                  */
/* ------------------------------------------------------------------ */

export interface ReceiptInput {
  payment: any;
  lease: any;
  property: any;
  tenant: any;
  owner: any;
  market: any;
  locale: Loc;
  reference: string;
}

export function buildReceiptPdf(input: ReceiptInput): PdfDocument {
  const { payment, lease, property, tenant, owner, market, locale, reference } = input;
  const rules = market.receipt;
  const period = periodOf(payment.dueDate, locale, market);
  const doc = new PdfDocument();

  const rent = lease.rent ?? 0;
  const charges = lease.charges ?? 0;
  const total = payment.amount ?? rent + charges;

  doc.text(tv(rules.name, locale).toUpperCase(), { size: 9, color: [0.45, 0.47, 0.52] });
  doc.heading(`${tv(rules.name, locale)} — ${period.label}`, 17);
  doc.text(`${locale === "fr" ? "Référence" : "Reference"} : ${reference}`, { size: 9, color: [0.45, 0.47, 0.52] });
  doc.rule();

  doc.text(locale === "fr" ? "Bailleur" : "Landlord", { size: 9, bold: true, color: [0.45, 0.47, 0.52] });
  doc.text(`${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`.trim() || "—");
  if (owner?.email) doc.text(owner.email, { size: 9, color: [0.45, 0.47, 0.52] });
  doc.space(8);

  doc.text(locale === "fr" ? "Locataire" : "Tenant", { size: 9, bold: true, color: [0.45, 0.47, 0.52] });
  doc.text(`${tenant?.firstName ?? ""} ${tenant?.lastName ?? ""}`.trim() || "—");
  doc.space(8);

  doc.text(locale === "fr" ? "Logement" : "Dwelling", { size: 9, bold: true, color: [0.45, 0.47, 0.52] });
  doc.text(property?.address || property?.title || "—");
  doc.rule();

  doc.row(locale === "fr" ? "Période couverte" : "Period covered", `${fmtDate(period.start, market, locale)} — ${fmtDate(period.end, market, locale)}`);
  doc.row(locale === "fr" ? "Date de paiement" : "Payment date", payment.paidAt ? fmtDate(payment.paidAt, market, locale) : "—");
  doc.row(locale === "fr" ? "Moyen de paiement" : "Payment method", payment.method || "—");
  doc.space(6);

  // Le détail loyer / charges est obligatoire en France, sans objet au Québec
  if (rules.mustSplit) {
    doc.row(locale === "fr" ? "Loyer hors charges" : "Rent excluding charges", fmtMoney(rent, market, locale));
    doc.row(locale === "fr" ? "Provision pour charges" : "Charges provision", fmtMoney(charges, market, locale));
  } else {
    doc.row(locale === "fr" ? "Loyer mensuel (net)" : "Monthly rent (net)", fmtMoney(rent, market, locale));
  }
  doc.rule();
  doc.row(locale === "fr" ? "Total réglé" : "Total paid", fmtMoney(total, market, locale), { bold: true, size: 12 });

  doc.space(18);
  doc.text(
    locale === "fr"
      ? `Le bailleur reconnaît avoir reçu la somme ci-dessus et donne quittance au locataire pour la période mentionnée, sous réserve de tous ses droits.`
      : `The landlord acknowledges receipt of the above sum and gives the tenant a receipt for the period stated, without prejudice to any of their rights.`,
    { size: 9.5 }
  );

  doc.space(14);
  doc.text(tv(rules.legalBasis, locale), { size: 8.5, bold: true, color: [0.45, 0.47, 0.52] });
  (rules.mentions || []).forEach((mention: L) => doc.note(`- ${tv(mention, locale)}`));

  doc.space(10);
  doc.text(
    locale === "fr"
      ? "Document généré par LocaHub. Conservez-le : il vaut preuve de paiement."
      : "Generated by LocaHub. Keep it: it serves as proof of payment.",
    { size: 8, color: [0.55, 0.57, 0.62] }
  );

  return doc;
}

/* ------------------------------------------------------------------ */
/* Relances d'impayés                                                  */
/* ------------------------------------------------------------------ */

export interface DunningInput {
  step: any;
  payment: any;
  lease: any;
  property: any;
  tenant: any;
  owner: any;
  market: any;
  locale: Loc;
  daysLate: number;
}

/** Corps de courriel, réutilisé tel quel comme corps du PDF de mise en demeure. */
export function buildDunningBody(input: DunningInput): { subject: string; body: string } {
  const { step, payment, property, tenant, market, locale, daysLate } = input;
  const amount = fmtMoney(payment.amount, market, locale);
  const due = fmtDate(payment.dueDate, market, locale);
  const name = `${tenant?.firstName ?? ""} ${tenant?.lastName ?? ""}`.trim();
  const address = property?.address || property?.title || "";
  const fr = locale === "fr";

  if (step.tone === "friendly") {
    return {
      subject: fr ? `Loyer de ${due} — rappel` : `Rent due ${due} — reminder`,
      body: fr
        ? `Bonjour ${name},\n\nLe loyer de ${amount}, échu le ${due} pour le logement situé ${address}, ne nous est pas encore parvenu.\n\nIl s'agit peut-être d'un simple décalage bancaire. Si le paiement est déjà parti, merci d'ignorer ce message. Sinon, nous restons disponibles pour convenir d'un échéancier.\n\nCordialement,`
        : `Hello ${name},\n\nThe rent of ${amount}, due on ${due} for the dwelling at ${address}, has not yet reached us.\n\nThis may simply be a banking delay. If payment has already been sent, please disregard this message. Otherwise, we remain available to agree a payment plan.\n\nKind regards,`,
    };
  }

  if (step.tone === "firm") {
    return {
      subject: fr ? `Loyer de ${due} — relance (${daysLate} jours de retard)` : `Rent due ${due} — follow-up (${daysLate} days late)`,
      body: fr
        ? `Bonjour ${name},\n\nMalgré notre rappel, le loyer de ${amount} échu le ${due} demeure impayé, soit ${daysLate} jours de retard.\n\nNous vous invitons à régulariser sous huit jours ou à nous contacter pour établir un échéancier écrit. Aucun frais ni pénalité ne vous sera facturé : nous cherchons une solution, pas une sanction.\n\nÀ défaut de réponse, nous serons contraints d'engager la procédure décrite au bail.\n\nCordialement,`
        : `Hello ${name},\n\nDespite our reminder, the rent of ${amount} due on ${due} remains unpaid, now ${daysLate} days late.\n\nPlease settle within eight days or contact us to arrange a written payment plan. No fee or penalty will be charged: we are looking for a solution, not a sanction.\n\nFailing a reply, we will have to start the procedure set out in the lease.\n\nKind regards,`,
    };
  }

  const escalation = tv(market.dunning.escalation, locale);
  return {
    subject: fr ? `Mise en demeure — loyer de ${due}` : `Formal notice — rent due ${due}`,
    body: fr
      ? `Madame, Monsieur ${name},\n\nPar la présente, nous vous mettons en demeure de régler la somme de ${amount}, correspondant au loyer échu le ${due} pour le logement situé ${address}, actuellement impayée depuis ${daysLate} jours.\n\nÀ défaut de paiement intégral ou d'accord écrit sur un échéancier dans un délai de quinze jours à compter de la réception de la présente, nous saisirons l'instance compétente : ${escalation}.\n\nNous vous rappelons qu'aucune pénalité de retard ne vous est réclamée et qu'une solution amiable reste possible jusqu'au dernier moment.\n\nVeuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.`
      : `Dear ${name},\n\nWe hereby formally notify you to pay the sum of ${amount}, corresponding to the rent due on ${due} for the dwelling at ${address}, unpaid for ${daysLate} days.\n\nFailing full payment or a written agreement on a payment plan within fifteen days of receipt of this letter, we will refer the matter to: ${escalation}.\n\nPlease note that no late penalty is being claimed and that an amicable solution remains possible until the last moment.\n\nYours faithfully,`,
  };
}

export function buildDunningPdf(input: DunningInput): PdfDocument {
  const { step, market, locale, owner, tenant, property } = input;
  const { subject, body } = buildDunningBody(input);
  const doc = new PdfDocument();

  doc.text(tv(step.label, locale).toUpperCase(), { size: 9, color: [0.45, 0.47, 0.52] });
  doc.heading(subject, 15);
  doc.rule();

  doc.text(`${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`.trim(), { size: 9.5 });
  if (owner?.email) doc.text(owner.email, { size: 9, color: [0.45, 0.47, 0.52] });
  doc.space(10);
  doc.text(`${tenant?.firstName ?? ""} ${tenant?.lastName ?? ""}`.trim(), { size: 9.5, align: "right" });
  doc.text(property?.address || "", { size: 9, color: [0.45, 0.47, 0.52], align: "right" });
  doc.space(16);

  body.split("\n").forEach((line) => (line.trim() ? doc.text(line, { size: 10 }) : doc.space(7)));

  if (step.tone === "legal") {
    doc.space(14);
    doc.rule();
    (market.dunning.warnings || []).forEach((w: L) => doc.note(`- ${tv(w, locale)}`));
  }
  return doc;
}

/* ------------------------------------------------------------------ */
/* Offre de renouvellement                                             */
/* ------------------------------------------------------------------ */

export interface RenewalInput {
  lease: any;
  property: any;
  tenant: any;
  owner: any;
  market: any;
  locale: Loc;
  newRent: number;
  newEndDate: string;
  effectiveDate: string;
}

export function buildRenewalPdf(input: RenewalInput): PdfDocument {
  const { lease, property, tenant, owner, market, locale, newRent, newEndDate, effectiveDate } = input;
  const rules = market.renewal;
  const fr = locale === "fr";
  const doc = new PdfDocument();
  const delta = newRent - (lease.rent ?? 0);
  const pct = lease.rent ? (delta / lease.rent) * 100 : 0;

  doc.text(tv(rules.label, locale).toUpperCase(), { size: 9, color: [0.45, 0.47, 0.52] });
  doc.heading(tv(rules.formTemplate, locale), 16);
  doc.rule();

  doc.text(`${tenant?.firstName ?? ""} ${tenant?.lastName ?? ""}`.trim(), { size: 10, bold: true });
  doc.text(property?.address || property?.title || "", { size: 9, color: [0.45, 0.47, 0.52] });
  doc.space(12);

  doc.row(fr ? "Bail actuel — échéance" : "Current lease — term", lease.endDate ? fmtDate(lease.endDate, market, locale) : "—");
  doc.row(fr ? "Loyer actuel" : "Current rent", fmtMoney(lease.rent ?? 0, market, locale));
  doc.rule();
  doc.row(fr ? "Prise d'effet proposée" : "Proposed effective date", fmtDate(effectiveDate, market, locale));
  doc.row(fr ? "Nouvelle échéance" : "New term", fmtDate(newEndDate, market, locale));
  doc.row(fr ? "Loyer proposé" : "Proposed rent", fmtMoney(newRent, market, locale), { bold: true, size: 12 });
  if (Math.abs(delta) > 0.01) {
    doc.row(
      fr ? "Variation" : "Change",
      `${delta > 0 ? "+" : ""}${fmtMoney(delta, market, locale)} (${pct > 0 ? "+" : ""}${pct.toFixed(2)} %)`
    );
  }

  doc.space(16);
  doc.text(tv(rules.increaseRule, locale), { size: 9.5 });

  doc.space(12);
  if (market.code === "QC") {
    doc.text(
      fr
        ? `Vous disposez d'un délai d'un mois à compter de la réception du présent avis pour l'accepter ou le refuser. Sans réponse de votre part, le bail est reconduit aux conditions proposées. En cas de refus, le locateur peut demander au Tribunal administratif du logement de fixer le loyer.`
        : `You have one month from receipt of this notice to accept or refuse it. Without a reply, the lease renews on the proposed terms. If you refuse, the landlord may ask the Administrative Housing Tribunal to set the rent.`,
      { size: 9.5 }
    );
    doc.note(
      fr
        ? "Rappel : la reconduction du bail est automatique au Québec. Le présent avis porte uniquement sur la modification des conditions, jamais sur la fin du bail."
        : "Reminder: lease renewal is automatic in Quebec. This notice concerns only the modification of terms, never the end of the lease."
    );
  } else {
    doc.text(
      fr
        ? `Le bail se reconduit tacitement à son échéance. La présente proposition n'emporte pas congé : à défaut d'accord sur le nouveau loyer, le bail se poursuit aux conditions actuelles, sous réserve de la seule révision annuelle prévue au contrat.`
        : `The lease renews tacitly at term. This proposal does not constitute notice: failing agreement on the new rent, the lease continues on current terms, subject only to the annual review provided in the contract.`,
      { size: 9.5 }
    );
    doc.note(
      fr
        ? "Rappel : toute hausse est plafonnée par l'indice de référence des loyers et interdite si le logement est classé F ou G."
        : "Reminder: any increase is capped by the rent reference index and forbidden if the unit is rated F or G."
    );
  }

  doc.space(14);
  doc.text(`${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`.trim(), { size: 9.5, align: "right" });
  return doc;
}
