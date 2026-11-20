import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

function sanitizeMessages(messages: any[]): any[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => {
    const sanitized: any = {
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content : String(m.content || ""),
      timestamp:
        typeof m.timestamp === "string"
          ? m.timestamp
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: typeof m.date === "string" ? m.date : new Date().toISOString().split("T")[0],
    };

    if (m.modelUsed) sanitized.modelUsed = String(m.modelUsed);

    if (m.reasoning && typeof m.reasoning === "string") {
      sanitized.reasoning =
        m.reasoning.length > 2000 ? m.reasoning.slice(0, 2000) + "..." : m.reasoning;
    }

    if (m.imageUrl && typeof m.imageUrl === "string") {
      // Keep compressed thumbnails up to 250KB; truncate raw giant uploads to safeguard DB
      sanitized.imageUrl =
        m.imageUrl.length > 250000 ? "[Screenshot Attached]" : m.imageUrl;
    }

    if (m.screenshotUrl && typeof m.screenshotUrl === "string") {
      sanitized.screenshotUrl =
        m.screenshotUrl.length > 250000 ? "[Screenshot Attached]" : m.screenshotUrl;
    }

    return sanitized;
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      title,
      tradeId,
      messages = [],
      chunkIndex,
      totalChunks,
      totalMessagesCount,
    } = body;

    const sanitizedMessages = sanitizeMessages(messages);
    const totalCount =
      typeof totalMessagesCount === "number"
        ? totalMessagesCount
        : sanitizedMessages.length;

    // Handle Chunked Save (chunkIndex > 0: append to existing session)
    if (typeof chunkIndex === "number" && chunkIndex > 0) {
      if (!id) {
        return NextResponse.json(
          { success: false, error: "Missing session ID for chunk append" },
          { status: 400 }
        );
      }

      const existing = await prisma.savedAIChat.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Session record not found for chunk append" },
          { status: 404 }
        );
      }

      const currentMessages = Array.isArray(existing.messages)
        ? (existing.messages as any[])
        : [];
      const combinedMessages = [...currentMessages, ...sanitizedMessages];

      const updated = await prisma.savedAIChat.update({
        where: { id: existing.id },
        data: {
          messages: combinedMessages,
          messageCount: totalCount,
        },
      });

      return NextResponse.json({
        success: true,
        chat: {
          id: updated.id,
          title: updated.title,
          tradeId: updated.tradeId || undefined,
          messageCount: updated.messageCount,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    // First chunk (chunkIndex === 0) or Full Save (chunkIndex === undefined)
    if (id) {
      const existing = await prisma.savedAIChat.findFirst({
        where: { id, userId: session.user.id },
      });

      if (existing) {
        const updated = await prisma.savedAIChat.update({
          where: { id: existing.id },
          data: {
            title: title?.trim() || existing.title,
            tradeId: tradeId || null,
            messages: sanitizedMessages,
            messageCount: totalCount,
          },
        });

        return NextResponse.json({
          success: true,
          chat: {
            id: updated.id,
            title: updated.title,
            tradeId: updated.tradeId || undefined,
            messageCount: updated.messageCount,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
        });
      }
    }

    // New Session
    const created = await prisma.savedAIChat.create({
      data: {
        userId: session.user.id,
        title: title?.trim() || "Trading Coaching Session",
        tradeId: tradeId || null,
        messages: sanitizedMessages,
        messageCount: totalCount,
      },
    });

    return NextResponse.json({
      success: true,
      chat: {
        id: created.id,
        title: created.title,
        tradeId: created.tradeId || undefined,
        messageCount: created.messageCount,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[/api/ai/save-chat] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save chat" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const chats = await prisma.savedAIChat.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = chats.map((c) => ({
      id: c.id,
      title: c.title,
      tradeId: c.tradeId || undefined,
      messageCount: c.messageCount,
      messages: c.messages as any[],
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, chats: formatted });
  } catch (error: any) {
    console.error("[/api/ai/save-chat GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load chats" },
      { status: 500 }
    );
  }
}

