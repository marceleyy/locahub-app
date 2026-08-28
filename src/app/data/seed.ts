/**
 * Données de démonstration.
 * Aucune donnée réelle : noms, adresses et montants sont fictifs.
 * Structure pensée pour être remplacée par une API REST/GraphQL sans changer les écrans.
 */

const img = (id: string) => `https://images.unsplash.com/${id}?w=1000&q=80`;

export const seedUsers = [
  // --- Administrateurs ---
  {
    id: "u-admin-1", role: "admin", firstName: "Sarah", lastName: "Ndiaye",
    email: "sarah@locahub.app", phone: "+33 6 12 00 00 01", market: "FR",
    status: "active", createdAt: "2025-09-01", locale: "fr", avatarColor: "#1a1a2e",
  },
  // --- Agents ---
  {
    id: "u-agent-1", role: "agent", firstName: "Karim", lastName: "Benali",
    email: "karim.benali@locahub.app", phone: "+33 6 45 22 18 90", market: "FR",
    status: "active", createdAt: "2025-10-12", locale: "fr", avatarColor: "#60a5fa",
    agency: "LocaHub Gestion Paris", licence: "CPI 7501 2025 000 012 345",
    licenceType: "Carte T + G (loi Hoguet)", licenceExpiry: "2028-03-31",
    financialGuarantee: "220 000 € – Galian", rcPro: "MMA n° 1204458",
    landlordIds: ["u-owner-1", "u-owner-2"], commissionRate: 7.5,
  },
  {
    id: "u-agent-2", role: "agent", firstName: "Marie-Ève", lastName: "Lachance",
    email: "me.lachance@locahub.app", phone: "+1 514 555 0142", market: "QC",
    status: "active", createdAt: "2025-11-05", locale: "fr", avatarColor: "#ff8c42",
    agency: "LocaHub Gestion Montréal", licence: "OACIQ D-8842",
    licenceType: "Courtier immobilier résidentiel", licenceExpiry: "2027-04-30",
    financialGuarantee: "FICI – Fonds d'indemnisation", rcPro: "Fonds d'assurance responsabilité OACIQ",
    landlordIds: ["u-owner-3"], commissionRate: 6,
  },
  // --- Propriétaires ---
  {
    id: "u-owner-1", role: "landlord", firstName: "Marie", lastName: "Dubois",
    email: "marie.dubois@email.fr", phone: "+33 6 78 45 12 33", market: "FR",
    status: "active", createdAt: "2025-06-20", locale: "fr", avatarColor: "#34d399",
    entityType: "Particulier", taxId: "—", agentId: "u-agent-1",
    payoutIban: "FR76 **** **** **** 4421", propertyIds: ["p-fr-1", "p-fr-2"],
  },
  {
    id: "u-owner-2", role: "landlord", firstName: "SCI", lastName: "Bellevue",
    email: "contact@sci-bellevue.fr", phone: "+33 4 78 22 11 09", market: "FR",
    status: "active", createdAt: "2025-07-14", locale: "fr", avatarColor: "#a78bfa",
    entityType: "SCI (personne morale)", taxId: "SIREN 892 445 118", agentId: "u-agent-1",
    payoutIban: "FR76 **** **** **** 9982", propertyIds: ["p-fr-3"],
  },
  {
    id: "u-owner-3", role: "landlord", firstName: "Groupe", lastName: "Immobilier MTL",
    email: "gestion@immobiliermtl.ca", phone: "+1 514 555 0199", market: "QC",
    status: "active", createdAt: "2025-05-02", locale: "fr", avatarColor: "#fbbf24",
    entityType: "Société par actions", taxId: "NEQ 1170945882", agentId: "u-agent-2",
    payoutIban: "TRANSIT 00021 – ***4410", propertyIds: ["p-qc-1", "p-qc-2", "p-qc-3"],
  },
  // --- Locataires ---
  {
    id: "u-tenant-1", role: "tenant", firstName: "Alexandre", lastName: "Tremblay",
    email: "alex.tremblay@email.ca", phone: "+1 514 555 0123", market: "QC",
    status: "active", createdAt: "2025-12-01", locale: "fr", avatarColor: "#60a5fa",
    occupation: "Développeur full-stack", income: 78000, incomePeriod: "year",
    employmentType: "CDI / permanent", householdSize: 1, hasGuarantor: true,
    guarantor: { name: "Claire Tremblay", relation: "Parent", income: 95000 },
    score: 86, scoreVerified: true, fileCompleteness: 92,
    documents: [
      { id: "d1", type: "id", label: "Pièce d'identité", verified: true },
      { id: "d2", type: "employment", label: "Preuve d'emploi", verified: true },
      { id: "d3", type: "income", label: "3 derniers talons de paie", verified: true },
      { id: "d4", type: "reference", label: "Référence ancien locateur", verified: false },
    ],
    creditCheckConsent: true, consentDate: "2026-01-12",
  },
  {
    id: "u-tenant-2", role: "tenant", firstName: "Léa", lastName: "Moreau",
    email: "lea.moreau@email.fr", phone: "+33 6 22 88 41 77", market: "FR",
    status: "active", createdAt: "2026-01-18", locale: "fr", avatarColor: "#ff8c42",
    occupation: "Infirmière", income: 2450, incomePeriod: "month",
    employmentType: "CDI", householdSize: 2, hasGuarantor: true,
    guarantor: { name: "Visale (Action Logement)", relation: "Garantie publique", income: 0 },
    score: 79, scoreVerified: true, fileCompleteness: 85,
    documents: [
      { id: "d1", type: "id", label: "Carte d'identité", verified: true },
      { id: "d2", type: "employment", label: "Contrat de travail", verified: true },
      { id: "d3", type: "income", label: "3 derniers bulletins de salaire", verified: true },
      { id: "d4", type: "tax", label: "Avis d'imposition", verified: false },
    ],
    creditCheckConsent: false, consentDate: null,
  },
  {
    id: "u-tenant-3", role: "tenant", firstName: "Sophie", lastName: "Lavoie",
    email: "sophie.lavoie@email.ca", phone: "+1 438 555 0187", market: "QC",
    status: "active", createdAt: "2025-08-09", locale: "en", avatarColor: "#34d399",
    occupation: "UX Designer", income: 71000, incomePeriod: "year",
    employmentType: "Permanent", householdSize: 2, hasGuarantor: false,
    guarantor: null, score: 81, scoreVerified: true, fileCompleteness: 78,
    documents: [
      { id: "d1", type: "id", label: "ID", verified: true },
      { id: "d2", type: "employment", label: "Employment letter", verified: true },
    ],
    creditCheckConsent: true, consentDate: "2025-08-15",
  },
  {
    id: "u-tenant-4", role: "tenant", firstName: "Yanis", lastName: "Cherif",
    email: "yanis.cherif@email.fr", phone: "+33 7 61 20 55 12", market: "FR",
    status: "active", createdAt: "2026-03-02", locale: "fr", avatarColor: "#a78bfa",
    occupation: "Étudiant M2 – alternance", income: 1350, incomePeriod: "month",
    employmentType: "Contrat d'apprentissage", householdSize: 1, hasGuarantor: true,
    guarantor: { name: "Nadia Cherif", relation: "Parent", income: 3200 },
    score: 68, scoreVerified: false, fileCompleteness: 61,
    documents: [
      { id: "d1", type: "id", label: "Carte d'identité", verified: true },
      { id: "d2", type: "school", label: "Certificat de scolarité", verified: true },
    ],
    creditCheckConsent: false, consentDate: null,
  },
];

export const seedProperties = [
  // ---------- FRANCE ----------
  {
    id: "p-fr-1", market: "FR", ownerId: "u-owner-1", agentId: "u-agent-1",
    title: "T2 lumineux rénové – Canal Saint-Martin",
    city: "Paris", district: "10e – Canal Saint-Martin",
    address: "18 rue de la Grange aux Belles, 75010 Paris",
    lat: 48.8738, lng: 2.3665,
    rent: 1290, charges: 110, deposit: 1290, area: 42, rooms: 2, bedrooms: 1, bathrooms: 1,
    furnished: false, floor: 3, elevator: false, yearBuilt: 1930,
    status: "occupied", availableFrom: "2026-09-01",
    images: [img("photo-1522708323590-d24dbb6b0267"), img("photo-1502672260066-6bc35f0332c0")],
    description: "T2 traversant refait à neuf, parquet d'origine, cuisine ouverte équipée, à 4 min du canal.",
    features: ["Parquet", "Cuisine équipée", "Double vitrage", "Local vélo", "Fibre"],
    energy: { grade: "D", primaryConsumption: 191, ghg: "C" },
    legal: {
      rentControlZone: true, referenceRent: 30.4, referenceRentIncreased: 36.5,
      rentSupplement: 0, previousRent: 1250, previousRentDate: "2025-09-01",
      tightMarketZone: true, permitToRent: false,
      diagnostics: { dpe: "2024-05-10", erp: "2025-11-02", crep: "2021-04-18", amiante: "2021-04-18", elec: "2023-06-01", gaz: null, boutin: "2024-05-10", notice: "2024-08-12" },
    },
    utilities: { elec: 62, gaz: 0, eau: 24, internet: 32, charges: 110, teom: 18 },
    ratings: { insulation: 3.9, noise: 3.4, cleanliness: 4.3, landlord: 4.6, neighborhood: 4.8, overall: 4.2 },
    reviewCount: 17, likes: 214, comments: 12, views: 3120,
    marketMedian: 1345, marketP25: 1180, marketP75: 1480, daysToLet: 9, vacancyRisk: 12,
  },
  {
    id: "p-fr-2", market: "FR", ownerId: "u-owner-1", agentId: "u-agent-1",
    title: "Studio meublé – Lyon Part-Dieu",
    city: "Lyon", district: "3e – Part-Dieu",
    address: "26 rue Paul Bert, 69003 Lyon",
    lat: 45.7605, lng: 4.8555,
    rent: 690, charges: 65, deposit: 1380, area: 24, rooms: 1, bedrooms: 1, bathrooms: 1,
    furnished: true, floor: 5, elevator: true, yearBuilt: 1975,
    status: "available", availableFrom: "2026-09-15",
    images: [img("photo-1536376072261-38c75010e6c9"), img("photo-1554995207-c18c203602cb")],
    description: "Studio entièrement meublé, orientation sud, idéal alternant ou jeune actif. Métro à 3 min.",
    features: ["Meublé", "Ascenseur", "Balcon", "Internet inclus", "Gardien"],
    energy: { grade: "E", primaryConsumption: 268, ghg: "D" },
    legal: {
      rentControlZone: true, referenceRent: 24.9, referenceRentIncreased: 29.9,
      rentSupplement: 0, previousRent: 675, previousRentDate: "2025-07-01",
      tightMarketZone: true, permitToRent: false,
      diagnostics: { dpe: "2023-09-12", erp: "2026-01-15", crep: null, amiante: null, elec: "2021-02-11", gaz: "2021-02-11", boutin: "2023-09-12", notice: "2026-01-15" },
    },
    utilities: { elec: 41, gaz: 0, eau: 15, internet: 0, charges: 65, teom: 11 },
    ratings: { insulation: 3.2, noise: 3.0, cleanliness: 4.0, landlord: 4.4, neighborhood: 4.1, overall: 3.7 },
    reviewCount: 9, likes: 88, comments: 6, views: 1740,
    marketMedian: 705, marketP25: 640, marketP75: 780, daysToLet: 6, vacancyRisk: 8,
  },
  {
    id: "p-fr-3", market: "FR", ownerId: "u-owner-2", agentId: "u-agent-1",
    title: "T3 avec terrasse – Bordeaux Chartrons",
    city: "Bordeaux", district: "Chartrons",
    address: "9 rue Notre-Dame, 33000 Bordeaux",
    lat: 44.8531, lng: -0.5723,
    rent: 1080, charges: 95, deposit: 1080, area: 68, rooms: 3, bedrooms: 2, bathrooms: 1,
    furnished: false, floor: 1, elevator: false, yearBuilt: 1890,
    status: "notice_given", availableFrom: "2026-10-01",
    images: [img("photo-1600210492486-724fe5c67fb0"), img("photo-1600607687939-ce8a6c25118c")],
    description: "Pierre bordelaise, moulures, terrasse de 12 m². Quartier des antiquaires.",
    features: ["Terrasse", "Moulures", "Cheminée", "Cave", "Proche tram"],
    energy: { grade: "F", primaryConsumption: 341, ghg: "E" },
    legal: {
      rentControlZone: true, referenceRent: 13.2, referenceRentIncreased: 15.8,
      rentSupplement: 60, previousRent: 1080, previousRentDate: "2023-10-01",
      tightMarketZone: true, permitToRent: true,
      diagnostics: { dpe: "2022-03-04", erp: "2025-06-20", crep: "2019-08-01", amiante: "2019-08-01", elec: "2019-08-01", gaz: null, boutin: "2022-03-04", notice: "2023-09-18" },
    },
    utilities: { elec: 78, gaz: 55, eau: 30, internet: 35, charges: 95, teom: 24 },
    ratings: { insulation: 2.6, noise: 4.2, cleanliness: 4.1, landlord: 3.8, neighborhood: 4.7, overall: 3.9 },
    reviewCount: 22, likes: 176, comments: 19, views: 2890,
    marketMedian: 1120, marketP25: 980, marketP75: 1260, daysToLet: 18, vacancyRisk: 34,
  },
  // ---------- QUÉBEC ----------
  {
    id: "p-qc-1", market: "QC", ownerId: "u-owner-3", agentId: "u-agent-2",
    title: "3½ rénové – Plateau Mont-Royal",
    city: "Montréal", district: "Plateau Mont-Royal",
    address: "4528 rue Saint-Denis, Montréal, QC H2J 2L3",
    lat: 45.5265, lng: -73.5813,
    rent: 1650, charges: 0, deposit: 0, area: 850, rooms: 3, bedrooms: 1, bathrooms: 1,
    furnished: false, floor: 2, elevator: false, yearBuilt: 1985,
    status: "available", availableFrom: "2026-07-01",
    images: [img("photo-1560448204-e02f11c3d0e2"), img("photo-1512917774080-9991f1c4c750")],
    description: "3½ rénové avec cachet, planchers de bois franc, balcon arrière, chauffage inclus.",
    features: ["Climatisation", "Lave-vaisselle", "Balcon", "Animaux acceptés", "Chauffage inclus"],
    energy: { grade: "71-85", primaryConsumption: 0, ghg: null },
    legal: {
      rentControlZone: false, referenceRent: null, referenceRentIncreased: null,
      rentSupplement: 0,
      sectionG: { lowestRent12m: 1495, sinceDate: "2025-07-01", declared: true },
      sectionF: { applies: false, reason: "Immeuble de plus de 5 ans" },
      previousRent: 1495, previousRentDate: "2025-07-01",
      tightMarketZone: false, permitToRent: false,
      diagnostics: { bail_tal: "2026-04-02", annexe: "2026-04-02", section_g: "2026-04-02", avis_reconduction: "2026-02-15" },
    },
    utilities: { hydro: 78, internet: 65, assurance: 22, stationnement: 60, deneigement: 0 },
    ratings: { insulation: 4.2, noise: 3.8, cleanliness: 4.6, landlord: 4.5, neighborhood: 4.9, overall: 4.5 },
    reviewCount: 28, likes: 142, comments: 15, views: 4210,
    marketMedian: 1720, marketP25: 1540, marketP75: 1890, daysToLet: 11, vacancyRisk: 15,
  },
  {
    id: "p-qc-2", market: "QC", ownerId: "u-owner-3", agentId: "u-agent-2",
    title: "Condo 4½ avec vue – Griffintown",
    city: "Montréal", district: "Griffintown",
    address: "1200 rue Ottawa, Montréal, QC H3C 1S1",
    lat: 45.4926, lng: -73.5610,
    rent: 2100, charges: 0, deposit: 0, area: 950, rooms: 4, bedrooms: 2, bathrooms: 2,
    furnished: true, floor: 14, elevator: true, yearBuilt: 2023,
    status: "occupied", availableFrom: "2027-07-01",
    images: [img("photo-1502672260266-1c1ef2d93688"), img("photo-1512918728675-ed5a9ecdebfd")],
    description: "Condo neuf, gym, piscine intérieure, terrasse sur le toit, concierge 24/7.",
    features: ["Gym", "Piscine", "Stationnement", "Concierge 24/7", "Meublé"],
    energy: { grade: "86-100", primaryConsumption: 0, ghg: null },
    legal: {
      rentControlZone: false, referenceRent: null, referenceRentIncreased: null,
      rentSupplement: 0,
      sectionG: { lowestRent12m: 2100, sinceDate: "2025-07-01", declared: true },
      sectionF: { applies: true, reason: "Immeuble prêt à l'usage depuis moins de 5 ans", maxRentUntil: "2028-06-30" },
      previousRent: 2100, previousRentDate: "2025-07-01",
      tightMarketZone: false, permitToRent: false,
      diagnostics: { bail_tal: "2025-06-10", annexe: "2025-06-10", section_f: "2025-06-10", section_g: "2025-06-10", avis_reconduction: null },
    },
    utilities: { hydro: 96, internet: 70, assurance: 28, stationnement: 145, deneigement: 0 },
    ratings: { insulation: 4.9, noise: 4.7, cleanliness: 4.9, landlord: 4.3, neighborhood: 4.4, overall: 4.8 },
    reviewCount: 42, likes: 256, comments: 31, views: 6120,
    marketMedian: 2180, marketP25: 1980, marketP75: 2400, daysToLet: 8, vacancyRisk: 9,
  },
  {
    id: "p-qc-3", market: "QC", ownerId: "u-owner-3", agentId: "u-agent-2",
    title: "5½ familial – Québec, Limoilou",
    city: "Québec", district: "Limoilou",
    address: "820 3e Avenue, Québec, QC G1L 2W6",
    lat: 46.8323, lng: -71.2280,
    rent: 1340, charges: 0, deposit: 0, area: 1120, rooms: 5, bedrooms: 3, bathrooms: 1,
    furnished: false, floor: 1, elevator: false, yearBuilt: 1958,
    status: "available", availableFrom: "2026-09-01",
    images: [img("photo-1493809842364-78817add7ffb"), img("photo-1484154218962-a197022b5858")],
    description: "Grand 5½ familial, cour arrière clôturée, proche écoles et parc Cartier-Brébeuf.",
    features: ["Cour privée", "Rangement", "Stationnement inclus", "Buanderie"],
    energy: { grade: "51-70", primaryConsumption: 0, ghg: null },
    legal: {
      rentControlZone: false, referenceRent: null, referenceRentIncreased: null,
      rentSupplement: 0,
      sectionG: { lowestRent12m: 1195, sinceDate: "2025-09-01", declared: false },
      sectionF: { applies: false, reason: "Immeuble de plus de 5 ans" },
      previousRent: 1195, previousRentDate: "2025-09-01",
      tightMarketZone: false, permitToRent: false,
      diagnostics: { bail_tal: null, annexe: null, section_g: null, avis_reconduction: null },
    },
    utilities: { hydro: 132, internet: 60, assurance: 24, stationnement: 0, deneigement: 35 },
    ratings: { insulation: 3.1, noise: 4.4, cleanliness: 3.9, landlord: 3.6, neighborhood: 4.2, overall: 3.8 },
    reviewCount: 11, likes: 64, comments: 5, views: 980,
    marketMedian: 1290, marketP25: 1150, marketP75: 1440, daysToLet: 24, vacancyRisk: 41,
  },
];

export const seedLeases = [
  {
    id: "l-1", propertyId: "p-fr-1", tenantId: "u-tenant-2", ownerId: "u-owner-1", agentId: "u-agent-1",
    market: "FR", type: "vide", rent: 1290, charges: 110, deposit: 1290,
    startDate: "2024-09-01", endDate: "2027-08-31", status: "active",
    signedAt: "2024-08-12", signatureLevel: "Signature électronique avancée (eIDAS)",
    indexation: { index: "IRL", lastApplied: "2025-09-01", nextReview: "2026-09-01", cappedByEnergy: false },
    attachments: ["DPE", "ERP", "CREP", "Notice d'information", "Surface Boutin"],
  },
  {
    id: "l-2", propertyId: "p-qc-2", tenantId: "u-tenant-3", ownerId: "u-owner-3", agentId: "u-agent-2",
    market: "QC", type: "tal_12", rent: 2100, charges: 0, deposit: 0,
    startDate: "2026-07-01", endDate: "2027-06-30", status: "renewal_pending",
    signedAt: "2025-06-10", signatureLevel: "Signature électronique (LCCJTI)",
    indexation: { index: "TAL", lastApplied: "2025-07-01", nextReview: "2026-07-01", cappedByEnergy: false },
    attachments: ["Bail TAL", "Règlements de l'immeuble", "Section F", "Section G"],
  },
  {
    id: "l-3", propertyId: "p-fr-3", tenantId: "u-tenant-4", ownerId: "u-owner-2", agentId: "u-agent-1",
    market: "FR", type: "vide", rent: 1080, charges: 95, deposit: 1080,
    startDate: "2023-10-01", endDate: "2026-09-30", status: "notice_given",
    signedAt: "2023-09-18", signatureLevel: "Signature électronique avancée (eIDAS)",
    indexation: { index: "IRL", lastApplied: "2025-10-01", nextReview: null, cappedByEnergy: true },
    attachments: ["DPE", "ERP", "CREP", "Notice d'information"],
  },
];

export const seedApplications = [
  {
    id: "a-1", propertyId: "p-qc-1", tenantId: "u-tenant-1", status: "review",
    createdAt: "2026-08-02", score: 86, rank: 1,
    aiSummary: { fr: "Revenu 3,9× le loyer, dossier vérifié à 92 %, aucun retard de paiement historique.", en: "Income 3.9× rent, file 92% verified, no payment incidents on record." },
    humanReviewed: false,
  },
  {
    id: "a-2", propertyId: "p-qc-1", tenantId: "u-tenant-3", status: "shortlisted",
    createdAt: "2026-08-04", score: 81, rank: 2,
    aiSummary: { fr: "Revenu 3,6× le loyer, sans endosseur, référence de locateur en attente.", en: "Income 3.6× rent, no co-signer, landlord reference pending." },
    humanReviewed: true,
  },
  {
    id: "a-3", propertyId: "p-fr-2", tenantId: "u-tenant-4", status: "sent",
    createdAt: "2026-08-10", score: 68, rank: 1,
    aiSummary: { fr: "Revenu inférieur au seuil usuel mais garant solide (2,4× le loyer). Dossier à compléter.", en: "Income below the usual threshold but strong guarantor (2.4× rent). File incomplete." },
    humanReviewed: false,
  },
  {
    id: "a-4", propertyId: "p-fr-2", tenantId: "u-tenant-2", status: "accepted",
    createdAt: "2026-07-28", score: 79, rank: 1,
    aiSummary: { fr: "Garantie Visale acceptée, revenu 3,5× le loyer.", en: "Visale guarantee accepted, income 3.5× rent." },
    humanReviewed: true,
  },
];

export const seedPayments = [
  { id: "pay-1", leaseId: "l-1", tenantId: "u-tenant-2", dueDate: "2026-08-01", amount: 1400, status: "paid", paidAt: "2026-07-30", method: "Prélèvement SEPA", receiptId: "Q-2608-001" },
  { id: "pay-2", leaseId: "l-1", tenantId: "u-tenant-2", dueDate: "2026-07-01", amount: 1400, status: "paid", paidAt: "2026-07-01", method: "Prélèvement SEPA", receiptId: "Q-2607-001" },
  { id: "pay-3", leaseId: "l-2", tenantId: "u-tenant-3", dueDate: "2026-08-01", amount: 2100, status: "paid", paidAt: "2026-08-01", method: "Débit préautorisé", receiptId: "Q-2608-014" },
  { id: "pay-4", leaseId: "l-3", tenantId: "u-tenant-4", dueDate: "2026-08-01", amount: 1175, status: "late", paidAt: null, method: "Virement", receiptId: null, daysLate: 16 },
  { id: "pay-5", leaseId: "l-3", tenantId: "u-tenant-4", dueDate: "2026-07-01", amount: 1175, status: "paid", paidAt: "2026-07-04", method: "Virement", receiptId: "Q-2607-009" },
];

export const seedTickets = [
  {
    id: "t-1", propertyId: "p-fr-1", tenantId: "u-tenant-2", ownerId: "u-owner-1", agentId: "u-agent-1",
    title: { fr: "Fuite sous l'évier de la cuisine", en: "Leak under the kitchen sink" },
    priority: "high", status: "progress", createdAt: "2026-08-14",
    slaHours: 24, category: "Plomberie", vendor: "Plomberie Belleville",
    estimatedCost: 180, chargeableTo: "owner",
  },
  {
    id: "t-2", propertyId: "p-qc-3", tenantId: null, ownerId: "u-owner-3", agentId: "u-agent-2",
    title: { fr: "Fenêtre du salon à calfeutrer avant l'hiver", en: "Living-room window needs weatherstripping before winter" },
    priority: "medium", status: "open", createdAt: "2026-08-11",
    slaHours: 120, category: "Menuiserie", vendor: null,
    estimatedCost: 340, chargeableTo: "owner",
  },
  {
    id: "t-3", propertyId: "p-qc-2", tenantId: "u-tenant-3", ownerId: "u-owner-3", agentId: "u-agent-2",
    title: { fr: "Badge d'accès au gym non fonctionnel", en: "Gym access badge not working" },
    priority: "low", status: "done", createdAt: "2026-07-29",
    slaHours: 72, category: "Accès / sécurité", vendor: "Sécuritech",
    estimatedCost: 0, chargeableTo: "building",
  },
];

export const seedVisits = [
  { id: "v-1", propertyId: "p-qc-1", agentId: "u-agent-2", tenantId: "u-tenant-1", date: "2026-08-18T10:00", status: "confirmed", type: "Visite physique" },
  { id: "v-2", propertyId: "p-qc-1", agentId: "u-agent-2", tenantId: "u-tenant-3", date: "2026-08-18T11:30", status: "confirmed", type: "Visite physique" },
  { id: "v-3", propertyId: "p-fr-2", agentId: "u-agent-1", tenantId: "u-tenant-4", date: "2026-08-19T14:00", status: "pending", type: "Visite virtuelle" },
  { id: "v-4", propertyId: "p-qc-3", agentId: "u-agent-2", tenantId: null, date: "2026-08-20T16:00", status: "open_house", type: "Portes ouvertes" },
];

export const seedProspects = [
  { id: "pr-1", name: "Julien Castel", email: "j.castel@email.fr", phone: "+33 6 55 12 03 44", market: "FR", budget: 1200, city: "Paris", stage: "qualified", source: "SeLoger", agentId: "u-agent-1", createdAt: "2026-08-05" },
  { id: "pr-2", name: "Amina Diallo", email: "a.diallo@email.fr", phone: "+33 7 12 45 88 21", market: "FR", budget: 750, city: "Lyon", stage: "visit_booked", source: "LocaHub", agentId: "u-agent-1", createdAt: "2026-08-08" },
  { id: "pr-3", name: "Nathan Roy", email: "n.roy@email.ca", phone: "+1 514 555 0177", market: "QC", budget: 1700, city: "Montréal", stage: "application", source: "Kijiji", agentId: "u-agent-2", createdAt: "2026-08-09" },
  { id: "pr-4", name: "Priya Sharma", email: "p.sharma@email.ca", phone: "+1 438 555 0121", market: "QC", budget: 1400, city: "Québec", stage: "new", source: "Facebook", agentId: "u-agent-2", createdAt: "2026-08-13" },
  { id: "pr-5", name: "Hugo Lemoine", email: "h.lemoine@email.fr", phone: "+33 6 90 22 41 08", market: "FR", budget: 1050, city: "Bordeaux", stage: "lost", source: "Leboncoin", agentId: "u-agent-1", createdAt: "2026-07-22" },
];

export const seedInventories = [
  { id: "inv-1", propertyId: "p-fr-1", leaseId: "l-1", type: "entry", date: "2024-09-01", status: "signed", rooms: 3, photos: 24, disputes: 0 },
  { id: "inv-2", propertyId: "p-fr-3", leaseId: "l-3", type: "exit", date: "2026-09-28", status: "scheduled", rooms: 4, photos: 0, disputes: 0 },
  { id: "inv-3", propertyId: "p-qc-2", leaseId: "l-2", type: "entry", date: "2025-07-01", status: "signed", rooms: 5, photos: 31, disputes: 1 },
];

export const seedMessages = [
  {
    id: "c-1", participants: ["u-tenant-2", "u-agent-1"], propertyId: "p-fr-1", subject: { fr: "Fuite cuisine", en: "Kitchen leak" },
    messages: [
      { id: "m1", from: "u-tenant-2", at: "2026-08-14T09:12", body: { fr: "Bonjour, il y a une fuite sous l'évier depuis ce matin.", en: "Hello, there has been a leak under the sink since this morning." } },
      { id: "m2", from: "u-agent-1", at: "2026-08-14T09:41", body: { fr: "Bien reçu, un plombier passe demain entre 9 h et 12 h. Coupez l'arrivée d'eau en attendant.", en: "Noted, a plumber will come tomorrow between 9am and 12pm. Please shut off the water supply meanwhile." } },
    ],
  },
  {
    id: "c-2", participants: ["u-tenant-3", "u-agent-2"], propertyId: "p-qc-2", subject: { fr: "Reconduction du bail", en: "Lease renewal" },
    messages: [
      { id: "m1", from: "u-agent-2", at: "2026-03-20T14:05", body: { fr: "Avis de reconduction envoyé, augmentation proposée de 2,8 %. Vous avez un mois pour répondre.", en: "Renewal notice sent, proposed increase of 2.8%. You have one month to reply." } },
      { id: "m2", from: "u-tenant-3", at: "2026-03-22T18:30", body: { fr: "Merci, je reviens vers vous cette semaine.", en: "Thanks, I will get back to you this week." } },
    ],
  },
];

export const seedAudit = [
  { id: "au-1", at: "2026-08-16T08:14", actorId: "u-agent-1", action: "view_application", target: "a-3", detail: { fr: "Consultation du dossier de Yanis Cherif", en: "Viewed Yanis Cherif's application" }, ip: "82.64.xx.xx" },
  { id: "au-2", at: "2026-08-15T17:02", actorId: "u-admin-1", action: "create_user", target: "u-tenant-4", detail: { fr: "Création d'un compte locataire", en: "Created a tenant account" }, ip: "82.64.xx.xx" },
  { id: "au-3", at: "2026-08-15T11:47", actorId: "u-agent-2", action: "export_data", target: "u-tenant-3", detail: { fr: "Export du dossier locataire (demande RGPD/loi 25)", en: "Tenant file export (GDPR/Law 25 request)" }, ip: "24.201.xx.xx" },
  { id: "au-4", at: "2026-08-12T09:30", actorId: "u-admin-1", action: "delete_documents", target: "a-old-77", detail: { fr: "Purge automatique des dossiers non retenus (> 30 jours)", en: "Automatic purge of rejected applications (> 30 days)" }, ip: "system" },
];

export const seedMarket = {
  FR: [
    { city: "Paris", medianRent: 32.1, yoy: 2.4, tension: 92, vacancy: 2.1, sample: 4820 },
    { city: "Lyon", medianRent: 15.8, yoy: 1.6, tension: 78, vacancy: 3.4, sample: 2610 },
    { city: "Bordeaux", medianRent: 14.2, yoy: 1.1, tension: 71, vacancy: 4.2, sample: 1780 },
    { city: "Lille", medianRent: 14.9, yoy: 2.0, tension: 74, vacancy: 3.8, sample: 1440 },
    { city: "Montpellier", medianRent: 14.4, yoy: 2.9, tension: 76, vacancy: 3.6, sample: 1120 },
  ],
  QC: [
    { city: "Montréal", medianRent: 1.92, yoy: 5.8, tension: 88, vacancy: 1.9, sample: 5310 },
    { city: "Québec", medianRent: 1.34, yoy: 4.9, tension: 81, vacancy: 1.2, sample: 2140 },
    { city: "Laval", medianRent: 1.71, yoy: 5.2, tension: 79, vacancy: 1.6, sample: 1290 },
    { city: "Gatineau", medianRent: 1.58, yoy: 6.1, tension: 83, vacancy: 1.1, sample: 940 },
    { city: "Sherbrooke", medianRent: 1.21, yoy: 4.2, tension: 68, vacancy: 2.4, sample: 610 },
  ],
};

export const seedFinancialHistory = [
  { month: "2026-03", revenue: 19800, expenses: 5100 },
  { month: "2026-04", revenue: 20100, expenses: 5400 },
  { month: "2026-05", revenue: 20350, expenses: 5300 },
  { month: "2026-06", revenue: 20350, expenses: 4900 },
  { month: "2026-07", revenue: 21050, expenses: 6200 },
  { month: "2026-08", revenue: 21050, expenses: 5150 },
];
