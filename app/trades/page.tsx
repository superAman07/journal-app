import type { Metadata } from "next";
import { getUserTrades } from "@/lib/actions/trade-actions";
import { TradesView } from "@/components/trades/trades-view";

export const metadata: Metadata = {
  title: "Trade Journal — Trading OS",
  description: "Browse, search, filter, edit, and review all logged trades across instruments and markets.",
};

export default async function TradesPage() {
  const trades = await getUserTrades();

  return <TradesView initialTrades={trades} />;
}
