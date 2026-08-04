"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, LineChart } from "lucide-react";
import { ChartModal } from "@/components/ui/chart-modal";

type TickerItem = {
  symbol: string;
  label: string;
  price: string;
  change: number;
  isUp: boolean;
};

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: "NIFTY", label: "NIFTY 50", price: "24,520", change: 0.65, isUp: true },
  { symbol: "GOLD", label: "Gold", price: "$2,388", change: 0.45, isUp: true },
  { symbol: "BTC", label: "Bitcoin", price: "$65,420", change: 1.84, isUp: true },
];

export function LiveTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>(DEFAULT_TICKERS);
  const [chartOpen, setChartOpen] = useState(false);
  const [activeChartSymbol, setActiveChartSymbol] = useState("NIFTY");

  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const [btcRes, paxgRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT").then((r) => r.json()),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT").then((r) => r.json()),
        ]);

        if (btcRes?.lastPrice && paxgRes?.lastPrice) {
          const btcPrice = parseFloat(btcRes.lastPrice);
          const btcChange = parseFloat(btcRes.priceChangePercent);
          const goldPrice = parseFloat(paxgRes.lastPrice);
          const goldChange = parseFloat(paxgRes.priceChangePercent);

          setTickers([
            { symbol: "NIFTY", label: "NIFTY 50", price: "24,520", change: 0.65, isUp: true },
            { symbol: "GOLD", label: "Gold", price: `$${goldPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, change: goldChange, isUp: goldChange >= 0 },
            { symbol: "BTC", label: "Bitcoin", price: `$${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, change: btcChange, isUp: btcChange >= 0 },
          ]);
        }
      } catch {
        // Fallback
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const openChart = (sym: string) => {
    setActiveChartSymbol(sym);
    setChartOpen(true);
  };

  return (
    <>
      {/* Desktop Navbar Ticker Pills (Hidden on Mobile for Ultra-Clean Header) */}
      <div className="hidden md:flex items-center gap-2 text-[11px]">
        {tickers.map((t) => (
          <button
            key={t.symbol}
            onClick={() => openChart(t.symbol)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-elevated border border-border-solid font-mono cursor-pointer hover:border-accent/40 hover:bg-surface transition-all select-none"
            title={`Click to open live chart for ${t.label}`}
          >
            <span className="text-dim font-sans font-extrabold text-[10px] tracking-wider">{t.symbol}</span>
            <span className="text-clean font-bold">{t.price}</span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${t.isUp ? "text-profit" : "text-loss"}`}>
              {t.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(t.change).toFixed(1)}%
            </span>
          </button>
        ))}

        <button
          onClick={() => openChart("NIFTY")}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accent-muted text-accent border border-accent/30 font-bold hover:bg-accent/20 transition-all cursor-pointer"
          title="Open Free Live TradingView Chart"
        >
          <LineChart className="h-3.5 w-3.5" />
          <span>Chart</span>
        </button>
      </div>

      {/* Standalone Interactive Chart Modal */}
      <ChartModal
        isOpen={chartOpen}
        onClose={() => setChartOpen(false)}
        initialSymbol={activeChartSymbol}
      />
    </>
  );
}
