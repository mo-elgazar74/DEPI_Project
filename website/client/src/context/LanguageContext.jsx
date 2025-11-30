import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../constants/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "en";
  });

  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : ""
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updatePathname = () => setPathname(window.location.pathname);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event("pushstate"));
      window.dispatchEvent(new Event("locationchange"));
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("replacestate"));
      window.dispatchEvent(new Event("locationchange"));
      return result;
    };

    window.addEventListener("popstate", updatePathname);
    window.addEventListener("locationchange", updatePathname);
    updatePathname();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", updatePathname);
      window.removeEventListener("locationchange", updatePathname);
    };
  }, []);

  const isLayoutLockedPage =
    pathname.startsWith("/dashboard") || pathname.startsWith("/edubot");

  useEffect(() => {
    if (isLayoutLockedPage) {
      // Keep EduBot/dashboard layout stable regardless of language toggle.
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
      return;
    }
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isLayoutLockedPage]);

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const toggleLanguage = () => {
    if (isLayoutLockedPage) return; // Disable toggle effect on EduBot/dashboard
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
