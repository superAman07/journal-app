import { parseContractSymbol, SyncedTradePreview } from "./angel-one-service";

export interface DhanCredentials {
  clientId: string;
  accessToken: string;
}

export interface RawDhanTrade {
  exchangeSegment?: string;
  tradingSymbol?: string;
  transactionType?: "BUY" | "SELL";
  tradedPrice?: number | string;
  tradedQuantity?: number | string;
  exchangeTime?: string;
  orderId?: string;
  tradeId?: string;
}

export async function fetchDhanTrades(creds: DhanCredentials) {
  try {
    const res = await fetch("https://api.dhan.co/v2/trades", {
      method: "GET",
      headers: {
        "access-token": creds.accessToken.trim(),
        "client-id": creds.clientId.trim(),
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (!res.ok || Array.isArray(data) === false) {
      const errMsg = (data && data.remarks) || (data && data.message) || "Failed to fetch Dhan trades";
      return { success: false, error: errMsg };
    }

    const rawTrades: RawDhanTrade[] = data;
    return { success: true, trades: rawTrades };
  } catch (err: any) {
    console.error("[fetchDhanTrades] Error:", err);
    return { success: false, error: err.message || "Failed to reach Dhan API" };
  }
}

export function pairDhanTrades(rawOrders: RawDhanTrade[]): SyncedTradePreview[] {
  if (!rawOrders || rawOrders.length === 0) return [];

  const groups: { [sym: string]: RawDhanTrade[] } = {};

  for (const o of rawOrders) {
    const sym = o.tradingSymbol || "UNKNOWN";
    if (!groups[sym]) groups[sym] = [];
    groups[sym].push(o);
  }

  const completedTrades: SyncedTradePreview[] = [];

  for (const [symbol, orders] of Object.entries(groups)) {
    const sorted = [...orders].sort((a, b) => (a.exchangeTime || "").localeCompare(b.exchangeTime || ""));
    const buys: RawDhanTrade[] = [];
    const sells: RawDhanTrade[] = [];

    for (const o of sorted) {
      if (o.transactionType === "BUY") buys.push(o);
      else if (o.transactionType === "SELL") sells.push(o);
    }

    while (buys.length > 0 && sells.length > 0) {
      const buy = buys.shift()!;
      const sell = sells.shift()!;

      const buyPrice = typeof buy.tradedPrice === "string" ? parseFloat(buy.tradedPrice) : (buy.tradedPrice || 0);
      const sellPrice = typeof sell.tradedPrice === "string" ? parseFloat(sell.tradedPrice) : (sell.tradedPrice || 0);
      const buyQty = typeof buy.tradedQuantity === "string" ? parseFloat(buy.tradedQuantity) : (buy.tradedQuantity || 0);
      const sellQty = typeof sell.tradedQuantity === "string" ? parseFloat(sell.tradedQuantity) : (sell.tradedQuantity || 0);
      const matchedQty = Math.min(buyQty, sellQty);

      const isLong = (buy.exchangeTime || "") <= (sell.exchangeTime || "");
      const actualEntry = isLong ? buyPrice : sellPrice;
      const actualExit = isLong ? sellPrice : buyPrice;
      const optionPoints = parseFloat((isLong ? (sellPrice - buyPrice) : (buyPrice - sellPrice)).toFixed(2));
      const pnl = parseFloat((optionPoints * matchedQty).toFixed(2));

      const { cleanInstrument, market, optionType, strikePrice, lotSize } = parseContractSymbol(symbol);
      const numberOfLots = lotSize > 0 ? Math.max(1, Math.round(matchedQty / lotSize)) : 1;

      const entryTimeStr = (buy.exchangeTime || "09:15:00").split(" ")[1] || buy.exchangeTime || "09:15:00";
      const exitTimeStr = (sell.exchangeTime || "15:30:00").split(" ")[1] || sell.exchangeTime || "15:30:00";

      const outcome: "WIN" | "LOSS" | "BREAKEVEN" =
        pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN";

      completedTrades.push({
        id: `dhan_${buy.tradeId || Date.now()}_${sell.tradeId || Date.now()}`,
        instrument: cleanInstrument,
        market,
        optionType,
        strikePrice,
        optionAction: isLong ? "BUY" : "SELL",
        actualEntry,
        actualExit,
        positionSize: matchedQty,
        lotSize,
        numberOfLots,
        optionPoints,
        pnl,
        outcome,
        entryTime: entryTimeStr,
        exitTime: exitTimeStr,
        tradeDuration: "N/A",
        broker: "Dhan",
        orderId: `${buy.orderId || ""}-${sell.orderId || ""}`,
        selected: true,
      });
    }
  }

  return completedTrades;
}
