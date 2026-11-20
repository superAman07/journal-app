"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
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
  Edit3,
  Check,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { formatAggregatedPnl } from "@/lib/utils/currency";
import { createTradeFromJSON, AITradeDraftInput } from "@/lib/actions/trade-actions";

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
            className="h-full bg-linear-to-r from-profit to-profit/80 rounded-full transition-all duration-500"
          />
          <div
            style={{ width: `${100 - winRate}%` }}
            className="h-full bg-linear-to-r from-loss/80 to-loss rounded-full transition-all duration-500"
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
                      ? "bg-linear-to-r from-profit/70 to-profit"
                      : "bg-linear-to-r from-loss/70 to-loss"
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
          className={`h-full rounded-full bg-linear-to-r ${bgGradient} transition-all duration-500`}
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

export interface VisualTradeDraftProps {
  market?: string;
  instrument: string;
  date?: string;
  session?: string;
  setup?: string;
  bias?: "BULLISH" | "BEARISH";
  actualEntry: number;
  stopLoss: number;
  target?: number;
  actualExit: number;
  pnl?: number;
  outcome?: "WIN" | "LOSS" | "BE";
  exitReason?: string;
  expectedRR?: number;
  actualRR?: number;
  positionSize?: number;
  lotSize?: number;
  numberOfLots?: number;
  spotPrice?: number;
  strikePrice?: number;
  optionType?: "CE" | "PE" | null;
  rulesFollowed?: boolean;
  ruleBreakReason?: string | null;
  mindsetBefore?: string | null;
  mindsetDuring?: string | null;
  mindsetAfter?: string | null;
  emotions?: string[] | { emotion: string; stage?: "BEFORE" | "DURING" | "AFTER" }[];
  mistakes?: string[];
  screenshots?: { dataUrl?: string; url?: string; stage?: string; caption?: string }[];
  sessionScreenshots?: { url: string; stage?: string; caption?: string }[];
  notes?: string;
}

export interface DraftScreenshotItem {
  url: string;
  stage?: string;
  caption?: string;
}

export function AIVisualTradeDraft(props: VisualTradeDraftProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTradeId, setSavedTradeId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // Initialize screenshots by merging props.screenshots with sessionScreenshots
  const [screenshots, setScreenshots] = useState<DraftScreenshotItem[]>(() => {
    const list: DraftScreenshotItem[] = [];
    const seenUrls = new Set<string>();

    if (props.screenshots && Array.isArray(props.screenshots)) {
      props.screenshots.forEach((s) => {
        const u = s.dataUrl || s.url;
        if (u && !seenUrls.has(u)) {
          seenUrls.add(u);
          list.push({ url: u, stage: s.stage || "DURING_TRADE", caption: s.caption });
        }
      });
    }

    if (props.sessionScreenshots && Array.isArray(props.sessionScreenshots)) {
      props.sessionScreenshots.forEach((s) => {
        if (s.url && !seenUrls.has(s.url)) {
          seenUrls.add(s.url);
          list.push({ url: s.url, stage: s.stage || "BEFORE_ENTRY", caption: s.caption });
        }
      });
    }

    return list;
  });

  // Editable local state
  const [instrument, setInstrument] = useState(props.instrument || "NIFTY");
  const [market, setMarket] = useState(props.market || "Nifty Options");
  const [setup, setSetup] = useState(props.setup || "Breakout Retest");
  const [bias, setBias] = useState<"BULLISH" | "BEARISH">(props.bias || "BULLISH");
  const [actualEntry, setActualEntry] = useState(props.actualEntry || 0);
  const [actualExit, setActualExit] = useState(props.actualExit || 0);
  const [stopLoss, setStopLoss] = useState(props.stopLoss || 0);
  const [target, setTarget] = useState(props.target || props.actualExit || 0);
  const [pnl, setPnl] = useState(props.pnl ?? 0);
  const [rulesFollowed, setRulesFollowed] = useState(props.rulesFollowed ?? true);
  const [mindsetBefore, setMindsetBefore] = useState(props.mindsetBefore || "");
  const [mindsetDuring, setMindsetDuring] = useState(props.mindsetDuring || "");
  const [mindsetAfter, setMindsetAfter] = useState(props.mindsetAfter || "");
  const [spotPrice, setSpotPrice] = useState(props.spotPrice || 0);
  const [strikePrice, setStrikePrice] = useState(props.strikePrice || 0);

  const effectiveOutcome =
    props.outcome || (pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE");
  const isWin = effectiveOutcome === "WIN";
  const isLoss = effectiveOutcome === "LOSS";

  const handleConfirmAndSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const draftPayload: AITradeDraftInput = {
        market,
        instrument,
        date: props.date || new Date().toISOString().split("T")[0],
        session: props.session || "Indian / Morning",
        setup,
        bias,
        actualEntry: Number(actualEntry),
        stopLoss: Number(stopLoss),
        target: Number(target),
        actualExit: Number(actualExit),
        pnl: Number(pnl),
        outcome: effectiveOutcome,
        exitReason: props.exitReason || (isWin ? "TARGET_HIT" : isLoss ? "STOP_HIT" : "EARLY_EXIT"),
        actualRR: props.actualRR,
        expectedRR: props.expectedRR,
        positionSize: props.positionSize || 1,
        lotSize: props.lotSize,
        numberOfLots: props.numberOfLots,
        spotPrice: spotPrice ? Number(spotPrice) : undefined,
        strikePrice: strikePrice ? Number(strikePrice) : undefined,
        optionType: props.optionType,
        rulesFollowed,
        ruleBreakReason: props.ruleBreakReason,
        mindsetBefore: mindsetBefore || null,
        mindsetDuring: mindsetDuring || null,
        mindsetAfter: mindsetAfter || null,
        emotions: props.emotions,
        mistakes: props.mistakes,
        screenshots: screenshots.map((s) => ({
          dataUrl: s.url,
          url: s.url,
          stage: s.stage || "DURING_TRADE",
          caption: s.caption,
        })),
      };

      const res = await createTradeFromJSON(draftPayload);
      if (res.success && res.tradeId) {
        setSavedTradeId(res.tradeId);
      } else {
        setErrorMessage(res.message || "Failed to save trade.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error logging trade to database.");
    } finally {
      setIsSaving(false);
    }
  };

  if (savedTradeId) {
    return (
      <div className="card p-3 sm:p-4 rounded-xl border border-profit/40 bg-profit/10 my-3 space-y-2 animate-in fade-in shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-profit font-bold text-xs sm:text-sm">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span>✓ Trade Successfully Logged to Database!</span>
          </div>
          <Link
            href="/trades"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-profit/40 text-profit hover:bg-profit/20 text-[11px] font-bold cursor-pointer transition-all"
          >
            <span>View in Journal</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-[11px] text-soft">
          Logged {instrument} ({setup}) with {formatAggregatedPnl(pnl)}. Your metrics, 3-phase psychology arc, and DNA charts have been refreshed.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border-2 border-ai/40 bg-surface/95 my-3 space-y-3 shadow-lg relative overflow-hidden">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-ai/15 text-ai text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
            <Sparkles className="h-3 w-3 text-ai" /> AI Draft Journal
          </span>
          <span className="text-[11px] font-mono text-dim truncate">
            {props.date || new Date().toISOString().split("T")[0]} • {props.session || "Live Session"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-clean cursor-pointer font-semibold shrink-0"
        >
          <Edit3 className="h-3 w-3" />
          <span>{isEditing ? "Done Editing" : "Edit Values"}</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-extrabold text-clean tracking-tight">
              {instrument}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                bias === "BULLISH"
                  ? "bg-profit/15 text-profit border border-profit/30"
                  : "bg-loss/15 text-loss border border-loss/30"
              }`}
            >
              {bias}
            </span>
            <span className="text-[11px] text-muted font-medium bg-card px-2 py-0.5 rounded border border-border/30">
              {setup}
            </span>
          </div>
          <div className="text-[11px] text-dim font-mono mt-0.5">
            {market} {props.optionType ? `• ${props.optionType}` : ""} {strikePrice ? `@ strike ${strikePrice}` : ""}
          </div>
        </div>

        {/* PnL & Outcome Badge */}
        <div className="text-right shrink-0">
          <div
            className={`font-mono font-bold text-sm sm:text-base ${
              isWin ? "text-profit" : isLoss ? "text-loss" : "text-muted"
            }`}
          >
            {formatAggregatedPnl(pnl)}
          </div>
          <span
            className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider font-mono uppercase ${
              isWin
                ? "bg-profit/20 text-profit"
                : isLoss
                ? "bg-loss/20 text-loss"
                : "bg-elevated text-muted"
            }`}
          >
            {effectiveOutcome}
          </span>
        </div>
      </div>

      {/* Interactive Edit Fields (if toggled) */}
      {isEditing ? (
        <div className="p-2.5 rounded-xl bg-card border border-border/40 space-y-2 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-dim font-mono">Instrument</label>
              <input
                value={instrument}
                onChange={(e) => setInstrument(e.target.value.toUpperCase())}
                className="input-field w-full py-1 px-2 text-xs mt-0.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-dim font-mono">Entry Price</label>
              <input
                type="number"
                value={actualEntry}
                onChange={(e) => setActualEntry(Number(e.target.value))}
                className="input-field w-full py-1 px-2 text-xs mt-0.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-dim font-mono">Exit Price</label>
              <input
                type="number"
                value={actualExit}
                onChange={(e) => setActualExit(Number(e.target.value))}
                className="input-field w-full py-1 px-2 text-xs mt-0.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-dim font-mono">Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="input-field w-full py-1 px-2 text-xs mt-0.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-dim font-mono">Net PnL (₹ / $)</label>
              <input
                type="number"
                value={pnl}
                onChange={(e) => setPnl(Number(e.target.value))}
                className="input-field w-full py-1 px-2 text-xs mt-0.5"
              />
            </div>
            <div>
              <label className="text-[10px] text-dim font-mono">Spot Price</label>
              <input
                type="number"
                value={spotPrice}
                onChange={(e) => setSpotPrice(Number(e.target.value))}
                className="input-field w-full py-1 px-2 text-xs mt-0.5"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="text-[10px] text-dim font-mono">Followed Rules?</label>
              <select
                value={rulesFollowed ? "true" : "false"}
                onChange={(e) => setRulesFollowed(e.target.value === "true")}
                className="input-field w-full py-1 px-2 text-xs mt-0.5"
              >
                <option value="true">Yes (Disciplined)</option>
                <option value="false">No (Rule Broken)</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* Summary Key Metric Cards */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          <div className="p-2 rounded-lg bg-card border border-border/30">
            <div className="text-[10px] text-dim font-mono">Entry • Exit</div>
            <div className="font-mono text-xs font-semibold text-clean mt-0.5">
              {actualEntry} <span className="text-dim">→</span> {actualExit}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-card border border-border/30">
            <div className="text-[10px] text-dim font-mono">Stop Loss • Target</div>
            <div className="font-mono text-xs font-semibold text-clean mt-0.5">
              {stopLoss} <span className="text-dim">/</span> {target}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-card border border-border/30">
            <div className="text-[10px] text-dim font-mono">Risk : Reward</div>
            <div className="font-mono text-xs font-bold text-accent mt-0.5">
              {props.actualRR ? `${props.actualRR}R` : "1:2 R"}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-card border border-border/30">
            <div className="text-[10px] text-dim font-mono">Rules Discipline</div>
            <div className="font-mono text-xs font-bold mt-0.5 flex items-center gap-1">
              {rulesFollowed ? (
                <span className="text-profit flex items-center gap-0.5">
                  <Check className="h-3 w-3" /> 100% Followed
                </span>
              ) : (
                <span className="text-warn flex items-center gap-0.5">
                  <ShieldAlert className="h-3 w-3" /> Rule Broken
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3-Phase Mindset Arc (Captured from user conversation) */}
      <div className="space-y-1.5 pt-1 border-t border-border/30">
        <div className="text-[10px] uppercase font-mono font-bold text-dim tracking-wider">
          🧠 3-Phase Psychology Extracted From Conversation
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
          {/* Phase 1: Before */}
          <div className="p-2 rounded-lg bg-surface border border-border/30 space-y-0.5">
            <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
              <span>🟡 Before Entry</span>
            </div>
            <p className="text-[11px] text-soft italic line-clamp-3">
              {mindsetBefore ? `"${mindsetBefore}"` : "Patiently waited for edge setup confirmation"}
            </p>
          </div>

          {/* Phase 2: During */}
          <div className="p-2 rounded-lg bg-surface border border-border/30 space-y-0.5">
            <div className="text-[10px] font-bold text-ai flex items-center gap-1">
              <span>🔵 During Trade</span>
            </div>
            <p className="text-[11px] text-soft italic line-clamp-3">
              {mindsetDuring ? `"${mindsetDuring}"` : "Tracked price action without premature panic"}
            </p>
          </div>

          {/* Phase 3: After */}
          <div className="p-2 rounded-lg bg-surface border border-border/30 space-y-0.5">
            <div className="text-[10px] font-bold text-profit flex items-center gap-1">
              <span>🟢 After Exit</span>
            </div>
            <p className="text-[11px] text-soft italic line-clamp-3">
              {mindsetAfter ? `"${mindsetAfter}"` : "Accepted market feedback calmly without revenge bias"}
            </p>
          </div>
        </div>
      </div>

      {/* Attached Chart Screenshots Section */}
      <div className="space-y-1.5 pt-1 border-t border-border/30">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase font-mono font-bold text-dim tracking-wider flex items-center gap-1.5">
            <Camera className="h-3 w-3 text-ai" />
            <span>📸 Attached Chart Screenshots ({screenshots.length})</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] text-accent hover:underline flex items-center gap-1 font-mono font-semibold cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" /> Attach Chart
          </button>
        </div>

        {screenshots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {screenshots.map((ss, sIdx) => (
              <div
                key={sIdx}
                className="relative group rounded-xl overflow-hidden border border-border/50 bg-card hover:border-ai/60 transition-all shadow-xs"
              >
                <img
                  src={ss.url}
                  alt={ss.caption || "Chart"}
                  onClick={() => setPreviewScreenshotUrl(ss.url)}
                  className="w-full h-24 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const stages = ["BEFORE_ENTRY", "DURING_TRADE", "AFTER_EXIT"];
                    const currentIdx = stages.indexOf(ss.stage || "DURING_TRADE");
                    const nextStage = stages[(currentIdx + 1) % stages.length];
                    setScreenshots((prev) =>
                      prev.map((item, idx) => (idx === sIdx ? { ...item, stage: nextStage } : item))
                    );
                  }}
                  title="Click to toggle stage: Before Entry / During Trade / After Exit"
                  className="absolute top-1 left-1 bg-background/85 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-clean border border-border/40 hover:border-accent cursor-pointer transition-colors"
                >
                  {ss.stage === "BEFORE_ENTRY"
                    ? "🟡 Before"
                    : ss.stage === "AFTER_EXIT"
                    ? "🟢 Exit"
                    : "🔵 In Trade"}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScreenshots((prev) => prev.filter((_, idx) => idx !== sIdx));
                  }}
                  title="Remove screenshot from journal"
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/90 text-muted hover:text-loss hover:bg-loss/20 flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer border border-border/40"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-lg border border-dashed border-border/60 hover:border-ai/50 bg-surface/50 text-center cursor-pointer transition-colors"
          >
            <div className="text-[10px] text-muted flex items-center justify-center gap-1.5">
              <Camera className="h-3 w-3 text-dim" />
              <span>No chart screenshots attached yet. Click to upload chart or paste while chatting.</span>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const raw = event.target?.result as string;
                if (raw) {
                  setScreenshots((prev) => [
                    ...prev,
                    { url: raw, stage: "DURING_TRADE", caption: file.name },
                  ]);
                }
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* Emotion / Mistake Tags */}
      {props.emotions && Array.isArray(props.emotions) && props.emotions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] font-mono text-dim">Emotions:</span>
          {props.emotions.map((em, idx) => {
            const name = typeof em === "string" ? em : em.emotion;
            return (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full bg-ai/10 border border-ai/20 text-ai text-[10px] font-medium"
              >
                {name}
              </span>
            );
          })}
        </div>
      )}

      {errorMessage && (
        <div className="p-2 rounded-lg bg-loss/15 border border-loss/30 text-loss text-xs flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
        <span className="text-[10px] text-dim font-mono">
          Ready to save into your permanent trade journal?
        </span>

        <button
          type="button"
          onClick={handleConfirmAndSave}
          disabled={isSaving}
          className="btn-primary py-1.5 px-3.5 sm:px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer hover:shadow-accent/25 transition-all disabled:opacity-50 shrink-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving to Journal...</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Confirm & Save to Journal</span>
            </>
          )}
        </button>
      </div>

      {/* Full-Screen Chart Lightbox for Draft Card */}
      {previewScreenshotUrl && (
        <div
          onClick={() => setPreviewScreenshotUrl(null)}
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewScreenshotUrl}
              alt="Expanded Chart"
              className="max-h-[80vh] max-w-full rounded-2xl border border-border shadow-2xl object-contain bg-black/40"
            />
            <button
              onClick={() => setPreviewScreenshotUrl(null)}
              className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-surface border border-border text-clean hover:bg-elevated flex items-center justify-center shadow-xl cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

