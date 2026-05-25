"use client";

import { animate, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  /** Animation duration in seconds. Default 0.9s. */
  duration?: number;
  /** Custom formatter; defaults to en-US locale group separators. */
  format?: (n: number) => string;
}

/**
 * Tweens a number from 0 to {value} when it scrolls into view. Uses
 * motion's spring under the hood so easing matches the rest of the UI.
 * Falls back to the final value if the user prefers reduced motion.
 */
export function CountUp({
  value,
  duration = 0.9,
  format = (n) => Math.round(n).toLocaleString(),
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (n) => format(n));
  const [text, setText] = useState(format(0));

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setText(v));
    return unsub;
  }, [rounded]);

  useEffect(() => {
    if (!inView) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, value, duration, mv]);

  return <span ref={ref}>{text}</span>;
}
