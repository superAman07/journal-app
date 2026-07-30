"use client";

import { useState } from "react";
import { Image as ImageIcon, Calendar } from "lucide-react";
import { MOCK_TRADES } from "@/lib/data/mock-trades";

export default function ScreenshotsPage() {
  const [selectedStage, setSelectedStage] = useState("ALL");

  const allScreenshots = MOCK_TRADES.flatMap((t) =>
    t.screenshots.map((s) => ({ ...s, instrument: t.instrument, market: t.market, date: t.date, outcome: t.outcome, pnl: t.pnl }))
  );

  const filtered = allScreenshots.filter((s) => selectedStage === "ALL" || s.stage === selectedStage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-accent" /> Screenshot Vault
          </h1>
          <p className="text-xs text-muted mt-0.5">Visual archive of trade chart setups.</p>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {["ALL", "BEFORE_ENTRY", "DURING_TRADE", "AFTER_EXIT"].map((stage) => (
            <button key={stage} onClick={() => setSelectedStage(stage)}
              className={`badge whitespace-nowrap cursor-pointer transition-all ${selectedStage === stage ? "badge-accent" : "badge-neutral hover:bg-overlay"}`}
            >
              {stage.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon className="h-10 w-10 text-dim mx-auto mb-3" />
          <p className="text-sm text-muted">No screenshots found for this filter.</p>
          <p className="text-xs text-dim mt-1">Upload charts when logging new trades.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sc) => (
            <div key={sc.id} className="card overflow-hidden group">
              <div className="relative aspect-video bg-base">
                <img src={sc.url} alt={sc.caption || "Chart"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2.5 left-2.5">
                  <span className="badge badge-accent text-[9px]">{sc.stage.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-clean">{sc.instrument}</span>
                  <span className={`text-xs font-mono font-bold ${sc.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {sc.pnl >= 0 ? `+$${sc.pnl}` : `-$${Math.abs(sc.pnl)}`}
                  </span>
                </div>
                <p className="text-xs text-muted truncate">{sc.caption || "Chart snapshot"}</p>
                <div className="text-[10px] text-dim flex items-center gap-1.5 pt-1 border-t border-border">
                  <Calendar className="h-3 w-3" /> {sc.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
