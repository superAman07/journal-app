"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-8 rounded-lg skeleton" />;
  }

  const cycle = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <button
      onClick={cycle}
      title={`Theme: ${theme} — click to cycle`}
      className="h-8 w-8 rounded-lg flex items-center justify-center bg-elevated border border-border text-muted hover:text-clean hover:border-border-hover transition-all active:scale-95"
    >
      {theme === "dark" && <Moon className="h-3.5 w-3.5" />}
      {theme === "light" && <Sun className="h-3.5 w-3.5" />}
      {theme === "system" && <Monitor className="h-3.5 w-3.5" />}
    </button>
  );
}
