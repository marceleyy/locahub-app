import * as React from "react";

/**
 * Media query réactive, sans effet de bord au premier rendu.
 *
 * `useSyncExternalStore` évite le clignotement classique du `useEffect` :
 * la valeur est correcte dès le premier rendu côté client, ce qui compte
 * pour un composant qui choisit entre une modale et un panneau glissant.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query]
  );

  return React.useSyncExternalStore(
    subscribe,
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false
  );
}

/** Seuil aligné sur `md` de Tailwind : en dessous, on est en ergonomie au pouce. */
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");

/** Pointeur grossier : doigt plutôt que souris, indépendamment de la largeur. */
export const useIsTouch = () => useMediaQuery("(pointer: coarse)");

export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
