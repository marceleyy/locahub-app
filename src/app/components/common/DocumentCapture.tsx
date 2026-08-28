import * as React from "react";
import {
  Camera, Images, FileText, RotateCw, Check, X, Loader2,
  ScanLine, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/app/i18n/I18nProvider";
import { feedback } from "@/app/lib/feedback";
import { scanDocument, type ScanResult, type DocKind } from "@/app/lib/scan";
import { putMedia, deleteMedia, useMediaUrl } from "@/app/lib/mediaDB";
import {
  Modal, Button, Badge, Field, Select, Alert, ChipGroup,
} from "@/app/components/common/ui";
import { useIsMobile } from "@/app/hooks/useMediaQuery";

/**
 * Capture d'une pièce justificative, pensée pour le téléphone.
 *
 * Deux entrées distinctes, parce qu'elles n'ouvrent pas la même chose :
 *   - `capture="environment"` déclenche directement l'appareil photo arrière ;
 *   - sans cet attribut, le sélecteur de fichiers ouvre la galerie et les PDF.
 *
 * Le « recadrage » se limite à la rotation et au ré-encodage. Un vrai éditeur
 * de recadrage se justifierait s'il apportait mieux qu'une rotation ; ici le
 * gain réel est ailleurs : une photo de 8 Mo prise au téléphone tombe à
 * quelques centaines de kilo-octets, ce qui change tout pour un envoi en 4G.
 */

const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;

const KIND_OPTIONS: { value: DocKind; key: string }[] = [
  { value: "id", key: "doc.kind.id" },
  { value: "address", key: "doc.kind.address" },
  { value: "employment", key: "doc.kind.employment" },
  { value: "income", key: "doc.kind.income" },
  { value: "tax", key: "doc.kind.tax" },
  { value: "insurance", key: "doc.kind.insurance" },
  { value: "guarantor", key: "doc.kind.guarantor" },
  { value: "other", key: "doc.kind.other" },
];

interface Props {
  onConfirm: (doc: {
    type: DocKind;
    label: string;
    verified: boolean;
    fileName: string;
    bytes: number;
    /** Référence IndexedDB. Le store ne voit que cela, jamais les octets. */
    fileId: string;
    mimeType: string;
  }) => void;
  /** Libellé du bouton déclencheur. */
  label?: string;
  /** Rattachement métier du média, pour la purge et le suivi. */
  scope?: string;
  ownerId?: string;
}

export function DocumentCapture({ onConfirm, label, scope = "tenant-doc", ownerId }: Props) {
  const { t, tv, locale } = useI18n();
  const isMobile = useIsMobile();

  const cameraRef = React.useRef<HTMLInputElement | null>(null);
  const galleryRef = React.useRef<HTMLInputElement | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [fileId, setFileId] = React.useState<string | null>(null);
  const [storing, setStoring] = React.useState(false);
  const [rotation, setRotation] = React.useState(0);
  const [scan, setScan] = React.useState<ScanResult | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [kind, setKind] = React.useState<DocKind>("other");

  // L'aperçu vient d'IndexedDB : c'est le hook qui gère création et révocation
  // de l'URL objet, y compris si l'utilisateur ferme le tiroir en cours de route.
  const { url: preview } = useMediaUrl(fileId);

  const isImage = file?.type.startsWith("image/");

  /**
   * Abandon : le média déjà écrit est supprimé d'IndexedDB.
   * Sans cela, chaque hésitation de l'utilisateur laisserait un orphelin
   * de plusieurs mégaoctets sur son téléphone.
   */
  const reset = React.useCallback(() => {
    setFileId((current) => { if (current) void deleteMedia(current); return null; });
    setFile(null);
    setRotation(0);
    setScan(null);
    setScanning(false);
    setStoring(false);
  }, []);

  const pick = async (files: FileList | null) => {
    const picked = files?.[0];
    if (!picked) return;
    feedback.tap();
    setFile(picked);
    setRotation(0);
    setScan(null);
    setStoring(true);
    try {
      // Écriture immédiate : les octets quittent la mémoire du composant
      // avant même que l'utilisateur ait décidé quoi que ce soit.
      const meta = await putMedia(picked, { name: picked.name, scope, ownerId });
      setFileId(meta.id);
    } catch {
      feedback.error(t("doc.storeFailed"));
      setFile(null);
    } finally {
      setStoring(false);
    }
  };

  /** Applique la rotation et redimensionne, puis réécrit le média en base. */
  const normalise = async (): Promise<Blob | null> => {
    if (!file || !isImage) return null;
    const bitmap = await createImageBitmap(file);

    const swapped = rotation % 180 !== 0;
    const srcW = swapped ? bitmap.height : bitmap.width;
    const srcH = swapped ? bitmap.width : bitmap.height;
    const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    bitmap.close?.();

    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
  };

  const runScan = async () => {
    if (!file) return;
    setScanning(true);
    try {
      const normalised = isImage ? await normalise() : null;
      const result = await scanDocument(file, normalised?.size);
      setScan(result);
      setKind(result.kind);

      // Le média allégé remplace l'original : on ne garde jamais les deux
      if (normalised && fileId) {
        await deleteMedia(fileId);
        const meta = await putMedia(normalised, { name: file.name, scope, ownerId });
        setFileId(meta.id);
      }
      // Verdict, jamais rejet : la pièce est enregistrée dans les deux cas
      if (result.verified) feedback.success(t("doc.scanVerified", { type: tv(result.label) }));
      else feedback.warning(t("doc.scanUnverified", { type: tv(result.label) }));
    } catch {
      feedback.error(t("doc.scanFailed"));
      setScan(null);
    } finally {
      setScanning(false);
    }
  };

  const confirm = () => {
    if (!file || !fileId) return;
    const chosen = KIND_OPTIONS.find((o) => o.value === kind);
    onConfirm({
      type: kind,
      label: chosen ? t(chosen.key) : file.name,
      // Le verdict suit la catégorie retenue : si l'utilisateur corrige le type,
      // la reconnaissance automatique ne fait plus foi.
      verified: !!scan?.verified && scan.kind === kind,
      fileName: file.name,
      bytes: scan?.bytes ?? file.size,
      fileId,
      mimeType: file.type,
    });
    // Le média reste en base : c'est le dossier qui le possède désormais
    setFileId(null);
    setFile(null);
    setRotation(0);
    setScan(null);
  };

  const humanSize = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} Mo` : `${Math.round(b / 1000)} Ko`);

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { pick(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => { pick(e.target.files); e.target.value = ""; }}
      />

      <div className="flex flex-wrap gap-2">
        {/* L'appareil photo n'a de sens que sur un appareil qui en a un */}
        {isMobile && (
          <Button size="lg" variant="accent" icon={Camera} className="flex-1" onClick={() => cameraRef.current?.click()}>
            {t("doc.takePhoto")}
          </Button>
        )}
        <Button
          size="lg"
          variant={isMobile ? "outline" : "accent"}
          icon={isMobile ? Images : FileText}
          className="flex-1"
          onClick={() => galleryRef.current?.click()}
        >
          {label || (isMobile ? t("doc.fromGallery") : t("doc.addFile"))}
        </Button>
      </div>

      {/* ------------------------------------------- Cadrage et confirmation */}
      <Modal
        open={!!file}
        onClose={reset}
        title={t("doc.confirmTitle")}
        description={file?.name}
        footer={
          <>
            <Button size="lg" variant="accent" icon={Check} disabled={scanning || storing || !fileId} onClick={confirm}>
              {t("doc.addToFile")}
            </Button>
            {!scan && (
              <Button size="lg" variant="outline" icon={ScanLine} disabled={scanning} onClick={runScan}>
                {scanning ? t("doc.scanning") : t("doc.scan")}
              </Button>
            )}
            <Button size="lg" variant="ghost" icon={X} onClick={reset}>{t("common.cancel")}</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-xl bg-muted">
            {preview ? (
              <div className="grid min-h-[220px] place-items-center p-3">
                <img
                  src={preview}
                  alt=""
                  className="max-h-[46dvh] w-auto rounded-lg object-contain transition-transform duration-200 motion-reduce:transition-none"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </div>
            ) : (
              <div className="grid min-h-[180px] place-items-center gap-2 p-6 text-center">
                <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">{t("doc.pdfNoPreview")}</p>
              </div>
            )}

            {(scanning || storing) && (
              <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
                  <p role="status" className="text-sm font-medium">{storing ? t("doc.storing") : t("doc.scanning")}</p>
                </div>
              </div>
            )}
          </div>

          {isImage && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" icon={RotateCw} onClick={() => setRotation((r) => (r + 90) % 360)}>
                {t("doc.rotate")}
              </Button>
              {file && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {humanSize(file.size)}
                  {scan && scan.bytes !== file.size && ` → ${humanSize(scan.bytes)}`}
                </span>
              )}
            </div>
          )}

          {scan && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge strong tone={scan.verified ? "green" : "amber"}>
                  {scan.verified
                    ? <><ShieldCheck className="size-3" aria-hidden="true" />{t("profile.verified")}</>
                    : <><AlertTriangle className="size-3" aria-hidden="true" />{t("doc.toConfirm")}</>}
                </Badge>
                <Badge tone="blue">{tv(scan.label)}</Badge>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("doc.confidence", { pct: String(Math.round(scan.confidence * 100)) })}
                </span>
              </div>

              {scan.warnings.map((w, i) => (
                <Alert key={i} tone="amber" icon={AlertTriangle} title={t("doc.checkThis")}>
                  {w[locale] || w.fr}
                </Alert>
              ))}
            </div>
          )}

          <Field label={t("doc.category")} hint={t("doc.categoryHint")}>
            {/* Huit catégories : la liste déroulante reste plus lisible que des pilules */}
            <Select
              aria-label={t("doc.category")}
              value={kind}
              onChange={(e: any) => setKind(e.target.value)}
              options={KIND_OPTIONS.map((o) => ({ value: o.value, label: t(o.key) }))}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
