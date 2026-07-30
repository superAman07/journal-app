"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  BarChart3,
  Dna,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  CalendarRange,
  Settings,
  Image as ImageIcon,
  X,
} from "lucide-react";

const COMMANDS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, keywords: "home overview" },
  { label: "Log New Trade", href: "/trades/new", icon: PlusCircle, keywords: "add create new journal" },
  { label: "Trade Journal", href: "/trades", icon: BookOpen, keywords: "history trades list" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, keywords: "charts performance stats" },
  { label: "Trading DNA", href: "/dna", icon: Dna, keywords: "profile strengths weaknesses" },
  { label: "Psychology", href: "/psychology", icon: BrainCircuit, keywords: "emotions mindset mental" },
  { label: "Rule Engine", href: "/rules", icon: ShieldCheck, keywords: "rules discipline protocols" },
  { label: "AI Coach", href: "/ai-coach", icon: Sparkles, keywords: "assistant coach ai llm" },
  { label: "Reviews", href: "/reviews", icon: CalendarRange, keywords: "weekly monthly yearly review" },
  { label: "Screenshots", href: "/screenshots", icon: ImageIcon, keywords: "charts images vault" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "preferences config" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filtered = COMMANDS.filter((cmd) => {
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.includes(q)
    );
  });

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        onClick={() => { setOpen(false); setQuery(""); }}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15vh] z-[210] flex justify-center px-4">
        <div className="w-full max-w-lg card overflow-hidden shadow-2xl shadow-black/30">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 shadow-[0_1px_0_var(--color-border)]">
            <Search className="h-4 w-4 text-muted shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages & actions..."
              className="flex-1 bg-transparent text-sm text-clean placeholder:text-dim outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length > 0) {
                  handleSelect(filtered[0].href);
                }
              }}
            />
            <kbd className="text-[9px] font-mono text-dim bg-elevated px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.href}
                    onClick={() => handleSelect(cmd.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-elevated group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-elevated group-hover:bg-overlay flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-soft group-hover:text-clean transition-colors">
                      {cmd.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 shadow-[0_-1px_0_var(--color-border)] flex items-center gap-4 text-[10px] text-dim">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </>
  );
}
