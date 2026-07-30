"use client";

import { BrainCircuit, HeartPulse } from "lucide-react";
import { EmotionType } from "@/types";

const EMOTION_STATS: { emotion: EmotionType; count: number; winRate: number; status: "POSITIVE" | "NEGATIVE" | "NEUTRAL" }[] = [
  { emotion: "Calm", count: 24, winRate: 83.3, status: "POSITIVE" },
  { emotion: "FOMO", count: 8, winRate: 25.0, status: "NEGATIVE" },
  { emotion: "Fear", count: 4, winRate: 50.0, status: "NEUTRAL" },
  { emotion: "Greed", count: 3, winRate: 33.3, status: "NEGATIVE" },
  { emotion: "Overconfidence", count: 2, winRate: 0.0, status: "NEGATIVE" },
  { emotion: "Anxiety", count: 5, winRate: 40.0, status: "NEUTRAL" },
];

export default function PsychologyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-accent" /> Psychology Tracker
        </h1>
        <p className="text-xs text-muted mt-0.5">Monitor emotional patterns and their impact on performance.</p>
      </div>

      {/* Health Score */}
      <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="badge badge-accent">Mindset Health</span>
          <div className="stat-value text-clean mt-2">84 / 100</div>
          <p className="text-xs text-muted mt-1 max-w-md">
            72% of trades executed under calm, disciplined state.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card-elevated p-4 rounded-xl text-center min-w-[80px]">
            <span className="text-[10px] text-dim block">Calm</span>
            <span className="stat-value !text-lg text-profit">24</span>
          </div>
          <div className="card-elevated p-4 rounded-xl text-center min-w-[80px]">
            <span className="text-[10px] text-dim block">FOMO</span>
            <span className="stat-value !text-lg text-loss">8</span>
          </div>
        </div>
      </div>

      {/* Emotion Grid */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-accent" /> Emotion vs Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EMOTION_STATS.map((item) => (
            <div key={item.emotion} className="card-elevated p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-soft">{item.emotion}</span>
                <span className="text-[11px] text-dim block">{item.count} trades</span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-mono font-bold ${item.winRate >= 60 ? "text-profit" : item.winRate <= 35 ? "text-loss" : "text-warn"}`}>
                  {item.winRate}%
                </span>
                <span className={`text-[10px] block font-medium ${item.status === "POSITIVE" ? "text-profit" : item.status === "NEGATIVE" ? "text-loss" : "text-muted"}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
