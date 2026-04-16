import { createContext, useContext, useEffect, useState } from "react";
import translations from "../locales/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() =>
    localStorage.getItem("bb_lang") || "en"
  );

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem("bb_lang", l);
  };

  // Set RTL direction and Urdu font on html element
  useEffect(() => {
    const html = document.documentElement;
    if (lang === "ur") {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ur");
      html.classList.add("urdu-mode");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
      html.classList.remove("urdu-mode");
    }
  }, [lang]);

  const t = (key, ...args) => {
    const val = translations[lang]?.[key] ?? translations.en[key] ?? key;
    return typeof val === "function" ? val(...args) : val;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
