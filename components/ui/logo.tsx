"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  collapsed?: boolean;
}

export function Logo({ className = "h-9 w-auto object-contain object-left", collapsed = false }: LogoProps) {
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
      className={className}
    />
  );
}
