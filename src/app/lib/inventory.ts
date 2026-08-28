/**
 * Modèle d'état des lieux.
 *
 * Le parcours est conçu pour se faire au pouce, dans un logement vide, souvent
 * mal éclairé et sans réseau. Chaque élément se règle par une pression sur une
 * pilule ; le clavier n'apparaît que si l'agent signale une dégradation, et
 * même là, la dictée est proposée en premier.
 *
 * Les règles juridiques restent dans `config/markets.ts` ; ce fichier ne porte
 * que la structure du relevé et le barème d'état.
 */

export type Loc = "fr" | "en";
export interface L { fr: string; en: string }

/** Barème à quatre crans. Au-delà, l'agent hésite et le relevé perd en fiabilité. */
export type Condition = "new" | "good" | "worn" | "damaged";

export const CONDITIONS: { value: Condition; label: L; tone: "green" | "blue" | "amber" | "red"; weight: number }[] = [
  { value: "new", label: { fr: "Neuf", en: "New" }, tone: "green", weight: 0 },
  { value: "good", label: { fr: "Bon", en: "Good" }, tone: "blue", weight: 0 },
  { value: "worn", label: { fr: "Usage", en: "Worn" }, tone: "amber", weight: 0.5 },
  { value: "damaged", label: { fr: "Dégradé", en: "Damaged" }, tone: "red", weight: 1 },
];

export const conditionMeta = (value: Condition) => CONDITIONS.find((c) => c.value === value) || CONDITIONS[1];

export interface InspectionItem {
  id: string;
  label: L;
  condition: Condition | null;
  note?: string;
  photos?: { id: string; name: string }[];
}

export interface InspectionRoom {
  id: string;
  label: L;
  items: InspectionItem[];
}

/** Éléments communs à toutes les pièces : ils cadrent l'essentiel des litiges. */
const COMMON: { id: string; label: L }[] = [
  { id: "walls", label: { fr: "Murs et cloisons", en: "Walls and partitions" } },
  { id: "floor", label: { fr: "Sol et plinthes", en: "Floor and skirting" } },
  { id: "ceiling", label: { fr: "Plafond", en: "Ceiling" } },
  { id: "window", label: { fr: "Fenêtres et volets", en: "Windows and shutters" } },
  { id: "door", label: { fr: "Porte et serrure", en: "Door and lock" } },
  { id: "electrical", label: { fr: "Prises et interrupteurs", en: "Sockets and switches" } },
  { id: "heating", label: { fr: "Chauffage", en: "Heating" } },
];

const KITCHEN: { id: string; label: L }[] = [
  { id: "worktop", label: { fr: "Plan de travail", en: "Worktop" } },
  { id: "sink", label: { fr: "Évier et robinetterie", en: "Sink and taps" } },
  { id: "units", label: { fr: "Meubles et rangements", en: "Units and storage" } },
  { id: "appliances", label: { fr: "Appareils fournis", en: "Supplied appliances" } },
  { id: "hood", label: { fr: "Hotte et ventilation", en: "Hood and ventilation" } },
];

const BATHROOM: { id: string; label: L }[] = [
  { id: "shower", label: { fr: "Douche ou baignoire", en: "Shower or bath" } },
  { id: "basin", label: { fr: "Lavabo et robinetterie", en: "Basin and taps" } },
  { id: "toilet", label: { fr: "WC", en: "Toilet" } },
  { id: "sealant", label: { fr: "Joints et étanchéité", en: "Sealant and waterproofing" } },
  { id: "ventilation", label: { fr: "Ventilation", en: "Ventilation" } },
];

/** Compteurs et clés : relevés une fois pour le logement entier. */
const HANDOVER: { id: string; label: L }[] = [
  { id: "keys", label: { fr: "Clés remises", en: "Keys handed over" } },
  { id: "meter_elec", label: { fr: "Compteur électricité", en: "Electricity meter" } },
  { id: "meter_water", label: { fr: "Compteur eau", en: "Water meter" } },
  { id: "meter_gas", label: { fr: "Compteur gaz", en: "Gas meter" } },
  { id: "smoke", label: { fr: "Détecteur de fumée", en: "Smoke detector" } },
];

interface RoomTemplate { id: string; label: L; extra?: { id: string; label: L }[] }

const BASE_ROOMS: RoomTemplate[] = [
  { id: "entrance", label: { fr: "Entrée", en: "Entrance" } },
  { id: "living", label: { fr: "Séjour", en: "Living room" } },
  { id: "kitchen", label: { fr: "Cuisine", en: "Kitchen" }, extra: KITCHEN },
  { id: "bathroom", label: { fr: "Salle de bains", en: "Bathroom" }, extra: BATHROOM },
];

/** Pièces propres à chaque marché : un plex québécois n'a pas la même trame qu'un T3 parisien. */
const MARKET_ROOMS: Record<string, RoomTemplate[]> = {
  FR: [
    { id: "wc", label: { fr: "WC séparés", en: "Separate toilet" } },
    { id: "balcony", label: { fr: "Balcon ou terrasse", en: "Balcony or terrace" } },
    { id: "cellar", label: { fr: "Cave ou annexe", en: "Cellar or annexe" } },
  ],
  QC: [
    { id: "basement", label: { fr: "Sous-sol", en: "Basement" } },
    { id: "laundry", label: { fr: "Salle de lavage", en: "Laundry room" } },
    { id: "storage", label: { fr: "Rangement ou cabanon", en: "Storage or shed" } },
    { id: "balcony", label: { fr: "Balcon et escalier extérieur", en: "Balcony and outdoor stairs" } },
  ],
};

const item = (id: string, label: L): InspectionItem => ({ id, label, condition: null });

/**
 * Construit la trame d'un relevé.
 * Le nombre de chambres vient de la fiche du logement : l'agent ne saisit rien.
 */
export function buildInspection(property: any, marketCode: string): InspectionRoom[] {
  const bedrooms = Math.max(0, (property?.rooms ?? 2) - 1);

  const bedroomRooms: RoomTemplate[] = Array.from({ length: bedrooms }, (_, i) => ({
    id: `bedroom_${i + 1}`,
    label: { fr: `Chambre ${i + 1}`, en: `Bedroom ${i + 1}` },
  }));

  const templates = [
    ...BASE_ROOMS.slice(0, 2),
    ...bedroomRooms,
    ...BASE_ROOMS.slice(2),
    ...(MARKET_ROOMS[marketCode] || []),
  ];

  const rooms: InspectionRoom[] = templates.map((tpl) => ({
    id: tpl.id,
    label: tpl.label,
    items: [...COMMON, ...(tpl.extra || [])].map((x) => item(`${tpl.id}_${x.id}`, x.label)),
  }));

  rooms.push({
    id: "handover",
    label: { fr: "Compteurs et clés", en: "Meters and keys" },
    items: HANDOVER.map((x) => item(`handover_${x.id}`, x.label)),
  });

  return rooms;
}

export interface InspectionSummary {
  total: number;
  rated: number;
  damaged: number;
  worn: number;
  photos: number;
  notes: number;
  progress: number;
  /** Éléments dégradés sans justification : ce sont eux qui font perdre un litige. */
  unjustified: InspectionItem[];
}

export function summarise(rooms: InspectionRoom[]): InspectionSummary {
  const items = rooms.flatMap((r) => r.items);
  const rated = items.filter((i) => i.condition);
  const damaged = items.filter((i) => i.condition === "damaged");

  return {
    total: items.length,
    rated: rated.length,
    damaged: damaged.length,
    worn: items.filter((i) => i.condition === "worn").length,
    photos: items.reduce((a, i) => a + (i.photos?.length || 0), 0),
    notes: items.filter((i) => i.note?.trim()).length,
    progress: items.length ? Math.round((rated.length / items.length) * 100) : 0,
    unjustified: damaged.filter((i) => !i.note?.trim() && !(i.photos?.length)),
  };
}

/** Rappel juridique affiché au verrouillage, propre à chaque marché. */
export function lockNotice(marketCode: string): L {
  if (marketCode === "QC") {
    return {
      fr: "L'état des lieux n'est pas obligatoire au Québec, mais il fait foi en cas de litige devant le Tribunal administratif du logement. Sans lui, le logement est présumé rendu dans l'état où il a été loué.",
      en: "A condition report is not mandatory in Quebec, but it is decisive before the Administrative Housing Tribunal. Without one, the unit is presumed returned as it was let.",
    };
  }
  return {
    fr: "L'état des lieux doit être contradictoire, établi en présence des deux parties et joint au bail. À défaut, le logement est présumé avoir été reçu en bon état, et aucune retenue ne pourra être opérée sur le dépôt de garantie.",
    en: "The inventory must be contradictory, drawn up with both parties present and attached to the lease. Failing that, the unit is presumed received in good condition and no deduction can be made from the deposit.",
  };
}
