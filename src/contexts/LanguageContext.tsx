import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface Language {
  id: string;
  name: string;
  native_name: string;
  is_rtl: boolean;
}

interface TranslationMap {
  [key: string]: {
    [key: string]: string;
  };
}

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => Promise<void>;
  translate: (key: string, namespace?: string) => string;
  isRTL: boolean;
  availableLanguages: Language[];
  loading: boolean;
}

const defaultLanguage: Language = {
  id: "en",
  name: "English",
  native_name: "English",
  is_rtl: false,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadLanguages();
    if (user) {
      loadUserLanguagePreference();
    }
  }, [user]);

  useEffect(() => {
    loadTranslations();
  }, [currentLanguage.id]);

  const loadLanguages = async () => {
    const { data: languages } = await supabase
      .from("supported_languages")
      .select("*")
      .eq("is_active", true);

    if (languages) {
      setAvailableLanguages(languages);
    }
  };

  const loadUserLanguagePreference = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .single();

    if (profile?.preferred_language) {
      const preferredLang = availableLanguages.find(
        (lang) => lang.id === profile.preferred_language
      );
      if (preferredLang) {
        setCurrentLanguage(preferredLang);
      }
    }
    setLoading(false);
  };

  const loadTranslations = async () => {
    const { data: translationsData } = await supabase
      .from("translations")
      .select("*")
      .eq("language_id", currentLanguage.id);

    if (translationsData) {
      const formattedTranslations: TranslationMap = {};
      translationsData.forEach((t) => {
        if (!formattedTranslations[t.namespace]) {
          formattedTranslations[t.namespace] = {};
        }
        formattedTranslations[t.namespace][t.key] = t.value;
      });
      setTranslations(formattedTranslations);
    }
  };

  const setLanguage = async (lang: Language) => {
    setCurrentLanguage(lang);
    if (user) {
      await supabase
        .from("profiles")
        .update({ preferred_language: lang.id })
        .eq("id", user.id);
    }
    document.documentElement.dir = lang.is_rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang.id;
  };

  const translate = (key: string, namespace: string = "common") => {
    return translations[namespace]?.[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        translate,
        isRTL: currentLanguage.is_rtl,
        availableLanguages,
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};