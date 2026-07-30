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
  } catch (error) {
    console.error("[createTrade] Error:", error);
    return { success: false, message: "Failed to save trade. Database error." };
  }

  redirect("/trades");
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

export async function seedDemoTrades(): Promise<TradeFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    const sampleTrades = [
      {
        userId: session.user.id,
        market: "Gold",
        instrument: "XAUUSD",
        session: "New York",
        date: new Date("2026-07-25"),
        setup: "Order Block + FVG Refinement",
        bias: "BULLISH",
        plannedEntry: 2385.50,
        stopLoss: 2380.00,
        target: 2402.00,
        expectedRR: 3.0,
        actualEntry: 2385.80,
        actualExit: 2402.00,
        positionSize: 2.0,
        riskPercent: 1.0,
        actualRR: 2.95,
        isLateEntry: false,
        isEarlyEntry: false,
        slippage: 0.3,
        outcome: "WIN",
        exitReason: "TARGET_HIT",
        pnl: 3240.00,
        rMultiple: 2.95,
        rulesFollowed: true,
        mindsetBefore: "Waited for NY volume tap into H4 Order Block.",
        mindsetDuring: "Completely calm, kept hands off keyboard.",
        mindsetAfter: "Satisfied with execution. Perfect RR compliance.",
      },
      {
        userId: session.user.id,
        market: "Forex",
        instrument: "EURUSD",
        session: "London",
        date: new Date("2026-07-24"),
        setup: "Asian Range Sweep + MSS",
        bias: "BEARISH",
        plannedEntry: 1.0890,
        stopLoss: 1.0910,
        target: 1.0840,
        expectedRR: 2.5,
        actualEntry: 1.0888,
        actualExit: 1.0840,
        positionSize: 3.0,
        riskPercent: 1.0,
        actualRR: 2.40,
        isLateEntry: false,
        isEarlyEntry: false,
        slippage: 0.2,
        outcome: "WIN",
        exitReason: "TARGET_HIT",
        pnl: 2400.00,
        rMultiple: 2.40,
        rulesFollowed: true,
        mindsetBefore: "High conviction liquidity sweep of Asian highs.",
        mindsetDuring: "Focused.",
        mindsetAfter: "Clean execution.",
      },
      {
        userId: session.user.id,
        market: "Indices",
        instrument: "BANKNIFTY 52000 CE",
        session: "Asian",
        date: new Date("2026-07-23"),
        setup: "Break & Retest",
        bias: "BULLISH",
        plannedEntry: 450.00,
        stopLoss: 420.00,
        target: 520.00,
        expectedRR: 2.33,
        actualEntry: 455.00,
        actualExit: 420.00,
        positionSize: 4.0,
        riskPercent: 1.5,
        actualRR: -1.00,
        isLateEntry: true,
        isEarlyEntry: false,
        slippage: 5.0,
        outcome: "LOSS",
        exitReason: "STOP_LOSS_HIT",
        pnl: -1350.00,
        rMultiple: -1.00,
        rulesFollowed: false,
        ruleBreakReason: "Chased entry after initial move started.",
        mindsetBefore: "FOMO set in after opening candle.",
        mindsetDuring: "Anxious, checked chart every 30s.",
        mindsetAfter: "Need to wait for proper retest confirmation next time.",
      },
    ];

    for (const trade of sampleTrades) {
      await prisma.trade.create({ data: trade });
    }

    revalidatePath("/");
    revalidatePath("/trades");
    revalidatePath("/analytics");
    revalidatePath("/dna");
    return { success: true, message: "Sample trades loaded successfully!" };
  } catch (error) {
    console.error("[seedDemoTrades] Error:", error);
    return { success: false, message: "Failed to seed sample trades." };
  }
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
