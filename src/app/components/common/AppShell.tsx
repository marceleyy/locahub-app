import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Bell, Menu, Globe, ChevronDown, LogOut, ShieldCheck, X } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { feedback } from "@/app/lib/feedback";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { useStore } from "@/app/store/AppStore";
import { Avatar } from "@/app/components/common/ui";
import { ErrorBoundary } from "@/app/components/common/ErrorBoundary";

export type NavItem = { path: string; icon: any; labelKey: string };

/** Sélecteur de langue + marché, partagé par tous les espaces. */
export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, market, setMarket, locales, markets, m, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
        aria-label="language and market"
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        {!compact && <span className="font-medium">{m.flag} {locale.toUpperCase()}</span>}
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 bg-card rounded-xl border border-border shadow-lg z-50 p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("common.language")}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); setOpen(false); }}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition ${locale === l.code ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("common.market")}</p>
            <div className="space-y-1.5">
              {markets.map((code) => (
                <button
                  key={code}
                  onClick={() => { setMarket(code); setOpen(false); }}
                  className={`w-full px-3 py-2 rounded-lg text-sm text-left transition ${market === code ? "bg-secondary text-secondary-foreground" : "hover:bg-accent"}`}
                >
                  {code === "FR" ? "🇫🇷" : "🇨🇦"} {code === "FR" ? "France" : "Canada – Québec"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Sélecteur de rôle : permet de naviguer entre les 4 espaces (démo). */
export function SpaceSwitcher() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { setCurrentUserId, usersByRole } = useStore();
  const [open, setOpen] = useState(false);

  const spaces = [
    { key: "tenant", path: "/tenant/feed", label: t("space.tenant") },
    { key: "landlord", path: "/landlord/dashboard", label: t("space.landlord") },
    { key: "agent", path: "/agent/dashboard", label: t("space.agent") },
    { key: "admin", path: "/admin/dashboard", label: t("space.admin") },
  ];

  const go = (s: any) => {
    const user = usersByRole(s.key)[0];
    if (user) setCurrentUserId(user.id);
    setOpen(false);
    navigate(s.path);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="px-2.5 py-2 rounded-lg hover:bg-accent transition-colors" aria-label="switch space">
        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-card rounded-xl border border-border shadow-lg z-50 p-2">
            {spaces.map((s) => (
              <button key={s.key} onClick={() => go(s)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent transition">
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type ShellProps = {
  navItems: NavItem[];
  homePath: string;
  spaceLabelKey: string;
  accent?: "primary" | "secondary" | "chart-4" | "success";
  mobileNavCount?: number;
};

/** Accent de l'espace → classes de fond. Un seul accent par espace. */
const ACCENT_SOLID: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  "chart-4": "bg-chart-4 text-background",
  success: "bg-success text-success-foreground",
};

export function AppShell({ navItems, homePath, spaceLabelKey, accent = "primary", mobileNavCount = 5 }: ShellProps) {
  const location = useLocation();
  const { t } = useI18n();
  const { currentUser } = useStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  // Les entrées au-delà du seuil passent dans le tiroir « Plus » plutôt que
  // d'être perdues : la barre reste lisible sans amputer la navigation.
  const primaryItems = navItems.slice(0, mobileNavCount - 1);
  const overflowItems = navItems.slice(mobileNavCount - 1);
  const overflowActive = overflowItems.some((i) => isActive(i.path));

  return (
    <div className="min-h-dvh bg-muted/40">
      {/* ---------------------------------------------- Barre latérale (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card md:flex">
        <Link to={homePath} className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
          <div className="grid size-9 place-items-center rounded-xl bg-primary">
            <span className="text-sm font-bold text-primary-foreground">LH</span>
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-bold">{t("app.name")}</div>
            <div className="truncate text-[11px] text-muted-foreground">{t(spaceLabelKey)}</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label={t(spaceLabelKey)}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                  active ? ACCENT_SOLID[accent] : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          <Link
            to="/"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-accent"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>{t("nav.logout")}</span>
          </Link>
        </div>
      </aside>

      <div className="md:pl-60">
        {/* -------------------------------------------- En-tête */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4">
            <Link to={homePath} className="flex shrink-0 items-center gap-2 md:hidden">
              <div className="grid size-9 place-items-center rounded-xl bg-primary">
                <span className="text-sm font-bold text-primary-foreground">LH</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold">{t("app.name")}</div>
                <div className="text-[11px] text-muted-foreground">{t(spaceLabelKey)}</div>
              </div>
            </Link>

            <div className="hidden min-w-0 md:block">
              <h2 className="truncate text-sm font-medium text-muted-foreground">
                {t(navItems.find((i) => isActive(i.path))?.labelKey || spaceLabelKey)}
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <LocaleSwitcher />
              <SpaceSwitcher />
              <button className="relative size-11 rounded-lg hover:bg-accent" aria-label={t("nav.notifications")}>
                <Bell className="mx-auto size-4 text-muted-foreground" aria-hidden="true" />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-secondary" />
              </button>
              {currentUser && <Avatar user={currentUser} size={32} />}
            </div>
          </div>
        </header>

        {/* Réserve la hauteur de la barre d'onglets pour ne rien masquer en bas de page */}
        {/* La navigation survit au plantage d'un écran : la barrière est ici,
            à l'intérieur de la coquille, et non autour d'elle. */}
        <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <ErrorBoundary scope={spaceLabelKey} key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* ---------------------------------------------- Barre d'onglets (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label={t("nav.primary")}
      >
        <div className="flex h-[4.5rem] items-stretch">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => feedback.tap()}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 px-1 transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
              >
                {active && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />}
                <Icon className={`size-6 ${active ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                <span className={`text-[10px] leading-tight text-center ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}

          {overflowItems.length > 0 && (
            <button
              onClick={() => { feedback.tap(); setMoreOpen(true); }}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 px-1 transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
              aria-label={t("nav.more")}
            >
              {overflowActive && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />}
              <Menu className={`size-6 ${overflowActive ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              <span className={`text-[10px] leading-tight ${overflowActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {t("nav.more")}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Tiroir des entrées secondaires, fermable au pouce */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="max-h-[80dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{t("nav.more")}</DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-3 gap-2 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {overflowItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { feedback.tap(); setMoreOpen(false); }}
                  className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100 ${
                    active ? "border-transparent bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  <Icon className="size-6" aria-hidden="true" />
                  <span className="text-xs leading-tight">{t(item.labelKey)}</span>
                </Link>
              );
            })}
            <Link
              to="/"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border p-3 text-center text-muted-foreground"
            >
              <LogOut className="size-6" aria-hidden="true" />
              <span className="text-xs leading-tight">{t("nav.logout")}</span>
            </Link>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
