import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getUserTrades, getDashboardMetrics } from "@/lib/actions/trade-actions";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard — Trading OS",
  description: "Overview of trading performance, recent trades, KPIs, and AI-powered insights.",
};

export default async function HomePage() {
  const session = await auth();
  const userName = session?.user?.name || null;
  const trades = await getUserTrades();
  const metrics = await getDashboardMetrics();

  return (
    <DashboardView
      userName={userName}
      isAuthed={!!session?.user}
      initialTrades={trades}
      initialMetrics={metrics}
    />
  );
}
