/**
 * Couche de composition applicative.
 *
 * Remplace l'ancien `kit.tsx`, qui redéfinissait ses propres boutons, listes
 * déroulantes et modales en marge des 48 primitives shadcn déjà présentes.
 *
 * Règles :
 *   - aucune primitive n'est réimplémentée ici, tout descend de `components/ui/*` ;
 *   - aucune couleur codée en dur, uniquement les tokens du thème
 *     (`primary`, `secondary`, `success`, `warning`, `destructive`, `muted`) ;
 *   - seules les compositions propres au produit vivent ici : Page, PageHeader,
 *     StatCard, SectionTitle, Field, EmptyState, RatingBar, et les états
 *     transverses (chargement, erreur, hors ligne).
 */

import * as React from "react";
import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, WifiOff, Inbox, Star, X } from "lucide-react";

import { cn } from "@/app/components/ui/utils";
import { Button as UIButton } from "@/app/components/ui/button";
import { Card as UICard, CardContent } from "@/app/components/ui/card";
import { Badge as UIBadge } from "@/app/components/ui/badge";
import { Input as UIInput } from "@/app/components/ui/input";
import { Textarea as UITextarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Progress as UIProgress } from "@/app/components/ui/progress";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Alert as UIAlert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Tabs as UITabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle,
} from "@/app/components/ui/drawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import { useIsMobile } from "@/app/hooks/useMediaQuery";
import { feedback } from "@/app/lib/feedback";
import {
  Select as UISelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";

/* ------------------------------------------------------------------ */
/* Tons sémantiques                                                    */
/* ------------------------------------------------------------------ */

export type Tone = "neutral" | "blue" | "orange" | "green" | "red" | "violet" | "amber";

/** Surface douce + texte lisible, par ton. Aucune valeur hexadécimale. */
const TONE_SOFT: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  blue: "bg-primary/10 text-primary",
  orange: "bg-secondary/10 text-secondary",
  green: "bg-success-subtle text-success",
  red: "bg-destructive/10 text-destructive",
  violet: "bg-chart-4/15 text-chart-4",
  amber: "bg-warning-subtle text-warning",
};

/**
 * Variante haut contraste des statuts, pour la lecture en extérieur.
 * Fond saturé + texte inversé : lisible en plein soleil, sur un écran sale,
 * à bout de bras. C'est le mode par défaut des badges de statut.
 */
const TONE_STRONG: Record<Tone, string> = {
  neutral: "bg-foreground/80 text-background",
  blue: "bg-primary text-primary-foreground",
  orange: "bg-secondary text-secondary-foreground",
  green: "bg-success text-success-foreground",
  red: "bg-destructive text-destructive-foreground",
  violet: "bg-chart-4 text-background",
  amber: "bg-warning text-warning-foreground",
};

/** Aplat saturé, pour les pastilles de score et les jauges. */
const TONE_SOLID: Record<Tone, string> = {
  neutral: "bg-muted-foreground text-background",
  blue: "bg-primary text-primary-foreground",
  orange: "bg-secondary text-secondary-foreground",
  green: "bg-success text-success-foreground",
  red: "bg-destructive text-destructive-foreground",
  violet: "bg-chart-4 text-background",
  amber: "bg-warning text-warning-foreground",
};

export const toneSoft = (tone: Tone = "neutral") => TONE_SOFT[tone] ?? TONE_SOFT.neutral;
export const toneSolid = (tone: Tone = "neutral") => TONE_SOLID[tone] ?? TONE_SOLID.neutral;
export const toneStrong = (tone: Tone = "neutral") => TONE_STRONG[tone] ?? TONE_STRONG.neutral;

/* ------------------------------------------------------------------ */
/* Mise en page                                                        */
/* ------------------------------------------------------------------ */

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 md:px-6 md:py-8", wide ? "max-w-7xl" : "max-w-5xl")}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-balance md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export function Card({ children, className = "", padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <UICard className={cn("gap-0 py-0", className)}>
      <CardContent className={cn(padded ? "p-5" : "p-0")}>{children}</CardContent>
    </UICard>
  );
}

export function SectionTitle({ icon: Icon, children, right }: { icon?: any; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
        <span className="text-balance">{children}</span>
      </h2>
      {right}
    </div>
  );
}

export function StatCard({
  icon: Icon, label, value, delta, tone = "blue", hint,
}: { icon?: any; label: string; value: ReactNode; delta?: string; tone?: Tone; hint?: string }) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between">
        {Icon && (
          <span className={cn("grid size-10 place-items-center rounded-xl", toneSoft(tone))}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        {delta && (
          <span className={cn("rounded-full px-2 py-1 text-xs font-medium tabular-nums", toneSoft(tone))}>{delta}</span>
        )}
      </div>
      <div className="text-2xl font-bold leading-tight tabular-nums md:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      {hint && <div className="mt-2 text-xs text-muted-foreground/80 text-pretty">{hint}</div>}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Primitives adaptées                                                 */
/* ------------------------------------------------------------------ */

/** Mappe les tons produit sur les variantes shadcn. */
const BADGE_VARIANT: Record<Tone, "default" | "secondary" | "destructive" | "outline"> = {
  neutral: "outline", blue: "default", orange: "secondary",
  green: "outline", red: "destructive", violet: "outline", amber: "outline",
};

export function Badge({
  children, tone = "neutral", strong = false, className = "",
}: { children: ReactNode; tone?: Tone; strong?: boolean; className?: string }) {
  if (strong) {
    return (
      <UIBadge variant="outline" className={cn("gap-1 border-transparent font-semibold", toneStrong(tone), className)}>
        {children}
      </UIBadge>
    );
  }
  const needsTone = tone === "green" || tone === "amber" || tone === "violet" || tone === "neutral";
  return (
    <UIBadge
      variant={BADGE_VARIANT[tone] ?? "outline"}
      className={cn("gap-1", needsTone && cn(toneSoft(tone), "border-transparent"), className)}
    >
      {children}
    </UIBadge>
  );
}

export function Progress({ value, tone = "blue", height }: { value: number; tone?: Tone; height?: number }) {
  const indicator: Record<Tone, string> = {
    neutral: "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
    blue: "[&_[data-slot=progress-indicator]]:bg-primary",
    orange: "[&_[data-slot=progress-indicator]]:bg-secondary",
    green: "[&_[data-slot=progress-indicator]]:bg-success",
    red: "[&_[data-slot=progress-indicator]]:bg-destructive",
    violet: "[&_[data-slot=progress-indicator]]:bg-chart-4",
    amber: "[&_[data-slot=progress-indicator]]:bg-warning",
  };
  return (
    <UIProgress
      value={Math.max(0, Math.min(100, value))}
      className={cn("bg-muted", height === 4 ? "h-1" : height === 12 ? "h-3" : "h-2", indicator[tone] ?? indicator.blue)}
    />
  );
}

export function RatingBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="flex items-center gap-1 font-medium tabular-nums">
          <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
          {value.toFixed(1)}
        </span>
      </div>
      <Progress value={(value / max) * 100} tone={value / max >= 0.7 ? "green" : "amber"} />
    </div>
  );
}

/** Variantes produit → variantes shadcn. `accent` cible la couleur secondaire. */
const BUTTON_VARIANT: Record<string, any> = {
  primary: "default", accent: "secondary", ghost: "ghost",
  outline: "outline", danger: "destructive", link: "link",
};

/**
 * Hauteurs pensées pour le doigt, pas pour le curseur.
 * `sm` reste au-dessus des 44 px recommandés, `lg` sert aux actions principales.
 */
const BUTTON_SIZE: Record<string, string> = {
  sm: "h-11 px-4 text-sm",
  md: "h-12 px-5",
  lg: "h-14 px-6 text-base font-semibold",
};

export function Button({
  children, onClick, variant = "primary", size = "md", icon: Icon,
  type = "button", disabled, className = "", haptic = true, ...rest
}: any) {
  const handle = (e: any) => {
    if (disabled) return;
    if (haptic) feedback.tap();
    onClick?.(e);
  };

  return (
    <UIButton
      type={type}
      onClick={handle}
      disabled={disabled}
      variant={BUTTON_VARIANT[variant] ?? "default"}
      size="default"
      className={cn(
        "rounded-xl transition-transform duration-100 active:scale-95",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        BUTTON_SIZE[size] ?? BUTTON_SIZE.md,
        className
      )}
      {...rest}
    >
      {Icon && <Icon className={size === "lg" ? "size-5" : "size-4"} aria-hidden="true" />}
      {children}
    </UIButton>
  );
}

/**
 * Groupe de pilules, en remplacement des listes déroulantes à faible cardinalité.
 * Un choix = une pression, au lieu d'ouvrir, viser, fermer.
 */
export function ChipGroup({
  value, onChange, options, ariaLabel, multiple = false, className = "",
}: {
  value: any;
  onChange: (v: any) => void;
  options: { value: string; label: ReactNode; icon?: any }[];
  ariaLabel: string;
  multiple?: boolean;
  className?: string;
}) {
  return (
    <ToggleGroup
      type={(multiple ? "multiple" : "single") as any}
      value={value}
      onValueChange={(v: any) => {
        // Radix renvoie "" quand on déselectionne : on garde la valeur courante
        if (!multiple && (v === "" || v == null)) return;
        feedback.tap();
        onChange(v);
      }}
      aria-label={ariaLabel}
      className={cn("flex flex-wrap justify-start gap-2 bg-transparent p-0", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          aria-label={typeof o.label === "string" ? o.label : o.value}
          className={cn(
            "h-11 min-w-11 shrink-0 rounded-full border border-border px-4 text-sm font-medium",
            "transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100",
            "data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          )}
        >
          {o.icon && <o.icon className="size-4" aria-hidden="true" />}
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function Field({ label, children, hint, required, htmlFor }: { label: string; children: ReactNode; hint?: string; required?: boolean; htmlFor?: string }) {
  return (
    <div className="mb-4 block">
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label} {required && <span className="text-destructive" aria-hidden="true">*</span>}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground text-pretty">{hint}</p>}
    </div>
  );
}

export function Input(props: any) {
  return <UIInput {...props} className={cn("h-12 rounded-xl text-base md:text-sm", props.className)} />;
}

export function Textarea(props: any) {
  return <UITextarea {...props} className={cn("min-h-[110px] rounded-xl text-base md:text-sm", props.className)} />;
}

/**
 * Liste déroulante Radix, exposée avec l'API de l'ancien kit
 * (`options` + `onChange` façon événement DOM) pour ne pas réécrire
 * les 15 points d'appel. Radix interdit `value=""` : la valeur vide est
 * transposée sur une sentinelle interne.
 */
const EMPTY = "__empty__";

export function Select({ options, value, onChange, "aria-label": ariaLabel, className, disabled, ...rest }: any) {
  const list = options || [];
  const placeholder = list.find((o: any) => o.value === "")?.label;

  return (
    <UISelectRoot
      value={value === "" || value === undefined ? EMPTY : String(value)}
      onValueChange={(v: string) => onChange?.({ target: { value: v === EMPTY ? "" : v } })}
      disabled={disabled}
      {...rest}
    >
      <SelectTrigger aria-label={ariaLabel} className={cn("h-12 w-full rounded-xl text-base md:text-sm", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {list.map((o: any) => (
          <SelectItem key={o.value === "" ? EMPTY : o.value} value={o.value === "" ? EMPTY : String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </UISelectRoot>
  );
}

/**
 * Surface modale adaptative.
 *
 * Au-dessus de 768 px : Dialog Radix centré, à la souris.
 * En dessous : panneau glissant vaul, fermable d'un geste du pouce vers le bas.
 * L'API ne change pas, tous les points d'appel existants en bénéficient.
 */
export function Modal({ open, onClose, title, description, children, footer, width = "max-w-2xl" }: any) {
  const isMobile = useIsMobile();
  const handleOpenChange = (o: boolean) => { if (!o) onClose?.(); };

  if (isMobile) {
    return (
      <Drawer open={!!open} onOpenChange={handleOpenChange} repositionInputs={false}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="shrink-0 border-b text-left">
            <DrawerTitle className="text-base text-balance">{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : (
              <DrawerDescription className="sr-only">{title}</DrawerDescription>
            )}
          </DrawerHeader>

          <div className="overflow-y-auto px-4 py-5">{children}</div>

          {footer && (
            <DrawerFooter className="shrink-0 gap-2 border-t pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:w-full">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={!!open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("flex max-h-[92dvh] flex-col gap-0 p-0", width)}>
        <DialogHeader className="shrink-0 border-b px-5 py-4 text-left">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <DialogFooter className="shrink-0 border-t px-5 py-4">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confirmation d'une action irréversible.
 *
 * AlertDialog sur desktop — il piège le focus et n'accepte pas de fermeture
 * accidentelle par clic extérieur, ce qu'un Dialog ordinaire autorise.
 * Panneau glissant sur mobile, avec les deux actions empilées à portée
 * du pouce et la destructive en premier, à l'endroit où le doigt tombe.
 */
export function ConfirmSheet({
  open, onOpenChange, title, description, confirmLabel, cancelLabel,
  onConfirm, tone = "red", details,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  tone?: "red" | "orange" | "blue";
  details?: ReactNode;
}) {
  const isMobile = useIsMobile();
  const confirmClass = tone === "red"
    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    : tone === "orange"
      ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
      : "";

  const handleConfirm = () => {
    feedback.tap();
    onConfirm();
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-balance">{title}</DrawerTitle>
            {description
              ? <DrawerDescription className="text-pretty">{description}</DrawerDescription>
              : <DrawerDescription className="sr-only">{title}</DrawerDescription>}
          </DrawerHeader>
          {details && <div className="px-4 pb-2">{details}</div>}
          <DrawerFooter className="gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button size="lg" variant={tone === "red" ? "danger" : "accent"} className="w-full" onClick={handleConfirm}>
              {confirmLabel}
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-balance">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="text-pretty">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {details}
        <AlertDialogFooter>
          <AlertDialogCancel className="h-12 rounded-xl">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction className={cn("h-12 rounded-xl", confirmClass)} onClick={handleConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Table({ columns, rows, empty }: { columns: string[]; rows: ReactNode[][]; empty?: string }) {
  if (!rows.length) return <EmptyState label={empty || "—"} />;
  return (
    <div className="overflow-x-auto">
      <UITable>
        <TableHeader>
          <TableRow>
            {columns.map((c, i) => (
              <TableHead key={i} className="whitespace-nowrap">{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((cell, k) => (
                <TableCell key={k} className="align-middle">{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </UITable>
    </div>
  );
}

export function Tabs({ items, value, onChange }: { items: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <UITabs value={value} onValueChange={onChange}>
      <TabsList className="flex w-full flex-wrap justify-start">
        {items.map((it) => (
          <TabsTrigger key={it.id} value={it.id}>{it.label}</TabsTrigger>
        ))}
      </TabsList>
    </UITabs>
  );
}

export function Avatar({ user, size = 36 }: { user: any; size?: number }) {
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "?";
  return (
    <UIAvatar style={{ width: size, height: size }} className="shrink-0">
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
    </UIAvatar>
  );
}

const ALERT_TONE: Record<string, string> = {
  blue: "border-primary/30 bg-primary/5 text-foreground [&>svg]:text-primary",
  green: "border-success/30 bg-success-subtle text-foreground [&>svg]:text-success",
  amber: "border-warning/30 bg-warning-subtle text-foreground [&>svg]:text-warning",
  orange: "border-secondary/30 bg-secondary/5 text-foreground [&>svg]:text-secondary",
  red: "border-destructive/30 bg-destructive/5 text-foreground [&>svg]:text-destructive",
};

export function Alert({ tone = "blue", title, children, icon: Icon }: any) {
  return (
    <UIAlert className={cn("mb-4", ALERT_TONE[tone] ?? ALERT_TONE.blue)}>
      {Icon && <Icon aria-hidden="true" />}
      {title && <AlertTitle className="text-balance">{title}</AlertTitle>}
      {children && <AlertDescription className="text-pretty">{children}</AlertDescription>}
    </UIAlert>
  );
}

/* ------------------------------------------------------------------ */
/* États transverses : vide, chargement, erreur, hors ligne            */
/* ------------------------------------------------------------------ */

export function EmptyState({ label, description, action, icon: Icon = Inbox }: { label: string; description?: string; action?: ReactNode; icon?: any }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <p className="font-medium text-balance">{label}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Squelette structurel : mêmes gabarits que le contenu réel, pas de roue qui tourne. */
export function LoadingState({ rows = 3, variant = "list" }: { rows?: number; variant?: "list" | "cards" | "table" }) {
  if (variant === "cards") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5">
            <Skeleton className="mb-3 h-5 w-2/3" />
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="mb-4 h-3 w-4/5" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "table") {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }
  return (
    <div className="space-y-2.5" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border p-4">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ title, description, onRetry, retryLabel }: { title: string; description?: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      </span>
      <p className="font-medium text-balance">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>}
      {onRetry && (
        <Button variant="outline" icon={RefreshCw} className="mt-4" onClick={onRetry}>
          {retryLabel || "Réessayer"}
        </Button>
      )}
    </div>
  );
}

/** Vrai statut réseau du navigateur, sans effet pour la valeur initiale. */
export function useOnlineStatus() {
  const subscribe = React.useCallback((cb: () => void) => {
    window.addEventListener("online", cb);
    window.addEventListener("offline", cb);
    return () => {
      window.removeEventListener("online", cb);
      window.removeEventListener("offline", cb);
    };
  }, []);
  return React.useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

export function OfflineBanner({ label, description }: { label: string; description?: string }) {
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = React.useState(false);
  if (online || dismissed) return null;

  return (
    <div role="status" className="sticky top-0 z-50 flex items-center gap-3 border-b border-warning/30 bg-warning-subtle px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
      <WifiOff className="size-4 shrink-0 text-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <span className="font-medium">{label}</span>
        {description && <span className="ml-1 text-muted-foreground text-pretty">{description}</span>}
      </div>
      <button onClick={() => setDismissed(true)} aria-label="Masquer" className="rounded-lg p-1 hover:bg-warning/10">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
