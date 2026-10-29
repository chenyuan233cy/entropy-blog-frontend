"use client";

import { ArrowUp } from "@phosphor-icons/react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useState } from "react";

export function ToTop() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });
  const opacity = useTransform(smooth, [0, 0.05, 0.1], [0, 0, 1]);
  const scale = useTransform(smooth, [0.05, 0.1], [0.9, 1]);
  const reduce = useReducedMotion();

  // While it is faded out this button is still a real hit target, and it used to cover the sidebar's
  // theme switch exactly, so every press landed here and nothing happened. Only listen once it shows.
  const [reached, setReached] = useState(false);
  useMotionValueEvent(smooth, "change", (value) => setReached(value > 0.02));
  const clickable = Boolean(reduce) || reached;

  return (
    <motion.button
      type="button"
      data-testid="back-to-top"
      aria-label="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
      style={reduce ? { opacity: 1 } : { opacity, scale }}
      className={
        "glass fixed bottom-6 left-6 z-60 grid size-11 place-items-center rounded-full max-sm:hidden md:left-[calc(var(--rail)+1.5rem)] " +
        (clickable ? "pointer-events-auto" : "pointer-events-none")
      }
    >
      <ArrowUp size={17} weight="bold" />
    </motion.button>
  );
}
