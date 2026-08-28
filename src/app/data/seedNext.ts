/**
 * Jeu de démonstration de la vague 2.
 * Séparé de `seed.ts` et `seedOps.ts` pour rester lisible.
 */

// ------------------------------------------------------------- Quittances

export const seedReceipts = [
  {
    id: "rc-1", paymentId: "pay-2", leaseId: "l-1", tenantId: "u-tenant-2", propertyId: "p-fr-1",
    market: "FR", reference: "Q-2607-Y002", amount: 1400, rent: 1290, charges: 110,
    periodStart: "2026-07-01", periodEnd: "2026-07-31", issuedAt: "2026-07-02",
  },
  {
    id: "rc-2", paymentId: "pay-1", leaseId: "l-1", tenantId: "u-tenant-2", propertyId: "p-fr-1",
    market: "FR", reference: "Q-2608-Y001", amount: 1400, rent: 1290, charges: 110,
    periodStart: "2026-08-01", periodEnd: "2026-08-31", issuedAt: "2026-08-01",
  },
  {
    id: "rc-3", paymentId: "pay-3", leaseId: "l-2", tenantId: "u-tenant-3", propertyId: "p-qc-2",
    market: "QC", reference: "Q-2608-Y003", amount: 2100, rent: 2100, charges: 0,
    periodStart: "2026-08-01", periodEnd: "2026-08-31", issuedAt: "2026-08-02",
  },
];

/** Une seule relance déjà partie : le dossier Bordeaux, en retard de 26 jours. */
export const seedDunningLog = [
  {
    id: "dn-1", paymentId: "pay-4", stepId: "reminder", channel: "email",
    sentAt: "2026-08-04", sentBy: "u-agent-1",
    body: "Rappel amiable envoyé automatiquement le troisième jour de retard.",
  },
];

// --------------------------------------------------------- Renouvellements

export const seedRenewals = [
  {
    id: "rn-1", leaseId: "l-2", propertyId: "p-qc-2", tenantId: "u-tenant-3", market: "QC",
    status: "proposed", createdAt: "2026-08-20", createdBy: "u-agent-2",
    currentRent: 2100, newRent: 2150, effectiveDate: "2027-07-01", newEndDate: "2028-06-30",
    reminderMonths: 6, reminderOn: "2027-01-01",
    note: { fr: "Hausse de 2,4 % justifiée par la progression des taxes municipales.", en: "2.4% increase justified by the rise in municipal taxes." },
  },
];

// ------------------------------------------------- Interventions prestataires

export const seedJobs = [
  {
    id: "jb-1", market: "FR", providerId: "pr-1", propertyId: "p-fr-1", ticketId: "t-1",
    title: { fr: "Fuite sous l'évier de la cuisine", en: "Leak under the kitchen sink" },
    description: { fr: "Joint de bonde à remplacer, siphon à contrôler. Locataire présent l'après-midi.", en: "Waste seal to replace, trap to check. Tenant available in the afternoon." },
    trade: "plumber", priority: "urgent", slaHours: 4,
    status: "accepted", offeredAt: "2026-08-14", offeredBy: "u-agent-1", answeredAt: "2026-08-14",
    scheduledFor: "2026-08-28", estimatedAmount: 220, invoiceId: null,
  },
  {
    id: "jb-2", market: "QC", providerId: "pr-5", propertyId: "p-qc-1", ticketId: null,
    title: { fr: "Entretien préventif avant l'hiver", en: "Preventive service before winter" },
    description: { fr: "Vérification des plinthes chauffantes et de la thermopompe des six logements.", en: "Check baseboard heaters and the heat pump across the six units." },
    trade: "hvac", priority: "normal", slaHours: 168,
    status: "offered", offeredAt: "2026-08-25", offeredBy: "u-agent-2", answeredAt: null,
    scheduledFor: null, estimatedAmount: 420, invoiceId: null,
  },
  {
    id: "jb-3", market: "QC", providerId: "pr-6", propertyId: "p-qc-3", ticketId: null,
    title: { fr: "Traitement punaises — deux logements", en: "Bed bug treatment — two units" },
    description: { fr: "Traitement des deux logements contigus, second passage à prévoir à quinze jours.", en: "Treat both adjoining units, second visit needed after two weeks." },
    trade: "pest", priority: "high", slaHours: 48,
    status: "invoiced", offeredAt: "2026-07-24", offeredBy: "u-agent-2", answeredAt: "2026-07-24",
    scheduledFor: "2026-07-28", estimatedAmount: 1400, invoiceId: "f-13",
  },
  {
    id: "jb-4", market: "FR", providerId: "pr-3", propertyId: "p-fr-3", ticketId: null,
    title: { fr: "Devis audit énergétique (DPE F)", en: "Energy audit quote (DPE F)" },
    description: { fr: "Chiffrage isolation et ventilation en vue du passage de F à D.", en: "Cost insulation and ventilation work to move from F to D." },
    trade: "damp", priority: "normal", slaHours: 336,
    status: "offered", offeredAt: "2026-08-22", offeredBy: "u-agent-1", answeredAt: null,
    scheduledFor: null, estimatedAmount: 1200, invoiceId: null,
  },
];

// ---------------------------------------------------------- Messagerie

export const seedMailboxes = [
  {
    userId: "u-agent-1", address: "karim.benali@locahub.app", displayName: "Karim Benali — LocaHub Paris",
    connected: true, provider: "imap", signature: "Karim Benali\nLocaHub Gestion Paris\nCarte professionnelle CPI 7501 2025 000 012 345",
    forwardToEmail: true, autoArchiveDays: 365,
  },
  {
    userId: "u-agent-2", address: "me.lachance@locahub.app", displayName: "Marie-Ève Lachance — LocaHub Montréal",
    connected: true, provider: "imap", signature: "Marie-Ève Lachance\nLocaHub Gestion Montréal\nCourtier immobilier OACIQ D-8842",
    forwardToEmail: true, autoArchiveDays: 365,
  },
];

export const seedThreads = [
  {
    id: "th-1", subject: { fr: "Fuite cuisine — suivi d'intervention", en: "Kitchen leak — job follow-up" },
    propertyId: "p-fr-1", market: "FR", channel: "mixed", createdAt: "2026-08-14", lastAt: "2026-08-15T09:20",
    participantIds: ["u-agent-1", "u-tenant-2", "u-owner-1"],
    messages: [
      {
        id: "ms-1", from: "u-tenant-2", at: "2026-08-14T18:42", channel: "internal", read: true,
        body: "Bonjour, de l'eau coule sous l'évier depuis hier soir. J'ai coupé l'arrivée d'eau et mis une bassine.",
        attachments: [
          { id: "at-1", kind: "video", name: "fuite-evier.mp4", size: 8420000, duration: 22 },
          { id: "at-2", kind: "image", name: "siphon.jpg", size: 1840000 },
        ],
      },
      {
        id: "ms-2", from: "u-agent-1", at: "2026-08-14T19:10", channel: "email", read: true,
        body: "Merci pour la vidéo, c'est très clair. J'envoie Plomberie Rivet demain matin. Laissez l'eau coupée d'ici là.",
        attachments: [],
      },
      {
        id: "ms-3", from: "u-owner-1", at: "2026-08-15T09:20", channel: "internal", read: false,
        body: "Bien reçu. La réparation est à ma charge, le joint relève de la vétusté et non de l'entretien courant.",
        attachments: [],
      },
    ],
  },
  {
    id: "th-2", subject: { fr: "Avis de modification du bail", en: "Lease modification notice" },
    propertyId: "p-qc-2", market: "QC", channel: "email", createdAt: "2026-08-20", lastAt: "2026-08-20T11:05",
    participantIds: ["u-agent-2", "u-tenant-3"],
    messages: [
      {
        id: "ms-4", from: "u-agent-2", at: "2026-08-20T11:05", channel: "email", read: true,
        body: "Bonjour, vous trouverez ci-joint l'avis de modification pour le bail arrivant à échéance le 30 juin 2027. Vous disposez d'un mois pour répondre.",
        attachments: [{ id: "at-3", kind: "pdf", name: "avis-modification-2027.pdf", size: 214000 }],
      },
    ],
  },
  {
    id: "th-3", subject: { fr: "Loyer d'août — régularisation", en: "August rent — settlement" },
    propertyId: "p-fr-3", market: "FR", channel: "email", createdAt: "2026-08-04", lastAt: "2026-08-18T14:30",
    participantIds: ["u-agent-1", "u-tenant-4"],
    messages: [
      {
        id: "ms-5", from: "u-agent-1", at: "2026-08-04T09:00", channel: "email", read: true,
        body: "Bonjour, le loyer d'août ne nous est pas parvenu. Il s'agit peut-être d'un décalage bancaire ; sinon nous restons disponibles pour convenir d'un échéancier.",
        attachments: [],
      },
      {
        id: "ms-6", from: "u-tenant-4", at: "2026-08-18T14:30", channel: "internal", read: false,
        body: "Bonjour, je traverse une période difficile. Un échéancier sur six mois serait-il envisageable ?",
        attachments: [],
      },
    ],
  },
];
