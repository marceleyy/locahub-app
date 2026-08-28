import { LayoutDashboard, Building2, Users, Wallet, TrendingUp, Wrench, MessageSquare, MapPin, Layers, Scale, AlertTriangle, RefreshCw, Inbox, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/app/components/common/AppShell";

export function LandlordLayout() {
  return (
    <AppShell
      homePath="/landlord/dashboard"
      spaceLabelKey="space.landlord"
      accent="primary"
      navItems={[
        { path: "/landlord/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
        { path: "/landlord/properties", icon: Building2, labelKey: "nav.properties" },
        { path: "/landlord/buildings", icon: Layers, labelKey: "nav.buildings" },
        { path: "/landlord/tenants", icon: Users, labelKey: "nav.tenants" },
        { path: "/landlord/finances", icon: Wallet, labelKey: "nav.finances" },
        { path: "/landlord/finance", icon: Wallet, labelKey: "nav.finance" },
        { path: "/landlord/analytics", icon: TrendingUp, labelKey: "nav.analytics" },
        { path: "/landlord/inventory", icon: ClipboardCheck, labelKey: "nav.inventory" },
        { path: "/landlord/arrears", icon: AlertTriangle, labelKey: "nav.arrears" },
        { path: "/landlord/renewals", icon: RefreshCw, labelKey: "nav.renewals" },
        { path: "/landlord/inbox", icon: Inbox, labelKey: "nav.inbox" },
        { path: "/landlord/legal", icon: Scale, labelKey: "nav.legalAssistant" },
        { path: "/landlord/market", icon: MapPin, labelKey: "nav.market" },
        { path: "/landlord/maintenance", icon: Wrench, labelKey: "nav.maintenance" },
        { path: "/landlord/messages", icon: MessageSquare, labelKey: "nav.messages" },
      ]}
    />
  );
}
