"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Shield, Database, Cloud, Key, Save, Check, User, Wallet, DollarSign } from "lucide-react";

export default function SettingsPage() {
  const [currency, setCurrency] = useState("INR");
  const [startingCapital, setStartingCapital] = useState("100000");
  const [defaultNiftyLot, setDefaultNiftyLot] = useState("65");
  const [traderName, setTraderName] = useState("Aman Vishwakarma");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const prefCurrency = localStorage.getItem("pref_currency");
    const prefCapital = localStorage.getItem("pref_capital");
    const prefLot = localStorage.getItem("pref_nifty_lot");
    const prefName = localStorage.getItem("pref_trader_name");

    if (prefCurrency) setCurrency(prefCurrency);
    if (prefCapital) setStartingCapital(prefCapital);
    if (prefLot) setDefaultNiftyLot(prefLot);
    if (prefName) setTraderName(prefName);
  }, []);

  const handleSave = () => {
    localStorage.setItem("pref_currency", currency);
    localStorage.setItem("pref_capital", startingCapital);
    localStorage.setItem("pref_nifty_lot", defaultNiftyLot);
    localStorage.setItem("pref_trader_name", traderName);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-accent" /> Account Settings
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure your trading capital, currency preferences, and default lot presets.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
        >
          {saved ? <Check className="h-4 w-4 text-profit" /> : <Save className="h-4 w-4" />}
          <span>{saved ? "Saved!" : "Save Preferences"}</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-profit/15 border border-profit/30 text-profit text-xs rounded-xl font-bold flex items-center gap-2">
          <Check className="h-4 w-4" /> Preferences saved successfully to your browser session!
        </div>
      )}

      {/* Trader Profile */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
          <User className="h-4 w-4 text-accent" /> Trader Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="label">Trader Display Name</span>
            <input
              type="text"
              value={traderName}
              onChange={(e) => setTraderName(e.target.value)}
              className="input-field font-semibold"
            />
          </div>
          <div>
            <span className="label">Default Nifty Options Lot Size</span>
            <input
              type="number"
              value={defaultNiftyLot}
              onChange={(e) => setDefaultNiftyLot(e.target.value)}
              className="input-field font-mono font-bold text-accent"
            />
          </div>
        </div>
      </div>

      {/* Financial Preferences */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
          <Wallet className="h-4 w-4 text-accent" /> Portfolio & Currency
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="label">Base Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-field font-semibold cursor-pointer"
            >
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>
          <div>
            <span className="label">Starting Trading Capital</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-dim text-xs">
                {currency === "INR" ? "₹" : "$"}
              </span>
              <input
                type="number"
                value={startingCapital}
                onChange={(e) => setStartingCapital(e.target.value)}
                className="input-field font-mono font-bold pl-7"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
          <Key className="h-4 w-4 text-accent" /> Integration Status
        </h2>
        <div className="space-y-2">
          <StatusRow icon={<Database className="h-4 w-4 text-muted" />} label="PostgreSQL Database (Prisma)" status="Connected & Active" type="profit" />
          <StatusRow icon={<Shield className="h-4 w-4 text-muted" />} label="Google OAuth Authentication" status="Active Session" type="profit" />
          <StatusRow icon={<Cloud className="h-4 w-4 text-muted" />} label="Chart Screenshot Storage" status="Base64 / Database Ready" type="profit" />
        </div>
      </div>
    </div>
  );
}

function StatusRow({ icon, label, status, type }: { icon: React.ReactNode; label: string; status: string; type: "profit" | "warn" }) {
  return (
    <div className="card-elevated p-3.5 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-xs font-semibold text-soft">{label}</span>
      </div>
      <span className={`badge ${type === "profit" ? "badge-profit" : "badge-warn"}`}>{status}</span>
    </div>
  );
}
