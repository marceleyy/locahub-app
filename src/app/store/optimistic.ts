/**
 * Mutations optimistes.
 *
 * Le store étant aujourd'hui synchrone sur `localStorage`, cette couche est
 * inerte : la mutation locale s'applique, il n'y a rien à attendre. Elle est
 * écrite maintenant pour que le branchement d'une API réelle ne demande qu'à
 * fournir la fonction `commit`, sans toucher aux écrans.
 *
 * Cycle de vie d'une mutation :
 *
 *   1. l'état local est modifié tout de suite, la vue se met à jour ;
 *   2. si un enregistrement est créé, il reçoit un identifiant temporaire
 *      et le drapeau `_pending` ;
 *   3. `commit()` part en tâche de fond ;
 *   4. succès  → l'identifiant serveur remplace le temporaire ;
 *      échec   → l'état d'avant est restauré et l'erreur remonte à l'appelant.
 *
 * L'instantané est pris avant l'application, jamais après : c'est ce qui rend
 * le retour arrière fiable même si plusieurs mutations s'enchaînent.
 */

export const TEMP_PREFIX = "tmp_";

let counter = 0;

/** Identifiant temporaire, reconnaissable et sans collision avec le serveur. */
export function tempId(prefix = "id") {
  counter += 1;
  return `${TEMP_PREFIX}${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export const isTempId = (id: unknown) => typeof id === "string" && id.startsWith(TEMP_PREFIX);

export interface OptimisticOptions<T> {
  /** Mutation locale, appliquée immédiatement. Doit rester pure. */
  apply: (draft: any) => any;
  /** Appel distant. Absent ⇒ mode local pur, aucun retour arrière possible. */
  commit?: () => Promise<T>;
  /** Réconciliation après succès, typiquement pour substituer l'identifiant. */
  reconcile?: (draft: any, result: T) => any;
  /** Notifié en cas d'échec, après restauration de l'état. */
  onError?: (error: Error) => void;
  /** Notifié en cas de succès. */
  onSuccess?: (result: T) => void;
}

type SetDb = (updater: (prev: any) => any) => void;
type GetDb = () => any;

/**
 * Exécute une mutation optimiste.
 * Renvoie une promesse résolue au résultat distant, ou à `null` en mode local.
 */
export async function optimistic<T>(
  getDb: GetDb,
  setDb: SetDb,
  options: OptimisticOptions<T>
): Promise<T | null> {
  const snapshot = getDb();

  // 1 et 2 : application immédiate
  setDb((prev: any) => options.apply(prev));

  if (!options.commit) return null;

  try {
    // 3 : envoi en tâche de fond
    const result = await options.commit();

    // 4a : réconciliation
    if (options.reconcile) {
      setDb((prev: any) => options.reconcile!(prev, result));
    }
    options.onSuccess?.(result);
    return result;
  } catch (err) {
    // 4b : restauration de l'instantané exact d'avant la mutation
    setDb(() => snapshot);
    const error = err instanceof Error ? err : new Error(String(err));
    options.onError?.(error);
    throw error;
  }
}

/**
 * Remplace un identifiant temporaire par l'identifiant définitif dans une
 * collection, y compris sur les clés étrangères qui le référencent.
 */
export function replaceTempId(collection: any[], tmp: string, real: string, foreignKeys: string[] = []) {
  return collection.map((item: any) => {
    let next = item;
    if (item.id === tmp) next = { ...next, id: real, _pending: false };
    foreignKeys.forEach((key) => {
      if (next[key] === tmp) next = { ...next, [key]: real };
    });
    return next;
  });
}

/** Enregistrements encore en vol : sert à griser une ligne le temps de l'aller-retour. */
export const pendingOf = (collection: any[] = []) => collection.filter((x: any) => x._pending);
