"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-8 rounded-lg skeleton shrink-0" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      aria-label="Toggle theme"
      className="h-8 w-8 rounded-lg flex items-center justify-center bg-elevated text-muted hover:text-clean transition-all active:scale-95 cursor-pointer shrink-0"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-warn transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-accent transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
