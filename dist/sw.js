/*
 * Service worker LocaHub — écrit à la main, sans dépendance de build.
 *
 * Trois stratégies, choisies par nature de requête :
 *
 *   1. Navigations (HTML)      → réseau d'abord, repli sur le shell en cache.
 *      L'application s'ouvre en mode avion, avec ses données locales.
 *
 *   2. Ressources du build     → stale-while-revalidate.
 *      Affichage immédiat depuis le cache, mise à jour en tâche de fond.
 *      Vite produit des noms hachés : servir une version périmée une fois
 *      n'a aucune conséquence, la suivante sera à jour.
 *
 *   3. Appels de données (/api) → réseau seul, jamais mis en cache.
 *      Un loyer, un impayé ou un statut de bail périmé est pire que pas de
 *      donnée du tout. On échoue franchement, l'interface bascule hors ligne.
 */

const VERSION = "v4";
const SHELL_CACHE = `locahub-shell-${VERSION}`;
const ASSET_CACHE = `locahub-assets-${VERSION}`;
const SHELL_URL = "/index.html";

/** Minimum vital pour peindre le squelette hors ligne. */
const PRECACHE = ["/", SHELL_URL, "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // `reload` court-circuite le cache HTTP : on veut la version fraîche à l'installation
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[sw] pré-cache partiel", err))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("locahub-") && k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      );
      // Reprend la main sur les onglets déjà ouverts
      await self.clients.claim();
    })()
  );
});

/** Le client peut forcer l'activation d'une version en attente. */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isAsset = (url) =>
  url.pathname.startsWith("/assets/") ||
  /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico)$/i.test(url.pathname);

const isData = (url) =>
  url.pathname.startsWith("/api/") || url.pathname.startsWith("/graphql");

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Les requêtes d'un autre domaine restent la responsabilité du navigateur
  if (url.origin !== self.location.origin) return;

  // 3. Données : jamais de cache, jamais de valeur périmée
  if (isData(url)) return;

  // 1. Navigation : réseau d'abord, repli sur le shell
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put(SHELL_URL, fresh.clone());
          return fresh;
        } catch {
          const cached = (await caches.match(SHELL_URL)) || (await caches.match("/"));
          return cached || new Response("", { status: 503, statusText: "Offline" });
        }
      })()
    );
    return;
  }

  // 2. Ressources du build : stale-while-revalidate
  if (isAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(request);

        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        // Rendu immédiat si on a une copie, revalidation en tâche de fond
        if (cached) {
          event.waitUntil(network);
          return cached;
        }

        const fresh = await network;
        return fresh || new Response("", { status: 503, statusText: "Offline" });
      })()
    );
  }
});
