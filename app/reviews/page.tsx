"use client";

import { useState } from "react";
import { CalendarRange, Star } from "lucide-react";

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<"WEEKLY" | "MONTHLY" | "YEARLY">("WEEKLY");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-accent" /> Performance Reviews
          </h1>
          <p className="text-xs text-muted mt-0.5">Weekly, monthly, and annual execution audits.</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-card rounded-xl text-xs">
          {(["WEEKLY", "MONTHLY", "YEARLY"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activeTab === tab ? "bg-accent text-white" : "text-muted hover:text-soft"}`}
            >{tab}</button>
          ))}
        </div>
      </div>

      <div className="card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <div>
            <h2 className="text-base font-bold text-clean">
              {activeTab === "WEEKLY" ? "Week 30 (Jul 20–26, 2026)" : activeTab === "MONTHLY" ? "July 2026" : "2026 Annual Summary"}
            </h2>
            <span className="text-xs text-muted">Rating: 4.8 / 5</span>
          </div>
          <div className="flex items-center gap-0.5 text-warn">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warn" />)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Net Profit</span>
            <div className="stat-value text-xl! text-profit">+$4,290</div>
          </div>
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Win Rate</span>
            <div className="stat-value text-xl! text-clean">71.4%</div>
          </div>
          <div className="card-elevated p-4 rounded-xl">
            <span className="label">Best Setup</span>
            <div className="text-sm font-bold text-soft">Gold H1 Order Block</div>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <h3 className="font-semibold text-soft mb-1.5 text-sm">Key Wins</h3>
            <p className="card-elevated p-3 rounded-xl text-muted leading-relaxed">
              Maintained 100% stop loss discipline. Refused to move SL on XAUUSD during news volatility.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-soft mb-1.5 text-sm">Goals for Next Period</h3>
            <p className="card-elevated p-3 rounded-xl text-muted leading-relaxed">
              Reduce option buying on Fridays. Focus on Gold and EURUSD during NY session open.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
