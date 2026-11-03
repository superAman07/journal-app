"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Trade } from "@prisma/client";
import { calculateRR } from "@/lib/utils/calculate-rr";

// Helper to convert Prisma Decimal objects to plain JS numbers
// Next.js cannot serialize Decimal objects when passing from Server → Client Components
function serializeTrade(t: any) {
  return {
    ...t,
    plannedEntry: t.plannedEntry != null ? Number(t.plannedEntry) : null,
    stopLoss: t.stopLoss != null ? Number(t.stopLoss) : null,
    target: t.target != null ? Number(t.target) : null,
    actualEntry: t.actualEntry != null ? Number(t.actualEntry) : null,
    actualExit: t.actualExit != null ? Number(t.actualExit) : null,
    positionSize: t.positionSize != null ? Number(t.positionSize) : null,
    riskPercent: t.riskPercent != null ? Number(t.riskPercent) : null,
    pnl: t.pnl != null ? Number(t.pnl) : 0,
    actualRR: t.actualRR != null ? Number(t.actualRR) : 0,
    rMultiple: t.rMultiple != null ? Number(t.rMultiple) : 0,
    expectedRR: t.expectedRR != null ? Number(t.expectedRR) : 0,
    slippage: t.slippage != null ? Number(t.slippage) : null,
    strikePrice: t.strikePrice != null ? Number(t.strikePrice) : null,
    spotPrice: t.spotPrice != null ? Number(t.spotPrice) : null,
    optionPoints: t.optionPoints != null ? Number(t.optionPoints) : null,
  };
}

function parseOptionalFloat(val: any): number | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s === "NaN") return null;
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

function parseRequiredFloat(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (!s || s === "NaN") return fallback;
  const num = parseFloat(s);
  return isNaN(num) ? fallback : num;
}

function parseOptionalInt(val: any): number | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s === "NaN") return null;
  const num = parseInt(s, 10);
  return isNaN(num) ? null : num;
}

function parseSafeDate(dateVal: any): Date {
  if (dateVal && typeof dateVal === "string" && dateVal.trim()) {
    const d = new Date(dateVal.trim());
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function parseSafeDateTime(dateVal: any, timeVal: any): Date | null {
  if (!dateVal || !timeVal) return null;
  const dStr = String(dateVal).trim();
  const tStr = String(timeVal).trim();
  if (!dStr || !tStr) return null;

  try {
    const isPM = /pm/i.test(tStr);
    const isAM = /am/i.test(tStr);
    const timeClean = tStr.replace(/am|pm/i, "").trim();
    const parts = timeClean.split(":").map((p) => parseInt(p, 10));
    let hours = parts[0];
    let minutes = parts[1] || 0;
    let seconds = parts[2] || 0;

    if (isNaN(hours)) return null;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const pad = (n: number) => String(n).padStart(2, "0");
    const isoString = `${dStr}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    const parsed = new Date(isoString);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export type TradeFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

export async function createTrade(
  _prevState: TradeFormState,
  formData: FormData
): Promise<TradeFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "You must be signed in to log a trade." };
  }

  try {
    const rawInstrument = formData.get("instrument") as string;
    const instrument = (rawInstrument || "").trim().toUpperCase();

    const rawMarket = formData.get("market") as string;
    const market = (rawMarket || "Nifty Options").trim();

    const rawSession = formData.get("session") as string;
    const sessionName = (rawSession || "Indian / Morning").trim();

    const rawSetup = formData.get("setup") as string;
    const setup = (rawSetup || "Discretionary").trim();

    const rawBias = formData.get("bias") as string;
    const bias = (rawBias || "BULLISH").trim();

    const rawOutcome = formData.get("outcome") as string;
    const outcome = (rawOutcome || "WIN").trim();

    const rawExitReason = formData.get("exitReason") as string;
    const exitReason = (rawExitReason || "TARGET_HIT").trim();

    const actualEntry = parseRequiredFloat(formData.get("actualEntry"), NaN);
    const stopLoss = parseRequiredFloat(formData.get("stopLoss"), NaN);
    const actualExit = parseRequiredFloat(formData.get("actualExit"), NaN);
    const target = parseRequiredFloat(formData.get("target"), NaN);

    // Basic validation
    if (!market || !instrument || !setup) {
      return {
        success: false,
        message: "Missing required fields. Please ensure market, instrument, and setup are filled.",
        errors: {
          market: !market ? "Market is required" : "",
          instrument: !instrument ? "Instrument is required" : "",
          setup: !setup ? "Setup is required" : "",
        },
      };
    }

    if (isNaN(stopLoss) || isNaN(target) || isNaN(actualEntry) || isNaN(actualExit)) {
      return {
        success: false,
        message: "Invalid price values. Please check entry, SL, TP, and exit prices.",
      };
    }

    const computedRR = calculateRR(actualEntry, stopLoss, actualExit, outcome);

    const strategyIdRaw = formData.get("strategyId") as string;
    const strategyId = strategyIdRaw && strategyIdRaw.trim() ? strategyIdRaw.trim() : null;

    const tradeDate = parseSafeDate(formData.get("date"));
    const entryTime = parseSafeDateTime(formData.get("date"), formData.get("entryTime"));
    const exitTime = parseSafeDateTime(formData.get("date"), formData.get("exitTime"));

    const plannedEntry = parseOptionalFloat(formData.get("plannedEntry"));
    const expectedRR = parseRequiredFloat(formData.get("expectedRR"), 0);
    const positionSize = parseRequiredFloat(formData.get("positionSize"), 1);
    const riskPercent = parseRequiredFloat(formData.get("riskPercent"), 1);
    const slippage = parseOptionalFloat(formData.get("slippage")) ?? 0;
    const pnl = parseRequiredFloat(formData.get("pnl"), 0);

    const strikePrice = parseOptionalFloat(formData.get("strikePrice"));
    const spotPrice = parseOptionalFloat(formData.get("spotPrice"));
    const optionPoints = parseOptionalFloat(formData.get("optionPoints"));
    const lotSize = parseOptionalInt(formData.get("lotSize"));
    const numberOfLots = parseOptionalInt(formData.get("numberOfLots"));

    const data = {
      userId: session.user.id,
      market,
      instrument,
      session: sessionName,
      date: tradeDate,
      setup,
      strategyId,
      bias,

      plannedEntry,
      stopLoss,
      target,
      expectedRR,

      actualEntry,
      actualExit,
      positionSize,
      riskPercent,
      actualRR: computedRR,
      isLateEntry: formData.get("isLateEntry") === "true",
      isEarlyEntry: formData.get("isEarlyEntry") === "true",
      slippage,

      outcome,
      exitReason,
      pnl,
      rMultiple: computedRR,
      rulesFollowed: formData.get("rulesFollowed") !== "false",
      ruleBreakReason: (formData.get("ruleBreakReason") as string) || null,

      mindsetBefore: (formData.get("mindsetBefore") as string) || null,
      mindsetDuring: (formData.get("mindsetDuring") as string) || null,
      mindsetAfter: (formData.get("mindsetAfter") as string) || null,

      optionType: (formData.get("optionType") as string) || null,
      optionAction: (formData.get("optionAction") as string) || null,
      strikePrice,
      spotPrice,
      optionExpiry: (formData.get("optionExpiry") as string) || null,
      lotSize,
      numberOfLots,
      optionPoints,

      entryTime,
      exitTime,
    };

    // Server-side deduplication guard against rapid multi-clicks or duplicate requests
    const fifteenSecondsAgo = new Date(Date.now() - 15000);
    const existingDuplicate = await prisma.trade.findFirst({
      where: {
        userId: session.user.id,
        market: data.market,
        instrument: data.instrument,
        actualEntry: data.actualEntry,
        actualExit: data.actualExit,
        pnl: data.pnl,
        createdAt: { gte: fifteenSecondsAgo },
      },
    });

    if (existingDuplicate) {
      return { success: true, message: "Trade saved successfully!" };
    }

    const trade = await prisma.trade.create({ data });

    // Create emotion tags
    const emotionsRaw = formData.get("emotions") as string;
    if (emotionsRaw) {
      const emotions = emotionsRaw.split(",").filter(Boolean);
      if (emotions.length > 0) {
        await prisma.emotionTag.createMany({
          data: emotions.map((emotion) => ({
            tradeId: trade.id,
            stage: "DURING",
            emotion: emotion.trim(),
          })),
        });
      }
    }

    const screenshotsRaw = formData.get("screenshots") as string;
    if (screenshotsRaw) {
      try {
        const parsed = JSON.parse(screenshotsRaw) as { dataUrl: string; stage: string }[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validScreenshots = parsed
            .filter((ss) => ss && typeof ss.dataUrl === "string" && ss.dataUrl.trim())
            .map((ss) => ({
              tradeId: trade.id,
              url: ss.dataUrl.trim(),
              stage: ss.stage || "BEFORE_ENTRY",
            }));
          if (validScreenshots.length > 0) {
            await prisma.screenshot.createMany({
              data: validScreenshots,
            });
          }
        }
      } catch (ssErr) {
        console.error("[createTrade] Error saving screenshots:", ssErr);
      }
    }

    // Create strategy rule compliance records
    const ruleComplianceRaw = formData.get("ruleCompliance") as string;
    if (ruleComplianceRaw) {
      try {
        const parsed = JSON.parse(ruleComplianceRaw) as { ruleText: string; followed: boolean; sortOrder: number }[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validRules = parsed
            .filter((rc) => rc && rc.ruleText)
            .map((rc, idx) => ({
              tradeId: trade.id,
              ruleText: String(rc.ruleText),
              followed: Boolean(rc.followed),
              sortOrder: typeof rc.sortOrder === "number" ? rc.sortOrder : idx,
            }));
          if (validRules.length > 0) {
            await prisma.strategyRuleCompliance.createMany({
              data: validRules,
            });
          }
        }
      } catch (rcErr) {
        console.error("[createTrade] Error saving ruleCompliance:", rcErr);
      }
    }

    revalidatePath("/");
    revalidatePath("/trades");
    revalidatePath("/analytics");
    revalidatePath("/dna");
    revalidatePath("/strategies");

    return { success: true, message: "Trade saved successfully!" };
  } catch (error: any) {
    console.error("[createTrade] Error:", error);
    return {
      success: false,
      message: error?.message ? `Failed to save trade: ${error.message}` : "Failed to save trade. Database error.",
    };
  }
}

export async function deleteTrade(tradeId: string): Promise<TradeFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    await prisma.trade.delete({
      where: { id: tradeId, userId: session.user.id },
    });

    revalidatePath("/");
    revalidatePath("/trades");
    return { success: true, message: "Trade deleted." };
  } catch (error) {
    console.error("[deleteTrade] Error:", error);
    return { success: false, message: "Failed to delete trade." };
  }
}

export async function getTradeById(tradeId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId: session.user.id },
    include: {
      emotions: true,
      screenshots: true,
      mistakes: true,
      ruleCompliance: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!trade) return null;
  const computedRR = calculateRR(Number(trade.actualEntry), Number(trade.stopLoss), Number(trade.actualExit), trade.outcome);
  return serializeTrade({
    ...trade,
    actualRR: computedRR,
    rMultiple: computedRR,
  });
}

export async function updateTrade(
  tradeId: string,
  _prevState: TradeFormState,
  formData: FormData
): Promise<TradeFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    const rawInstrument = formData.get("instrument") as string;
    const instrument = (rawInstrument || "").trim().toUpperCase();

    const rawMarket = formData.get("market") as string;
    const market = (rawMarket || "Nifty Options").trim();

    const rawSession = formData.get("session") as string;
    const sessionName = (rawSession || "Indian / Morning").trim();

    const rawSetup = formData.get("setup") as string;
    const setup = (rawSetup || "Discretionary").trim();

    const rawBias = formData.get("bias") as string;
    const bias = (rawBias || "BULLISH").trim();

    const rawOutcome = formData.get("outcome") as string;
    const outcome = (rawOutcome || "WIN").trim();

    const rawExitReason = formData.get("exitReason") as string;
    const exitReason = (rawExitReason || "TARGET_HIT").trim();

    const actualEntry = parseRequiredFloat(formData.get("actualEntry"), NaN);
    const stopLoss = parseRequiredFloat(formData.get("stopLoss"), NaN);
    const actualExit = parseRequiredFloat(formData.get("actualExit"), NaN);
    const target = parseRequiredFloat(formData.get("target"), NaN);

    if (isNaN(stopLoss) || isNaN(target) || isNaN(actualEntry) || isNaN(actualExit)) {
      return {
        success: false,
        message: "Invalid price values. Please check entry, SL, TP, and exit prices.",
      };
    }

    const computedRR = calculateRR(actualEntry, stopLoss, actualExit, outcome);

    const strategyIdRaw = formData.get("strategyId") as string;
    const strategyId = strategyIdRaw && strategyIdRaw.trim() ? strategyIdRaw.trim() : null;

    const tradeDate = parseSafeDate(formData.get("date"));
    const entryTime = parseSafeDateTime(formData.get("date"), formData.get("entryTime"));
    const exitTime = parseSafeDateTime(formData.get("date"), formData.get("exitTime"));

    const plannedEntry = parseOptionalFloat(formData.get("plannedEntry"));
    const expectedRR = parseRequiredFloat(formData.get("expectedRR"), 0);
    const positionSize = parseRequiredFloat(formData.get("positionSize"), 1);
    const riskPercent = parseRequiredFloat(formData.get("riskPercent"), 1);
    const slippage = parseOptionalFloat(formData.get("slippage")) ?? 0;
    const pnl = parseRequiredFloat(formData.get("pnl"), 0);

    const strikePrice = parseOptionalFloat(formData.get("strikePrice"));
    const spotPrice = parseOptionalFloat(formData.get("spotPrice"));
    const optionPoints = parseOptionalFloat(formData.get("optionPoints"));
    const lotSize = parseOptionalInt(formData.get("lotSize"));
    const numberOfLots = parseOptionalInt(formData.get("numberOfLots"));

    const data = {
      market,
      instrument,
      session: sessionName,
      date: tradeDate,
      setup,
      strategyId,
      bias,

      plannedEntry,
      stopLoss,
      target,
      expectedRR,

      actualEntry,
      actualExit,
      positionSize,
      riskPercent,
      actualRR: computedRR,
      isLateEntry: formData.get("isLateEntry") === "true",
      isEarlyEntry: formData.get("isEarlyEntry") === "true",
      slippage,

      outcome,
      exitReason,
      pnl,
      rMultiple: computedRR,
      rulesFollowed: formData.get("rulesFollowed") !== "false",
      ruleBreakReason: (formData.get("ruleBreakReason") as string) || null,

      mindsetBefore: (formData.get("mindsetBefore") as string) || null,
      mindsetDuring: (formData.get("mindsetDuring") as string) || null,
      mindsetAfter: (formData.get("mindsetAfter") as string) || null,

      optionType: (formData.get("optionType") as string) || null,
      optionAction: (formData.get("optionAction") as string) || null,
      strikePrice,
      spotPrice,
      optionExpiry: (formData.get("optionExpiry") as string) || null,
      lotSize,
      numberOfLots,
      optionPoints,

      entryTime,
      exitTime,
    };

    await prisma.trade.update({
      where: { id: tradeId, userId: session.user.id },
      data,
    });

    const emotionsRaw = formData.get("emotions") as string;
    await prisma.emotionTag.deleteMany({ where: { tradeId } });
    if (emotionsRaw) {
      const emotions = emotionsRaw.split(",").filter(Boolean);
      if (emotions.length > 0) {
        await prisma.emotionTag.createMany({
          data: emotions.map((emotion) => ({
            tradeId,
            stage: "DURING",
            emotion: emotion.trim(),
          })),
        });
      }
    }

    // Update strategy rule compliance records
    const ruleComplianceRaw = formData.get("ruleCompliance") as string;
    await prisma.strategyRuleCompliance.deleteMany({ where: { tradeId } });
    if (ruleComplianceRaw) {
      try {
        const parsed = JSON.parse(ruleComplianceRaw) as { ruleText: string; followed: boolean; sortOrder: number }[];
        if (parsed.length > 0) {
          await prisma.strategyRuleCompliance.createMany({
            data: parsed.map((rc) => ({
              tradeId,
              ruleText: rc.ruleText,
              followed: rc.followed,
              sortOrder: rc.sortOrder,
            })),
          });
        }
      } catch (rcErr) {
        console.error("[updateTrade] Error saving ruleCompliance:", rcErr);
      }
    }

    // Update screenshots
    const screenshotsRaw = formData.get("screenshots") as string;
    if (screenshotsRaw) {
      try {
        const parsed = JSON.parse(screenshotsRaw) as { dataUrl: string; stage: string }[];
        if (Array.isArray(parsed)) {
          await prisma.screenshot.deleteMany({ where: { tradeId } });
          const validScreenshots = parsed
            .filter((ss) => ss && typeof ss.dataUrl === "string" && ss.dataUrl.trim())
            .map((ss) => ({
              tradeId,
              url: ss.dataUrl.trim(),
              stage: ss.stage || "BEFORE_ENTRY",
            }));
          if (validScreenshots.length > 0) {
            await prisma.screenshot.createMany({
              data: validScreenshots,
            });
          }
        }
      } catch (ssErr) {
        console.error("[updateTrade] Error saving screenshots:", ssErr);
      }
    }

    revalidatePath("/");
    revalidatePath("/trades");
    revalidatePath("/analytics");
    revalidatePath("/dna");
    revalidatePath("/strategies");

    return { success: true, message: "Trade updated successfully!" };
  } catch (error: any) {
    console.error("[updateTrade] Error:", error);
    return {
      success: false,
      message: error?.message ? `Failed to update: ${error.message}` : "Failed to update trade.",
    };
  }
}


export async function getUserTrades() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    include: {
      emotions: true,
      screenshots: true,
      mistakes: true,
      ruleCompliance: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { date: "desc" },
  });

  return trades.map((t) => {
    const computedRR = calculateRR(Number(t.actualEntry), Number(t.stopLoss), Number(t.actualExit), t.outcome);
    return serializeTrade({
      ...t,
      actualRR: computedRR,
      rMultiple: computedRR,
    });
  });
}

export async function getDashboardMetrics() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const trades: Trade[] = await prisma.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  if (trades.length === 0) return null;

  const wins = trades.filter((t: Trade) => t.outcome === "WIN");
  const losses = trades.filter((t: Trade) => t.outcome === "LOSS");
  const totalPnL = trades.reduce((sum: number, t: Trade) => sum + t.pnl, 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgRR = trades.length > 0 ? trades.reduce((sum: number, t: Trade) => sum + t.actualRR, 0) / trades.length : 0;
  const rulesFollowed = trades.filter((t: Trade) => t.rulesFollowed).length;
  const ruleFollowRate = trades.length > 0 ? (rulesFollowed / trades.length) * 100 : 0;

  return {
    totalTrades: trades.length,
    netPnL: Number(totalPnL),
    winRate,
    averageRR: parseFloat(avgRR.toFixed(2)),
    ruleFollowRate: parseFloat(ruleFollowRate.toFixed(1)),
    recentTrades: trades.slice(0, 5).map(serializeTrade),
    bestDay: wins.length > 0 ? Math.max(...wins.map((w) => Number(w.pnl))) : 0,
    worstDay: losses.length > 0 ? Math.min(...losses.map((l) => Number(l.pnl))) : 0,
  };
}

export async function createTradingRule(formData: FormData): Promise<TradeFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    await prisma.tradingRule.create({
      data: {
        userId: session.user.id,
        title: formData.get("title") as string,
        description: formData.get("description") as string || "",
        category: formData.get("category") as string || "RISK",
        isActive: true,
      },
    });

    revalidatePath("/rules");
    return { success: true, message: "Rule created." };
  } catch (error) {
    console.error("[createTradingRule] Error:", error);
    return { success: false, message: "Failed to create rule." };
  }
}

export async function toggleTradingRule(ruleId: string, isActive: boolean): Promise<TradeFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    await prisma.tradingRule.update({
      where: { id: ruleId, userId: session.user.id },
      data: { isActive },
    });

    revalidatePath("/rules");
    return { success: true, message: `Rule ${isActive ? "activated" : "deactivated"}.` };
  } catch (error) {
    console.error("[toggleTradingRule] Error:", error);
    return { success: false, message: "Failed to update rule." };
  }
}

export async function getUserRules() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.tradingRule.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function clearAllUserTrades(): Promise<TradeFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    await prisma.trade.deleteMany({
      where: { userId: session.user.id },
    });

    revalidatePath("/");
    revalidatePath("/trades");
    revalidatePath("/analytics");
    revalidatePath("/dna");
    return { success: true, message: "All trades cleared." };
  } catch (error) {
    console.error("[clearAllUserTrades] Error:", error);
    return { success: false, message: "Failed to clear trades." };
  }
}
