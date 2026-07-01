"use client";

import { useState, useEffect } from "react";

export type Theme = "oled" | "cyber" | "warm" | "minimal";

const THEME_KEY = "signal-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("oled");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove("theme-oled", "theme-cyber", "theme-warm", "theme-minimal");
    root.classList.add(`theme-${newTheme}`);
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  };

  return { theme, changeTheme };
}