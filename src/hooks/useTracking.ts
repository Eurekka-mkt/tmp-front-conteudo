import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { saveTrackingData } from '../utils/tracking';

export function useTracking() {
  const location = useLocation();

  useEffect(() => {
    // Verificar se está em páginas da loja (não admin)
    const isStorePage = location.pathname.includes('/br/') || location.pathname.includes('/es/');
    
    if (isStorePage) {
      saveTrackingData();
    }
  }, [location.pathname]);
}