"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface SavedChatPayload {
  id?: string;
  title: string;
  tradeId?: string;
  messages: any[];
}

export interface SaveChatChunkPayload {
  id?: string;
  title: string;
  tradeId?: string;
  chunkIndex: number;
  totalChunks: number;
  messages: any[];
  totalMessagesCount: number;
}

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
    };

    if (m.modelUsed) sanitized.modelUsed = String(m.modelUsed);

    if (m.reasoning && typeof m.reasoning === "string") {
      sanitized.reasoning =
        m.reasoning.length > 2000 ? m.reasoning.slice(0, 2000) + "..." : m.reasoning;
    }

    if (m.imageUrl && typeof m.imageUrl === "string") {
      // Keep compressed thumbnails up to 350KB so user can see pasted charts in saved sessions
      // Only replace if an uncompressed raw image exceeds 350KB
      sanitized.imageUrl =
        m.imageUrl.length > 350000 ? "[Screenshot Attached]" : m.imageUrl;
    }

    return sanitized;
  });
}

export async function saveChatToDB(data: SavedChatPayload) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const sanitizedMessages = sanitizeMessages(data.messages || []);
    const messageCount = sanitizedMessages.length;

    if (data.id) {
      const existing = await prisma.savedAIChat.findFirst({
        where: { id: data.id, userId: session.user.id },
      });

      if (existing) {
        const updated = await prisma.savedAIChat.update({
          where: { id: existing.id },
          data: {
            title: data.title?.trim() || existing.title,
            tradeId: data.tradeId || null,
            messages: sanitizedMessages,
            messageCount,
          },
        });
        return {
          success: true,
          chat: {
            id: updated.id,
            title: updated.title,
            tradeId: updated.tradeId || undefined,
            messageCount: updated.messageCount,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
        };
      }
    }

    const created = await prisma.savedAIChat.create({
      data: {
        userId: session.user.id,
        title: data.title?.trim() || "Trading Coaching Session",
        tradeId: data.tradeId || null,
        messages: sanitizedMessages,
        messageCount,
      },
    });

    return {
      success: true,
      chat: {
        id: created.id,
        title: created.title,
        tradeId: created.tradeId || undefined,
        messageCount: created.messageCount,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[saveChatToDB] Error:", error);
    return { success: false, error: error.message || "Failed to save chat to database" };
  }
}

/**
 * Dynamic Chunked Chat Persistence
 * Enables saving huge conversations (50+ to 500+ messages and screenshots)
 * without ever exceeding Vercel's 4.5MB Serverless Function payload limit.
 */
export async function saveChatChunkToDB(data: SaveChatChunkPayload) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const sanitizedChunk = sanitizeMessages(data.messages || []);

    if (data.chunkIndex === 0) {
      // Chunk 0: initialize or reset the session record with the first slice of messages
      if (data.id) {
        const existing = await prisma.savedAIChat.findFirst({
          where: { id: data.id, userId: session.user.id },
        });

        if (existing) {
          const updated = await prisma.savedAIChat.update({
            where: { id: existing.id },
            data: {
              title: data.title?.trim() || existing.title,
              tradeId: data.tradeId || null,
              messages: sanitizedChunk,
              messageCount: data.totalMessagesCount,
            },
          });
          return {
            success: true,
            chat: {
              id: updated.id,
              title: updated.title,
              tradeId: updated.tradeId || undefined,
              messageCount: updated.messageCount,
              createdAt: updated.createdAt.toISOString(),
              updatedAt: updated.updatedAt.toISOString(),
            },
          };
        }
      }

      // If no ID or not found, create a new record
      const created = await prisma.savedAIChat.create({
        data: {
          userId: session.user.id,
          title: data.title?.trim() || "Trading Coaching Session",
          tradeId: data.tradeId || null,
          messages: sanitizedChunk,
          messageCount: data.totalMessagesCount,
        },
      });

      return {
        success: true,
        chat: {
          id: created.id,
          title: created.title,
          tradeId: created.tradeId || undefined,
          messageCount: created.messageCount,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      };
    } else {
      // Chunk > 0: append messages to existing session in PostgreSQL
      if (!data.id) {
        return { success: false, error: "Missing session ID for chunk append" };
      }

      const existing = await prisma.savedAIChat.findFirst({
        where: { id: data.id, userId: session.user.id },
      });

      if (!existing) {
        return { success: false, error: "Session record not found for chunk append" };
      }

      const currentMessages = Array.isArray(existing.messages)
        ? (existing.messages as any[])
        : [];
      const combinedMessages = [...currentMessages, ...sanitizedChunk];

      const updated = await prisma.savedAIChat.update({
        where: { id: existing.id },
        data: {
          messages: combinedMessages,
          messageCount: data.totalMessagesCount,
        },
      });

      return {
        success: true,
        chat: {
          id: updated.id,
          title: updated.title,
          tradeId: updated.tradeId || undefined,
          messageCount: updated.messageCount,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    }
  } catch (error: any) {
    console.error("[saveChatChunkToDB] Error:", error);
    return { success: false, error: error.message || "Failed to save chat chunk to database" };
  }
}

export async function getSavedChatsFromDB() {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const chats = await prisma.savedAIChat.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return chats.map((c) => ({
      id: c.id,
      title: c.title,
      tradeId: c.tradeId || undefined,
      messageCount: c.messageCount,
      messages: c.messages as any[],
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("[getSavedChatsFromDB] Error:", error);
    return [];
  }
}

export async function deleteSavedChatFromDB(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existing = await prisma.savedAIChat.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return { success: false, error: "Chat not found or unauthorized" };
    }

    await prisma.savedAIChat.delete({
      where: { id: existing.id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("[deleteSavedChatFromDB] Error:", error);
    return { success: false, error: error.message };
  }
}
