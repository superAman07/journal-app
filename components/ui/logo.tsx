"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  collapsed?: boolean;
}

export function Logo({ className, collapsed = false }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && resolvedTheme === "light";
  const logoSrc = isLight ? "/journal-trading-light.png" : "/journal-trading-dark.png";

  return (
    <img
      key={logoSrc}
      src={logoSrc}
      alt="Trading OS"
      className={cn("h-11 w-auto object-contain object-left", className)}
    />
  );
}
