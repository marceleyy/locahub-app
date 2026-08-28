/**
 * Couche de transport des envois sortants.
 *
 * Aucun fournisseur n'est branché : `deliver()` ne fait aujourd'hui que
 * vérifier les préconditions et simuler la latence. Ce n'est pas une coquille
 * vide pour autant — les échecs qu'elle produit sont réels et se produiront
 * en production pour exactement les mêmes raisons : adresse manquante,
 * numéro non mobile, adresse postale incomplète, pièce jointe trop lourde.
 *
 * C'est ce qui permet de tester le retour arrière optimiste dès maintenant,
 * plutôt que de découvrir le chemin d'erreur le jour du branchement.
 */

export type Channel = "email" | "sms" | "postal" | "registered";

export class DeliveryError extends Error {
  code: string;
  channel: Channel;
  constructor(code: string, channel: Channel, message: string) {
    super(message);
    this.name = "DeliveryError";
    this.code = code;
    this.channel = channel;
  }
}

export interface Recipient {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface DeliveryRequest {
  channel: Channel;
  to: Recipient;
  subject?: string;
  body: string;
  attachments?: { name: string; size: number }[];
  /** Force un échec, pour éprouver le retour arrière en démonstration. */
  simulateFailure?: boolean;
}

export interface DeliveryReceipt {
  id: string;
  channel: Channel;
  sentAt: string;
  /** Numéro de suivi d'un envoi recommandé, absent sur les autres canaux. */
  trackingId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Mobiles français (06/07) et nord-américains, seuls capables de recevoir un SMS. */
const MOBILE_RE = /^(?:\+33\s?[67]|0[67]|\+1)[\d\s.-]{6,}$/;

const MAX_ATTACHMENT_MB = 10;

/** Vérifie qu'un envoi est possible. Retourne le motif de blocage, ou `null`. */
export function checkDeliverable(channel: Channel, to: Recipient, attachments: { size: number }[] = []): string | null {
  if (channel === "email") {
    if (!to.email) return "missing_email";
    if (!EMAIL_RE.test(to.email)) return "invalid_email";
  }
  if (channel === "sms") {
    if (!to.phone) return "missing_phone";
    if (!MOBILE_RE.test(to.phone.replace(/\s/g, ""))) return "not_mobile";
    if (attachments.length) return "sms_no_attachment";
  }
  if (channel === "postal" || channel === "registered") {
    if (!to.address || to.address.trim().length < 10) return "missing_address";
  }
  const total = attachments.reduce((a, x) => a + x.size, 0);
  if (total > MAX_ATTACHMENT_MB * 1_000_000) return "attachment_too_large";
  return null;
}

const MESSAGES: Record<string, { fr: string; en: string }> = {
  missing_email: { fr: "Aucune adresse courriel enregistrée pour ce destinataire.", en: "No email address on file for this recipient." },
  invalid_email: { fr: "L'adresse courriel enregistrée est invalide.", en: "The email address on file is invalid." },
  missing_phone: { fr: "Aucun numéro de téléphone enregistré.", en: "No phone number on file." },
  not_mobile: { fr: "Le numéro enregistré n'est pas un mobile : le SMS ne peut pas aboutir.", en: "The number on file is not a mobile: SMS cannot be delivered." },
  sms_no_attachment: { fr: "Un SMS ne peut pas transporter de pièce jointe.", en: "An SMS cannot carry an attachment." },
  missing_address: { fr: "Adresse postale incomplète : l'envoi ne peut pas partir.", en: "Incomplete postal address: the letter cannot be sent." },
  attachment_too_large: { fr: "Pièces jointes trop volumineuses (10 Mo maximum).", en: "Attachments too large (10 MB maximum)." },
  network: { fr: "L'envoi a échoué. Vérifiez votre connexion et réessayez.", en: "Sending failed. Check your connection and try again." },
};

export const deliveryMessage = (code: string, locale: "fr" | "en" = "fr") =>
  MESSAGES[code]?.[locale] ?? MESSAGES.network[locale];

/**
 * Envoie effectivement.
 * En production, remplacer le corps par l'appel au fournisseur — la signature
 * et les erreurs levées ne changent pas, les écrans non plus.
 */
export async function deliver(request: DeliveryRequest): Promise<DeliveryReceipt> {
  const blocked = checkDeliverable(request.channel, request.to, request.attachments);
  if (blocked) throw new DeliveryError(blocked, request.channel, deliveryMessage(blocked));

  // Latence simulée : c'est pendant ce laps de temps que l'interface optimiste
  // affiche déjà l'envoi comme parti.
  await new Promise((resolve) => setTimeout(resolve, 450));

  if (request.simulateFailure) {
    throw new DeliveryError("network", request.channel, deliveryMessage("network"));
  }

  const id = `dl_${Date.now().toString(36)}`;
  return {
    id,
    channel: request.channel,
    sentAt: new Date().toISOString(),
    trackingId: request.channel === "registered" ? `LRAR-${id.slice(-8).toUpperCase()}` : undefined,
  };
}
