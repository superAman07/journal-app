"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Plus, Sparkles, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-14 bg-surface/80 backdrop-blur-xl sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-3 shadow-[0_1px_0_var(--color-border)]">
      {/* Left: Mobile brand + Desktop ticker */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile brand mark — Clean Text, No Icon Box */}
        <Link href="/" className="lg:hidden flex items-center gap-1.5 cursor-pointer">
          <span className="font-bold text-base text-clean tracking-tight">
            Trading<span className="text-accent">OS</span>
          </span>
        </Link>

        {/* Desktop live ticker */}
        <div className="hidden md:flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-profit"></span>
            </span>
            <span className="text-muted">NY</span>
            <span className="text-profit font-semibold font-mono">Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated font-mono">
            <span className="text-dim">XAUUSD</span>
            <span className="text-profit font-semibold">2,385</span>
          </div>
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated font-mono">
            <span className="text-dim">BTC</span>
            <span className="text-profit font-semibold">65,250</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Link
          href="/ai-coach"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ai-muted text-ai text-xs font-semibold transition-all hover:bg-ai/20 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Coach</span>
        </Link>

        <Link
          href="/trades/new"
          className="hidden sm:flex btn-primary py-2! px-4! text-xs! rounded-lg! cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Log Trade</span>
          <kbd className="hidden lg:inline ml-1 px-1.5 py-0.5 text-[9px] bg-white/10 rounded font-mono">
            ⌘K
          </kbd>
        </Link>

        {/* User Session Auth Button */}
        {session?.user ? (
          <div className="flex items-center gap-2 pl-1 border-l border-border/20">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-8 w-8 rounded-full shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                {session.user.name?.charAt(0) || "U"}
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-elevated text-dim hover:text-loss transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="btn-primary !bg-accent/20 !text-accent hover:!bg-accent hover:!text-white !py-1.5 !px-3 !text-xs !rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <User className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
