import { useMemo, useRef, useState } from "react";
import {
  ClipboardCheck, ChevronLeft, ChevronRight, Camera, Lock, Check,
  AlertTriangle, CloudOff, Plus, Trash2, X, Info, ScrollText,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useStore } from "@/app/store/AppStore";
import { feedback } from "@/app/lib/feedback";
import {
  buildInspection, summarise, CONDITIONS, conditionMeta, lockNotice,
  type Condition, type InspectionRoom,
} from "@/app/lib/inventory";
import { DictationInput } from "@/app/components/common/DictationInput";
import { putMedia, deleteMedia, useMediaUrl } from "@/app/lib/mediaDB";
import {
  Page, PageHeader, Card, SectionTitle, Badge, Button, Modal, Field,
  Select, StatCard, Progress, Alert, EmptyState, ChipGroup, ConfirmSheet,
  useOnlineStatus,
} from "@/app/components/common/ui";

export function InventoryFlow() {
  const { t, tv, date, market } = useI18n();
  const store = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const mine = useMemo(
    () => store.db.inspections.filter((x: any) => {
      const p = store.getProperty(x.propertyId);
      return p?.market === market;
    }),
    [store.db.inspections, market, store]
  );

  if (activeId) {
    const inspection = store.getInspection(activeId);
    if (inspection) return <InspectionRunner inspection={inspection} onExit={() => setActiveId(null)} />;
  }

  return (
    <Page wide>
      <PageHeader
        title={t("nav.inventory")}
        subtitle={t("inventory.subtitle")}
        action={<Button size="lg" icon={Plus} variant="accent" onClick={() => setStarting(true)}>{t("inventory.new")}</Button>}
      />

      <Alert tone="blue" icon={CloudOff} title={t("inventory.offlineTitle")}>
        {t("inventory.offlineBody")}
      </Alert>

      {mine.length === 0 ? (
        <EmptyState
          label={t("inventory.empty")}
          description={t("inventory.emptyHint")}
          icon={ClipboardCheck}
          action={<Button size="lg" icon={Plus} variant="accent" onClick={() => setStarting(true)}>{t("inventory.new")}</Button>}
        />
      ) : (
        <div className="space-y-3">
          {mine.map((insp: any) => {
            const property = store.getProperty(insp.propertyId);
            const sum = summarise(insp.rooms || []);
            return (
              <Card key={insp.id}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-balance">{property?.title || "—"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`inventoryType.${insp.type}`)} · <span className="tabular-nums">{date(insp.createdAt.slice(0, 10))}</span>
                    </p>
                  </div>
                  <Badge strong tone={insp.status === "locked" ? "green" : "amber"}>
                    {t(`inspectionStatus.${insp.status}`)}
                  </Badge>
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground tabular-nums">
                    <span>{t("inventory.rated", { n: String(sum.rated), total: String(sum.total) })}</span>
                    <span>{sum.progress} %</span>
                  </div>
                  <Progress value={sum.progress} tone={sum.progress === 100 ? "green" : "amber"} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="lg"
                    variant={insp.status === "locked" ? "outline" : "accent"}
                    icon={insp.status === "locked" ? ScrollText : ClipboardCheck}
                    className="flex-1"
                    onClick={() => setActiveId(insp.id)}
                  >
                    {insp.status === "locked" ? t("inventory.review") : t("inventory.resume")}
                  </Button>
                  {insp.status !== "locked" && (
                    <Button
                      variant="ghost"
                      icon={Trash2}
                      aria-label={t("common.delete")}
                      onClick={() => { store.deleteInspection(insp.id); feedback.info(t("inventory.deleted")); }}
                    >
                      {""}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <StartInspectionSheet open={starting} onClose={() => setStarting(false)} onStarted={setActiveId} />
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function StartInspectionSheet({ open, onClose, onStarted }: any) {
  const { t, market, m } = useI18n();
  const store = useStore();
  const [propertyId, setPropertyId] = useState("");
  const [type, setType] = useState("entry");

  const properties = store.db.properties.filter((p: any) => p.market === market);

  const start = () => {
    const property = store.getProperty(propertyId) || properties[0];
    if (!property) return;
    const inspection = store.startInspection({
      propertyId: property.id,
      type,
      market,
      rooms: buildInspection(property, m.code),
    });
    feedback.success(t("inventory.started"));
    onClose();
    onStarted(inspection.id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("inventory.new")}
      footer={
        <>
          <Button size="lg" variant="accent" icon={ClipboardCheck} disabled={!properties.length} onClick={start}>
            {t("inventory.start")}
          </Button>
          <Button size="lg" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
        </>
      }
    >
      <Field label={t("common.property")} required>
        <Select
          value={propertyId || properties[0]?.id || ""}
          onChange={(e: any) => setPropertyId(e.target.value)}
          options={properties.map((p: any) => ({ value: p.id, label: `${p.title} — ${p.city}` }))}
        />
      </Field>
      <Field label={t("lease.inventoryType")} hint={t("inventory.typeHint")}>
        <ChipGroup
          ariaLabel={t("lease.inventoryType")}
          value={type}
          onChange={setType}
          options={[
            { value: "entry", label: t("inventoryType.entry") },
            { value: "exit", label: t("inventoryType.exit") },
          ]}
        />
      </Field>
      <p className="text-xs text-muted-foreground text-pretty">{t("inventory.buildHint")}</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Parcours pièce par pièce                                            */
/* ------------------------------------------------------------------ */

function InspectionRunner({ inspection, onExit }: { inspection: any; onExit: () => void }) {
  const { t, tv, locale, m } = useI18n();
  const store = useStore();
  const online = useOnlineStatus();

  const [roomIndex, setRoomIndex] = useState(0);
  const [signing, setSigning] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);

  const rooms: InspectionRoom[] = inspection.rooms || [];
  const room = rooms[roomIndex];
  const locked = inspection.status === "locked";
  const summary = useMemo(() => summarise(rooms), [rooms]);

  const roomProgress = room
    ? Math.round((room.items.filter((i: any) => i.condition).length / room.items.length) * 100)
    : 0;

  const property = store.getProperty(inspection.propertyId);

  const rate = (itemId: string, condition: Condition) => {
    if (locked) return;
    store.rateInspectionItem(inspection.id, itemId, { condition });
  };

  const note = (itemId: string, value: string) => {
    store.rateInspectionItem(inspection.id, itemId, { note: value });
  };

  const [capturing, setCapturing] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const pendingItem = useRef<any>(null);

  /**
   * Capture d'un constat photographique.
   *
   * Les octets vont dans IndexedDB ; l'état des lieux ne retient que le
   * `fileId`. Une pièce dégradée photographiée sous trois angles pèse une
   * dizaine de mégaoctets : dans `localStorage`, le relevé serait perdu.
   */
  const capturePhoto = async (item: any, file: File) => {
    setCapturing(item.id);
    try {
      const meta = await putMedia(file, {
        name: `${item.id}.jpg`,
        scope: "inspection",
        ownerId: inspection.id,
      });
      const photos = [...(item.photos || []), { fileId: meta.id, name: meta.name, size: meta.size }];
      store.rateInspectionItem(inspection.id, item.id, { photos });
      feedback.success(t("inventory.photoSaved"));
    } catch {
      feedback.error(t("inventory.photoFailed"));
    } finally {
      setCapturing(null);
    }
  };

  const removePhoto = (item: any, photo: any) => {
    void deleteMedia(photo.fileId);
    store.rateInspectionItem(inspection.id, item.id, {
      photos: (item.photos || []).filter((x: any) => x.fileId !== photo.fileId),
    });
    feedback.tap();
  };

  const next = () => {
    if (roomIndex < rooms.length - 1) {
      setRoomIndex((i) => i + 1);
      feedback.tap();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSigning(true);
    }
  };

  if (!room) return <Page><EmptyState label={t("inventory.empty")} /></Page>;

  return (
    <Page wide>
      <button onClick={onExit} className="mb-4 inline-flex h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden="true" /> {t("common.back")}
      </button>

      <PageHeader
        title={tv(room.label)}
        subtitle={`${property?.title || ""} · ${t("inventory.roomOf", { n: String(roomIndex + 1), total: String(rooms.length) })}`}
      />

      {!online && (
        <Alert tone="amber" icon={CloudOff} title={t("inventory.workingOffline")}>
          {t("inventory.workingOfflineBody")}
        </Alert>
      )}

      {locked && (
        <Alert tone="blue" icon={Lock} title={t("inventory.lockedTitle")}>
          {t("inventory.lockedBody")}
        </Alert>
      )}

      <div className="mb-5">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{t("inventory.roomProgress")}</span>
          <span>{roomProgress} %</span>
        </div>
        <Progress value={roomProgress} tone={roomProgress === 100 ? "green" : "amber"} />
      </div>

      {/* Un seul champ de capture pour toute la pièce : le navigateur n'en
          ouvre qu'un à la fois, et l'élément visé est mémorisé par référence. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingItem.current) void capturePhoto(pendingItem.current, file);
          e.target.value = "";
        }}
      />

      <div className="space-y-3">
        {room.items.map((item: any) => {
          const meta = item.condition ? conditionMeta(item.condition) : null;
          const damaged = item.condition === "damaged";
          return (
            <Card key={item.id} className={damaged ? "border-l-4 border-l-destructive" : undefined}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-balance">{tv(item.label)}</h3>
                {meta && <Badge strong tone={meta.tone}>{tv(meta.label)}</Badge>}
              </div>

              <ChipGroup
                ariaLabel={tv(item.label)}
                value={item.condition || ""}
                onChange={(v: string) => rate(item.id, v as Condition)}
                options={CONDITIONS.map((c) => ({ value: c.value, label: tv(c.label) }))}
                className={locked ? "pointer-events-none opacity-60" : undefined}
              />

              {/* Une dégradation sans justification ne vaut rien en cas de litige :
                  la dictée se déploie d'elle-même plutôt que d'attendre un geste. */}
              {damaged && (
                <div className="mt-4 space-y-3">
                  <DictationInput
                    value={item.note || ""}
                    onChange={(v: string) => note(item.id, v)}
                    placeholder={t("inventory.damagePlaceholder")}
                    aria-label={t("inventory.damageNote")}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      icon={Camera}
                      disabled={locked || capturing === item.id}
                      onClick={() => { pendingItem.current = item; cameraRef.current?.click(); }}
                    >
                      {capturing === item.id ? t("inventory.photoSaving") : t("inventory.addPhoto")}
                    </Button>
                    {(item.photos || []).map((ph: any) => (
                      <PhotoThumb
                        key={ph.fileId}
                        photo={ph}
                        locked={locked}
                        onRemove={() => removePhoto(item, ph)}
                      />
                    ))}
                  </div>

                  {!item.note?.trim() && !(item.photos || []).length && (
                    <p className="flex items-start gap-1.5 text-xs text-destructive text-pretty">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      {t("inventory.justifyWarning")}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Barre d'action collée au bas, au-dessus de la barre d'onglets */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mt-6 -mx-4 border-t border-border bg-background/95 p-4 backdrop-blur md:bottom-0 md:mx-0 md:rounded-xl md:border">
        <div className="flex gap-2">
          {roomIndex > 0 && (
            <Button
              size="lg"
              variant="outline"
              icon={ChevronLeft}
              aria-label={t("inventory.previousRoom")}
              onClick={() => { setRoomIndex((i) => i - 1); feedback.tap(); }}
            >
              {""}
            </Button>
          )}
          <Button size="lg" variant="accent" icon={ChevronRight} className="flex-1" onClick={next}>
            {roomIndex < rooms.length - 1 ? t("inventory.nextRoom") : t("inventory.finish")}
          </Button>
        </div>
      </div>

      <SignatureSheet
        open={signing}
        onClose={() => setSigning(false)}
        summary={summary}
        inspection={inspection}
        locked={locked}
        onLock={() => setConfirmLock(true)}
      />

      <ConfirmSheet
        open={confirmLock}
        onOpenChange={setConfirmLock}
        tone="orange"
        title={t("inventory.confirmLockTitle")}
        description={t("inventory.confirmLockBody")}
        confirmLabel={t("inventory.lock")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          store.lockInspection(inspection.id, {
            total: summary.total, rated: summary.rated,
            damaged: summary.damaged, photos: summary.photos,
          });
          feedback.success(t("inventory.locked"), { description: t("inventory.lockedQueued") });
          setSigning(false);
          onExit();
        }}
        details={
          <div className="rounded-xl bg-muted p-3 text-sm text-pretty">
            {lockNotice(m.code)[locale] || lockNotice(m.code).fr}
          </div>
        }
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Vignette d'un constat.
 * Chaque instance possède son URL objet et la révoque à son démontage : c'est
 * ce qui permet de faire défiler des dizaines de photos sans gonfler l'onglet.
 */
function PhotoThumb({ photo, locked, onRemove }: { photo: any; locked: boolean; onRemove: () => void }) {
  const { t } = useI18n();
  const { url, loading } = useMediaUrl(photo.fileId);

  return (
    <span className="relative inline-flex">
      {loading ? (
        <span className="size-16 animate-pulse rounded-lg bg-muted" aria-busy="true" />
      ) : url ? (
        <img src={url} alt={photo.name} className="size-16 rounded-lg object-cover" loading="lazy" />
      ) : (
        <span className="grid size-16 place-items-center rounded-lg border border-dashed border-border" title={t("inventory.photoMissing")}>
          <Camera className="size-4 text-muted-foreground" aria-hidden="true" />
        </span>
      )}
      {!locked && (
        <button
          onClick={onRemove}
          aria-label={t("common.delete")}
          className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-foreground text-background"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

function SignatureSheet({ open, onClose, summary, inspection, locked, onLock }: any) {
  const { t, tv, locale, date, m } = useI18n();
  const store = useStore();
  const property = store.getProperty(inspection.propertyId);
  const incomplete = summary.rated < summary.total;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("inventory.summaryTitle")}
      description={property?.title}
      footer={
        locked ? (
          <Button size="lg" variant="outline" onClick={onClose}>{t("common.close")}</Button>
        ) : (
          <>
            <Button size="lg" variant="accent" icon={Lock} onClick={onLock}>
              {t("inventory.lock")}
            </Button>
            <Button size="lg" variant="outline" onClick={onClose}>{t("inventory.keepEditing")}</Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-pretty">
          {t("inventory.summarySentence", {
            total: String(summary.total),
            damaged: String(summary.damaged),
          })}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Check} label={t("inventory.inspected")} value={`${summary.rated}/${summary.total}`} tone={incomplete ? "amber" : "green"} />
          <StatCard icon={AlertTriangle} label={t("inventory.damaged")} value={summary.damaged} tone={summary.damaged ? "red" : "neutral"} />
          <StatCard icon={ClipboardCheck} label={t("inventory.worn")} value={summary.worn} tone="amber" />
          <StatCard icon={Camera} label={t("inventory.photos")} value={summary.photos} tone="blue" />
        </div>

        {incomplete && (
          <Alert tone="amber" icon={AlertTriangle} title={t("inventory.incompleteTitle")}>
            {t("inventory.incompleteBody", { n: String(summary.total - summary.rated) })}
          </Alert>
        )}

        {summary.unjustified.length > 0 && (
          <Alert tone="red" icon={AlertTriangle} title={t("inventory.unjustifiedTitle")}>
            {t("inventory.unjustifiedBody", { n: String(summary.unjustified.length) })}
            <ul className="mt-2 space-y-1">
              {summary.unjustified.slice(0, 4).map((i: any) => (
                <li key={i.id} className="text-xs">• {tv(i.label)}</li>
              ))}
            </ul>
          </Alert>
        )}

        {locked && inspection.lockedAt && (
          <div className="rounded-xl bg-muted p-3 text-sm">
            <div className="text-xs text-muted-foreground">{t("inventory.lockedAt")}</div>
            <div className="font-medium tabular-nums">{inspection.lockedAt.replace("T", " ").slice(0, 16)}</div>
          </div>
        )}

        <Alert tone="blue" icon={Info} title={t("inventory.legalTitle")}>
          {lockNotice(m.code)[locale] || lockNotice(m.code).fr}
        </Alert>

        {/* Ne pas laisser croire que le verrouillage vaut signature :
            c'est précisément le point sur lequel un rapport se fait casser. */}
        <p className="text-xs text-muted-foreground text-pretty">{t("inventory.signatureDisclaimer")}</p>
      </div>
    </Modal>
  );
}
