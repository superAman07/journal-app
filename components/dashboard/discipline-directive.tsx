"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  Circle,
  Flame,
  ArrowRight,
  TrendingDown,
  Clock,
  Compass,
  Zap,
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

  // 1. STATE: User took a loss / was stopped out / in losing streak
  if (hasTradedToday && isLossOrScratch) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-loss/40 bg-linear-to-b from-loss/15 via-loss/5 to-card p-5 sm:p-6 shadow-xl space-y-4">
        {/* Glow Accent */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-loss/20 blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-loss/20 text-loss border border-loss/30 text-xs font-extrabold uppercase tracking-wider animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" /> Post-Trade Directive
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-ai-muted text-ai border border-ai/20 text-[11px] font-bold">
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {streak}-Day Discipline Streak
            </span>
          </div>

          <div className="text-xs text-muted font-mono">
            Today&apos;s Status: <span className="text-loss font-bold">{todayTrades.length} Trade Logged</span>
          </div>
        </div>

        {/* BIG COMMANDING HEADLINE */}
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-clean tracking-tight uppercase flex items-center gap-2.5">
            🛑 Today&apos;s Mission: Terminal Locked. Capital Preserved.
          </h2>
          <p className="text-xs sm:text-sm text-soft leading-relaxed max-w-3xl">
            You respected your plan and took a defined exit. Getting wicked out before a target is a regular part of market volatility. 
            <span className="text-clean font-bold"> Your victory today is that you did NOT revenge trade.</span> Your capital and psychology are intact for tomorrow.
          </p>
        </div>

        {/* Interactive Challenge Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div
            onClick={() => toggleCheck("rule1")}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-card/60 border border-border/40 cursor-pointer hover:border-loss/40 transition-all select-none"
          >
            {checklist["rule1"] ? (
              <CheckCircle2 className="h-4 w-4 text-profit shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-dim shrink-0" />
            )}
            <span className={`text-xs font-semibold ${checklist["rule1"] ? "line-through text-muted" : "text-clean"}`}>
              Challenge 1: Take ZERO additional orders today
            </span>
          </div>

          <div
            onClick={() => toggleCheck("rule2")}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-card/60 border border-border/40 cursor-pointer hover:border-loss/40 transition-all select-none"
          >
            {checklist["rule2"] ? (
              <CheckCircle2 className="h-4 w-4 text-profit shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-dim shrink-0" />
            )}
            <span className={`text-xs font-semibold ${checklist["rule2"] ? "line-through text-muted" : "text-clean"}`}>
              Challenge 2: Close broker terminal & charting tabs
            </span>
          </div>

          <div
            onClick={() => toggleCheck("rule3")}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-card/60 border border-border/40 cursor-pointer hover:border-loss/40 transition-all select-none"
          >
            {checklist["rule3"] ? (
              <CheckCircle2 className="h-4 w-4 text-profit shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-dim shrink-0" />
            )}
            <span className={`text-xs font-semibold ${checklist["rule3"] ? "line-through text-muted" : "text-clean"}`}>
              Challenge 3: Debrief with AI Coach for psychology reset
            </span>
          </div>

          <div
            onClick={() => toggleCheck("rule4")}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-card/60 border border-border/40 cursor-pointer hover:border-loss/40 transition-all select-none"
          >
            {checklist["rule4"] ? (
              <CheckCircle2 className="h-4 w-4 text-profit shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-dim shrink-0" />
            )}
            <span className={`text-xs font-semibold ${checklist["rule4"] ? "line-through text-muted" : "text-clean"}`}>
              Challenge 4: Step outside or physical reset (No chart gazing)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          {isLocked ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-loss/20 text-loss border border-loss/30 text-xs font-bold">
              <Lock className="h-4 w-4" /> Terminal Locked for Today — Streak +1 Recorded!
            </div>
          ) : (
            <button
              onClick={handleLockTerminal}
              className="px-4 py-2.5 rounded-xl bg-loss text-white font-bold text-xs hover:bg-loss-hover transition-all cursor-pointer shadow-lg shadow-loss/20 flex items-center gap-2"
            >
              <Lock className="h-4 w-4" /> I Pledge: Lock Terminal & No More Trades
            </button>
          )}

          <Link
            href={`/ai-coach${lastTrade ? `?tradeId=${lastTrade.id}` : ""}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ai text-white font-bold text-xs hover:bg-ai/80 transition-all cursor-pointer shadow-lg shadow-ai/20"
          >
            <Sparkles className="h-4 w-4" /> Talk to AI Mentor About Today&apos;s Trade
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. STATE: User had a WIN today
  if (hasTradedToday && todayPnL > 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-profit/40 bg-linear-to-b from-profit/15 via-profit/5 to-card p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-profit/20 text-profit border border-profit/30 text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" /> Winning Discipline Mode
          </span>
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-ai-muted text-ai border border-ai/20 text-[11px] font-bold">
            <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {streak}-Day Discipline Streak
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-clean tracking-tight uppercase">
            🏆 Mission Accomplished: Protect Today&apos;s Profits
          </h2>
          <p className="text-xs sm:text-sm text-soft leading-relaxed max-w-3xl">
            Target achieved! The biggest pitfall for profitable traders is giving gains back in afternoon chop due to greed. 
            Lock in your profits and walk away with your edge intact.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/ai-coach"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ai text-white font-bold text-xs hover:bg-ai/80 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> Log Post-Trade Debrief with AI
          </Link>
        </div>
      </div>
    );
  }

  // 3. STATE: Pre-Market / No trades taken yet today
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-linear-to-b from-accent/10 via-accent/5 to-card p-4 sm:p-5 shadow-lg space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 text-[11px] font-bold uppercase tracking-wider">
            <Compass className="h-3.5 w-3.5" /> Daily Discipline Protocol
          </span>
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-ai-muted text-ai border border-ai/20 text-[11px] font-bold">
            <Flame className="h-3 w-3 text-amber-500 fill-amber-500" /> {streak}-Day Discipline Streak
          </span>
        </div>

        {losingStreak > 1 && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-loss bg-loss/10 border border-loss/20 px-2.5 py-0.5 rounded-full">
            <TrendingDown className="h-3 w-3" /> Streak Warning: {losingStreak} consecutive losses
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-clean tracking-tight">
          🎯 Today&apos;s Directive: Patience is Your Only Edge
        </h2>
        <p className="text-xs text-soft leading-relaxed max-w-2xl">
          Do not force trades. If your A+ setup doesn&apos;t appear with favorable Risk:Reward, doing nothing is a 100% win. 
          Max 1-2 trades today. Never avenge a previous loss.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Link
          href="/ai-coach"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ai hover:text-ai-hover transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" /> Consult AI Coach for Pre-Market Mindset Briefing →
        </Link>
      </div>
    </div>
  );
}
