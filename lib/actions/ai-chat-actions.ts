"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface SavedChatPayload {
  id?: string;
  title: string;
  tradeId?: string;
  messages: any[];
}

export async function saveChatToDB(data: SavedChatPayload) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const messageCount = data.messages.length;

    if (data.id) {
      const existing = await prisma.savedAIChat.findFirst({
        where: { id: data.id, userId: session.user.id },
      });

      if (existing) {
        const updated = await prisma.savedAIChat.update({
          where: { id: data.id },
          data: {
            title: data.title,
            tradeId: data.tradeId || null,
            messages: data.messages,
            messageCount,
          },
        });
        return {
          success: true,
          chat: {
            id: updated.id,
            title: updated.title,
            tradeId: updated.tradeId || undefined,
            messages: updated.messages as any[],
            messageCount: updated.messageCount,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
        };
      }
    }

    const created = await prisma.savedAIChat.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        userId: session.user.id,
        title: data.title,
        tradeId: data.tradeId || null,
        messages: data.messages,
        messageCount,
      },
    });

    return {
      success: true,
      chat: {
        id: created.id,
        title: created.title,
        tradeId: created.tradeId || undefined,
        messages: created.messages as any[],
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
    await prisma.savedAIChat.delete({
      where: { id, userId: session.user.id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("[deleteSavedChatFromDB] Error:", error);
    return { success: false, error: error.message };
  }
}
