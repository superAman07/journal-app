import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getUserTrades } from "@/lib/actions/trade-actions";
import { prisma } from "@/lib/prisma";
import { AIChatInterface } from "@/components/ai-coach/ai-chat-interface";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "AI Coach & Psychology Desk — Trading OS",
  description: "AI-powered trading mentor, trade breakdown, and psychological discipline companion.",
};

export default async function AICoachPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let trades: any[] = [];
  let rulesCount = 0;

  if (userId) {
    [trades, rulesCount] = await Promise.all([
      getUserTrades(),
      prisma.tradingRule.count({ where: { userId, isActive: true } }),
    ]);
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading AI Coach Desk...</div>}>
      <AIChatInterface initialTrades={trades} rulesCount={rulesCount} />
    </Suspense>
  );
}
