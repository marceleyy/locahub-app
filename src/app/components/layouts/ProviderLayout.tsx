import { HardHat, ClipboardList, Receipt, MessageSquare } from "lucide-react";
import { AppShell } from "@/app/components/common/AppShell";

export function ProviderLayout() {
  return (
    <AppShell
      homePath="/provider/jobs"
      spaceLabelKey="space.provider"
      accent="success"
      navItems={[
        { path: "/provider/jobs", icon: ClipboardList, labelKey: "nav.jobs" },
        { path: "/provider/invoices", icon: Receipt, labelKey: "nav.invoices" },
        { path: "/provider/profile", icon: HardHat, labelKey: "nav.profile" },
        { path: "/provider/inbox", icon: MessageSquare, labelKey: "nav.inbox" },
      ]}
    />
  );
}
