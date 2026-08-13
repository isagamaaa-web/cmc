import { useEffect, useState } from "react";
import { SERVICE_PRICES } from "@/lib/clinic-data";
import { listPrices } from "@/lib/prices.functions";

const CACHE_KEY = "cmc_prices_v1";

function readCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * Live, clinic-wide prices. Falls back to the cached copy (offline) and then to
 * the built-in defaults, so a price always renders instantly.
 */
export function usePrices() {
  const [map, setMap] = useState<Record<string, string>>(() => ({
    ...SERVICE_PRICES,
    ...readCache(),
  }));

  useEffect(() => {
    let alive = true;
    listPrices()
      .then((rows) => {
        if (!alive || !rows?.length) return;
        const next = Object.fromEntries(rows.map((r) => [r.title, r.price]));
        setMap({ ...SERVICE_PRICES, ...next });
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* offline — cached/default prices stay */
      });
    return () => {
      alive = false;
    };
  }, []);

  return {
    prices: map,
    priceOf: (title: string) => map[title] ?? SERVICE_PRICES[title],
  };
}
