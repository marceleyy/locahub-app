import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dictionary, LOCALES } from "@/app/i18n/dictionary";
import type { Locale } from "@/app/i18n/dictionary";
import { getMarket, MARKET_LIST } from "@/app/config/markets";
import type { MarketCode } from "@/app/config/markets";

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  market: MarketCode;
  setMarket: (m: MarketCode) => void;
  m: any;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tv: (value: any) => string;
  money: (amount: number, opts?: { decimals?: boolean }) => string;
  date: (value: string | Date, style?: "short" | "long") => string;
  percent: (value: number, digits?: number) => string;
  locales: typeof LOCALES;
  markets: MarketCode[];
};

const I18nContext = createContext<I18nValue | null>(null);

const LS_LOCALE = "locahub.locale";
const LS_MARKET = "locahub.market";

function readStored(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* mode privé : on ignore */
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStored(LS_LOCALE, "fr") as Locale);
  const [market, setMarketState] = useState<MarketCode>(() => readStored(LS_MARKET, "FR") as MarketCode);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nValue>(() => {
    const m = getMarket(market);
    const intlLocale = m.intlLocale[locale] || (locale === "fr" ? "fr-FR" : "en-US");

    const t = (key: string, vars?: Record<string, string | number>) => {
      let out = dictionary[locale]?.[key] ?? dictionary.fr[key] ?? key;
      if (vars) {
        Object.keys(vars).forEach((k) => {
          out = out.replace(new RegExp(`{${k}}`, "g"), String(vars[k]));
        });
      }
      return out;
    };

    // Traduit une valeur localisée provenant de la config marché : { fr, en } ou string
    const tv = (val: any): string => {
      if (val == null) return "";
      if (typeof val === "string") return val;
      return val[locale] ?? val.fr ?? "";
    };

    const money = (amount: number, opts?: { decimals?: boolean }) => {
      const digits = opts?.decimals ? 2 : 0;
      try {
        return new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency: m.currency,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(amount);
      } catch {
        return `${amount} ${m.currencySymbol}`;
      }
    };

    const date = (val: string | Date, style: "short" | "long" = "short") => {
      const d = typeof val === "string" ? new Date(val) : val;
      if (isNaN(d.getTime())) return String(val);
      try {
        return new Intl.DateTimeFormat(
          intlLocale,
          style === "long"
            ? { day: "numeric", month: "long", year: "numeric" }
            : { day: "2-digit", month: "2-digit", year: "numeric" }
        ).format(d);
      } catch {
        return d.toISOString().slice(0, 10);
      }
    };

    const percent = (val: number, digits = 1) => `${val.toFixed(digits)} %`;

    return {
      locale,
      setLocale: (l: Locale) => {
        setLocaleState(l);
        persist(LS_LOCALE, l);
      },
      market,
      setMarket: (mk: MarketCode) => {
        setMarketState(mk);
        persist(LS_MARKET, mk);
      },
      m,
      t,
      tv,
      money,
      date,
      percent,
      locales: LOCALES,
      markets: MARKET_LIST,
    };
  }, [locale, market]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé à l'intérieur de <I18nProvider>");
  return ctx;
}
