import { Link } from "react-router";
import { Home, Building2, Briefcase, ShieldCheck, ArrowRight, Sparkles, History, Scale, CreditCard, MessageSquare, BarChart3, Zap, Globe, HardHat } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { LocaleSwitcher } from "@/app/components/common/AppShell";
import { Badge, Button, Card, toneSoft } from "@/app/components/common/ui";

export function LandingPage() {
  const { t, locale, m } = useI18n();

  const spaces = [
    { to: "/tenant/feed", icon: Home, title: t("space.tenant"), desc: t("landing.tenant.desc"), tone: "blue" as const },
    { to: "/landlord/dashboard", icon: Building2, title: t("space.landlord"), desc: t("landing.landlord.desc"), tone: "green" as const },
    { to: "/agent/dashboard", icon: Briefcase, title: t("space.agent"), desc: t("landing.agent.desc"), tone: "orange" as const },
    { to: "/admin/dashboard", icon: ShieldCheck, title: t("space.admin"), desc: t("landing.admin.desc"), tone: "neutral" as const },
    {
      to: "/provider/jobs",
      icon: HardHat,
      tone: "green" as const,
      title: t("space.provider"),
      desc: t("landing.provider.desc"),
    },
  ];

  const features = [
    {
      icon: History,
      title: { fr: "Transparence du loyer précédent", en: "Previous rent transparency" },
      desc: {
        fr: "Section G au Québec, encadrement des loyers en France : le locataire voit ce que payait l'occupant précédent, le bailleur reste conforme.",
        en: "Section G in Quebec, rent control in France: tenants see what the previous occupant paid, landlords stay compliant.",
      },
    },
    {
      icon: Scale,
      title: { fr: "Conformité intégrée par marché", en: "Built-in compliance per market" },
      desc: {
        fr: "Dépôt de garantie, diagnostics, plafonds de loyer, pièces interdites au dossier : les règles sont vérifiées avant publication.",
        en: "Deposits, mandatory reports, rent caps, forbidden application documents: rules are checked before publishing.",
      },
    },
    {
      icon: BarChart3,
      title: { fr: "Données de marché réelles", en: "Real market data" },
      desc: {
        fr: "Loyer médian, tension locative, comparables et prédiction de vacance à partir de sources ouvertes (DVF, ANIL, SCHL, TAL).",
        en: "Median rent, market tension, comparables and vacancy prediction from open sources (DVF, ANIL, CMHC, TAL).",
      },
    },
    {
      icon: Sparkles,
      title: { fr: "Matching explicable", en: "Explainable matching" },
      desc: {
        fr: "Un score de compatibilité dont chaque facteur est affiché, jamais une décision automatique de refus.",
        en: "A match score where every factor is visible, never an automated refusal.",
      },
    },
    {
      icon: CreditCard,
      title: { fr: "Paiement, quittances, comptabilité", en: "Payments, receipts, accounting" },
      desc: {
        fr: "Loyer prélevé, quittance générée, charges régularisées, rapport financier exportable pour la déclaration.",
        en: "Rent collected, receipt issued, charges reconciled, exportable financial report for tax filing.",
      },
    },
    {
      icon: MessageSquare,
      title: { fr: "Traçabilité des échanges", en: "Traceable communication" },
      desc: {
        fr: "Signalements, réparations et préavis horodatés et exportables — utiles en cas de litige devant le TAL ou la commission de conciliation.",
        en: "Reports, repairs and notices time-stamped and exportable — useful in disputes before the TAL or conciliation board.",
      },
    },
  ];

  return (
    <div className="min-h-dvh bg-card">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LH</span>
            </div>
            <span className="font-bold text-lg">{t("app.name")}</span>
          </div>
          <LocaleSwitcher />
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <Badge tone="orange" className="mb-5">
          <Globe className="w-3 h-3" /> {locale === "fr" ? "France + Canada" : "France + Canada"} · {m.flag} {m.currency}
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
          {t("landing.hero.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("landing.hero.subtitle")}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/tenant/feed"><Button size="lg" variant="accent" icon={ArrowRight}>{t("landing.hero.cta")}</Button></Link>
          <Link to="/admin/dashboard"><Button size="lg" variant="outline" icon={ShieldCheck}>{t("space.admin")}</Button></Link>
        </div>
        <p className="text-xs text-muted-foreground mt-5">{t("landing.demoBanner")}</p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          {t("landing.chooseSpace")}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {spaces.map((s) => (
            <Link key={s.to} to={s.to} className="group">
              <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className={`grid size-11 place-items-center rounded-xl mb-4 ${toneSoft(s.tone)}`}>
                  <s.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
                <span className={`text-sm font-medium flex items-center gap-1.5 group-hover:gap-2.5 transition-all ${toneSoft(s.tone).split(" ").pop()}`}>
                  {t("common.view")} <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-muted border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">{t("landing.features")}</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto text-sm">
            {locale === "fr"
              ? "Les cinq manques identifiés chez la concurrence, traités un par un."
              : "The five gaps identified in competing products, addressed one by one."}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <Card key={i}>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-sm">{f.title[locale] || f.title.fr}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc[locale] || f.desc.fr}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 py-10 text-center text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5" /> {t("app.name")} — {t("app.tagline")}
        </p>
        <p>{t("common.legalNotice")}</p>
      </footer>
    </div>
  );
}
