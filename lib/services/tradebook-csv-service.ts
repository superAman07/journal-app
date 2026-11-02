import { parseContractSymbol, SyncedTradePreview } from "./angel-one-service";

export interface ParsedCsvOrder {
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  time: string;
  orderId?: string;
}

export function parseTradebookCSV(csvText: string): SyncedTradePreview[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(",").map((h) => h.trim().replace(/["']/g, ""));

  const symbolIdx = headers.findIndex((h) =>
    h.includes("symbol") || h.includes("instrument") || h.includes("scrip")
  );
  const typeIdx = headers.findIndex((h) =>
    h.includes("type") || h.includes("buy/sell") || h.includes("transaction") || h.includes("side") || h.includes("action")
  );
  const priceIdx = headers.findIndex((h) =>
    h.includes("price") || h.includes("rate") || h.includes("avg")
  );
  const qtyIdx = headers.findIndex((h) =>
    h.includes("qty") || h.includes("quantity") || h.includes("shares") || h.includes("size")
  );
  const timeIdx = headers.findIndex((h) =>
    h.includes("time") || h.includes("date")
  );
  const orderIdIdx = headers.findIndex((h) =>
    h.includes("order") || h.includes("trade id")
  );

  if (symbolIdx === -1 || typeIdx === -1 || priceIdx === -1 || qtyIdx === -1) {
    throw new Error("CSV format not recognized. Ensure columns contain Symbol, Buy/Sell, Price, and Quantity.");
  }

  const rawOrders: ParsedCsvOrder[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",").map((c) => c.trim().replace(/["']/g, ""));
    if (row.length <= Math.max(symbolIdx, typeIdx, priceIdx, qtyIdx)) continue;

    const sym = row[symbolIdx]?.toUpperCase() || "";
    const rawType = row[typeIdx]?.toUpperCase() || "";
    const isBuy = rawType.startsWith("B") || rawType.includes("BUY");
    const isSell = rawType.startsWith("S") || rawType.includes("SELL");

    if (!sym || (!isBuy && !isSell)) continue;

    const price = parseFloat(row[priceIdx]?.replace(/[^0-9.]/g, "")) || 0;
    const qty = parseFloat(row[qtyIdx]?.replace(/[^0-9.]/g, "")) || 0;
    const time = (timeIdx !== -1 ? row[timeIdx] : "") || new Date().toISOString();
    const orderId = orderIdIdx !== -1 ? row[orderIdIdx] : `csv_${i}`;

    if (price > 0 && qty > 0) {
      rawOrders.push({
        symbol: sym,
        type: isBuy ? "BUY" : "SELL",
        price,
        quantity: qty,
        time,
        orderId,
      });
    }
  }

  // Pair raw orders into completed round-trip trades
  const groups: { [sym: string]: ParsedCsvOrder[] } = {};
  for (const o of rawOrders) {
    if (!groups[o.symbol]) groups[o.symbol] = [];
    groups[o.symbol].push(o);
  }

  const completedTrades: SyncedTradePreview[] = [];

  for (const [symbol, orders] of Object.entries(groups)) {
    const buys = orders.filter((o) => o.type === "BUY");
    const sells = orders.filter((o) => o.type === "SELL");

    while (buys.length > 0 && sells.length > 0) {
      const buy = buys.shift()!;
      const sell = sells.shift()!;
      const matchedQty = Math.min(buy.quantity, sell.quantity);

      const isLong = (buy.time || "") <= (sell.time || "");
      const actualEntry = isLong ? buy.price : sell.price;
      const actualExit = isLong ? sell.price : buy.price;
      const optionPoints = parseFloat((isLong ? (sell.price - buy.price) : (buy.price - sell.price)).toFixed(2));
      const pnl = parseFloat((optionPoints * matchedQty).toFixed(2));

      const { cleanInstrument, market, optionType, strikePrice, lotSize } = parseContractSymbol(symbol);
      const numberOfLots = lotSize > 0 ? Math.max(1, Math.round(matchedQty / lotSize)) : 1;

      const outcome: "WIN" | "LOSS" | "BREAKEVEN" =
        pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN";

      completedTrades.push({
        id: `csv_${buy.orderId || Date.now()}_${sell.orderId || Date.now()}`,
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
        entryTime: buy.time || "09:15:00",
        exitTime: sell.time || "15:30:00",
        tradeDuration: "N/A",
        broker: "CSV Tradebook",
        orderId: `${buy.orderId || ""}-${sell.orderId || ""}`,
        selected: true,
      });
    }
  }

  return completedTrades;
}
