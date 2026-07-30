"use client";

import { useState } from "react";
import { ShieldCheck, Plus, CheckCircle2 } from "lucide-react";
import { MOCK_RULES } from "@/lib/data/mock-trades";

export default function RulesPage() {
  const [rules, setRules] = useState(MOCK_RULES);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"RISK" | "EXECUTION" | "PSYCHOLOGY">("RISK");

  const addRule = () => {
    if (!newTitle.trim()) return;
    setRules([...rules, { id: `rule-${Date.now()}`, title: newTitle, description: "Custom rule.", category: newCategory, isActive: true }]);
    setNewTitle("");
  };

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-clean flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" /> Rule Engine
        </h1>
        <p className="text-xs text-muted mt-0.5">Enforce risk, execution, and psychology protocols.</p>
      </div>

      {/* Add Rule */}
      <div className="card p-4 flex flex-col sm:flex-row gap-2">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add new rule..." className="input-field flex-1" />
        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as typeof newCategory)} className="input-field !w-auto">
          <option value="RISK">Risk</option>
          <option value="EXECUTION">Execution</option>
          <option value="PSYCHOLOGY">Psychology</option>
        </select>
        <button onClick={addRule} className="btn-primary whitespace-nowrap">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rules.map((rule) => (
          <div key={rule.id} className="card p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-accent text-[9px]">{rule.category}</span>
                {rule.isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-profit font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-clean">{rule.title}</h3>
              <p className="text-xs text-muted">{rule.description}</p>
            </div>
            <button
              onClick={() => toggleRule(rule.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                rule.isActive ? "bg-profit/10 text-profit border-profit/20" : "bg-elevated text-dim"
              }`}
            >
              {rule.isActive ? "On" : "Off"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
