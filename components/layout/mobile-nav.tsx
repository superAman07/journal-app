"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  BarChart3,
  Menu,
  X,
  Dna,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  CalendarRange,
  Settings,
  Image as ImageIcon,
  LogOut,
  User as UserIcon,
} from "lucide-react";

const MAIN_TABS = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Journal", href: "/trades", icon: BookOpen },
  { label: "Log", href: "/trades/new", icon: PlusCircle, isAction: true },
  { label: "Stats", href: "/analytics", icon: BarChart3 },
  { label: "More", href: "#more", icon: Menu, isMore: true },
];

const MORE_ITEMS = [
  { label: "Trading DNA", href: "/dna", icon: Dna },
  { label: "Psychology", href: "/psychology", icon: BrainCircuit },
  { label: "Rule Engine", href: "/rules", icon: ShieldCheck },
  { label: "AI Coach", href: "/ai-coach", icon: Sparkles },
  { label: "Reviews", href: "/reviews", icon: CalendarRange },
  { label: "Screenshots", href: "/screenshots", icon: ImageIcon },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Bottom Sheet Overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Sheet */}
      {moreOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-100 lg:hidden animate-slide-up">
          <div className="mx-3 mb-[calc(72px+env(safe-area-inset-bottom,0px)+8px)] rounded-2xl bg-card overflow-hidden shadow-2xl shadow-black/50">
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
              <div className="flex items-center gap-2">
                {session?.user ? (
                  <div className="flex items-center gap-2 min-w-0">
                    {session.user.image ? (
                      <img src={session.user.image} alt="" className="h-6 w-6 rounded-full shrink-0" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-bold">
                        {session.user.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-xs font-bold text-clean truncate">{session.user.name || "Trader"}</span>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4" /> Sign In with Google
                  </Link>
                )}
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg hover:bg-elevated text-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sheet Items */}
            <div className="p-2 grid grid-cols-3 gap-1">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent-muted text-accent"
                        : "text-muted hover:bg-elevated hover:text-soft"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {session?.user ? (
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl text-loss hover:bg-loss/10 transition-all cursor-pointer col-span-3"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-[11px] font-semibold">Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl text-accent hover:bg-accent/10 transition-all cursor-pointer col-span-3"
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="text-[11px] font-semibold">Sign In with Google</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-80 lg:hidden">
        <div className="bg-surface/95 backdrop-blur-xl shadow-[0_-1px_0_var(--color-border)]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="flex items-center justify-around h-16 px-2">
            {MAIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = !tab.isMore && !tab.isAction && pathname === tab.href;
              const isJournalActive = tab.href === "/trades" && pathname.startsWith("/trades") && pathname !== "/trades/new";

              if (tab.isMore) {
                return (
                  <button
                    key="more"
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={`flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all cursor-pointer ${
                      moreOpen ? "text-accent" : "text-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">More</span>
                  </button>
                );
              }

              if (tab.isAction) {
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="flex items-center justify-center -mt-4 h-13 w-13 rounded-2xl bg-accent shadow-lg shadow-accent/25 text-white transition-all active:scale-95 cursor-pointer"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                );
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all cursor-pointer ${
                    isActive || isJournalActive
                      ? "text-accent"
                      : "text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {(isActive || isJournalActive) && (
                    <div className="h-1 w-1 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
