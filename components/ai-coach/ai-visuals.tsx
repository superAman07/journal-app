"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Flame,
  Award,
  Layers,
} from "lucide-react";
import { formatAggregatedPnl } from "@/lib/utils/currency";

export interface ChartDataPoint {
  label: string;
  value: number;
  status?: "win" | "loss" | "breakeven";
}

export interface VisualChartProps {
  type?: "bar" | "pnl-streak" | "win-loss" | "rr";
  title?: string;
  data?: ChartDataPoint[];
  summary?: string;
}

export interface VisualSetupProps {
  instrument?: string;
  direction?: "LONG" | "SHORT";
  entry?: number;
  stopLoss?: number;
  target?: number;
  plannedRR?: string;
  actualRR?: string;
  outcome?: string;
  verdict?: string;
  lesson?: string;
}

export interface FlowchartItem {
  step: string;
  status?: "done" | "active" | "pending" | "failed";
  note?: string;
}

export interface VisualFlowchartProps {
  title?: string;
  items?: FlowchartItem[];
}

export interface VisualGaugeProps {
  title?: string;
  value?: number;
  max?: number;
  label?: string;
  summary?: string;
}

export function AIVisualChart({ type = "bar", title, data = [], summary }: VisualChartProps) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  if (type === "win-loss") {
    const wins = data.filter((d) => (d.status || (d.value > 0 ? "win" : "loss")) === "win").length;
    const losses = data.filter((d) => (d.status || (d.value < 0 ? "loss" : "win")) === "loss").length;
    const total = data.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return (
      <div className="card p-3.5 sm:p-4 rounded-xl border border-ai/30 bg-surface/80 my-3 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-clean flex items-center gap-1.5">
            <Award className="h-4 w-4 text-ai" /> {title || "Win / Loss Distribution"}
          </span>
          <span className="font-mono text-xs font-bold text-ai">{winRate}% Win Rate</span>
        </div>

        <div className="h-4 w-full bg-elevated rounded-full overflow-hidden flex p-0.5 gap-0.5">
          <div
            style={{ width: `${winRate}%` }}
            className="h-full bg-gradient-to-r from-profit to-profit/80 rounded-full transition-all duration-500"
          />
          <div
            style={{ width: `${100 - winRate}%` }}
            className="h-full bg-gradient-to-r from-loss/80 to-loss rounded-full transition-all duration-500"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted font-mono">
          <span className="text-profit font-semibold">● {wins} Wins ({winRate}%)</span>
          <span className="text-loss font-semibold">● {losses} Losses ({100 - winRate}%)</span>
        </div>

        {summary && <p className="text-[11px] text-muted border-t border-border/30 pt-2 italic">{summary}</p>}
      </div>
    );
  }

  return (
    <div className="card p-3.5 sm:p-4 rounded-xl border border-ai/30 bg-surface/80 my-3 space-y-3 shadow-xs">
      {title && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-clean flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-ai" /> {title}
          </span>
          <span className="text-[10px] text-dim uppercase font-mono">AI Visual Breakdown</span>
        </div>
      )}

      <div className="space-y-2 pt-1">
        {data.slice(0, 10).map((pt, i) => {
          const isPositive = pt.value >= 0;
          const pct = Math.min(100, Math.round((Math.abs(pt.value) / maxVal) * 100));

          return (
            <div key={i} className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-soft truncate max-w-40">{pt.label}</span>
                <span
                  className={`font-mono font-bold ${
                    isPositive ? "text-profit" : "text-loss"
                  }`}
                >
                  {formatAggregatedPnl(pt.value)}
                </span>
              </div>
              <div className="h-2 w-full bg-elevated rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.max(5, pct)}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPositive
                      ? "bg-gradient-to-r from-profit/70 to-profit"
                      : "bg-gradient-to-r from-loss/70 to-loss"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {summary && <p className="text-[11px] text-muted border-t border-border/30 pt-2 italic">{summary}</p>}
    </div>
  );
}

export function AIVisualSetup({
  instrument,
  direction = "SHORT",
  entry,
  stopLoss,
  target,
  plannedRR,
  outcome,
  verdict,
  lesson,
}: VisualSetupProps) {
  const isLong = direction.toUpperCase() === "LONG";

  return (
    <div className="card p-3.5 sm:p-4 rounded-xl border border-ai/30 bg-surface/80 my-3 space-y-3 shadow-xs">
      <div className="flex items-center justify-between text-xs border-b border-border/30 pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-black uppercase ${
              isLong ? "bg-profit/15 text-profit border border-profit/30" : "bg-loss/15 text-loss border border-loss/30"
            }`}
          >
            {direction}
          </span>
          <span className="font-bold text-clean text-xs sm:text-sm">{instrument || "Trade Setup"}</span>
        </div>
        {plannedRR && (
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-elevated text-accent font-bold">
            R:R {plannedRR}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {target !== undefined && (
          <div className="p-2 rounded-lg bg-profit/5 border border-profit/20 space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-profit flex items-center justify-center gap-1">
              <Target className="h-3 w-3" /> Target
            </span>
            <span className="font-mono text-xs font-bold text-profit">{target}</span>
          </div>
        )}

        {entry !== undefined && (
          <div className="p-2 rounded-lg bg-elevated border border-border/40 space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-dim">Entry</span>
            <span className="font-mono text-xs font-bold text-clean">{entry}</span>
          </div>
        )}

        {stopLoss !== undefined && (
          <div className="p-2 rounded-lg bg-loss/5 border border-loss/20 space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-loss flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Stop Loss
            </span>
            <span className="font-mono text-xs font-bold text-loss">{stopLoss}</span>
          </div>
        )}
      </div>

      {outcome && (
        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-elevated/70 border border-border/30 font-mono">
          <span className="text-dim text-[11px]">Outcome:</span>
          <span className={`font-bold ${outcome.toLowerCase().includes("win") ? "text-profit" : outcome.toLowerCase().includes("loss") ? "text-loss" : "text-clean"}`}>
            {outcome}
          </span>
        </div>
      )}

      {(verdict || lesson) && (
        <div className="text-[11px] text-soft leading-relaxed border-t border-border/30 pt-2 space-y-1">
          {verdict && <p><strong className="text-clean">Verdict:</strong> {verdict}</p>}
          {lesson && <p className="text-muted italic"><strong className="text-ai">Takeaway:</strong> {lesson}</p>}
        </div>
      )}
    </div>
  );
}

export function AIVisualFlowchart({ title, items = [] }: VisualFlowchartProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="card p-3.5 sm:p-4 rounded-xl border border-ai/30 bg-surface/80 my-3 space-y-3 shadow-xs">
      {title && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-clean border-b border-border/30 pb-2">
          <ShieldCheck className="h-4 w-4 text-accent" /> {title}
        </div>
      )}

      <div className="space-y-2 relative">
        {items.map((it, idx) => {
          const isDone = it.status === "done";
          const isActive = it.status === "active";
          const isFailed = it.status === "failed";

          return (
            <div key={idx} className="flex items-start gap-2.5 text-xs">
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-profit" />
                ) : isFailed ? (
                  <AlertCircle className="h-4 w-4 text-loss" />
                ) : isActive ? (
                  <Flame className="h-4 w-4 text-warn animate-pulse" />
                ) : (
                  <Clock className="h-4 w-4 text-muted" />
                )}
              </div>
              <div className="flex-1 space-y-0.5">
                <div
                  className={`font-semibold ${
                    isDone
                      ? "text-clean"
                      : isFailed
                        ? "text-loss"
                        : isActive
                          ? "text-warn font-bold"
                          : "text-muted"
                  }`}
                >
                  {it.step}
                </div>
                {it.note && <p className="text-[11px] text-muted">{it.note}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AIVisualGauge({ title, value = 0, max = 100, label, summary }: VisualGaugeProps) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const isHigh = pct >= 80;
  const isMedium = pct >= 50 && pct < 80;

  const colorClass = isHigh ? "text-profit" : isMedium ? "text-warn" : "text-loss";
  const bgGradient = isHigh
    ? "from-profit to-profit/70"
    : isMedium
      ? "from-warn to-warn/70"
      : "from-loss to-loss/70";

  return (
    <div className="card p-3.5 sm:p-4 rounded-xl border border-ai/30 bg-surface/80 my-3 space-y-3 shadow-xs">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-clean flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-ai" /> {title || "Performance Metric"}
        </span>
        <span className={`font-mono text-sm font-bold ${colorClass}`}>
          {value}/{max} ({pct}%)
        </span>
      </div>

      <div className="h-2.5 w-full bg-elevated rounded-full overflow-hidden">
        <div
          style={{ width: `${pct}%` }}
          className={`h-full rounded-full bg-gradient-to-r ${bgGradient} transition-all duration-500`}
        />
      </div>

      {label && (
        <div className="text-xs font-semibold text-clean flex items-center gap-1.5">
          <ArrowRight className="h-3.5 w-3.5 text-accent" /> {label}
        </div>
      )}

      {summary && <p className="text-[11px] text-muted border-t border-border/30 pt-2 italic">{summary}</p>}
    </div>
  );
}
