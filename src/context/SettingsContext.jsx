import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { translations } from "../i18n/translations";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "id");

  // Terapkan class tema ke <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Terapkan atribur bahasa ke <html>
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }, [lang]);

  const value = useMemo(() => {
    const t = (key) => translations[lang]?.[key] ?? translations.id?.[key] ?? key;

    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
      lang,
      setLang,
      t,
    };
  }, [theme, lang]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
