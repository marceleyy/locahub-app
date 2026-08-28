/**
 * Relances d'impayés et fenêtres de renouvellement.
 *
 * Les seuils, canaux et mises en garde viennent de `markets.FR.dunning` /
 * `markets.QC.dunning` et `markets.*.renewal`. Ce module se contente de
 * projeter le calendrier et de dire ce qui est dû, quand, et à qui.
 */

export type Loc = "fr" | "en";
interface L { fr: string; en: string }

const DAY = 86400000;
const daysBetween = (from: string, to = new Date().toISOString().slice(0, 10)) =>
  Math.floor((new Date(to).getTime() - new Date(from).getTime()) / DAY);

const shiftDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const shiftMonths = (iso: string, months: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ */
/* Relances                                                            */
/* ------------------------------------------------------------------ */

export interface DunningStepState {
  id: string;
  label: L;
  channel: string;
  tone: string;
  dueOn: string;
  offsetDays: number;
  state: "scheduled" | "due" | "sent";
  sentAt?: string;
}

export interface DunningPlan {
  paymentId: string;
  leaseId: string;
  tenantId: string;
  amount: number;
  dueDate: string;
  daysLate: number;
  steps: DunningStepState[];
  nextStep: DunningStepState | null;
  warnings: L[];
  guarantorDueOn: string | null;
}

/**
 * Projette le calendrier de relance d'un impayé.
 * `sentLog` contient les identifiants d'étapes déjà envoyées, ce qui rend la
 * fonction idempotente : on peut la rappeler à chaque rendu sans dupliquer.
 */
export function dunningPlan(payment: any, lease: any, market: any, sentLog: any[] = []): DunningPlan {
  const daysLate = daysBetween(payment.dueDate);
  const rules = market.dunning;

  const steps: DunningStepState[] = (rules.steps || []).map((s: any) => {
    const dueOn = shiftDays(payment.dueDate, s.offsetDays);
    const sent = sentLog.find((x: any) => x.paymentId === payment.id && x.stepId === s.id);
    return {
      id: s.id,
      label: s.label,
      channel: s.channel,
      tone: s.tone,
      offsetDays: s.offsetDays,
      dueOn,
      state: sent ? "sent" : daysLate >= s.offsetDays ? "due" : "scheduled",
      sentAt: sent?.sentAt,
    };
  });

  return {
    paymentId: payment.id,
    leaseId: payment.leaseId,
    tenantId: payment.tenantId,
    amount: payment.amount,
    dueDate: payment.dueDate,
    daysLate,
    steps,
    nextStep: steps.find((s) => s.state === "due") || steps.find((s) => s.state === "scheduled") || null,
    warnings: rules.warnings || [],
    guarantorDueOn: rules.guarantorNoticeDays
      ? shiftDays(payment.dueDate, rules.guarantorNoticeDays)
      : null,
  };
}

/** Tous les impayés d'un portefeuille, du plus ancien au plus récent. */
export function openArrears(payments: any[], leases: any[], properties: any[], market: string) {
  return payments
    .filter((p: any) => p.status === "late" || p.status === "unpaid")
    .map((p: any) => {
      const lease = leases.find((l: any) => l.id === p.leaseId);
      const property = lease ? properties.find((x: any) => x.id === lease.propertyId) : null;
      return { payment: p, lease, property };
    })
    .filter((r: any) => r.property && r.property.market === market)
    .sort((a: any, b: any) => a.payment.dueDate.localeCompare(b.payment.dueDate));
}

/* ------------------------------------------------------------------ */
/* Renouvellement                                                      */
/* ------------------------------------------------------------------ */

export interface RenewalWindow {
  mode: string;
  opensOn: string | null;
  closesOn: string | null;
  isOpen: boolean;
  daysToClose: number | null;
  daysToTerm: number;
  effectiveDate: string;
  proposedEndDate: string;
  termMonths: number;
  blocked: boolean;
  blockReason: L | null;
  guidance: L;
}

/**
 * Calcule la fenêtre d'envoi et les dates proposées.
 *
 * France : la reconduction est tacite, la proposition de révision peut partir
 * jusqu'à l'échéance ; c'est le congé qui obéit à un préavis strict.
 * Québec : l'avis de modification n'est recevable qu'entre 6 et 3 mois avant
 * l'échéance. Hors fenêtre, l'envoi est bloqué, pas seulement déconseillé.
 */
export function renewalWindow(lease: any, property: any, market: any): RenewalWindow | null {
  if (!lease?.endDate) return null;
  const rules = market.renewal;
  const daysToTerm = -daysBetween(lease.endDate);
  const furnished = /meubl|furnish/i.test(lease.type || "");

  const termMonths =
    (market.leaseTypes || []).find((t: any) => t.id === lease.type)?.months ?? (furnished ? 12 : 36);

  const effectiveDate = shiftDays(lease.endDate, 1);
  // dernier jour du terme, pas le premier jour du suivant
  const proposedEndDate = shiftDays(shiftMonths(effectiveDate, termMonths), -1);

  let opensOn: string | null = null;
  let closesOn: string | null = null;
  let isOpen = true;
  let blocked = false;
  let blockReason: L | null = null;

  if (market.code === "QC" && rules.noticeWindowMonths) {
    opensOn = shiftMonths(lease.endDate, -rules.noticeWindowMonths.open);
    closesOn = shiftMonths(lease.endDate, -rules.noticeWindowMonths.close);
    const today = new Date().toISOString().slice(0, 10);
    isOpen = today >= opensOn && today <= closesOn;
    if (!isOpen) {
      blocked = true;
      blockReason =
        today < opensOn
          ? { fr: `Trop tôt : la fenêtre d'avis s'ouvre le ${opensOn}.`, en: `Too early: the notice window opens on ${opensOn}.` }
          : { fr: `Fenêtre fermée depuis le ${closesOn} : le bail se reconduira aux conditions actuelles.`, en: `Window closed since ${closesOn}: the lease will renew on current terms.` };
    }
  } else {
    opensOn = shiftMonths(lease.endDate, -(rules.windowOpensMonths ?? 12));
    closesOn = lease.endDate;
    isOpen = new Date().toISOString().slice(0, 10) >= opensOn;
    if (!isOpen) {
      blockReason = { fr: `La proposition peut partir à compter du ${opensOn}.`, en: `The proposal can be sent from ${opensOn}.` };
    }
  }

  // Gel énergétique français : aucune hausse possible, la reconduction se fait à l'identique
  const grade = property?.energy?.grade;
  const frozen = market.code === "FR" && (grade === "F" || grade === "G");

  return {
    mode: rules.mode,
    opensOn,
    closesOn,
    isOpen,
    daysToClose: closesOn ? -daysBetween(closesOn) : null,
    daysToTerm,
    effectiveDate,
    proposedEndDate,
    termMonths,
    blocked,
    blockReason,
    guidance: frozen
      ? {
          fr: `Logement classé ${grade} : toute hausse de loyer est interdite. La reconduction ne peut se faire qu'à loyer inchangé.`,
          en: `Unit rated ${grade}: any rent increase is forbidden. Renewal can only be at an unchanged rent.`,
        }
      : rules.increaseRule,
  };
}

/** Plafond légal applicable à la hausse proposée. `null` si aucun plafond chiffré. */
export function renewalCap(lease: any, property: any, market: any): { cap: number | null; reason: L } {
  const grade = property?.energy?.grade;

  if (market.code === "FR") {
    if (grade === "F" || grade === "G") {
      return {
        cap: lease.rent,
        reason: { fr: "Gel du loyer : logement classé F ou G.", en: "Rent frozen: unit rated F or G." },
      };
    }
    if (property?.legal?.rentControlZone && property?.legal?.referenceRentIncreased && property?.area) {
      return {
        cap: Math.round(property.legal.referenceRentIncreased * property.area),
        reason: { fr: "Plafond au loyer de référence majoré.", en: "Capped at the increased reference rent." },
      };
    }
    return {
      cap: null,
      reason: { fr: "Hausse limitée à la variation de l'indice de référence des loyers.", en: "Increase limited to the rent reference index variation." },
    };
  }

  return {
    cap: null,
    reason: {
      fr: "Aucun plafond chiffré : le locataire peut refuser, le Tribunal administratif du logement fixe alors le loyer.",
      en: "No fixed cap: the tenant may refuse, and the Administrative Housing Tribunal then sets the rent.",
    },
  };
}

/** Date du rappel à programmer, à partir d'un décalage en mois choisi au moment de la signature. */
export function reminderDate(fromIso: string, months: number) {
  return shiftMonths(fromIso, months);
}
