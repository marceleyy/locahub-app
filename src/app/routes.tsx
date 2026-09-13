import { createBrowserRouter } from "react-router";
import { RootLayout } from "@/app/components/layouts/RootLayout";
import { TenantLayout } from "@/app/components/layouts/TenantLayout";
import { LandlordLayout } from "@/app/components/layouts/LandlordLayout";
import { AgentLayout } from "@/app/components/layouts/AgentLayout";
import { AdminLayout } from "@/app/components/layouts/AdminLayout";
import { ProviderLayout } from "@/app/components/layouts/ProviderLayout";

import { LandingPage } from "@/app/pages/LandingPage";

// Espace locataire
import { TenantFeed } from "@/app/pages/tenant/TenantFeed";
import { TenantProfile } from "@/app/pages/tenant/TenantProfile";
import { TenantApplications } from "@/app/pages/tenant/TenantApplications";
import { TenantPayments } from "@/app/pages/tenant/TenantPayments";
import { TenantLease } from "@/app/pages/tenant/TenantLease";
import { PropertyDetail } from "@/app/pages/tenant/PropertyDetail";
import { TenantMap } from "@/app/pages/tenant/TenantMap";

// Espace propriétaire
import { LandlordDashboard } from "@/app/pages/landlord/LandlordDashboard";
import { LandlordProperties } from "@/app/pages/landlord/LandlordProperties";
import { LandlordTenants } from "@/app/pages/landlord/LandlordTenants";
import { LandlordAnalytics } from "@/app/pages/landlord/LandlordAnalytics";
import { LandlordFinances } from "@/app/pages/landlord/LandlordFinances";

// Espace courtage (mandats, visites, pipeline, commissions)
import { BrokerDashboard } from "@/app/pages/broker/BrokerDashboard";
import { BrokerPortfolio } from "@/app/pages/broker/BrokerPortfolio";
import { BrokerPipeline } from "@/app/pages/broker/BrokerPipeline";
import { BrokerVisits } from "@/app/pages/broker/BrokerVisits";
import { BrokerInventoryLog } from "@/app/pages/broker/BrokerInventoryLog";
import { BrokerCommissions } from "@/app/pages/broker/BrokerCommissions";

// Modules de gestion (espace gestionnaire)
import { ManagerTasks } from "@/app/pages/manager/ManagerTasks";
import { ManagerCalendar } from "@/app/pages/manager/ManagerCalendar";
import { ManagerBuildings } from "@/app/pages/manager/ManagerBuildings";
import { ManagerProviders } from "@/app/pages/manager/ManagerProviders";
import { ManagerFinance } from "@/app/pages/manager/ManagerFinance";
import { ManagerLegal } from "@/app/pages/manager/ManagerLegal";
import { ManagerPublishing } from "@/app/pages/manager/ManagerPublishing";
import { ManagerArrears } from "@/app/pages/manager/ManagerArrears";
import { ManagerRenewals } from "@/app/pages/manager/ManagerRenewals";
import { InventoryFlow } from "@/app/pages/manager/InventoryFlow";

// Espace prestataire
import { ProviderJobs } from "@/app/pages/provider/ProviderJobs";
import { ProviderInvoices } from "@/app/pages/provider/ProviderInvoices";
import { ProviderProfile } from "@/app/pages/provider/ProviderProfile";

// Back-office
import { AdminDashboard } from "@/app/pages/admin/AdminDashboard";
import { AdminUsers } from "@/app/pages/admin/AdminUsers";
import { AdminProperties } from "@/app/pages/admin/AdminProperties";
import { AdminCompliance } from "@/app/pages/admin/AdminCompliance";
import { AdminAudit } from "@/app/pages/admin/AdminAudit";
import { AdminSettings } from "@/app/pages/admin/AdminSettings";

// Écrans partagés
import { Maintenance } from "@/app/pages/shared/Maintenance";
import { MarketAnalysis } from "@/app/pages/shared/MarketAnalysis";
import { InterventionForm } from "@/app/pages/shared/InterventionForm";
import { Inbox } from "@/app/pages/shared/Inbox";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },

      {
        path: "tenant",
        element: <TenantLayout />,
        children: [
          { index: true, element: <TenantFeed /> },
          { path: "feed", element: <TenantFeed /> },
          { path: "profile", element: <TenantProfile /> },
          { path: "applications", element: <TenantApplications /> },
          { path: "payments", element: <TenantPayments /> },
          { path: "lease", element: <TenantLease /> },
          { path: "map", element: <TenantMap /> },
          { path: "maintenance", element: <Maintenance /> },
          { path: "report", element: <InterventionForm /> },
          { path: "inbox", element: <Inbox /> },
          { path: "property/:id", element: <PropertyDetail /> },
        ],
      },

      {
        path: "landlord",
        element: <LandlordLayout />,
        children: [
          { index: true, element: <LandlordDashboard /> },
          { path: "dashboard", element: <LandlordDashboard /> },
          { path: "properties", element: <LandlordProperties /> },
          { path: "tenants", element: <LandlordTenants /> },
          { path: "finances", element: <LandlordFinances /> },
          { path: "analytics", element: <LandlordAnalytics /> },
          { path: "buildings", element: <ManagerBuildings /> },
          { path: "finance", element: <ManagerFinance /> },
          { path: "market", element: <MarketAnalysis /> },
          { path: "maintenance", element: <Maintenance /> },
          { path: "report", element: <InterventionForm /> },
          { path: "legal", element: <ManagerLegal /> },
          { path: "arrears", element: <ManagerArrears /> },
          { path: "renewals", element: <ManagerRenewals /> },
          { path: "inventory", element: <InventoryFlow /> },
          { path: "inbox", element: <Inbox /> },
        ],
      },

      {
        path: "agent",
        element: <AgentLayout />,
        children: [
          { index: true, element: <BrokerDashboard /> },
          { path: "dashboard", element: <BrokerDashboard /> },
          { path: "portfolio", element: <BrokerPortfolio /> },
          { path: "pipeline", element: <BrokerPipeline /> },
          { path: "visits", element: <BrokerVisits /> },
          { path: "inventory-log", element: <BrokerInventoryLog /> },
          { path: "commissions", element: <BrokerCommissions /> },
          { path: "tasks", element: <ManagerTasks /> },
          { path: "calendar", element: <ManagerCalendar /> },
          { path: "buildings", element: <ManagerBuildings /> },
          { path: "providers", element: <ManagerProviders /> },
          { path: "finance", element: <ManagerFinance /> },
          { path: "publishing", element: <ManagerPublishing /> },
          { path: "arrears", element: <ManagerArrears /> },
          { path: "renewals", element: <ManagerRenewals /> },
          { path: "inventory", element: <InventoryFlow /> },
          { path: "inbox", element: <Inbox /> },
          { path: "legal", element: <ManagerLegal /> },
          { path: "maintenance", element: <Maintenance /> },
          { path: "report", element: <InterventionForm /> },
          { path: "market", element: <MarketAnalysis /> },
        ],
      },

      {
        path: "provider",
        element: <ProviderLayout />,
        children: [
          { index: true, element: <ProviderJobs /> },
          { path: "jobs", element: <ProviderJobs /> },
          { path: "invoices", element: <ProviderInvoices /> },
          { path: "profile", element: <ProviderProfile /> },
          { path: "inbox", element: <Inbox /> },
        ],
      },

      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "users", element: <AdminUsers /> },
          { path: "properties", element: <AdminProperties /> },
          { path: "compliance", element: <AdminCompliance /> },
          { path: "providers", element: <ManagerProviders /> },
          { path: "finance", element: <ManagerFinance /> },
          { path: "legal", element: <ManagerLegal /> },
          { path: "arrears", element: <ManagerArrears /> },
          { path: "inbox", element: <Inbox /> },
          { path: "audit", element: <AdminAudit /> },
          { path: "settings", element: <AdminSettings /> },
        ],
      },
    ],
  },
]);
