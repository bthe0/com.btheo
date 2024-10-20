"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import styles from "../styles/ThemeToggle.module.css";

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <span
      onClick={(e) => setTheme(theme === "dark" ? "light" : "dark")}
      className={styles.themeToggle}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "dark" ? <FiSun size={24} /> : <FiMoon size={24} />}
    </span>
  );
};

export default ThemeToggle;
