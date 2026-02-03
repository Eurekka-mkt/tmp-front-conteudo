// Utility functions for tracking and browser identification
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getBrowserId = (): string => {
  const storageKey = 'BROWSER_ID';
  let browserId = localStorage.getItem(storageKey);
  
  if (!browserId) {
    browserId = generateUUID();
    localStorage.setItem(storageKey, browserId);
  }
  
  return browserId;
};

export const getTrackingData = () => {
  const browserId = getBrowserId();
  const source = localStorage.getItem('eurekka_utm_source') || '';
  const primarySource = localStorage.getItem('eurekka_primary_source') || source;
  const originUrl = localStorage.getItem('eurekka_origin_url') || '';
  const primaryOriginUrl = localStorage.getItem('eurekka_primary_origin_url') || originUrl;

  return {
    browserId,
    source,
    primarySource,
    originUrl,
    primaryOriginUrl,
  };
};

export const saveTrackingData = () => {
  // Salvar dados de origem apenas na primeira visita
  const hasVisited = localStorage.getItem('eurekka_has_visited');
  
  if (!hasVisited) {
    const referrer = document.referrer;
    const currentUrl = window.location.href;
    
    // Salvar origem primária (primeira visita)
    if (referrer && !referrer.includes(window.location.hostname)) {
      localStorage.setItem('eurekka_primary_origin_url', referrer);
    }
    localStorage.setItem('eurekka_primary_origin_url', localStorage.getItem('eurekka_primary_origin_url') || currentUrl);
    
    // Salvar source primário
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    if (utmSource) {
      localStorage.setItem('eurekka_primary_source', utmSource);
    }
    
    localStorage.setItem('eurekka_has_visited', 'true');
  }
  
  // Sempre atualizar dados da sessão atual
  const referrer = document.referrer;
  if (referrer && !referrer.includes(window.location.hostname)) {
    localStorage.setItem('eurekka_origin_url', referrer);
  }
};

export const shouldShowNewsletterModal = (): boolean => {
  const lastShown = localStorage.getItem('eurekka_newsletter_last_shown');
  const hasSubscribed = localStorage.getItem('eurekka_newsletter_subscribed');
  
  if (hasSubscribed) return false;
  
  if (!lastShown) return true;
  
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return parseInt(lastShown) < oneWeekAgo;
};

export const markNewsletterShown = () => {
  localStorage.setItem('eurekka_newsletter_last_shown', Date.now().toString());
};

export const markNewsletterSubscribed = (email: string, phone?: string) => {
  localStorage.setItem('eurekka_newsletter_subscribed', 'true');
  localStorage.setItem('eurekka_newsletter_email', email);
  if (phone) {
    localStorage.setItem('eurekka_newsletter_phone', phone);
  }
};