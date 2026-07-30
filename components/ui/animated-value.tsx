"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

/**
 * Animated counter that counts up from 0 to a target value.
 * Uses Framer Motion spring animation for smooth, premium feel.
 * Only triggers when the element enters the viewport.
 */
export function AnimatedValue({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  duration = 1.2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration,
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      const formatted = decimals > 0
        ? latest.toFixed(decimals)
        : Math.round(latest).toLocaleString();
      setDisplayValue(formatted);
    });
    return unsubscribe;
  }, [spring, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
