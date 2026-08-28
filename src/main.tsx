import { createRoot } from "react-dom/client";
import App from "@/app/App.tsx";
import { ErrorBoundary } from "@/app/components/common/ErrorBoundary";
import { registerServiceWorker } from "@/app/lib/registerSW";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary scope="root">
    <App />
  </ErrorBoundary>
);

// Après le premier rendu : l'installation ne doit pas retarder la peinture
registerServiceWorker(() => {
  window.dispatchEvent(new CustomEvent("locahub:update-available"));
});
