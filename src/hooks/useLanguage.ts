import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type Language, getLanguageFromParam, resolveLanguage, saveLanguage } from "@/lib/i18n";

export function useLanguage(): { lang: Language; setLanguage: (language: Language) => void } {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryLanguage = searchParams.get("lang");
  const initialLanguage = useMemo(() => resolveLanguage(queryLanguage), [queryLanguage]);
  const [lang, setLang] = useState<Language>(initialLanguage);

  useEffect(() => {
    const resolvedLanguage = resolveLanguage(queryLanguage);
    setLang((currentLanguage) => (currentLanguage === resolvedLanguage ? currentLanguage : resolvedLanguage));
  }, [queryLanguage]);

  useEffect(() => {
    saveLanguage(lang);
  }, [lang]);

  const setLanguage = (language: Language) => {
    setLang(language);
    saveLanguage(language);

    const nextParams = new URLSearchParams(searchParams);
    if (language === "es") {
      nextParams.delete("lang");
    } else {
      nextParams.set("lang", language);
    }

    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    const paramLanguage = getLanguageFromParam(queryLanguage);
    if (paramLanguage) {
      saveLanguage(paramLanguage);
    }
  }, [queryLanguage]);

  return { lang, setLanguage };
}
