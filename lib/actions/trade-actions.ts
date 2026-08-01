"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Trade } from "@prisma/client";

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
    const data = {
      userId: session.user.id,
      market: formData.get("market") as string,
      instrument: (formData.get("instrument") as string).toUpperCase(),
      session: formData.get("session") as string,
      date: new Date(formData.get("date") as string),
      setup: formData.get("setup") as string,
      bias: formData.get("bias") as string,

      // Plan
      plannedEntry: formData.get("plannedEntry") ? parseFloat(formData.get("plannedEntry") as string) : null,
      stopLoss: parseFloat(formData.get("stopLoss") as string),
      target: parseFloat(formData.get("target") as string),
      expectedRR: parseFloat(formData.get("expectedRR") as string) || 0,

      // Execution
      actualEntry: parseFloat(formData.get("actualEntry") as string),
      actualExit: parseFloat(formData.get("actualExit") as string),
      positionSize: parseFloat(formData.get("positionSize") as string) || 1,
      riskPercent: parseFloat(formData.get("riskPercent") as string) || 1,
      actualRR: parseFloat(formData.get("actualRR") as string) || 0,
      isLateEntry: formData.get("isLateEntry") === "true",
      isEarlyEntry: formData.get("isEarlyEntry") === "true",
      slippage: parseFloat(formData.get("slippage") as string) || 0,

      // Result
      outcome: formData.get("outcome") as string,
      exitReason: formData.get("exitReason") as string,
      pnl: parseFloat(formData.get("pnl") as string) || 0,
      rMultiple: parseFloat(formData.get("rMultiple") as string) || 0,
      rulesFollowed: formData.get("rulesFollowed") !== "false",
      ruleBreakReason: formData.get("ruleBreakReason") as string || null,

      // Mindset
      mindsetBefore: formData.get("mindsetBefore") as string || null,
      mindsetDuring: formData.get("mindsetDuring") as string || null,
      mindsetAfter: formData.get("mindsetAfter") as string || null,

      // Options Specific Fields
      optionType: formData.get("optionType") as string || null,
      optionAction: formData.get("optionAction") as string || null,
      strikePrice: formData.get("strikePrice") ? parseFloat(formData.get("strikePrice") as string) : null,
      spotPrice: formData.get("spotPrice") ? parseFloat(formData.get("spotPrice") as string) : null,
      optionExpiry: formData.get("optionExpiry") as string || null,
      lotSize: formData.get("lotSize") ? parseInt(formData.get("lotSize") as string) : null,
      numberOfLots: formData.get("numberOfLots") ? parseInt(formData.get("numberOfLots") as string) : null,
      optionPoints: formData.get("optionPoints") ? parseFloat(formData.get("optionPoints") as string) : null,
    };

    // Basic validation
    if (!data.market || !data.instrument || !data.setup) {
      return {
        success: false,
        message: "Missing required fields.",
        errors: {
          market: !data.market ? "Market is required" : "",
          instrument: !data.instrument ? "Instrument is required" : "",
          setup: !data.setup ? "Setup is required" : "",
        },
      };
    }

    if (isNaN(data.stopLoss) || isNaN(data.target) || isNaN(data.actualEntry) || isNaN(data.actualExit)) {
      return {
        success: false,
        message: "Invalid price values. Please check entry, SL, TP, and exit prices.",
      };
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

    revalidatePath("/");
    revalidatePath("/trades");
    revalidatePath("/analytics");
    revalidatePath("/dna");

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

export async function getUserTrades() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    include: {
      emotions: true,
      screenshots: true,
      mistakes: true,
    },
    orderBy: { date: "desc" },
  });

  return trades;
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
    netPnL: totalPnL,
    winRate,
    averageRR: parseFloat(avgRR.toFixed(2)),
    ruleFollowRate: parseFloat(ruleFollowRate.toFixed(1)),
    recentTrades: trades.slice(0, 5),
    bestDay: wins.length > 0 ? Math.max(...wins.map((w) => w.pnl)) : 0,
    worstDay: losses.length > 0 ? Math.min(...losses.map((l) => l.pnl)) : 0,
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
