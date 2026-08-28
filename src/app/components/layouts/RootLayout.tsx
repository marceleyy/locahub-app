import { useEffect } from "react";
import { Outlet } from "react-router";
import { Toaster } from "@/app/components/ui/sonner";
import { OfflineBanner } from "@/app/components/common/ui";
import { SyncIndicator } from "@/app/components/common/SyncIndicator";
import { useI18n } from "@/app/i18n/I18nProvider";
import { feedback } from "@/app/lib/feedback";
import { applyUpdate } from "@/app/lib/registerSW";

export function RootLayout() {
  const { t } = useI18n();

  // Le service worker signale une version prête : on propose, on n'impose pas.
  // Recharger sous les doigts de quelqu'un qui remplit un état des lieux
  // serait la pire façon de livrer une amélioration.
  useEffect(() => {
    const onUpdate = () =>
      feedback.info(t("update.available"), {
        duration: Infinity,
        action: { label: t("update.apply"), onClick: applyUpdate },
      });
    window.addEventListener("locahub:update-available", onUpdate);
    return () => window.removeEventListener("locahub:update-available", onUpdate);
  }, [t]);

  return (
    <div className="min-h-dvh bg-background">
      <OfflineBanner label={t("offline.title")} description={t("offline.body")} />
      <Outlet />
      <SyncIndicator />

      {/*
        Notifications en bas de l'écran, à portée du pouce. L'offset dégage
        la barre d'onglets pour ne pas masquer la navigation.
      */}
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        offset={16}
        mobileOffset={{ bottom: "5.5rem" }}
        toastOptions={{ className: "rounded-xl text-sm" }}
      />
    </div>
  );
}
