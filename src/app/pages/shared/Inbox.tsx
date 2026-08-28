import { useMemo, useRef, useState } from "react";
import {
  Mail, Send, Paperclip, FileText, Video, Image as ImageIcon, Settings,
  Search, AtSign, Info, X, Building2, CheckCheck,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { feedback } from "@/app/lib/feedback";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Modal, Field, Input, Textarea, Select, Avatar, Alert, EmptyState, ChipGroup,
} from "@/app/components/common/ui";

const KIND_ICON: Record<string, any> = { pdf: FileText, video: Video, image: ImageIcon };
const MAX_VIDEO_MB = 50;

const humanSize = (bytes: number) =>
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} Mo` : `${Math.round(bytes / 1000)} Ko`;

/**
 * Messagerie omnicanale.
 *
 * Un fil est rattaché à un bien et à des participants, jamais à un canal :
 * un même échange peut mêler messages internes et courriels. Le canal est porté
 * par le message, ce qui permet de rejouer l'historique complet en cas de litige.
 */
export function Inbox() {
  const { t, tv, locale, date, market } = useI18n();
  const store = useStore();
  const { db, currentUserId } = store;

  const [selected, setSelected] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("internal");
  const [pending, setPending] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [settings, setSettings] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const mailbox = store.mailboxOf(currentUserId);

  const threads = useMemo(() => {
    let list = db.threads.filter((th: any) => th.market === market);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((th: any) =>
        `${tv(th.subject)} ${th.messages.map((mg: any) => mg.body).join(" ")}`.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a: any, b: any) => (b.lastAt || b.createdAt).localeCompare(a.lastAt || a.createdAt));
  }, [db.threads, market, query, tv]);

  const current = selected ? store.getThread(selected) : threads[0] || null;

  const unreadCount = (th: any) =>
    th.messages.filter((mg: any) => !mg.read && mg.from !== currentUserId).length;

  const attach = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files).map((f, i) => ({
      id: `at-${Date.now()}-${i}`,
      kind: f.type.startsWith("video") ? "video" : f.type.startsWith("image") ? "image" : "pdf",
      name: f.name,
      size: f.size,
      oversize: f.type.startsWith("video") && f.size > MAX_VIDEO_MB * 1_000_000,
    }));
    setPending((p) => [...p, ...added]);
  };

  const send = () => {
    if (!current || (!body.trim() && !pending.length)) return;
    store.postMessage(current.id, body.trim(), pending.filter((a) => !a.oversize), channel);
    feedback.success(channel === "email" ? t("toast.emailSent") : t("toast.messageSent"));
    setBody("");
    setPending([]);
  };

  const openThread = (id: string) => {
    setSelected(id);
    store.markThreadRead(id);
  };

  return (
    <Page wide>
      <PageHeader
        title={t("nav.inbox")}
        subtitle={mailbox?.address ? t("inbox.subtitleBound", { address: mailbox.address }) : t("inbox.subtitle")}
        action={<Button variant="outline" icon={Settings} onClick={() => setSettings(true)}>{t("inbox.settings")}</Button>}
      />

      {!mailbox?.connected && (
        <Alert tone="amber" icon={AtSign} title={t("inbox.notConnectedTitle")}>
          {t("inbox.notConnectedBody")}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ------------------------------------------------ Liste des fils */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder={t("inbox.search")} className="pl-9" aria-label={t("inbox.search")} />
          </div>

          {threads.length === 0 ? (
            <EmptyState label={t("inbox.empty")} icon={Mail} />
          ) : (
            <div className="space-y-2 lg:max-h-[600px] lg:overflow-y-auto lg:pr-1">
              {threads.map((th: any) => {
                const property = store.getProperty(th.propertyId);
                const last = th.messages[th.messages.length - 1];
                const unread = unreadCount(th);
                const active = current?.id === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => openThread(th.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium">{tv(th.subject)}</span>
                      {unread > 0 && <Badge tone="orange"><span className="tabular-nums">{unread}</span></Badge>}
                    </div>
                    {property && (
                      <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="size-3" aria-hidden="true" />
                        <span className="truncate">{property.title}</span>
                      </div>
                    )}
                    <p className="line-clamp-2 text-xs text-muted-foreground text-pretty">{last?.body}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge tone={th.channel === "email" ? "blue" : th.channel === "mixed" ? "violet" : "neutral"}>
                        {t(`channel.${th.channel}`)}
                      </Badge>
                      <span className="tabular-nums">{date((th.lastAt || th.createdAt).slice(0, 10))}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ------------------------------------------------ Conversation */}
        <div className="lg:col-span-2">
          {!current ? (
            <EmptyState label={t("inbox.selectThread")} icon={Mail} />
          ) : (
            <Card padded={false}>
              <div className="border-b border-border p-4">
                <h2 className="font-semibold text-balance">{tv(current.subject)}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {(current.participantIds || []).map((id: string) => {
                    const u = store.getUser(id);
                    return u ? (
                      <span key={id} className="rounded-full bg-muted px-2 py-0.5">
                        {u.firstName} {u.lastName} · {t(`role.${u.role}`)}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="max-h-[440px] space-y-4 overflow-y-auto p-4">
                {current.messages.map((msg: any) => {
                  const author = store.getUser(msg.from);
                  const mine = msg.from === currentUserId;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                      {author && <Avatar user={author} size={32} />}
                      <div className={`min-w-0 max-w-[80%] ${mine ? "text-right" : ""}`}>
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{author ? `${author.firstName} ${author.lastName}` : "—"}</span>
                          <Badge tone={msg.channel === "email" ? "blue" : "neutral"}>{t(`channel.${msg.channel}`)}</Badge>
                          <span className="tabular-nums">{msg.at.replace("T", " ")}</span>
                          {mine && msg.read && <CheckCheck className="size-3 text-success" aria-label={t("inbox.read")} />}
                        </div>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm text-pretty ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {msg.body}
                        </div>
                        {(msg.attachments || []).length > 0 && (
                          <div className={`mt-2 flex flex-wrap gap-2 ${mine ? "justify-end" : ""}`}>
                            {msg.attachments.map((a: any) => {
                              const Icon = KIND_ICON[a.kind] || FileText;
                              return (
                                <span key={a.id} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs">
                                  <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                                  <span className="max-w-[160px] truncate">{a.name}</span>
                                  <span className="text-muted-foreground tabular-nums">{humanSize(a.size)}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-border p-4">
                {pending.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pending.map((a) => {
                      const Icon = KIND_ICON[a.kind] || FileText;
                      return (
                        <span
                          key={a.id}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${a.oversize ? "border-destructive text-destructive" : "border-border"}`}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                          <span className="max-w-[140px] truncate">{a.name}</span>
                          <span className="tabular-nums">{humanSize(a.size)}</span>
                          <button onClick={() => setPending((p) => p.filter((x) => x.id !== a.id))} aria-label={t("common.delete")}>
                            <X className="size-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {pending.some((a) => a.oversize) && (
                  <p className="text-xs text-destructive text-pretty">{t("inbox.videoTooLarge", { mb: String(MAX_VIDEO_MB) })}</p>
                )}

                <Textarea
                  value={body}
                  onChange={(e: any) => setBody(e.target.value)}
                  placeholder={t("inbox.placeholder")}
                  className="min-h-[80px]"
                  aria-label={t("inbox.placeholder")}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="application/pdf,image/*,video/*"
                    className="hidden"
                    onChange={(e) => { attach(e.target.files); e.target.value = ""; }}
                  />
                  <Button variant="outline" size="sm" icon={Paperclip} onClick={() => fileRef.current?.click()}>
                    {t("inbox.attach")}
                  </Button>
                  <ChipGroup
                    ariaLabel={t("inbox.channel")}
                    value={channel}
                    onChange={setChannel}
                    options={[
                      { value: "internal", label: t("channel.internal") },
                      { value: "email", label: t("channel.email") },
                    ]}
                  />
                  <Button
                    variant="accent"
                    icon={Send}
                    className="ml-auto"
                    disabled={!body.trim() && !pending.length}
                    onClick={send}
                  >
                    {t("common.send")}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-pretty">{t("inbox.channelHint")}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <MailboxSettings open={settings} onClose={() => setSettings(false)} />
    </Page>
  );
}

function MailboxSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, market } = useI18n();
  const store = useStore();
  const { currentUserId } = store;
  const mailbox = store.mailboxOf(currentUserId) || {};
  const [form, setForm] = useState<any>({
    address: mailbox.address || "",
    displayName: mailbox.displayName || "",
    signature: mailbox.signature || "",
    forwardToEmail: mailbox.forwardToEmail ?? true,
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("inbox.settings")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="accent"
            onClick={() => {
              store.updateMailbox(currentUserId, { ...form, connected: !!form.address });
              onClose();
            }}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <Field label={t("inbox.address")} hint={t("inbox.addressHint")} required>
        <Input type="email" value={form.address} onChange={(e: any) => set("address", e.target.value)} />
      </Field>
      <Field label={t("inbox.displayName")}>
        <Input value={form.displayName} onChange={(e: any) => set("displayName", e.target.value)} />
      </Field>
      <Field label={t("inbox.signature")} hint={market === "FR" ? t("inbox.signatureFR") : t("inbox.signatureQC")}>
        <Textarea value={form.signature} onChange={(e: any) => set("signature", e.target.value)} className="min-h-[100px]" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.forwardToEmail}
          onChange={(e) => set("forwardToEmail", e.target.checked)}
          className="size-4 rounded"
        />
        {t("inbox.forward")}
      </label>

      <div className="mt-4">
        <Alert tone="blue" icon={Info} title={t("inbox.retentionTitle")}>
          {market === "FR" ? t("inbox.retentionFR") : t("inbox.retentionQC")}
        </Alert>
      </div>
    </Modal>
  );
}
