/**
 * Données de démonstration des modules de gestion.
 * Séparées de `seed.ts` pour rester lisibles : ici l'exploitation
 * (immeubles, tâches, prestataires, agenda, factures), là le locatif.
 */

// ------------------------------------------------------------------ Immeubles

export const seedBuildings = [
  {
    id: "b-fr-1", market: "FR", name: "Résidence Grange aux Belles",
    address: "18 rue de la Grange aux Belles, 75010 Paris", city: "Paris",
    lat: 48.8738, lng: 2.3665,
    yearBuilt: 1930, floors: 6, unitsTotal: 24, unitIds: ["p-fr-1"],
    coownership: true, syndic: "Cabinet Vermont", structure: "Pierre de taille, planchers bois",
    heating: "Collectif gaz", commonAreas: ["Hall", "Local vélo", "Cour", "Local poubelles"],
    equipment: { boiler: 2011, roof: 1998, facade: 2014, windows: 2019, electrical: 2005, plumbing: 1985 },
    worksDone: [
      { year: 2019, label: { fr: "Remplacement des menuiseries (double vitrage)", en: "Window replacement (double glazing)" }, cost: 96000 },
      { year: 2014, label: { fr: "Ravalement de façade sur rue", en: "Street façade renovation" }, cost: 210000 },
    ],
    insurance: { policy: "MRI-2024-8812", insurer: "AXA", renewal: "2027-01-01" },
    ownerId: "u-owner-1", managerId: "u-agent-1",
  },
  {
    id: "b-fr-2", market: "FR", name: "Le Part-Dieu 26",
    address: "26 rue Paul Bert, 69003 Lyon", city: "Lyon",
    lat: 45.7605, lng: 4.8555,
    yearBuilt: 1975, floors: 9, unitsTotal: 48, unitIds: ["p-fr-2"],
    coownership: true, syndic: "Foncia Rhône", structure: "Béton banché",
    heating: "Collectif gaz + ECS", commonAreas: ["Hall", "Ascenseur", "Parking", "Loge gardien"],
    equipment: { boiler: 2008, roof: 2016, facade: 2009, windows: 1998, electrical: 1990, elevator: 1999, plumbing: 1975 },
    worksDone: [{ year: 2016, label: { fr: "Étanchéité de la toiture-terrasse", en: "Flat-roof waterproofing" }, cost: 148000 }],
    insurance: { policy: "MRI-2023-4410", insurer: "MAIF", renewal: "2026-11-30" },
    ownerId: "u-owner-1", managerId: "u-agent-1",
  },
  {
    id: "b-fr-3", market: "FR", name: "Maison Notre-Dame",
    address: "9 rue Notre-Dame, 33000 Bordeaux", city: "Bordeaux",
    lat: 44.8531, lng: -0.5723,
    yearBuilt: 1890, floors: 3, unitsTotal: 4, unitIds: ["p-fr-3"],
    coownership: false, syndic: null, structure: "Pierre calcaire, plancher bois",
    heating: "Individuel électrique", commonAreas: ["Cage d'escalier", "Jardin"],
    equipment: { roof: 1986, facade: 2003, windows: 1994, electrical: 1988, plumbing: 1979 },
    worksDone: [{ year: 2003, label: { fr: "Ravalement complet", en: "Full façade renovation" }, cost: 52000 }],
    insurance: { policy: "PNO-2025-1177", insurer: "Allianz", renewal: "2027-03-15" },
    ownerId: "u-owner-2", managerId: "u-agent-1",
  },
  {
    id: "b-qc-1", market: "QC", name: "Plex Saint-Denis",
    address: "4210 rue Saint-Denis, Montréal, QC H2J 2K9", city: "Montréal",
    lat: 45.5231, lng: -73.5817,
    yearBuilt: 1928, floors: 3, unitsTotal: 6, unitIds: ["p-qc-1"],
    coownership: false, syndic: null, structure: "Brique, structure bois",
    heating: "Individuel électrique (plinthes)", commonAreas: ["Escalier extérieur", "Hangar", "Ruelle verte"],
    equipment: { roof: 2009, facade: 2012, windows: 2015, electrical: 2001, plumbing: 1968 },
    worksDone: [{ year: 2015, label: { fr: "Fenêtres PVC homologuées ÉnerGuide", en: "EnerGuide-rated PVC windows" }, cost: 48000 }],
    insurance: { policy: "IMM-QC-77120", insurer: "Intact", renewal: "2027-05-01" },
    ownerId: "u-owner-3", managerId: "u-agent-2",
  },
  {
    id: "b-qc-2", market: "QC", name: "Tour Griffintown",
    address: "1050 rue Wellington, Montréal, QC H3C 1V9", city: "Montréal",
    lat: 45.4925, lng: -73.5573,
    yearBuilt: 2022, floors: 18, unitsTotal: 142, unitIds: ["p-qc-2"],
    coownership: true, syndic: "Gestion Wellington", structure: "Béton, murs-rideaux",
    heating: "Thermopompe individuelle", commonAreas: ["Gym", "Terrasse", "Stationnement souterrain", "Salle de colis"],
    equipment: { roof: 2022, facade: 2022, windows: 2022, electrical: 2022, elevator: 2022, plumbing: 2022 },
    worksDone: [],
    insurance: { policy: "IMM-QC-99341", insurer: "Desjardins", renewal: "2027-02-01" },
    ownerId: "u-owner-3", managerId: "u-agent-2",
  },
  {
    id: "b-qc-3", market: "QC", name: "Duplex Limoilou",
    address: "812 3e Avenue, Québec, QC G1L 2W6", city: "Québec",
    lat: 46.8351, lng: -71.2265,
    yearBuilt: 1954, floors: 2, unitsTotal: 2, unitIds: ["p-qc-3"],
    coownership: false, syndic: null, structure: "Brique, ossature bois",
    heating: "Individuel électrique", commonAreas: ["Entrée commune", "Cour arrière"],
    equipment: { roof: 1999, facade: 1988, windows: 2003, electrical: 1978, plumbing: 1954 },
    worksDone: [],
    insurance: { policy: "IMM-QC-20455", insurer: "Promutuel", renewal: "2026-10-01" },
    ownerId: "u-owner-3", managerId: "u-agent-2",
  },
];

// ----------------------------------------------------- Données économiques

/** Une entrée par logement, alimentant le moteur financier. */
export const seedEconomics: Record<string, any> = {
  // Paris, acquis en 2015 : prêt largement amorti, cash-flow positif
  "p-fr-1": { purchasePrice: 268000, acquisitionCosts: 21000, loanPrincipal: 150000, loanRate: 0.021, loanYears: 20, operatingCosts: 2400, propertyTax: 1180, vacancyRate: 0.03, unpaidRate: 0.01 },
  // Lyon, petit ticket, bien tenu
  "p-fr-2": { purchasePrice: 132000, acquisitionCosts: 10400, loanPrincipal: 70000, loanRate: 0.024, loanYears: 20, operatingCosts: 1500, propertyTax: 640, vacancyRate: 0.05, unpaidRate: 0.02 },
  // Bordeaux, acquis récemment, classé F : le cas problématique du portefeuille
  "p-fr-3": { purchasePrice: 312000, acquisitionCosts: 24800, loanPrincipal: 230000, loanRate: 0.034, loanYears: 25, operatingCosts: 2900, propertyTax: 1420, vacancyRate: 0.08, unpaidRate: 0.02 },
  // Montréal, plex acquis en 2018
  "p-qc-1": { purchasePrice: 412000, acquisitionCosts: 6500, loanPrincipal: 168000, loanRate: 0.038, loanYears: 25, operatingCosts: 3600, propertyTax: 3950, vacancyRate: 0.02, unpaidRate: 0.01 },
  // Griffintown, achat neuf récent à taux élevé : cash-flow serré
  "p-qc-2": { purchasePrice: 712000, acquisitionCosts: 13200, loanPrincipal: 470000, loanRate: 0.049, loanYears: 25, operatingCosts: 5200, propertyTax: 4780, vacancyRate: 0.04, unpaidRate: 0.01 },
  // Québec, duplex ancien, vacance et impayés élevés
  "p-qc-3": { purchasePrice: 298000, acquisitionCosts: 4400, loanPrincipal: 175000, loanRate: 0.047, loanYears: 25, operatingCosts: 3100, propertyTax: 2640, vacancyRate: 0.09, unpaidRate: 0.04 },
};

// -------------------------------------------------------------- Prestataires

export const seedProviders = [
  {
    id: "pr-1", market: "FR", name: "Plomberie Rivet & Fils", contact: "Marc Rivet",
    phone: "+33 6 12 44 90 21", email: "contact@rivet-plomberie.fr", city: "Paris",
    trades: ["plumber", "hvac", "general"], rating: 4.6, onTimeRate: 0.92, jobsCompleted: 34,
    avgHourlyRate: 68, insurance: "Décennale AXA n° 774-221", validUntil: "2027-06-30",
    availability: { fr: "Lun–Sam, urgences 7j/7", en: "Mon–Sat, emergencies 7 days" },
    notes: { fr: "Très fiable en urgence. Devis systématique au-delà de 400 €.", en: "Very reliable in emergencies. Always quotes above €400." },
  },
  {
    id: "pr-2", market: "FR", name: "Élec Concept", contact: "Sonia Belaïd",
    phone: "+33 7 88 12 05 44", email: "s.belaid@elecconcept.fr", city: "Paris",
    trades: ["electrician", "general"], rating: 4.2, onTimeRate: 0.81, jobsCompleted: 21,
    avgHourlyRate: 74, insurance: "Décennale MAAF n° 118-903", validUntil: "2026-12-31",
    availability: { fr: "Lun–Ven 8h–18h", en: "Mon–Fri 8am–6pm" },
    notes: { fr: "Excellente qualité, mais délais parfois tenus de justesse.", en: "Excellent quality, deadlines sometimes tight." },
  },
  {
    id: "pr-3", market: "FR", name: "Bâti Sud Rénovation", contact: "Julien Mesnard",
    phone: "+33 6 45 78 33 12", email: "contact@batisud.fr", city: "Bordeaux",
    trades: ["general", "painter", "damp"], rating: 3.9, onTimeRate: 0.74, jobsCompleted: 12,
    avgHourlyRate: 52, insurance: "Décennale Groupama n° 402-556", validUntil: "2027-01-31",
    availability: { fr: "Lun–Ven, planning chargé au printemps", en: "Mon–Fri, busy in spring" },
    notes: { fr: "Bon rapport qualité-prix sur les gros chantiers, moins réactif en urgence.", en: "Good value on large jobs, less responsive in emergencies." },
  },
  {
    id: "pr-4", market: "QC", name: "Plomberie Beaubien inc.", contact: "Éric Lavoie",
    phone: "+1 514 555 0142", email: "info@plomberiebeaubien.ca", city: "Montréal",
    trades: ["plumber", "general"], rating: 4.8, onTimeRate: 0.95, jobsCompleted: 41,
    avgHourlyRate: 95, insurance: "Licence RBQ 5812-4471-01", validUntil: "2027-04-30",
    availability: { fr: "24/7 pour les urgences", en: "24/7 for emergencies" },
    notes: { fr: "Licence RBQ vérifiée. Facturation détaillée, aucun litige en 3 ans.", en: "RBQ licence verified. Itemised invoicing, no disputes in 3 years." },
  },
  {
    id: "pr-5", market: "QC", name: "Chauffage Nordik", contact: "Marie-Pier Gagnon",
    phone: "+1 438 555 0918", email: "service@nordik.ca", city: "Montréal",
    trades: ["hvac", "gas"], rating: 4.4, onTimeRate: 0.88, jobsCompleted: 27,
    avgHourlyRate: 110, insurance: "Licence RBQ 8891-2204-55", validUntil: "2026-11-15",
    availability: { fr: "Priorité hivernale, délai 24 h garanti", en: "Winter priority, 24h guaranteed" },
    notes: { fr: "Indispensable en janvier. Réserver l'entretien préventif dès septembre.", en: "Essential in January. Book preventive service from September." },
  },
  {
    id: "pr-6", market: "QC", name: "Extermination Boréal", contact: "Samuel Roy",
    phone: "+1 581 555 7734", email: "contact@borealextermination.ca", city: "Québec",
    trades: ["pest"], rating: 4.1, onTimeRate: 0.9, jobsCompleted: 16,
    avgHourlyRate: 85, insurance: "Certificat CD-4471", validUntil: "2027-02-28",
    availability: { fr: "Lun–Sam", en: "Mon–Sat" },
    notes: { fr: "Traite systématiquement les logements contigus, ce qui évite les récidives.", en: "Systematically treats adjoining units, which prevents recurrence." },
  },
  {
    id: "pr-7", market: "FR", name: "Serrurerie Express 24", contact: "Karim Aziz",
    phone: "+33 6 22 90 11 77", email: "urgence@express24.fr", city: "Lyon",
    trades: ["locksmith", "security"], rating: 3.4, onTimeRate: 0.97, jobsCompleted: 9,
    avgHourlyRate: 120, insurance: "RC Pro Allianz n° 990-114", validUntil: "2026-09-30",
    availability: { fr: "24/7", en: "24/7" },
    notes: { fr: "Très rapide mais tarifs élevés : à réserver aux urgences réelles.", en: "Very fast but expensive: keep for genuine emergencies." },
  },
];

// ---------------------------------------------------------------- Tâches

export const seedTasks = [
  { id: "t-1", market: "FR", propertyId: "p-fr-3", buildingId: "b-fr-3", title: { fr: "Audit énergétique avant travaux (DPE F)", en: "Energy audit before works (DPE F)" }, description: { fr: "Le logement est classé F : interdiction de louer au 1er janvier 2028 et gel du loyer dès maintenant.", en: "Unit rated F: letting ban from 1 January 2028 and rent already frozen." }, category: "compliance", status: "todo", dueDate: "2026-09-20", assigneeId: "u-agent-1", legal: true, blocksRental: true, tenantImpact: "medium", amount: 1200, comments: [{ at: "2026-08-12", by: "u-agent-1", text: { fr: "Trois devis demandés, un seul reçu.", en: "Three quotes requested, one received." } }] },
  { id: "t-2", market: "FR", propertyId: "p-fr-2", buildingId: "b-fr-2", title: { fr: "Diagnostic amiante manquant", en: "Missing asbestos report" }, description: { fr: "Immeuble de 1975, permis antérieur à juillet 1997 : le diagnostic est obligatoire avant toute relocation.", en: "1975 building, permit before July 1997: the report is mandatory before re-letting." }, category: "compliance", status: "todo", dueDate: "2026-09-05", assigneeId: "u-agent-1", legal: true, blocksRental: true, tenantImpact: "low", amount: 320, comments: [] },
  { id: "t-3", market: "QC", propertyId: "p-qc-3", buildingId: "b-qc-3", title: { fr: "Section G non déclarée au bail", en: "Section G not declared in the lease" }, description: { fr: "Le loyer le plus bas des 12 derniers mois doit figurer au bail. À défaut, le locataire peut faire fixer le loyer par le TAL.", en: "The lowest rent of the past 12 months must appear in the lease, failing which the tenant may have the TAL set it." }, category: "compliance", status: "todo", dueDate: "2026-08-30", assigneeId: "u-agent-2", legal: true, blocksRental: true, tenantImpact: "high", amount: 0, comments: [] },
  { id: "t-4", market: "QC", propertyId: "p-qc-2", buildingId: "b-qc-2", title: { fr: "Avis de reconduction à envoyer", en: "Renewal notice to send" }, description: { fr: "Fenêtre légale de 3 à 6 mois avant l'échéance du bail. Passé le délai, reconduction aux mêmes conditions.", en: "Legal window 3 to 6 months before term. After that, renewal on identical terms." }, category: "lease", status: "in_progress", dueDate: "2026-09-30", assigneeId: "u-agent-2", legal: true, blocksRental: false, tenantImpact: "high", amount: 0, comments: [{ at: "2026-08-20", by: "u-agent-2", text: { fr: "Hausse envisagée : 2,4 %, justifiée par les taxes municipales.", en: "Proposed increase: 2.4%, justified by municipal taxes." } }] },
  { id: "t-5", market: "FR", propertyId: "p-fr-1", buildingId: "b-fr-1", title: { fr: "Régularisation annuelle des charges", en: "Annual charges reconciliation" }, description: { fr: "Décompte par nature de charges à fournir au locataire, pièces justificatives tenues à disposition un mois avant.", en: "Itemised statement to be provided to the tenant, supporting documents available one month beforehand." }, category: "finance", status: "todo", dueDate: "2026-10-15", assigneeId: "u-agent-1", legal: true, blocksRental: false, tenantImpact: "medium", amount: 0, comments: [] },
  { id: "t-6", market: "FR", propertyId: "p-fr-1", buildingId: "b-fr-1", title: { fr: "Entretien annuel de la chaudière collective", en: "Annual collective boiler service" }, description: { fr: "Obligation annuelle. Chaudière de 2011, fin de vie estimée en 2029.", en: "Annual obligation. Boiler from 2011, end of life estimated 2029." }, category: "maintenance", status: "todo", dueDate: "2026-10-01", assigneeId: "u-agent-1", legal: true, blocksRental: false, tenantImpact: "high", amount: 180, comments: [] },
  { id: "t-7", market: "QC", propertyId: "p-qc-1", buildingId: "b-qc-1", title: { fr: "Entretien préventif avant l'hiver", en: "Preventive service before winter" }, description: { fr: "Réserver dès septembre : les délais explosent en décembre au Québec.", en: "Book in September: lead times explode in December in Quebec." }, category: "maintenance", status: "todo", dueDate: "2026-09-25", assigneeId: "u-agent-2", legal: false, blocksRental: false, tenantImpact: "high", amount: 420, comments: [] },
  { id: "t-8", market: "FR", propertyId: "p-fr-2", buildingId: "b-fr-2", title: { fr: "Republier l'annonce sur les portails", en: "Republish the listing on portals" }, description: { fr: "Logement disponible au 15 septembre. Diffusion à programmer 3 semaines avant.", en: "Available 15 September. Schedule distribution 3 weeks ahead." }, category: "letting", status: "todo", dueDate: "2026-08-28", assigneeId: "u-agent-1", legal: false, blocksRental: false, tenantImpact: "low", amount: 0, comments: [] },
  { id: "t-9", market: "QC", propertyId: "p-qc-3", buildingId: "b-qc-3", title: { fr: "Mise aux normes électriques", en: "Electrical upgrade" }, description: { fr: "Installation d'origine 1978, deux signalements de disjonction en 6 mois.", en: "Original 1978 installation, two breaker reports in 6 months." }, category: "works", status: "todo", dueDate: "2026-11-15", assigneeId: "u-agent-2", legal: false, blocksRental: false, tenantImpact: "high", amount: 6800, comments: [] },
  { id: "t-10", market: "FR", propertyId: "p-fr-3", buildingId: "b-fr-3", title: { fr: "Relance impayé — 2 mois de retard", en: "Arrears follow-up — 2 months late" }, description: { fr: "Mise en demeure avant saisine de la commission de conciliation. Vérifier l'existence d'une garantie Visale.", en: "Formal notice before referring to the conciliation board. Check for a rent guarantee." }, category: "finance", status: "in_progress", dueDate: "2026-08-29", assigneeId: "u-agent-1", legal: true, blocksRental: false, tenantImpact: "high", amount: 2350, comments: [{ at: "2026-08-18", by: "u-agent-1", text: { fr: "Locataire joint par téléphone, propose un échéancier sur 6 mois.", en: "Tenant reached by phone, proposes a 6-month payment plan." } }] },
  { id: "t-11", market: "FR", propertyId: "p-fr-1", buildingId: "b-fr-1", title: { fr: "Renouvellement de l'assurance PNO", en: "Landlord insurance renewal" }, description: { fr: "Échéance au 1er janvier. Mettre en concurrence : +18 % annoncés par l'assureur actuel.", en: "Renewal 1 January. Shop around: current insurer announced +18%." }, category: "legal", status: "todo", dueDate: "2026-11-01", assigneeId: "u-agent-1", legal: false, blocksRental: false, tenantImpact: "low", amount: 640, comments: [] },
  { id: "t-12", market: "QC", propertyId: "p-qc-2", buildingId: "b-qc-2", title: { fr: "Visite groupée — 4 candidats", en: "Group viewing — 4 applicants" }, description: { fr: "Bloc de visites de 20 minutes. Prévoir la fiche d'information sur les décisions automatisées (loi 25).", en: "20-minute viewing slots. Bring the automated-decision information sheet (Law 25)." }, category: "letting", status: "todo", dueDate: "2026-09-02", assigneeId: "u-agent-2", legal: false, blocksRental: false, tenantImpact: "low", amount: 0, comments: [] },
  { id: "t-13", market: "FR", propertyId: "p-fr-2", buildingId: "b-fr-2", title: { fr: "État des lieux de sortie", en: "Exit inventory" }, description: { fr: "Contradictoire, photos horodatées, comparaison ligne à ligne avec l'entrée.", en: "Contradictory, time-stamped photos, line-by-line comparison with the entry inventory." }, category: "lease", status: "done", dueDate: "2026-08-10", assigneeId: "u-agent-1", legal: true, blocksRental: false, tenantImpact: "medium", amount: 0, comments: [] },
  { id: "t-14", market: "QC", propertyId: "p-qc-1", buildingId: "b-qc-1", title: { fr: "Vérifier la couverture d'assurance du locataire", en: "Verify tenant insurance coverage" }, description: { fr: "Attestation de responsabilité civile à jour. Le locateur ne peut pas imposer un assureur.", en: "Up-to-date liability certificate. The landlord cannot impose an insurer." }, category: "legal", status: "todo", dueDate: "2026-10-20", assigneeId: "u-agent-2", legal: false, blocksRental: false, tenantImpact: "low", amount: 0, comments: [] },
];

// ---------------------------------------------------------------- Agenda

export const seedEvents = [
  { id: "e-1", date: "2026-08-27", start: "10:30", end: "11:30", title: { fr: "Visite — Studio Part-Dieu", en: "Viewing — Part-Dieu studio" }, kind: "visit", propertyId: "p-fr-2", ownerId: "u-agent-1" },
  { id: "e-2", date: "2026-08-28", start: "09:00", end: "10:00", title: { fr: "État des lieux d'entrée", en: "Entry inventory" }, kind: "inventory", propertyId: "p-fr-1", ownerId: "u-agent-1" },
  { id: "e-3", date: "2026-08-31", start: "14:00", end: "15:00", title: { fr: "Rendez-vous propriétaire — bilan annuel", en: "Owner meeting — annual review" }, kind: "meeting", propertyId: null, ownerId: "u-agent-1" },
  { id: "e-4", date: "2026-09-02", start: "15:30", end: "17:00", title: { fr: "Visites groupées Griffintown", en: "Griffintown group viewings" }, kind: "visit", propertyId: "p-qc-2", ownerId: "u-agent-2" },
  { id: "e-5", date: "2026-09-04", start: "09:00", end: "12:00", title: { fr: "Intervention plomberie — colonne", en: "Plumbing work — riser" }, kind: "works", propertyId: "p-qc-1", ownerId: "u-agent-2" },
  { id: "e-6", date: "2026-09-10", start: "10:30", end: "11:30", title: { fr: "Assemblée générale de copropriété", en: "Co-ownership general meeting" }, kind: "meeting", propertyId: "p-fr-1", ownerId: "u-agent-1" },
];

// ---------------------------------------------------------------- Factures

export const seedInvoices = [
  { id: "f-1", market: "FR", propertyId: "p-fr-1", providerId: "pr-1", category: "plumbing", label: { fr: "Réparation fuite sous évier", en: "Under-sink leak repair" }, amount: 214, date: "2026-03-11", status: "paid", recoverable: false },
  { id: "f-2", market: "FR", propertyId: "p-fr-1", providerId: "pr-1", category: "plumbing", label: { fr: "Remplacement mitigeur", en: "Mixer tap replacement" }, amount: 189, date: "2026-05-22", status: "paid", recoverable: true },
  { id: "f-3", market: "FR", propertyId: "p-fr-2", providerId: "pr-1", category: "plumbing", label: { fr: "Détartrage ballon", en: "Water heater descaling" }, amount: 620, date: "2026-06-02", status: "paid", recoverable: true },
  { id: "f-4", market: "FR", propertyId: "p-fr-2", providerId: "pr-7", category: "locksmith", label: { fr: "Ouverture de porte + cylindre", en: "Door opening + cylinder" }, amount: 480, date: "2026-07-14", status: "unpaid", recoverable: false },
  { id: "f-5", market: "FR", propertyId: "p-fr-2", providerId: "pr-7", category: "locksmith", label: { fr: "Ouverture de porte + cylindre", en: "Door opening + cylinder" }, amount: 480, date: "2026-07-19", status: "unpaid", recoverable: false },
  { id: "f-6", market: "FR", propertyId: "p-fr-3", providerId: "pr-3", category: "damp", label: { fr: "Traitement humidité mur nord", en: "North wall damp treatment" }, amount: 1840, date: "2026-04-08", status: "paid", recoverable: false },
  { id: "f-7", market: "FR", propertyId: "p-fr-3", providerId: "pr-2", category: "electrical", label: { fr: "Remise aux normes tableau", en: "Consumer unit upgrade" }, amount: 1290, date: "2026-02-19", status: "paid", recoverable: false },
  { id: "f-8", market: "FR", propertyId: "p-fr-1", providerId: "pr-2", category: "electrical", label: { fr: "Diagnostic électrique", en: "Electrical inspection" }, amount: 145, date: "2026-06-01", status: "paid", recoverable: false },
  { id: "f-9", market: "FR", propertyId: "p-fr-2", providerId: "pr-2", category: "electrical", label: { fr: "Réparation circuit cuisine", en: "Kitchen circuit repair" }, amount: 168, date: "2026-07-03", status: "paid", recoverable: false },
  { id: "f-10", market: "QC", propertyId: "p-qc-1", providerId: "pr-4", category: "plumbing", label: { fr: "Débouchage drain principal", en: "Main drain unclogging" }, amount: 340, date: "2026-05-05", status: "paid", recoverable: false },
  { id: "f-11", market: "QC", propertyId: "p-qc-1", providerId: "pr-5", category: "hvac", label: { fr: "Entretien thermopompe", en: "Heat pump service" }, amount: 285, date: "2026-06-18", status: "paid", recoverable: false },
  { id: "f-12", market: "QC", propertyId: "p-qc-2", providerId: "pr-5", category: "hvac", label: { fr: "Entretien thermopompe", en: "Heat pump service" }, amount: 310, date: "2026-06-20", status: "paid", recoverable: false },
  { id: "f-13", market: "QC", propertyId: "p-qc-3", providerId: "pr-6", category: "pest", label: { fr: "Traitement punaises — 2 logements", en: "Bed bug treatment — 2 units" }, amount: 1450, date: "2026-07-28", status: "unpaid", recoverable: false },
  { id: "f-14", market: "QC", propertyId: "p-qc-3", providerId: "pr-5", category: "hvac", label: { fr: "Remplacement plinthes chauffantes", en: "Baseboard heater replacement" }, amount: 980, date: "2026-03-02", status: "paid", recoverable: false },
];

// ---------------------------------------------------------------- Portails

export const seedPortals = [
  { id: "seloger", market: "FR", name: "SeLoger", audience: { fr: "Généraliste, forte audience urbaine", en: "Generalist, strong urban reach" }, cost: 79, unit: "annonce" },
  { id: "leboncoin", market: "FR", name: "Leboncoin", audience: { fr: "Première audience française, très large", en: "Largest French audience by far" }, cost: 49, unit: "annonce" },
  { id: "pap", market: "FR", name: "PAP", audience: { fr: "Particulier à particulier, sans commission", en: "Private-to-private, no commission" }, cost: 39, unit: "annonce" },
  { id: "bienici", market: "FR", name: "Bien'ici", audience: { fr: "Recherche cartographique, bonne qualité de contacts", en: "Map-based search, good lead quality" }, cost: 59, unit: "annonce" },
  { id: "centris", market: "QC", name: "Centris", audience: { fr: "Référence des courtiers au Québec", en: "The reference for Quebec brokers" }, cost: 95, unit: "inscription" },
  { id: "kijiji", market: "QC", name: "Kijiji", audience: { fr: "Très forte audience locative au Québec", en: "Very strong rental audience in Quebec" }, cost: 0, unit: "annonce" },
  { id: "lespac", market: "QC", name: "LesPAC", audience: { fr: "Audience québécoise établie", en: "Established Quebec audience" }, cost: 35, unit: "annonce" },
  { id: "facebook", market: "QC", name: "Marketplace", audience: { fr: "Gratuit, volume élevé mais qualité variable", en: "Free, high volume but variable quality" }, cost: 0, unit: "annonce" },
];

export const seedListings = [
  { id: "l-1", propertyId: "p-fr-2", portalId: "leboncoin", status: "published", publishedAt: "2026-08-14", views: 842, leads: 19 },
  { id: "l-2", propertyId: "p-fr-2", portalId: "seloger", status: "published", publishedAt: "2026-08-14", views: 410, leads: 11 },
  { id: "l-3", propertyId: "p-fr-3", portalId: "pap", status: "draft", publishedAt: null, views: 0, leads: 0 },
  { id: "l-4", propertyId: "p-qc-2", portalId: "centris", status: "published", publishedAt: "2026-08-08", views: 1260, leads: 24 },
  { id: "l-5", propertyId: "p-qc-2", portalId: "kijiji", status: "published", publishedAt: "2026-08-08", views: 2140, leads: 31 },
];
