import crypto from "crypto";

export interface AngelOneCredentials {
  clientCode: string;
  password: string; // Password or MPIN
  apiKey: string;
  totpSecret: string;
}

export interface RawAngelTrade {
  exchange?: string;
  tradingsymbol?: string;
  symboltoken?: string;
  transactiontype?: "BUY" | "SELL";
  fillprice?: string | number;
  fillsize?: string | number;
  filltime?: string;
  orderid?: string;
  tradeid?: string;
  producttype?: string;
}

export interface SyncedTradePreview {
  id: string; // unique key for UI selection
  instrument: string;
  market: string;
  optionType?: "CALL (CE)" | "PUT (PE)";
  strikePrice?: number;
  optionAction: "BUY" | "SELL";
  actualEntry: number;
  actualExit: number;
  positionSize: number;
  lotSize: number;
  numberOfLots: number;
  optionPoints: number;
  pnl: number;
  outcome: "WIN" | "LOSS" | "BREAKEVEN";
  entryTime: string;
  exitTime: string;
  tradeDuration: string;
  broker: string;
  orderId?: string;
  selected?: boolean;
}

// ── Native RFC 6238 TOTP Generator (Zero external dependencies) ──
function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = base32.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTOTP(secret: string, stepSeconds = 30, digits = 6): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / stepSeconds);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (code % 10 ** digits).toString().padStart(digits, "0");
}

let cachedPublicIp = "";
export async function getPublicIp(): Promise<string> {
  if (cachedPublicIp) return cachedPublicIp;
  try {
    const res = await fetch("https://api.ipify.org", { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      cachedPublicIp = (await res.text()).trim();
      return cachedPublicIp;
    }
  } catch {
    // fallback
  }
  return "127.0.0.1";
}

// ── Authenticate with Angel One SmartAPI ──
export async function authenticateAngelOne(creds: AngelOneCredentials) {
  try {
    const totp = generateTOTP(creds.totpSecret);
    const publicIp = await getPublicIp();

    const res = await fetch("https://apiconnect.angelbroking.com/rest/auth/partner/v1/generate-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": publicIp,
        "X-MACAddress": "fe80::1",
        "X-PrivateKey": creds.apiKey.trim(),
      },
      body: JSON.stringify({
        clientcode: creds.clientCode.trim().toUpperCase(),
        password: creds.password.trim(),
        totp,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (!res.ok || !data.status || !data.data?.jwtToken) {
      const errMsg = data.message || data.errorcode || "Angel One authentication failed";
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      jwtToken: data.data.jwtToken as string,
      feedToken: data.data.feedToken as string,
      refreshToken: data.data.refreshToken as string,
    };
  } catch (err: any) {
    console.error("[authenticateAngelOne] Error:", err);
    return { success: false, error: err.message || "Failed to connect to Angel One API" };
  }
}

// ── Fetch Today's Tradebook from Angel One ──
export async function fetchAngelOneTradebook(jwtToken: string, apiKey: string) {
  try {
    const publicIp = await getPublicIp();
    const res = await fetch("https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getTradeBook", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": publicIp,
        "X-MACAddress": "fe80::1",
        "X-PrivateKey": apiKey.trim(),
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      const errMsg = data.message || "Failed to fetch tradebook from Angel One";
      return { success: false, error: errMsg };
    }

    const rawTrades: RawAngelTrade[] = data.data || [];
    return { success: true, trades: rawTrades };
  } catch (err: any) {
    console.error("[fetchAngelOneTradebook] Error:", err);
    return { success: false, error: err.message || "Failed to retrieve trades" };
  }
}

// ── Parse Symbol Name to Clean Trading OS Format ──
export function parseContractSymbol(symbol: string): {
  cleanInstrument: string;
  market: string;
  optionType?: "CALL (CE)" | "PUT (PE)";
  strikePrice?: number;
  lotSize: number;
} {
  const upper = symbol.toUpperCase().trim();

  // NIFTY options (e.g., NIFTY07NOV2424500PE or NIFTY24N0724500PE or NIFTY24500PE)
  const isNifty = upper.includes("NIFTY") && !upper.includes("BANK");
  const isBankNifty = upper.includes("BANKNIFTY");
  const isFinNifty = upper.includes("FINNIFTY");
  const isSensex = upper.includes("SENSEX");

  let lotSize = 25; // Default Nifty lot size
  let market = "Nifty Options";

  if (isBankNifty) {
    lotSize = 15;
    market = "BankNifty Options";
  } else if (isFinNifty) {
    lotSize = 25;
    market = "FinNifty Options";
  } else if (isSensex) {
    lotSize = 10;
    market = "Sensex Options";
  } else if (!isNifty) {
    market = "Stocks / Futures";
    lotSize = 1;
  }

  const isPE = upper.endsWith("PE") || upper.includes(" PE ");
  const isCE = upper.endsWith("CE") || upper.includes(" CE ");
  const optionType = isPE ? "PUT (PE)" : isCE ? "CALL (CE)" : undefined;

  // Extract strike price (e.g., 24500 from NIFTY...24500PE)
  const strikeMatch = upper.match(/(\d{4,6})(CE|PE)$/);
  const strikePrice = strikeMatch ? parseFloat(strikeMatch[1]) : undefined;

  let baseName = "NIFTY";
  if (isBankNifty) baseName = "BANKNIFTY";
  else if (isFinNifty) baseName = "FINNIFTY";
  else if (isSensex) baseName = "SENSEX";
  else if (!isNifty) baseName = upper;

  const cleanInstrument = strikePrice && optionType
    ? `${baseName} ${strikePrice} ${optionType === "PUT (PE)" ? "PE" : "CE"}`
    : upper;

  return { cleanInstrument, market, optionType, strikePrice, lotSize };
}

// ── Match Buy & Sell Orders into Completed Trades (Round-Trips) ──
export function pairAngelOneTrades(rawOrders: RawAngelTrade[]): SyncedTradePreview[] {
  if (!rawOrders || rawOrders.length === 0) return [];

  // Group orders by contract tradingsymbol
  const groups: { [symbol: string]: RawAngelTrade[] } = {};

  for (const order of rawOrders) {
    const sym = order.tradingsymbol || "UNKNOWN";
    if (!groups[sym]) groups[sym] = [];
    groups[sym].push(order);
  }

  const completedTrades: SyncedTradePreview[] = [];

  for (const [symbol, orders] of Object.entries(groups)) {
    // Sort orders chronologically by filltime
    const sorted = [...orders].sort((a, b) => {
      const timeA = a.filltime || "";
      const timeB = b.filltime || "";
      return timeA.localeCompare(timeB);
    });

    const buyOrders: RawAngelTrade[] = [];
    const sellOrders: RawAngelTrade[] = [];

    for (const o of sorted) {
      if (o.transactiontype === "BUY") buyOrders.push(o);
      else if (o.transactiontype === "SELL") sellOrders.push(o);
    }

    // Match pairs
    while (buyOrders.length > 0 && sellOrders.length > 0) {
      const buy = buyOrders.shift()!;
      const sell = sellOrders.shift()!;

      const buyPrice = typeof buy.fillprice === "string" ? parseFloat(buy.fillprice) : (buy.fillprice || 0);
      const sellPrice = typeof sell.fillprice === "string" ? parseFloat(sell.fillprice) : (sell.fillprice || 0);
      const buyQty = typeof buy.fillsize === "string" ? parseFloat(buy.fillsize) : (buy.fillsize || 0);
      const sellQty = typeof sell.fillsize === "string" ? parseFloat(sell.fillsize) : (sell.fillsize || 0);
      const matchedQty = Math.min(buyQty, sellQty);

      // Determine trade direction (did trader Buy first or Short Sell first?)
      const isLong = (buy.filltime || "") <= (sell.filltime || "");
      const entryOrder = isLong ? buy : sell;
      const exitOrder = isLong ? sell : buy;

      const actualEntry = isLong ? buyPrice : sellPrice;
      const actualExit = isLong ? sellPrice : buyPrice;
      const optionPoints = parseFloat((isLong ? (sellPrice - buyPrice) : (buyPrice - sellPrice)).toFixed(2));
      const pnl = parseFloat((optionPoints * matchedQty).toFixed(2));

      const { cleanInstrument, market, optionType, strikePrice, lotSize } = parseContractSymbol(symbol);
      const numberOfLots = lotSize > 0 ? Math.max(1, Math.round(matchedQty / lotSize)) : 1;

      // Compute duration in minutes if times are valid
      const entryTimeStr = entryOrder.filltime || "09:15:00";
      const exitTimeStr = exitOrder.filltime || "15:30:00";
      let durationStr = "N/A";

      try {
        const [eH, eM] = entryTimeStr.split(":").map(Number);
        const [xH, xM] = exitTimeStr.split(":").map(Number);
        const totalMinutes = (xH * 60 + xM) - (eH * 60 + eM);
        durationStr = totalMinutes >= 0 ? `${totalMinutes} min` : "N/A";
      } catch {
        durationStr = "N/A";
      }

      const outcome: "WIN" | "LOSS" | "BREAKEVEN" =
        pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN";

      completedTrades.push({
        id: `angel_${entryOrder.orderid || Date.now()}_${exitOrder.orderid || Date.now()}`,
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
        tradeDuration: durationStr,
        broker: "Angel One",
        orderId: `${entryOrder.orderid || ""}-${exitOrder.orderid || ""}`,
        selected: true,
      });
    }
  }

  return completedTrades;
}
