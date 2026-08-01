"use client";

import { useState, useEffect, useActionState } from "react";
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
  Layers,
  Sparkles,
} from "lucide-react";
import {
  MarketType,
  SessionType,
  TradeOutcome,
  ExitReason,
  TradeBias,
  EmotionType,
  ScreenshotStage,
} from "@/types";
import { createTrade, TradeFormState } from "@/lib/actions/trade-actions";

const MARKETS: MarketType[] = [
  "Nifty Options",
  "BankNifty Options",
  "Sensex Options",
  "Stock Options",
  "Crypto Options",
  "Forex",
  "Gold",
  "Silver",
  "Crypto",
  "Stocks",
  "Futures",
];

const SESSIONS: SessionType[] = ["London", "New York", "Asian", "London/NY Overlap"];
const EMOTIONS: EmotionType[] = [
  "Calm",
  "Fear",
  "Greed",
  "Revenge",
  "FOMO",
  "Overconfidence",
  "Anxiety",
  "Hesitation",
  "Frustration",
];

const STEPS = [
  { step: 1, label: "Plan", icon: Target },
  { step: 2, label: "Execution", icon: TrendingUp },
  { step: 3, label: "Result", icon: CheckCircle2 },
  { step: 4, label: "Mindset", icon: Brain },
];

const initialState: TradeFormState = {
  success: false,
  message: "",
};

export function TradeForm() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [state, formAction, isPending] = useActionState(createTrade, initialState);

  // Plan State
  const [market, setMarket] = useState<MarketType>("Nifty Options");
  const [instrument, setInstrument] = useState("NIFTY 24500 CE");
  const [session, setSession] = useState<SessionType>("Asian");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [setup, setSetup] = useState("Break & Retest + FVG");
  const [bias, setBias] = useState<TradeBias>("BULLISH");
  const [plannedEntry, setPlannedEntry] = useState("150.00");
  const [stopLoss, setStopLoss] = useState("120.00");
  const [target, setTarget] = useState("210.00");
  const [expectedRR, setExpectedRR] = useState(2.0);

  // Options Trading Specific State
  const isOptionsMode = market.includes("Options");
  const [optionAction, setOptionAction] = useState<"BUY" | "SELL">("BUY");
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE");
  const [strikePrice, setStrikePrice] = useState("24500");
  const [spotPrice, setSpotPrice] = useState("24520");
  const [optionExpiry, setOptionExpiry] = useState<"WEEKLY" | "MONTHLY" | "0DTE">("WEEKLY");
  const [lotSize, setLotSize] = useState(25); // Default Nifty lot size
  const [numberOfLots, setNumberOfLots] = useState("2");
  const [optionPoints, setOptionPoints] = useState(0);

  // Execution State
  const [actualEntry, setActualEntry] = useState("150.00");
  const [actualExit, setActualExit] = useState("210.00");
  const [positionSize, setPositionSize] = useState("50");
  const [riskPercent, setRiskPercent] = useState("1.0");
  const [actualRR, setActualRR] = useState(2.0);
  const [isLateEntry, setIsLateEntry] = useState(false);
  const [isEarlyEntry, setIsEarlyEntry] = useState(false);
  const [slippage, setSlippage] = useState("0.0");

  // Result State
  const [outcome, setOutcome] = useState<TradeOutcome>("WIN");
  const [exitReason, setExitReason] = useState<ExitReason>("TARGET_HIT");
  const [pnl, setPnl] = useState("3000.00");
  const [rulesFollowed, setRulesFollowed] = useState(true);
  const [ruleBreakReason, setRuleBreakReason] = useState("");

  // Mindset State
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>(["Calm"]);
  const [mindsetBefore, setMindsetBefore] = useState("");
  const [mindsetDuring, setMindsetDuring] = useState("");
  const [mindsetAfter, setMindsetAfter] = useState("");

  // Auto-fill lot sizes and format instrument when Options Market or Strikes change
  useEffect(() => {
    if (market === "Nifty Options") {
      setLotSize(25);
      if (!strikePrice || strikePrice === "52000" || strikePrice === "80000") setStrikePrice("24500");
    } else if (market === "BankNifty Options") {
      setLotSize(15);
      if (!strikePrice || strikePrice === "24500" || strikePrice === "80000") setStrikePrice("52000");
    } else if (market === "Sensex Options") {
      setLotSize(10);
      if (!strikePrice || strikePrice === "24500" || strikePrice === "52000") setStrikePrice("80000");
    }
  }, [market]);

  useEffect(() => {
    if (isOptionsMode) {
      const prefix = market.split(" ")[0].toUpperCase();
      setInstrument(`${prefix} ${strikePrice || ""} ${optionType}`);
    }
  }, [market, strikePrice, optionType, isOptionsMode]);

  // Sync position size with (Lots * LotSize) in Options mode
  useEffect(() => {
    if (isOptionsMode) {
      const lots = parseInt(numberOfLots) || 1;
      const totalQty = lots * lotSize;
      setPositionSize(String(totalQty));
    }
  }, [numberOfLots, lotSize, isOptionsMode]);

  // Auto-calculate RR, Options Points, and Total PnL
  useEffect(() => {
    const e = parseFloat(plannedEntry),
      sl = parseFloat(stopLoss),
      tp = parseFloat(target);
    if (!isNaN(e) && !isNaN(sl) && !isNaN(tp) && e !== sl) {
      setExpectedRR(parseFloat((Math.abs(tp - e) / Math.abs(e - sl)).toFixed(2)));
    }
  }, [plannedEntry, stopLoss, target]);

  useEffect(() => {
    const e = parseFloat(actualEntry),
      sl = parseFloat(stopLoss),
      ex = parseFloat(actualExit);
    if (!isNaN(e) && !isNaN(sl) && !isNaN(ex) && e !== sl) {
      const risk = Math.abs(e - sl);
      const reward = outcome === "LOSS" ? -risk : Math.abs(ex - e);
      setActualRR(parseFloat((reward / risk).toFixed(2)));
    }

    // Options Points Calculation
    if (!isNaN(e) && !isNaN(ex)) {
      const points = optionAction === "BUY" ? ex - e : e - ex;
      setOptionPoints(parseFloat(points.toFixed(2)));

      // Auto-calculate PnL
      const qty = parseFloat(positionSize) || 1;
      const calculatedPnl = (points * qty).toFixed(2);
      setPnl(calculatedPnl);
    }
  }, [actualEntry, stopLoss, actualExit, outcome, optionAction, positionSize]);

  // Redirect on successful trade creation
  useEffect(() => {
    if (state?.success) {
      router.push("/trades");
    }
  }, [state, router]);

  const toggleEmotion = (emo: EmotionType) => {
    setSelectedEmotions((prev) =>
      prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]
    );
  };

  const adjustStrike = (delta: number) => {
    const current = parseInt(strikePrice) || 0;
    setStrikePrice(String(current + delta));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <Plus className="h-5 w-5 text-accent" /> Log New Trade
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Complete the 4-phase journal in under 60 seconds.
        </p>
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap cursor-pointer ${
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

      {/* Action Error Message */}
      {state?.message && !state.success && (
        <div className="card p-3 bg-loss/10 border border-loss/30 text-loss text-xs rounded-xl font-medium">
          {state.message}
        </div>
      )}

      <form action={formAction} className="card p-4 sm:p-6 space-y-6">
        {/* Hidden Form Controls for Server Action */}
        <input type="hidden" name="market" value={market} />
        <input type="hidden" name="instrument" value={instrument} />
        <input type="hidden" name="session" value={session} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="setup" value={setup} />
        <input type="hidden" name="bias" value={bias} />
        <input type="hidden" name="plannedEntry" value={plannedEntry} />
        <input type="hidden" name="stopLoss" value={stopLoss} />
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="expectedRR" value={expectedRR} />

        <input type="hidden" name="actualEntry" value={actualEntry} />
        <input type="hidden" name="actualExit" value={actualExit} />
        <input type="hidden" name="positionSize" value={positionSize} />
        <input type="hidden" name="riskPercent" value={riskPercent} />
        <input type="hidden" name="actualRR" value={actualRR} />
        <input type="hidden" name="isLateEntry" value={String(isLateEntry)} />
        <input type="hidden" name="isEarlyEntry" value={String(isEarlyEntry)} />
        <input type="hidden" name="slippage" value={slippage} />

        <input type="hidden" name="outcome" value={outcome} />
        <input type="hidden" name="exitReason" value={exitReason} />
        <input type="hidden" name="pnl" value={pnl} />
        <input type="hidden" name="rMultiple" value={actualRR} />
        <input type="hidden" name="rulesFollowed" value={String(rulesFollowed)} />
        <input type="hidden" name="ruleBreakReason" value={ruleBreakReason} />

        <input type="hidden" name="mindsetBefore" value={mindsetBefore} />
        <input type="hidden" name="mindsetDuring" value={mindsetDuring} />
        <input type="hidden" name="mindsetAfter" value={mindsetAfter} />
        <input type="hidden" name="emotions" value={selectedEmotions.join(",")} />

        {/* Options Specific Hidden Inputs */}
        <input type="hidden" name="optionAction" value={optionAction} />
        <input type="hidden" name="optionType" value={optionType} />
        <input type="hidden" name="strikePrice" value={strikePrice} />
        <input type="hidden" name="spotPrice" value={spotPrice} />
        <input type="hidden" name="optionExpiry" value={optionExpiry} />
        <input type="hidden" name="lotSize" value={lotSize} />
        <input type="hidden" name="numberOfLots" value={numberOfLots} />
        <input type="hidden" name="optionPoints" value={optionPoints} />

        {/* STEP 1: PLAN */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <SectionHeader
              icon={<Target className="h-4 w-4 text-accent" />}
              title="Trade Setup & Plan"
              desc="Market segment, options strike selection, bias, and levels."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Market Segment">
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value as MarketType)}
                  className="input-field font-semibold cursor-pointer"
                >
                  {MARKETS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Instrument Symbol">
                <input
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  placeholder="e.g. NIFTY 24500 CE"
                  className="input-field font-mono uppercase font-bold text-accent"
                />
              </FormField>

              <FormField label="Session">
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as SessionType)}
                  className="input-field cursor-pointer"
                >
                  {SESSIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              </FormField>

              <FormField label="Strategy Setup">
                <input
                  value={setup}
                  onChange={(e) => setSetup(e.target.value)}
                  placeholder="e.g. Order Block + FVG"
                  className="input-field"
                />
              </FormField>

              <FormField label="Market Bias">
                <div className="grid grid-cols-3 gap-1.5">
                  {(["BULLISH", "BEARISH", "NEUTRAL"] as TradeBias[]).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBias(b)}
                      className={`py-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        bias === b
                          ? b === "BULLISH"
                            ? "bg-profit/15 text-profit border-profit/30"
                            : b === "BEARISH"
                            ? "bg-loss/15 text-loss border-loss/30"
                            : "bg-elevated text-soft border-border-hover"
                          : "bg-surface text-dim hover:bg-elevated"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>

            {/* ── Dynamic Options Control Panel ── */}
            {isOptionsMode && (
              <div className="card-glow p-4 sm:p-5 rounded-2xl space-y-4 border border-accent/20">
                <div className="flex items-center justify-between">
                  <span className="badge badge-accent flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Options Contract Setup
                  </span>
                  <span className="text-[11px] font-mono text-dim">
                    Qty: <strong className="text-clean">{parseInt(numberOfLots) * lotSize || 0}</strong> ({numberOfLots} lots × {lotSize})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Option Buy / Sell */}
                  <FormField label="Option Action">
                    <div className="grid grid-cols-2 gap-1 bg-surface p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOptionAction("BUY")}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          optionAction === "BUY"
                            ? "bg-profit text-white shadow"
                            : "text-dim hover:text-clean"
                        }`}
                      >
                        Option Buy
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptionAction("SELL")}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          optionAction === "SELL"
                            ? "bg-loss text-white shadow"
                            : "text-dim hover:text-clean"
                        }`}
                      >
                        Option Sell
                      </button>
                    </div>
                  </FormField>

                  {/* Option Type CE / PE */}
                  <FormField label="Option Type">
                    <div className="grid grid-cols-2 gap-1 bg-surface p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOptionType("CE")}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          optionType === "CE"
                            ? "bg-accent text-white shadow"
                            : "text-dim hover:text-clean"
                        }`}
                      >
                        CALL (CE)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptionType("PE")}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          optionType === "PE"
                            ? "bg-warn text-white shadow"
                            : "text-dim hover:text-clean"
                        }`}
                      >
                        PUT (PE)
                      </button>
                    </div>
                  </FormField>

                  {/* Strike Price & Quick Step Buttons */}
                  <FormField label="Strike Price">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="50"
                        value={strikePrice}
                        onChange={(e) => setStrikePrice(e.target.value)}
                        className="input-field font-mono font-bold text-clean flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => adjustStrike(-50)}
                        className="px-2 py-2 rounded-lg bg-elevated text-xs font-bold text-muted hover:text-clean cursor-pointer"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustStrike(50)}
                        className="px-2 py-2 rounded-lg bg-elevated text-xs font-bold text-muted hover:text-clean cursor-pointer"
                      >
                        +50
                      </button>
                    </div>
                  </FormField>

                  {/* Expiry Type */}
                  <FormField label="Option Expiry">
                    <select
                      value={optionExpiry}
                      onChange={(e) => setOptionExpiry(e.target.value as any)}
                      className="input-field cursor-pointer font-semibold"
                    >
                      <option value="0DTE">0DTE (Expiry Day)</option>
                      <option value="WEEKLY">Weekly Expiry</option>
                      <option value="MONTHLY">Monthly Expiry</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <FormField label="Index / Spot Price">
                    <input
                      type="number"
                      step="any"
                      value={spotPrice}
                      onChange={(e) => setSpotPrice(e.target.value)}
                      placeholder="e.g. 24520"
                      className="input-field font-mono"
                    />
                  </FormField>
                  <FormField label="Number of Lots">
                    <input
                      type="number"
                      min="1"
                      value={numberOfLots}
                      onChange={(e) => setNumberOfLots(e.target.value)}
                      className="input-field font-mono"
                    />
                  </FormField>
                  <FormField label="Lot Size (Qty / Lot)">
                    <input
                      type="number"
                      value={lotSize}
                      onChange={(e) => setLotSize(parseInt(e.target.value) || 1)}
                      className="input-field font-mono"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Price Levels */}
            <div className="card-elevated p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label={isOptionsMode ? "Planned Premium" : "Planned Entry"}>
                <input
                  type="number"
                  step="any"
                  value={plannedEntry}
                  onChange={(e) => setPlannedEntry(e.target.value)}
                  className="input-field font-mono"
                />
              </FormField>
              <FormField label="Stop Loss">
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="input-field font-mono !text-loss"
                />
              </FormField>
              <FormField label="Target">
                <input
                  type="number"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="input-field font-mono !text-profit"
                />
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
            <SectionHeader
              icon={<TrendingUp className="h-4 w-4 text-accent" />}
              title="Trade Execution"
              desc="Entry & exit premium, option points captured, and sizing."
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label={isOptionsMode ? "Entry Premium" : "Actual Entry"}>
                <input
                  type="number"
                  step="any"
                  value={actualEntry}
                  onChange={(e) => setActualEntry(e.target.value)}
                  className="input-field font-mono"
                />
              </FormField>
              <FormField label={isOptionsMode ? "Exit Premium" : "Actual Exit"}>
                <input
                  type="number"
                  step="any"
                  value={actualExit}
                  onChange={(e) => setActualExit(e.target.value)}
                  className="input-field font-mono"
                />
              </FormField>
              <FormField label={isOptionsMode ? "Total Qty (Units)" : "Position Size"}>
                <input
                  type="number"
                  step="any"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  className="input-field font-mono"
                />
              </FormField>
              <FormField label="Risk %">
                <input
                  type="number"
                  step="any"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="input-field font-mono"
                />
              </FormField>
            </div>

            {/* Options Points Auto-Calculation Card */}
            {isOptionsMode && (
              <div className="card-glow p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-dim tracking-wider block">
                    Option Points Captured / Lost
                  </span>
                  <div className={`text-lg font-mono font-bold mt-0.5 ${optionPoints >= 0 ? "text-profit" : "text-loss"}`}>
                    {optionPoints >= 0 ? `+${optionPoints} pts` : `${optionPoints} pts`}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-dim tracking-wider block">
                    Auto Calculated PnL
                  </span>
                  <div className={`text-lg font-mono font-bold mt-0.5 ${parseFloat(pnl) >= 0 ? "text-profit" : "text-loss"}`}>
                    ${parseFloat(pnl).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="card-elevated p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-overlay/30 transition-colors">
                <input
                  type="checkbox"
                  checked={isLateEntry}
                  onChange={(e) => setIsLateEntry(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent"
                />
                <div>
                  <span className="text-xs font-semibold text-soft block">Late Entry</span>
                  <span className="text-[10px] text-dim">Chased after trigger</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-overlay/30 transition-colors">
                <input
                  type="checkbox"
                  checked={isEarlyEntry}
                  onChange={(e) => setIsEarlyEntry(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent"
                />
                <div>
                  <span className="text-xs font-semibold text-soft block">Early Entry</span>
                  <span className="text-[10px] text-dim">Before confirmation</span>
                </div>
              </label>
              <FormField label="Slippage (pts)">
                <input
                  type="number"
                  step="any"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>

            <StepNav onPrev={() => setActiveStep(1)} onNext={() => setActiveStep(3)} />
          </div>
        )}

        {/* STEP 3: RESULT */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <SectionHeader
              icon={<CheckCircle2 className="h-4 w-4 text-accent" />}
              title="Trade Result & Compliance"
              desc="Outcome, exit reason, PnL, and rule adherence."
            />

            <div className="grid grid-cols-3 gap-2">
              {(["WIN", "LOSS", "BREAKEVEN"] as TradeOutcome[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    outcome === o
                      ? o === "WIN"
                        ? "bg-profit/15 text-profit border-profit/30"
                        : o === "LOSS"
                        ? "bg-loss/15 text-loss border-loss/30"
                        : "bg-elevated text-soft border-border-hover"
                      : "bg-surface text-dim hover:bg-elevated"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Exit Reason">
                <select
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value as ExitReason)}
                  className="input-field cursor-pointer"
                >
                  <option value="TARGET_HIT">Target Hit (TP)</option>
                  <option value="STOP_HIT">Stop Loss Hit (SL)</option>
                  <option value="MANUAL_EXIT">Manual Discretionary Exit</option>
                </select>
              </FormField>

              <FormField label="Net PnL ($)">
                <input
                  type="number"
                  step="any"
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                  className={`input-field font-mono font-bold text-sm ${
                    parseFloat(pnl) >= 0 ? "!text-profit" : "!text-loss"
                  }`}
                />
              </FormField>
            </div>

            {/* Rule Compliance */}
            <div className="card-elevated p-4 rounded-xl space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-clean">Followed Trading Rules?</span>
                <button
                  type="button"
                  onClick={() => setRulesFollowed(!rulesFollowed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    rulesFollowed
                      ? "bg-profit/15 text-profit border border-profit/30"
                      : "bg-loss/15 text-loss border border-loss/30"
                  }`}
                >
                  {rulesFollowed ? "Yes (Disciplined)" : "No (Rule Violation)"}
                </button>
              </label>

              {!rulesFollowed && (
                <FormField label="Violation Reason">
                  <input
                    value={ruleBreakReason}
                    onChange={(e) => setRuleBreakReason(e.target.value)}
                    placeholder="e.g. Moved SL during trade, overleveraged"
                    className="input-field !text-loss"
                  />
                </FormField>
              )}
            </div>

            <StepNav onPrev={() => setActiveStep(2)} onNext={() => setActiveStep(4)} />
          </div>
        )}

        {/* STEP 4: MINDSET */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <SectionHeader
              icon={<Brain className="h-4 w-4 text-accent" />}
              title="Psychology & Journal"
              desc="Emotional state and trade execution notes."
            />

            <div>
              <label className="label">Emotions Experienced</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOTIONS.map((emo) => {
                  const isSelected = selectedEmotions.includes(emo);
                  return (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => toggleEmotion(emo)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-accent-muted text-accent border-accent/30"
                          : "bg-surface text-dim border-transparent hover:bg-elevated"
                      }`}
                    >
                      {emo}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Mindset Before Entry">
                <textarea
                  value={mindsetBefore}
                  onChange={(e) => setMindsetBefore(e.target.value)}
                  placeholder="State of mind entering..."
                  rows={3}
                  className="input-field resize-none text-xs"
                />
              </FormField>
              <FormField label="Mindset During Trade">
                <textarea
                  value={mindsetDuring}
                  onChange={(e) => setMindsetDuring(e.target.value)}
                  placeholder="How did you manage emotions..."
                  rows={3}
                  className="input-field resize-none text-xs"
                />
              </FormField>
              <FormField label="Mindset After Exit">
                <textarea
                  value={mindsetAfter}
                  onChange={(e) => setMindsetAfter(e.target.value)}
                  placeholder="Reflections post-trade..."
                  rows={3}
                  className="input-field resize-none text-xs"
                />
              </FormField>
            </div>

            {/* Final Submit Button */}
            <div className="pt-4 flex items-center justify-between border-t border-border/20">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 !px-6"
              >
                <Check className="h-4 w-4" />
                {isPending ? "Saving Trade..." : "Save Trade to Journal"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

/* Sub-components */

function SectionHeader({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-2.5 pb-2 border-b border-border/20">
      <div className="h-8 w-8 rounded-xl bg-accent-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-clean">{title}</h3>
        <p className="text-[11px] text-muted">{desc}</p>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="label mb-0!">{label}</label>
      {children}
    </div>
  );
}

function StepNav({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  return (
    <div className="pt-3 flex items-center justify-between border-t border-border/20">
      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
      ) : (
        <div />
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
        >
          Next <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
