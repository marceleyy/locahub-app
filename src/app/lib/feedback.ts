/**
 * Retour utilisateur unifié : haptique + notification.
 *
 * Une seule porte d'entrée pour tout le produit, afin que « ça a marché » et
 * « ça a échoué » se ressentent pareil partout. Les appels sont défensifs :
 * `navigator.vibrate` n'existe pas sur iOS Safari ni sur desktop, et l'absence
 * de vibreur ne doit jamais casser une action.
 */

import { toast } from "sonner";

/** Motifs de vibration, en millisecondes. */
const PATTERNS = {
  tap: 8,
  success: 15,
  warning: [20, 40, 20],
  error: [40, 60, 40],
} as const;

export type FeedbackKind = keyof typeof PATTERNS;

let vibrationEnabled = true;

/** Permet de couper le vibreur depuis les réglages sans toucher aux appels. */
export function setVibrationEnabled(on: boolean) {
  vibrationEnabled = on;
}

export function vibrate(kind: FeedbackKind = "tap") {
  if (!vibrationEnabled) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  // Certains navigateurs lèvent une exception si l'onglet n'a pas le focus
  try {
    navigator.vibrate(PATTERNS[kind] as number | number[]);
  } catch {
    /* sans effet */
  }
}

interface FeedbackOptions {
  description?: string;
  /** Action de rattrapage, typiquement « Annuler » sur une suppression. */
  action?: { label: string; onClick: () => void };
  duration?: number;
}

export const feedback = {
  success(message: string, options?: FeedbackOptions) {
    vibrate("success");
    return toast.success(message, { duration: 3000, ...options });
  },

  error(message: string, options?: FeedbackOptions) {
    vibrate("error");
    // Plus long : une erreur doit rester lisible le temps de la comprendre
    return toast.error(message, { duration: 6000, ...options });
  },

  warning(message: string, options?: FeedbackOptions) {
    vibrate("warning");
    return toast.warning(message, { duration: 5000, ...options });
  },

  info(message: string, options?: FeedbackOptions) {
    return toast(message, { duration: 3500, ...options });
  },

  /** Simple retour tactile, sans notification : pressions, bascules, sélections. */
  tap() {
    vibrate("tap");
  },

  /** Suit une opération asynchrone du début à la fin. */
  promise<T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: () => { vibrate("success"); return messages.success; },
      error: () => { vibrate("error"); return messages.error; },
    });
  },
};
