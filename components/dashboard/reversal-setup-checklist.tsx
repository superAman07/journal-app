"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Crosshair,
  Lock,
  Layers,
  Activity,
  Flame,
  Check,
  Zap,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  code: string;
  title: string;
  detail?: string;
  isMandatory?: boolean;
  isHardFilter?: boolean;
}

interface ChecklistSection {
  id: string;
  title: string;
  badge: string;
  badgeColor: "profit" | "accent" | "loss" | "ai" | "warn";
  description: string;
  items: ChecklistItem[];
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: "level_quality",
    title: "1. LEVEL QUALITY",
    badge: "Must have ALL",
    badgeColor: "accent",
    description: "Institutional multi-session structural level verification",
    items: [
      {
        id: "lq_a",
        code: "1a",
        title: "Level = Day-TF / Week-TF Support or Resistance",
        detail: "Untouched for ≥ 5 full trading sessions (fresh liquidity pool).",
        isMandatory: true,
      },
      {
        id: "lq_b",
        code: "1b",
        title: "Level NOT broken repeatedly in recent days/weeks",
        detail: "Not chopped through or invalidated by recent wicks.",
        isMandatory: true,
      },
      {
        id: "lq_c",
        code: "1c",
        title: "Aligns with Key Confluence",
        detail: "Prior-Day Close, VWAP Gap, or Previous Resistance→Support flip.",
        isMandatory: true,
      },
      {
        id: "lq_d",
        code: "1d",
        title: "Gap-Up / Gap-Down Present (Optional)",
        detail: "Provides gap-fill confluence to the level.",
        isMandatory: false,
      },
    ],
  },
  {
    id: "market_context",
    title: "2. MARKET CONTEXT",
    badge: "Must have 1+",
    badgeColor: "ai",
    description: "Momentum exhaustion and structural directional flow",
    items: [
      {
        id: "mc_a",
        code: "2a",
        title: "Higher Highs (or Lower Lows) Broken",
        detail: "Reversal from level gives an asymmetric 'Easy Target' liquidity run.",
        isMandatory: false,
      },
      {
        id: "mc_b",
        code: "2b",
        title: "VWAP Significantly Displaced from Price",
        detail: "High statistical mean-reversion probability back towards fair value.",
        isMandatory: false,
      },
      {
        id: "mc_c",
        code: "2c",
        title: "Straight-Line Price Approach (No Pause)",
        detail: "Unchecked momentum into the level indicates exhaustion signal.",
        isMandatory: false,
      },
      {
        id: "mc_d",
        code: "2d",
        title: "Market NOT 'Choppy / Scary'",
        detail: "Clear directional flow into level, not overlapping erratic noise.",
        isMandatory: false,
      },
    ],
  },
  {
    id: "entry_trigger",
    title: "3. ENTRY TRIGGER",
    badge: "Must have ALL",
    badgeColor: "profit",
    description: "Fibonacci retracement, rejection candles, and structural SL/TP",
    items: [
      {
        id: "et_a",
        code: "3a",
        title: "Price at Level + 30–50% Fib Retracement",
        detail: "Measured on the impulsive leg leading directly into the level.",
        isMandatory: true,
      },
      {
        id: "et_b",
        code: "3b",
        title: "Visible Pause / Rejection Candle(s) at Fib Zone",
        detail: "Wick rejection or consolidation proving institutional defense.",
        isMandatory: true,
      },
      {
        id: "et_c",
        code: "3c",
        title: "Precise Execution Entry",
        detail: "Lowest point of rejection (for CE) / Highest point of rejection (for PE).",
        isMandatory: true,
      },
      {
        id: "et_d",
        code: "3d",
        title: "Structure-Based Stop Loss (22–23 pts)",
        detail: "Placed strictly beyond rejection structure where thesis is dead. Risk = ₹1,430.",
        isMandatory: true,
      },
      {
        id: "et_e",
        code: "3e",
        title: "Target = 54 pts (1:2.3+ RR) with Open Runway",
        detail: "Clear space to target with zero opposing key levels in the immediate path.",
        isMandatory: true,
      },
    ],
  },
  {
    id: "hard_filters",
    title: "4. HARD FILTERS",
    badge: "Any FAIL = NO TRADE",
    badgeColor: "loss",
    description: "Absolute capital preservation vetos — zero tolerance exceptions",
    items: [
      {
        id: "hf_a",
        code: "4a",
        title: "Level broken multiple times recently",
        detail: "→ ACTION: SKIP. Thesis is invalid.",
        isHardFilter: true,
      },
      {
        id: "hf_b",
        code: "4b",
        title: "Choppy / Overlapping / 'Scary' price action",
        detail: "→ ACTION: NO TRADE DAY. Protect mental capital.",
        isHardFilter: true,
      },
      {
        id: "hf_c",
        code: "4c",
        title: "Target path blocked by fresh opposing level",
        detail: "→ ACTION: SKIP. RR is compromised.",
        isHardFilter: true,
      },
      {
        id: "hf_d",
        code: "4d",
        title: "No 30–50% Fib pause at level",
        detail: "→ ACTION: WAIT / SKIP. Do not chase.",
        isHardFilter: true,
      },
      {
        id: "hf_e",
        code: "4e",
        title: "Mental state: Urgency / FOMO / 'Need to recover'",
        detail: "→ ACTION: STAND DOWN. Close terminal.",
        isHardFilter: true,
      },
      {
        id: "hf_f",
        code: "4f",
        title: "Already took 1 trade today (Win or Loss)",
        detail: "→ ACTION: TERMINAL LOCKED. Respect the 1-trade rule.",
        isHardFilter: true,
      },
      {
        id: "hf_g",
        code: "4g",
        title: "Setup missing any mandatory checklist boxes",
        detail: "→ ACTION: WATCH ONLY. Journal why skipped.",
        isHardFilter: true,
      },
    ],
  },
  {
    id: "workflow_900",
    title: "5. 9:00–9:15 AM PRE-MARKET ROUTINE",
    badge: "Daily Routine",
    badgeColor: "warn",
    description: "Six-step morning preparation protocol before placing orders",
    items: [
      {
        id: "wf_1",
        code: "5.1",
        title: "Mark Day & Week Levels untouched for 5+ sessions",
        detail: "Identify pristine structural zones on higher timeframe chart.",
      },
      {
        id: "wf_2",
        code: "5.2",
        title: "Assess Market Structure (HH broken? VWAP gap?)",
        detail: "Establish bias: trend continuation vs mean-reversion reversal.",
      },
      {
        id: "wf_3",
        code: "5.3",
        title: "Label Day Type: TREND / RANGE / CHOP / SCARY",
        detail: "If CHOP or SCARY → Declare 'No Trade Day' at 9:15 AM and walk away.",
      },
      {
        id: "wf_4",
        code: "5.4",
        title: "Wait for Price → Level + 30–50% Fib + Rejection Candle",
        detail: "Stalk like a sniper. Do not anticipate before confirmation.",
      },
      {
        id: "wf_5",
        code: "5.5",
        title: "All boxes ticked? → EXECUTE. Else → WATCH",
        detail: "No hesitation when edge appears; zero FOMO when it doesn't.",
      },
      {
        id: "wf_6",
        code: "5.6",
        title: "Post-Trade: Terminal Locked. Journal. Walk Away.",
        detail: "Preserve gains, accept losses, protect capital for tomorrow.",
      },
    ],
  },
];

export function ReversalSetupChecklist() {
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({});
  const [failedFilters, setFailedFilters] = useState<{ [id: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<string>("all");

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Load from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedExpanded = localStorage.getItem("trading_reversal_checklist_expanded");
      if (savedExpanded !== null) {
        setIsExpanded(savedExpanded === "true");
      }

      const savedChecks = localStorage.getItem(`trading_reversal_checks_${todayStr}`);
      if (savedChecks) {
        setCheckedItems(JSON.parse(savedChecks));
      }

      const savedFailures = localStorage.getItem(`trading_reversal_failures_${todayStr}`);
      if (savedFailures) {
        setFailedFilters(JSON.parse(savedFailures));
      }
    } catch (e) {
      console.error("Error restoring checklist state:", e);
    }
  }, [todayStr]);

  const toggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem("trading_reversal_checklist_expanded", String(next));
  };

  const toggleCheck = (id: string) => {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
    localStorage.setItem(`trading_reversal_checks_${todayStr}`, JSON.stringify(updated));
  };

  const toggleHardFilterFail = (id: string) => {
    const updated = { ...failedFilters, [id]: !failedFilters[id] };
    setFailedFilters(updated);
    localStorage.setItem(`trading_reversal_failures_${todayStr}`, JSON.stringify(updated));
  };

  const handleReset = () => {
    setCheckedItems({});
    setFailedFilters({});
    localStorage.removeItem(`trading_reversal_checks_${todayStr}`);
    localStorage.removeItem(`trading_reversal_failures_${todayStr}`);
  };

  // Validation calculations
  const levelQualityAllChecked = useMemo(() => {
    const lq = CHECKLIST_SECTIONS[0].items.filter((i) => i.isMandatory);
    return lq.every((i) => checkedItems[i.id]);
  }, [checkedItems]);

  const marketContextHasOne = useMemo(() => {
    const mc = CHECKLIST_SECTIONS[1].items;
    return mc.some((i) => checkedItems[i.id]);
  }, [checkedItems]);

  const entryTriggerAllChecked = useMemo(() => {
    const et = CHECKLIST_SECTIONS[2].items.filter((i) => i.isMandatory);
    return et.every((i) => checkedItems[i.id]);
  }, [checkedItems]);

  const hardFiltersTriggered = useMemo(() => {
    return Object.values(failedFilters).some(Boolean);
  }, [failedFilters]);

  const totalCorePoints = 3 + 1 + 5; // 3 mandatory level + 1 context + 5 entry
  const checkedCoreCount = useMemo(() => {
    let count = 0;
    // Section 1 mandatory
    CHECKLIST_SECTIONS[0].items.filter((i) => i.isMandatory).forEach((i) => {
      if (checkedItems[i.id]) count++;
    });
    // Section 2 at least 1
    const mcChecked = CHECKLIST_SECTIONS[1].items.filter((i) => checkedItems[i.id]).length;
    if (mcChecked > 0) count++;
    // Section 3 mandatory
    CHECKLIST_SECTIONS[2].items.filter((i) => i.isMandatory).forEach((i) => {
      if (checkedItems[i.id]) count++;
    });
    return count;
  }, [checkedItems]);

  const isSetupFullyValidated =
    levelQualityAllChecked && marketContextHasOne && entryTriggerAllChecked && !hardFiltersTriggered;

  if (!mounted) return null;

  return (
    <div className="card rounded-2xl border border-border/50 bg-card/90 shadow-sm overflow-hidden transition-all duration-300">
      {/* ── Header Bar ── */}
      <div
        onClick={toggleExpand}
        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-surface/40 transition-colors select-none border-b border-border/30"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${
              hardFiltersTriggered
                ? "bg-loss/20 text-loss border border-loss/30"
                : isSetupFullyValidated
                ? "bg-profit/20 text-profit border border-profit/30 animate-pulse"
                : "bg-accent/15 text-accent border border-accent/25"
            }`}
          >
            {hardFiltersTriggered ? (
              <ShieldAlert className="h-5 w-5" />
            ) : isSetupFullyValidated ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Crosshair className="h-5 w-5" />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-clean tracking-tight flex items-center gap-1.5">
                <span>A+ REVERSAL SETUP PROTOCOL</span>
              </h3>
              <span className="badge badge-accent text-[10px] font-mono">NIFTY Options (CE/PE)</span>
              <span className="badge badge-neutral text-[10px] font-mono">Risk: ₹1,430</span>
              <span className="badge badge-profit text-[10px] font-mono">Target: 54 pts (1:2.3+ RR)</span>
            </div>
            <p className="text-[11px] text-muted">
              Pre-entry structural confluence checklist & hard capital preservation filters
            </p>
          </div>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {hardFiltersTriggered ? (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-loss/20 text-loss border border-loss/30 text-xs font-bold animate-pulse">
              <AlertOctagon className="h-3.5 w-3.5" />
              <span>HARD FILTER: STAND DOWN</span>
            </span>
          ) : isSetupFullyValidated ? (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-profit/20 text-profit border border-profit/30 text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>100% VALIDATED — READY</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-soft border border-border/40 text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>
                {checkedCoreCount}/{totalCorePoints} Confluences
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            title="Reset checklist for next setup"
            className="h-8 px-2.5 rounded-lg bg-surface hover:bg-elevated text-muted hover:text-clean text-xs font-semibold flex items-center gap-1 border border-border/40 cursor-pointer transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            className="h-8 w-8 rounded-lg bg-surface hover:bg-elevated text-muted hover:text-clean flex items-center justify-center border border-border/40 transition-all"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Expanded Content ── */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5 animate-in fade-in duration-200">
          {/* Quick Setup Spec Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-surface/60 border border-border/40">
              <span className="text-[10px] text-dim block uppercase font-sans">Instrument</span>
              <strong className="text-clean text-xs sm:text-sm">NIFTY 50 Options</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-surface/60 border border-border/40">
              <span className="text-[10px] text-dim block uppercase font-sans">Stop Loss</span>
              <strong className="text-loss text-xs sm:text-sm">22–23 pts (₹1,430)</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-surface/60 border border-border/40">
              <span className="text-[10px] text-dim block uppercase font-sans">Profit Target</span>
              <strong className="text-profit text-xs sm:text-sm">54 pts (1:2.3+ RR)</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-surface/60 border border-border/40">
              <span className="text-[10px] text-dim block uppercase font-sans">Execution Rule</span>
              <strong className="text-accent text-xs sm:text-sm">Max 1 Trade / Day</strong>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs border-b border-border/30 -mx-1 px-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "all" ? "bg-accent text-white shadow-xs" : "text-muted hover:text-clean"
              }`}
            >
              All Sections
            </button>
            {CHECKLIST_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === sec.id ? "bg-accent text-white shadow-xs" : "text-muted hover:text-clean"
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            {CHECKLIST_SECTIONS.filter((s) => activeTab === "all" || activeTab === s.id).map(
              (section) => {
                const isHardFilterSection = section.id === "hard_filters";
                const isWorkflowSection = section.id === "workflow_900";

                return (
                  <div
                    key={section.id}
                    className={`rounded-xl border p-3.5 sm:p-4 space-y-3 transition-all ${
                      isHardFilterSection
                        ? "bg-loss/5 border-loss/25"
                        : "bg-surface/40 border-border/40"
                    }`}
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-clean tracking-tight">
                          {section.title}
                        </span>
                        <span
                          className={`badge text-[10px] font-bold ${
                            section.badgeColor === "profit"
                              ? "badge-profit"
                              : section.badgeColor === "loss"
                              ? "badge-loss"
                              : section.badgeColor === "warn"
                              ? "badge-warn"
                              : section.badgeColor === "ai"
                              ? "badge-ai"
                              : "badge-accent"
                          }`}
                        >
                          {section.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted font-sans hidden sm:inline">
                        {section.description}
                      </span>
                    </div>

                    {/* Section Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {section.items.map((item) => {
                        if (isHardFilterSection) {
                          const isFailed = Boolean(failedFilters[item.id]);
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleHardFilterFail(item.id)}
                              className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border cursor-pointer select-none transition-all ${
                                isFailed
                                  ? "bg-loss/20 border-loss text-loss shadow-sm"
                                  : "bg-surface/60 border-border/40 hover:border-loss/40 text-soft"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isFailed ? (
                                  <AlertOctagon className="h-4 w-4 text-loss fill-loss/20" />
                                ) : (
                                  <Circle className="h-4 w-4 text-dim" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <span
                                  className={`text-xs font-bold block ${
                                    isFailed ? "text-loss line-through" : "text-clean"
                                  }`}
                                >
                                  {item.code}. {item.title}
                                </span>
                                {item.detail && (
                                  <span
                                    className={`text-[11px] block font-mono ${
                                      isFailed ? "text-loss/80" : "text-muted"
                                    }`}
                                  >
                                    {item.detail}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Normal Checklist Item
                        const isChecked = Boolean(checkedItems[item.id]);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleCheck(item.id)}
                            className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? "bg-profit/10 border-profit/40 text-clean shadow-xs"
                                : "bg-surface/60 border-border/40 hover:border-border text-soft"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckCircle2 className="h-4 w-4 text-profit fill-profit/20" />
                              ) : (
                                <Circle className="h-4 w-4 text-dim" />
                              )}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-semibold ${
                                    isChecked ? "text-profit font-bold" : "text-clean"
                                  }`}
                                >
                                  {item.code}. {item.title}
                                </span>
                                {item.isMandatory && (
                                  <span className="text-[9px] text-accent font-bold uppercase font-mono">
                                    [Req]
                                  </span>
                                )}
                              </div>
                              {item.detail && (
                                <p className="text-[11px] text-muted leading-relaxed font-sans">
                                  {item.detail}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* ── Bottom Summary Action Bar ── */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/30">
            <div className="text-xs text-soft space-y-0.5">
              <span className="font-bold text-clean block">
                Rule #1: Execution is Binary. Never enter on hope or intuition.
              </span>
              <span className="text-[11px] text-muted">
                Level (3/3 Req) + Context (1+) + Trigger (5/5 Req) + Zero Hard Filter Fails = A+ Trade
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <Link
                href="/ai-coach"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ai-muted text-ai border border-ai/25 text-xs font-bold hover:bg-ai/25 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Setup Audit</span>
              </Link>

              <Link
                href="/trades/new?setup=A%2B%20Reversal&risk=1430&target=54"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  hardFiltersTriggered
                    ? "bg-loss/20 text-loss border border-loss/30 cursor-not-allowed pointer-events-none"
                    : isSetupFullyValidated
                    ? "bg-profit text-white hover:bg-profit/90 animate-pulse"
                    : "btn-primary"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>
                  {hardFiltersTriggered
                    ? "Blocked by Hard Filter"
                    : isSetupFullyValidated
                    ? "Log A+ Reversal Trade"
                    : "Log This Setup"}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
