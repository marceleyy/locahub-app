import { Home, FileText, CreditCard, FileCheck, User, MessageSquare, Wrench, MapPin, AlertCircle } from "lucide-react";
import { AppShell } from "@/app/components/common/AppShell";

export function TenantLayout() {
  return (
    <AppShell
      homePath="/tenant/feed"
      spaceLabelKey="space.tenant"
      accent="primary"
      navItems={[
        { path: "/tenant/feed", icon: Home, labelKey: "nav.feed" },
        { path: "/tenant/map", icon: MapPin, labelKey: "nav.map" },
        { path: "/tenant/applications", icon: FileText, labelKey: "nav.applications" },
        { path: "/tenant/lease", icon: FileCheck, labelKey: "nav.lease" },
        { path: "/tenant/payments", icon: CreditCard, labelKey: "nav.payments" },
        { path: "/tenant/report", icon: AlertCircle, labelKey: "nav.intervention" },
        { path: "/tenant/maintenance", icon: Wrench, labelKey: "nav.maintenance" },
        { path: "/tenant/messages", icon: MessageSquare, labelKey: "nav.messages" },
        { path: "/tenant/profile", icon: User, labelKey: "nav.profile" },
      ]}
    />
  );
}
