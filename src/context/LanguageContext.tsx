"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { LanguageCode, TranslationKeys, translations } from "@/lib/translations";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKeys) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  const applyDirection = (lang: LanguageCode) => {
    if (typeof document !== "undefined") {
      if (lang === "ar") {
        document.documentElement.dir = "rtl";
        document.documentElement.lang = "ar";
      } else {
        document.documentElement.dir = "ltr";
        document.documentElement.lang = lang;
      }
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("cmc_language") as LanguageCode;
    if (saved && translations[saved]) {
      setLanguageState(saved);
      applyDirection(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("cmc_language", lang);
    applyDirection(lang);
  };

  const t = (key: TranslationKeys): string => {
    const activeDict = translations[language] as Record<string, string>;
    return activeDict?.[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: language === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}