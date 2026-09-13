import { LayoutDashboard, Briefcase, UserPlus, CalendarClock, ClipboardCheck, Percent, MapPin, ListChecks, Building2, HardHat, Banknote, Scale, Megaphone, AlertTriangle, RefreshCw, Inbox, ClipboardList } from "lucide-react";
import { AppShell } from "@/app/components/common/AppShell";

export function AgentLayout() {
  return (
    <AppShell
      homePath="/agent/dashboard"
      spaceLabelKey="space.agent"
      accent="secondary"
      navItems={[
        { path: "/agent/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
        { path: "/agent/tasks", icon: ListChecks, labelKey: "nav.tasks" },
        { path: "/agent/calendar", icon: CalendarClock, labelKey: "nav.calendar" },
        { path: "/agent/inventory", icon: ClipboardCheck, labelKey: "nav.inventory" },
        { path: "/agent/inventory-log", icon: ClipboardList, labelKey: "nav.inventoryLog" },
        { path: "/agent/buildings", icon: Building2, labelKey: "nav.buildings" },
        { path: "/agent/portfolio", icon: Briefcase, labelKey: "nav.portfolio" },
        { path: "/agent/pipeline", icon: UserPlus, labelKey: "nav.pipeline" },
        { path: "/agent/visits", icon: CalendarClock, labelKey: "nav.visits" },
        { path: "/agent/providers", icon: HardHat, labelKey: "nav.providers" },
        { path: "/agent/finance", icon: Banknote, labelKey: "nav.finance" },
        { path: "/agent/publishing", icon: Megaphone, labelKey: "nav.publishing" },
        { path: "/agent/commissions", icon: Percent, labelKey: "nav.commissions" },
        { path: "/agent/arrears", icon: AlertTriangle, labelKey: "nav.arrears" },
        { path: "/agent/renewals", icon: RefreshCw, labelKey: "nav.renewals" },
        { path: "/agent/inbox", icon: Inbox, labelKey: "nav.inbox" },
        { path: "/agent/legal", icon: Scale, labelKey: "nav.legalAssistant" },
        { path: "/agent/market", icon: MapPin, labelKey: "nav.market" },
      ]}
    />
  );
}
