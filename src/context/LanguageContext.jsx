import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('dim47_lang') || 'ua';
  });

  const [gender, setGender] = useState(() => {
    return localStorage.getItem('dim47_gender') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('dim47_lang', lang);
    document.documentElement.lang = lang === 'ua' ? 'uk' : 'en';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('dim47_gender', gender);
  }, [gender]);

  // При кліку на обрану стать — вмикає її, при повторному кліку — вимикає ('all')
  const toggleGender = (selected) => {
    setGender((prev) => (prev === selected ? 'all' : selected));
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, gender, toggleGender }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);