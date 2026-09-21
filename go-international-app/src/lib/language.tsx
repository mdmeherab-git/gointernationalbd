import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'bn' | 'en';

const LANGUAGE_KEY = 'gib_language_pref';

type LanguageState = {
  language: Language;
  isBangla: boolean;
  setLanguage: (lang: Language) => void;
  /** t("বাংলা টেক্সট", "English text") — mirrors the website's inline
   *  isBangla-ternary convention so screens read the same way. */
  t: (bn: string, en: string) => string;
};

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn');

  useEffect(() => {
    SecureStore.getItemAsync(LANGUAGE_KEY)
      .then((saved) => {
        if (saved === 'bn' || saved === 'en') setLanguageState(saved);
      })
      .catch(() => {
        // Default ("bn") stays in effect.
      });
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    SecureStore.setItemAsync(LANGUAGE_KEY, lang).catch(() => {
      // Non-fatal — preference just won't survive an app restart.
    });
  }

  const value = useMemo<LanguageState>(
    () => ({
      language,
      isBangla: language === 'bn',
      setLanguage,
      t: (bn: string, en: string) => (language === 'bn' ? bn : en),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
