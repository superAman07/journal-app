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

export function buildTradingSystemPrompt(context: any, specificTrade?: any): string {
  let contextSummary = "No trade context available.";

  if (context) {
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
6. Readability: Write in clean, comfortable paragraphs. Avoid symbol clutter and excessive asterisks. Keep it natural and easy to read.

Reminder: "Survival first, execution second, profit takes care of itself."`;
}

export async function callNvidiaNIM(
  messages: AIChatMessage[],
  systemPrompt: string,
  model?: string,
  imageUrl?: string
): Promise<AICoachResponse> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey === "nvapi-YourNvidiaKeyHere") {
    throw new Error("NVIDIA_API_KEY is not configured in .env");
  }

  const effectiveModel = imageUrl
    ? "meta/llama-3.2-11b-vision-instruct"
    : (model || process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b");

  const formattedMessages: any[] = [{ role: "system", content: systemPrompt }];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (imageUrl && i === messages.length - 1 && msg.role === "user") {
      formattedMessages.push({
        role: "user",
        content: [
          { type: "text", text: msg.content },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      });
    } else {
      formattedMessages.push({ role: msg.role, content: msg.content });
    }
  }

  const payload: any = {
    model: effectiveModel,
    messages: formattedMessages,
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 800,
  };

  if (!imageUrl) {
    payload.chat_template_kwargs = { enable_thinking: false };
  }

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000),
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
    modelUsed: data.model || effectiveModel,
    provider: "NVIDIA NIM",
  };
}

export async function callGemini(
  messages: AIChatMessage[],
  systemPrompt: string,
  imageUrl?: string,
  preferredModel = "gemini-flash-lite-latest"
): Promise<AICoachResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const contents: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role === "assistant" ? "model" : "user";
    const parts: any[] = [{ text: msg.content }];

    if (imageUrl && i === messages.length - 1 && msg.role === "user") {
      if (imageUrl.startsWith("data:")) {
        const matches = imageUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inline_data: {
              mime_type: matches[1],
              data: matches[2],
            },
          });
        }
      } else {
        parts.push({
          file_data: {
            file_uri: imageUrl,
            mime_type: "image/jpeg",
          },
        });
      }
    }

    contents.push({ role, parts });
  }

  const modelsToTry = [
    preferredModel || "gemini-flash-lite-latest",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
        signal: AbortSignal.timeout(18000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[callGemini] ${model} returned ${res.status}:`, errorText);
        lastError = new Error(`Gemini (${model}) error (${res.status}): ${errorText}`);
        continue;
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text || "No response received.";

      return {
        content,
        modelUsed: model,
        provider: "Google Gemini",
      };
    } catch (err: any) {
      console.warn(`[callGemini] Exception on model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Gemini API call failed across all candidate models");
}
