"use client";

import { useState, useEffect, useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Brain,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
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
} from "@/types";
import { createTrade, TradeFormState } from "@/lib/actions/trade-actions";
import { ScreenshotPaste } from "./screenshot-paste";
import { StrategySelector, StrategyOption } from "./strategy-selector";
import { getActiveStrategies } from "@/lib/actions/strategy-actions";

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

const INDIAN_MARKETS = ["Nifty Options", "BankNifty Options", "Sensex Options", "Stock Options"];

const initialState: TradeFormState = { success: false, message: "" };

function formatPnlValue(value: number, isIndian: boolean): string {
  const sym = isIndian ? "₹" : "$";
  const abs = Math.abs(value);
  const formatted = isIndian
    ? abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${value >= 0 ? "+" : "-"}${sym}${formatted}`;
}

export function TradeForm() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [state, formAction, isPending] = useActionState(createTrade, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [market, setMarket] = useState<MarketType>("Nifty Options");
  const [instrument, setInstrument] = useState("");
  const [session, setSession] = useState<SessionType>("Asian");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [setup, setSetup] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [bias, setBias] = useState<TradeBias>("BULLISH");

  const [plannedEntry, setPlannedEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [expectedRR, setExpectedRR] = useState(0);

  const isOptionsMode = market.includes("Options");
  const [optionAction, setOptionAction] = useState<"BUY" | "SELL">("BUY");
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE");
  const [strikePrice, setStrikePrice] = useState("");
  const [spotPrice, setSpotPrice] = useState("");
  const [optionExpiry, setOptionExpiry] = useState<"WEEKLY" | "MONTHLY" | "0DTE">("WEEKLY");
  const [lotSize, setLotSize] = useState(65);
  const [numberOfLots, setNumberOfLots] = useState("1");
  const [optionPoints, setOptionPoints] = useState(0);

  const [actualEntry, setActualEntry] = useState("");
  const [actualExit, setActualExit] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [riskPercent, setRiskPercent] = useState("0");
  const [actualRR, setActualRR] = useState(0);
  const [isLateEntry, setIsLateEntry] = useState(false);
  const [isEarlyEntry, setIsEarlyEntry] = useState(false);
  const [slippage, setSlippage] = useState("0");

  const [outcome, setOutcome] = useState<TradeOutcome>("WIN");
  const [exitReason, setExitReason] = useState<ExitReason>("TARGET_HIT");
  const [pnl, setPnl] = useState("");
  const [rulesFollowed, setRulesFollowed] = useState(true);
  const [ruleBreakReason, setRuleBreakReason] = useState("");

  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>([]);
  const [mindsetBefore, setMindsetBefore] = useState("");
  const [mindsetDuring, setMindsetDuring] = useState("");
  const [mindsetAfter, setMindsetAfter] = useState("");

  type ScreenshotItem = { id: string; dataUrl: string; stage: string };
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const addScreenshot = useCallback((ss: ScreenshotItem) => {
    setScreenshots((prev) => [...prev, ss]);
  }, []);
  const removeScreenshot = useCallback((id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const isLong = isOptionsMode ? optionAction === "BUY" : bias !== "BEARISH";
  const isIndianMarket = INDIAN_MARKETS.includes(market);
  const currency = isIndianMarket ? "₹" : "$";
  const parsedPnl = parseFloat(pnl) || 0;

  const instrumentPlaceholder = isOptionsMode
    ? "Auto-generated"
    : market === "Forex"
    ? "e.g. EURUSD, GBPJPY"
    : market === "Gold"
    ? "e.g. XAUUSD"
    : market === "Silver"
    ? "e.g. XAGUSD"
    : market === "Crypto"
    ? "e.g. BTCUSDT, ETHUSDT"
    : market === "Stocks"
    ? "e.g. RELIANCE, TCS"
    : "e.g. NIFTY FUT";

  const positionPlaceholder = isOptionsMode
    ? "Auto from lots"
    : market === "Forex"
    ? "Lots (e.g. 0.10)"
    : market === "Crypto"
    ? "Qty (e.g. 0.5)"
    : market === "Gold" || market === "Silver"
    ? "Lots (e.g. 1.0)"
    : "Shares (e.g. 100)";

  useEffect(() => {
    getActiveStrategies().then(setStrategies);
  }, []);

  useEffect(() => {
    if (market === "Nifty Options") {
      setLotSize(65);
      setStrikePrice((prev) => (!prev || prev === "52000" || prev === "80000") ? "24500" : prev);
    } else if (market === "BankNifty Options") {
      setLotSize(15);
      setStrikePrice((prev) => (!prev || prev === "24500" || prev === "80000") ? "52000" : prev);
    } else if (market === "Sensex Options") {
      setLotSize(10);
      setStrikePrice((prev) => (!prev || prev === "24500" || prev === "52000") ? "80000" : prev);
    }
  }, [market]);

  useEffect(() => {
    if (isOptionsMode) {
      const prefix = market.split(" ")[0].toUpperCase();
      setInstrument(`${prefix} ${strikePrice || ""} ${optionType}`);
    }
  }, [market, strikePrice, optionType, isOptionsMode]);

  useEffect(() => {
    if (isOptionsMode) {
      const lots = parseInt(numberOfLots) || 1;
      setPositionSize(String(lots * lotSize));
    }
  }, [numberOfLots, lotSize, isOptionsMode]);

  useEffect(() => {
    const e = parseFloat(plannedEntry);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(target);
    if (!isNaN(e) && !isNaN(sl) && !isNaN(tp) && e !== sl) {
      setExpectedRR(parseFloat((Math.abs(tp - e) / Math.abs(e - sl)).toFixed(2)));
    }
  }, [plannedEntry, stopLoss, target]);

  useEffect(() => {
    const entry = parseFloat(actualEntry);
    const sl = parseFloat(stopLoss);
    const exit = parseFloat(actualExit);
    const qty = parseFloat(positionSize) || 1;

    if (!isNaN(entry) && !isNaN(sl) && entry > 0) {
      setRiskPercent(((Math.abs(entry - sl) / entry) * 100).toFixed(2));
    }

    if (!isNaN(entry) && !isNaN(sl) && !isNaN(exit) && entry !== sl) {
      const risk = Math.abs(entry - sl);
      if (risk > 0) {
        if (outcome === "LOSS") {
          const loss = Math.abs(entry - exit);
          setActualRR(parseFloat((-Math.max(loss, risk) / risk).toFixed(2)));
        } else if (outcome === "BREAKEVEN") {
          setActualRR(0);
        } else {
          const reward = Math.abs(exit - entry);
          setActualRR(parseFloat((reward / risk).toFixed(2)));
        }
      }
    }

    if (!isNaN(entry) && !isNaN(exit)) {
      const points = isLong ? exit - entry : entry - exit;
      if (isOptionsMode) {
        setOptionPoints(parseFloat(points.toFixed(2)));
      }
      setPnl((points * qty).toFixed(2));
    }
  }, [actualEntry, stopLoss, actualExit, outcome, isLong, positionSize, isOptionsMode]);

  useEffect(() => {
    if (state?.success) {
      router.push("/trades");
    } else if (state?.message && !state.success) {
      setIsSubmitting(false);
    }
  }, [state, router]);

  const handleStepChange = (newStep: number) => {
    let entryVal = actualEntry;
    let exitVal = actualExit;

    if (newStep >= 2) {
      if (!entryVal && plannedEntry) {
        setActualEntry(plannedEntry);
        entryVal = plannedEntry;
      }
      if (!exitVal && target) {
        setActualExit(target);
        exitVal = target;
      }
    }

    if (newStep >= 3) {
      const entry = parseFloat(entryVal);
      const exit = parseFloat(exitVal);
      const sl = parseFloat(stopLoss);
      const tp = parseFloat(target);

      if (!isNaN(entry) && !isNaN(exit)) {
        const directedPnl = isLong ? exit - entry : entry - exit;
        const threshold = entry * 0.003;

        if (directedPnl > threshold) setOutcome("WIN");
        else if (directedPnl < -threshold) setOutcome("LOSS");
        else setOutcome("BREAKEVEN");

        if (!isNaN(tp) && !isNaN(sl)) {
          const targetDist = Math.abs(exit - tp);
          const slDist = Math.abs(exit - sl);
          const targetRange = Math.abs(tp - entry) || 1;
          const slRange = Math.abs(entry - sl) || 1;

          if (targetDist / targetRange < 0.1) setExitReason("TARGET_HIT");
          else if (slDist / slRange < 0.1) setExitReason("STOP_HIT");
          else setExitReason("MANUAL_EXIT");
        }
      }
    }

    setActiveStep(newStep);
  };

  const handleMarketChange = (newMarket: MarketType) => {
    const wasOptions = market.includes("Options");
    const isNowOptions = newMarket.includes("Options");
    setMarket(newMarket);
    if (wasOptions && !isNowOptions) {
      setInstrument("");
    }
  };

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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <Plus className="h-5 w-5 text-accent" /> Log New Trade
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Complete the 4-phase journal in under 60 seconds.
        </p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isCurrent = activeStep === s.step;
          const isDone = activeStep > s.step;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => handleStepChange(s.step)}
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

      {state?.message && !state.success && (
        <div className="card p-3 bg-loss/10 border border-loss/30 text-loss text-xs rounded-xl font-medium">
          {state.message}
        </div>
      )}

      <form
        action={async (formData) => {
          if (isSubmitting || isPending) return;
          setIsSubmitting(true);
          await formAction(formData);
        }}
        className="card p-4 sm:p-6 space-y-6"
      >
        <input type="hidden" name="market" value={market} />
        <input type="hidden" name="instrument" value={instrument} />
        <input type="hidden" name="session" value={session} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="setup" value={setup} />
        <input type="hidden" name="strategyId" value={strategyId} />
        <input type="hidden" name="bias" value={bias} />
        <input type="hidden" name="plannedEntry" value={plannedEntry} />
        <input type="hidden" name="stopLoss" value={stopLoss} />
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="expectedRR" value={expectedRR} />
        <input type="hidden" name="actualEntry" value={actualEntry} />
        <input type="hidden" name="actualExit" value={actualExit} />
        <input type="hidden" name="entryTime" value={entryTime} />
        <input type="hidden" name="exitTime" value={exitTime} />
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
        <input type="hidden" name="optionAction" value={optionAction} />
        <input type="hidden" name="optionType" value={optionType} />
        <input type="hidden" name="strikePrice" value={strikePrice} />
        <input type="hidden" name="spotPrice" value={spotPrice} />
        <input type="hidden" name="optionExpiry" value={optionExpiry} />
        <input type="hidden" name="lotSize" value={lotSize} />
        <input type="hidden" name="numberOfLots" value={numberOfLots} />
        <input type="hidden" name="optionPoints" value={isOptionsMode ? optionPoints : ""} />
        <input type="hidden" name="screenshots" value={JSON.stringify(screenshots.map((s) => ({ dataUrl: s.dataUrl, stage: s.stage })))} />

        {activeStep === 1 && (
          <div className="page-enter space-y-5">
            <SectionHeader
              icon={<Target className="h-4 w-4 text-accent" />}
              title="Trade Setup & Plan"
              desc="Market segment, options strike selection, bias, and levels."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField label="Market Segment">
                <select
                  value={market}
                  onChange={(e) => handleMarketChange(e.target.value as MarketType)}
                  className="input-field font-semibold"
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
                  placeholder={instrumentPlaceholder}
                  className="input-field font-mono uppercase font-bold text-accent"
                  readOnly={isOptionsMode}
                />
              </FormField>

              <FormField label="Session">
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as SessionType)}
                  className="input-field"
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
                <StrategySelector
                  strategies={strategies}
                  value={setup}
                  strategyId={strategyId}
                  onSetupChange={setSetup}
                  onStrategyIdChange={setStrategyId}
                />
              </FormField>

              <FormField label="Market Bias">
                <div className="grid grid-cols-3 gap-1.5">
                  {(["BULLISH", "BEARISH", "NEUTRAL"] as TradeBias[]).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBias(b)}
                      className={`py-2 rounded-lg text-[11px] font-bold transition-all border ${
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

            {isOptionsMode && (
              <div className="card-glow p-4 sm:p-5 rounded-2xl space-y-4 border border-accent/20">
                <div className="flex items-center justify-between">
                  <span className="badge badge-accent flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Options Contract Setup
                  </span>
                  <span className="text-[11px] font-mono text-dim">
                    Qty: <strong className="text-clean">{(parseInt(numberOfLots) || 0) * lotSize}</strong> ({numberOfLots} × {lotSize})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FormField label="Option Action">
                    <div className="grid grid-cols-2 gap-1 bg-surface p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOptionAction("BUY")}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          optionAction === "SELL"
                            ? "bg-loss text-white shadow"
                            : "text-dim hover:text-clean"
                        }`}
                      >
                        Option Sell
                      </button>
                    </div>
                  </FormField>

                  <FormField label="Option Type">
                    <div className="grid grid-cols-2 gap-1 bg-surface p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOptionType("CE")}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          optionType === "PE"
                            ? "bg-warn text-white shadow"
                            : "text-dim hover:text-clean"
                        }`}
                      >
                        PUT (PE)
                      </button>
                    </div>
                  </FormField>

                  <FormField label="Strike Price">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="50"
                        value={strikePrice}
                        onChange={(e) => setStrikePrice(e.target.value)}
                        placeholder="e.g. 24500"
                        className="input-field font-mono font-bold text-clean flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => adjustStrike(-50)}
                        className="px-2 py-2 rounded-lg bg-elevated text-xs font-bold text-muted hover:text-clean"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustStrike(50)}
                        className="px-2 py-2 rounded-lg bg-elevated text-xs font-bold text-muted hover:text-clean"
                      >
                        +50
                      </button>
                    </div>
                  </FormField>

                  <FormField label="Option Expiry">
                    <select
                      value={optionExpiry}
                      onChange={(e) => setOptionExpiry(e.target.value as "WEEKLY" | "MONTHLY" | "0DTE")}
                      className="input-field font-semibold"
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
                    <div className="space-y-1.5">
                      <input
                        type="number"
                        value={lotSize}
                        onChange={(e) => setLotSize(parseInt(e.target.value) || 1)}
                        className="input-field font-mono font-bold text-clean"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-dim pr-1">Presets:</span>
                        {[65, 25, 15, 10].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setLotSize(preset)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                              lotSize === preset
                                ? "bg-accent text-white"
                                : "bg-elevated text-dim hover:text-clean"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </FormField>
                </div>
              </div>
            )}

            <div className="card-elevated p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label={isOptionsMode ? "Planned Premium" : "Planned Entry"}>
                <input
                  type="number"
                  step="any"
                  value={plannedEntry}
                  onChange={(e) => setPlannedEntry(e.target.value)}
                  placeholder="Entry price"
                  className="input-field font-mono"
                />
              </FormField>
              <FormField label="Stop Loss">
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="SL price"
                  className="input-field font-mono text-loss!"
                />
              </FormField>
              <FormField label="Target">
                <input
                  type="number"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="TP price"
                  className="input-field font-mono text-profit!"
                />
              </FormField>
              <FormField label="Expected RR">
                <div className="h-10.5 rounded-xl bg-accent-muted border border-accent/20 flex items-center justify-center font-mono font-bold text-accent text-sm">
                  {expectedRR > 0 ? `1:${expectedRR}R` : "—"}
                </div>
              </FormField>
            </div>

            <StepNav onNext={() => handleStepChange(2)} />
          </div>
        )}

        {activeStep === 2 && (
          <div className="page-enter space-y-5">
            <SectionHeader
              icon={<TrendingUp className="h-4 w-4 text-accent" />}
              title="Trade Execution"
              desc="Actual entry & exit, position sizing, and execution quality."
            />

            <ContextStrip
              items={[
                { label: "Symbol", value: instrument.toUpperCase() },
                { label: "Bias", value: bias, color: bias === "BULLISH" ? "text-profit" : bias === "BEARISH" ? "text-loss" : "text-soft" },
                { label: "Plan", value: plannedEntry },
                { label: "SL", value: stopLoss, color: "text-loss" },
                { label: "TP", value: target, color: "text-profit" },
                { label: "RR", value: expectedRR > 0 ? `1:${expectedRR}` : "", color: "text-accent" },
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FormField label={isOptionsMode ? "Entry Premium" : "Actual Entry"}>
                <input
                  type="number"
                  step="any"
                  value={actualEntry}
                  onChange={(e) => setActualEntry(e.target.value)}
                  placeholder="Entry price"
                  className="input-field font-mono"
                />
              </FormField>
              <FormField label={isOptionsMode ? "Exit Premium" : "Actual Exit"}>
                <input
                  type="number"
                  step="any"
                  value={actualExit}
                  onChange={(e) => setActualExit(e.target.value)}
                  placeholder="Exit price"
                  className="input-field font-mono"
                />
              </FormField>
              <FormField label="Entry Time">
                <input
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </FormField>
              <FormField label="Exit Time">
                <input
                  type="time"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </FormField>
              <FormField label={isOptionsMode ? "Total Qty (Units)" : "Position Size"}>
                <input
                  type="number"
                  step="any"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  placeholder={positionPlaceholder}
                  className="input-field font-mono"
                  readOnly={isOptionsMode}
                />
              </FormField>
            </div>

            <div className="card-glow p-4 rounded-xl">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                  Live Metrics
                </span>
              </div>
              <div className={`grid gap-3 ${isOptionsMode ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                <MetricCell
                  label="Risk Exposure"
                  value={parseFloat(riskPercent) > 0 ? `${riskPercent}%` : "—"}
                  color="text-warn"
                />
                <MetricCell
                  label="Actual RR"
                  value={actualRR !== 0 ? `${actualRR}R` : "—"}
                  color={actualRR >= 0 ? "text-accent" : "text-loss"}
                />
                {isOptionsMode && (
                  <MetricCell
                    label="Points Captured"
                    value={optionPoints !== 0 ? `${optionPoints >= 0 ? "+" : ""}${optionPoints} pts` : "—"}
                    color={optionPoints >= 0 ? "text-profit" : "text-loss"}
                  />
                )}
                <MetricCell
                  label={`Est. P&L (${currency})`}
                  value={parsedPnl !== 0 ? formatPnlValue(parsedPnl, isIndianMarket) : "—"}
                  color={parsedPnl >= 0 ? "text-profit" : "text-loss"}
                />
              </div>
            </div>

            <div className="card-elevated p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-overlay/30 transition-colors">
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
              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-overlay/30 transition-colors">
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

            <ScreenshotPaste
              screenshots={screenshots}
              onAdd={addScreenshot}
              onRemove={removeScreenshot}
              isOptions={isOptionsMode}
            />

            <StepNav onPrev={() => handleStepChange(1)} onNext={() => handleStepChange(3)} />
          </div>
        )}

        {activeStep === 3 && (
          <div className="page-enter space-y-5">
            <SectionHeader
              icon={<CheckCircle2 className="h-4 w-4 text-accent" />}
              title="Trade Result & Compliance"
              desc="Outcome, P&L, and rule adherence."
            />

            <ContextStrip
              items={[
                { label: "Entry", value: actualEntry },
                { label: "→ Exit", value: actualExit },
                { label: "Qty", value: positionSize },
                { label: "RR", value: actualRR !== 0 ? `${actualRR}R` : "", color: "text-accent" },
              ]}
            />

            <div className="grid grid-cols-3 gap-2">
              {(["WIN", "LOSS", "BREAKEVEN"] as TradeOutcome[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border ${
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
                  className="input-field"
                >
                  <option value="TARGET_HIT">Target Hit (TP)</option>
                  <option value="STOP_HIT">Stop Loss Hit (SL)</option>
                  <option value="MANUAL_EXIT">Manual Discretionary Exit</option>
                </select>
              </FormField>

              <FormField label={`Net P&L (${currency})`}>
                <input
                  type="number"
                  step="any"
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                  placeholder="Auto-calculated"
                  className={`input-field font-mono font-bold text-sm ${
                    parsedPnl >= 0 ? "text-profit!" : "text-loss!"
                  }`}
                />
              </FormField>
            </div>

            <div className={`grid gap-3 ${isOptionsMode ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
              <ResultCard
                label="R-Multiple"
                value={actualRR !== 0 ? `${actualRR}R` : "—"}
                color={actualRR >= 0 ? "text-profit" : "text-loss"}
              />
              <ResultCard
                label="Risk Exposure"
                value={parseFloat(riskPercent) > 0 ? `${riskPercent}%` : "—"}
                color="text-warn"
              />
              {isOptionsMode && (
                <ResultCard
                  label="Points Captured"
                  value={optionPoints !== 0 ? `${optionPoints >= 0 ? "+" : ""}${optionPoints} pts` : "—"}
                  color={optionPoints >= 0 ? "text-profit" : "text-loss"}
                />
              )}
            </div>

            <div className="card-elevated p-4 rounded-xl space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-xs font-semibold text-clean">Followed Trading Rules?</span>
                <button
                  type="button"
                  onClick={() => setRulesFollowed(!rulesFollowed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                    className="input-field text-loss!"
                  />
                </FormField>
              )}
            </div>

            <StepNav onPrev={() => handleStepChange(2)} onNext={() => handleStepChange(4)} />
          </div>
        )}

        {activeStep === 4 && (
          <div className="page-enter space-y-5">
            <SectionHeader
              icon={<Brain className="h-4 w-4 text-accent" />}
              title="Psychology & Journal"
              desc="Emotional state and trade execution notes."
            />

            <ContextStrip
              items={[
                { label: "Result", value: outcome, color: outcome === "WIN" ? "text-profit" : outcome === "LOSS" ? "text-loss" : "text-soft" },
                { label: "P&L", value: pnl ? formatPnlValue(parsedPnl, isIndianMarket) : "", color: parsedPnl >= 0 ? "text-profit" : "text-loss" },
                { label: "Exit", value: exitReason.replace(/_/g, " ") },
                { label: "Rules", value: rulesFollowed ? "✓ Followed" : "✗ Violated", color: rulesFollowed ? "text-profit" : "text-loss" },
              ]}
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
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

            <div className="pt-4 flex items-center justify-between border-t border-border/20">
              <button
                type="button"
                onClick={() => handleStepChange(3)}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="submit"
                disabled={isPending || isSubmitting}
                className="btn-primary text-xs flex items-center gap-1.5 px-6! disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                {isPending || isSubmitting ? "Saving Trade..." : "Save Trade to Journal"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

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
          className="btn-secondary text-xs flex items-center gap-1.5"
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
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          Next <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ContextStrip({ items }: { items: { label: string; value: string; color?: string }[] }) {
  const filtered = items.filter((i) => i.value);
  if (filtered.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-2.5 rounded-xl bg-surface border border-border text-[11px]">
      {filtered.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-dim font-medium">{item.label}</span>
          <span className={`font-mono font-bold ${item.color || "text-clean"}`}>{item.value}</span>
        </span>
      ))}
    </div>
  );
}

function MetricCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase font-bold text-dim tracking-wider block">{label}</span>
      <span className={`text-base font-mono font-bold mt-0.5 block ${color}`}>{value}</span>
    </div>
  );
}

function ResultCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-elevated rounded-xl p-3 text-center border border-border">
      <span className="text-[10px] uppercase font-bold text-dim tracking-wider block">{label}</span>
      <span className={`text-lg font-mono font-bold mt-1 block ${color}`}>{value}</span>
    </div>
  );
}
