import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserTradingContext,
  buildTradingSystemPrompt,
  callNvidiaNIM,
  callGemini,
} from "@/lib/services/ai-coach-service";

const hasNvidiaKey = () => {
  const k = process.env.NVIDIA_API_KEY;
  return k && k !== "nvapi-YourNvidiaKeyHere" && k.startsWith("nvapi-");
};

const hasGeminiKey = () => {
  const k = process.env.GEMINI_API_KEY;
  return k && !k.startsWith("your_") && k.length > 10;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, tradeId, imageUrl, provider = "Auto", model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // 1. Fetch user's DB trading context
    const tradingContext = await getUserTradingContext(session.user.id);

    // 2. If a specific trade was selected, load its full details
    let specificTrade = null;
    if (tradeId) {
      specificTrade = await prisma.trade.findUnique({
        where: { id: tradeId, userId: session.user.id },
        include: {
          emotions: true,
          mistakes: true,
          screenshots: true,
          strategy: true,
          ruleCompliance: true,
        },
      });
    }

    // 3. Build the tailored system prompt
    const systemPrompt = buildTradingSystemPrompt(tradingContext, specificTrade);

    // 4. Smart Provider Routing
    let response;
    const errors: string[] = [];

    if (provider === "Google Gemini") {
      // Explicitly selected Gemini
      response = await callGemini(messages, systemPrompt, imageUrl);
    } else if (provider === "NVIDIA NIM") {
      // Explicitly selected NVIDIA
      response = await callNvidiaNIM(messages, systemPrompt, model);
    } else {
      // AUTO MODE: Try providers in order of reliability
      // Priority: NVIDIA (has your key, separate quota) → Gemini (free tier, shared quota)
      
      if (hasNvidiaKey()) {
        try {
          response = await callNvidiaNIM(messages, systemPrompt, model);
        } catch (err: any) {
          errors.push(`NVIDIA: ${err.message}`);
          console.warn("[Auto] NVIDIA failed:", err.message);
        }
      }

      if (!response && hasGeminiKey()) {
        try {
          response = await callGemini(messages, systemPrompt, imageUrl);
        } catch (err: any) {
          errors.push(`Gemini: ${err.message}`);
          console.warn("[Auto] Gemini failed:", err.message);
        }
      }

      if (!response) {
        const configured = [
          hasNvidiaKey() ? "NVIDIA" : null,
          hasGeminiKey() ? "Gemini" : null,
        ].filter(Boolean);

        if (configured.length === 0) {
          throw new Error("No AI provider is configured. Add NVIDIA_API_KEY or GEMINI_API_KEY to your .env file.");
        } else {
          throw new Error(`All AI providers are temporarily unavailable. ${errors.join(" | ")}. Please retry in a moment.`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: response.content,
      reasoning: response.reasoning || null,
      modelUsed: response.modelUsed,
      provider: response.provider,
    });
  } catch (error: any) {
    console.error("[POST /api/ai/chat] Error:", error);
    
    const msg = error.message || "Failed to process AI chat request";
    const status = msg.includes("429") || msg.includes("rate-limit") ? 429 : 500;
    
    return NextResponse.json(
      { error: msg },
      { status }
    );
  }
}
