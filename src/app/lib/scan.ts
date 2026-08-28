/**
 * Numérisation d'une pièce justificative.
 *
 * Rien d'un véritable OCR : aucun modèle n'est chargé, aucun pixel n'est lu.
 * L'analyse porte sur le nom du fichier, son type MIME et sa taille, ce qui
 * suffit à faire vivre le parcours et à cadrer l'interface que consommera un
 * vrai service plus tard.
 *
 * La forme du résultat est celle qu'un service d'extraction renvoie
 * réellement — type reconnu, indice de confiance, champs extraits, verdict —
 * de sorte que le remplacement ne touchera que ce fichier.
 *
 * Règle produit : un document n'est jamais rejeté automatiquement. Il est
 * classé « vérifié » ou « à confirmer », et un humain tranche. C'est la même
 * exigence que sur le score de candidature, pour les mêmes raisons.
 */

export type Loc = "fr" | "en";
interface L { fr: string; en: string }

export type DocKind =
  | "id" | "employment" | "income" | "tax" | "address" | "insurance" | "guarantor" | "other";

export interface ScanField {
  key: string;
  label: L;
  value: string;
}

export interface ScanResult {
  kind: DocKind;
  label: L;
  confidence: number;          // 0–1
  verified: boolean;
  fields: ScanField[];
  warnings: L[];
  /** Taille après ré-encodage, pour montrer le gain à l'utilisateur. */
  bytes: number;
}

/** Motifs de reconnaissance, par ordre de spécificité décroissante. */
const PATTERNS: { kind: DocKind; label: L; keys: RegExp; fields?: (name: string) => ScanField[] }[] = [
  {
    kind: "id",
    label: { fr: "Pièce d'identité", en: "Identity document" },
    keys: /(cni|carte.?identit|passeport|passport|permis|licence|id.?card)/i,
  },
  {
    kind: "income",
    label: { fr: "Justificatif de ressources", en: "Proof of income" },
    keys: /(bulletin|fiche.?paie|salaire|payslip|paystub|releve.?paie|t4|pay.?stub)/i,
    fields: () => [{ key: "period", label: { fr: "Période détectée", en: "Detected period" }, value: "—" }],
  },
  {
    kind: "employment",
    label: { fr: "Justificatif d'activité", en: "Proof of employment" },
    keys: /(contrat|attestation.?emploi|employment|cdi|cdd|embauche)/i,
  },
  {
    kind: "tax",
    label: { fr: "Avis d'imposition", en: "Tax assessment" },
    keys: /(avis.?imposition|impot|tax|revenu.?fiscal|t1|releve.?1)/i,
  },
  {
    kind: "address",
    label: { fr: "Justificatif de domicile", en: "Proof of address" },
    keys: /(facture|domicile|edf|hydro|quittance|electricit|internet|utility|address)/i,
  },
  {
    kind: "insurance",
    label: { fr: "Attestation d'assurance", en: "Insurance certificate" },
    keys: /(assurance|insurance|habitation|mrh|responsabilite)/i,
  },
  {
    kind: "guarantor",
    label: { fr: "Acte de cautionnement", en: "Guarantor deed" },
    keys: /(caution|garant|visale|guarantor|surety|endosseur)/i,
  },
];

const clean = (name: string) => name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ");

/**
 * Analyse un fichier et renvoie un classement.
 * Asynchrone dès maintenant : le jour où un service distant prend le relais,
 * les écrans n'auront rien à changer.
 */
export async function scanDocument(
  file: { name: string; type: string; size: number },
  outputBytes?: number
): Promise<ScanResult> {
  // Latence perceptible mais courte : c'est elle qui rend l'état de chargement crédible
  await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));

  const name = clean(file.name);
  const match = PATTERNS.find((p) => p.keys.test(name));
  const warnings: L[] = [];

  // Un scan lisible pèse rarement moins de 40 Ko : en dessous, c'est probablement
  // une capture d'écran recadrée ou une image trop compressée.
  const bytes = outputBytes ?? file.size;
  if (bytes < 40_000) {
    warnings.push({
      fr: "Image très légère : le document risque d'être illisible à l'impression.",
      en: "Very light image: the document may be unreadable when printed.",
    });
  }
  if (file.type === "application/pdf" && file.size > 5_000_000) {
    warnings.push({
      fr: "PDF volumineux : pensez à le compresser avant envoi.",
      en: "Large PDF: consider compressing it before sending.",
    });
  }

  if (!match) {
    return {
      kind: "other",
      label: { fr: "Document à qualifier", en: "Document to classify" },
      confidence: 0.3,
      verified: false,
      fields: [],
      warnings: [
        ...warnings,
        {
          fr: "Type non reconnu automatiquement. Choisissez la catégorie vous-même : le gestionnaire la verra telle quelle.",
          en: "Type not recognised automatically. Pick the category yourself: the manager will see it as-is.",
        },
      ],
      bytes,
    };
  }

  // La confiance monte avec la longueur du nom exploitable et la taille du fichier
  const confidence = Math.min(0.97, 0.62 + Math.min(name.length, 40) / 160 + (bytes > 120_000 ? 0.12 : 0));
  const verified = confidence >= 0.75 && warnings.length === 0;

  if (!verified && warnings.length === 0) {
    warnings.push({
      fr: "Reconnaissance incertaine : la pièce est enregistrée mais reste à confirmer.",
      en: "Uncertain recognition: the file is saved but still needs confirmation.",
    });
  }

  return {
    kind: match.kind,
    label: match.label,
    confidence,
    verified,
    fields: match.fields?.(name) ?? [],
    warnings,
    bytes,
  };
}

/** Pièces autorisées sur le marché courant, telles que la loi les énumère. */
export function allowedDocuments(market: any, locale: Loc = "fr"): string[] {
  return (market.applicationDocs?.allowed || []).map((d: any) => d[locale] ?? d.fr);
}

/** Pièces qu'un bailleur n'a pas le droit de réclamer. */
export function forbiddenDocuments(market: any, locale: Loc = "fr"): string[] {
  return (market.applicationDocs?.forbidden || []).map((d: any) => d[locale] ?? d.fr);
}
