"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type StrategyFormState = {
  success: boolean;
  message: string;
};

// ── CREATE ──
export async function createStrategy(
  _prevState: StrategyFormState,
  formData: FormData
): Promise<StrategyFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "You must be signed in." };
  }

  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      return { success: false, message: "Strategy name is required." };
    }

    await prisma.strategy.create({
      data: {
        userId: session.user.id,
        name,
        description: (formData.get("description") as string) || null,
        timeframe: (formData.get("timeframe") as string) || null,
        market: (formData.get("market") as string) || null,
        targetRR: formData.get("targetRR")
          ? parseFloat(formData.get("targetRR") as string)
          : 2.0,
        rules: (formData.get("rules") as string) || null,
      },
    });

    revalidatePath("/strategies");
    revalidatePath("/trades/new");
    return { success: true, message: "Strategy created successfully!" };
  } catch (error: any) {
    console.error("[createStrategy] Error:", error);
    return {
      success: false,
      message: error?.message
        ? `Failed: ${error.message}`
        : "Failed to create strategy.",
    };
  }
}

// ── UPDATE ──
export async function updateStrategy(
  strategyId: string,
  _prevState: StrategyFormState,
  formData: FormData
): Promise<StrategyFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      return { success: false, message: "Strategy name is required." };
    }

    await prisma.strategy.update({
      where: { id: strategyId, userId: session.user.id },
      data: {
        name,
        description: (formData.get("description") as string) || null,
        timeframe: (formData.get("timeframe") as string) || null,
        market: (formData.get("market") as string) || null,
        targetRR: formData.get("targetRR")
          ? parseFloat(formData.get("targetRR") as string)
          : 2.0,
        rules: (formData.get("rules") as string) || null,
      },
    });

    revalidatePath("/strategies");
    revalidatePath("/trades/new");
    return { success: true, message: "Strategy updated!" };
  } catch (error: any) {
    console.error("[updateStrategy] Error:", error);
    return {
      success: false,
      message: error?.message
        ? `Failed: ${error.message}`
        : "Failed to update strategy.",
    };
  }
}

// ── ARCHIVE (Soft Delete) ──
export async function archiveStrategy(
  strategyId: string
): Promise<StrategyFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    await prisma.strategy.update({
      where: { id: strategyId, userId: session.user.id },
      data: { isArchived: true },
    });

    revalidatePath("/strategies");
    revalidatePath("/trades/new");
    return { success: true, message: "Strategy archived." };
  } catch (error) {
    console.error("[archiveStrategy] Error:", error);
    return { success: false, message: "Failed to archive strategy." };
  }
}

// ── RESTORE ──
export async function restoreStrategy(
  strategyId: string
): Promise<StrategyFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    await prisma.strategy.update({
      where: { id: strategyId, userId: session.user.id },
      data: { isArchived: false },
    });

    revalidatePath("/strategies");
    revalidatePath("/trades/new");
    return { success: true, message: "Strategy restored." };
  } catch (error) {
    console.error("[restoreStrategy] Error:", error);
    return { success: false, message: "Failed to restore strategy." };
  }
}

// ── PERMANENT DELETE (only when 0 linked trades) ──
export async function deleteStrategy(
  strategyId: string
): Promise<StrategyFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    const linkedTrades = await prisma.trade.count({
      where: { strategyId },
    });

    if (linkedTrades > 0) {
      return {
        success: false,
        message: `Cannot delete: ${linkedTrades} trade(s) are linked. Archive instead.`,
      };
    }

    await prisma.strategy.delete({
      where: { id: strategyId, userId: session.user.id },
    });

    revalidatePath("/strategies");
    revalidatePath("/trades/new");
    return { success: true, message: "Strategy permanently deleted." };
  } catch (error) {
    console.error("[deleteStrategy] Error:", error);
    return { success: false, message: "Failed to delete strategy." };
  }
}

// ── GET USER STRATEGIES (with computed metrics) ──
export type StrategyWithMetrics = {
  id: string;
  name: string;
  description: string | null;
  timeframe: string | null;
  market: string | null;
  targetRR: number | null;
  rules: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Computed metrics
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  avgRR: number;
  profitFactor: number;
  rank: number;
  trades: { pnl: number; market: string; outcome: string; actualRR: number }[];
};

export async function getUserStrategies(): Promise<StrategyWithMetrics[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const strategies = await prisma.strategy.findMany({
    where: { userId: session.user.id },
    include: {
      trades: {
        select: {
          outcome: true,
          pnl: true,
          actualRR: true,
          market: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute metrics and rank
  const withMetrics = strategies.map((s) => {
    const totalTrades = s.trades.length;
    const wins = s.trades.filter((t) => t.outcome === "WIN").length;
    const losses = s.trades.filter((t) => t.outcome === "LOSS").length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const netPnL = s.trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgRR =
      totalTrades > 0
        ? s.trades.reduce((sum, t) => sum + t.actualRR, 0) / totalTrades
        : 0;
    const grossProfit = s.trades
      .filter((t) => t.pnl > 0)
      .reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(
      s.trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)
    );
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      timeframe: s.timeframe,
      market: s.market,
      targetRR: s.targetRR,
      rules: s.rules,
      isArchived: s.isArchived,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      totalTrades,
      wins,
      losses,
      winRate: parseFloat(winRate.toFixed(1)),
      netPnL: parseFloat(netPnL.toFixed(2)),
      avgRR: parseFloat(avgRR.toFixed(2)),
      profitFactor: profitFactor === Infinity ? 999 : parseFloat(profitFactor.toFixed(2)),
      rank: 0,
      trades: s.trades.map((t) => ({ pnl: t.pnl, market: t.market, outcome: t.outcome, actualRR: t.actualRR })),
    };
  });

  // Rank by a composite score: winRate * 0.4 + profitFactor * 0.3 + avgRR * 0.3
  // Only rank strategies with at least 1 trade
  const tradedStrategies = withMetrics
    .filter((s) => s.totalTrades > 0 && !s.isArchived)
    .sort((a, b) => {
      const scoreA = a.winRate * 0.4 + Math.min(a.profitFactor, 10) * 3 + a.avgRR * 3;
      const scoreB = b.winRate * 0.4 + Math.min(b.profitFactor, 10) * 3 + b.avgRR * 3;
      return scoreB - scoreA;
    });

  tradedStrategies.forEach((s, i) => {
    s.rank = i + 1;
  });

  return withMetrics;
}

// ── GET ACTIVE STRATEGIES (for dropdown in trade form) ──
export async function getActiveStrategies(): Promise<
  {
    id: string;
    name: string;
    market: string | null;
    targetRR: number | null;
    winRate: number;
    avgRR: number;
    totalTrades: number;
  }[]
> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const strategies = await prisma.strategy.findMany({
    where: { userId: session.user.id, isArchived: false },
    include: {
      trades: {
        select: { outcome: true, pnl: true, actualRR: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return strategies.map((s) => {
    const totalTrades = s.trades.length;
    const wins = s.trades.filter((t) => t.outcome === "WIN").length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const avgRR =
      totalTrades > 0
        ? s.trades.reduce((sum, t) => sum + t.actualRR, 0) / totalTrades
        : 0;

    return {
      id: s.id,
      name: s.name,
      market: s.market,
      targetRR: s.targetRR,
      winRate: parseFloat(winRate.toFixed(1)),
      avgRR: parseFloat(avgRR.toFixed(2)),
      totalTrades,
    };
  });
}
