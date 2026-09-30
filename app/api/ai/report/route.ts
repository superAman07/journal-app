import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callGemini, callNvidiaNIM } from "@/lib/services/ai-coach-service";

function getDateRange(period: "week" | "month" | "overall") {
  const now = new Date();
  const start = new Date();

  if (period === "week") {
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setFullYear(start.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

function computeMetrics(trades: any[]) {
  const total = trades.length;
  if (total === 0)
    return {
      total: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: 0,
      totalPnl: 0,
      avgPnl: 0,
      avgRR: 0,
      bestTrade: null,
      worstTrade: null,
      rulesFollowed: 0,
      rulesBroken: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      avgHoldingMins: 0,
      tradeSummaries: [],
      emotionBreakdown: {},
      mistakeBreakdown: {},
    };

  const wins = trades.filter((t) => t.outcome === "WIN");
  const losses = trades.filter((t) => t.outcome === "LOSS");
  const breakevens = trades.filter((t) => t.outcome === "BREAKEVEN");
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const avgPnl = totalPnl / total;
  const avgRR =
    trades.reduce((s, t) => s + (t.actualRR || t.rMultiple || 0), 0) / total;

  const sortedByPnl = [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
  const bestTrade = sortedByPnl[0];
  const worstTrade = sortedByPnl[sortedByPnl.length - 1];

  const rulesFollowed = trades.filter((t) => t.rulesFollowed).length;
  const rulesBroken = total - rulesFollowed;

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentWin = 0;
  let currentLoss = 0;
  for (const t of trades) {
    if (t.outcome === "WIN") {
      currentWin++;
      currentLoss = 0;
      if (currentWin > longestWinStreak) longestWinStreak = currentWin;
    } else if (t.outcome === "LOSS") {
      currentLoss++;
      currentWin = 0;
      if (currentLoss > longestLossStreak) longestLossStreak = currentLoss;
    } else {
      currentWin = 0;
      currentLoss = 0;
    }
  }

  const tradesWithDuration = trades.filter((t) => t.entryTime && t.exitTime);
  let avgHoldingMins = 0;
  if (tradesWithDuration.length > 0) {
    const totalMins = tradesWithDuration.reduce((acc, t) => {
      const diff =
        new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime();
      return acc + Math.max(0, diff / (1000 * 60));
    }, 0);
    avgHoldingMins = Math.round(totalMins / tradesWithDuration.length);
  }

  const emotionBreakdown: Record<string, number> = {};
  const mistakeBreakdown: Record<string, number> = {};
  trades.forEach((t) => {
    t.emotions?.forEach((e: any) => {
      const em = e.emotion || e;
      emotionBreakdown[em] = (emotionBreakdown[em] || 0) + 1;
    });
    t.mistakes?.forEach((m: any) => {
      const ms = m.mistake || m;
      mistakeBreakdown[ms] = (mistakeBreakdown[ms] || 0) + 1;
    });
  });

  const tradeSummaries = trades.slice(0, 15).map((t) => ({
    date: t.date
      ? new Date(t.date).toISOString().split("T")[0]
      : "unknown",
    instrument: t.instrument,
    market: t.market,
    setup: t.setup,
    outcome: t.outcome,
    pnl: t.pnl,
    actualRR: t.actualRR,
    exitReason: t.exitReason,
    rulesFollowed: t.rulesFollowed,
    ruleBreakReason: t.ruleBreakReason,
    emotions: t.emotions?.map((e: any) => e.emotion || e) || [],
    mistakes: t.mistakes?.map((m: any) => m.mistake || m) || [],
  }));

  return {
    total,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    winRate: Number(((wins.length / total) * 100).toFixed(1)),
    totalPnl: Number(totalPnl.toFixed(2)),
    avgPnl: Number(avgPnl.toFixed(2)),
    avgRR: Number(avgRR.toFixed(2)),
    bestTrade: bestTrade
      ? {
          instrument: bestTrade.instrument,
          pnl: bestTrade.pnl,
          date: bestTrade.date
            ? new Date(bestTrade.date).toISOString().split("T")[0]
            : "",
        }
      : null,
    worstTrade: worstTrade
      ? {
          instrument: worstTrade.instrument,
          pnl: worstTrade.pnl,
          date: worstTrade.date
            ? new Date(worstTrade.date).toISOString().split("T")[0]
            : "",
        }
      : null,
    rulesFollowed,
    rulesBroken,
    longestWinStreak,
    longestLossStreak,
    avgHoldingMins,
    tradeSummaries,
    emotionBreakdown,
    mistakeBreakdown,
  };
}

function buildReportPrompt(
  period: string,
  metrics: ReturnType<typeof computeMetrics>,
  periodLabel: string
) {
  const emotionStr = Object.entries(metrics.emotionBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([e, c]) => `${e}(${c})`)
    .join(", ");

  const mistakeStr = Object.entries(metrics.mistakeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([m, c]) => `${m}(${c})`)
    .join(", ");

  const tradeLogs = metrics.tradeSummaries
    .map(
      (t) =>
        `${t.date} | ${t.instrument} | ${t.outcome} | PnL:${t.pnl} | RR:${t.actualRR} | Exit:${t.exitReason} | Rules:${t.rulesFollowed ? "yes" : `BROKEN(${t.ruleBreakReason || "unknown"})`} | Emotions:${t.emotions.join(",") || "none"}`
    )
    .join("\n  ");

  return `You are an elite Trading Performance Analyst creating a ${periodLabel} Report Card.

=== PERIOD: ${periodLabel} ===
Total Trades: ${metrics.total}
Wins: ${metrics.wins} | Losses: ${metrics.losses} | Breakeven: ${metrics.breakevens}
Win Rate: ${metrics.winRate}%
Net PnL: ₹${metrics.totalPnl.toFixed(0)}
Average PnL per trade: ₹${metrics.avgPnl.toFixed(0)}
Average R:R: ${metrics.avgRR}R
Best Trade: ${metrics.bestTrade ? `${metrics.bestTrade.instrument} (₹${metrics.bestTrade.pnl})` : "N/A"}
Worst Trade: ${metrics.worstTrade ? `${metrics.worstTrade.instrument} (₹${metrics.worstTrade.pnl})` : "N/A"}
Rules Followed: ${metrics.rulesFollowed}/${metrics.total} (${metrics.total > 0 ? ((metrics.rulesFollowed / metrics.total) * 100).toFixed(0) : 100}%)
Rules Broken: ${metrics.rulesBroken}
Longest Win Streak: ${metrics.longestWinStreak}
Longest Loss Streak: ${metrics.longestLossStreak}
Avg Holding Time: ${metrics.avgHoldingMins}min
Top Emotions: ${emotionStr || "None tracked"}
Common Mistakes: ${mistakeStr || "None tracked"}

Individual Trade Logs:
  ${tradeLogs || "No trades in this period."}
========================

INSTRUCTIONS:
Create a comprehensive, honest, and motivational ${periodLabel} report card. Follow this exact structure:

1. **Overall Grade** (A+ to F): Give a letter grade based on discipline, not just P&L. A disciplined loss streak is better than an undisciplined win streak.

2. **Executive Summary** (2-3 sentences): The headline verdict. Be direct and real.

3. **What Went Right** (2-4 bullet points): Highlight genuine strengths. If they followed rules during losses, that IS a win. Call it out explicitly.

4. **What Needs Work** (2-4 bullet points): Be honest but constructive. If they broke rules or revenge-traded, say it clearly.

5. **Discipline Score** (out of 100): Based on rules adherence, position sizing, and emotional control. A loss taken with discipline scores higher than an undisciplined win.

6. **Psychology Check**: Are they showing signs of tilt, FOMO, or revenge trading? Or are they calm and executing their plan?

7. **Challenge for Next ${period === "week" ? "Week" : period === "month" ? "Month" : "Quarter"}**: Give them a specific, actionable challenge. Make it tough but achievable.

8. **Motivational Close**: If they are losing but disciplined, tell them "losses in discipline are the tuition fee of mastery — the market owes you nothing today, but your edge will compound." If they are winning, warn against overconfidence. Be real, be a mentor, be someone who has been there.

TONE: Direct, brotherly, grounded. Like a senior trader at a prop desk who genuinely cares. No generic motivational fluff — use their ACTUAL data (instruments, SL hits, rule breaks) in your response. If they are in a losing streak but following rules, CELEBRATE that discipline. That is the hardest thing in trading.

Write in clean paragraphs, not excessive markdown. Keep it natural and easy to read. Around 400-600 words total.`;
}

const hasGeminiKey = () => {
  const k = process.env.GEMINI_API_KEY;
  return Boolean(k && !k.startsWith("your_") && k.length > 10);
};

const hasNvidiaKey = () => {
  const k = process.env.NVIDIA_API_KEY;
  return Boolean(k && k !== "nvapi-YourNvidiaKeyHere" && k.startsWith("nvapi-"));
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { period = "week" } = body;

    if (!["week", "month", "overall"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Use: week, month, or overall" },
        { status: 400 }
      );
    }

    const { start, end } = getDateRange(period);

    const trades = await prisma.trade.findMany({
      where: {
        userId: session.user.id,
        date: { gte: start, lte: end },
      },
      include: {
        emotions: true,
        mistakes: true,
        strategy: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    });

    const metrics = computeMetrics(trades);

    const periodLabels: Record<string, string> = {
      week: "Weekly",
      month: "Monthly",
      overall: "Overall (Last 12 Months)",
    };
    const periodLabel = periodLabels[period] || "Weekly";

    if (metrics.total === 0) {
      return NextResponse.json({
        success: true,
        metrics,
        period,
        periodLabel,
        report: null,
        message: `No trades found for the ${periodLabel.toLowerCase()} period (${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}). Log some trades first!`,
      });
    }

    const reportPrompt = buildReportPrompt(period, metrics, periodLabel);
    const messages = [
      {
        role: "user" as const,
        content: `Generate my ${periodLabel} Trading Report Card based on the data provided.`,
      },
    ];

    let aiResponse;
    const errors: string[] = [];

    if (hasGeminiKey()) {
      try {
        aiResponse = await callGemini(messages, reportPrompt);
      } catch (err: any) {
        errors.push(`Gemini: ${err.message}`);
      }
    }

    if (!aiResponse && hasNvidiaKey()) {
      try {
        aiResponse = await callNvidiaNIM(messages, reportPrompt);
      } catch (err: any) {
        errors.push(`NVIDIA: ${err.message}`);
      }
    }

    if (!aiResponse) {
      return NextResponse.json({
        success: true,
        metrics,
        period,
        periodLabel,
        report: null,
        message: `AI providers unavailable: ${errors.join("; ")}. Metrics are still computed above.`,
      });
    }

    return NextResponse.json({
      success: true,
      metrics,
      period,
      periodLabel,
      report: aiResponse.content,
      modelUsed: aiResponse.modelUsed,
      provider: aiResponse.provider,
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
    });
  } catch (error: any) {
    console.error("[POST /api/ai/report] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
