import { useState } from "react";
import { Send, Lock, MessageSquare } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { Page, PageHeader, Card, Avatar, Badge, Alert, EmptyState } from "@/app/components/common/ui";

export function Messages() {
  const { t, locale, tv, date } = useI18n();
  const { db, getUser, getProperty, sendMessage, currentUserId } = useStore();
  const [activeId, setActiveId] = useState(db.conversations[0]?.id || "");
  const [draft, setDraft] = useState("");

  const active = db.conversations.find((c: any) => c.id === activeId);

  const submit = () => {
    if (!draft.trim() || !active) return;
    sendMessage(active.id, { fr: draft, en: draft });
    setDraft("");
  };

  return (
    <Page wide>
      <PageHeader title={t("messages.title")} subtitle={t("messages.legalHold")} />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card padded={false} className="overflow-hidden">
          <div className="p-4 border-b border-border font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            {db.conversations.length} {locale === "fr" ? "conversations" : "conversations"}
          </div>
          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
            {db.conversations.map((c: any) => {
              const other = getUser(c.participants.find((p: string) => p !== currentUserId) || c.participants[0]);
              const prop = getProperty(c.propertyId);
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-4 flex gap-3 transition-colors ${activeId === c.id ? "bg-accent" : "hover:bg-accent/50"}`}
                >
                  {other && <Avatar user={other} size={38} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{other ? `${other.firstName} ${other.lastName}` : "—"}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{last?.at.slice(5, 10).split("-").reverse().join("/")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{tv(c.subject)} · {prop?.city}</div>
                    <div className="text-xs text-muted-foreground/80 truncate mt-0.5">{tv(last?.body)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card padded={false} className="lg:col-span-2 flex flex-col overflow-hidden">
          {!active ? (
            <EmptyState label={t("common.empty")} />
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{tv(active.subject)}</div>
                  <div className="text-xs text-muted-foreground">{getProperty(active.propertyId)?.title}</div>
                </div>
                <Badge tone="blue"><Lock className="w-3 h-3" />{locale === "fr" ? "Archivé" : "Archived"}</Badge>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[46vh] bg-muted/30">
                {active.messages.map((msg: any) => {
                  const mine = msg.from === currentUserId;
                  const author = getUser(msg.from);
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                      {author && <Avatar user={author} size={30} />}
                      <div className={`max-w-[75%] ${mine ? "items-end" : ""}`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                          {tv(msg.body)}
                        </div>
                        <div className={`text-[11px] text-muted-foreground mt-1 ${mine ? "text-right" : ""}`}>
                          {date(msg.at)} · {msg.at.slice(11, 16)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-border flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={t("messages.placeholder")}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button onClick={submit} className="px-4 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Alert tone="blue" icon={Lock}>
          {locale === "fr"
            ? "Les demandes de réparation, congés et mises en demeure envoyés par la messagerie sont horodatés et exportables en PDF signé, ce qui constitue un début de preuve. Pour un congé ou une mise en demeure, l'envoi recommandé (ou la signification) reste requis dans les deux marchés."
            : "Repair requests, notices and formal demands sent through the messaging system are time-stamped and exportable as a signed PDF, which serves as preliminary evidence. For a notice to quit or formal demand, registered mail (or service) is still required in both markets."}
        </Alert>
      </div>
    </Page>
  );
}
