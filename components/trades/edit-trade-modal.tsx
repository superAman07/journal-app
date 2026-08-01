"use client";

import { useState, useActionState, useEffect } from "react";
import { X, Check, ArrowLeft, ArrowRight, Target, TrendingUp, CheckCircle2, Brain } from "lucide-react";
import { MarketType, SessionType, TradeOutcome, ExitReason, TradeBias, EmotionType } from "@/types";
import { updateTrade, TradeFormState } from "@/lib/actions/trade-actions";
import { ScreenshotPaste } from "./screenshot-paste";

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

  // Plan State
  const [market, setMarket] = useState<MarketType>(trade.market || "Nifty Options");
  const [instrument, setInstrument] = useState(trade.instrument || "");
  const [session, setSession] = useState<SessionType>(trade.session || "Asian");
  const [date, setDate] = useState(
    trade.date ? new Date(trade.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [setup, setSetup] = useState(trade.setup || "");
  const [bias, setBias] = useState<TradeBias>(trade.bias || "BULLISH");
  const [plannedEntry, setPlannedEntry] = useState(trade.plannedEntry ? String(trade.plannedEntry) : "");
  const [stopLoss, setStopLoss] = useState(trade.stopLoss ? String(trade.stopLoss) : "");
  const [target, setTarget] = useState(trade.target ? String(trade.target) : "");
  const [expectedRR, setExpectedRR] = useState(trade.expectedRR || 0);

  // Options State
  const isOptionsMode = market.includes("Options");
  const [optionAction, setOptionAction] = useState<"BUY" | "SELL">(trade.optionAction || "BUY");
  const [optionType, setOptionType] = useState<"CE" | "PE">(trade.optionType || "CE");
  const [strikePrice, setStrikePrice] = useState(trade.strikePrice ? String(trade.strikePrice) : "24500");
  const [spotPrice, setSpotPrice] = useState(trade.spotPrice ? String(trade.spotPrice) : "");
  const [optionExpiry, setOptionExpiry] = useState<"WEEKLY" | "MONTHLY" | "0DTE">(trade.optionExpiry || "WEEKLY");
  const [lotSize, setLotSize] = useState(trade.lotSize || 65);
  const [numberOfLots, setNumberOfLots] = useState(trade.numberOfLots ? String(trade.numberOfLots) : "1");
  const [optionPoints, setOptionPoints] = useState(trade.optionPoints || 0);

  // Execution State
  const [actualEntry, setActualEntry] = useState(trade.actualEntry ? String(trade.actualEntry) : "");
  const [actualExit, setActualExit] = useState(trade.actualExit ? String(trade.actualExit) : "");
  const [positionSize, setPositionSize] = useState(trade.positionSize ? String(trade.positionSize) : "1");
  const [riskPercent, setRiskPercent] = useState(trade.riskPercent ? String(trade.riskPercent) : "1.0");
  const [actualRR, setActualRR] = useState(trade.actualRR || 0);
  const [isLateEntry, setIsLateEntry] = useState(Boolean(trade.isLateEntry));
  const [isEarlyEntry, setIsEarlyEntry] = useState(Boolean(trade.isEarlyEntry));
  const [slippage, setSlippage] = useState(trade.slippage ? String(trade.slippage) : "0.0");

  // Result State
  const [outcome, setOutcome] = useState<TradeOutcome>(trade.outcome || "WIN");
  const [exitReason, setExitReason] = useState<ExitReason>(trade.exitReason || "TARGET_HIT");
  const [pnl, setPnl] = useState(trade.pnl ? String(trade.pnl) : "0.00");
  const [rulesFollowed, setRulesFollowed] = useState(trade.rulesFollowed !== false);
  const [ruleBreakReason, setRuleBreakReason] = useState(trade.ruleBreakReason || "");

  // Mindset State
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>(
    trade.emotions ? trade.emotions.map((e: any) => e.emotion) : ["Calm"]
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

  useEffect(() => {
    const e = parseFloat(actualEntry),
      sl = parseFloat(stopLoss),
      ex = parseFloat(actualExit);
    if (!isNaN(e) && !isNaN(sl) && !isNaN(ex) && e !== sl) {
      const risk = Math.abs(e - sl);
      if (risk > 0) {
        if (outcome === "LOSS") {
          const loss = Math.abs(e - ex);
          setActualRR(parseFloat((-Math.max(loss, risk) / risk).toFixed(2)));
        } else if (outcome === "BREAKEVEN") {
          setActualRR(0);
        } else {
          const reward = Math.abs(ex - e);
          setActualRR(parseFloat((reward / risk).toFixed(2)));
        }
      }
    }
  }, [actualEntry, stopLoss, actualExit, outcome]);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  const toggleEmotion = (emo: EmotionType) => {
    setSelectedEmotions((prev) =>
      prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-card border border-border-solid sm:rounded-2xl rounded-t-2xl max-h-[90vh] sm:max-h-[88vh] overflow-y-auto z-10 p-4 sm:p-5 pb-24 sm:pb-6 space-y-5 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-border-solid pb-3">
          <div>
            <h2 className="text-lg font-bold text-clean">Edit Logged Trade</h2>
            <p className="text-xs text-muted">Update parameters or psychological notes.</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-dim hover:text-clean hover:bg-elevated transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps — Responsive 4-step fit with no horizontal cut-off */}
        <div className="flex items-center justify-around sm:justify-start gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all border whitespace-nowrap cursor-pointer ${
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

        <form action={formAction} className="space-y-6">
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="label">Market Segment</label>
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
                </div>

                <div>
                  <label className="label">Instrument Symbol</label>
                  <input
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="input-field font-mono uppercase font-bold text-accent"
                  />
                </div>

                <div>
                  <label className="label">Session</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value as SessionType)}
                    className="input-field font-semibold cursor-pointer"
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
                    className="input-field font-mono cursor-pointer"
                  />
                </div>

                <div>
                  <label className="label">Strategy Setup</label>
                  <input
                    value={setup}
                    onChange={(e) => setSetup(e.target.value)}
                    className="input-field font-semibold"
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
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
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

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: EXECUTION */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  <label className="label">Position Size</label>
                  <input
                    type="number"
                    step="any"
                    value={positionSize}
                    onChange={(e) => setPositionSize(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Risk %</label>
                  <input
                    type="number"
                    step="any"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    className="input-field font-mono"
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
                  className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {activeStep === 3 && (
            <div className="space-y-4">
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
                    className="input-field cursor-pointer"
                  >
                    <option value="TARGET_HIT">Target Hit (TP)</option>
                    <option value="STOP_HIT">Stop Loss Hit (SL)</option>
                    <option value="MANUAL_EXIT">Manual Discretionary Exit</option>
                  </select>
                </div>

                <div>
                  <label className="label">Net PnL</label>
                  <input
                    type="number"
                    step="any"
                    value={pnl}
                    onChange={(e) => setPnl(e.target.value)}
                    className={`input-field font-mono font-bold text-sm ${
                      parseFloat(pnl) >= 0 ? "!text-profit" : "!text-loss"
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MINDSET */}
          {activeStep === 4 && (
            <div className="space-y-4">
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
                  className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 !px-6"
                >
                  <Check className="h-4 w-4" />
                  {isPending ? "Updating Trade..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
