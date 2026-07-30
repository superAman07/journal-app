"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { useState } from "react";

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
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen sticky top-0 z-40 bg-surface shadow-[1px_0_0_var(--color-border)] transition-all duration-200 select-none ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Brand — Clean Text, No Icon Box */}
      <div className={`flex items-center h-16 shrink-0 ${collapsed ? "justify-center px-2" : "px-5"}`}>
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          {collapsed ? (
            <span className="font-bold text-base text-clean tracking-tight">
              T<span className="text-accent">OS</span>
            </span>
          ) : (
            <div className="overflow-hidden">
              <span className="font-bold text-[16px] text-clean tracking-tight leading-none block">
                Trading<span className="text-accent">OS</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-dim leading-none block mt-1">
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
                    className={`flex items-center gap-2.5 rounded-xl transition-all duration-150 group relative cursor-pointer ${
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

      {/* Collapse controls — NO border lines */}
      <div className="px-3 py-2 flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center h-8 rounded-lg hover:bg-elevated text-dim hover:text-muted transition-all cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Profile / Live Auth State — NO border lines */}
      <div className={`${collapsed ? "p-2" : "p-3"}`}>
        {session?.user ? (
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-8 w-8 rounded-full shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {session.user.name?.charAt(0) || "T"}
                </div>
              )}
              {!collapsed && (
                <div className="truncate">
                  <p className="text-xs font-semibold text-soft truncate">{session.user.name || "Trader"}</p>
                  <p className="text-[10px] text-dim truncate">{session.user.email}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
                className="p-1.5 rounded-lg hover:bg-elevated text-dim hover:text-loss transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={`flex items-center gap-2.5 rounded-xl transition-all hover:bg-elevated cursor-pointer ${
              collapsed ? "h-10 w-10 mx-auto justify-center" : "p-2.5"
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-elevated flex items-center justify-center text-muted shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-soft truncate">Sign In</p>
                <p className="text-[10px] text-dim truncate">Google OAuth</p>
              </div>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
