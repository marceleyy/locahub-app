/**
 * Enregistrement du service worker.
 *
 * Appelé après le premier rendu : l'installation ne doit jamais retarder
 * la peinture initiale. Silencieux en développement, où le rechargement à
 * chaud de Vite et un worker qui met en cache font mauvais ménage.
 */

export function registerServiceWorker(onUpdate?: () => void) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // Une version est prête et un ancien worker contrôle encore la page
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            onUpdate?.();
          }
        });
      });
    } catch (err) {
      console.warn("[LocaHub] service worker non enregistré", err);
    }
  });
}

/** Active la version en attente et recharge, une seule fois. */
export function applyUpdate() {
  navigator.serviceWorker.getRegistration().then((registration) => {
    registration?.waiting?.postMessage("SKIP_WAITING");
  });
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}
