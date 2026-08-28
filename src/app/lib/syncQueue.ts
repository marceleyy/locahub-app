/**
 * File d'attente des écritures différées.
 *
 * Le service worker met en cache l'application ; il ne met pas en cache les
 * écritures. Un agent qui remplit un état des lieux dans un sous-sol produit
 * des dizaines de mutations qui doivent survivre à la coupure, à la fermeture
 * de l'onglet et au redémarrage du téléphone.
 *
 * D'où une file persistée dans `localStorage`, indépendante du store :
 *
 *   - `enqueue()` empile une opération et rend la main immédiatement ;
 *   - `flush()` rejoue la file dans l'ordre, en s'arrêtant au premier échec ;
 *   - l'ordre FIFO est préservé, parce qu'une opération peut dépendre de la
 *     précédente — verrouiller un rapport avant d'avoir envoyé ses pièces
 *     n'aurait aucun sens.
 *
 * Une opération qui échoue de façon répétée est mise de côté plutôt que de
 * bloquer la file indéfiniment : mieux vaut une entrée signalée à l'agent
 * qu'un bouchon silencieux.
 */

const STORAGE_KEY = "locahub.outbox.v1";
const MAX_ATTEMPTS = 5;

export interface QueuedOp {
  id: string;
  kind: string;
  payload: any;
  createdAt: string;
  attempts: number;
  lastError?: string;
  /** Horodatage avant lequel il est inutile de retenter. */
  nextTryAt?: number;
  /**
   * Média rattaché, stocké dans IndexedDB.
   * La file ne transporte jamais les octets : elle transporte la référence et
   * va chercher le blob au moment de l'envoi. Une file sérialisée en JSON dans
   * `localStorage` ne pourrait de toute façon pas contenir un Blob.
   */
  fileId?: string;
}

type Listener = (state: OutboxState) => void;

export interface OutboxState {
  pending: QueuedOp[];
  failed: QueuedOp[];
  flushing: boolean;
}

let state: OutboxState = { pending: [], failed: [], flushing: false };
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pending: state.pending, failed: state.failed }));
  } catch {
    // Quota saturé : on préfère perdre la persistance que planter la saisie
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l(state));
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = { pending: parsed.pending || [], failed: parsed.failed || [], flushing: false };
  } catch {
    state = { pending: [], failed: [], flushing: false };
  }
}
restore();

let counter = 0;
const opId = () => `op_${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Empile une opération. Retourne son identifiant, utile pour la suivre. */
export function enqueue(kind: string, payload: any, fileId?: string): string {
  const op: QueuedOp = {
    id: opId(),
    kind,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    fileId,
  };
  state = { ...state, pending: [...state.pending, op] };
  emit();
  return op.id;
}

export const getOutbox = () => state;

export function subscribeOutbox(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Attente exponentielle plafonnée : 2 s, 4 s, 8 s, 16 s, 30 s. */
const backoff = (attempts: number) => Math.min(30_000, 2_000 * 2 ** attempts);

export type OpHandler = (op: QueuedOp) => Promise<void>;

export interface MediaBridge {
  getBlob: (fileId: string) => Promise<Blob | null>;
  markSynced: (fileId: string) => Promise<void>;
  deleteMedia: (fileId: string) => Promise<void>;
}

/**
 * Enveloppe un gestionnaire pour qu'il reçoive le blob avec l'opération.
 *
 * Séquence volontairement stricte :
 *   1. lecture du blob dans IndexedDB ;
 *   2. envoi ;
 *   3. marquage puis purge — jamais avant la confirmation.
 *
 * Un média absent n'est pas une erreur bloquante : il a pu être purgé après
 * un premier envoi réussi dont l'accusé s'est perdu. On laisse alors passer
 * l'opération plutôt que de boucher la file pour toujours.
 */
export function withMedia(
  media: MediaBridge,
  handler: (op: QueuedOp, blob: Blob | null) => Promise<void>,
  { purgeAfterSync = true }: { purgeAfterSync?: boolean } = {}
): OpHandler {
  return async (op: QueuedOp) => {
    let blob: Blob | null = null;
    if (op.fileId) blob = await media.getBlob(op.fileId);

    await handler(op, blob);

    if (op.fileId && blob) {
      await media.markSynced(op.fileId);
      if (purgeAfterSync) await media.deleteMedia(op.fileId);
    }
  };
}

/**
 * Rejoue la file. S'arrête au premier échec pour préserver l'ordre.
 * Sans réseau, la fonction sort immédiatement — inutile d'épuiser les tentatives
 * quand on sait d'avance qu'elles échoueront.
 */
export async function flush(handler: OpHandler): Promise<{ sent: number; remaining: number }> {
  if (state.flushing) return { sent: 0, remaining: state.pending.length };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { sent: 0, remaining: state.pending.length };
  }

  state = { ...state, flushing: true };
  emit();

  let sent = 0;
  const now = Date.now();

  try {
    while (state.pending.length) {
      const op = state.pending[0];
      if (op.nextTryAt && op.nextTryAt > now) break;

      try {
        await handler(op);
        state = { ...state, pending: state.pending.slice(1) };
        sent += 1;
        emit();
      } catch (err) {
        const attempts = op.attempts + 1;
        const message = err instanceof Error ? err.message : String(err);

        if (attempts >= MAX_ATTEMPTS) {
          // Mise de côté : la file repart, l'agent est averti
          state = {
            ...state,
            pending: state.pending.slice(1),
            failed: [...state.failed, { ...op, attempts, lastError: message }],
          };
          emit();
          continue;
        }

        state = {
          ...state,
          pending: [{ ...op, attempts, lastError: message, nextTryAt: Date.now() + backoff(attempts) }, ...state.pending.slice(1)],
        };
        emit();
        break;
      }
    }
  } finally {
    state = { ...state, flushing: false };
    emit();
  }

  return { sent, remaining: state.pending.length };
}

/** Remet les opérations écartées en tête de file, sur action explicite. */
export function retryFailed() {
  state = {
    ...state,
    pending: [...state.failed.map((op) => ({ ...op, attempts: 0, nextTryAt: undefined })), ...state.pending],
    failed: [],
  };
  emit();
}

export function clearFailed() {
  state = { ...state, failed: [] };
  emit();
}

/** Vide entièrement la file. Réservé à la réinitialisation de démonstration. */
export function clearOutbox() {
  state = { pending: [], failed: [], flushing: false };
  emit();
}

/**
 * Relance automatique au retour du réseau.
 * Retourne la fonction de désabonnement.
 */
export function autoFlush(handler: OpHandler, intervalMs = 15_000) {
  if (typeof window === "undefined") return () => {};

  const run = () => { void flush(handler); };
  window.addEventListener("online", run);
  const timer = window.setInterval(run, intervalMs);
  run();

  return () => {
    window.removeEventListener("online", run);
    window.clearInterval(timer);
  };
}
