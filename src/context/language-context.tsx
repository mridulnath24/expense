'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { setCookie, parseCookies } from 'nookies';
import { cn } from '@/lib/utils.tsx';

import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const translations: { [key: string]: any } = { en, bn };

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string,
    options?: { [key: string]: string | number }
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    const cookies = parseCookies();
    const savedLocale = cookies.locale || 'en';
    setLocaleState(savedLocale);
  }, []);

  useEffect(() => {
    // This effect will run on the client and update the body class
    document.body.className = cn(
      document.body.className,
      "antialiased",
      locale === 'bn' ? 'font-bengali' : 'font-body'
    );
  }, [locale]);

  const setLocale = (newLocale: string) => {
    setCookie(null, 'locale', newLocale, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    setLocaleState(newLocale);
  };
  
  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    let result = translations[locale];
    for(const k of keys){
        result = result?.[k];
    }

    if (typeof result === 'string' && options) {
      Object.keys(options).forEach(optKey => {
        result = result.replace(`{{${optKey}}}`, String(options[optKey]));
      });
    }

    return result || key;
  }, [locale]);


  const value = { locale, setLocale, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
