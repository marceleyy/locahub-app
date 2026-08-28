import * as React from "react";
import { AlertTriangle, RotateCcw, Home, Trash2 } from "lucide-react";

/**
 * Barrière d'erreur.
 *
 * Une exception de rendu non interceptée démonte tout l'arbre React et laisse
 * une page blanche. Sur un chantier, avec un locataire en face, c'est le pire
 * scénario : plus rien à l'écran et aucune explication.
 *
 * Volontairement écrite sans dépendance au contexte i18n : si le fournisseur
 * de traduction est justement ce qui a planté, un composant qui appelle
 * `useI18n()` planterait à son tour. Les libellés sont donc passés en props,
 * avec un repli bilingue codé en dur.
 */

interface Props {
  children: React.ReactNode;
  /** Identifie la zone en cause dans la console et sur les rapports. */
  scope?: string;
  /** Repli personnalisé, sinon l'écran standard est affiché. */
  fallback?: (reset: () => void, error: Error) => React.ReactNode;
  labels?: Partial<typeof DEFAULT_LABELS.fr>;
}

interface State {
  error: Error | null;
  count: number;
}

const DEFAULT_LABELS = {
  fr: {
    title: "Cette page ne s'est pas ouverte",
    body: "Une erreur inattendue a interrompu l'affichage. Vos données enregistrées sont intactes.",
    retry: "Réessayer",
    reload: "Recharger l'application",
    home: "Retour à l'accueil",
    reset: "Réinitialiser les données locales",
    resetHint: "Dernier recours : efface les données de démonstration stockées sur cet appareil.",
    details: "Détail technique",
  },
  en: {
    title: "This page did not open",
    body: "An unexpected error interrupted rendering. Your saved data is intact.",
    retry: "Try again",
    reload: "Reload the app",
    home: "Back to home",
    reset: "Reset local data",
    resetHint: "Last resort: clears the demo data stored on this device.",
    details: "Technical detail",
  },
};

const pickLocale = (): "fr" | "en" => {
  try {
    const stored = localStorage.getItem("locahub.locale");
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    /* stockage indisponible */
  }
  return typeof navigator !== "undefined" && navigator.language?.startsWith("en") ? "en" : "fr";
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, count: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // En production, c'est ici que part le rapport vers la supervision.
    console.error(`[LocaHub] erreur non interceptée${this.props.scope ? ` — ${this.props.scope}` : ""}`, error, info.componentStack);
  }

  /** Remonte le sous-arbre : suffit pour une erreur transitoire (données absentes, course). */
  reset = () => this.setState((s) => ({ error: null, count: s.count + 1 }));

  hardReset = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("locahub."))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* sans effet */
    }
    window.location.href = "/";
  };

  render() {
    const { error } = this.state;
    if (!error) {
      // La clé force un remontage complet, sinon l'enfant garde son état fautif
      return <React.Fragment key={this.state.count}>{this.props.children}</React.Fragment>;
    }

    if (this.props.fallback) return this.props.fallback(this.reset, error);

    const l = { ...DEFAULT_LABELS[pickLocale()], ...this.props.labels };

    return (
      <div role="alert" className="grid min-h-dvh place-items-center bg-background p-6">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
          </span>

          <h1 className="mb-2 text-lg font-semibold text-balance">{l.title}</h1>
          <p className="mb-6 text-sm text-muted-foreground text-pretty">{l.body}</p>

          <div className="flex flex-col gap-2">
            <button
              onClick={this.reset}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
            >
              <RotateCcw className="size-5" aria-hidden="true" />
              {l.retry}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
            >
              {l.reload}
            </button>
            <a
              href="/"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm text-muted-foreground hover:bg-accent"
            >
              <Home className="size-4" aria-hidden="true" />
              {l.home}
            </a>
          </div>

          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground">{l.details}</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-muted p-3 text-[11px] leading-relaxed">
              {error.name}: {error.message}
            </pre>
          </details>

          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-xs text-muted-foreground text-pretty">{l.resetHint}</p>
            <button
              onClick={this.hardReset}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {l.reset}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Variante compacte pour isoler un module dans une page.
 * Le reste de l'écran reste utilisable même si un widget tombe.
 */
export function ModuleBoundary({ children, scope, label }: { children: React.ReactNode; scope?: string; label?: string }) {
  const l = DEFAULT_LABELS[pickLocale()];
  return (
    <ErrorBoundary
      scope={scope}
      fallback={(reset) => (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 size-5 text-destructive" aria-hidden="true" />
          <p className="mb-3 text-sm font-medium text-balance">{label || l.title}</p>
          <button
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm transition-transform duration-100 active:scale-95"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {l.retry}
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
