"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  Circle,
  Flame,
  ArrowRight,
  TrendingDown,
  Compass,
} from "lucide-react";

interface DisciplineDirectiveProps {
  trades: any[];
  userName?: string | null;
}

export function DisciplineDirective({ trades = [], userName }: DisciplineDirectiveProps) {
  const [mounted, setMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});
  const [streak, setStreak] = useState(3);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Filter trades logged today
  const todayTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return trades.filter((t) => {
      const tradeDate = new Date(t.date).toISOString().split("T")[0];
      return tradeDate === todayStr;
    });
  }, [trades, todayStr]);

  // Calculate losing streak from recent trades
  const { losingStreak, lastTrade } = useMemo(() => {
    if (!trades || trades.length === 0) return { losingStreak: 0, lastTrade: null };
    let lossCount = 0;
    for (const t of trades) {
      if (t.outcome === "LOSS") {
        lossCount++;
      } else {
        break;
      }
    }
    return {
      losingStreak: lossCount,
      lastTrade: trades[0],
    };
  }, [trades]);

  const hasTradedToday = todayTrades.length > 0;
  const todayPnL = todayTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  const hadLossToday = todayTrades.some((t) => t.outcome === "LOSS");
  const hadBreakevenToday = todayTrades.some((t) => t.outcome === "BREAKEVEN");
  const isLossOrScratch = hadLossToday || hadBreakevenToday || (lastTrade && (lastTrade.outcome === "LOSS" || lastTrade.outcome === "BREAKEVEN"));

  useEffect(() => {
    setMounted(true);
    const lockKey = `discipline_lock_${todayStr}`;
    const savedLock = localStorage.getItem(lockKey);
    if (savedLock === "true") {
      setIsLocked(true);
    }

    const savedStreak = localStorage.getItem("discipline_streak");
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }

    const savedChecklist = localStorage.getItem(`discipline_checklist_${todayStr}`);
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch {}
    }
  }, [todayStr]);

  const toggleCheck = (id: string) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    localStorage.setItem(`discipline_checklist_${todayStr}`, JSON.stringify(updated));
  };

  const handleLockTerminal = () => {
    setIsLocked(true);
    localStorage.setItem(`discipline_lock_${todayStr}`, "true");
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem("discipline_streak", newStreak.toString());
  };

  if (!mounted) return null;

  // Completed challenges count
  const completedCount = Object.values(checklist).filter(Boolean).length;

  // 1. STATE: User took a loss / was stopped out / in losing streak
  //    Colors: Warm amber / calm slate-blue — NOT red (psychologically calming, protective)
  if (hasTradedToday && isLossOrScratch) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-linear-to-b from-amber-500/10 via-amber-500/5 to-card p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4">
        {/* Warm amber glow — calming, not aggressive */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
              <Shield className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> Post-Trade Directive
            </span>
            <span className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-ai-muted text-ai border border-ai/20 text-[10px] sm:text-[11px] font-bold">
              <Flame className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-500 fill-amber-500" /> {streak}-Day Discipline Streak
            </span>
          </div>

          <div className="text-[10px] sm:text-xs text-muted font-mono">
            Today: <span className="text-amber-400 font-bold">{todayTrades.length} Trade{todayTrades.length > 1 ? "s" : ""} Logged</span>
            {completedCount > 0 && (
              <span className="text-profit ml-2">· {completedCount}/4 Challenges ✓</span>
            )}
          </div>
        </div>

        {/* BIG COMMANDING HEADLINE — amber/gold tone, protective and grounding */}
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-clean tracking-tight uppercase leading-tight">
            🛡️ Today&apos;s Mission: Capital Preserved. Mind Protected.
          </h2>
          <p className="text-[11px] sm:text-xs lg:text-sm text-soft leading-relaxed max-w-3xl">
            You respected your plan and took a defined exit. Getting wicked out before a target is a regular part of market volatility.{" "}
            <span className="text-amber-300 font-bold">Your victory today is that you did NOT revenge trade.</span>{" "}
            Your capital and psychology are intact for tomorrow.
          </p>
        </div>

        {/* Interactive Challenge Checklist — warm borders, not red */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
          {[
            { id: "rule1", text: "Challenge 1: Take ZERO additional orders today" },
            { id: "rule2", text: "Challenge 2: Close broker terminal & charting tabs" },
            { id: "rule3", text: "Challenge 3: Debrief with AI Coach for psychology reset" },
            { id: "rule4", text: "Challenge 4: Step outside or physical reset (No chart gazing)" },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all select-none ${
                checklist[item.id]
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-card/60 border-border/40 hover:border-amber-500/30"
              }`}
            >
              {checklist[item.id] ? (
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-dim shrink-0" />
              )}
              <span className={`text-[11px] sm:text-xs font-semibold ${checklist[item.id] ? "line-through text-muted" : "text-clean"}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons — amber/gold commitment, no aggressive red */}
        <div className="pt-1 sm:pt-2 flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-2 sm:gap-3">
          {isLocked ? (
            <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[11px] sm:text-xs font-bold">
              <Lock className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Terminal Locked for Today — Streak +1 Recorded!
            </div>
          ) : (
            <button
              onClick={handleLockTerminal}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-600 text-white font-bold text-[11px] sm:text-xs hover:bg-amber-500 transition-all cursor-pointer shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
            >
              <Lock className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> I Pledge: Lock Terminal & No More Trades
            </button>
          )}

          <Link
            href={`/ai-coach${lastTrade ? `?tradeId=${lastTrade.id}` : ""}`}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-ai text-white font-bold text-[11px] sm:text-xs hover:bg-ai/80 transition-all cursor-pointer shadow-lg shadow-ai/20"
          >
            <Sparkles className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Talk to AI Mentor About Today&apos;s Trade
            <ArrowRight className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. STATE: User had a WIN today — calm green tones (already fine)
  if (hasTradedToday && todayPnL > 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-profit/30 bg-linear-to-b from-profit/10 via-profit/5 to-card p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-profit/15 text-profit border border-profit/25 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> Winning Discipline Mode
          </span>
          <span className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-ai-muted text-ai border border-ai/20 text-[10px] sm:text-[11px] font-bold">
            <Flame className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-500 fill-amber-500" /> {streak}-Day Discipline Streak
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-clean tracking-tight uppercase leading-tight">
            🏆 Mission Accomplished: Protect Today&apos;s Profits
          </h2>
          <p className="text-[11px] sm:text-xs lg:text-sm text-soft leading-relaxed max-w-3xl">
            Target achieved! The biggest pitfall for profitable traders is giving gains back in afternoon chop due to greed.
            Lock in your profits and walk away with your edge intact.
          </p>
        </div>

        <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/ai-coach"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-ai text-white font-bold text-[11px] sm:text-xs hover:bg-ai/80 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Log Post-Trade Debrief with AI
          </Link>
        </div>
      </div>
    );
  }

  // 3. STATE: Pre-Market / No trades taken yet today
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-linear-to-b from-accent/8 via-accent/3 to-card p-3 sm:p-5 shadow-lg space-y-2.5 sm:space-y-3">
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            <Compass className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> Daily Discipline Protocol
          </span>
          <span className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-ai-muted text-ai border border-ai/20 text-[10px] sm:text-[11px] font-bold">
            <Flame className="h-3 w-3 text-amber-500 fill-amber-500" /> {streak}-Day Discipline Streak
          </span>
        </div>

        {losingStreak > 1 && (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 sm:px-2.5 py-0.5 rounded-full">
            <TrendingDown className="h-3 w-3" /> Caution: {losingStreak} consecutive losses — trade with extra patience
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h2 className="text-base sm:text-xl lg:text-2xl font-black text-clean tracking-tight leading-tight">
          🎯 Today&apos;s Directive: Patience is Your Only Edge
        </h2>
        <p className="text-[11px] sm:text-xs text-soft leading-relaxed max-w-2xl">
          Do not force trades. If your A+ setup doesn&apos;t appear with favorable Risk:Reward, doing nothing is a 100% win.
          Max 1-2 trades today. Never avenge a previous loss.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-0.5 sm:pt-1">
        <Link
          href="/ai-coach"
          className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-ai hover:text-ai-hover transition-colors"
        >
          <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> Consult AI Coach for Pre-Market Mindset Briefing →
        </Link>
      </div>
    </div>
  );
}
