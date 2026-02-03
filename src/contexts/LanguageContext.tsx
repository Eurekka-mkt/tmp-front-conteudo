import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { translations } from '../translations';
import { useTracking } from '../hooks/useTracking';
import { shouldShowNewsletterModal } from '../utils/tracking';
import { NewsletterModal } from '../components/modals/NewsletterModal';

// Idioma na URL
export type UrlLang = 'br' | 'es';
// Idioma pro UI/translations
export type UiLang = 'pt_br' | 'es';
// Idioma pro backend (GraphQL enum)
export type ApiLanguage = 'PT_BR' | 'ES';

type LanguageContextType = {
  // compat antigo (você usa `language` pra montar /{language}/...)
  language: UrlLang;    // 'br' | 'es'
  // novos campos explícitos
  urlLang: UrlLang;     // 'br' | 'es'
  uiLang: UiLang;       // 'pt_br' | 'es'
  apiLanguage: ApiLanguage; // 'PT_BR' | 'ES'
  t: (key: string) => string;
};

const defaultLanguageContext: LanguageContextType = {
  language: 'br',
  urlLang: 'br',
  uiLang: 'pt_br',
  apiLanguage: 'PT_BR',
  t: (key: string) => key,
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  useTracking();

  const [urlLang, setUrlLang] = useState<UrlLang>('br');
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);

  // Verificar se deve mostrar modal de newsletter
  useEffect(() => {
    const isStorePage = location.pathname.includes('/br/') || location.pathname.includes('/es/');
    
    if (isStorePage && shouldShowNewsletterModal()) {
      // Delay para não interferir com a navegação
      const timer = setTimeout(() => {
        setShowNewsletterModal(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);
  useEffect(() => {
    // Em HashRouter, funciona igual: pathname vira "/br/books" etc.
    const first = location.pathname.split('/').filter(Boolean)[0];

    // Não interferir em rotas administrativas
    if (first === 'admin' || first === 'unauthorized' || first === 'login') return;

    // Força prefixo /br ou /es nas rotas públicas
    if (first !== 'br' && first !== 'es') {
      navigate(`/br${location.pathname}${location.search}`, { replace: true });
      return;
    }

    setUrlLang(first as UrlLang);
  }, [location.pathname, location.search, navigate]);

  // Mapeamentos
  const uiLang: UiLang = urlLang === 'br' ? 'pt_br' : 'es';
  const apiLanguage: ApiLanguage = urlLang === 'br' ? 'PT_BR' : 'ES';

  const t = (key: string) => translations[urlLang]?.[key] ?? key;

  return (
    <LanguageContext.Provider
      value={{
        language: urlLang,
        urlLang,
        uiLang,
        apiLanguage,
        t,
      }}
    >
      {children}
      <NewsletterModal 
        isOpen={showNewsletterModal} 
        onClose={() => setShowNewsletterModal(false)} 
      />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
