import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, Translations, getTranslations } from './translations';

interface I18nContextType {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'es',
  t: getTranslations('es'),
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem('app_language');
    return (stored as Language) || 'es';
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('app_language', l);
    // Set document direction for RTL
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const t = getTranslations(lang);

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
