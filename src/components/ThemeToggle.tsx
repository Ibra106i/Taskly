"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  if (!mounted) return null;

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9, rotate: 15 }}
      className="p-sm rounded-lg hover:bg-primary/10 transition-colors text-on-surface-variant hover:text-on-surface"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.span
        key={dark ? "moon" : "sun"}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="material-symbols-outlined text-[20px]"
      >
        {dark ? "dark_mode" : "light_mode"}
      </motion.span>
    </motion.button>
  );
}
