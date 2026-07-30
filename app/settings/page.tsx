"use client";

import { Settings as SettingsIcon, Shield, Database, Cloud, Key } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-accent" /> Settings
        </h1>
        <p className="text-xs text-muted mt-0.5">Configure preferences, connections, and credentials.</p>
      </div>

      {/* Preferences */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" /> Trader Preferences
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="label">Base Currency</span>
            <select className="input-field">
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <span className="label">Starting Capital</span>
            <input type="number" defaultValue={10000} className="input-field" />
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-clean flex items-center gap-2">
          <Key className="h-4 w-4 text-accent" /> Integration Status
        </h2>
        <div className="space-y-2">
          <StatusRow icon={<Database className="h-4 w-4 text-muted" />} label="PostgreSQL (Prisma)" status="Schema Ready" type="profit" />
          <StatusRow icon={<Shield className="h-4 w-4 text-muted" />} label="Google OAuth (Auth.js v5)" status="Needs .env" type="warn" />
          <StatusRow icon={<Cloud className="h-4 w-4 text-muted" />} label="Cloudinary Screenshots" status="Needs .env" type="warn" />
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
