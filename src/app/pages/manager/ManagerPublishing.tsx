import { useMemo, useState } from "react";
import { Megaphone, Eye, Users, CheckCircle2, XCircle, AlertTriangle, Send } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore, complianceCheck } from "@/app/store/AppStore";
import { feedback } from "@/app/lib/feedback";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, StatCard,
  Alert, EmptyState, Select,
} from "@/app/components/common/ui";

export function ManagerPublishing() {
  const { t, tv, money, date, market, m, locale } = useI18n();
  const store = useStore();

  const properties = store.db.properties.filter((p: any) => p.market === market);
  const [selectedId, setSelectedId] = useState(() => properties.find((p: any) => p.status !== "occupied")?.id || properties[0]?.id || "");

  const property = properties.find((p: any) => p.id === selectedId);
  const portals = store.db.portals.filter((x: any) => x.market === market);
  const listings = property ? store.listingsOfProperty(property.id) : [];

  const issues = property ? complianceCheck(property, m) : [];
  const blocking = issues.filter((i: any) => i.level === "blocking");

  const stats = useMemo(() => {
    const all = store.db.listings.filter((l: any) => {
      const p = store.getProperty(l.propertyId);
      return p?.market === market;
    });
    return {
      published: all.filter((l: any) => l.status === "published").length,
      views: all.reduce((a: number, l: any) => a + l.views, 0),
      leads: all.reduce((a: number, l: any) => a + l.leads, 0),
      cost: all
        .filter((l: any) => l.status === "published")
        .reduce((a: number, l: any) => a + (portals.find((p: any) => p.id === l.portalId)?.cost || 0), 0),
    };
  }, [store.db.listings, market, portals, store]);

  return (
    <Page wide>
      <PageHeader title={t("nav.publishing")} subtitle={t("publishing.subtitle")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Megaphone} label={t("publishing.active")} value={<span className="tabular-nums">{stats.published}</span>} tone="orange" />
        <StatCard icon={Eye} label={t("publishing.views")} value={<span className="tabular-nums">{stats.views.toLocaleString(locale === "fr" ? "fr-FR" : "en-CA")}</span>} tone="blue" />
        <StatCard icon={Users} label={t("publishing.leads")} value={<span className="tabular-nums">{stats.leads}</span>} tone="green" />
        <StatCard
          icon={Send}
          label={t("publishing.cost")}
          value={<span className="tabular-nums">{money(stats.cost)}</span>}
          tone="violet"
          hint={stats.leads ? `${money(stats.cost / stats.leads)} ${t("publishing.perLead")}` : undefined}
        />
      </div>

      {properties.length === 0 ? (
        <EmptyState label={t("publishing.empty")} />
      ) : (
        <>
          <Card className="mb-5">
            <SectionTitle icon={Megaphone}>{t("publishing.choose")}</SectionTitle>
            <Select
              aria-label={t("publishing.choose")}
              value={selectedId}
              onChange={(e: any) => setSelectedId(e.target.value)}
              options={properties.map((p: any) => ({ value: p.id, label: `${p.title} — ${p.city}` }))}
            />
          </Card>

          {property && (
            <>
              {blocking.length > 0 && (
                <Alert tone="red" icon={AlertTriangle} title={t("publishing.blockedTitle")}>
                  {blocking.map((i: any) => tv(i)).join(" · ")} — {t("publishing.blockedHint")}
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-4 mt-5">
                {portals.map((portal: any) => {
                  const listing = listings.find((l: any) => l.portalId === portal.id);
                  const published = listing?.status === "published";
                  return (
                    <Card key={portal.id}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold">{portal.name}</h3>
                          <p className="text-xs text-muted-foreground text-pretty">{tv(portal.audience)}</p>
                        </div>
                        {published
                          ? <Badge strong tone="green"><CheckCircle2 className="size-3" />{t("publishing.published")}</Badge>
                          : <Badge tone="neutral"><XCircle className="size-3" />{t("publishing.offline")}</Badge>}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
                        <span className="tabular-nums">{portal.cost === 0 ? t("publishing.free") : `${money(portal.cost)} / ${portal.unit}`}</span>
                        {listing && published && (
                          <>
                            <span className="tabular-nums">{listing.views} {t("publishing.viewsShort")}</span>
                            <span className="tabular-nums">{listing.leads} {t("publishing.leadsShort")}</span>
                            <span className="tabular-nums">{t("publishing.since")} {date(listing.publishedAt)}</span>
                          </>
                        )}
                      </div>

                      {published ? (
                        <Button variant="outline" className="w-full" onClick={() => { store.unpublishListing(property.id, portal.id); feedback.info(t("toast.listingWithdrawn", { portal: portal.name })); }}>
                          {t("publishing.withdraw")}
                        </Button>
                      ) : (
                        <Button
                          variant="accent"
                          className="w-full"
                          disabled={blocking.length > 0}
                          onClick={() => { store.publishListing(property.id, portal.id); feedback.success(t("toast.listingPublished", { portal: portal.name })); }}
                        >
                          {t("publishing.publish")}
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>

              <Card className="mt-5">
                <SectionTitle icon={AlertTriangle}>{t("publishing.legalTitle")}</SectionTitle>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(market === "FR"
                    ? [t("publishing.legalFR1"), t("publishing.legalFR2"), t("publishing.legalFR3")]
                    : [t("publishing.legalQC1"), t("publishing.legalQC2"), t("publishing.legalQC3")]
                  ).map((line, i) => (
                    <li key={i} className="flex gap-2 text-pretty"><span className="text-secondary">•</span>{line}</li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </>
      )}
    </Page>
  );
}
