"use client";

import { useState, useEffect } from "react";
import {
  X, Target, TrendingUp, CheckCircle2, Brain, Camera,
  ArrowUpRight, ArrowDownRight, Clock, Shield, AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatRMultiple } from "@/lib/utils";

type TradeData = {
  id: string;
  date: string | Date;
  market: string;
  instrument: string;
  session: string;
  setup: string;
  bias: string;
  plannedEntry: any;
  stopLoss: any;
  target: any;
  expectedRR: number;
  actualEntry: any;
  actualExit: any;
  positionSize: number;
  riskPercent: number;
  actualRR: number;
  isLateEntry: boolean;
  isEarlyEntry: boolean;
  slippage: number | null;
  outcome: string;
  exitReason: string;
  pnl: number;
  rMultiple: number;
  rulesFollowed: boolean;
  ruleBreakReason: string | null;
  mindsetBefore: string | null;
  mindsetDuring: string | null;
  mindsetAfter: string | null;
  optionType: string | null;
  optionAction: string | null;
  strikePrice: number | null;
  spotPrice: number | null;
  optionExpiry: string | null;
  lotSize: number | null;
  numberOfLots: number | null;
  optionPoints: number | null;
  emotions: { id: string; emotion: string; stage: string }[];
  screenshots: { id: string; url: string; stage: string; caption: string | null }[];
  mistakes: { id: string; mistake: string }[];
};

const TABS = [
  { key: "plan", label: "Plan", icon: Target },
  { key: "execution", label: "Execution", icon: TrendingUp },
  { key: "result", label: "Result", icon: CheckCircle2 },
  { key: "mindset", label: "Mindset", icon: Brain },
];

function isIndianMarket(market: string) {
  return ["Nifty Options", "BankNifty Options", "Sensex Options"].includes(market);
}

function fmtCurrency(val: number, market: string) {
  if (isIndianMarket(market)) {
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return formatCurrency(val);
}

export function TradeDetailModal({
  trade,
  onClose,
  onEdit,
}: {
  trade: TradeData;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const [tab, setTab] = useState("plan");
  const isOptions = trade.market.includes("Options");
  const pnl = Number(trade.pnl);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-base border border-border/30 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${
              trade.outcome === "WIN" ? "bg-profit/15 text-profit" : trade.outcome === "LOSS" ? "bg-loss/15 text-loss" : "bg-elevated text-soft"
            }`}>
              {trade.outcome === "WIN" ? <ArrowUpRight className="h-5 w-5" /> : trade.outcome === "LOSS" ? <ArrowDownRight className="h-5 w-5" /> : "BE"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-clean">{trade.instrument}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  trade.outcome === "WIN" ? "bg-profit/15 text-profit" : trade.outcome === "LOSS" ? "bg-loss/15 text-loss" : "bg-elevated text-soft"
                }`}>{trade.outcome}</span>
              </div>
              <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                <span>{new Date(trade.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span>·</span>
                <span>{trade.session}</span>
                <span>·</span>
                <span>{trade.market}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-accent-muted text-accent text-[11px] font-bold hover:bg-accent/20 transition-all cursor-pointer">
                Edit
              </button>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-elevated text-dim hover:text-soft transition-all cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PnL Banner */}
        <div className={`px-4 py-3 flex items-center justify-between ${pnl >= 0 ? "bg-profit/5" : "bg-loss/5"}`}>
          <span className="text-[10px] uppercase font-bold text-dim tracking-wider">Net P&L</span>
          <span className={`font-mono text-lg font-bold ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
            {fmtCurrency(pnl, trade.market)}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/20 shrink-0 px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-all border-b-2 cursor-pointer ${
                  tab === t.key ? "border-accent text-accent" : "border-transparent text-dim hover:text-soft"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {tab === "plan" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Market" value={trade.market} />
                <DetailField label="Session" value={trade.session} />
                <DetailField label="Setup" value={trade.setup} className="col-span-2" />
                <DetailField label="Bias" value={trade.bias} badge={trade.bias === "BULLISH" ? "profit" : trade.bias === "BEARISH" ? "loss" : "neutral"} />
                <DetailField label="Date" value={new Date(trade.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <PriceCard label="Planned Entry" value={Number(trade.plannedEntry)} />
                <PriceCard label="Stop Loss" value={Number(trade.stopLoss)} color="loss" />
                <PriceCard label="Target" value={Number(trade.target)} color="profit" />
                <PriceCard label="Expected RR" value={trade.expectedRR} suffix="R" />
              </div>

              {isOptions && (
                <div className="card-elevated p-3 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-dim tracking-wider">Options Contract</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <DetailField label="Action" value={trade.optionAction || "—"} />
                    <DetailField label="Type" value={trade.optionType || "—"} />
                    <DetailField label="Strike" value={trade.strikePrice ? `₹${trade.strikePrice}` : "—"} />
                    <DetailField label="Expiry" value={trade.optionExpiry || "—"} />
                    <DetailField label="Spot Price" value={trade.spotPrice ? `₹${trade.spotPrice}` : "—"} />
                    <DetailField label="Lot Size" value={trade.lotSize ? String(trade.lotSize) : "—"} />
                    <DetailField label="Lots" value={trade.numberOfLots ? String(trade.numberOfLots) : "—"} />
                    <DetailField label="Total Qty" value={trade.lotSize && trade.numberOfLots ? String(trade.lotSize * trade.numberOfLots) : "—"} />
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "execution" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <PriceCard label={isOptions ? "Entry Premium" : "Entry"} value={Number(trade.actualEntry)} />
                <PriceCard label={isOptions ? "Exit Premium" : "Exit"} value={Number(trade.actualExit)} />
                <PriceCard label="Position Size" value={trade.positionSize} />
                <PriceCard label="Risk %" value={trade.riskPercent} suffix="%" />
              </div>

              {isOptions && trade.optionPoints !== null && (
                <div className="card-glow p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-dim tracking-wider block">Points Captured</span>
                    <span className={`text-lg font-mono font-bold ${trade.optionPoints >= 0 ? "text-profit" : "text-loss"}`}>
                      {trade.optionPoints >= 0 ? "+" : ""}{trade.optionPoints} pts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-dim tracking-wider block">Actual RR</span>
                    <span className={`text-lg font-mono font-bold ${trade.actualRR >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatRMultiple(trade.actualRR)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {trade.isLateEntry && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-loss/10 text-loss text-[11px] font-medium">
                    <Clock className="h-3 w-3" /> Late Entry
                  </span>
                )}
                {trade.isEarlyEntry && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-loss/10 text-loss text-[11px] font-medium">
                    <AlertTriangle className="h-3 w-3" /> Early Entry
                  </span>
                )}
                {(trade.slippage ?? 0) > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-elevated text-soft text-[11px] font-medium">
                    Slippage: {trade.slippage} pts
                  </span>
                )}
              </div>

              {trade.screenshots.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[10px] uppercase font-bold text-dim tracking-wider">Screenshots</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {trade.screenshots.map((ss) => (
                      <div key={ss.id} className="rounded-xl overflow-hidden border border-border/20 relative group">
                        <img src={ss.url} alt={ss.stage} className="w-full h-28 object-cover" />
                        <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/90 bg-black/50 px-1.5 py-0.5 rounded">
                          {ss.stage.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "result" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-3 rounded-xl text-center border ${
                  trade.outcome === "WIN" ? "bg-profit/10 border-profit/20" : trade.outcome === "LOSS" ? "bg-loss/10 border-loss/20" : "bg-elevated border-border/20"
                }`}>
                  <span className="text-[10px] uppercase font-bold text-dim block">Outcome</span>
                  <span className={`text-sm font-bold ${
                    trade.outcome === "WIN" ? "text-profit" : trade.outcome === "LOSS" ? "text-loss" : "text-soft"
                  }`}>{trade.outcome}</span>
                </div>
                <div className="p-3 rounded-xl text-center bg-elevated border border-border/20">
                  <span className="text-[10px] uppercase font-bold text-dim block">Exit Reason</span>
                  <span className="text-[11px] font-semibold text-soft">{trade.exitReason.replace(/_/g, " ")}</span>
                </div>
                <div className={`p-3 rounded-xl text-center border ${pnl >= 0 ? "bg-profit/10 border-profit/20" : "bg-loss/10 border-loss/20"}`}>
                  <span className="text-[10px] uppercase font-bold text-dim block">Net P&L</span>
                  <span className={`text-sm font-mono font-bold ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {fmtCurrency(pnl, trade.market)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <PriceCard label="Actual RR" value={trade.actualRR} suffix="R" />
                <PriceCard label="R-Multiple" value={trade.rMultiple} suffix="R" />
              </div>

              <div className={`flex items-center justify-between p-3 rounded-xl border ${
                trade.rulesFollowed ? "bg-profit/5 border-profit/20" : "bg-loss/5 border-loss/20"
              }`}>
                <div className="flex items-center gap-2">
                  <Shield className={`h-4 w-4 ${trade.rulesFollowed ? "text-profit" : "text-loss"}`} />
                  <span className="text-xs font-semibold text-clean">Rules Followed</span>
                </div>
                <span className={`text-xs font-bold ${trade.rulesFollowed ? "text-profit" : "text-loss"}`}>
                  {trade.rulesFollowed ? "Yes" : "No"}
                </span>
              </div>
              {!trade.rulesFollowed && trade.ruleBreakReason && (
                <div className="p-3 rounded-xl bg-loss/5 border border-loss/20">
                  <span className="text-[10px] uppercase font-bold text-loss block mb-1">Violation</span>
                  <span className="text-xs text-soft">{trade.ruleBreakReason}</span>
                </div>
              )}
            </div>
          )}

          {tab === "mindset" && (
            <div className="space-y-4">
              {trade.emotions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-dim tracking-wider">Emotions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.emotions.map((e) => (
                      <span key={e.id} className="px-2.5 py-1 rounded-lg bg-accent-muted text-accent text-[11px] font-medium">
                        {e.emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {trade.mindsetBefore && (
                  <MindsetCard label="Before Entry" text={trade.mindsetBefore} />
                )}
                {trade.mindsetDuring && (
                  <MindsetCard label="During Trade" text={trade.mindsetDuring} />
                )}
                {trade.mindsetAfter && (
                  <MindsetCard label="After Exit" text={trade.mindsetAfter} />
                )}
                {!trade.mindsetBefore && !trade.mindsetDuring && !trade.mindsetAfter && trade.emotions.length === 0 && (
                  <div className="text-center py-6 text-dim text-xs">
                    No mindset notes recorded for this trade.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, className, badge }: { label: string; value: string; className?: string; badge?: "profit" | "loss" | "neutral" }) {
  return (
    <div className={className}>
      <span className="text-[10px] uppercase font-bold text-dim tracking-wider block">{label}</span>
      {badge ? (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
          badge === "profit" ? "bg-profit/15 text-profit" : badge === "loss" ? "bg-loss/15 text-loss" : "bg-elevated text-soft"
        }`}>{value}</span>
      ) : (
        <span className="text-xs font-semibold text-clean mt-0.5 block">{value}</span>
      )}
    </div>
  );
}

function PriceCard({ label, value, color, suffix }: { label: string; value: number; color?: "profit" | "loss"; suffix?: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-surface border border-border/10 text-center">
      <span className="text-[9px] uppercase font-bold text-dim tracking-wider block">{label}</span>
      <span className={`font-mono text-sm font-bold block mt-0.5 ${
        color === "profit" ? "text-profit" : color === "loss" ? "text-loss" : "text-clean"
      }`}>
        {isNaN(value) ? "—" : value}{suffix || ""}
      </span>
    </div>
  );
}

function MindsetCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface border border-border/10">
      <span className="text-[10px] uppercase font-bold text-dim tracking-wider block mb-1">{label}</span>
      <p className="text-xs text-soft leading-relaxed">{text}</p>
    </div>
  );
}
