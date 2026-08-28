import { createRoot } from "react-dom/client";
import App from "@/app/App";
import { ErrorBoundary } from "@/app/components/common/ErrorBoundary";
import { registerServiceWorker } from "@/app/lib/registerSW";
import "./styles/index.css";

/**
 * Amorçage.
 *
 * Le `try/catch` couvre ce que l'ErrorBoundary ne peut pas couvrir : une
 * exception levée pendant l'évaluation des modules ou au tout premier rendu,
 * quand aucun composant React n'existe encore pour l'intercepter.
 *
 * Sans lui, la moindre erreur à ce stade donne une page blanche muette —
 * impossible à diagnostiquer à distance.
 */
const container = document.getElementById("root");

if (!container) {
  // Ne devrait pas arriver : index.html porte toujours #root
  document.body.innerHTML =
    '<p style="font-family:system-ui;padding:2rem">Élément #root introuvable dans index.html.</p>';
} else {
  try {
    createRoot(container).render(
      <ErrorBoundary scope="root">
        <App />
      </ErrorBoundary>
    );
  } catch (error) {
    // L'écran de secours d'index.html écoute cet événement
    window.dispatchEvent(new ErrorEvent("error", { error, message: String(error) }));
    throw error;
  }
}

// Après le premier rendu : l'installation ne doit pas retarder la peinture
registerServiceWorker(() => {
  window.dispatchEvent(new CustomEvent("locahub:update-available"));
});
