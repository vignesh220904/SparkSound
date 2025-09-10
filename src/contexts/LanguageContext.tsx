import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  getLanguageCode: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const languageMap: Record<string, string> = {
  'en-IN': 'en-US',
  'hi-IN': 'hi-IN',
  'te-IN': 'te-IN',
  'ta-IN': 'ta-IN',
  'kn-IN': 'kn-IN',
  'ml-IN': 'ml-IN',
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>('en-IN');

  const getLanguageCode = () => {
    return languageMap[language] || 'en-US';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getLanguageCode }}>
      {children}
    </LanguageContext.Provider>
  );
};