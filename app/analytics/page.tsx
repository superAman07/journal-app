import type { Metadata } from "next";
import { getUserTrades } from "@/lib/actions/trade-actions";
import { fetchUsdToInrRate } from "@/lib/utils/currency";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = {
  title: "Performance Analytics — Trading OS",
  description: "Equity curve, distributions, session breakdowns, and holding time analysis.",
};

export default async function AnalyticsPage() {
  const trades = await getUserTrades();
  const usdInrRate = await fetchUsdToInrRate();

  return <AnalyticsView initialTrades={trades} usdInrRate={usdInrRate} />;
}
