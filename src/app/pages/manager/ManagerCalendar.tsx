import { useMemo, useState } from "react";
import { CalendarDays, Sparkles, Check, X, Plus, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { suggestSlots, leaseAlerts } from "@/app/lib/assist";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Modal,
  Field, Input, Select, EmptyState,
} from "@/app/components/common/ui";

/** Type d'événement → classe de fond, tokens du thème uniquement. */
const KIND_DOT: Record<string, string> = {
  visit: "bg-primary", inventory: "bg-secondary", meeting: "bg-chart-4",
  works: "bg-success", task: "bg-warning",
};
const dot = (kind: string) => KIND_DOT[kind] || "bg-muted-foreground";

export function ManagerCalendar() {
  const { t, tv, locale, date, market } = useI18n();
  const store = useStore();
  const { db, currentUserId } = store;

  const [cursor, setCursor] = useState(() => new Date());
  const [creating, setCreating] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const myEvents = db.events.filter((e: any) => e.ownerId === currentUserId || !e.ownerId);
  const myTasks = db.tasks.filter((x: any) => x.market === market && x.assigneeId === currentUserId);

  const slots = useMemo(
    () => suggestSlots(myTasks, myEvents).filter((s) => !dismissed.includes(`${s.taskId}-${s.date}-${s.start}`)),
    [myTasks, myEvents, dismissed]
  );

  const alerts = useMemo(() => leaseAlerts(db.leases, db.properties, market), [db.leases, db.properties, market]);

  // Grille du mois affiché
  const grid = useMemo(() => {
    const y = cursor.getFullYear();
    const mo = cursor.getMonth();
    const first = new Date(y, mo, 1);
    const offset = (first.getDay() + 6) % 7; // semaine commençant lundi
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const cells: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const eventsOn = (iso: string) => myEvents.filter((e: any) => e.date === iso);
  const today = new Date().toISOString().slice(0, 10);
  const monthLabel = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-CA", { month: "long", year: "numeric" }).format(cursor);
  const weekdays = locale === "fr" ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];

  const upcoming = [...myEvents]
    .filter((e: any) => e.date >= today)
    .sort((a: any, b: any) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 6);

  return (
    <Page wide>
      <PageHeader
        title={t("nav.calendar")}
        subtitle={t("calendar.subtitle")}
        action={<Button icon={Plus} variant="accent" onClick={() => setCreating(true)}>{t("calendar.new")}</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ------------------------------------------------ Grille */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold capitalize">{monthLabel}</h3>
              <div className="flex gap-1">
                <button
                  aria-label={t("calendar.prevMonth")}
                  className="p-2 rounded-lg hover:bg-accent"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  aria-label={t("calendar.nextMonth")}
                  className="p-2 rounded-lg hover:bg-accent"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
              {weekdays.map((d, i) => <div key={i} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((iso, i) => {
                if (!iso) return <div key={i} className="aspect-square" />;
                const evts = eventsOn(iso);
                const isToday = iso === today;
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg border p-1 text-left ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className={`text-xs tabular-nums ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                      {Number(iso.slice(-2))}
                    </div>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {evts.slice(0, 3).map((e: any) => (
                        <span key={e.id} className={`size-1.5 rounded-full ${dot(e.kind)}`} title={tv(e.title)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={CalendarDays}>{t("calendar.upcoming")}</SectionTitle>
            {upcoming.length === 0 ? (
              <EmptyState label={t("calendar.empty")} />
            ) : (
              <div className="space-y-2">
                {upcoming.map((e: any) => {
                  const p = db.properties.find((x: any) => x.id === e.propertyId);
                  return (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                      <span className={`w-1 self-stretch rounded-full ${dot(e.kind)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{tv(e.title)}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {date(e.date)} · {e.start}–{e.end}{p ? ` · ${p.city}` : ""}
                        </div>
                      </div>
                      <button
                        aria-label={t("common.delete")}
                        className="p-1.5 rounded-lg hover:bg-card"
                        onClick={() => store.deleteEvent(e.id)}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------ Colonne latérale */}
        <div className="space-y-5">
          <Card>
            <SectionTitle icon={Sparkles}>{t("calendar.suggested")}</SectionTitle>
            <p className="text-xs text-muted-foreground mb-3 text-pretty">{t("calendar.suggestedHint")}</p>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("calendar.noSuggestion")}</p>
            ) : (
              <div className="space-y-2">
                {slots.map((s, i) => {
                  const task = db.tasks.find((x: any) => x.id === s.taskId);
                  if (!task) return null;
                  return (
                    <div key={i} className="p-3 rounded-xl border border-border">
                      <div className="text-sm font-medium mb-0.5 text-balance">{tv(task.title)}</div>
                      <div className="text-xs text-muted-foreground tabular-nums mb-1">{date(s.date)} · {s.start}–{s.end}</div>
                      <div className="text-xs text-secondary mb-2.5">{s.rationale[locale] || s.rationale.fr}</div>
                      <div className="flex gap-2">
                        <Button size="sm" icon={Check} onClick={() => store.acceptSlot(s, task.title)}>{t("common.accept")}</Button>
                        <Button size="sm" variant="outline" onClick={() => setDismissed((d) => [...d, `${s.taskId}-${s.date}-${s.start}`])}>
                          {t("common.decline")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle icon={Bell}>{t("calendar.leaseAlerts")}</SectionTitle>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("calendar.noAlert")}</p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((a, i) => {
                  const p = db.properties.find((x: any) => x.id === a.propertyId);
                  return (
                    <div key={i} className="p-3 rounded-xl bg-muted">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-balance">{a.title[locale] || a.title.fr}</span>
                        <Badge tone={a.severity === "critical" ? "red" : a.severity === "high" ? "orange" : "amber"}>
                          <span className="tabular-nums">{a.daysLeft}&nbsp;j</span>
                        </Badge>
                      </div>
                      {p && <div className="text-xs text-muted-foreground mb-1">{p.title}</div>}
                      <p className="text-xs text-muted-foreground text-pretty">{a.detail[locale] || a.detail.fr}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() =>
                          store.createTask({
                            market,
                            title: a.action,
                            description: a.detail,
                            dueDate: a.dueDate,
                            propertyId: a.propertyId,
                            category: "lease",
                            legal: true,
                            tenantImpact: "high",
                            assigneeId: currentUserId,
                          })
                        }
                      >
                        {a.action[locale] || a.action.fr}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <NewEventModal open={creating} onClose={() => setCreating(false)} />
    </Page>
  );
}

function NewEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, market } = useI18n();
  const store = useStore();
  const [form, setForm] = useState<any>({ title: "", date: "", start: "09:00", end: "10:00", kind: "meeting", propertyId: "" });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("calendar.new")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="accent"
            onClick={() => {
              if (!form.title.trim() || !form.date) return;
              store.createEvent({ ...form, title: { fr: form.title, en: form.title }, propertyId: form.propertyId || null });
              setForm({ title: "", date: "", start: "09:00", end: "10:00", kind: "meeting", propertyId: "" });
              onClose();
            }}
          >
            {t("common.create")}
          </Button>
        </>
      }
    >
      <Field label={t("calendar.eventTitle")} required>
        <Input value={form.title} onChange={(e: any) => set("title", e.target.value)} />
      </Field>
      <div className="grid grid-cols-3 gap-x-4">
        <Field label={t("common.date")} required><Input type="date" value={form.date} onChange={(e: any) => set("date", e.target.value)} /></Field>
        <Field label={t("calendar.start")}><Input type="time" value={form.start} onChange={(e: any) => set("start", e.target.value)} /></Field>
        <Field label={t("calendar.end")}><Input type="time" value={form.end} onChange={(e: any) => set("end", e.target.value)} /></Field>
      </div>
      <Field label={t("calendar.kind")}>
        <Select
          value={form.kind}
          onChange={(e: any) => set("kind", e.target.value)}
          options={["visit", "inventory", "meeting", "works"].map((k) => ({ value: k, label: t(`eventKind.${k}`) }))}
        />
      </Field>
      <Field label={t("common.property")}>
        <Select
          value={form.propertyId}
          onChange={(e: any) => set("propertyId", e.target.value)}
          options={[
            { value: "", label: t("tasks.noProperty") },
            ...store.db.properties.filter((p: any) => p.market === market).map((p: any) => ({ value: p.id, label: p.title })),
          ]}
        />
      </Field>
    </Modal>
  );
}
