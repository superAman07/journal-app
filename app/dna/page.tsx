import type { Metadata } from "next";
import { Dna, Award, AlertTriangle, Zap, CheckCircle2, TrendingUp } from "lucide-react";
import { MOCK_DNA } from "@/lib/data/mock-trades";

export const metadata: Metadata = {
  title: "Trading DNA — Trading OS",
  description: "Quantitative fingerprint of your trading behavior — best markets, setups, and execution patterns.",
};

const DNA_ITEMS = [
  { label: "Most Profitable Market", value: MOCK_DNA.bestMarket, desc: "82.4% Win rate with 2.95R average.", tag: "Peak Strength", tagType: "profit" as const, icon: Award },
  { label: "Worst Performing Asset", value: MOCK_DNA.worstMarket, desc: "High slippage and emotional late entries.", tag: "Key Leak", tagType: "loss" as const, icon: AlertTriangle },
  { label: "Highest Expectancy Setup", value: MOCK_DNA.bestSetup, desc: "3.2R average during London/NY open.", tag: "Edge Model", tagType: "profit" as const, icon: Zap },
  { label: "Peak Performance Day", value: MOCK_DNA.bestWeekday, desc: "78% of Thursday trades close in profit.", tag: "Optimal Day", tagType: "accent" as const, icon: CheckCircle2 },
  { label: "Optimal Mindset State", value: MOCK_DNA.mostProfitableEmotion, desc: "Zero early exits when feeling calm.", tag: "Psychology", tagType: "profit" as const, icon: TrendingUp },
  { label: "Primary Execution Weakness", value: MOCK_DNA.biggestWeakness, desc: "Rule engine advises limit orders only.", tag: "Action Plan", tagType: "loss" as const, icon: AlertTriangle },
];

export default function DNAPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <Dna className="h-5 w-5 text-accent" /> Trading DNA
        </h1>
        <p className="text-xs text-muted mt-0.5">Quantitative fingerprint of your trading behavior.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DNA_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`badge ${item.tagType === "profit" ? "badge-profit" : item.tagType === "loss" ? "badge-loss" : "badge-accent"}`}>
                  {item.tag}
                </span>
                <Icon className={`h-4 w-4 ${item.tagType === "profit" ? "text-profit" : item.tagType === "loss" ? "text-loss" : "text-accent"}`} />
              </div>
              <div>
                <span className="text-[11px] text-dim font-medium">{item.label}</span>
                <p className={`text-base sm:text-lg font-bold mt-0.5 ${item.tagType === "loss" ? "text-loss" : "text-clean"}`}>{item.value}</p>
              </div>
              <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
