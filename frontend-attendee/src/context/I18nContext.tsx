import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { translations } from '../i18n/translations';

export type Language = 'en' | 'ro';
export type Currency = 'RON' | 'EUR' | 'USD';

interface I18nContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  t: (key: string) => string;
  convertPrice: (priceInRON: number) => number;
  formatPrice: (priceInRON: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const EXCHANGE_RATES: Record<Currency, number> = {
  RON: 1.0,
  EUR: 0.2014, // 1 RON = ~0.20 EUR
  USD: 0.2185, // 1 RON = ~0.22 USD
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'ro') ? saved : 'en';
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('app_currency');
    return (saved === 'RON' || saved === 'EUR' || saved === 'USD') ? saved : 'RON';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('app_currency', curr);
  };

  const t = (key: string): string => {
    const dictionary = translations[language];
    return (dictionary as any)[key] || key;
  };

  const convertPrice = (priceInRON: number): number => {
    return priceInRON * EXCHANGE_RATES[currency];
  };

  const formatPrice = (priceInRON: number): string => {
    const converted = convertPrice(priceInRON);
    const locale = language === 'ro' ? 'ro-RO' : 'en-US';

    if (currency === 'RON') {
      return language === 'ro'
        ? `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)} lei`
        : `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)} RON`;
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <I18nContext.Provider value={{ language, currency, setLanguage, setCurrency, t, convertPrice, formatPrice }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
