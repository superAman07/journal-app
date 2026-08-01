"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, LineChart, X } from "lucide-react";

type TickerItem = {
  symbol: string;
  name: string;
  price: string;
  change: number;
  isUp: boolean;
};

export function LiveTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([
    { symbol: "NIFTY 50", name: "Nifty", price: "24,520.15", change: 0.65, isUp: true },
    { symbol: "BANKNIFTY", name: "BankNifty", price: "52,410.80", change: -0.22, isUp: false },
    { symbol: "BTC/USDT", name: "Bitcoin", price: "65,420.00", change: 1.84, isUp: true },
    { symbol: "XAU/USD", name: "Gold", price: "2,388.50", change: 0.45, isUp: true },
  ]);

  const [chartSymbol, setChartSymbol] = useState<string | null>(null);

  // Fetch real-world live crypto & gold ticker data from Binance API
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const [btcRes, ethRes, paxgRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT").then((r) => r.json()),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT").then((r) => r.json()),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT").then((r) => r.json()),
        ]);

        if (btcRes?.lastPrice && paxgRes?.lastPrice) {
          const btcPrice = parseFloat(btcRes.lastPrice).toLocaleString("en-US", { maximumFractionDigits: 2 });
          const btcChange = parseFloat(btcRes.priceChangePercent);

          const goldPrice = parseFloat(paxgRes.lastPrice).toLocaleString("en-US", { maximumFractionDigits: 2 });
          const goldChange = parseFloat(paxgRes.priceChangePercent);

          const ethPrice = parseFloat(ethRes.lastPrice).toLocaleString("en-US", { maximumFractionDigits: 2 });
          const ethChange = parseFloat(ethRes.priceChangePercent);

          setTickers([
            { symbol: "NIFTY 50", name: "Nifty", price: "24,520.15", change: 0.65, isUp: true },
            { symbol: "BANKNIFTY", name: "BankNifty", price: "52,410.80", change: -0.22, isUp: false },
            { symbol: "BTC/USD", name: "Bitcoin", price: `$${btcPrice}`, change: btcChange, isUp: btcChange >= 0 },
            { symbol: "GOLD", name: "Gold Spot", price: `$${goldPrice}`, change: goldChange, isUp: goldChange >= 0 },
          ]);
        }
      } catch (err) {
        // Fallback to initial prices if offline
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 10000); // Live poll every 10 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="hidden md:flex items-center gap-2 text-[11px]">
        {/* Live Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated border border-border-solid">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-profit"></span>
          </span>
          <span className="text-muted font-medium">LIVE</span>
        </div>

        {/* Live Ticker Cards */}
        {tickers.map((t) => (
          <div
            key={t.symbol}
            onClick={() => setChartSymbol(t.symbol)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated border border-border-solid font-mono cursor-pointer hover:border-accent/40 transition-all"
            title={`Click to open live chart for ${t.symbol}`}
          >
            <span className="text-dim font-sans font-bold">{t.symbol}</span>
            <span className="text-clean font-bold">{t.price}</span>
            <span className={`text-[10px] font-bold flex items-center ${t.isUp ? "text-profit" : "text-loss"}`}>
              {t.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(t.change).toFixed(2)}%
            </span>
          </div>
        ))}

        {/* Free Live Chart Button */}
        <button
          onClick={() => setChartSymbol("NIFTY 50")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-muted text-accent border border-accent/20 font-bold hover:bg-accent/20 transition-all cursor-pointer"
          title="Open Free Live TradingView Chart"
        >
          <LineChart className="h-3.5 w-3.5" />
          <span>Chart</span>
        </button>
      </div>

      {/* Free Live TradingView Chart Modal */}
      {chartSymbol && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6">
          <div className="relative w-full max-w-5xl h-[85vh] bg-card border border-border-solid rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-surface border-b border-border-solid flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-accent" />
                <span className="text-sm font-bold text-clean">TradingView Live Chart</span>
                <span className="badge badge-accent">{chartSymbol}</span>
              </div>
              <button
                onClick={() => setChartSymbol(null)}
                className="h-8 w-8 rounded-lg bg-elevated flex items-center justify-center text-soft hover:text-clean transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 w-full h-full bg-black">
              <iframe
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${
                  chartSymbol.includes("NIFTY")
                    ? "NSE:NIFTY"
                    : chartSymbol.includes("BANKNIFTY")
                    ? "NSE:BANKNIFTY"
                    : chartSymbol.includes("BTC")
                    ? "BINANCE:BTCUSDT"
                    : "TVC:GOLD"
                }&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Asia/Kolkata`}
                className="w-full h-full border-none"
                title="Live TradingView Chart"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
