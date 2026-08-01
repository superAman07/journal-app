export type MarketType =
  | "Nifty Options"
  | "BankNifty Options"
  | "Sensex Options"
  | "Stock Options"
  | "Crypto Options"
  | "Forex"
  | "Gold"
  | "Silver"
  | "Crypto"
  | "Stocks"
  | "Futures";

export type SessionType =
  | "Asian"
  | "London"
  | "New York"
  | "London/NY Overlap";

export type TradeOutcome = "WIN" | "LOSS" | "BREAKEVEN";

export type ExitReason = "TARGET_HIT" | "STOP_HIT" | "MANUAL_EXIT";

export type TradeBias = "BULLISH" | "BEARISH" | "NEUTRAL";

export type EmotionType =
  | "Calm"
  | "Fear"
  | "Greed"
  | "Revenge"
  | "FOMO"
  | "Overconfidence"
  | "Anxiety"
  | "Hesitation"
  | "Frustration";

export type MistakeType =
  | "Overtrading"
  | "Moving SL"
  | "Early Exit"
  | "FOMO Entry"
  | "Risk Overload"
  | "Ignored Plan"
  | "Revenge Trade"
  | "Chasing Price"
  | "Bad Position Size";

export type ScreenshotStage = "BEFORE_ENTRY" | "DURING_TRADE" | "AFTER_EXIT";

export interface TradeItem {
  id: string;
  date: string;
  market: MarketType;
  instrument: string;
  session: SessionType;
  setup: string;
  bias: TradeBias;
  
  plannedEntry?: number;
  stopLoss: number;
  target: number;
  expectedRR: number;

  actualEntry: number;
  actualExit: number;
  positionSize: number;
  riskPercent: number;
  actualRR: number;
  isLateEntry: boolean;
  isEarlyEntry: boolean;
  slippage?: number;

  // Options Trading Specific Fields
  optionType?: "CE" | "PE";
  optionAction?: "BUY" | "SELL";
  strikePrice?: number;
  spotPrice?: number;
  optionExpiry?: "WEEKLY" | "MONTHLY" | "0DTE";
  lotSize?: number;
  numberOfLots?: number;
  optionPoints?: number;

  outcome: TradeOutcome;
  exitReason: ExitReason;
  pnl: number;
  rMultiple: number;
  rulesFollowed: boolean;
  ruleBreakReason?: string;

  mindsetBefore?: string;
  mindsetDuring?: string;
  mindsetAfter?: string;
  notes?: string;

  emotions: EmotionType[];
  mistakes: MistakeType[];
  screenshots: {
    id: string;
    url: string;
    stage: ScreenshotStage;
    caption?: string;
  }[];
}

export interface DashboardMetrics {
  winRate: number;
  totalTrades: number;
  averageRR: number;
  netPnL: number;
  bestSetup: string;
  worstSetup: string;
  bestSession: string;
  mostCommonMistake: string;
  psychologyScore: number;
  ruleFollowRate: number;
}

export interface TradingDNA {
  bestMarket: string;
  worstMarket: string;
  bestSetup: string;
  bestWeekday: string;
  bestSession: string;
  bestRRRatio: string;
  biggestWeakness: string;
  mostProfitableEmotion: string;
  worstEmotion: string;
  avgWinner: number;
  avgLoser: number;
}

export interface TradingRuleItem {
  id: string;
  title: string;
  description: string;
  category: "RISK" | "EXECUTION" | "PSYCHOLOGY";
  isActive: boolean;
}

export interface AIInsightItem {
  id: string;
  type: "PATTERN" | "MISTAKE_WARNING" | "WEEKLY_SUMMARY" | "TRADE_REVIEW";
  title: string;
  content: string;
  createdAt: string;
}
