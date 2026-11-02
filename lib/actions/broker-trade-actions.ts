"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SyncedTradePreview } from "@/lib/services/angel-one-service";

export async function importBrokerTrades(tradesToImport: SyncedTradePreview[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!tradesToImport || tradesToImport.length === 0) {
    return { success: false, error: "No trades provided for import" };
  }

  try {
    let importedCount = 0;
    let skippedCount = 0;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const trade of tradesToImport) {
      if (trade.selected === false) {
        skippedCount++;
        continue;
      }

      // Deduplication check: Avoid re-importing the same trade execution
      const existing = await prisma.trade.findFirst({
        where: {
          userId: session.user.id,
          instrument: trade.instrument,
          actualEntry: trade.actualEntry,
          actualExit: trade.actualExit,
          pnl: trade.pnl,
          date: { gte: todayStart },
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Calculate reasonable structural defaults for SL and TP if not provided
      const defaultSL = trade.actualEntry * (trade.optionAction === "BUY" ? 0.85 : 1.15);
      const defaultTP = trade.actualEntry * (trade.optionAction === "BUY" ? 1.40 : 0.60);

      const created = await prisma.trade.create({
        data: {
          userId: session.user.id,
          date: now,
          market: trade.market || "Nifty Options",
          instrument: trade.instrument,
          session: "Indian / Morning",
          setup: "A+ Reversal Protocol",
          bias: trade.optionType === "PUT (PE)" ? "BEARISH" : "BULLISH",
          plannedEntry: trade.actualEntry,
          stopLoss: parseFloat(defaultSL.toFixed(2)),
          target: parseFloat(defaultTP.toFixed(2)),
          expectedRR: 2.3,
          actualEntry: trade.actualEntry,
          actualExit: trade.actualExit,
          positionSize: trade.positionSize,
          riskPercent: 1.0,
          actualRR: trade.pnl > 0 ? 2.3 : -1.0,
          rMultiple: trade.pnl > 0 ? 2.3 : -1.0,
          outcome: trade.outcome,
          exitReason: trade.outcome === "WIN" ? "TARGET_HIT" : "STOP_HIT",
          pnl: trade.pnl,
          rulesFollowed: true,
          optionType: trade.optionType || null,
          optionAction: trade.optionAction || "BUY",
          strikePrice: trade.strikePrice || null,
          lotSize: trade.lotSize || 25,
          numberOfLots: trade.numberOfLots || 1,
          optionPoints: trade.optionPoints,
          notes: `[Auto-Synced from ${trade.broker}] Ref: ${trade.orderId || "N/A"}. Duration: ${trade.tradeDuration}. Write your 3-phase psychology notes to complete this journal record.`,
        },
      });

      // Add broker tag
      await prisma.tradeTag.create({
        data: {
          tradeId: created.id,
          name: `${trade.broker} Synced`,
        },
      });

      importedCount++;
    }

    revalidatePath("/trades");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/analytics");
    revalidatePath("/ai-coach");

    return {
      success: true,
      importedCount,
      skippedCount,
      message: `Successfully imported ${importedCount} trade${importedCount === 1 ? "" : "s"}${
        skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : ""
      }!`,
    };
  } catch (error: any) {
    console.error("[importBrokerTrades] Error:", error);
    return { success: false, error: error.message || "Failed to import trades into journal" };
  }
}
