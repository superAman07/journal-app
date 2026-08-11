"use client";

import { useState, useEffect } from "react";
import { fetchUsdToInrRate } from "@/lib/utils/currency";

const FALLBACK_RATE = 85.0;

export function useExchangeRate() {
  const [rate, setRate] = useState(FALLBACK_RATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchUsdToInrRate().then((r) => {
      if (!cancelled) {
        setRate(r);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { rate, loading };
}
