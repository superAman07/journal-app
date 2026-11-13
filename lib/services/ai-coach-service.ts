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

    const [recentTrades, activeRules, todayTrades, strategies, distinctSetups] = await Promise.all([
      prisma.trade.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 15,
        include: {
          emotions: true,
          mistakes: true,
          strategy: { select: { id: true, name: true, timeframe: true, market: true, targetRR: true } },
          screenshots: { select: { url: true, stage: true } },
          ruleCompliance: true,
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
          strategy: { select: { name: true } },
        },
      }),
      prisma.strategy.findMany({
        where: { userId, isArchived: false },
        select: {
          id: true,
          name: true,
          description: true,
          timeframe: true,
          market: true,
          targetRR: true,
          rules: true,
          trades: {
            select: { outcome: true, pnl: true, actualRR: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.trade.findMany({
        where: { userId },
        select: { setup: true },
        distinct: ["setup"],
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

    const userStrategies = strategies.map((s) => {
      const total = s.trades.length;
      const winsCount = s.trades.filter((t) => t.outcome === "WIN").length;
      const stratWinRate = total > 0 ? ((winsCount / total) * 100).toFixed(0) : "N/A";
      const netPnL = s.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgRR =
        total > 0
          ? (s.trades.reduce((sum, t) => sum + (t.actualRR || 0), 0) / total).toFixed(2)
          : "N/A";
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        timeframe: s.timeframe,
        market: s.market,
        targetRR: s.targetRR,
        rules: s.rules,
        totalTrades: total,
        winRate: stratWinRate === "N/A" ? "N/A" : `${stratWinRate}%`,
        netPnL,
        avgRR,
      };
    });

    const recordedSetups = distinctSetups
      .map((d) => d.setup)
      .filter((s): s is string => Boolean(s && s.trim().length > 0));

    return {
      userId,
      recentTrades: recentTrades.map((t) => ({
        id: t.id,
        date: t.date.toISOString().split("T")[0],
        instrument: t.instrument,
        market: t.market,
        strategyName: t.strategy?.name || null,
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
        mindsetBefore: t.mindsetBefore,
        mindsetDuring: t.mindsetDuring,
        mindsetAfter: t.mindsetAfter,
        notes: t.notes,
        emotions: t.emotions.map((e) => e.emotion),
        emotionsByStage: {
          before: t.emotions.filter((e) => e.stage === "BEFORE").map((e) => e.emotion),
          during: t.emotions.filter((e) => e.stage === "DURING").map((e) => e.emotion),
          after: t.emotions.filter((e) => e.stage === "AFTER").map((e) => e.emotion),
        },
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
        strategyName: t.strategy?.name || null,
      })),
      todayPnL,
      activeRules: activeRules.map((r) => `${r.title} (${r.category})`),
      currentStreak: { type: streakType, count: streakCount },
      recentWinRate: `${winRate}%`,
      strategies: userStrategies,
      recordedSetups,
    };
  } catch (error) {
    console.error("[getUserTradingContext] Error:", error);
    return null;
  }
}

export function buildTradingSystemPrompt(context: any, specificTrade?: any): string {
  let contextSummary = "No trade context available.";

  if (context) {
    const tradeSummaries = context.recentTrades.slice(0, 8).map((t: any) => {
      const psychParts: string[] = [];
      if (t.mindsetBefore || t.emotionsByStage?.before?.length) {
        psychParts.push(`Before: "${t.mindsetBefore || "N/A"}" (${t.emotionsByStage?.before?.join(", ") || "neutral"})`);
      }
      if (t.mindsetDuring || t.emotionsByStage?.during?.length) {
        psychParts.push(`During: "${t.mindsetDuring || "N/A"}" (${t.emotionsByStage?.during?.join(", ") || "neutral"})`);
      }
      if (t.mindsetAfter || t.emotionsByStage?.after?.length) {
        psychParts.push(`After: "${t.mindsetAfter || "N/A"}" (${t.emotionsByStage?.after?.join(", ") || "neutral"})`);
      }
      if (t.notes) {
        psychParts.push(`Notes: "${t.notes}"`);
      }
      const psychStr = psychParts.length > 0 ? `\n    • Mindset Arc: ${psychParts.join(" ➔ ")}` : "";
      const mistakesStr = t.mistakes?.length > 0 ? ` | Mistakes: ${t.mistakes.join(", ")}` : "";
      const stratStr = t.strategyName ? ` | Playbook Strategy: [${t.strategyName}]` : "";

      return `${t.date} | ${t.instrument} (${t.market}) | Setup: ${t.setup}${stratStr} | ${t.outcome} (₹${t.pnl}) | RR:${t.actualRR} | Exit:${t.exitReason} | Rules:${t.rulesFollowed ? "followed" : "BROKEN: " + (t.ruleBreakReason || "unspecified")}${mistakesStr}${psychStr}`;
    }).join("\n  ");

    const strategiesSummary = context.strategies && context.strategies.length > 0
      ? context.strategies.map((s: any, idx: number) =>
          `  ${idx + 1}. "${s.name}" (ID: ${s.id})
     • Target Market: ${s.market || "All"} | Timeframe: ${s.timeframe || "Any"} | Target RR: 1:${s.targetRR || "2.0"}
     • Execution Rules / Criteria: ${s.rules || "None logged"}
     • Description: ${s.description || "N/A"}
     • Playbook Stats: ${s.totalTrades} logged trades | Win Rate: ${s.winRate} | Net PnL: ₹${s.netPnL} | Avg RR: ${s.avgRR}`
        ).join("\n")
      : "  No user strategies saved in Playbook yet (trader has not added any strategies in /strategies).";

    const setupsList = context.recordedSetups && context.recordedSetups.length > 0
      ? context.recordedSetups.join(", ")
      : "None logged yet";

    contextSummary = `=== TRADER'S ACTIVE PLAYBOOK & STRATEGIES (FROM DATABASE) ===
${strategiesSummary}
============================================================

=== TRADER'S RECORDED SETUPS IN DATABASE ===
${setupsList}
============================================

=== TRADER PERFORMANCE CONTEXT (STRICTLY THIS USER) ===
Streak: ${context.currentStreak.count}x ${context.currentStreak.type} | Today PnL: ₹${context.todayPnL.toFixed(0)} | Today Trades: ${context.todayTrades.length} | Win Rate: ${context.recentWinRate}
Global Trading Rules: ${context.activeRules.length > 0 ? context.activeRules.join(" | ") : "None set"}
Recent Trades & Psychology History:
  ${tradeSummaries || "No trades yet"}
======================================================`;
  }

  let specificSection = "";
  if (specificTrade) {
    const beforeEmotions = specificTrade.emotions?.filter((e: any) => e.stage === "BEFORE").map((e: any) => e.emotion) || [];
    const duringEmotions = specificTrade.emotions?.filter((e: any) => e.stage === "DURING").map((e: any) => e.emotion) || [];
    const afterEmotions = specificTrade.emotions?.filter((e: any) => e.stage === "AFTER").map((e: any) => e.emotion) || [];
    const mistakes = specificTrade.mistakes?.map((m: any) => m.mistake || m) || [];
    const complianceItems = specificTrade.ruleCompliance?.map((rc: any) => `  - [${rc.followed ? "✓ PASSED" : "✗ BROKEN"}] ${rc.ruleName}${rc.note ? `: ${rc.note}` : ""}`) || [];

    specificSection = `
=== CURRENT FOCUSED TRADE & 3-PHASE PSYCHOLOGY JOURNAL ===
Instrument: ${specificTrade.instrument} (${specificTrade.market}) | Setup Tag: ${specificTrade.setup || "N/A"} | Bias: ${specificTrade.bias || "N/A"}
Linked Playbook Strategy: ${specificTrade.strategy?.name ? `"${specificTrade.strategy.name}"` : "None linked explicitly"}
Result: ${specificTrade.outcome} | PnL: ₹${specificTrade.pnl} | Planned RR: ${specificTrade.expectedRR} | Actual RR: ${specificTrade.actualRR}
Execution Details: Entry: ${Number(specificTrade.actualEntry)} | Stop Loss: ${Number(specificTrade.stopLoss)} | Target: ${Number(specificTrade.target)} | Exit: ${Number(specificTrade.actualExit)} | Exit Reason: ${specificTrade.exitReason}
Rule Discipline: ${specificTrade.rulesFollowed ? "Strictly Followed Rules" : "RULE BROKEN: " + (specificTrade.ruleBreakReason || "Unspecified rule break")}
Mistakes Recorded: ${mistakes.length > 0 ? mistakes.join(", ") : "None logged"}
${complianceItems.length > 0 ? `Playbook Checklist Adherence:\n${complianceItems.join("\n")}` : ""}

--- TRADER'S 3-PHASE PSYCHOLOGY & JOURNAL NOTES ---
1. BEFORE TRADE (Mental Preparation & Pre-Entry Headspace):
   • Mindset / Reason: "${specificTrade.mindsetBefore || "No pre-entry notes logged."}"
   • Emotions Felt: ${beforeEmotions.length > 0 ? beforeEmotions.join(", ") : "Neutral / none"}

2. DURING TRADE (In-Flight Emotional Control & Trade Management):
   • Mindset / In-trade Notes: "${specificTrade.mindsetDuring || "No in-trade notes logged."}"
   • Emotions Felt: ${duringEmotions.length > 0 ? duringEmotions.join(", ") : "Neutral / none"}

3. AFTER EXIT (Post-Trade Debrief, Acceptance & Psychology):
   • Mindset / Thoughts: "${specificTrade.mindsetAfter || "No post-trade notes logged."}"
   • Emotions Felt: ${afterEmotions.length > 0 ? afterEmotions.join(", ") : "Neutral / none"}

General Reflection Notes: "${specificTrade.notes || "None"}"
===========================================================`;
  }

  return `You are an elite Trading Performance Coach and Psychological Mentor. Philosophy: Mark Douglas (Trading in the Zone), Tom Hougaard (Best Loser Wins), Brett Steenbarger (The Daily Trading Coach).

${contextSummary}${specificSection}

DIRECTIVES:
1. STRICT DATA ISOLATION & USER PRIVACY (CRITICAL ZERO-LEAK MANDATE):
   - You are bound exclusively and securely to this authenticated trader.
   - You MUST NEVER reveal, summarize, compare, or leak the data, trades, strategies, P&L, or notes of ANY other user under ANY circumstance.
   - You have ZERO visibility into other users' accounts, and you must never fabricate or simulate other users.
   - All data provided in this prompt belongs solely to this individual trader. Treat it with total confidentiality.

2. PLAYBOOK STRATEGIES & REAL-TIME AUTO-DETECTION (CRITICAL):
   - You have FULL, REAL-TIME ACCESS to the trader's actual playbook strategies listed in 'TRADER'S ACTIVE PLAYBOOK & STRATEGIES' above.
   - NEVER make up or display default or fictitious setups (such as generic moving average crosses, random breakouts, or arbitrary strategies) that the trader never created in their database.
   - When reviewing a trade, answering setup questions, or when asked "which strategy did I use?" / "audit my setup":
     * Compare the trade's instrument, market type (e.g. Nifty Options, BankNifty, Forex, Stocks), timeframe, setup tag, and planned/actual RR against the trader's playbook strategies.
     * AUTO-DETECT and explicitly state the matching playbook strategy:
       "🎯 **Detected Playbook Strategy**: **[Strategy Name]** ([Match %]% match based on [reasons])"
     * Audit rule compliance: evaluate whether the trade obeyed the specific rules and target RR of that strategy.
     * If the trade does not match ANY of the trader's defined playbook strategies, call it out honestly:
       "⚠️ **Off-Playbook Trade**: This trade does not match any of your defined Playbook strategies ([list active strategies]). This looks like an impulsive, emotional, or discretionary trade outside your tested edge."
   - If the trader has no strategies created in their database yet, guide them:
     "You haven't defined any strategies in your Playbook yet. Head to the Strategies page to add your entry criteria, rules, and target RR, and I will automatically audit every trade against your edge."

3. INTENT & GREETING CALIBRATION (CRITICAL):
   - If the user says a greeting, casual opener, or short pleasantry (e.g. "hey", "hello", "hi", "how are you", "what's up", "good morning", "yo"):
     Respond CASUALLY, WARMLY, and BRIEFLY in 1–2 sentences.
     Example: "Hey Aman! Good to see you. How's your headspace today—ready to review a setup, audit your playbook, or just checking in before the open?"
   - DO NOT dump an unprompted 5-paragraph loss analysis, terminal-locking lecture, or unsolicited trade breakdown on a simple greeting!
   - Keep the DB context and focused trade in reserve in your knowledge base. ONLY launch into detailed trade breakdowns, discipline challenges, loss interventions, or visual charts when the user asks a question, requests a review, discusses trading, or clicks a prompt.

4. 3-PHASE PSYCHOLOGY BREAKDOWN (BEFORE, DURING, AFTER):
   - You have FULL, DIRECT ACCESS to the trader's personal journal notes across all 3 phases: Before Entry, During Trade, and After Exit.
   - When the user asks about this trade or their mental state, ALWAYS review and reference their exact recorded thoughts and emotions:
     * Assess their clarity and discipline before entering (did they wait patiently or rush?).
     * Assess how they handled emotions while the trade was open (did fear or greed urge them to tamper with the trade?).
     * Assess their post-exit debrief (process acceptance vs frustration / revenge urge).
   - Never claim you don't have access to their personal notes — quote their words directly to guide and mentor them.

5. TRADING PHILOSOPHY & DISCIPLINE:
   - Losses and wick-outs are the normal cost of business. A planned stop-loss hit is 10/10 execution.
   - Only true failure = revenge trading, moving stops, widening risk, chasing entries, overtrading.
   - Empathy + Firm Discipline: Validate psychological friction, then pivot to process and capital preservation.
   - If discussing a loss or losing streak: Remind trader to preserve capital and provide a clear discipline challenge.

6. AUTONOMOUS VISUAL DRAWINGS (When helpful):
   Whenever you believe an explanation, comparison, trade post-mortem, or performance review is best understood VISUALLY, emit ONE visual block using the TRADER'S ACTUAL DB DATA.
   NEVER use hardcoded placeholder values (no fake instruments or numbers if the trader traded something else).
   Valid formats:
   \`\`\`visual:setup
   {
     "instrument": "<Trader's Actual Instrument>",
     "direction": "<LONG or SHORT>",
     "entry": <Actual Entry Number>,
     "stopLoss": <Actual Stop Loss Number>,
     "target": <Actual Target Number>,
     "plannedRR": "<e.g. 1:2.0>",
     "outcome": "<Actual Outcome>",
     "verdict": "<Honest coaching verdict>",
     "lesson": "<Actionable takeaway>"
   }
   \`\`\`
   Other supported blocks: \`\`\`visual:chart, \`\`\`visual:flowchart, \`\`\`visual:gauge.
   CODE BLOCK INTEGRITY: ALWAYS output valid JSON and CLOSE properly with triple backticks.

7. SMART COACHING & ACTIONABLE NEXT STEPS:
   At the end of your coaching review or trade analysis, always offer 2 concise, highly relevant next actions or follow-up questions tailored to what was discussed (e.g., checking strategy rule compliance, auditing emotional patterns across recent losses, or setting a 1-trade discipline rule for the next session).

8. CHART VISION & SCREENSHOTS:
   When the user attaches or pastes a chart screenshot, analyze the visible candlestick structure, key levels, moving averages, VWAP, wicks, and rejection points with precision. Directly correlate what you see on the chart with their trade thesis and execution psychology.

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

  const configuredDefault = process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";
  const primaryModel = imageUrl
    ? "meta/llama-3.2-11b-vision-instruct"
    : (model || configuredDefault);

  const candidateModels = imageUrl
    ? ["meta/llama-3.2-11b-vision-instruct"]
    : [
        primaryModel,
        "meta/llama-3.2-11b-vision-instruct",
        "openai/gpt-oss-20b",
        "nvidia/nemotron-3-super-120b-a12b",
      ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

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

  let lastError: Error | null = null;

  for (const currentModel of candidateModels) {
    try {
      const payload: any = {
        model: currentModel,
        messages: formattedMessages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2048,
      };

      if (!imageUrl && !currentModel.includes("gpt-oss")) {
        payload.chat_template_kwargs = { enable_thinking: false };
      }

      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[callNvidiaNIM] ${currentModel} returned ${res.status}:`, errorText.slice(0, 150));
        lastError = new Error(`NVIDIA API error (${res.status}): ${errorText}`);
        continue;
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || choice?.message?.reasoning_content || "";
      const reasoning = choice?.message?.reasoning_content || "";

      if (!content.trim()) {
        console.warn(`[callNvidiaNIM] ${currentModel} returned empty text, trying next fallback...`);
        continue;
      }

      return {
        content,
        reasoning,
        modelUsed: data.model || currentModel,
        provider: "NVIDIA NIM",
      };
    } catch (err: any) {
      console.warn(`[callNvidiaNIM] Exception on ${currentModel}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("NVIDIA NIM API call failed across all candidate models");
}

export async function callGemini(
  messages: AIChatMessage[],
  systemPrompt: string,
  imageUrl?: string,
  preferredModel = "gemini-3.6-flash"
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
    preferredModel || "gemini-3.6-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-flash-lite-latest",
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
            maxOutputTokens: 2500,
          },
        }),
        signal: AbortSignal.timeout(14000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[callGemini] ${model} returned ${res.status}:`, errorText.slice(0, 150));
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
