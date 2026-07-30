import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard — Trading OS",
  description: "Overview of trading performance, recent trades, KPIs, and AI-powered insights.",
};

export default function HomePage() {
  return <DashboardView />;
}
