"use client";

import { useState } from "react";
import Link from "next/link";
import { Image as ImageIcon, Calendar, Plus } from "lucide-react";

export default function ScreenshotsPage() {
  const [selectedStage, setSelectedStage] = useState("ALL");
  const allScreenshots: Array<{
    id: string;
    url: string;
    stage: string;
    caption?: string;
    instrument: string;
    market: string;
    date: string;
    outcome: string;
    pnl: number;
  }> = [];

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
        <div className="card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-clean">Screenshot Vault is Empty</h3>
            <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
              Attach TradingView chart URLs when logging trades (during Plan, Execution, or Result phase) to build your visual setup archive.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/trades/new" className="btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Log Trade with Chart
            </Link>
          </div>
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
                <div className="text-[10px] text-dim flex items-center gap-1.5 pt-1">
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
