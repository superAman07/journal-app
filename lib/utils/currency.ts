const INDIAN_MARKETS = ["Nifty Options", "BankNifty Options", "Sensex Options", "Stock Options"];

export function isIndianMarket(market: string): boolean {
  return INDIAN_MARKETS.includes(market);
}

export function getCurrencyForMarket(market: string): "INR" | "USD" {
  return isIndianMarket(market) ? "INR" : "USD";
}

export function getCurrencySymbol(market: string): string {
  return isIndianMarket(market) ? "₹" : "$";
}

export function formatPnlWithCurrency(pnl: number, market: string): string {
  const isInr = isIndianMarket(market);
  const sym = isInr ? "₹" : "$";
  const abs = Math.abs(pnl);
  const formatted = isInr
    ? abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${pnl >= 0 ? "" : "-"}${sym}${formatted}`;
}

export function formatAggregatedPnl(pnl: number): string {
  const abs = Math.abs(pnl);
  const formatted = abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${pnl >= 0 ? "" : "-"}₹${formatted}`;
}

export function convertUsdToInr(usd: number, rate: number): number {
  return usd * rate;
}

export function convertPnlToInr(pnl: number, market: string, usdToInrRate: number): number {
  if (isIndianMarket(market)) return pnl;
  return pnl * usdToInrRate;
}

const FALLBACK_RATE = 85.0;
const CACHE_KEY = "trading_os_usd_inr";
const CACHE_DURATION = 3600000;

interface CachedRate {
  rate: number;
  timestamp: number;
}

function getCachedRate(): CachedRate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRate = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_DURATION) return parsed;
  } catch {}
  return null;
}

function setCachedRate(rate: number) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
  } catch {}
}

export async function fetchUsdToInrRate(): Promise<number> {
  const cached = getCachedRate();
  if (cached) return cached.rate;

  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=INR", { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      const rate = data.rates?.INR;
      if (rate && typeof rate === "number") {
        setCachedRate(rate);
        return rate;
      }
    }
  } catch {}

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      const rate = data.rates?.INR;
      if (rate && typeof rate === "number") {
        setCachedRate(rate);
        return rate;
      }
    }
  } catch {}

  return FALLBACK_RATE;
}
