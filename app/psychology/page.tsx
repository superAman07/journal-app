import type { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit, Plus, HeartPulse } from "lucide-react";
import { getUserTrades } from "@/lib/actions/trade-actions";

export const metadata: Metadata = {
  title: "Psychology Tracker — Trading OS",
  description: "Monitor emotional patterns and their impact on trading performance.",
};

export default async function PsychologyPage() {
  const trades = await getUserTrades();

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-accent" /> Psychology Tracker
          </h1>
          <p className="text-xs text-muted mt-0.5">Monitor emotional patterns and their impact on performance.</p>
        </div>

        <div className="card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-clean">No Emotional Data Logged Yet</h3>
            <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
              Select your mindset tag (e.g. Calm, FOMO, Greed, Anxiety) when logging trades to track how your emotional state directly impacts your win rate.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/trades/new" className="btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Log Trade with Mindset Tag
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-accent" /> Psychology Tracker
        </h1>
        <p className="text-xs text-muted mt-0.5">Monitor emotional patterns and their impact on performance.</p>
      </div>

      <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="badge badge-accent">Mindset Health</span>
          <div className="stat-value text-clean mt-2">100 / 100</div>
          <p className="text-xs text-muted mt-1 max-w-md">
            {trades.length} trades recorded under active psychology protocols.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card-elevated p-4 rounded-xl text-center min-w-20">
            <span className="text-[10px] text-dim block">Total Logged</span>
            <span className="stat-value text-lg! text-profit">{trades.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
