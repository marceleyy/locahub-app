import { useState } from "react";
import { Briefcase, MapPin, Zap, TrendingUp, ShieldAlert, Users } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck, marketGap } from "@/app/store/AppStore";
import { getMarket } from "@/app/config/markets";
import { Page, PageHeader, Card, Badge, Tabs, Button, Modal, Alert, Progress, EmptyState } from "@/app/components/common/ui";

const STATUS_TONE: Record<string, string> = {
  available: "green", occupied: "blue", notice_given: "amber", offline: "neutral",
};

export function AgentPortfolio() {
  const { t, locale, money, date, tv } = useI18n();
  const { db, currentUser, getUser } = useStore();
  const [tab, setTab] = useState("all");
  const [detail, setDetail] = useState<any>(null);

  const agent = currentUser?.role === "agent" ? currentUser : db.users.find((u: any) => u.role === "agent");
  const all = db.properties.filter((p: any) => p.agentId === agent?.id);
  const list = tab === "all" ? all : all.filter((p: any) => p.status === tab);

  const statusLabel = (s: string) => {
    const map: Record<string, { fr: string; en: string }> = {
      available: { fr: "Disponible", en: "Available" },
      occupied: { fr: "Loué", en: "Let" },
      notice_given: { fr: "Préavis reçu", en: "Notice given" },
      offline: { fr: "Hors ligne", en: "Offline" },
    };
    return tv(map[s] || { fr: s, en: s });
  };

  return (
    <Page wide>
      <PageHeader
        title={t("nav.portfolio")}
        subtitle={`${all.length} ${t("agent.mandates").toLowerCase()} · ${money(all.reduce((a: number, p: any) => a + p.rent, 0))} / ${t("common.month")}`}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "all", label: t("common.all") },
          { id: "available", label: statusLabel("available") },
          { id: "occupied", label: statusLabel("occupied") },
          { id: "notice_given", label: statusLabel("notice_given") },
        ]}
      />

      {list.length === 0 ? (
        <Card><EmptyState label={t("common.empty")} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p: any) => {
            const issues = complianceCheck(p, getMarket(p.market));
            const gap = marketGap(p);
            const owner = getUser(p.ownerId);
            return (
              <Card key={p.id} padded={false} className="overflow-hidden flex flex-col">
                <div className="relative h-40 bg-muted">
                  {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge tone={STATUS_TONE[p.status]}>{statusLabel(p.status)}</Badge>
                    {issues.length > 0 && (
                      <Badge tone={issues.some((i: any) => i.level === "blocking") ? "red" : "amber"}>
                        <ShieldAlert className="w-3 h-3" /> {issues.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" /> {p.city} · {p.district}
                  </p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold">{money(p.rent)}</span>
                    <span className={`text-xs font-medium ${gap > 0 ? "text-destructive" : "text-success"}`}>
                      {gap > 0 ? "+" : ""}{gap}% / {t("market.medianRent").toLowerCase()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                    <span>{t("landlord.vacancyRisk")}</span>
                    <span className="font-medium">{p.vacancyRisk}%</span>
                  </div>
                  <Progress value={p.vacancyRisk} tone={p.vacancyRisk > 30 ? "red" : "green"} height={5} />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 mb-3">
                    <Zap className="w-3 h-3" /> {p.energy?.grade}
                    <span>·</span>
                    <Users className="w-3 h-3" /> {owner ? `${owner.firstName} ${owner.lastName}` : "—"}
                  </div>
                  <div className="mt-auto">
                    <Button size="sm" variant="outline" onClick={() => setDetail(p)} className="w-full">{t("common.details")}</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title || ""}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">{t("property.rent")}</span><div className="font-semibold">{money(detail.rent)}</div></div>
              <div><span className="text-muted-foreground">{t("property.charges")}</span><div className="font-semibold">{money(detail.charges || 0)}</div></div>
              <div><span className="text-muted-foreground">{t("property.surface")}</span><div className="font-semibold">{detail.area} {detail.market === "FR" ? "m²" : "pi²"}</div></div>
              <div><span className="text-muted-foreground">{t("property.availableFrom")}</span><div className="font-semibold">{date(detail.availableFrom)}</div></div>
              <div><span className="text-muted-foreground">{t("property.energy")}</span><div className="font-semibold">{detail.energy?.grade}</div></div>
              <div><span className="text-muted-foreground">{t("property.previousRent")}</span><div className="font-semibold">{detail.legal?.previousRent ? money(detail.legal.previousRent) : "—"}</div></div>
            </div>

            {complianceCheck(detail, getMarket(detail.market)).map((i: any, idx: number) => (
              <Alert key={idx} tone={i.level === "blocking" ? "red" : "orange"} icon={ShieldAlert}>{tv(i)}</Alert>
            ))}

            <div>
              <p className="text-sm font-semibold mb-2">{t("market.comparables")}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-3 rounded-xl bg-muted/60">
                  <div className="text-xs text-muted-foreground">P25</div>
                  <div className="font-semibold">{money(detail.marketP25 || 0)}</div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <div className="text-xs text-muted-foreground">{locale === "fr" ? "Médiane" : "Median"}</div>
                  <div className="font-semibold">{money(detail.marketMedian || 0)}</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/60">
                  <div className="text-xs text-muted-foreground">P75</div>
                  <div className="font-semibold">{money(detail.marketP75 || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
