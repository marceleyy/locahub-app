import { useState } from "react";
import { MapPin, TrendingUp, Database, Scale, Info, Calculator } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, marketGap } from "@/app/store/AppStore";
import { Page, PageHeader, Card, StatCard, SectionTitle, Badge, Table, Alert, Select, Field, Input, Progress } from "@/app/components/common/ui";

export function MarketAnalysis() {
  const { t, locale, money, m, market, tv } = useI18n();
  const { db } = useStore();

  const cities = db.market[market] || [];
  const [city, setCity] = useState(cities[0]?.city || "");
  const selected = cities.find((c: any) => c.city === city) || cities[0];

  const localProps = db.properties.filter((p: any) => p.market === market && (!city || p.city === city));

  // Simulateur de loyer
  const [area, setArea] = useState("50");
  const [rooms, setRooms] = useState("2");
  const unitRent = selected?.medianRent || 0;
  const estimate = market === "FR"
    ? Math.round(Number(area) * unitRent)
    : Math.round(Number(area) * unitRent);

  const history = [
    { y: "2022", v: unitRent * 0.87 }, { y: "2023", v: unitRent * 0.91 },
    { y: "2024", v: unitRent * 0.95 }, { y: "2025", v: unitRent * 0.98 },
    { y: "2026", v: unitRent },
  ].map((h) => ({ ...h, v: Math.round(h.v * 100) / 100 }));

  return (
    <Page wide>
      <PageHeader
        title={t("market.title")}
        subtitle={market === "FR" ? "🇫🇷 France" : "🇨🇦 Canada – Québec"}
      />

      <div className="mb-5 max-w-xs">
        <Field label={locale === "fr" ? "Ville analysée" : "City analysed"}>
          <Select value={city} onChange={(e: any) => setCity(e.target.value)}
            options={cities.map((c: any) => ({ value: c.city, label: c.city }))} />
        </Field>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={TrendingUp}
          label={`${t("market.medianRent")} / ${market === "FR" ? "m²" : "pi²"}`}
          value={money(selected?.medianRent || 0, { decimals: true })}
          delta={`+${selected?.yoy} %`}
          tone="blue"
        />
        <StatCard icon={Scale} label={t("market.tension")} value={`${selected?.tension}/100`} tone="orange" />
        <StatCard icon={MapPin} label={t("landlord.vacancy")} value={`${selected?.vacancy} %`} tone="green" />
        <StatCard icon={Database} label={locale === "fr" ? "Échantillon" : "Sample"} value={selected?.sample?.toLocaleString()} tone="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <SectionTitle icon={TrendingUp}>
            {locale === "fr" ? "Évolution du loyer médian" : "Median rent trend"}
          </SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="y" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4 }} name={t("market.medianRent")} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon={Calculator}>{t("landlord.optimalRent")}</SectionTitle>
          <Field label={`${t("property.surface")} (${market === "FR" ? "m²" : "pi²"})`}>
            <Input type="number" value={area} onChange={(e: any) => setArea(e.target.value)} />
          </Field>
          <Field label={t("property.rooms")}>
            <Input type="number" value={rooms} onChange={(e: any) => setRooms(e.target.value)} />
          </Field>
          <div className="rounded-xl bg-primary/10 p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">{locale === "fr" ? "Estimation" : "Estimate"}</div>
            <div className="text-3xl font-bold text-primary">{money(estimate)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {money(Math.round(estimate * 0.9))} – {money(Math.round(estimate * 1.12))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {market === "FR"
              ? (locale === "fr"
                ? "En zone d'encadrement, ce montant doit être confronté au loyer de référence majoré fixé par arrêté préfectoral."
                : "In rent-controlled areas, this figure must be checked against the increased reference rent set by prefectural order.")
              : (locale === "fr"
                ? "Un loyer très supérieur à celui de la section G expose à une demande de fixation devant le TAL."
                : "A rent well above the Section G figure exposes you to a rent-setting application before the TAL.")}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <SectionTitle icon={MapPin}>{t("market.comparables")}</SectionTitle>
        <Table
          columns={[t("nav.properties"), t("property.surface"), t("property.rent"), t("property.priceGap"), t("landlord.vacancyRisk")]}
          rows={localProps.map((p: any) => {
            const gap = marketGap(p);
            return [
              <div className="leading-tight">
                <div className="font-medium text-sm">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.district}</div>
              </div>,
              <span className="text-sm">{p.area} {market === "FR" ? "m²" : "pi²"}</span>,
              <span className="text-sm font-semibold">{money(p.rent)}</span>,
              <Badge tone={gap > 5 ? "red" : gap < -5 ? "green" : "neutral"}>{gap > 0 ? "+" : ""}{gap} %</Badge>,
              <div className="w-28"><Progress value={p.vacancyRisk} tone={p.vacancyRisk > 30 ? "red" : "green"} height={6} /></div>,
            ];
          })}
          empty={t("common.empty")}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle icon={Scale}>{t("market.legalCap")}</SectionTitle>
          <p className="text-sm text-muted-foreground mb-3">{tv(m.rentControl.note)}</p>
          {m.rentControl.cities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {m.rentControl.cities.map((c: string) => (
                <Badge key={c} tone={c === city ? "orange" : "neutral"}>{c}</Badge>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={Database}>{t("market.sources")}</SectionTitle>
          <ul className="space-y-2 text-sm">
            {m.dataSources.map((s: any) => (
              <li key={s.name} className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{s.name}</span>
                <Badge tone={s.type === "open" ? "green" : s.type === "paid" ? "orange" : "blue"}>
                  {s.type === "open" ? (locale === "fr" ? "Ouvert" : "Open") : s.type === "paid" ? (locale === "fr" ? "Payant" : "Paid") : (locale === "fr" ? "Consentement" : "Consent")}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4">
        <Alert tone="blue" icon={Info}>
          {locale === "fr"
            ? "Les estimations reposent sur des données agrégées et anonymisées. Elles ne doivent jamais être présentées comme une valeur certifiée ni servir seules à justifier une hausse de loyer : la méthode de calcul et la taille de l'échantillon doivent rester consultables par l'utilisateur."
            : "Estimates rely on aggregated, anonymised data. They must never be presented as a certified value nor be the sole justification for a rent increase: the calculation method and sample size must remain visible to the user."}
        </Alert>
      </div>
    </Page>
  );
}
