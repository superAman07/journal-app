import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance Analytics — Trading OS",
  description: "Equity curve, win/loss distribution, RR analysis, and session-level P&L breakdowns.",
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
