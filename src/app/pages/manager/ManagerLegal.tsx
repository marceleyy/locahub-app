import { useMemo, useState } from "react";
import { Scale, Search, ExternalLink, Info, ShieldAlert } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { searchLegal, LEGAL_KB } from "@/app/lib/assist";
import { Page, PageHeader, Card, Badge, Input, Alert, EmptyState } from "@/app/components/common/ui";

export function ManagerLegal() {
  const { t, locale, market, m, tv } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const results = useMemo(() => searchLegal(query, market, locale), [query, market, locale]);

  const suggestions = LEGAL_KB.filter((a) => a.market === market || a.market === "BOTH").slice(0, 4);

  return (
    <Page>
      <PageHeader
        title={t("nav.legalAssistant")}
        subtitle={t("legalAI.subtitle", { market: m.name[locale] || m.name.fr })}
      />

      <Alert tone="amber" icon={ShieldAlert} title={t("legalAI.disclaimerTitle")}>
        {t("legalAI.disclaimer")}
      </Alert>

      <div className="relative my-5">
        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e: any) => setQuery(e.target.value)}
          placeholder={t("legalAI.placeholder")}
          className="pl-10 py-3"
          aria-label={t("legalAI.placeholder")}
        />
      </div>

      {!query && (
        <div className="flex flex-wrap gap-2 mb-6">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setQuery(s.question[locale] || s.question.fr)}
              className="px-3 py-1.5 rounded-full text-xs border border-border hover:bg-accent transition text-left"
            >
              {s.question[locale] || s.question.fr}
            </button>
          ))}
        </div>
      )}

      {results.length === 0 ? (
        <EmptyState label={t("legalAI.noResult")} />
      ) : (
        <div className="space-y-3">
          {results.map((a, i) => {
            const isOpen = open === i;
            return (
              <Card key={i} padded={false}>
                <button
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Scale className="size-4 text-primary shrink-0 mt-0.5" />
                    <span className="font-medium text-sm text-balance">{a.question[locale] || a.question.fr}</span>
                  </div>
                  <Badge tone={a.market === "FR" ? "blue" : a.market === "QC" ? "violet" : "neutral"}>
                    {a.market === "BOTH" ? t("legalAI.both") : a.market}
                  </Badge>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                    <p className="text-sm text-pretty leading-relaxed">{a.answer[locale] || a.answer.fr}</p>

                    <div className="flex items-start gap-2 p-3 rounded-xl bg-warning-subtle text-sm">
                      <Info className="size-4 text-warning shrink-0 mt-0.5" />
                      <span className="text-warning text-pretty">{a.caution[locale] || a.caution.fr}</span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">{t("legalAI.sources")}</div>
                      <ul className="space-y-1.5">
                        {a.sources.map((s, k) => (
                          <li key={k}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                              {s.label} <ExternalLink className="size-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-8 text-pretty">{t("legalAI.footer")}</p>
    </Page>
  );
}
