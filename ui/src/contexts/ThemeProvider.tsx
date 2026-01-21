import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { createContext, type ReactNode, useEffect, useMemo, useState } from "react";
import { darkThemeOptions, lightThemeOptions } from "@/styles/theme";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  effectiveMode: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("themeMode");
      if (storedMode !== "system" && storedMode !== "light" && storedMode !== "dark") return "system";
      return storedMode;
    }
    return "system";
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });

  const effectiveMode = mode === "system" ? systemTheme : mode;

  useEffect(() => {
    if (typeof window === "undefined") return;

    document.documentElement.classList.toggle("dark", effectiveMode === "dark");
    localStorage.setItem("themeMode", mode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode, effectiveMode]);

  const theme = useMemo(() => {
    return createTheme(effectiveMode === "dark" ? darkThemeOptions : lightThemeOptions);
  }, [effectiveMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, effectiveMode }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
