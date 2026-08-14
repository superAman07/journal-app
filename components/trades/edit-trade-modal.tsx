"use client";

import { useState, useActionState, useEffect } from "react";
import { X, Check, ArrowLeft, ArrowRight, Target, TrendingUp, CheckCircle2, Brain, Sparkles } from "lucide-react";
import { MarketType, SessionType, TradeOutcome, ExitReason, TradeBias, EmotionType } from "@/types";
import { updateTrade, TradeFormState } from "@/lib/actions/trade-actions";
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

const initialState: TradeFormState = {
  success: false,
  message: "",
};

function formatPnlValue(value: number, isIndian: boolean): string {
  const sym = isIndian ? "₹" : "$";
  const abs = Math.abs(value);
  const formatted = isIndian
    ? abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${value >= 0 ? "+" : "-"}${sym}${formatted}`;
}

export function EditTradeModal({
  trade,
  onClose,
}: {
  trade: any;
  onClose: () => void;
}) {
  const [activeStep, setActiveStep] = useState(1);
  const updateActionWithId = updateTrade.bind(null, trade.id);
  const [state, formAction, isPending] = useActionState(updateActionWithId, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [market, setMarket] = useState<MarketType>(trade.market || "Nifty Options");
  const [instrument, setInstrument] = useState(trade.instrument || "");
  const [session, setSession] = useState<SessionType>(trade.session || "Asian");
  const [date, setDate] = useState(
    trade.date ? new Date(trade.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [setup, setSetup] = useState(trade.setup || "");
  const [strategyId, setStrategyId] = useState(trade.strategyId || "");
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [bias, setBias] = useState<TradeBias>(trade.bias || "BULLISH");

  useEffect(() => {
    getActiveStrategies().then(setStrategies);
  }, []);

  const [plannedEntry, setPlannedEntry] = useState(trade.plannedEntry ? String(trade.plannedEntry) : "");
  const [stopLoss, setStopLoss] = useState(trade.stopLoss ? String(trade.stopLoss) : "");
  const [target, setTarget] = useState(trade.target ? String(trade.target) : "");
  const [expectedRR, setExpectedRR] = useState(trade.expectedRR || 0);

  const isOptionsMode = market.includes("Options");
  const [optionAction, setOptionAction] = useState<"BUY" | "SELL">(trade.optionAction || "BUY");
  const [optionType, setOptionType] = useState<"CE" | "PE">(trade.optionType || "CE");
  const [strikePrice, setStrikePrice] = useState(trade.strikePrice ? String(trade.strikePrice) : "");
  const [spotPrice, setSpotPrice] = useState(trade.spotPrice ? String(trade.spotPrice) : "");
  const [optionExpiry, setOptionExpiry] = useState<"WEEKLY" | "MONTHLY" | "0DTE">(trade.optionExpiry || "WEEKLY");
  const [lotSize, setLotSize] = useState(trade.lotSize || 65);
  const [numberOfLots, setNumberOfLots] = useState(trade.numberOfLots ? String(trade.numberOfLots) : "1");
  const [optionPoints, setOptionPoints] = useState(trade.optionPoints || 0);

  const [actualEntry, setActualEntry] = useState(trade.actualEntry ? String(trade.actualEntry) : "");
  const [actualExit, setActualExit] = useState(trade.actualExit ? String(trade.actualExit) : "");
  const [positionSize, setPositionSize] = useState(trade.positionSize ? String(trade.positionSize) : "");
  const [riskPercent, setRiskPercent] = useState(trade.riskPercent ? String(trade.riskPercent) : "0");
  const [actualRR, setActualRR] = useState(trade.actualRR || 0);
  const [isLateEntry, setIsLateEntry] = useState(Boolean(trade.isLateEntry));
  const [isEarlyEntry, setIsEarlyEntry] = useState(Boolean(trade.isEarlyEntry));
  const [slippage, setSlippage] = useState(trade.slippage ? String(trade.slippage) : "0");

  const [outcome, setOutcome] = useState<TradeOutcome>(trade.outcome || "WIN");
  const [exitReason, setExitReason] = useState<ExitReason>(trade.exitReason || "TARGET_HIT");
  const [pnl, setPnl] = useState(trade.pnl != null ? String(trade.pnl) : "");
  const [rulesFollowed, setRulesFollowed] = useState(trade.rulesFollowed !== false);
  const [ruleBreakReason, setRuleBreakReason] = useState(trade.ruleBreakReason || "");

  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>(
    trade.emotions ? trade.emotions.map((e: any) => e.emotion) : []
  );
  const [mindsetBefore, setMindsetBefore] = useState(trade.mindsetBefore || "");
  const [mindsetDuring, setMindsetDuring] = useState(trade.mindsetDuring || "");
  const [mindsetAfter, setMindsetAfter] = useState(trade.mindsetAfter || "");

  type ScreenshotItem = { id: string; dataUrl: string; stage: string };
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>(
    trade.screenshots ? trade.screenshots.map((s: any) => ({ id: s.id, dataUrl: s.url, stage: s.stage })) : []
  );

  const addScreenshot = (ss: ScreenshotItem) => setScreenshots((prev) => [...prev, ss]);
  const removeScreenshot = (id: string) => setScreenshots((prev) => prev.filter((s) => s.id !== id));

  const isLong = isOptionsMode ? optionAction === "BUY" : bias !== "BEARISH";
  const isIndianMarket = INDIAN_MARKETS.includes(market);
  const currency = isIndianMarket ? "₹" : "$";
  const parsedPnl = parseFloat(pnl) || 0;

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
      onClose();
    } else if (state?.message && !state.success) {
      setIsSubmitting(false);
    }
  }, [state, onClose]);

  const toggleEmotion = (emo: EmotionType) => {
    setSelectedEmotions((prev) =>
      prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]
    );
  };

  return (
    <div className="fixed inset-0 z-120 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-card border border-border-solid sm:rounded-2xl rounded-t-2xl max-h-[90vh] sm:max-h-[88vh] overflow-y-auto z-10 p-4 sm:p-5 pb-24 sm:pb-6 space-y-5 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-border-solid pb-3">
          <div>
            <h2 className="text-lg font-bold text-clean">Edit Logged Trade</h2>
            <p className="text-xs text-muted">Update parameters or psychological notes.</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-dim hover:text-clean hover:bg-elevated transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-around sm:justify-start gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all border whitespace-nowrap ${
                  isCurrent
                    ? "bg-accent-muted text-accent border-accent/30 font-bold"
                    : "bg-transparent text-muted border-transparent hover:text-clean"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{s.label}</span>
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
          className="space-y-6"
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

          {activeStep === 1 && (
            <div className="page-enter space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="label">Market Segment</label>
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value as MarketType)}
                    className="input-field font-semibold"
                  >
                    {MARKETS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Instrument Symbol</label>
                  <input
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="input-field font-mono uppercase font-bold text-accent"
                    readOnly={isOptionsMode}
                  />
                </div>

                <div>
                  <label className="label">Session</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value as SessionType)}
                    className="input-field font-semibold"
                  >
                    {SESSIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>

                <div>
                  <label className="label">Strategy Setup</label>
                  <StrategySelector
                    strategies={strategies}
                    value={setup}
                    strategyId={strategyId}
                    onSetupChange={setSetup}
                    onStrategyIdChange={setStrategyId}
                  />
                </div>

                <div>
                  <label className="label">Bias</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["BULLISH", "BEARISH", "NEUTRAL"] as TradeBias[]).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBias(b)}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          bias === b
                            ? b === "BULLISH"
                              ? "bg-profit/15 text-profit border-profit/30"
                              : b === "BEARISH"
                              ? "bg-loss/15 text-loss border-loss/30"
                              : "bg-accent-muted text-accent border-accent/30"
                            : "bg-surface text-dim hover:bg-elevated border-transparent"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card-elevated p-3 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="label">{isOptionsMode ? "Planned Premium" : "Planned Entry"}</label>
                  <input
                    type="number"
                    step="any"
                    value={plannedEntry}
                    onChange={(e) => setPlannedEntry(e.target.value)}
                    placeholder="Entry price"
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="SL price"
                    className="input-field font-mono text-loss!"
                  />
                </div>
                <div>
                  <label className="label">Target</label>
                  <input
                    type="number"
                    step="any"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="TP price"
                    className="input-field font-mono text-profit!"
                  />
                </div>
                <div>
                  <label className="label">Expected RR</label>
                  <div className="h-[42px] rounded-xl bg-accent-muted border border-accent/20 flex items-center justify-center font-mono font-bold text-accent text-sm">
                    {expectedRR > 0 ? `1:${expectedRR}R` : "—"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="page-enter space-y-4">
              <ContextStrip
                items={[
                  { label: "Symbol", value: instrument.toUpperCase() },
                  { label: "Bias", value: bias, color: bias === "BULLISH" ? "text-profit" : bias === "BEARISH" ? "text-loss" : "text-soft" },
                  { label: "Plan", value: plannedEntry },
                  { label: "SL", value: stopLoss, color: "text-loss" },
                  { label: "TP", value: target, color: "text-profit" },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">{isOptionsMode ? "Entry Premium" : "Actual Entry"}</label>
                  <input
                    type="number"
                    step="any"
                    value={actualEntry}
                    onChange={(e) => setActualEntry(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">{isOptionsMode ? "Exit Premium" : "Actual Exit"}</label>
                  <input
                    type="number"
                    step="any"
                    value={actualExit}
                    onChange={(e) => setActualExit(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">{isOptionsMode ? "Total Qty" : "Position Size"}</label>
                  <input
                    type="number"
                    step="any"
                    value={positionSize}
                    onChange={(e) => setPositionSize(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="card-glow p-3 rounded-xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span className="text-[10px] uppercase font-bold text-accent tracking-wider">Live Metrics</span>
                </div>
                <div className={`grid gap-3 ${isOptionsMode ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                  <MetricCell
                    label="Risk"
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
                      label="Points"
                      value={optionPoints !== 0 ? `${optionPoints >= 0 ? "+" : ""}${optionPoints}` : "—"}
                      color={optionPoints >= 0 ? "text-profit" : "text-loss"}
                    />
                  )}
                  <MetricCell
                    label={`P&L (${currency})`}
                    value={parsedPnl !== 0 ? formatPnlValue(parsedPnl, isIndianMarket) : "—"}
                    color={parsedPnl >= 0 ? "text-profit" : "text-loss"}
                  />
                </div>
              </div>

              <ScreenshotPaste
                screenshots={screenshots}
                onAdd={addScreenshot}
                onRemove={removeScreenshot}
                isOptions={isOptionsMode}
              />

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="page-enter space-y-4">
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
                        : "bg-surface text-dim hover:bg-elevated border-transparent"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Exit Reason</label>
                  <select
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value as ExitReason)}
                    className="input-field"
                  >
                    <option value="TARGET_HIT">Target Hit (TP)</option>
                    <option value="STOP_HIT">Stop Loss Hit (SL)</option>
                    <option value="MANUAL_EXIT">Manual Discretionary Exit</option>
                  </select>
                </div>

                <div>
                  <label className="label">Net P&L ({currency})</label>
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
                </div>
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
                    label="Points"
                    value={optionPoints !== 0 ? `${optionPoints >= 0 ? "+" : ""}${optionPoints} pts` : "—"}
                    color={optionPoints >= 0 ? "text-profit" : "text-loss"}
                  />
                )}
              </div>

              <div className="card-elevated p-3 rounded-xl space-y-3">
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
                  <div>
                    <label className="label">Violation Reason</label>
                    <input
                      value={ruleBreakReason}
                      onChange={(e) => setRuleBreakReason(e.target.value)}
                      placeholder="e.g. Moved SL during trade, overleveraged"
                      className="input-field text-loss!"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="page-enter space-y-4">
              <ContextStrip
                items={[
                  { label: "Result", value: outcome, color: outcome === "WIN" ? "text-profit" : outcome === "LOSS" ? "text-loss" : "text-soft" },
                  { label: "P&L", value: pnl ? formatPnlValue(parsedPnl, isIndianMarket) : "", color: parsedPnl >= 0 ? "text-profit" : "text-loss" },
                  { label: "Exit", value: exitReason.replace(/_/g, " ") },
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
                <div>
                  <label className="label">Mindset Before Entry</label>
                  <textarea
                    value={mindsetBefore}
                    onChange={(e) => setMindsetBefore(e.target.value)}
                    rows={3}
                    className="input-field resize-none text-xs"
                  />
                </div>
                <div>
                  <label className="label">Mindset During Trade</label>
                  <textarea
                    value={mindsetDuring}
                    onChange={(e) => setMindsetDuring(e.target.value)}
                    rows={3}
                    className="input-field resize-none text-xs"
                  />
                </div>
                <div>
                  <label className="label">Mindset After Exit</label>
                  <textarea
                    value={mindsetAfter}
                    onChange={(e) => setMindsetAfter(e.target.value)}
                    rows={3}
                    className="input-field resize-none text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="submit"
                  disabled={isPending || isSubmitting}
                  className="btn-primary text-xs flex items-center gap-1.5 px-6! disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4" />
                  {isPending || isSubmitting ? "Updating Trade..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
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
