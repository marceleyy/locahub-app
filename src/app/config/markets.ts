/**
 * Configuration par marché.
 * Chaque marché encapsule : devise, format, vocabulaire juridique, règles de conformité.
 * Ajouter un marché = ajouter une entrée ici (ex: "BE", "CH", "ON" pour l'Ontario).
 *
 * ⚠️ Les valeurs ci-dessous sont des paramètres produit, PAS un conseil juridique.
 * Elles doivent être validées par un avocat avant mise en production (voir docs/LEGAL_FR_CA.md).
 */

export type MarketCode = "FR" | "QC";

export const MARKETS: Record<MarketCode, any> = {
  FR: {
    code: "FR",
    label: { fr: "France", en: "France" },
    flag: "🇫🇷",
    currency: "EUR",
    currencySymbol: "€",
    intlLocale: { fr: "fr-FR", en: "en-GB" },
    areaUnit: "m²",
    areaUnitLabel: { fr: "m²", en: "sq m" },
    regulator: {
      rentTribunal: { fr: "Commission départementale de conciliation", en: "Rent Conciliation Board" },
      dataAuthority: "CNIL",
      professionalLicence: { fr: "Carte professionnelle (loi Hoguet)", en: "Professional licence (Hoguet Act)" },
    },
    // Dépôt de garantie
    deposit: {
      allowed: true,
      maxMonthsUnfurnished: 1,
      maxMonthsFurnished: 2,
      note: {
        fr: "1 mois de loyer hors charges (vide), 2 mois (meublé). Restitution sous 1 ou 2 mois.",
        en: "1 month rent excl. charges (unfurnished), 2 months (furnished). Returned within 1–2 months.",
      },
    },
    // Types de bail proposés dans les formulaires
    leaseTypes: [
      { id: "vide", fr: "Bail vide (3 ans)", en: "Unfurnished lease (3 years)", months: 36 },
      { id: "vide_moral", fr: "Bail vide – bailleur personne morale (6 ans)", en: "Unfurnished – corporate landlord (6 years)", months: 72 },
      { id: "meuble", fr: "Bail meublé (1 an)", en: "Furnished lease (1 year)", months: 12 },
      { id: "etudiant", fr: "Bail étudiant meublé (9 mois)", en: "Student furnished lease (9 months)", months: 9 },
      { id: "mobilite", fr: "Bail mobilité (1 à 10 mois)", en: "Mobility lease (1–10 months)", months: 10 },
      { id: "code_civil", fr: "Bail code civil / résidence secondaire", en: "Civil code lease / second home", months: 12 },
    ],
    noticePeriods: {
      tenant: { fr: "3 mois (1 mois en zone tendue ou cas dérogatoires)", en: "3 months (1 month in tight-market zones)" },
      landlord: { fr: "6 mois avant l'échéance (vide) / 3 mois (meublé), motif obligatoire", en: "6 months before term (unfurnished) / 3 months (furnished), grounds required" },
    },
    indexation: {
      key: "IRL",
      label: { fr: "Indice de référence des loyers (IRL) – INSEE", en: "Rent Reference Index (IRL) – INSEE" },
      frequency: { fr: "1 fois par an, si clause de révision au bail", en: "Once a year, if the lease includes a review clause" },
    },
    energy: {
      key: "DPE",
      label: { fr: "Diagnostic de performance énergétique (DPE)", en: "Energy Performance Certificate (DPE)" },
      scale: ["A", "B", "C", "D", "E", "F", "G"],
      // Calendrier loi Climat & Résilience (France métropolitaine)
      banned: ["G"],
      bannedSoon: [
        { grade: "F", date: "2028-01-01" },
        { grade: "E", date: "2034-01-01" },
      ],
      note: {
        fr: "Location interdite pour les logements classés G depuis le 01/01/2025 (nouveaux baux, renouvellements, reconductions). F au 01/01/2028, E au 01/01/2034. Gel des loyers F et G.",
        en: "Class G homes cannot be let since 01/01/2025 (new, renewed or tacitly extended leases). F from 01/01/2028, E from 01/01/2034. Rent freeze on F and G.",
      },
    },
    // Diagnostics à joindre au bail
    /**
     * Quittance de loyer — art. 21 de la loi du 6 juillet 1989.
     * Gratuite, de droit, et interdite de facturation.
     */
    receipt: {
      name: { fr: "Quittance de loyer", en: "Rent receipt" },
      mandatory: true,
      free: true,
      condition: { fr: "Due dès que le loyer et les charges sont intégralement payés", en: "Due once rent and charges are paid in full" },
      mustSplit: true,
      legalBasis: { fr: "Loi n° 89-462 du 6 juillet 1989, art. 21", en: "Law 89-462 of 6 July 1989, art. 21" },
      mentions: [
        { fr: "Le détail doit distinguer le loyer des charges.", en: "The breakdown must separate rent from charges." },
        { fr: "La remise de la quittance ne peut donner lieu à aucun frais.", en: "Issuing the receipt cannot incur any fee." },
        { fr: "La quittance vaut preuve de paiement et ne peut être refusée au locataire qui la demande.", en: "The receipt is proof of payment and cannot be refused to a tenant who requests it." },
      ],
    },

    /** Relances d'impayés — aucun frais ni pénalité ne peut être facturé au locataire. */
    dunning: {
      steps: [
        { id: "reminder", offsetDays: 3, tone: "friendly", channel: "email", label: { fr: "Rappel amiable", en: "Friendly reminder" } },
        { id: "formal", offsetDays: 10, tone: "firm", channel: "email", label: { fr: "Relance ferme", en: "Firm follow-up" } },
        { id: "notice", offsetDays: 30, tone: "legal", channel: "registered", label: { fr: "Mise en demeure (LRAR)", en: "Formal notice (registered letter)" } },
      ],
      penaltiesAllowed: false,
      guarantorNoticeDays: 15,
      escalation: { fr: "Commission départementale de conciliation, puis juge des contentieux de la protection", en: "Departmental conciliation board, then the protection litigation judge" },
      warnings: [
        { fr: "Aucune pénalité de retard ni frais de relance ne peut être facturé : la clause est réputée non écrite.", en: "No late penalty or dunning fee may be charged: such a clause is deemed unwritten." },
        { fr: "L'expulsion suppose une décision de justice et le respect de la trêve hivernale (1er novembre au 31 mars).", en: "Eviction requires a court ruling and observance of the winter truce (1 November to 31 March)." },
        { fr: "Si le bail est couvert par Visale ou une GLI, déclarer l'impayé dans le délai contractuel sous peine de déchéance.", en: "If covered by a rent guarantee, declare the arrears within the contractual deadline or lose cover." },
      ],
    },

    /** Renouvellement / congé — le bailleur décide, il ne « renouvelle » pas au sens québécois. */
    renewal: {
      mode: "tacit",
      label: { fr: "Reconduction tacite", en: "Tacit renewal" },
      landlordNoticeMonths: { unfurnished: 6, furnished: 3 },
      windowOpensMonths: 12,
      requiresGrounds: true,
      grounds: [
        { id: "reprise", fr: "Reprise pour habiter", en: "Repossession to occupy" },
        { id: "vente", fr: "Congé pour vendre", en: "Notice to sell" },
        { id: "motif", fr: "Motif légitime et sérieux", en: "Legitimate and serious cause" },
      ],
      increaseAllowed: true,
      increaseRule: { fr: "Révision annuelle plafonnée par l'IRL, interdite si le logement est classé F ou G", en: "Annual review capped by the IRL index, forbidden if the unit is rated F or G" },
      formTemplate: { fr: "Avis de reconduction et de révision de loyer", en: "Renewal and rent review notice" },
      reminderPresets: [3, 6, 12, 24],
    },

    mandatoryDocs: [
      { id: "dpe", fr: "DPE", en: "Energy performance certificate" },
      { id: "erp", fr: "État des risques et pollutions (ERP)", en: "Risks & pollution statement" },
      { id: "crep", fr: "CREP – plomb (immeuble avant 1949)", en: "Lead report (buildings before 1949)" },
      { id: "amiante", fr: "Amiante (permis de construire avant 07/1997)", en: "Asbestos report (permits before 07/1997)" },
      { id: "elec", fr: "Électricité (installation > 15 ans)", en: "Electrical safety (installation > 15 years)" },
      { id: "gaz", fr: "Gaz (installation > 15 ans)", en: "Gas safety (installation > 15 years)" },
      { id: "boutin", fr: "Surface habitable (loi Boutin)", en: "Habitable floor area (Boutin Act)" },
      { id: "notice", fr: "Notice d'information locataire", en: "Tenant information notice" },
    ],
    // Pièces autorisées / interdites au dossier locataire (décret n° 2015-1437)
    applicationDocs: {
      allowed: [
        { fr: "Pièce d'identité en cours de validité", en: "Valid photo ID" },
        { fr: "Justificatif de domicile", en: "Proof of address" },
        { fr: "Justificatif d'activité professionnelle", en: "Proof of employment" },
        { fr: "3 derniers bulletins de salaire ou 2 derniers bilans", en: "Last 3 payslips or last 2 financial statements" },
        { fr: "Dernier avis d'imposition", en: "Latest tax assessment" },
        { fr: "Acte de cautionnement du garant", en: "Guarantor deed" },
      ],
      forbidden: [
        { fr: "Relevés de compte bancaire", en: "Bank statements" },
        { fr: "Copie du livret de famille / carte Vitale", en: "Family record book / health card" },
        { fr: "Extrait de casier judiciaire", en: "Criminal record extract" },
        { fr: "Contrat de mariage, jugement de divorce", en: "Marriage contract, divorce ruling" },
        { fr: "Attestation d'absence de crédit / RIB", en: "Proof of no outstanding loan / bank details" },
        { fr: "Photographie d'identité (hors pièce d'identité)", en: "ID photograph (outside the ID document)" },
      ],
      penaltyNote: {
        fr: "Demander une pièce interdite : jusqu'à 3 000 € (personne physique) et 15 000 € (personne morale).",
        en: "Requesting a forbidden document: up to €3,000 (individuals) and €15,000 (companies).",
      },
    },
    rentControl: {
      enabled: true,
      label: { fr: "Encadrement des loyers", en: "Rent control" },
      cities: [
        "Paris", "Lille", "Hellemmes", "Lomme", "Lyon", "Villeurbanne",
        "Montpellier", "Bordeaux", "Plaine Commune", "Est Ensemble", "Grenoble", "Pays Basque",
      ],
      note: {
        fr: "Loyer plafonné au loyer de référence majoré (+20 % de la médiane). Complément de loyer possible seulement pour caractéristiques exceptionnelles et justifiées.",
        en: "Rent capped at the increased reference rent (+20% of median). A rent supplement is only allowed for exceptional, justified features.",
      },
    },
    // Ce que la fiche logement affiche en plus
    disclosure: {
      previousRent: {
        key: "encadrement",
        label: { fr: "Loyer du précédent locataire", en: "Previous tenant's rent" },
        legalBasis: {
          fr: "Mention obligatoire au bail en zone d'encadrement / zone tendue (gel du loyer à la relocation).",
          en: "Mandatory lease disclosure in rent-controlled / tight-market zones (rent freeze between tenants).",
        },
      },
    },
    utilities: [
      { id: "elec", fr: "Électricité", en: "Electricity" },
      { id: "gaz", fr: "Gaz", en: "Gas" },
      { id: "eau", fr: "Eau", en: "Water" },
      { id: "internet", fr: "Internet", en: "Internet" },
      { id: "charges", fr: "Charges de copropriété", en: "Building charges" },
      { id: "teom", fr: "Taxe d'ordures ménagères", en: "Waste collection tax" },
    ],
    dataSources: [
      { name: "DVF – Demandes de valeurs foncières", url: "https://app.dvf.etalab.gouv.fr", type: "open" },
      { name: "Carte des loyers (ANIL / INRAE)", url: "https://www.anil.org", type: "open" },
      { name: "Observatoires locaux des loyers (OLL)", url: "https://www.observatoires-des-loyers.org", type: "open" },
      { name: "Base DPE ADEME", url: "https://observatoire-dpe-audit.ademe.fr", type: "open" },
      { name: "Base Adresse Nationale (BAN)", url: "https://adresse.data.gouv.fr", type: "open" },
      { name: "Géorisques (ERP automatisé)", url: "https://www.georisques.gouv.fr", type: "open" },
      { name: "INSEE – données carroyées, revenus, population", url: "https://www.insee.fr", type: "open" },
    ],
    guaranteeSchemes: [
      { id: "visale", fr: "Visale (Action Logement) – caution gratuite", en: "Visale (Action Logement) – free guarantor" },
      { id: "gli", fr: "GLI – Garantie loyers impayés (assurance)", en: "Rent guarantee insurance" },
      { id: "caution", fr: "Caution solidaire (personne physique)", en: "Personal guarantor" },
    ],
  },

  QC: {
    code: "QC",
    label: { fr: "Canada – Québec", en: "Canada – Quebec" },
    flag: "🇨🇦",
    currency: "CAD",
    currencySymbol: "$",
    intlLocale: { fr: "fr-CA", en: "en-CA" },
    areaUnit: "pi²",
    areaUnitLabel: { fr: "pi²", en: "sq ft" },
    regulator: {
      rentTribunal: { fr: "Tribunal administratif du logement (TAL)", en: "Administrative Housing Tribunal (TAL)" },
      dataAuthority: { fr: "Commission d'accès à l'information (CAI)", en: "Access to Information Commission (CAI)" },
      professionalLicence: { fr: "Permis de courtier – OACIQ", en: "Broker licence – OACIQ" },
    },
    deposit: {
      allowed: false,
      maxMonthsUnfurnished: 0,
      maxMonthsFurnished: 0,
      note: {
        fr: "Interdit au Québec. Seul le 1er mois de loyer peut être exigé d'avance. Aucun dépôt de garantie, aucun chèque postdaté obligatoire, aucune clé « payante ».",
        en: "Prohibited in Quebec. Only the first month's rent may be required in advance. No security deposit, no mandatory post-dated cheques, no key money.",
      },
    },
    leaseTypes: [
      { id: "tal_12", fr: "Bail TAL 12 mois (formulaire obligatoire)", en: "TAL 12-month lease (mandatory form)", months: 12 },
      { id: "tal_court", fr: "Bail TAL durée fixe (< 12 mois)", en: "TAL fixed-term lease (< 12 months)", months: 6 },
      { id: "tal_indet", fr: "Bail à durée indéterminée", en: "Indefinite-term lease", months: 0 },
      { id: "chambre", fr: "Bail de chambre", en: "Room lease", months: 12 },
    ],
    noticePeriods: {
      tenant: { fr: "Non-renouvellement : 3 à 6 mois avant l'échéance (bail de 12 mois)", en: "Non-renewal: 3 to 6 months before term (12-month lease)" },
      landlord: { fr: "Avis de modification/reconduction : 3 à 6 mois avant l'échéance", en: "Modification/renewal notice: 3 to 6 months before term" },
    },
    indexation: {
      key: "TAL",
      label: { fr: "Calcul de fixation de loyer du TAL (pourcentages annuels)", en: "TAL rent-setting calculation (annual percentages)" },
      frequency: { fr: "À la reconduction du bail, via avis d'augmentation", en: "On lease renewal, via increase notice" },
    },
    energy: {
      key: "ENERGUIDE",
      label: { fr: "Cote ÉnerGuide / Novoclimat (volontaire)", en: "EnerGuide / Novoclimat rating (voluntary)" },
      scale: ["0-50", "51-70", "71-85", "86-100"],
      banned: [],
      bannedSoon: [],
      note: {
        fr: "Pas d'interdiction de location liée à la performance énergétique. La cote ÉnerGuide est volontaire et devient un argument commercial fort (coûts Hydro-Québec).",
        en: "No energy-based letting ban. The EnerGuide rating is voluntary and is a strong selling point (Hydro-Québec costs).",
      },
    },
    /**
     * Reçu de loyer — art. 1907 C.c.Q.
     * Obligatoire pour un paiement comptant, exigible dans tous les autres cas.
     */
    receipt: {
      name: { fr: "Reçu de loyer", en: "Rent receipt" },
      mandatory: true,
      free: true,
      condition: { fr: "Obligatoire si le loyer est payé en argent comptant, exigible sur demande sinon", en: "Mandatory when rent is paid in cash, available on request otherwise" },
      mustSplit: false,
      legalBasis: { fr: "Code civil du Québec, art. 1907", en: "Civil Code of Quebec, art. 1907" },
      mentions: [
        { fr: "Le loyer est réputé net : aucune charge séparée n'est ajoutée au montant du bail.", en: "Rent is deemed net: no separate charges are added to the lease amount." },
        { fr: "Le reçu ne peut être facturé au locataire.", en: "The receipt cannot be charged to the tenant." },
        { fr: "Le reçu peut servir de preuve devant le Tribunal administratif du logement.", en: "The receipt may serve as evidence before the Administrative Housing Tribunal." },
      ],
    },

    /** Relances d'impayés — seul le TAL peut résilier un bail. */
    dunning: {
      steps: [
        { id: "reminder", offsetDays: 3, tone: "friendly", channel: "email", label: { fr: "Rappel amiable", en: "Friendly reminder" } },
        { id: "formal", offsetDays: 10, tone: "firm", channel: "email", label: { fr: "Relance ferme", en: "Firm follow-up" } },
        { id: "notice", offsetDays: 21, tone: "legal", channel: "registered", label: { fr: "Mise en demeure avant demande au TAL", en: "Formal notice before TAL application" } },
      ],
      penaltiesAllowed: false,
      guarantorNoticeDays: 0,
      escalation: { fr: "Demande au Tribunal administratif du logement (recouvrement ou résiliation)", en: "Application to the Administrative Housing Tribunal (recovery or termination)" },
      warnings: [
        { fr: "Le locateur peut demander la résiliation si le retard dépasse trois semaines, mais seul le TAL peut la prononcer.", en: "The landlord may seek termination after three weeks of delay, but only the TAL can order it." },
        { fr: "Aucun intérêt supérieur au taux légal ni frais de retard ne peut être réclamé.", en: "No interest above the legal rate and no late fee may be claimed." },
        { fr: "La constitution d'une liste de mauvais payeurs est illégale (Charte, loi 25).", en: "Building a blacklist of bad payers is illegal (Charter, Law 25)." },
      ],
    },

    /** Reconduction — c'est la règle par défaut, l'avis sert à modifier, pas à renouveler. */
    renewal: {
      mode: "automatic",
      label: { fr: "Reconduction automatique du bail", en: "Automatic lease renewal" },
      landlordNoticeMonths: { unfurnished: 6, furnished: 6 },
      noticeWindowMonths: { open: 6, close: 3 },
      windowOpensMonths: 6,
      requiresGrounds: false,
      grounds: [
        { id: "reprise", fr: "Reprise du logement (art. 1957 C.c.Q.)", en: "Repossession of the dwelling (art. 1957 CCQ)" },
        { id: "subdivision", fr: "Subdivision, agrandissement ou changement d'affectation", en: "Subdivision, enlargement or change of use" },
      ],
      increaseAllowed: true,
      increaseRule: { fr: "Avis de modification dans la fenêtre de 3 à 6 mois ; le locataire peut refuser et le TAL fixe alors le loyer", en: "Modification notice in the 3-to-6-month window; the tenant may refuse and the TAL then sets the rent" },
      formTemplate: { fr: "Avis de modification des conditions du bail", en: "Notice of modification of lease conditions" },
      reminderPresets: [3, 6, 12],
      tenantMaySilentlyAccept: true,
      tenantResponseDays: 30,
    },

    mandatoryDocs: [
      { id: "bail_tal", fr: "Formulaire de bail obligatoire du TAL", en: "Mandatory TAL lease form" },
      { id: "annexe", fr: "Annexe – règlements de l'immeuble", en: "Appendix – building rules" },
      { id: "section_f", fr: "Section F – restriction de fixation (immeuble neuf ≤ 5 ans)", en: "Section F – rent-setting restriction (new building ≤ 5 years)" },
      { id: "section_g", fr: "Section G – loyer le plus bas des 12 derniers mois", en: "Section G – lowest rent paid in the last 12 months" },
      { id: "avis_reconduction", fr: "Avis de reconduction / modification", en: "Renewal / modification notice" },
    ],
    applicationDocs: {
      allowed: [
        { fr: "Nom, coordonnées, adresse actuelle", en: "Name, contact details, current address" },
        { fr: "Références de l'ancien locateur (avec consentement)", en: "Previous landlord references (with consent)" },
        { fr: "Preuve de revenu / emploi (avec consentement)", en: "Proof of income / employment (with consent)" },
        { fr: "Enquête de crédit — uniquement avec consentement écrit et explicite", en: "Credit check — only with explicit written consent" },
      ],
      forbidden: [
        { fr: "Numéro d'assurance sociale (NAS)", en: "Social Insurance Number (SIN)" },
        { fr: "Numéro de permis de conduire ou d'assurance maladie", en: "Driver's licence or health card number" },
        { fr: "Origine, religion, langue, orientation sexuelle, handicap, grossesse", en: "Origin, religion, language, sexual orientation, disability, pregnancy" },
        { fr: "Refus lié à la présence d'enfants ou à un revenu de transfert (aide sociale)", en: "Refusal based on children or social-assistance income" },
        { fr: "Dépôt de garantie, chèques postdatés obligatoires", en: "Security deposit, mandatory post-dated cheques" },
      ],
      penaltyNote: {
        fr: "Discrimination : recours devant la CDPDJ / TAL. Collecte excessive : recours devant la Commission d'accès à l'information (loi 25).",
        en: "Discrimination: complaint to CDPDJ / TAL. Excessive collection: complaint to the Access to Information Commission (Law 25).",
      },
    },
    rentControl: {
      enabled: true,
      label: { fr: "Fixation de loyer (TAL)", en: "Rent setting (TAL)" },
      cities: [],
      note: {
        fr: "Pas de plafond réglementaire à la première mise en location, mais tout locataire peut demander au TAL de fixer le loyer, notamment en s'appuyant sur la section G.",
        en: "No statutory cap on initial rent, but any tenant may ask the TAL to set the rent, notably based on Section G.",
      },
    },
    disclosure: {
      previousRent: {
        key: "section_g",
        label: { fr: "Section G – loyer le plus bas des 12 derniers mois", en: "Section G – lowest rent in the last 12 months" },
        legalBasis: {
          fr: "Art. 1896 C.c.Q. (loi 31, 2024) : le locateur doit déclarer le loyer le plus bas payé dans les 12 mois précédents. Omission ou fausse déclaration : le locataire peut saisir le TAL en fixation de loyer.",
          en: "Art. 1896 C.C.Q. (Law 31, 2024): the landlord must disclose the lowest rent paid in the previous 12 months. Omission or false statement: the tenant may apply to the TAL for rent setting.",
        },
      },
    },
    utilities: [
      { id: "hydro", fr: "Hydro-Québec (électricité + chauffage)", en: "Hydro-Québec (electricity + heating)" },
      { id: "internet", fr: "Internet / câble", en: "Internet / cable" },
      { id: "assurance", fr: "Assurance habitation locataire", en: "Tenant home insurance" },
      { id: "stationnement", fr: "Stationnement", en: "Parking" },
      { id: "deneigement", fr: "Déneigement", en: "Snow removal" },
    ],
    dataSources: [
      { name: "SCHL / CMHC – Enquête sur les logements locatifs", url: "https://www.cmhc-schl.gc.ca", type: "open" },
      { name: "Statistique Canada – loyers, revenus, ménages", url: "https://www.statcan.gc.ca", type: "open" },
      { name: "Données Québec / Données ouvertes Montréal", url: "https://www.donneesquebec.ca", type: "open" },
      { name: "Registre foncier du Québec (payant à l'acte)", url: "https://www.registrefoncier.gouv.qc.ca", type: "paid" },
      { name: "Rôle d'évaluation foncière municipal", url: "https://montreal.ca", type: "open" },
      { name: "Décisions du TAL (jurisprudence, fixations)", url: "https://www.tal.gouv.qc.ca", type: "open" },
      { name: "Hydro-Québec – historique de consommation par adresse", url: "https://www.hydroquebec.com", type: "consent" },
    ],
    guaranteeSchemes: [
      { id: "endosseur", fr: "Endosseur / caution (usage limité au Québec)", en: "Co-signer / guarantor (limited use in Quebec)" },
      { id: "assurance_loyer", fr: "Assurance loyers impayés (offre privée)", en: "Rent default insurance (private offer)" },
    ],
  },
};

export const MARKET_LIST: MarketCode[] = ["FR", "QC"];

export function getMarket(code: MarketCode) {
  return MARKETS[code] || MARKETS.FR;
}
