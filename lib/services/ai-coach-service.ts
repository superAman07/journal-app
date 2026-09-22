import { prisma } from "@/lib/prisma";

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AICoachResponse {
  content: string;
  reasoning?: string;
  modelUsed: string;
  provider: string;
}

/**
 * Fetches user trading history, rules, and streaks to feed as context into the AI
 */
export async function getUserTradingContext(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [recentTrades, activeRules, todayTrades] = await Promise.all([
      prisma.trade.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 10,
        include: {
          emotions: true,
          mistakes: true,
          strategy: { select: { name: true } },
          screenshots: { select: { url: true, stage: true } },
        },
      }),
      prisma.tradingRule.findMany({
        where: { userId, isActive: true },
        select: { title: true, category: true, description: true },
      }),
      prisma.trade.findMany({
        where: {
          userId,
          date: { gte: today },
        },
        orderBy: { date: "desc" },
        include: {
          emotions: true,
          mistakes: true,
        },
      }),
    ]);

    // Calculate current win/loss streak
    let streakCount = 0;
    let streakType: "WIN" | "LOSS" | "BREAKEVEN" | "NONE" = "NONE";

    for (const trade of recentTrades) {
      const outcome = trade.outcome as "WIN" | "LOSS" | "BREAKEVEN";
      if (streakType === "NONE") {
        streakType = outcome;
        streakCount = 1;
      } else if (streakType === outcome) {
        streakCount++;
      } else {
        break;
      }
    }

    const totalTrades = recentTrades.length;
    const wins = recentTrades.filter((t) => t.outcome === "WIN").length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0";
    const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    return {
      recentTrades: recentTrades.map((t) => ({
        id: t.id,
        date: t.date.toISOString().split("T")[0],
        instrument: t.instrument,
        market: t.market,
        setup: t.setup,
        outcome: t.outcome,
        pnl: t.pnl,
        actualRR: t.actualRR,
        expectedRR: t.expectedRR,
        actualEntry: Number(t.actualEntry),
        stopLoss: Number(t.stopLoss),
        actualExit: Number(t.actualExit),
        target: Number(t.target),
        exitReason: t.exitReason,
        rulesFollowed: t.rulesFollowed,
        ruleBreakReason: t.ruleBreakReason,
        mindsetAfter: t.mindsetAfter,
        emotions: t.emotions.map((e) => e.emotion),
        mistakes: t.mistakes.map((m) => m.mistake),
        hasScreenshot: t.screenshots.length > 0,
        screenshotUrl: t.screenshots[0]?.url,
      })),
      todayTrades: todayTrades.map((t) => ({
        instrument: t.instrument,
        outcome: t.outcome,
        pnl: t.pnl,
        actualRR: t.actualRR,
        exitReason: t.exitReason,
        rulesFollowed: t.rulesFollowed,
      })),
      todayPnL,
      activeRules: activeRules.map((r) => `${r.title} (${r.category})`),
      currentStreak: { type: streakType, count: streakCount },
      recentWinRate: `${winRate}%`,
    };
  } catch (error) {
    console.error("[getUserTradingContext] Error:", error);
    return null;
  }
}

/**
 * Builds a TOKEN-EFFICIENT Trading Performance & Psychology System Prompt
 * Uses compact one-line trade summaries instead of full JSON to stay within free-tier token limits
 */
export function buildTradingSystemPrompt(context: any, specificTrade?: any): string {
  let contextSummary = "No trade context available.";

  if (context) {
    // Compact one-line trade summaries — saves ~70% tokens vs JSON.stringify
    const tradeSummaries = context.recentTrades.slice(0, 5).map((t: any) =>
      `${t.date} | ${t.instrument} | ${t.outcome} | PnL:${t.pnl} | RR:${t.actualRR} | Exit:${t.exitReason} | Emotions:${t.emotions.join(",") || "none"} | Rules:${t.rulesFollowed ? "yes" : "BROKEN"}`
    ).join("\n  ");

    contextSummary = `=== TRADER DB CONTEXT ===
Streak: ${context.currentStreak.count}x ${context.currentStreak.type} | Today PnL: ₹${context.todayPnL.toFixed(0)} | Today Trades: ${context.todayTrades.length} | Win Rate (last 10): ${context.recentWinRate}
Rules: ${context.activeRules.length > 0 ? context.activeRules.join(" | ") : "None set"}
Recent Trades:
  ${tradeSummaries || "No trades yet"}
========================`;
  }

  let specificSection = "";
  if (specificTrade) {
    specificSection = `\n=== FOCUSED TRADE ===\n${specificTrade.instrument} | ${specificTrade.market} | ${specificTrade.outcome} | Entry:${Number(specificTrade.actualEntry)} SL:${Number(specificTrade.stopLoss)} Target:${Number(specificTrade.target)} Exit:${Number(specificTrade.actualExit)} | PnL:${specificTrade.pnl} | RR:${specificTrade.actualRR} | Exit Reason:${specificTrade.exitReason} | Rules:${specificTrade.rulesFollowed ? "followed" : "BROKEN: " + (specificTrade.ruleBreakReason || "unknown")}\n=====================`;
  }

  return `You are an elite Trading Performance Coach and Psychological Mentor. Philosophy: Mark Douglas (Trading in the Zone), Tom Hougaard (Best Loser Wins), Brett Steenbarger (The Daily Trading Coach).

${contextSummary}${specificSection}

DIRECTIVES:
1. Losses and wick-outs are the cost of business. A planned stop-loss hit is 10/10 execution. Only true failure = revenge trading, moving stops, overtrading.
2. Empathy + Firm Discipline: Validate the pain, then pivot to capital preservation.
3. If trader took a loss or is on a losing streak: LOCK THE TERMINAL. Give a clear discipline challenge.
4. Use the trader's actual data (instrument, SL, RR, rules) in your response.
5. Tone: Direct, brotherly, grounded. No generic filler. Speak like a senior trader who learned the hard way.

Reminder: "Survival first, execution second, profit takes care of itself."`;
}

/**
 * Call NVIDIA NIM API with Nemotron 550B or DeepSeek R1
 */
export async function callNvidiaNIM(
  messages: AIChatMessage[],
  systemPrompt: string,
  model = "nvidia/nemotron-3-ultra-550b-a55b"
): Promise<AICoachResponse> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey === "nvapi-YourNvidiaKeyHere") {
    throw new Error("NVIDIA_API_KEY is not configured in .env");
  }

  const payload = {
    model: process.env.NVIDIA_MODEL || model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
    chat_template_kwargs: { enable_thinking: true },
  };

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[callNvidiaNIM] HTTP error:", res.status, errorText);
    throw new Error(`NVIDIA API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content || "";
  const reasoning = choice?.message?.reasoning_content || "";

  return {
    content,
    reasoning,
    modelUsed: data.model || model,
    provider: "NVIDIA NIM",
  };
}

/**
 * Call Google Gemini API with retry for 429 rate limits
 */
export async function callGemini(
  messages: AIChatMessage[],
  systemPrompt: string,
  imageUrl?: string,
  retryCount = 0
): Promise<AICoachResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const contents: any[] = [];

  for (const msg of messages) {
    const role = msg.role === "assistant" ? "model" : "user";
    const parts: any[] = [{ text: msg.content }];

    if (imageUrl && msg.role === "user") {
      parts.push({
        file_data: {
          file_uri: imageUrl,
          mime_type: "image/jpeg",
        },
      });
    }

    contents.push({ role, parts });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  // Handle 429 rate limit with auto-retry (max 2 retries)
  if (res.status === 429 && retryCount < 2) {
    const retryBody = await res.json().catch(() => null);
    const retryDelay = retryBody?.error?.details?.find((d: any) => d.retryDelay)?.retryDelay;
    const waitMs = retryDelay ? parseInt(retryDelay) * 1000 : (retryCount + 1) * 15000;
    const waitSec = Math.ceil(waitMs / 1000);
    console.warn(`[callGemini] Rate limited (429). Retrying in ${waitSec}s (attempt ${retryCount + 1}/2)`);
    await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 30000)));
    return callGemini(messages, systemPrompt, imageUrl, retryCount + 1);
  }

  if (res.status === 429) {
    throw new Error("Gemini is temporarily rate-limited. Your free quota resets in ~30 seconds. Please try again shortly, or switch to NVIDIA 550B.");
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[callGemini] HTTP error:", res.status, errorText);
    throw new Error(`Gemini is temporarily unavailable (${res.status}). Try switching to NVIDIA 550B.`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const content = candidate?.content?.parts?.[0]?.text || "No response received.";

  return {
    content,
    modelUsed: "gemini-3.6-flash",
    provider: "Google Gemini",
  };
}
