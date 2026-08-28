import * as React from "react";

/**
 * Stockage des médias lourds.
 *
 * `localStorage` est synchrone et plafonné à 5 Mo : une seule photo de
 * téléphone le sature. IndexedDB est asynchrone, accepte les Blob tels quels et
 * dispose de centaines de mégaoctets. On y déporte donc les octets, et le store
 * applicatif ne garde qu'un identifiant.
 *
 * Écrit à la main, sans dépendance : l'API IndexedDB est verbeuse mais stable,
 * et une bibliothèque de plus pour trois opérations ne se justifie pas.
 *
 * Règle de séparation :
 *   - IndexedDB porte les octets et leurs métadonnées techniques ;
 *   - `AppStore` porte le `fileId` et le sens métier ;
 *   - la file de synchronisation fait le lien entre les deux.
 */

const DB_NAME = "locahub-media";
const DB_VERSION = 1;
const STORE = "files";

export interface MediaMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  /** Rattachement métier : état des lieux, dossier locataire, fil de messagerie. */
  scope?: string;
  ownerId?: string;
  synced: boolean;
}

export interface MediaRecord extends MediaMeta {
  blob: Blob;
}

export const isMediaSupported = () => typeof indexedDB !== "undefined";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!isMediaSupported()) {
      reject(new Error("IndexedDB indisponible"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("scope", "scope", { unique: false });
        store.createIndex("ownerId", "ownerId", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Une autre version veut s'installer : on libère la connexion
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    request.onerror = () => reject(request.error || new Error("Ouverture IndexedDB refusée"));
  });

  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
        tx.onabort = () => reject(tx.error || new Error("Transaction interrompue"));
      })
  );
}

/** Identifiant stable, avec repli sur les navigateurs sans `randomUUID`. */
export function newFileId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Écrit un blob et retourne son identifiant. */
export async function putMedia(
  blob: Blob,
  meta: { name: string; scope?: string; ownerId?: string } = { name: "fichier" }
): Promise<MediaMeta> {
  const record: MediaRecord = {
    id: newFileId(),
    name: meta.name,
    type: blob.type || "application/octet-stream",
    size: blob.size,
    createdAt: new Date().toISOString(),
    scope: meta.scope,
    ownerId: meta.ownerId,
    synced: false,
    blob,
  };
  await run("readwrite", (store) => store.put(record) as IDBRequest<any>);
  const { blob: _omit, ...metaOnly } = record;
  return metaOnly;
}

export async function getMedia(id: string): Promise<MediaRecord | null> {
  try {
    const record = await run<MediaRecord | undefined>("readonly", (store) => store.get(id));
    return record ?? null;
  } catch {
    return null;
  }
}

export async function getBlob(id: string): Promise<Blob | null> {
  const record = await getMedia(id);
  return record?.blob ?? null;
}

export async function deleteMedia(id: string): Promise<void> {
  try {
    await run("readwrite", (store) => store.delete(id) as IDBRequest<any>);
  } catch {
    // La suppression d'un média déjà absent n'est pas une erreur métier
  }
}

/** Marque un média comme transmis. Les octets restent jusqu'à la purge. */
export async function markSynced(id: string): Promise<void> {
  const record = await getMedia(id);
  if (!record) return;
  await run("readwrite", (store) => store.put({ ...record, synced: true }) as IDBRequest<any>);
}

export async function listMedia(scope?: string): Promise<MediaMeta[]> {
  try {
    const all = await run<MediaRecord[]>("readonly", (store) => store.getAll());
    return all
      .filter((r) => !scope || r.scope === scope)
      .map(({ blob: _omit, ...meta }) => meta);
  } catch {
    return [];
  }
}

/**
 * Purge les médias transmis et plus anciens qu'un seuil.
 * Un média synchronisé n'a plus à occuper l'appareil : le serveur fait foi.
 */
export async function pruneSynced(olderThanDays = 7): Promise<number> {
  const cutoff = Date.now() - olderThanDays * 86_400_000;
  const all = await listMedia();
  const stale = all.filter((m) => m.synced && new Date(m.createdAt).getTime() < cutoff);
  await Promise.all(stale.map((m) => deleteMedia(m.id)));
  return stale.length;
}

/** Occupation disque, quand le navigateur veut bien la donner. */
export async function estimateUsage(): Promise<{ usedBytes: number; quotaBytes: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usedBytes: usage, quotaBytes: quota };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Pont entre IndexedDB (asynchrone) et React (synchrone)              */
/* ------------------------------------------------------------------ */

/**
 * Résout un `fileId` en URL objet affichable, et la révoque au démontage.
 *
 * C'est le point délicat de tout le dispositif. Un `URL.createObjectURL()`
 * réserve de la mémoire jusqu'à sa révocation explicite : une liste de photos
 * qui en crée sans en révoquer fait gonfler l'onglet jusqu'au plantage.
 *
 * Le garde `cancelled` évite l'écriture d'état après démontage — le cas
 * classique d'un agent qui change de pièce pendant la lecture du blob.
 */
export function useMediaUrl(fileId: string | null | undefined): { url: string | null; loading: boolean } {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(!!fileId);

  React.useEffect(() => {
    if (!fileId) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);

    getBlob(fileId)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) { setUrl(null); return; }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  return { url, loading };
}

/** Vignette autonome : gère son propre cycle de vie, sans effet côté parent. */
export function MediaThumb({
  fileId, alt = "", className, fallback,
}: { fileId: string; alt?: string; className?: string; fallback?: React.ReactNode }) {
  const { url, loading } = useMediaUrl(fileId);

  if (loading) return <span className={className} aria-busy="true" />;
  if (!url) return <>{fallback ?? null}</>;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
