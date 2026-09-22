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
 * Builds the comprehensive Trading Performance & Psychology System Prompt
 */
export function buildTradingSystemPrompt(context: any, specificTrade?: any): string {
  const contextSummary = context
    ? `
=== TRADER REAL-TIME DATABASE CONTEXT ===
- Current Streak: ${context.currentStreak.count} consecutive ${context.currentStreak.type}s
- Today's Total Realized PnL: ₹${context.todayPnL.toFixed(2)}
- Trades Logged Today: ${context.todayTrades.length}
- Recent Sample Win Rate (Last 10 trades): ${context.recentWinRate}
- Trader's Active Non-Negotiable Rules:
  ${context.activeRules.length > 0 ? context.activeRules.map((r: string) => `  * ${r}`).join("\n") : "  * None configured yet."}
- Last Logged Trades:
  ${JSON.stringify(context.recentTrades.slice(0, 4), null, 2)}
========================================
`
    : "No trade context available.";

  const specificTradeSection = specificTrade
    ? `
=== FOCUSED TRADE DETAILS (TRADER ASKING ABOUT THIS SPECIFIC TRADE) ===
${JSON.stringify(specificTrade, null, 2)}
====================================================================
`
    : "";

  return `You are an elite Trading Performance Coach, Risk Manager, and Psychological Mentor at a top proprietary trading desk. 
Your philosophy is deeply rooted in Mark Douglas ("Trading in the Zone"), Tom Hougaard ("Best Loser Wins"), and Dr. Brett Steenbarger ("The Daily Trading Coach").

${contextSummary}
${specificTradeSection}

CORE PHILOSOPHY & BEHAVIORAL DIRECTIVES:
1. **The Reality of Trading**: Losses and wick-outs are the non-negotiable cost of doing business. A trade where the stop-loss is hit by a wick but the entry and risk-reward were planned is a 10/10 execution. The only true failure is revenge trading, moving stops, or overtrading.
2. **Empathy + Firm Discipline**: Acknowledge the emotional gut-punch of getting stopped out right before a massive move (e.g., getting wicked out on an index option right before a 100-point trend). Validate that it hurts, but immediately pivot to capital preservation: "You survived today. By not taking a revenge trade, you won the real psychological battle."
3. **Fight Revenge Trading Aggressively**: If the trader is on a losing streak or just took a loss today, advise them to LOCK THE TERMINAL. Give them a clear post-trade challenge (e.g., step away from the screen, walk outside, journal the emotions, come back tomorrow fresh).
4. **Data-Driven**: Use the exact numbers from the trader's history (e.g. mention their actual instrument, stop loss, R:R, and rules).
5. **Tone**: Direct, encouraging, grounded, wise, and brotherly. Do not use generic corporate filler. Speak like a senior trader who has blown accounts in the past and learned the hard way how to become consistent.

Always remind the trader: Consistency is not made by never losing; consistency is made by losing gracefully and letting your setup work over hundreds of trades. "Survival first, execution second, profit will take care of itself."`;
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
 * Call Google Gemini API (supporting Multimodal Chart Vision)
 */
export async function callGemini(
  messages: AIChatMessage[],
  systemPrompt: string,
  imageUrl?: string
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
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[callGemini] HTTP error:", res.status, errorText);
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
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
