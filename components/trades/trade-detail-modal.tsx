"use client";

import { useState, useEffect } from "react";
import {
  X, Target, TrendingUp, CheckCircle2, Brain, Camera,
  ArrowUpRight, ArrowDownRight, Clock, Shield, AlertTriangle, ZoomIn
} from "lucide-react";
import { formatRMultiple } from "@/lib/utils";
import { formatPnlWithCurrency } from "@/lib/utils/currency";
import { ImageLightbox } from "@/components/ui/image-lightbox";

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
  entryTime?: string | Date | null;
  exitTime?: string | Date | null;
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isOptions = trade.market.includes("Options");
  const pnl = Number(trade.pnl);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxIndex === null) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, lightboxIndex]);

  return (
    <div className="fixed inset-0 z-120 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative bg-card border border-border-solid w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-border-solid flex items-center justify-between shrink-0 bg-surface gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm shrink-0 ${
              trade.outcome === "WIN" ? "bg-profit/20 text-profit border border-profit/30" : trade.outcome === "LOSS" ? "bg-loss/20 text-loss border border-loss/30" : "bg-elevated text-soft border border-border-solid"
            }`}>
              {trade.outcome === "WIN" ? <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" /> : trade.outcome === "LOSS" ? <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" /> : "BE"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-sm sm:text-base font-bold truncate max-w-32.5 sm:max-w-none">{trade.instrument}</span>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  trade.outcome === "WIN" ? "bg-profit/20 text-profit border border-profit/30" : trade.outcome === "LOSS" ? "bg-loss/20 text-loss border border-loss/30" : "bg-elevated text-soft border border-border-solid"
                }`}>{trade.outcome}</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-muted flex items-center gap-1 mt-0.5 truncate">
                <span>{new Date(trade.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span>·</span>
                <span className="font-medium text-clean">{trade.session}</span>
                <span>·</span>
                <span className="font-semibold text-accent truncate">{trade.market}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <button onClick={onEdit} className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-accent-muted text-accent text-[11px] sm:text-xs font-bold hover:bg-accent/20 transition-all cursor-pointer border border-accent/20 whitespace-nowrap">
                Edit Trade
              </button>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-elevated text-soft hover:text-clean transition-all cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PnL Banner */}
        <div className={`px-5 py-3.5 flex items-center justify-between border-b border-border-solid ${pnl >= 0 ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"}`}>
          <span className="text-xs uppercase font-extrabold tracking-wider">Net Realized P&L</span>
          <span className={`font-mono text-xl font-black ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
            {formatPnlWithCurrency(pnl, trade.market)}
          </span>
        </div>

        {/* Tabs — Responsive 4-tab fit with no horizontal cut-off */}
        <div className="flex items-center justify-around sm:justify-start border-b border-border-solid shrink-0 px-1 sm:px-3 bg-surface overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isSelected = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  isSelected ? "border-accent text-accent bg-accent-muted/20" : "border-transparent text-muted hover:text-clean"
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content — Safe Bottom Padding for Mobile */}
        <div className="p-4 sm:p-5 pb-24 sm:pb-6 overflow-y-auto flex-1 space-y-5 bg-card">
          {tab === "plan" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <DetailField label="Market Segment" value={trade.market} />
                <DetailField label="Session" value={trade.session} />
                <DetailField label="Strategy Setup" value={trade.setup} />
                <DetailField label="Market Bias" value={trade.bias} badge={trade.bias === "BULLISH" ? "profit" : trade.bias === "BEARISH" ? "loss" : "neutral"} />
                <DetailField label="Trade Date" value={new Date(trade.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <PriceCard label="Planned Entry" value={Number(trade.plannedEntry)} />
                <PriceCard label="Stop Loss" value={Number(trade.stopLoss)} color="loss" />
                <PriceCard label="Target (TP)" value={Number(trade.target)} color="profit" />
                <PriceCard label="Expected RR" value={trade.expectedRR} suffix="R" />
              </div>

              {isOptions && (
                <div className="p-4 rounded-2xl border border-border-solid space-y-3 bg-surface">
                  <span className="text-xs uppercase font-extrabold text-accent tracking-wider block">
                    Options Contract Specification
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DetailField label="Option Action" value={trade.optionAction || "—"} />
                    <DetailField label="Option Type" value={trade.optionType || "—"} />
                    <DetailField label="Strike Price" value={trade.strikePrice ? `₹${trade.strikePrice}` : "—"} />
                    <DetailField label="Expiry" value={trade.optionExpiry || "—"} />
                    <DetailField label="Spot Price" value={trade.spotPrice ? `₹${trade.spotPrice}` : "—"} />
                    <DetailField label="Lot Size" value={trade.lotSize ? `${trade.lotSize} qty/lot` : "—"} />
                    <DetailField label="Lots Traded" value={trade.numberOfLots ? `${trade.numberOfLots} lots` : "—"} />
                    <DetailField label="Total Quantity" value={trade.lotSize && trade.numberOfLots ? `${trade.lotSize * trade.numberOfLots} qty` : "—"} />
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "execution" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <PriceCard label={isOptions ? "Entry Premium" : "Actual Entry"} value={Number(trade.actualEntry)} />
                <PriceCard label={isOptions ? "Exit Premium" : "Actual Exit"} value={Number(trade.actualExit)} />
                <PriceCard label="Position Size" value={trade.positionSize} />
                <PriceCard label="Risk Percent" value={trade.riskPercent} suffix="%" />
              </div>

              {/* Execution Timestamps & Holding Time */}
              {(trade.entryTime || trade.exitTime) && (
                <div className="p-3.5 rounded-2xl border border-border-solid bg-surface flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4">
                    {trade.entryTime && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-dim tracking-wider block">Entry Time</span>
                        <span className="font-mono font-bold text-clean">
                          {new Date(trade.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                      </div>
                    )}
                    {trade.exitTime && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-dim tracking-wider block">Exit Time</span>
                        <span className="font-mono font-bold text-clean">
                          {new Date(trade.exitTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                      </div>
                    )}
                  </div>
                  {trade.entryTime && trade.exitTime && (
                    <div className="bg-accent/10 border border-accent/20 px-3 py-1 rounded-xl flex items-center gap-1.5 text-accent font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {(() => {
                          const start = new Date(trade.entryTime).getTime();
                          const end = new Date(trade.exitTime).getTime();
                          if (isNaN(start) || isNaN(end) || end <= start) return "—";
                          const diffMins = Math.round((end - start) / 60000);
                          if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""}`;
                          const h = Math.floor(diffMins / 60);
                          const m = diffMins % 60;
                          return `${h}h ${m}m`;
                        })()} holding
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isOptions && trade.optionPoints !== null && (
                <div className="p-3.5 sm:p-4 rounded-2xl border border-accent/40 bg-surface flex items-center justify-between shadow-sm gap-2">
                  <div>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted tracking-wider block">
                      Option Points
                    </span>
                    <span className={`text-base sm:text-xl font-mono font-black mt-0.5 block ${trade.optionPoints >= 0 ? "text-profit" : "text-loss"}`}>
                      {trade.optionPoints >= 0 ? "+" : ""}{trade.optionPoints} pts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted tracking-wider block">
                      Actual Achieved R-Multiple
                    </span>
                    <span className={`text-base sm:text-xl font-mono font-black mt-0.5 block ${trade.actualRR >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatRMultiple(trade.actualRR)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {trade.isLateEntry && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-loss/15 text-loss border border-loss/30 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5" /> Late Entry (Chased)
                  </span>
                )}
                {trade.isEarlyEntry && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-loss/15 text-loss border border-loss/30 text-xs font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" /> Early Entry (Pre-trigger)
                  </span>
                )}
                {(trade.slippage ?? 0) > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-elevated text-clean border border-border-solid text-xs font-bold">
                    Slippage: {trade.slippage} pts
                  </span>
                )}
              </div>

              {/* Interactive Screenshots Gallery */}
              {trade.screenshots.length > 0 ? (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-accent" />
                      <span className="text-xs uppercase font-extrabold text-clean tracking-wider">
                        Chart Screenshots ({trade.screenshots.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-accent font-medium">Click image to open full zoom lightbox</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {trade.screenshots.map((ss, idx) => (
                      <div
                        key={ss.id}
                        onClick={() => setLightboxIndex(idx)}
                        className="relative group rounded-2xl overflow-hidden border border-border-solid bg-surface cursor-pointer hover:border-accent hover:shadow-lg transition-all"
                      >
                        <img
                          src={ss.url}
                          alt={ss.stage}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg">
                            <ZoomIn className="h-5 w-5" />
                          </div>
                        </div>
                        <span className="absolute bottom-2 left-2 text-[9px] font-extrabold text-white bg-black/80 px-2 py-0.5 rounded-lg backdrop-blur-sm uppercase tracking-wider border border-white/20">
                          {ss.stage.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-elevated border border-border-solid text-center text-xs text-muted">
                  No chart screenshots attached to this trade.
                </div>
              )}
            </div>
          )}

          {tab === "result" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-4 rounded-2xl text-center border ${
                  trade.outcome === "WIN" ? "bg-profit/10 border-profit/30" : trade.outcome === "LOSS" ? "bg-loss/10 border-loss/30" : "bg-elevated border-border-solid"
                }`}>
                  <span className="text-[10px] uppercase font-bold text-muted block">Outcome</span>
                  <span className={`text-base font-black ${
                    trade.outcome === "WIN" ? "text-profit" : trade.outcome === "LOSS" ? "text-loss" : "text-clean"
                  }`}>{trade.outcome}</span>
                </div>

                <div className="p-4 rounded-2xl text-center bg-elevated border border-border-solid">
                  <span className="text-[10px] uppercase font-bold text-muted block">Exit Reason</span>
                  <span className="text-xs font-bold text-clean">{trade.exitReason.replace(/_/g, " ")}</span>
                </div>

                <div className={`p-4 rounded-2xl text-center border ${pnl >= 0 ? "bg-profit/10 border-profit/30" : "bg-loss/10 border-loss/30"}`}>
                  <span className="text-[10px] uppercase font-bold text-muted block">Net Realized P&L</span>
                  <span className={`text-base font-mono font-black ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {formatPnlWithCurrency(pnl, trade.market)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PriceCard label="Actual RR" value={trade.actualRR} suffix="R" />
                <PriceCard label="R-Multiple" value={trade.rMultiple} suffix="R" />
              </div>

              <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                trade.rulesFollowed ? "bg-profit/10 border-profit/30" : "bg-loss/10 border-loss/30"
              }`}>
                <div className="flex items-center gap-2.5">
                  <Shield className={`h-5 w-5 ${trade.rulesFollowed ? "text-profit" : "text-loss"}`} />
                  <span className="text-xs font-bold text-clean">Trading Rules Adherence</span>
                </div>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  trade.rulesFollowed ? "bg-profit/20 text-profit border border-profit/30" : "bg-loss/20 text-loss border border-loss/30"
                }`}>
                  {trade.rulesFollowed ? "Disciplined (Rules Followed)" : "Rule Violation"}
                </span>
              </div>

              {!trade.rulesFollowed && trade.ruleBreakReason && (
                <div className="p-4 rounded-2xl bg-loss/10 border border-loss/30 space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-loss tracking-wider block">Rule Violation Reason</span>
                  <p className="text-xs font-medium text-clean">{trade.ruleBreakReason}</p>
                </div>
              )}
            </div>
          )}

          {tab === "mindset" && (
            <div className="space-y-4">
              {trade.emotions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs uppercase font-extrabold text-clean tracking-wider block">Emotions Experienced</span>
                  <div className="flex flex-wrap gap-2">
                    {trade.emotions.map((e) => (
                      <span key={e.id} className="px-3 py-1.5 rounded-xl bg-accent-muted text-accent border border-accent/20 text-xs font-bold">
                        {e.emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {trade.mindsetBefore && (
                  <MindsetCard label="Mindset Before Entry" text={trade.mindsetBefore} />
                )}
                {trade.mindsetDuring && (
                  <MindsetCard label="Mindset During Trade" text={trade.mindsetDuring} />
                )}
                {trade.mindsetAfter && (
                  <MindsetCard label="Mindset After Exit" text={trade.mindsetAfter} />
                )}
                {!trade.mindsetBefore && !trade.mindsetDuring && !trade.mindsetAfter && trade.emotions.length === 0 && (
                  <div className="p-6 rounded-2xl bg-elevated border border-border-solid text-center text-muted text-xs">
                    No mindset notes recorded for this trade.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Trigger */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={trade.screenshots}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

function DetailField({ label, value, className, badge }: { label: string; value: string; className?: string; badge?: "profit" | "loss" | "neutral" }) {
  return (
    <div className={`p-3 rounded-2xl bg-elevated border border-border-solid ${className || ""}`}>
      <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">{label}</span>
      {badge ? (
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg inline-block mt-1 ${
          badge === "profit" ? "bg-profit/15 text-profit border border-profit/30" : badge === "loss" ? "bg-loss/15 text-loss border border-loss/30" : "bg-card text-clean border border-border-solid"
        }`}>{value}</span>
      ) : (
        <span className="text-xs font-bold text-clean mt-0.5 block truncate">{value}</span>
      )}
    </div>
  );
}

function PriceCard({ label, value, color, suffix }: { label: string; value: number; color?: "profit" | "loss"; suffix?: string }) {
  return (
    <div className="p-3 rounded-2xl bg-elevated border border-border-solid text-center">
      <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">{label}</span>
      <span className={`font-mono text-sm font-bold block mt-1 ${
        color === "profit" ? "text-profit" : color === "loss" ? "text-loss" : "text-clean"
      }`}>
        {isNaN(value) ? "—" : value}{suffix || ""}
      </span>
    </div>
  );
}

function MindsetCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="p-4 rounded-2xl bg-elevated border border-border-solid space-y-1">
      <span className="text-[10px] uppercase font-extrabold text-accent tracking-wider block">{label}</span>
      <p className="text-xs text-clean font-medium leading-relaxed">{text}</p>
    </div>
  );
}
