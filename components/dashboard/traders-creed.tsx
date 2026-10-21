"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Brain,
  Pin,
  PinOff,
  Sparkles,
  Settings2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  X,
  Shield,
  Compass,
  Flame,
  Award,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export type CreedCategory = "PRE_MARKET" | "LOSS" | "WIN" | "RULE_BREAK" | "GENERAL";

export interface CreedItem {
  id: string;
  text: string;
  author?: string;
  category: CreedCategory;
  categoryLabel: string;
  isCustom?: boolean;
}

const DEFAULT_CREEDS: CreedItem[] = [
  {
    id: "creed_loss",
    text: "MARKET OWES ME NOTHING. MY DISCIPLINE OWES ME SURVIVAL. SURVIVAL GIVES MY EDGE TIME TO WORK. I STAY. I EXECUTE. I WIN BY NOT LOSING.",
    author: "Survival Creed",
    category: "LOSS",
    categoryLabel: "🛡️ Defense & Loss Shield",
  },
  {
    id: "creed_premarket",
    text: "KARM: MY SETUP. MY RISK. MY DISCIPLINE. FAL: MARKET'S DECISION. I DO MY KARM. I LET MARKET DO ITS FAL. I STAY. I REPEAT.",
    author: "Gita Execution Code",
    category: "PRE_MARKET",
    categoryLabel: "🏹 Pre-Market Focus",
  },
  {
    id: "creed_win",
    text: "Profit tab aayega jab tum usko dhoondhna band kar doge — aur sirf apna kaam karte rahoge.",
    author: "Anti-Greed Anchor",
    category: "WIN",
    categoryLabel: "🧘 Profit & Anti-Greed Protection",
  },
  {
    id: "creed_rule_break",
    text: "PLAN THE TRADE. TRADE THE PLAN. ACCEPT THE OUTCOME. REPEAT.",
    author: "Core Process Loop",
    category: "RULE_BREAK",
    categoryLabel: "🎯 Execution Realignment",
  },
];

interface TradersCreedProps {
  trades?: any[];
  userName?: string | null;
}

export function TradersCreed({ trades = [], userName }: TradersCreedProps) {
  const [mounted, setMounted] = useState(false);
  const [creeds, setCreeds] = useState<CreedItem[]>(DEFAULT_CREEDS);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Modal State
  const [modalTab, setModalTab] = useState<"library" | "add" | "ai">("library");
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState<CreedCategory>("GENERAL");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedQuote, setAiGeneratedQuote] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Compute trade metrics for automatic diagnosis
  const { stateCategory, stateReason, streak } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        stateCategory: "PRE_MARKET" as CreedCategory,
        stateReason: "Pre-market: Fresh trading session",
        streak: 0,
      };
    }

    const todayTrades = trades.filter((t) => {
      try {
        const tradeDate = new Date(t.date).toISOString().split("T")[0];
        return tradeDate === todayStr;
      } catch {
        return false;
      }
    });

    const lastTrade = trades[0];

    // Compute streak
    let currentStreak = 0;
    let streakType = lastTrade?.outcome;
    if (streakType) {
      for (const t of trades) {
        if (t.outcome === streakType) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const hadLossToday = todayTrades.some((t) => t.outcome === "LOSS");
    const hadWinToday = todayTrades.some((t) => t.outcome === "WIN");
    const todayPnL = todayTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
    const ruleBrokenToday = todayTrades.some((t) => t.rulesFollowed === false);
    const lastRuleBroken = lastTrade && lastTrade.rulesFollowed === false;

    // 1. Highest priority: Rule break
    if (ruleBrokenToday || lastRuleBroken) {
      return {
        stateCategory: "RULE_BREAK" as CreedCategory,
        stateReason: "Discipline Alert: Rule break logged in recent execution",
        streak: currentStreak,
      };
    }

    // 2. Loss today or recent loss/losing streak
    if (hadLossToday || (lastTrade && lastTrade.outcome === "LOSS")) {
      return {
        stateCategory: "LOSS" as CreedCategory,
        stateReason:
          currentStreak > 1
            ? `Shield Activated: ${currentStreak} consecutive losses detected`
            : "Shield Activated: Responding to recent stop-out / loss",
        streak: currentStreak,
      };
    }

    // 3. Win today & green
    if (hadWinToday && todayPnL > 0) {
      return {
        stateCategory: "WIN" as CreedCategory,
        stateReason: `Winning Session: +₹${todayPnL.toFixed(0)} today — Guarding against greed & overtrading`,
        streak: currentStreak,
      };
    }

    // 4. Default: Pre-market
    return {
      stateCategory: "PRE_MARKET" as CreedCategory,
      stateReason: "Pre-market Anchor: Focus on process over outcome",
      streak: currentStreak,
    };
  }, [trades, todayStr]);

  // Load saved custom creeds and pinned ID from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const storedCustom = localStorage.getItem("trading_journal_custom_creeds");
      if (storedCustom) {
        const parsed = JSON.parse(storedCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCreeds([...DEFAULT_CREEDS, ...parsed]);
        }
      }

      const storedPinned = localStorage.getItem("trading_journal_pinned_creed");
      if (storedPinned) {
        setPinnedId(storedPinned);
      }
    } catch (e) {
      console.error("Error loading custom creeds:", e);
    }
  }, []);

  // Determine active creed
  const activeCreed = useMemo(() => {
    // 1. If user is manually cycling through creeds
    if (manualIndex !== null && creeds[manualIndex]) {
      return creeds[manualIndex];
    }

    // 2. If pinned by user
    if (pinnedId) {
      const found = creeds.find((c) => c.id === pinnedId);
      if (found) return found;
    }

    // 3. Dynamic selection based on journal state
    const matching = creeds.find((c) => c.category === stateCategory);
    return matching || creeds[0];
  }, [creeds, manualIndex, pinnedId, stateCategory]);

  const currentIndex = creeds.findIndex((c) => c.id === activeCreed.id);

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % creeds.length;
    setManualIndex(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + creeds.length) % creeds.length;
    setManualIndex(prevIdx);
  };

  const handleTogglePin = (id: string) => {
    if (pinnedId === id) {
      setPinnedId(null);
      localStorage.removeItem("trading_journal_pinned_creed");
    } else {
      setPinnedId(id);
      localStorage.setItem("trading_journal_pinned_creed", id);
      setManualIndex(null);
    }
  };

  const handleCopy = () => {
    if (!activeCreed) return;
    navigator.clipboard.writeText(activeCreed.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCustomCreed = () => {
    if (!newText.trim()) return;

    const newCreed: CreedItem = {
      id: `custom_${Date.now()}`,
      text: newText.trim(),
      author: newAuthor.trim() || userName || "Personal Creed",
      category: newCategory,
      categoryLabel:
        newCategory === "LOSS"
          ? "🛡️ Loss Shield"
          : newCategory === "WIN"
          ? "🧘 Anti-Greed"
          : newCategory === "PRE_MARKET"
          ? "🏹 Pre-Market"
          : newCategory === "RULE_BREAK"
          ? "🎯 Discipline"
          : "✨ General Mantra",
      isCustom: true,
    };

    const updated = [...creeds, newCreed];
    setCreeds(updated);

    const customOnly = updated.filter((c) => c.isCustom);
    localStorage.setItem("trading_journal_custom_creeds", JSON.stringify(customOnly));

    setNewText("");
    setNewAuthor("");
    setModalTab("library");
  };

  const handleDeleteCustomCreed = (id: string) => {
    const updated = creeds.filter((c) => c.id !== id);
    setCreeds(updated);
    if (pinnedId === id) {
      setPinnedId(null);
      localStorage.removeItem("trading_journal_pinned_creed");
    }
    const customOnly = updated.filter((c) => c.isCustom);
    localStorage.setItem("trading_journal_custom_creeds", JSON.stringify(customOnly));
  };

  const handleGenerateAIMantra = async () => {
    setAiGenerating(true);
    setAiGeneratedQuote(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Give me a single, powerful, 1-2 sentence stoic trading creed or mantra tailored to my current state (${stateReason}). Do not include conversational filler, greeting, or explanations. Only return the uppercase or bold mantra text.`,
            },
          ],
          provider: "Auto",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content ? data.content.replace(/^["'\s]+|["'\s]+$/g, "") : null;
        if (text) {
          setAiGeneratedQuote(text);
          return;
        }
      }
    } catch {
      // Fallback
    } finally {
      setAiGenerating(false);
    }

    // Stoic fallback if API was unavailable
    setAiGeneratedQuote(
      "CONTROL WHAT IS YOURS: YOUR ENTRY, YOUR STOP, YOUR PEACE. SURRENDER WHAT BELONGS TO THE MARKET: THE OUTCOME."
    );
  };

  const handleSaveAIGenerated = () => {
    if (!aiGeneratedQuote) return;
    const newCreed: CreedItem = {
      id: `ai_${Date.now()}`,
      text: aiGeneratedQuote,
      author: "AI Coach Reflection",
      category: stateCategory,
      categoryLabel: "✨ AI Personalized Mantra",
      isCustom: true,
    };

    const updated = [...creeds, newCreed];
    setCreeds(updated);
    const customOnly = updated.filter((c) => c.isCustom);
    localStorage.setItem("trading_journal_custom_creeds", JSON.stringify(customOnly));

    setPinnedId(newCreed.id);
    localStorage.setItem("trading_journal_pinned_creed", newCreed.id);
    setShowManageModal(false);
  };

  if (!mounted) return null;

  // Style configurations based on active category
  const themeStyles = {
    LOSS: {
      border: "border-amber-500/35",
      glow: "from-amber-500/10 via-amber-500/5 to-card",
      accentBar: "bg-linear-to-b from-amber-400 to-amber-600",
      badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: <Shield className="h-3.5 w-3.5 text-amber-400" />,
    },
    WIN: {
      border: "border-profit/35",
      glow: "from-profit/10 via-profit/5 to-card",
      accentBar: "bg-linear-to-b from-emerald-400 to-emerald-600",
      badgeBg: "bg-profit/15 text-profit border-profit/30",
      icon: <Award className="h-3.5 w-3.5 text-profit" />,
    },
    RULE_BREAK: {
      border: "border-purple-500/35",
      glow: "from-purple-500/10 via-purple-500/5 to-card",
      accentBar: "bg-linear-to-b from-purple-400 to-purple-600",
      badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      icon: <AlertTriangle className="h-3.5 w-3.5 text-purple-400" />,
    },
    PRE_MARKET: {
      border: "border-accent/35",
      glow: "from-accent/10 via-accent/5 to-card",
      accentBar: "bg-linear-to-b from-cyan-400 to-blue-600",
      badgeBg: "bg-accent/15 text-accent border-accent/30",
      icon: <Compass className="h-3.5 w-3.5 text-accent" />,
    },
    GENERAL: {
      border: "border-ai/35",
      glow: "from-ai/10 via-ai/5 to-card",
      accentBar: "bg-linear-to-b from-ai to-ai-hover",
      badgeBg: "bg-ai-muted text-ai border-ai/30",
      icon: <Sparkles className="h-3.5 w-3.5 text-ai" />,
    },
  }[activeCreed.category] || {
    border: "border-border/40",
    glow: "from-card-accent to-card",
    accentBar: "bg-accent",
    badgeBg: "bg-surface text-soft border-border/40",
    icon: <Brain className="h-3.5 w-3.5 text-accent" />,
  };

  const isPinned = pinnedId === activeCreed.id;
  const isAuto = !isPinned && manualIndex === null;

  return (
    <>
      {/* ── Main Dynamic Creed Banner ── */}
      <div
        className={`relative overflow-hidden rounded-2xl border ${themeStyles.border} bg-linear-to-r ${themeStyles.glow} p-4 sm:p-5 shadow-lg transition-all duration-300 group`}
      >
        {/* Glowing Decorative Bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 ${themeStyles.accentBar} shadow-sm`}
        />

        <div className="pl-2 sm:pl-3 space-y-2.5">
          {/* Top Metadata Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider border ${themeStyles.badgeBg}`}
              >
                {themeStyles.icon}
                <span>{activeCreed.categoryLabel}</span>
              </span>

              {isAuto ? (
                <span className="text-[10px] sm:text-[11px] font-mono text-dim flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-ai animate-pulse" />
                  <span>{stateReason}</span>
                </span>
              ) : isPinned ? (
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded-full">
                  <Pin className="h-3 w-3 fill-current" /> Pinned Mantra
                </span>
              ) : (
                <button
                  onClick={() => setManualIndex(null)}
                  className="text-[10px] sm:text-[11px] text-ai hover:underline cursor-pointer"
                >
                  Return to Auto-Diagnosis ↺
                </button>
              )}
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                title="Previous thought"
                className="h-7 w-7 rounded-lg bg-surface/80 hover:bg-elevated border border-border/40 text-muted hover:text-clean flex items-center justify-center cursor-pointer transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleNext}
                title="Next thought"
                className="h-7 w-7 rounded-lg bg-surface/80 hover:bg-elevated border border-border/40 text-muted hover:text-clean flex items-center justify-center cursor-pointer transition-all"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => handleTogglePin(activeCreed.id)}
                title={isPinned ? "Unpin (Return to dynamic auto-mode)" : "Pin this thought for today"}
                className={`h-7 px-2 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  isPinned
                    ? "bg-accent text-white border-accent shadow-xs"
                    : "bg-surface/80 hover:bg-elevated border-border/40 text-muted hover:text-clean"
                }`}
              >
                {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                <span className="hidden sm:inline">{isPinned ? "Pinned" : "Pin"}</span>
              </button>

              <button
                onClick={handleCopy}
                title="Copy thought"
                className="h-7 w-7 rounded-lg bg-surface/80 hover:bg-elevated border border-border/40 text-muted hover:text-clean flex items-center justify-center cursor-pointer transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-profit" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={() => setShowManageModal(true)}
                title="Customize / Add Thoughts"
                className="h-7 px-2 rounded-lg bg-surface/80 hover:bg-elevated border border-border/40 text-[11px] font-semibold text-soft hover:text-clean flex items-center gap-1 cursor-pointer transition-all ml-1"
              >
                <Settings2 className="h-3.5 w-3.5 text-ai" />
                <span className="hidden sm:inline">Customize</span>
              </button>
            </div>
          </div>

          {/* Thought Text Quote */}
          <div className="relative pt-0.5">
            <p className="text-sm sm:text-base lg:text-lg font-bold text-clean tracking-tight leading-snug sm:leading-relaxed selection:bg-accent/30 font-sans">
              &ldquo;{activeCreed.text}&rdquo;
            </p>
            {activeCreed.author && (
              <p className="text-[10px] sm:text-xs text-muted font-mono mt-1 flex items-center gap-1.5">
                <span>— {activeCreed.author}</span>
                {activeCreed.isCustom && (
                  <span className="text-[9px] bg-elevated px-1.5 py-0.2 rounded text-ai border border-ai/20">
                    Custom
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Manage & Add Thoughts Modal ── */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card w-full max-w-xl rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-card">
            {/* Modal Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-ai-muted text-ai flex items-center justify-center font-bold">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-clean">
                    Trader&apos;s Creed & Mindset Anchors
                  </h3>
                  <p className="text-[11px] text-muted">
                    Auto-calibrated to your journal & customizable from here
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowManageModal(false)}
                className="h-8 w-8 rounded-xl bg-surface hover:bg-elevated text-muted hover:text-clean flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-2 bg-surface/50 border-b border-border/30 text-xs">
              <button
                onClick={() => setModalTab("library")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  modalTab === "library" ? "bg-accent text-white shadow-xs" : "text-muted hover:text-clean"
                }`}
              >
                All Thoughts ({creeds.length})
              </button>
              <button
                onClick={() => setModalTab("add")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  modalTab === "add" ? "bg-accent text-white shadow-xs" : "text-muted hover:text-clean"
                }`}
              >
                + Add Custom
              </button>
              <button
                onClick={() => {
                  setModalTab("ai");
                  if (!aiGeneratedQuote && !aiGenerating) {
                    handleGenerateAIMantra();
                  }
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  modalTab === "ai" ? "bg-ai text-white shadow-xs" : "text-ai hover:bg-ai/10"
                }`}
              >
                <Sparkles className="h-3 w-3" /> AI Generator
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {modalTab === "library" && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-surface/60 border border-border/30 text-xs text-soft flex items-center justify-between">
                    <span>
                      Active mode:{" "}
                      <strong className="text-clean">
                        {pinnedId ? "📌 Pinned Mantra" : "⚡ Dynamic Auto-Journal Mode"}
                      </strong>
                    </span>
                    {pinnedId && (
                      <button
                        onClick={() => {
                          setPinnedId(null);
                          localStorage.removeItem("trading_journal_pinned_creed");
                        }}
                        className="text-[11px] text-accent font-bold hover:underline cursor-pointer"
                      >
                        Reset to Auto
                      </button>
                    )}
                  </div>

                  {creeds.map((creed) => {
                    const isItemPinned = pinnedId === creed.id;
                    return (
                      <div
                        key={creed.id}
                        className={`p-3.5 rounded-xl border transition-all space-y-2 select-none ${
                          isItemPinned
                            ? "bg-accent/10 border-accent/40 shadow-xs"
                            : "bg-surface/50 border-border/40 hover:border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-elevated text-soft font-bold">
                            {creed.categoryLabel}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTogglePin(creed.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                isItemPinned
                                  ? "bg-accent text-white"
                                  : "bg-surface hover:bg-elevated border border-border/40 text-muted hover:text-clean"
                              }`}
                            >
                              <Pin className="h-3 w-3" />
                              <span>{isItemPinned ? "Pinned" : "Pin"}</span>
                            </button>

                            {creed.isCustom && (
                              <button
                                onClick={() => handleDeleteCustomCreed(creed.id)}
                                title="Delete custom thought"
                                className="h-6 w-6 rounded-lg text-muted hover:text-loss hover:bg-loss/15 flex items-center justify-center cursor-pointer transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-clean leading-relaxed">
                          &ldquo;{creed.text}&rdquo;
                        </p>

                        {creed.author && (
                          <div className="text-[10px] text-muted font-mono flex items-center justify-between">
                            <span>— {creed.author}</span>
                            {creed.id === activeCreed.id && (
                              <span className="text-ai font-bold">● Active on Dashboard</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {modalTab === "add" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-clean">Your Thought / Mantra Text</label>
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="e.g. FOCUS ON ONE CANDLE AT A TIME. DO NOT TOUCH STOP LOSS. ACCEPT THE VARIANCE."
                      rows={3}
                      className="input-field w-full text-xs sm:text-sm py-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-clean">Author or Source Tag</label>
                      <input
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        placeholder="e.g. Aman's Rule #1 / Mark Douglas"
                        className="input-field w-full text-xs py-2"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-clean">When Should this Trigger?</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as CreedCategory)}
                        className="input-field w-full text-xs py-2 font-mono"
                      >
                        <option value="GENERAL">General / Always Visible</option>
                        <option value="PRE_MARKET">Pre-Market (Before Taking Trades)</option>
                        <option value="LOSS">Post-Loss / Stop-Out Defense</option>
                        <option value="WIN">Post-Win (Anti-Greed & Protection)</option>
                        <option value="RULE_BREAK">On Rule Break / Discipline Slip</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleAddCustomCreed}
                      disabled={!newText.trim()}
                      className="btn-primary w-full py-2.5 text-xs font-bold cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" /> Save Thought to Dashboard
                    </button>
                  </div>
                </div>
              )}

              {modalTab === "ai" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-ai-muted/40 border border-ai/20 text-xs space-y-1">
                    <span className="font-bold text-ai flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> AI Journal Analysis
                    </span>
                    <p className="text-soft text-[11px] leading-relaxed">
                      AI analyzes your current trade streak ({streak}x), recent PnL, and discipline patterns to generate a stoic mindset anchor.
                    </p>
                  </div>

                  {aiGenerating ? (
                    <div className="p-8 text-center space-y-2">
                      <RefreshCw className="h-6 w-6 text-ai animate-spin mx-auto" />
                      <p className="text-xs text-soft font-semibold">
                        Crafting personalized trading mantra...
                      </p>
                    </div>
                  ) : aiGeneratedQuote ? (
                    <div className="p-4 rounded-xl border border-ai/40 bg-surface/70 space-y-3">
                      <p className="text-xs sm:text-sm font-bold text-clean leading-relaxed italic">
                        &ldquo;{aiGeneratedQuote}&rdquo;
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleSaveAIGenerated}
                          className="flex-1 py-2 rounded-xl bg-ai text-white font-bold text-xs hover:bg-ai/80 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Pin className="h-3.5 w-3.5" /> Pin as Active Mantra
                        </button>
                        <button
                          onClick={handleGenerateAIMantra}
                          className="px-3 py-2 rounded-xl bg-surface hover:bg-elevated border border-border/40 text-xs font-bold text-soft hover:text-clean transition-all cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="h-3 w-3" /> Regenerate
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-surface/40 border-t border-border/30 flex items-center justify-end">
              <button
                onClick={() => setShowManageModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-surface hover:bg-elevated border border-border/40 text-clean cursor-pointer transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
