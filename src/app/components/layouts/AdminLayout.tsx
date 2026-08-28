import { LayoutDashboard, Users, Building2, ShieldCheck, ScrollText, Settings, HardHat, Banknote, Scale, Inbox } from "lucide-react";
import { AppShell } from "@/app/components/common/AppShell";

export function AdminLayout() {
  return (
    <AppShell
      homePath="/admin/dashboard"
      spaceLabelKey="space.admin"
      accent="chart-4"
      navItems={[
        { path: "/admin/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
        { path: "/admin/users", icon: Users, labelKey: "nav.users" },
        { path: "/admin/properties", icon: Building2, labelKey: "nav.properties" },
        { path: "/admin/compliance", icon: ShieldCheck, labelKey: "common.compliance" },
        { path: "/admin/providers", icon: HardHat, labelKey: "nav.providers" },
        { path: "/admin/finance", icon: Banknote, labelKey: "nav.finance" },
        { path: "/admin/legal", icon: Scale, labelKey: "nav.legalAssistant" },
        { path: "/admin/inbox", icon: Inbox, labelKey: "nav.inbox" },
        { path: "/admin/audit", icon: ScrollText, labelKey: "nav.audit" },
        { path: "/admin/settings", icon: Settings, labelKey: "nav.settings" },
      ]}
    />
  );
}
