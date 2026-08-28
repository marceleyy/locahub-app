import * as React from "react";
import { CloudOff, RefreshCw, AlertTriangle } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { feedback } from "@/app/lib/feedback";
import {
  autoFlush, subscribeOutbox, getOutbox, retryFailed, withMedia, type QueuedOp,
} from "@/app/lib/syncQueue";
import { getBlob, markSynced, deleteMedia, pruneSynced } from "@/app/lib/mediaDB";
import { useOnlineStatus } from "@/app/components/common/ui";

/**
 * Voyant de synchronisation.
 *
 * Discret tant que la file est vide, visible dès qu'une écriture attend.
 * L'agent doit pouvoir savoir, d'un coup d'œil, si son état des lieux est
 * parti — c'est la seule chose qu'il ne peut pas vérifier autrement.
 */
export function SyncIndicator() {
  const { t } = useI18n();
  const online = useOnlineStatus();
  const [state, setState] = React.useState(getOutbox());

  React.useEffect(() => subscribeOutbox(setState), []);

  React.useEffect(() => {
    /**
     * Gestionnaire d'envoi.
     *
     * `withMedia` récupère le blob dans IndexedDB avant l'appel et ne purge
     * qu'après confirmation. Aucun serveur n'étant branché, la fonction se
     * contente d'une latence proportionnelle au poids — assez pour que le
     * voyant vive réellement pendant l'envoi d'une photo.
     */
    const handler = withMedia(
      { getBlob, markSynced, deleteMedia },
      async (op: QueuedOp, blob: Blob | null) => {
        const weight = blob ? Math.min(1200, 150 + blob.size / 20_000) : 120;
        await new Promise((resolve) => setTimeout(resolve, weight));
      }
    );
    const stop = autoFlush(handler);
    // Filet de sécurité : les médias transmis et oubliés finissent par partir
    void pruneSynced(7);
    return stop;
  }, []);

  const pending = state.pending.length;
  const failed = state.failed.length;
  if (!pending && !failed) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 md:bottom-4 md:left-4 md:translate-x-0"
    >
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-md">
        {failed > 0 ? (
          <>
            <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
            <span className="text-xs tabular-nums">{t("sync.failed", { n: String(failed) })}</span>
            <button
              onClick={() => { retryFailed(); feedback.tap(); }}
              className="h-8 rounded-full px-2.5 text-xs font-medium text-primary hover:bg-accent"
            >
              {t("common.retry")}
            </button>
          </>
        ) : online ? (
          <>
            <RefreshCw className="size-4 animate-spin text-primary" aria-hidden="true" />
            <span className="text-xs tabular-nums">{t("sync.sending", { n: String(pending) })}</span>
          </>
        ) : (
          <>
            <CloudOff className="size-4 text-warning" aria-hidden="true" />
            <span className="text-xs tabular-nums">{t("sync.queued", { n: String(pending) })}</span>
          </>
        )}
      </div>
    </div>
  );
}
