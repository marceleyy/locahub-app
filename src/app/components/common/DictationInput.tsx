import * as React from "react";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Textarea } from "@/app/components/ui/textarea";
import { Input as UIInput } from "@/app/components/ui/input";
import { feedback } from "@/app/lib/feedback";
import { useI18n } from "@/app/i18n/I18nProvider";

/**
 * Champ de saisie avec dictée.
 *
 * `SpeechRecognition` n'est pas standardisée : disponible sur Chrome, Edge et
 * Safari, absente de Firefox et de la plupart des navigateurs Android tiers.
 * Le bouton n'apparaît donc que si l'API répond présente — repli silencieux
 * sur le clavier, jamais de bouton mort ni de message d'erreur inutile.
 *
 * Règle de sécurité : la transcription atterrit toujours dans le champ texte,
 * relisible et corrigeable. Rien n'est envoyé sur la seule foi de la voix.
 */

type SpeechRecognitionLike = any;

function getRecognitionCtor(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/** Disponibilité de la dictée, évaluée une seule fois. */
export const isDictationSupported = () => !!getRecognitionCtor();

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  rows?: number;
  "aria-label"?: string;
  id?: string;
}

export function DictationInput({
  value, onChange, placeholder, multiline = true, className, "aria-label": ariaLabel, id,
}: Props) {
  const { locale, market, t } = useI18n();
  const [listening, setListening] = React.useState(false);
  const [interim, setInterim] = React.useState("");
  const [starting, setStarting] = React.useState(false);

  const recognitionRef = React.useRef<SpeechRecognitionLike>(null);
  // Le texte figé au démarrage : la transcription s'ajoute derrière, sans l'écraser
  const baseRef = React.useRef("");

  const supported = React.useMemo(() => isDictationSupported(), []);

  // Étiquette de langue précise : le québécois et le français hexagonal
  // ne se transcrivent pas avec le même modèle acoustique.
  const speechLang = React.useMemo(() => {
    if (locale === "en") return market === "QC" ? "en-CA" : "en-GB";
    return market === "QC" ? "fr-CA" : "fr-FR";
  }, [locale, market]);

  const stop = React.useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* déjà arrêtée */
    }
    setListening(false);
    setInterim("");
  }, []);

  React.useEffect(() => () => stop(), [stop]);

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    setStarting(true);
    const recognition = new Ctor();
    recognitionRef.current = recognition;

    recognition.lang = speechLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    baseRef.current = value ? value.trimEnd() + " " : "";

    recognition.onstart = () => {
      setStarting(false);
      setListening(true);
      feedback.tap();
    };

    recognition.onresult = (event: any) => {
      let final = "";
      let partial = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += chunk;
        else partial += chunk;
      }
      if (final) {
        baseRef.current = `${baseRef.current}${final}`.replace(/\s+/g, " ");
        onChange(baseRef.current);
      }
      setInterim(partial);
    };

    recognition.onerror = (event: any) => {
      setStarting(false);
      setListening(false);
      setInterim("");
      // « aborted » et « no-speech » sont des fins normales, pas des pannes
      if (event.error === "aborted" || event.error === "no-speech") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        feedback.error(t("dictation.denied"));
        return;
      }
      feedback.error(t("dictation.failed"));
    };

    recognition.onend = () => {
      setStarting(false);
      setListening(false);
      setInterim("");
    };

    try {
      recognition.start();
    } catch {
      setStarting(false);
      feedback.error(t("dictation.failed"));
    }
  };

  const Field: any = multiline ? Textarea : UIInput;

  return (
    <div className="relative">
      <Field
        id={id}
        value={listening && interim ? `${value}${value ? " " : ""}${interim}` : value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "rounded-xl text-base md:text-sm",
          multiline ? "min-h-[130px] pb-14" : "h-12 pr-14",
          listening && "ring-2 ring-destructive/40",
          className
        )}
      />

      {supported && (
        <button
          type="button"
          onClick={() => (listening ? stop() : start())}
          aria-label={listening ? t("dictation.stop") : t("dictation.start")}
          aria-pressed={listening}
          className={cn(
            "absolute grid size-11 place-items-center rounded-full transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100",
            multiline ? "bottom-2 right-2" : "right-1 top-1/2 -translate-y-1/2",
            listening ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          {starting ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : listening ? (
            <Square className="size-4 fill-current" aria-hidden="true" />
          ) : (
            <Mic className="size-5" aria-hidden="true" />
          )}
        </button>
      )}

      {listening && (
        <p role="status" className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
          <span className="size-2 animate-pulse rounded-full bg-destructive" />
          {t("dictation.listening")}
        </p>
      )}

      {!supported && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MicOff className="size-3" aria-hidden="true" />
          {t("dictation.unsupported")}
        </p>
      )}

      {supported && !listening && (
        <p className="mt-1.5 text-xs text-muted-foreground text-pretty">{t("dictation.hint")}</p>
      )}
    </div>
  );
}
