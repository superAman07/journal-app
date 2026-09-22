import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserTradingContext,
  buildTradingSystemPrompt,
  callNvidiaNIM,
  callGemini,
} from "@/lib/services/ai-coach-service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, tradeId, imageUrl, provider = "NVIDIA NIM", model } = body;

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

    // 4. Call selected AI Provider
    let response;
    if (provider === "Google Gemini" || (imageUrl && !process.env.NVIDIA_API_KEY)) {
      response = await callGemini(messages, systemPrompt, imageUrl);
    } else {
      try {
        response = await callNvidiaNIM(messages, systemPrompt, model);
      } catch (err: any) {
        // Fallback to Gemini if NVIDIA fails, or return helpful advice
        console.warn("[API /ai/chat] NVIDIA call failed, attempting Gemini fallback:", err?.message);
        if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith("your_")) {
          response = await callGemini(messages, systemPrompt, imageUrl);
        } else {
          throw err;
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
    return NextResponse.json(
      {
        error: error.message || "Failed to process AI chat request",
      },
      { status: 500 }
    );
  }
}
