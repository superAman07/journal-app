"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Brain,
  Plus,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Check,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { MarketType, SessionType, TradeOutcome, ExitReason, TradeBias, EmotionType, ScreenshotStage } from "@/types";

const MARKETS: MarketType[] = ["Gold", "Forex", "Crypto", "Nifty Options", "BankNifty", "Silver", "Stocks", "Futures"];
const SESSIONS: SessionType[] = ["London", "New York", "Asian", "London/NY Overlap"];
const EMOTIONS: EmotionType[] = ["Calm", "Fear", "Greed", "Revenge", "FOMO", "Overconfidence", "Anxiety", "Hesitation", "Frustration"];

const STEPS = [
  { step: 1, label: "Plan", icon: Target },
  { step: 2, label: "Execution", icon: TrendingUp },
  { step: 3, label: "Result", icon: CheckCircle2 },
  { step: 4, label: "Mindset", icon: Brain },
];

export function TradeForm() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);

  // Plan
  const [market, setMarket] = useState<MarketType>("Gold");
  const [instrument, setInstrument] = useState("XAUUSD");
  const [session, setSession] = useState<SessionType>("New York");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [setup, setSetup] = useState("Order Block + FVG");
  const [bias, setBias] = useState<TradeBias>("BULLISH");
  const [plannedEntry, setPlannedEntry] = useState("2385.00");
  const [stopLoss, setStopLoss] = useState("2380.00");
  const [target, setTarget] = useState("2400.00");
  const [expectedRR, setExpectedRR] = useState(3.0);

  // Execution
  const [actualEntry, setActualEntry] = useState("2385.50");
  const [actualExit, setActualExit] = useState("2400.00");
  const [positionSize, setPositionSize] = useState("2.0");
  const [riskPercent, setRiskPercent] = useState("1.0");
  const [actualRR, setActualRR] = useState(2.9);
  const [isLateEntry, setIsLateEntry] = useState(false);
  const [isEarlyEntry, setIsEarlyEntry] = useState(false);
  const [slippage, setSlippage] = useState("0.5");

  // Result
  const [outcome, setOutcome] = useState<TradeOutcome>("WIN");
  const [exitReason, setExitReason] = useState<ExitReason>("TARGET_HIT");
  const [pnl, setPnl] = useState("2900.00");
  const [rulesFollowed, setRulesFollowed] = useState(true);
  const [ruleBreakReason, setRuleBreakReason] = useState("");

  // Mindset
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>(["Calm"]);
  const [mindsetBefore, setMindsetBefore] = useState("");
  const [mindsetDuring, setMindsetDuring] = useState("");
  const [mindsetAfter, setMindsetAfter] = useState("");

  // Screenshots
  const [screenshots, setScreenshots] = useState<{ id: string; url: string; stage: ScreenshotStage; caption: string }[]>([]);
  const [pastedUrl, setPastedUrl] = useState("");

  // Auto-calc RR
  useEffect(() => {
    const e = parseFloat(plannedEntry), sl = parseFloat(stopLoss), tp = parseFloat(target);
    if (!isNaN(e) && !isNaN(sl) && !isNaN(tp) && e !== sl) {
      setExpectedRR(parseFloat((Math.abs(tp - e) / Math.abs(e - sl)).toFixed(2)));
    }
  }, [plannedEntry, stopLoss, target]);

  useEffect(() => {
    const e = parseFloat(actualEntry), sl = parseFloat(stopLoss), ex = parseFloat(actualExit);
    if (!isNaN(e) && !isNaN(sl) && !isNaN(ex) && e !== sl) {
      const risk = Math.abs(e - sl);
      const reward = outcome === "LOSS" ? -risk : Math.abs(ex - e);
      setActualRR(parseFloat((reward / risk).toFixed(2)));
    }
  }, [actualEntry, stopLoss, actualExit, outcome]);

  const toggleEmotion = (emo: EmotionType) => {
    setSelectedEmotions((prev) => prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]);
  };

  const addScreenshot = () => {
    if (!pastedUrl.trim()) return;
    setScreenshots([...screenshots, { id: `sc-${Date.now()}`, url: pastedUrl, stage: "BEFORE_ENTRY", caption: "" }]);
    setPastedUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Trade saved successfully!");
    router.push("/trades");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <Plus className="h-5 w-5 text-accent" /> Log New Trade
        </h1>
        <p className="text-xs text-muted mt-0.5">Complete the 4-phase journal in under 60 seconds.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isCurrent = activeStep === s.step;
          const isDone = activeStep > s.step;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                isCurrent
                  ? "bg-accent-muted text-accent border-accent/30"
                  : isDone
                  ? "bg-elevated text-soft"
                  : "bg-transparent text-dim border-transparent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{s.label}</span>
              {isDone && <Check className="h-3 w-3 text-profit" />}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="card p-4 sm:p-6 space-y-6">
        
        {/* STEP 1: PLAN */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <SectionHeader icon={<Target className="h-4 w-4 text-accent" />} title="Trade Setup & Plan" desc="Market context, bias, levels, and expected RR." />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Market">
                <select value={market} onChange={(e) => setMarket(e.target.value as MarketType)} className="input-field">
                  {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Instrument">
                <input value={instrument} onChange={(e) => setInstrument(e.target.value)} placeholder="e.g. XAUUSD" className="input-field font-mono uppercase" />
              </FormField>
              <FormField label="Session">
                <select value={session} onChange={(e) => setSession(e.target.value as SessionType)} className="input-field">
                  {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Date">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
              </FormField>
              <FormField label="Setup">
                <input value={setup} onChange={(e) => setSetup(e.target.value)} placeholder="e.g. Order Block" className="input-field" />
              </FormField>
              <FormField label="Bias">
                <div className="grid grid-cols-3 gap-1.5">
                  {(["BULLISH", "BEARISH", "NEUTRAL"] as TradeBias[]).map((b) => (
                    <button key={b} type="button" onClick={() => setBias(b)}
                      className={`py-2 rounded-lg text-[11px] font-bold transition-all border ${
                        bias === b
                          ? b === "BULLISH" ? "bg-profit/15 text-profit border-profit/30" : b === "BEARISH" ? "bg-loss/15 text-loss border-loss/30" : "bg-elevated text-soft border-border-hover"
                          : "bg-surface text-dim hover:bg-elevated"
                      }`}
                    >{b}</button>
                  ))}
                </div>
              </FormField>
            </div>

            {/* Price Levels */}
            <div className="card-elevated p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label="Planned Entry">
                <input type="number" step="any" value={plannedEntry} onChange={(e) => setPlannedEntry(e.target.value)} className="input-field font-mono" />
              </FormField>
              <FormField label="Stop Loss">
                <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="input-field font-mono !text-loss" />
              </FormField>
              <FormField label="Target">
                <input type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} className="input-field font-mono !text-profit" />
              </FormField>
              <FormField label="Expected RR">
                <div className="h-[42px] rounded-xl bg-accent-muted border border-accent/20 flex items-center justify-center font-mono font-bold text-accent text-sm">
                  1:{expectedRR}R
                </div>
              </FormField>
            </div>

            <StepNav onNext={() => setActiveStep(2)} />
          </div>
        )}

        {/* STEP 2: EXECUTION */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <SectionHeader icon={<TrendingUp className="h-4 w-4 text-accent" />} title="Trade Execution" desc="Entry, exit, position sizing, slippage, and timing." />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label="Actual Entry">
                <input type="number" step="any" value={actualEntry} onChange={(e) => setActualEntry(e.target.value)} className="input-field font-mono" />
              </FormField>
              <FormField label="Actual Exit">
                <input type="number" step="any" value={actualExit} onChange={(e) => setActualExit(e.target.value)} className="input-field font-mono" />
              </FormField>
              <FormField label="Position Size">
                <input type="number" step="any" value={positionSize} onChange={(e) => setPositionSize(e.target.value)} className="input-field" />
              </FormField>
              <FormField label="Risk %">
                <input type="number" step="any" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} className="input-field" />
              </FormField>
            </div>

            <div className="card-elevated p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-overlay/30 transition-colors">
                <input type="checkbox" checked={isLateEntry} onChange={(e) => setIsLateEntry(e.target.checked)} className="h-4 w-4 rounded accent-accent" />
                <div>
                  <span className="text-xs font-semibold text-soft block">Late Entry</span>
                  <span className="text-[10px] text-dim">Chased after trigger</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-overlay/30 transition-colors">
                <input type="checkbox" checked={isEarlyEntry} onChange={(e) => setIsEarlyEntry(e.target.checked)} className="h-4 w-4 rounded accent-accent" />
                <div>
                  <span className="text-xs font-semibold text-soft block">Early Entry</span>
                  <span className="text-[10px] text-dim">Before confirmation</span>
                </div>
              </label>
              <FormField label="Slippage (pts)">
                <input type="number" step="any" value={slippage} onChange={(e) => setSlippage(e.target.value)} className="input-field" />
              </FormField>
            </div>

            <StepNav onPrev={() => setActiveStep(1)} onNext={() => setActiveStep(3)} />
          </div>
        )}

        {/* STEP 3: RESULT */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <SectionHeader icon={<CheckCircle2 className="h-4 w-4 text-accent" />} title="Trade Outcome" desc="Result, PnL, R-multiple, and rule compliance." />

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(["WIN", "LOSS", "BREAKEVEN"] as TradeOutcome[]).map((o) => (
                <button key={o} type="button" onClick={() => setOutcome(o)}
                  className={`py-4 sm:py-5 rounded-xl text-center font-bold text-xs sm:text-sm transition-all border ${
                    outcome === o
                      ? o === "WIN" ? "bg-profit/15 text-profit border-profit/40" : o === "LOSS" ? "bg-loss/15 text-loss border-loss/40" : "bg-elevated text-soft border-border-hover"
                      : "bg-surface text-dim hover:bg-elevated"
                  }`}
                >
                  {o}
                  <span className="block text-[9px] sm:text-[10px] font-normal text-inherit opacity-70 mt-0.5">
                    {o === "WIN" ? "Target Hit" : o === "LOSS" ? "Stop Hit" : "0R Neutral"}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Net PnL ($)">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dim" />
                  <input type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)}
                    className={`input-field !pl-9 font-mono font-bold ${parseFloat(pnl) >= 0 ? "!text-profit" : "!text-loss"}`}
                  />
                </div>
              </FormField>
              <FormField label="Exit Reason">
                <select value={exitReason} onChange={(e) => setExitReason(e.target.value as ExitReason)} className="input-field">
                  <option value="TARGET_HIT">Target Hit</option>
                  <option value="STOP_HIT">Stop Hit</option>
                  <option value="MANUAL_EXIT">Manual Exit</option>
                </select>
              </FormField>
              <FormField label="R-Multiple">
                <div className={`h-[42px] rounded-xl border flex items-center justify-center font-mono font-bold text-sm ${
                  actualRR >= 0 ? "bg-profit/10 border-profit/20 text-profit" : "bg-loss/10 border-loss/20 text-loss"
                }`}>
                  {actualRR >= 0 ? `+${actualRR}R` : `${actualRR}R`}
                </div>
              </FormField>
            </div>

            {/* Rules Compliance */}
            <div className="card-elevated p-4 rounded-xl space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={rulesFollowed} onChange={(e) => setRulesFollowed(e.target.checked)} className="h-4 w-4 rounded accent-accent" />
                <span className="text-xs font-semibold text-soft">All trading rules followed</span>
              </label>
              {!rulesFollowed && (
                <FormField label="Violation Reason">
                  <input value={ruleBreakReason} onChange={(e) => setRuleBreakReason(e.target.value)} placeholder="What rule did you break?" className="input-field !border-loss/30" />
                </FormField>
              )}
            </div>

            <StepNav onPrev={() => setActiveStep(2)} onNext={() => setActiveStep(4)} />
          </div>
        )}

        {/* STEP 4: MINDSET & SCREENSHOTS */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <SectionHeader icon={<Brain className="h-4 w-4 text-accent" />} title="Psychology & Charts" desc="Emotion tags, journal notes, and chart attachments." />

            {/* Emotions */}
            <div>
              <span className="label">Emotion State</span>
              <div className="flex flex-wrap gap-1.5">
                {EMOTIONS.map((emo) => {
                  const isSelected = selectedEmotions.includes(emo);
                  return (
                    <button key={emo} type="button" onClick={() => toggleEmotion(emo)}
                      className={`badge transition-all cursor-pointer ${isSelected ? "badge-accent" : "badge-neutral hover:bg-overlay"}`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {emo}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mindset Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Before Entry">
                <textarea rows={3} value={mindsetBefore} onChange={(e) => setMindsetBefore(e.target.value)} placeholder="Mental state before entering..." className="input-field resize-none" />
              </FormField>
              <FormField label="During Trade">
                <textarea rows={3} value={mindsetDuring} onChange={(e) => setMindsetDuring(e.target.value)} placeholder="How did you feel while holding?" className="input-field resize-none" />
              </FormField>
              <FormField label="After Exit">
                <textarea rows={3} value={mindsetAfter} onChange={(e) => setMindsetAfter(e.target.value)} placeholder="Post-trade reflection..." className="input-field resize-none" />
              </FormField>
            </div>

            {/* Screenshots */}
            <div className="card-elevated p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold text-soft">Chart Screenshots</span>
              </div>
              <div className="flex gap-2">
                <input value={pastedUrl} onChange={(e) => setPastedUrl(e.target.value)} placeholder="Paste image URL..." className="input-field flex-1" />
                <button type="button" onClick={addScreenshot} className="btn-secondary shrink-0">Attach</button>
              </div>
              {screenshots.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {screenshots.map((sc) => (
                    <div key={sc.id} className="relative rounded-xl overflow-hidden aspect-video bg-base group shadow-[var(--shadow-card)]">
                      <img src={sc.url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setScreenshots(screenshots.filter((s) => s.id !== sc.id))}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-base/80 text-loss opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <button type="button" onClick={() => setActiveStep(3)} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button type="submit" className="btn-primary !py-3 !px-8 !text-sm">
                <Check className="h-4 w-4" /> Save Trade
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

/* ── Helper Components ── */

function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="pb-3">
      <h2 className="text-sm font-semibold text-clean flex items-center gap-2">{icon} {title}</h2>
      <p className="text-[11px] text-dim mt-0.5">{desc}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

function StepNav({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  return (
    <div className="flex justify-between pt-3">
      {onPrev ? (
        <button type="button" onClick={onPrev} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      ) : <div />}
      {onNext && (
        <button type="button" onClick={onNext} className="btn-primary">
          Next <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
