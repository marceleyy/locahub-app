/**
 * Couche d'assistance (« IA » côté produit).
 *
 * Volontairement déterministe et lisible : chaque recommandation renvoie ses
 * facteurs. En production, un modèle de langage peut remplacer `legalAnswer()`
 * et enrichir `triageTicket()`, mais la règle produit ne change pas :
 *
 *   → l'assistant PROPOSE, un humain VALIDE.
 *
 * C'est ce qui rend le produit compatible avec le RGPD art. 22 (France) et
 * l'article 12.1 de la loi 25 (Québec) sur les décisions automatisées.
 */

export type Loc = "fr" | "en";
export interface L { fr: string; en: string }

const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

// ------------------------------------------------------ Priorisation des tâches

export interface TaskPriority {
  score: number;              // 0–100
  level: "critical" | "high" | "medium" | "low";
  reasons: L[];
  dueInDays: number;
}

/**
 * Classe les tâches de la plus urgente à la moins urgente.
 * Quatre leviers : échéance, obligation légale, impact financier, impact locataire.
 */
export function prioritizeTask(task: any): TaskPriority {
  const due = task.dueDate ? daysUntil(task.dueDate) : 999;
  const reasons: L[] = [];
  let score = 0;

  if (due < 0) {
    score += 45;
    reasons.push({ fr: `En retard de ${Math.abs(due)} jour(s)`, en: `${Math.abs(due)} day(s) overdue` });
  } else if (due <= 3) {
    score += 35;
    reasons.push({ fr: `Échéance dans ${due} jour(s)`, en: `Due in ${due} day(s)` });
  } else if (due <= 14) {
    score += 20;
    reasons.push({ fr: `Échéance dans ${due} jours`, en: `Due in ${due} days` });
  } else if (due <= 45) {
    score += 8;
  }

  if (task.legal) {
    score += 30;
    reasons.push({ fr: "Obligation légale — délai non négociable", en: "Legal obligation — non-negotiable deadline" });
  }
  if (task.blocksRental) {
    score += 20;
    reasons.push({ fr: "Bloque la mise en location", en: "Blocks the listing" });
  }
  if (task.tenantImpact === "high") {
    score += 18;
    reasons.push({ fr: "Impact direct sur l'occupant", en: "Direct impact on the occupant" });
  } else if (task.tenantImpact === "medium") {
    score += 8;
  }
  if (task.amount >= 5000) {
    score += 12;
    reasons.push({ fr: "Enjeu financier important", en: "Significant financial stake" });
  } else if (task.amount >= 1000) {
    score += 6;
  }
  if (task.status === "done") score = 0;

  score = Math.max(0, Math.min(100, score));
  const level = score >= 70 ? "critical" : score >= 48 ? "high" : score >= 25 ? "medium" : "low";
  return { score, level, reasons, dueInDays: due };
}

export function sortByPriority(tasks: any[]) {
  return [...tasks]
    .map((t) => ({ ...t, priority: prioritizeTask(t) }))
    .sort((a, b) => b.priority.score - a.priority.score);
}

// --------------------------------------------------------- Triage des incidents

export interface Triage {
  priority: "urgent" | "high" | "normal" | "low";
  category: string;
  categoryLabel: L;
  trade: string;
  slaHours: number;
  advice: L;
  matched: string[];
}

const TRIAGE_RULES: { keys: string[]; category: string; label: L; trade: string; priority: Triage["priority"]; sla: number; advice: L }[] = [
  {
    keys: ["fuite", "inondation", "dégât des eaux", "degat des eaux", "eau qui coule", "leak", "flood", "water damage", "burst"],
    category: "plumbing", label: { fr: "Plomberie — dégât des eaux", en: "Plumbing — water damage" },
    trade: "plumber", priority: "urgent", sla: 4,
    advice: { fr: "Faire couper l'arrivée d'eau, photographier avant assèchement, déclarer à l'assurance sous 5 jours ouvrés.", en: "Shut off the water supply, photograph before drying, notify the insurer within 5 business days." },
  },
  {
    keys: ["gaz", "odeur de gaz", "gas smell", "monoxyde", "carbon monoxide"],
    category: "gas", label: { fr: "Sécurité gaz", en: "Gas safety" },
    trade: "gas", priority: "urgent", sla: 1,
    advice: { fr: "Urgence vitale : faire évacuer, ne pas actionner d'interrupteur, appeler le service d'urgence gaz avant toute intervention planifiée.", en: "Life-threatening: evacuate, do not operate switches, call the gas emergency line before scheduling anything." },
  },
  {
    keys: ["électricité", "electricite", "court-circuit", "disjoncteur", "prise qui", "electrical", "short circuit", "breaker", "sparks", "étincelle"],
    category: "electrical", label: { fr: "Électricité", en: "Electrical" },
    trade: "electrician", priority: "urgent", sla: 6,
    advice: { fr: "Couper le circuit concerné. Une installation défectueuse engage la responsabilité du bailleur au titre du logement décent.", en: "Cut the affected circuit. A faulty installation engages the landlord's habitability liability." },
  },
  {
    keys: ["chauffage", "chaudière", "chaudiere", "radiateur", "plus de chauffage", "heating", "boiler", "furnace", "no heat", "froid"],
    category: "heating", label: { fr: "Chauffage", en: "Heating" },
    trade: "hvac", priority: "high", sla: 24,
    advice: { fr: "En période froide, l'absence de chauffage rend le logement non décent (FR) ou impropre à l'habitation (QC). Traiter en priorité absolue.", en: "In cold weather, no heating makes the unit unfit under both French decency rules and Quebec habitability rules. Treat as top priority." },
  },
  {
    keys: ["serrure", "porte", "effraction", "cambriolage", "clé", "lock", "door", "break-in", "burglary", "key"],
    category: "security", label: { fr: "Sécurité / accès", en: "Security / access" },
    trade: "locksmith", priority: "urgent", sla: 4,
    advice: { fr: "Sécuriser l'accès le jour même. Conserver la facture : la charge incombe au bailleur en cas de vétusté, au locataire en cas de perte de clés.", en: "Secure access the same day. Keep the invoice: wear-and-tear is on the landlord, lost keys on the tenant." },
  },
  {
    keys: ["moisissure", "humidité", "humidite", "champignon", "mold", "mould", "damp", "condensation"],
    category: "damp", label: { fr: "Humidité / moisissures", en: "Damp / mould" },
    trade: "general", priority: "high", sla: 72,
    advice: { fr: "Rechercher la cause (infiltration, pont thermique, ventilation) avant tout traitement de surface. Risque sanitaire et contentieux fréquent.", en: "Find the root cause (infiltration, thermal bridge, ventilation) before any surface treatment. Health risk and a frequent source of disputes." },
  },
  {
    keys: ["nuisible", "cafard", "punaise", "rongeur", "souris", "rat", "pest", "cockroach", "bed bug", "bedbug", "mice", "vermin"],
    category: "pest", label: { fr: "Nuisibles", en: "Pests" },
    trade: "pest", priority: "high", sla: 48,
    advice: { fr: "Traitement de l'ensemble des logements contigus, sinon récidive garantie. En France, la lutte contre les punaises de lit relève du logement décent.", en: "Treat all adjoining units, otherwise recurrence is certain. In France, bed-bug control falls under habitability obligations." },
  },
  {
    keys: ["ascenseur", "elevator", "lift"],
    category: "elevator", label: { fr: "Ascenseur", en: "Elevator" },
    trade: "elevator", priority: "high", sla: 12,
    advice: { fr: "Vérifier le contrat de maintenance obligatoire et prévenir les occupants à mobilité réduite en priorité.", en: "Check the mandatory maintenance contract and notify residents with reduced mobility first." },
  },
  {
    keys: ["bruit", "voisin", "tapage", "noise", "neighbour", "neighbor"],
    category: "neighbour", label: { fr: "Trouble de voisinage", en: "Neighbour disturbance" },
    trade: "none", priority: "normal", sla: 120,
    advice: { fr: "Documenter par écrit avant toute mise en demeure. Le bailleur a une obligation de jouissance paisible mais des moyens limités face à un tiers.", en: "Document in writing before any formal notice. The landlord owes quiet enjoyment but has limited leverage over a third party." },
  },
  {
    keys: ["peinture", "usure", "esthétique", "esthetique", "paint", "cosmetic", "scratch"],
    category: "cosmetic", label: { fr: "Entretien courant", en: "Routine upkeep" },
    trade: "painter", priority: "low", sla: 336,
    advice: { fr: "Vérifier la répartition entre réparations locatives et charges du bailleur avant d'engager la dépense.", en: "Check the split between tenant-repairs and landlord-repairs before committing spend." },
  },
];

/** Analyse le texte d'un signalement et propose priorité, corps de métier et SLA. */
export function triageTicket(text: string): Triage {
  const t = (text || "").toLowerCase();
  const matched: string[] = [];
  let best: (typeof TRIAGE_RULES)[number] | null = null;

  for (const rule of TRIAGE_RULES) {
    const hits = rule.keys.filter((k) => t.includes(k));
    if (hits.length) {
      matched.push(...hits);
      const rank = { urgent: 4, high: 3, normal: 2, low: 1 };
      if (!best || rank[rule.priority] > rank[best.priority]) best = rule;
    }
  }

  const urgencyBoost = /urgent|immédiat|immediat|danger|impossible|inhabitable|emergency/.test(t);

  if (!best) {
    return {
      priority: urgencyBoost ? "high" : "normal",
      category: "other", categoryLabel: { fr: "À qualifier", en: "To be qualified" },
      trade: "general", slaHours: 96,
      advice: { fr: "Aucun mot-clé reconnu : demander une photo et une précision au locataire avant d'affecter un prestataire.", en: "No keyword matched: ask the tenant for a photo and details before assigning a provider." },
      matched,
    };
  }

  return {
    priority: urgencyBoost && best.priority === "normal" ? "high" : best.priority,
    category: best.category, categoryLabel: best.label,
    trade: best.trade, slaHours: best.sla, advice: best.advice, matched,
  };
}

/** Classe les prestataires pour un métier donné : note, respect des délais, coût. */
export function suggestProviders(providers: any[], trade: string, limit = 3) {
  return providers
    .filter((p) => p.trades.includes(trade) || trade === "general")
    .map((p) => {
      const factors: { label: L; value: number }[] = [
        { label: { fr: "Note moyenne", en: "Average rating" }, value: (p.rating / 5) * 100 },
        { label: { fr: "Respect des délais", en: "On-time rate" }, value: p.onTimeRate * 100 },
        { label: { fr: "Interventions réalisées", en: "Jobs completed" }, value: Math.min(100, p.jobsCompleted * 4) },
        { label: { fr: "Compétitivité tarifaire", en: "Price competitiveness" }, value: Math.max(0, 100 - (p.avgHourlyRate - 45) * 1.5) },
      ];
      const weights = [0.35, 0.3, 0.15, 0.2];
      const score = Math.round(factors.reduce((a, f, i) => a + f.value * weights[i], 0));
      return { ...p, matchScore: score, factors };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

// -------------------------------------------------------------- Alertes baux

export interface LeaseAlert {
  leaseId: string;
  propertyId: string;
  kind: "renewal_window" | "notice_deadline" | "indexation" | "insurance" | "ending";
  severity: "critical" | "high" | "medium";
  title: L;
  detail: L;
  dueDate: string;
  daysLeft: number;
  action: L;
}

/**
 * Génère les alertes de fin de bail selon le marché.
 * France : congé du bailleur 6 mois avant (vide) / 3 mois (meublé), révision annuelle IRL.
 * Québec : avis de modification 3 à 6 mois avant l'échéance d'un bail de 12 mois.
 */
export function leaseAlerts(leases: any[], properties: any[], market: string): LeaseAlert[] {
  const out: LeaseAlert[] = [];
  const shift = (iso: string, months: number) => {
    const d = new Date(iso);
    d.setMonth(d.getMonth() - months);
    return d.toISOString().slice(0, 10);
  };

  leases.forEach((l) => {
    const p = properties.find((x) => x.id === l.propertyId);
    if (!p || (market && p.market !== market)) return;
    const end = l.endDate;
    if (!end) return;
    const left = daysUntil(end);

    if (p.market === "QC") {
      const openWindow = shift(end, 6);
      const closeWindow = shift(end, 3);
      const dLeft = daysUntil(closeWindow);
      if (dLeft > -30 && dLeft < 240) {
        out.push({
          leaseId: l.id, propertyId: p.id, kind: "renewal_window",
          severity: dLeft <= 30 ? "critical" : dLeft <= 90 ? "high" : "medium",
          title: { fr: "Fenêtre d'avis de modification (TAL)", en: "Lease modification notice window (TAL)" },
          detail: {
            fr: `L'avis doit partir entre le ${openWindow} et le ${closeWindow}. Passé cette date, le bail se reconduit aux mêmes conditions.`,
            en: `Notice must be sent between ${openWindow} and ${closeWindow}. After that, the lease renews on identical terms.`,
          },
          dueDate: closeWindow, daysLeft: dLeft,
          action: { fr: "Préparer l'avis de modification", en: "Prepare the modification notice" },
        });
      }
    } else {
      const furnished = /meubl|furnish/i.test(l.type || "");
      const noticeDate = shift(end, furnished ? 3 : 6);
      const dLeft = daysUntil(noticeDate);
      if (dLeft > -30 && dLeft < 240) {
        out.push({
          leaseId: l.id, propertyId: p.id, kind: "notice_deadline",
          severity: dLeft <= 30 ? "critical" : dLeft <= 90 ? "high" : "medium",
          title: { fr: "Date limite de congé bailleur", en: "Landlord notice deadline" },
          detail: {
            fr: `Un congé (reprise, vente ou motif légitime) doit être signifié au plus tard le ${noticeDate}, soit ${furnished ? 3 : 6} mois avant l'échéance.`,
            en: `Notice (repossession, sale or legitimate cause) must be served by ${noticeDate}, i.e. ${furnished ? 3 : 6} months before term.`,
          },
          dueDate: noticeDate, daysLeft: dLeft,
          action: { fr: "Décider : reconduire ou donner congé", en: "Decide: renew or serve notice" },
        });
      }
      const nextReview = l.indexation?.nextReview;
      if (nextReview) {
        const iLeft = daysUntil(nextReview);
        if (iLeft > -15 && iLeft < 90) {
          out.push({
            leaseId: l.id, propertyId: p.id, kind: "indexation",
            severity: iLeft <= 15 ? "high" : "medium",
            title: { fr: "Révision annuelle du loyer (IRL)", en: "Annual rent review (IRL index)" },
            detail: {
              fr: "La révision se prescrit un an après la date convenue : au-delà, elle est perdue pour l'année écoulée. Interdite si le logement est classé F ou G.",
              en: "The review lapses one year after the agreed date. Forbidden if the unit is rated F or G.",
            },
            dueDate: nextReview, daysLeft: iLeft,
            action: { fr: "Appliquer l'IRL du trimestre de référence", en: "Apply the reference-quarter index" },
          });
        }
      }
    }

    if (left > 0 && left < 200) {
      out.push({
        leaseId: l.id, propertyId: p.id, kind: "ending",
        severity: left <= 60 ? "high" : "medium",
        title: { fr: "Échéance du bail", en: "Lease term" },
        detail: {
          fr: `Le bail arrive à échéance dans ${left} jours. Anticiper la relocation réduit la vacance de moitié en moyenne.`,
          en: `The lease ends in ${left} days. Anticipating re-letting typically halves vacancy.`,
        },
        dueDate: end, daysLeft: left,
        action: { fr: "Proposer un renouvellement en un clic", en: "Send a one-click renewal offer" },
      });
    }
  });

  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

// ------------------------------------------------------ Optimisation d'agenda

export interface Slot { date: string; start: string; end: string; taskId: string; rationale: L }

/**
 * Propose des créneaux pour les tâches non planifiées, en évitant les
 * rendez-vous existants. Le gestionnaire accepte, refuse ou déplace :
 * rien n'est inscrit à l'agenda sans validation.
 */
export function suggestSlots(tasks: any[], events: any[], days = 10): Slot[] {
  const busy = new Set(events.map((e) => `${e.date}|${e.start}`));
  const hours = ["09:00", "10:30", "14:00", "15:30", "17:00"];
  const ranked = sortByPriority(tasks.filter((t) => t.status !== "done" && !t.scheduledAt));
  const slots: Slot[] = [];
  let cursor = 0;

  for (const task of ranked) {
    let placed = false;
    for (let d = 1; d <= days && !placed; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const iso = date.toISOString().slice(0, 10);
      for (const h of hours) {
        if (busy.has(`${iso}|${h}`)) continue;
        busy.add(`${iso}|${h}`);
        const endH = `${String(Number(h.slice(0, 2)) + 1).padStart(2, "0")}:${h.slice(3)}`;
        slots.push({
          date: iso, start: h, end: endH, taskId: task.id,
          rationale: task.priority.reasons[0] || { fr: "Créneau libre le plus proche", en: "Nearest free slot" },
        });
        placed = true;
        break;
      }
    }
    if (++cursor >= 6) break;
  }
  return slots;
}

// ---------------------------------------------------- Recommandation de loyer

export interface RentAdvice {
  recommended: number;
  floor: number;
  ceiling: number;
  legalCap: number | null;
  capped: boolean;
  reasons: L[];
}

/**
 * Loyer optimal = point d'équilibre entre le marché et le risque de vacance,
 * puis écrêtement par le plafond légal quand il existe.
 */
export function recommendRent(property: any, marketConfig: any): RentAdvice {
  const reasons: L[] = [];
  const median = property.marketMedian || property.rent;
  let target = median;

  const gapDays = property.daysToLet ?? 15;
  if (gapDays > 25) {
    target = median * 0.96;
    reasons.push({ fr: "Délai de commercialisation long dans le secteur : viser sous la médiane", en: "Long time-to-let in the area: aim below the median" });
  } else if (gapDays < 8) {
    target = median * 1.04;
    reasons.push({ fr: "Marché tendu, biens loués en moins de 8 jours : marge de progression", en: "Tight market, units let in under 8 days: room to move up" });
  } else {
    reasons.push({ fr: "Positionnement à la médiane du secteur", en: "Positioned at the local median" });
  }

  const grade = property.energy?.grade;
  if (grade === "F" || grade === "G") {
    reasons.push({
      fr: "Classe F ou G : toute hausse de loyer est interdite en France, y compris à la relocation",
      en: "Class F or G: any rent increase is forbidden in France, including on re-letting",
    });
    if (property.market === "FR") target = Math.min(target, property.rent);
  }

  let legalCap: number | null = null;
  if (property.market === "FR" && property.legal?.rentControlZone && property.legal?.referenceRentIncreased) {
    legalCap = Math.round(property.legal.referenceRentIncreased * property.area);
    reasons.push({
      fr: `Encadrement des loyers : plafond au loyer de référence majoré, soit ${legalCap} €`,
      en: `Rent control: capped at the increased reference rent, i.e. €${legalCap}`,
    });
  }
  if (property.market === "QC" && property.legal?.previousRent) {
    reasons.push({
      fr: "Québec : la section G doit indiquer le loyer le plus bas des 12 derniers mois. Une hausse contestée sera arbitrée par le TAL.",
      en: "Quebec: section G must state the lowest rent of the past 12 months. A contested increase will be settled by the TAL.",
    });
  }

  const capped = legalCap != null && target > legalCap;
  const recommended = Math.round(capped ? legalCap! : target);

  return {
    recommended,
    floor: Math.round(recommended * 0.94),
    ceiling: Math.round(recommended * 1.06),
    legalCap,
    capped,
    reasons,
  };
}

// -------------------------------------------------- Anticipation des travaux

export interface WorkForecast {
  item: L;
  dueYear: number;
  estimatedCost: number;
  confidence: "high" | "medium" | "low";
  basis: L;
}

const LIFESPAN: { key: string; label: L; years: number; cost: number }[] = [
  { key: "boiler", label: { fr: "Remplacement de la chaudière", en: "Boiler replacement" }, years: 18, cost: 4500 },
  { key: "roof", label: { fr: "Réfection de toiture", en: "Roof renovation" }, years: 40, cost: 28000 },
  { key: "facade", label: { fr: "Ravalement de façade", en: "Façade renovation" }, years: 15, cost: 42000 },
  { key: "windows", label: { fr: "Remplacement des menuiseries", en: "Window replacement" }, years: 30, cost: 12000 },
  { key: "electrical", label: { fr: "Mise aux normes électriques", en: "Electrical upgrade" }, years: 35, cost: 6500 },
  { key: "elevator", label: { fr: "Modernisation de l'ascenseur", en: "Elevator modernisation" }, years: 25, cost: 35000 },
  { key: "plumbing", label: { fr: "Remplacement des colonnes", en: "Riser replacement" }, years: 45, cost: 22000 },
];

/** Croise l'âge des équipements et l'historique des signalements. */
export function forecastWorks(building: any, tickets: any[] = []): WorkForecast[] {
  const now = new Date().getFullYear();
  const out: WorkForecast[] = [];

  LIFESPAN.forEach((eq) => {
    const installed = building.equipment?.[eq.key];
    if (!installed) return;
    const dueYear = installed + eq.years;
    if (dueYear > now + 12) return;

    const related = tickets.filter((t) => t.category === eq.key).length;
    const pulled = related >= 2 ? 2 : related === 1 ? 1 : 0;

    out.push({
      item: eq.label,
      dueYear: dueYear - pulled,
      estimatedCost: Math.round(eq.cost * (1 + related * 0.08)),
      confidence: related >= 2 ? "high" : dueYear <= now + 3 ? "high" : dueYear <= now + 7 ? "medium" : "low",
      basis: related
        ? { fr: `Installé en ${installed}, durée de vie ${eq.years} ans, ${related} signalement(s) déjà enregistré(s)`, en: `Installed ${installed}, ${eq.years}-year lifespan, ${related} report(s) already logged` }
        : { fr: `Installé en ${installed}, durée de vie moyenne ${eq.years} ans`, en: `Installed ${installed}, average lifespan ${eq.years} years` },
    });
  });

  return out.sort((a, b) => a.dueYear - b.dueYear);
}

// ------------------------------------------------------- Assistant juridique

export interface LegalAnswer {
  question: L;
  answer: L;
  market: "FR" | "QC" | "BOTH";
  sources: { label: string; url: string }[];
  caution: L;
}

/**
 * Base de connaissances juridique consultable, avec les liens officiels pour
 * vérifier. Aucune réponse n'est présentée comme un conseil juridique.
 */
export const LEGAL_KB: LegalAnswer[] = [
  {
    market: "FR",
    question: { fr: "Quel préavis pour un congé donné par le bailleur ?", en: "What notice must a landlord give?" },
    answer: {
      fr: "Six mois avant l'échéance pour un logement vide, trois mois pour un meublé. Le congé doit être motivé : reprise pour habiter, vente, ou motif légitime et sérieux. Il se signifie par acte de commissaire de justice, lettre recommandée avec accusé de réception ou remise en main propre contre émargement.",
      en: "Six months before term for an unfurnished unit, three months for a furnished one. The notice must state a ground: repossession to live in, sale, or a legitimate and serious cause. It is served by bailiff, registered letter with acknowledgement, or hand delivery against signature.",
    },
    sources: [
      { label: "Loi n° 89-462 du 6 juillet 1989, art. 15", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310/" },
      { label: "service-public.fr — congé du bailleur", url: "https://www.service-public.fr/particuliers/vosdroits/F929" },
    ],
    caution: { fr: "Un congé mal motivé ou hors délai est nul : le bail se reconduit.", en: "An improperly grounded or late notice is void: the lease renews." },
  },
  {
    market: "FR",
    question: { fr: "Puis-je augmenter le loyer d'un logement classé F ou G ?", en: "Can I raise the rent on an F or G rated unit?" },
    answer: {
      fr: "Non. Les logements classés F et G sont gelés : ni révision annuelle, ni hausse à la relocation, ni complément de loyer. Par ailleurs, les logements G ne peuvent plus être mis en location depuis le 1er janvier 2025, les F le seront au 1er janvier 2028 et les E au 1er janvier 2034.",
      en: "No. F and G rated units are frozen: no annual review, no increase on re-letting, no rent supplement. G units can no longer be let since 1 January 2025, F from 1 January 2028 and E from 1 January 2034.",
    },
    sources: [
      { label: "Loi Climat et Résilience du 22 août 2021", url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000043956924" },
      { label: "ADEME — le DPE", url: "https://www.ademe.fr/" },
    ],
    caution: { fr: "Le calendrier est décalé en outre-mer.", en: "The timetable differs in overseas territories." },
  },
  {
    market: "FR",
    question: { fr: "Quelles pièces puis-je exiger d'un candidat locataire ?", en: "Which documents can I require from an applicant?" },
    answer: {
      fr: "Uniquement celles du décret n° 2015-1437 : pièce d'identité, justificatif de domicile, justificatif d'activité professionnelle, justificatifs de ressources, et l'acte de cautionnement du garant. Sont notamment interdits : relevés de compte, RIB, carte Vitale, casier judiciaire, attestation d'absence de crédit, dossier médical.",
      en: "Only those listed in decree 2015-1437: ID, proof of address, proof of employment, proof of income, and the guarantor's surety deed. Bank statements, bank details, health cards, criminal records, credit certificates and medical files are among those forbidden.",
    },
    sources: [
      { label: "Décret n° 2015-1437 du 5 novembre 2015", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000031441753/" },
      { label: "CNIL — gestion locative", url: "https://www.cnil.fr/" },
    ],
    caution: { fr: "Amende administrative jusqu'à 3 000 € (personne physique) et 15 000 € (personne morale).", en: "Administrative fine up to €3,000 (individual) and €15,000 (company)." },
  },
  {
    market: "QC",
    question: { fr: "Puis-je demander un dépôt de garantie au Québec ?", en: "Can I ask for a security deposit in Quebec?" },
    answer: {
      fr: "Non. Le locateur ne peut exiger qu'un seul versement d'avance : le premier mois de loyer. Sont illégaux le dépôt de garantie, le dépôt pour les clés, les chèques postdatés imposés et toute somme réclamée pour l'étude d'une candidature.",
      en: "No. The landlord may only require one advance payment: the first month's rent. Security deposits, key deposits, mandatory post-dated cheques and application fees are all illegal.",
    },
    sources: [
      { label: "Code civil du Québec, art. 1904", url: "https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991" },
      { label: "Tribunal administratif du logement", url: "https://www.tal.gouv.qc.ca/" },
    ],
    caution: { fr: "Une somme perçue à tort est récupérable devant le TAL.", en: "Improperly collected sums are recoverable before the TAL." },
  },
  {
    market: "QC",
    question: { fr: "Qu'est-ce que la section G du bail ?", en: "What is section G of the lease?" },
    answer: {
      fr: "C'est la mention par laquelle le locateur déclare au nouveau locataire le loyer le plus bas payé au cours des douze mois précédents, ou le loyer fixé par le Tribunal durant cette période. Si elle est omise ou inexacte, le locataire peut demander au TAL de fixer le loyer — la loi 31 de 2024 a renforcé ce mécanisme.",
      en: "It is the statement in which the landlord discloses to the new tenant the lowest rent paid over the previous twelve months, or the rent set by the Tribunal in that period. If omitted or false, the tenant may ask the TAL to set the rent — Bill 31 of 2024 strengthened this.",
    },
    sources: [
      { label: "Code civil du Québec, art. 1896", url: "https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991" },
      { label: "TAL — formulaire de bail obligatoire", url: "https://www.tal.gouv.qc.ca/fr/bail-et-formulaires" },
    ],
    caution: { fr: "Le formulaire de bail du TAL est obligatoire : un contrat maison est inopposable.", en: "The TAL lease form is mandatory: a home-made contract is unenforceable." },
  },
  {
    market: "QC",
    question: { fr: "Puis-je refuser un locataire qui a des enfants ou reçoit de l'aide sociale ?", en: "Can I refuse a tenant with children or on social assistance?" },
    answer: {
      fr: "Non. La Charte des droits et libertés de la personne interdit la discrimination fondée sur la grossesse, l'état civil, l'âge, l'origine, le handicap ou la condition sociale — ce dernier motif couvre l'aide sociale. Exiger le numéro d'assurance sociale ou le permis de conduire est également proscrit.",
      en: "No. The Charter of Human Rights and Freedoms prohibits discrimination based on pregnancy, civil status, age, origin, disability or social condition — the latter covering social assistance. Requiring a social insurance number or driver's licence is likewise prohibited.",
    },
    sources: [
      { label: "Charte des droits et libertés de la personne, art. 10", url: "https://www.legisquebec.gouv.qc.ca/fr/document/lc/C-12" },
      { label: "CDPDJ", url: "https://www.cdpdj.qc.ca/" },
    ],
    caution: { fr: "Recours possible devant la CDPDJ et le TAL, avec dommages moraux.", en: "Complaints may be filed with the CDPDJ and the TAL, with moral damages." },
  },
  {
    market: "BOTH",
    question: { fr: "Puis-je refuser automatiquement un dossier sur la base d'un score ?", en: "Can I automatically reject an application based on a score?" },
    answer: {
      fr: "Non, pas sans intervention humaine. Le RGPD (art. 22) et la loi 25 québécoise imposent d'informer la personne qu'une décision repose sur un traitement automatisé, de lui expliquer les principaux facteurs et de lui permettre de présenter ses observations à un humain habilité à réviser la décision.",
      en: "No, not without human involvement. GDPR art. 22 and Quebec's Law 25 require informing the person that a decision relies on automated processing, explaining the main factors, and allowing them to submit observations to a human able to review it.",
    },
    sources: [
      { label: "RGPD, article 22", url: "https://www.cnil.fr/fr/reglement-europeen-protection-donnees" },
      { label: "Commission d'accès à l'information du Québec", url: "https://www.cai.gouv.qc.ca/" },
    ],
    caution: { fr: "C'est pourquoi le score affiche ses facteurs et n'entraîne jamais de rejet automatique.", en: "This is why the score shows its factors and never triggers an automatic rejection." },
  },
  {
    market: "BOTH",
    question: { fr: "Sous quel délai dois-je restituer le dépôt ou traiter la fin de bail ?", en: "How quickly must I return the deposit or close out the lease?" },
    answer: {
      fr: "France : un mois si l'état des lieux de sortie est conforme à celui d'entrée, deux mois en cas de retenues justifiées, avec une pénalité de 10 % du loyer mensuel par mois de retard. Québec : la question ne se pose pas puisque le dépôt est interdit ; seul le solde de loyer et les dommages éventuels sont réglés, au besoin devant le TAL.",
      en: "France: one month if the exit inventory matches the entry one, two months where deductions are justified, with a 10% monthly penalty for late return. Quebec: moot, since deposits are forbidden; only outstanding rent and damages are settled, before the TAL if needed.",
    },
    sources: [
      { label: "Loi du 6 juillet 1989, art. 22", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310/" },
      { label: "TAL — fin de bail", url: "https://www.tal.gouv.qc.ca/" },
    ],
    caution: { fr: "Conserver l'état des lieux : sans lui, le logement est présumé rendu en bon état.", en: "Keep the inventory: without it, the unit is presumed returned in good condition." },
  },
];

/** Recherche simple par mots-clés dans la base juridique, filtrée par marché. */
export function searchLegal(query: string, market: string, locale: Loc = "fr"): LegalAnswer[] {
  const q = (query || "").toLowerCase().trim();
  const pool = LEGAL_KB.filter((a) => a.market === market || a.market === "BOTH");
  if (!q) return pool;
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  return pool
    .map((a) => {
      const hay = `${a.question[locale]} ${a.answer[locale]} ${a.question.fr} ${a.answer.fr}`.toLowerCase();
      return { a, score: words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0) };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a);
}
