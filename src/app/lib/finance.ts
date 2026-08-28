/**
 * Moteur financier — France & Canada.
 *
 * Toutes les fonctions sont pures et testables. Aucune dépendance externe.
 * Les conventions fiscales diffèrent selon le marché : les taux par défaut
 * viennent de `config/markets.ts`, jamais codés en dur ici.
 */

// ---------------------------------------------------------------- VAN / TRI

/** Valeur actuelle nette. `flows[0]` est l'investissement initial (négatif). */
export function npv(rate: number, flows: number[]): number {
  return flows.reduce((acc, f, i) => acc + f / Math.pow(1 + rate, i), 0);
}

/**
 * Taux de rendement interne, par bissection.
 * Renvoie `null` si aucun changement de signe (TRI mathématiquement indéfini).
 */
export function irr(flows: number[], lo = -0.95, hi = 2, iterations = 200): number | null {
  if (!flows.length) return null;
  const hasPos = flows.some((f) => f > 0);
  const hasNeg = flows.some((f) => f < 0);
  if (!hasPos || !hasNeg) return null;

  let a = lo;
  let b = hi;
  let fa = npv(a, flows);
  let fb = npv(b, flows);
  if (fa * fb > 0) return null;

  for (let i = 0; i < iterations; i++) {
    const mid = (a + b) / 2;
    const fm = npv(mid, flows);
    if (Math.abs(fm) < 1e-7) return mid;
    if (fa * fm < 0) {
      b = mid;
      fb = fm;
    } else {
      a = mid;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

// ------------------------------------------------------------- Amortissement

export interface LoanRow {
  period: number;
  year: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

/** Échéancier d'un prêt à mensualités constantes. */
export function amortization(principal: number, annualRate: number, years: number, startYear = new Date().getFullYear()): LoanRow[] {
  const n = Math.round(years * 12);
  if (n <= 0 || principal <= 0) return [];
  const r = annualRate / 12;
  const payment = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));

  const rows: LoanRow[] = [];
  let balance = principal;
  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    const capital = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - capital);
    rows.push({
      period: i,
      year: startYear + Math.floor((i - 1) / 12),
      payment,
      interest,
      principal: capital,
      balance,
    });
  }
  return rows;
}

/** Agrégation annuelle d'un échéancier — c'est ce qu'on affiche, pas les 300 lignes. */
export function amortizationByYear(rows: LoanRow[]) {
  const map = new Map<number, { year: number; payment: number; interest: number; principal: number; balance: number }>();
  rows.forEach((r) => {
    const cur = map.get(r.year) || { year: r.year, payment: 0, interest: 0, principal: 0, balance: r.balance };
    cur.payment += r.payment;
    cur.interest += r.interest;
    cur.principal += r.principal;
    cur.balance = r.balance;
    map.set(r.year, cur);
  });
  return [...map.values()];
}

// --------------------------------------------------------------- Rendements

export interface UnitEconomics {
  rent: number;          // loyer mensuel hors charges
  charges: number;       // charges mensuelles récupérables
  operatingCosts: number; // charges annuelles NON récupérables (gestion, assurance, entretien)
  propertyTax: number;   // taxe foncière (FR) / taxes municipales et scolaires (QC), annuel
  purchasePrice: number;
  acquisitionCosts: number; // frais de notaire (FR) / droits de mutation « taxe de bienvenue » (QC)
  loanPrincipal: number;
  loanRate: number;
  loanYears: number;
  vacancyRate: number;   // 0–1
  unpaidRate: number;    // 0–1
}

export interface Yields {
  grossRent: number;
  effectiveRent: number;
  operatingExpenses: number;
  noi: number;            // résultat net d'exploitation, avant dette
  debtService: number;
  cashFlow: number;       // après dette, avant impôt
  grossYield: number;     // rendement brut
  netYield: number;       // rendement net de charges
  cashOnCash: number;     // rentabilité des fonds propres
  dscr: number;           // couverture de la dette — < 1 = le bien ne se paie pas
  equity: number;
  totalInvested: number;
}

export function computeYields(u: UnitEconomics): Yields {
  const grossRent = u.rent * 12;
  const losses = grossRent * (u.vacancyRate + u.unpaidRate);
  const effectiveRent = grossRent - losses;
  const operatingExpenses = u.operatingCosts + u.propertyTax;
  const noi = effectiveRent - operatingExpenses;

  const schedule = amortization(u.loanPrincipal, u.loanRate, u.loanYears);
  const debtService = schedule.slice(0, 12).reduce((a, r) => a + r.payment, 0);

  const totalInvested = u.purchasePrice + u.acquisitionCosts;
  const equity = Math.max(1, totalInvested - u.loanPrincipal);

  return {
    grossRent,
    effectiveRent,
    operatingExpenses,
    noi,
    debtService,
    cashFlow: noi - debtService,
    grossYield: totalInvested > 0 ? grossRent / totalInvested : 0,
    netYield: totalInvested > 0 ? noi / totalInvested : 0,
    cashOnCash: (noi - debtService) / equity,
    dscr: debtService > 0 ? noi / debtService : Infinity,
    equity,
    totalInvested,
  };
}

// ----------------------------------------------------------------- Scénarios

export type ScenarioKey = "pessimistic" | "realistic" | "optimistic";

export interface ScenarioAssumptions {
  rentGrowth: number;     // indexation annuelle du loyer
  costGrowth: number;     // dérive des charges
  valueGrowth: number;    // revalorisation du bien
  extraVacancy: number;   // vacance additionnelle
  horizonYears: number;
  sellingCosts: number;   // 0–1, frais de revente (agence + fiscalité de cession)
  discountRate: number;   // taux d'actualisation pour la VAN
}

export const DEFAULT_SCENARIOS: Record<ScenarioKey, ScenarioAssumptions> = {
  pessimistic: { rentGrowth: 0.005, costGrowth: 0.035, valueGrowth: -0.005, extraVacancy: 0.06, horizonYears: 10, sellingCosts: 0.08, discountRate: 0.05 },
  realistic:   { rentGrowth: 0.020, costGrowth: 0.025, valueGrowth: 0.020, extraVacancy: 0.00, horizonYears: 10, sellingCosts: 0.07, discountRate: 0.05 },
  optimistic:  { rentGrowth: 0.035, costGrowth: 0.020, valueGrowth: 0.040, extraVacancy: -0.02, horizonYears: 10, sellingCosts: 0.06, discountRate: 0.05 },
};

export interface ScenarioResult {
  key: ScenarioKey;
  flows: number[];
  cumulativeCashFlow: number;
  resaleValue: number;
  netResale: number;
  remainingDebt: number;
  irr: number | null;
  npv: number;
  perYear: { year: number; rent: number; costs: number; debt: number; cashFlow: number }[];
}

export function runScenario(u: UnitEconomics, key: ScenarioKey, a: ScenarioAssumptions): ScenarioResult {
  const schedule = amortization(u.loanPrincipal, u.loanRate, u.loanYears);
  const byYear = amortizationByYear(schedule);

  const flows: number[] = [-(u.purchasePrice + u.acquisitionCosts - u.loanPrincipal)];
  const perYear: ScenarioResult["perYear"] = [];
  let cumulative = 0;

  for (let y = 1; y <= a.horizonYears; y++) {
    const growth = Math.pow(1 + a.rentGrowth, y - 1);
    const rent = u.rent * 12 * growth * (1 - u.vacancyRate - u.unpaidRate - a.extraVacancy);
    const costs = (u.operatingCosts + u.propertyTax) * Math.pow(1 + a.costGrowth, y - 1);
    const debt = byYear[y - 1]?.payment || 0;
    const cf = rent - costs - debt;
    cumulative += cf;
    flows.push(cf);
    perYear.push({ year: y, rent, costs, debt, cashFlow: cf });
  }

  const resaleValue = u.purchasePrice * Math.pow(1 + a.valueGrowth, a.horizonYears);
  const remainingDebt = byYear[a.horizonYears - 1]?.balance ?? 0;
  const netResale = resaleValue * (1 - a.sellingCosts) - remainingDebt;
  flows[flows.length - 1] += netResale;

  return {
    key,
    flows,
    cumulativeCashFlow: cumulative,
    resaleValue,
    netResale,
    remainingDebt,
    irr: irr(flows),
    npv: npv(a.discountRate, flows),
    perYear,
  };
}

// ------------------------------------------------- Simulateur « et si… ? »

export interface WhatIfResult {
  label: string;
  deltaPercent: number;
  deltaMoney: number;
  newValue: number;
}

/**
 * Traduit un point de pourcentage en euros ou en dollars annuels.
 * C'est la mécanique du « votre taux d'occupation est de 94 % — 2 points de plus
 * représenteraient 18 600 $/an ».
 */
export function whatIf(annualPotentialRent: number, currentRate: number, deltaPoints: number, label: string): WhatIfResult {
  const newRate = Math.max(0, Math.min(1, currentRate + deltaPoints / 100));
  const deltaMoney = annualPotentialRent * (newRate - currentRate);
  return { label, deltaPercent: deltaPoints, deltaMoney, newValue: newRate };
}

// ------------------------------------------- Comparateur de factures / dérives

export interface InvoiceAnomaly {
  invoiceId: string;
  severity: "high" | "medium" | "low";
  reason: { fr: string; en: string };
  observed: number;
  expected: number;
}

/**
 * Détecte les incohérences de facturation : écart au prix médian pour une même
 * catégorie, doublon probable, montant hors norme.
 */
export function compareInvoices(invoices: any[]): InvoiceAnomaly[] {
  const out: InvoiceAnomaly[] = [];
  const byCategory = new Map<string, any[]>();
  invoices.forEach((i) => {
    const list = byCategory.get(i.category) || [];
    list.push(i);
    byCategory.set(i.category, list);
  });

  byCategory.forEach((list) => {
    if (list.length < 3) return;
    const amounts = list.map((i) => i.amount).sort((x, y) => x - y);
    const median = amounts[Math.floor(amounts.length / 2)];
    list.forEach((inv) => {
      const ratio = median > 0 ? inv.amount / median : 1;
      if (ratio >= 1.6) {
        out.push({
          invoiceId: inv.id,
          severity: ratio >= 2.2 ? "high" : "medium",
          reason: {
            fr: `Montant ${Math.round((ratio - 1) * 100)} % au-dessus de la médiane de la catégorie`,
            en: `Amount ${Math.round((ratio - 1) * 100)}% above the category median`,
          },
          observed: inv.amount,
          expected: median,
        });
      }
    });
  });

  // Doublons : même fournisseur, même montant, moins de 10 jours d'écart
  for (let i = 0; i < invoices.length; i++) {
    for (let j = i + 1; j < invoices.length; j++) {
      const a = invoices[i];
      const b = invoices[j];
      if (a.providerId !== b.providerId || Math.abs(a.amount - b.amount) > 0.5) continue;
      const gap = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / 86400000;
      if (gap <= 10) {
        out.push({
          invoiceId: b.id,
          severity: "high",
          reason: { fr: "Doublon probable : même prestataire, même montant, moins de 10 jours d'écart", en: "Likely duplicate: same provider, same amount, under 10 days apart" },
          observed: b.amount,
          expected: 0,
        });
      }
    }
  }
  return out;
}

// ------------------------------------------------------ Score de performance

export interface ScoreFactor {
  key: string;
  label: { fr: string; en: string };
  weight: number;
  value: number;   // 0–100
  detail: { fr: string; en: string };
}

export interface PerformanceScore {
  total: number;
  grade: "A" | "B" | "C" | "D" | "E";
  factors: ScoreFactor[];
}

/**
 * Note de performance d'un logement — rentabilité, technique, satisfaction,
 * qualité de gestion. Chaque facteur est affiché : jamais de boîte noire,
 * exigence du RGPD art. 22 et de la loi 25 sur les décisions automatisées.
 */
export function performanceScore(input: {
  netYield: number;          // 0–1
  occupancyRate: number;     // 0–1
  unpaidRate: number;        // 0–1
  tenantSatisfaction: number; // 0–5
  avgResolutionDays: number;
  energyGrade: string;
  openTickets: number;
}): PerformanceScore {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const energyMap: Record<string, number> = { A: 100, B: 90, C: 78, D: 62, E: 45, F: 25, G: 5 };

  const factors: ScoreFactor[] = [
    {
      key: "yield",
      label: { fr: "Rentabilité nette", en: "Net yield" },
      weight: 0.3,
      value: clamp((input.netYield / 0.07) * 100),
      detail: { fr: `${(input.netYield * 100).toFixed(2)} % net`, en: `${(input.netYield * 100).toFixed(2)}% net` },
    },
    {
      key: "occupancy",
      label: { fr: "Taux d'occupation", en: "Occupancy" },
      weight: 0.2,
      value: clamp(input.occupancyRate * 100),
      detail: { fr: `${(input.occupancyRate * 100).toFixed(0)} % occupé`, en: `${(input.occupancyRate * 100).toFixed(0)}% occupied` },
    },
    {
      key: "unpaid",
      label: { fr: "Maîtrise des impayés", en: "Arrears control" },
      weight: 0.15,
      value: clamp(100 - input.unpaidRate * 100 * 8),
      detail: { fr: `${(input.unpaidRate * 100).toFixed(1)} % d'impayés`, en: `${(input.unpaidRate * 100).toFixed(1)}% arrears` },
    },
    {
      key: "satisfaction",
      label: { fr: "Satisfaction locataire", en: "Tenant satisfaction" },
      weight: 0.15,
      value: clamp((input.tenantSatisfaction / 5) * 100),
      detail: { fr: `${input.tenantSatisfaction.toFixed(1)} / 5`, en: `${input.tenantSatisfaction.toFixed(1)} / 5` },
    },
    {
      key: "reactivity",
      label: { fr: "Délai d'intervention", en: "Response time" },
      weight: 0.1,
      value: clamp(100 - input.avgResolutionDays * 9 - input.openTickets * 4),
      detail: { fr: `${input.avgResolutionDays.toFixed(1)} j en moyenne`, en: `${input.avgResolutionDays.toFixed(1)} days on average` },
    },
    {
      key: "energy",
      label: { fr: "Performance énergétique", en: "Energy performance" },
      weight: 0.1,
      value: energyMap[input.energyGrade] ?? 50,
      detail: { fr: `Classe ${input.energyGrade}`, en: `Class ${input.energyGrade}` },
    },
  ];

  const total = Math.round(factors.reduce((a, f) => a + f.value * f.weight, 0));
  const grade = total >= 82 ? "A" : total >= 68 ? "B" : total >= 54 ? "C" : total >= 40 ? "D" : "E";
  return { total, grade, factors };
}
