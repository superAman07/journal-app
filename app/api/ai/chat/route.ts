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
  return Boolean(k && k !== "nvapi-YourNvidiaKeyHere" && k.startsWith("nvapi-"));
};

const hasGeminiKey = () => {
  const k = process.env.GEMINI_API_KEY;
  return Boolean(k && !k.startsWith("your_") && k.length > 10);
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

    const tradingContext = await getUserTradingContext(session.user.id);

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

    const systemPrompt = buildTradingSystemPrompt(tradingContext, specificTrade);

    let response;
    const errors: string[] = [];

    if (provider === "Google Gemini") {
      try {
        response = await callGemini(messages, systemPrompt, imageUrl, model);
      } catch (err: any) {
        errors.push(`Gemini: ${err.message}`);
        if (hasNvidiaKey()) {
          try {
            response = await callNvidiaNIM(messages, systemPrompt, undefined, imageUrl);
          } catch (nErr: any) {
            errors.push(`NVIDIA fallback: ${nErr.message}`);
          }
        }
      }
    } else if (provider === "NVIDIA NIM") {
      try {
        response = await callNvidiaNIM(messages, systemPrompt, model, imageUrl);
      } catch (err: any) {
        errors.push(`NVIDIA: ${err.message}`);
        if (hasGeminiKey()) {
          try {
            response = await callGemini(messages, systemPrompt, imageUrl);
          } catch (gErr: any) {
            errors.push(`Gemini fallback: ${gErr.message}`);
          }
        }
      }
    } else {
      if (hasGeminiKey()) {
        try {
          response = await callGemini(messages, systemPrompt, imageUrl);
        } catch (err: any) {
          errors.push(`Gemini: ${err.message}`);
        }
      }

      if (!response && hasNvidiaKey()) {
        try {
          response = await callNvidiaNIM(messages, systemPrompt, undefined, imageUrl);
        } catch (err: any) {
          errors.push(`NVIDIA: ${err.message}`);
        }
      }
    }

    if (!response) {
      const configured = [
        hasGeminiKey() ? "Gemini" : null,
        hasNvidiaKey() ? "NVIDIA" : null,
      ].filter(Boolean);

      if (configured.length === 0) {
        throw new Error("No AI provider is configured. Add NVIDIA_API_KEY or GEMINI_API_KEY to your .env file.");
      }
      throw new Error(`AI providers temporarily unavailable: ${errors.join("; ")}`);
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
    const status = msg.includes("429") || msg.includes("rate limit") ? 429 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
