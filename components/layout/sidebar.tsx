"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Image as ImageIcon,
  BarChart3,
  Dna,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  CalendarRange,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_SECTIONS = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Trade Journal", href: "/trades", icon: BookOpen },
      { label: "Log Trade", href: "/trades/new", icon: PlusCircle, highlight: true },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Trading DNA", href: "/dna", icon: Dna },
      { label: "Screenshots", href: "/screenshots", icon: ImageIcon },
    ],
  },
  {
    title: "Discipline",
    items: [
      { label: "Psychology", href: "/psychology", icon: BrainCircuit },
      { label: "Rule Engine", href: "/rules", icon: ShieldCheck },
      { label: "AI Coach", href: "/ai-coach", icon: Sparkles },
      { label: "Reviews", href: "/reviews", icon: CalendarRange },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen sticky top-0 z-40 border-r border-border bg-surface transition-all duration-200 select-none ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Brand */}
      <div className={`flex items-center h-16 border-b border-border shrink-0 ${collapsed ? "justify-center px-2" : "px-5"}`}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center shadow-md shadow-accent/20 group-hover:shadow-accent/30 transition-shadow shrink-0">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-[15px] text-clean tracking-tight leading-none block">
                Trading<span className="text-accent">OS</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-dim leading-none block mt-0.5">
                Performance Engine
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={section.title} className={sIdx > 0 ? "mt-5" : ""}>
            {!collapsed && (
              <div className="px-5 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
                  {section.title}
                </span>
              </div>
            )}
            <div className={collapsed ? "px-1.5 space-y-0.5" : "px-2.5 space-y-0.5"}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 rounded-xl transition-all duration-150 group relative ${
                      collapsed
                        ? "h-10 w-10 mx-auto justify-center"
                        : "px-3 py-2"
                    } ${
                      isActive
                        ? "bg-accent-muted text-accent font-semibold"
                        : item.highlight
                        ? "bg-accent text-white font-semibold hover:bg-accent-hover"
                        : "text-muted hover:text-soft hover:bg-elevated"
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-accent" : item.highlight ? "text-white" : ""}`} />
                    {!collapsed && (
                      <span className="text-[13px] truncate">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <div className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer controls */}
      <div className="px-2 py-2 border-t border-border flex items-center gap-1">
        <ThemeToggle />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-1 flex items-center justify-center h-8 rounded-lg hover:bg-elevated text-dim hover:text-muted transition-all"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Profile */}
      <div className={`border-t border-border ${collapsed ? "p-2" : "p-3"}`}>
        <Link
          href="/login"
          className={`flex items-center gap-2.5 rounded-xl transition-all hover:bg-elevated ${
            collapsed ? "h-10 w-10 mx-auto justify-center" : "p-2.5"
          }`}
        >
          <div className="h-8 w-8 rounded-full bg-elevated border border-border flex items-center justify-center text-muted shrink-0">
            <UserIcon className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <p className="text-xs font-semibold text-soft truncate">Trader</p>
              <p className="text-[10px] text-dim truncate">Sign in with Google</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
