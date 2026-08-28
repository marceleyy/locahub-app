import { useMemo, useState } from "react";
import {
  ListChecks, Plus, Scale, Ban, User, MessageSquare, Send,
  CheckCircle2, Clock, ArrowRightLeft, Filter, AlertTriangle,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { feedback } from "@/app/lib/feedback";
import { DictationInput } from "@/app/components/common/DictationInput";
import { sortByPriority } from "@/app/lib/assist";
import {
  Page, PageHeader, Card, Badge, Button, Modal, Field, Input, Textarea, Select, Tabs, EmptyState, StatCard, Avatar, toneSolid, ChipGroup,
} from "@/app/components/common/ui";
import type { Tone } from "@/app/components/common/ui";

const LEVEL_TONE: Record<string, Tone> = { critical: "red", high: "orange", medium: "amber", low: "neutral" };

export function ManagerTasks() {
  const { t, tv, locale, market, date, money } = useI18n();
  const store = useStore();
  const { db, currentUserId } = store;

  const [tab, setTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [open, setOpen] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [comment, setComment] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const managers = db.users.filter((u: any) => u.role === "agent");

  const ranked = useMemo(() => {
    let list = db.tasks.filter((x: any) => x.market === market);
    if (tab === "mine") list = list.filter((x: any) => x.assigneeId === currentUserId);
    if (tab === "legal") list = list.filter((x: any) => x.legal);
    if (statusFilter === "open") list = list.filter((x: any) => x.status !== "done");
    if (statusFilter === "done") list = list.filter((x: any) => x.status === "done");
    return sortByPriority(list);
  }, [db.tasks, market, tab, statusFilter, currentUserId]);

  const stats = useMemo(() => {
    const all = sortByPriority(db.tasks.filter((x: any) => x.market === market && x.status !== "done"));
    return {
      total: all.length,
      critical: all.filter((x: any) => x.priority.level === "critical").length,
      late: all.filter((x: any) => x.priority.dueInDays < 0).length,
      legal: all.filter((x: any) => x.legal).length,
      budget: all.reduce((a: number, x: any) => a + (x.amount || 0), 0),
    };
  }, [db.tasks, market]);

  const pendingTransfers = db.tasks.filter((x: any) => x.transfer?.state === "pending" && x.transfer.to === currentUserId);

  const current = open ? ranked.find((x: any) => x.id === open) || db.tasks.find((x: any) => x.id === open) : null;

  return (
    <Page wide>
      <PageHeader
        title={t("nav.tasks")}
        subtitle={t("tasks.subtitle")}
        action={<Button icon={Plus} variant="accent" onClick={() => setCreating(true)}>{t("tasks.new")}</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={ListChecks} label={t("tasks.open")} value={<span className="tabular-nums">{stats.total}</span>} tone="blue" />
        <StatCard icon={AlertTriangle} label={t("tasks.critical")} value={<span className="tabular-nums">{stats.critical}</span>} tone="red" hint={t("tasks.criticalHint")} />
        <StatCard icon={Scale} label={t("tasks.legalCount")} value={<span className="tabular-nums">{stats.legal}</span>} tone="orange" hint={t("tasks.legalHint")} />
        <StatCard icon={Clock} label={t("tasks.budget")} value={<span className="tabular-nums">{money(stats.budget)}</span>} tone="green" />
      </div>

      {pendingTransfers.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-secondary">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="size-5 text-secondary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{t("tasks.transferInbox")}</h3>
              <p className="text-sm text-muted-foreground mb-3">{t("tasks.transferInboxHint")}</p>
              <div className="space-y-2">
                {pendingTransfers.map((task: any) => (
                  <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted">
                    <div className="text-sm">
                      <span className="font-medium">{tv(task.title)}</span>
                      {task.transfer.note && <span className="text-muted-foreground"> — {task.transfer.note}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { store.answerTransfer(task.id, true); feedback.success(t("toast.transferAccepted")); }}>{t("common.accept")}</Button>
                      <Button size="sm" variant="outline" onClick={() => { store.answerTransfer(task.id, false); feedback.info(t("toast.transferDeclined")); }}>{t("common.decline")}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Tabs
          items={[
            { id: "all", label: t("tasks.tab.all") },
            { id: "mine", label: t("tasks.tab.mine") },
            { id: "legal", label: t("tasks.tab.legal") },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="ml-auto flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <ChipGroup
            ariaLabel={t("common.filter")}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "open", label: t("tasks.filter.open") },
              { value: "done", label: t("tasks.filter.done") },
              { value: "all", label: t("tasks.filter.all") },
            ]}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{t("tasks.sortedBy")}</p>

      {ranked.length === 0 ? (
        <EmptyState label={t("tasks.empty")} action={<Button icon={Plus} onClick={() => setCreating(true)}>{t("tasks.new")}</Button>} />
      ) : (
        <div className="space-y-2.5">
          {ranked.map((task: any, i: number) => {
            const property = db.properties.find((p: any) => p.id === task.propertyId);
            const assignee = db.users.find((u: any) => u.id === task.assigneeId);
            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">#{i + 1}</span>
                    <span className={`size-9 rounded-xl grid place-items-center text-xs font-bold tabular-nums ${toneSolid(LEVEL_TONE[task.priority.level])}`}>
                      {task.priority.score}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-sm text-balance ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {tv(task.title)}
                      </h3>
                      <Badge strong tone={LEVEL_TONE[task.priority.level]}>{t(`priority.${task.priority.level}`)}</Badge>
                      {task.legal && <Badge tone="violet"><Scale className="size-3" />{t("tasks.legal")}</Badge>}
                      {task.blocksRental && <Badge tone="red"><Ban className="size-3" />{t("tasks.blocking")}</Badge>}
                      {task.transfer?.state === "pending" && <Badge tone="amber">{t("tasks.transferPending")}</Badge>}
                    </div>

                    <p className="text-sm text-muted-foreground text-pretty line-clamp-2 mb-2">{tv(task.description)}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {property && <span>{property.title}</span>}
                      <span className={task.priority.dueInDays < 0 ? "text-destructive font-medium" : ""}>
                        {date(task.dueDate)} · <span className="tabular-nums">{task.priority.dueInDays < 0 ? t("tasks.overdue", { n: Math.abs(task.priority.dueInDays) }) : t("tasks.inDays", { n: task.priority.dueInDays })}</span>
                      </span>
                      {assignee && <span className="flex items-center gap-1"><User className="size-3" />{assignee.firstName}</span>}
                      {task.amount > 0 && <span className="tabular-nums">{money(task.amount)}</span>}
                      {task.comments?.length > 0 && <span className="flex items-center gap-1"><MessageSquare className="size-3" />{task.comments.length}</span>}
                    </div>

                    {task.priority.reasons.length > 0 && task.status !== "done" && (
                      <p className="text-xs mt-2 text-secondary">
                        {task.priority.reasons.map((r: any) => r[locale] || r.fr).join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => { setOpen(task.id); setComment(""); setTransferTo(""); }}>
                      {t("common.view")}
                    </Button>
                    {task.status !== "done" && (
                      <Button size="sm" variant="ghost" icon={CheckCircle2} onClick={() => { store.updateTask(task.id, { status: "done" }); feedback.success(t("toast.taskDone"), { action: { label: t("common.undo"), onClick: () => store.updateTask(task.id, { status: "todo" }) } }); }}>
                        {t("tasks.markDone")}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --------------------------------------------------- Détail */}
      <Modal open={!!current} onClose={() => setOpen(null)} title={current ? tv(current.title) : ""}>
        {current && (
          <div className="space-y-5">
            <p className="text-sm text-pretty">{tv(current.description)}</p>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-muted">
                <div className="text-xs text-muted-foreground mb-0.5">{t("tasks.due")}</div>
                <div className="font-medium tabular-nums">{date(current.dueDate)}</div>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <div className="text-xs text-muted-foreground mb-0.5">{t("tasks.estimatedCost")}</div>
                <div className="font-medium tabular-nums">{current.amount ? money(current.amount) : "—"}</div>
              </div>
            </div>

            {current.priority && (
              <div>
                <h4 className="text-sm font-semibold mb-2">{t("tasks.whyPriority")}</h4>
                <ul className="space-y-1.5">
                  {(current.priority.reasons || []).map((r: any, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-secondary">•</span>
                      {r[locale] || r.fr}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-2">{t("tasks.comments")}</h4>
              <div className="space-y-2 mb-3">
                {(current.comments || []).map((c: any, i: number) => {
                  const author = db.users.find((u: any) => u.id === c.by);
                  return (
                    <div key={i} className="flex gap-2.5">
                      {author && <Avatar user={author} size={28} />}
                      <div className="flex-1 p-2.5 rounded-xl bg-muted">
                        <div className="text-xs text-muted-foreground mb-0.5 tabular-nums">{date(c.at)}</div>
                        <div className="text-sm">{tv(c.text)}</div>
                      </div>
                    </div>
                  );
                })}
                {!(current.comments || []).length && <p className="text-sm text-muted-foreground">{t("tasks.noComment")}</p>}
              </div>
              <div className="space-y-2">
                <DictationInput
                  value={comment}
                  onChange={setComment}
                  placeholder={t("tasks.addComment")}
                  aria-label={t("tasks.addComment")}
                  className="min-h-[100px]"
                />
                <Button
                  icon={Send}
                  size="lg"
                  className="w-full"
                  disabled={!comment.trim()}
                  onClick={() => {
                    store.addTaskComment(current.id, { fr: comment, en: comment });
                    feedback.success(t("toast.noteAdded"));
                    setComment("");
                  }}
                >
                  {t("common.send")}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-2">{t("tasks.transfer")}</h4>
              <p className="text-xs text-muted-foreground mb-2">{t("tasks.transferHint")}</p>
              <div className="flex gap-2">
                <Select
                  aria-label={t("tasks.transfer")}
                  value={transferTo}
                  onChange={(e: any) => setTransferTo(e.target.value)}
                  options={[
                    { value: "", label: t("common.select") },
                    ...managers.filter((u: any) => u.id !== current.assigneeId).map((u: any) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
                  ]}
                />
                <Button
                  icon={ArrowRightLeft}
                  disabled={!transferTo}
                  onClick={() => { store.transferTask(current.id, transferTo); feedback.success(t("toast.transferSent")); setOpen(null); }}
                >
                  {t("tasks.propose")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* --------------------------------------------------- Création */}
      <NewTaskModal open={creating} onClose={() => setCreating(false)} />
    </Page>
  );
}

function NewTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, market } = useI18n();
  const store = useStore();
  const { db, currentUserId } = store;
  const [form, setForm] = useState<any>({ title: "", description: "", dueDate: "", propertyId: "", category: "maintenance", amount: "", legal: false, blocksRental: false, tenantImpact: "low" });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const props = db.properties.filter((p: any) => p.market === market);

  const submit = () => {
    if (!form.title.trim()) return;
    store.createTask({
      market,
      title: { fr: form.title, en: form.title },
      description: { fr: form.description, en: form.description },
      dueDate: form.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      propertyId: form.propertyId || null,
      buildingId: store.buildingOfProperty(form.propertyId)?.id || null,
      category: form.category,
      amount: Number(form.amount) || 0,
      legal: form.legal,
      blocksRental: form.blocksRental,
      tenantImpact: form.tenantImpact,
      assigneeId: currentUserId,
    });
    setForm({ title: "", description: "", dueDate: "", propertyId: "", category: "maintenance", amount: "", legal: false, blocksRental: false, tenantImpact: "low" });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("tasks.new")}
      footer={<><Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button><Button variant="accent" onClick={submit}>{t("common.create")}</Button></>}
    >
      <Field label={t("tasks.title")} required>
        <Input value={form.title} onChange={(e: any) => set("title", e.target.value)} />
      </Field>
      <Field label={t("tasks.description")}>
        <Textarea value={form.description} onChange={(e: any) => set("description", e.target.value)} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-x-4">
        <Field label={t("tasks.due")}>
          <Input type="date" value={form.dueDate} onChange={(e: any) => set("dueDate", e.target.value)} />
        </Field>
        <Field label={t("tasks.estimatedCost")}>
          <Input type="number" value={form.amount} onChange={(e: any) => set("amount", e.target.value)} />
        </Field>
        <Field label={t("common.property")}>
          <Select
            value={form.propertyId}
            onChange={(e: any) => set("propertyId", e.target.value)}
            options={[{ value: "", label: t("tasks.noProperty") }, ...props.map((p: any) => ({ value: p.id, label: p.title }))]}
          />
        </Field>
        <Field label={t("tasks.category")}>
          <Select
            value={form.category}
            onChange={(e: any) => set("category", e.target.value)}
            options={["maintenance", "compliance", "lease", "finance", "letting", "works", "legal"].map((c) => ({ value: c, label: t(`taskCat.${c}`) }))}
          />
        </Field>
      </div>
      <Field label={t("tasks.tenantImpact")}>
        <Select
          value={form.tenantImpact}
          onChange={(e: any) => set("tenantImpact", e.target.value)}
          options={[
            { value: "low", label: t("impact.low") },
            { value: "medium", label: t("impact.medium") },
            { value: "high", label: t("impact.high") },
          ]}
        />
      </Field>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.legal} onChange={(e) => set("legal", e.target.checked)} className="size-4 rounded" />
          {t("tasks.isLegal")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.blocksRental} onChange={(e) => set("blocksRental", e.target.checked)} className="size-4 rounded" />
          {t("tasks.isBlocking")}
        </label>
      </div>
    </Modal>
  );
}
