/**
 * Utilitário para tracking de eventos de analytics
 * Suporta Google Analytics e eventos customizados
 */

// Tipos de eventos que podem ser rastreados
export type EventCategory =
  | 'navigation'
  | 'contact'
  | 'project'
  | 'social'
  | 'download'
  | 'interaction'
  | 'discord'
  | 'spotify';

export interface AnalyticsEvent {
  action: string;
  category: EventCategory;
  label?: string;
  value?: number;
  [key: string]: any;
}

/**
 * Verifica se o Google Analytics está disponível
 */
export const isGAEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof window.gtag !== 'undefined';
};

/**
 * Rastreia um evento no Google Analytics
 */
export const trackEvent = (event: AnalyticsEvent): void => {
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (isGAEnabled() && window.gtag) {
    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event,
    });
  }

  // Log para desenvolvimento (pode ser removido em produção)
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', event);
  }
};

/**
 * Rastreia visualizações de página
 */
export const trackPageView = (url: string): void => {
  if (typeof window === 'undefined') return;

  if (isGAEnabled() && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: url,
    });
  }
};

/**
 * Rastreia cliques em links externos
 */
export const trackExternalLink = (url: string, label?: string): void => {
  trackEvent({
    action: 'click_external_link',
    category: 'navigation',
    label: label || url,
    url,
  });
};

/**
 * Rastreia envio de formulário de contato
 */
export const trackContactSubmit = (success: boolean, method?: string): void => {
  trackEvent({
    action: success ? 'contact_form_success' : 'contact_form_error',
    category: 'contact',
    label: method || 'email',
    value: success ? 1 : 0,
  });
};

/**
 * Rastreia visualização de projeto
 */
export const trackProjectView = (projectName: string, projectUrl?: string): void => {
  trackEvent({
    action: 'view_project',
    category: 'project',
    label: projectName,
    url: projectUrl,
  });
};

/**
 * Rastreia clique em link de projeto
 */
export const trackProjectClick = (projectName: string, projectUrl: string): void => {
  trackEvent({
    action: 'click_project',
    category: 'project',
    label: projectName,
    url: projectUrl,
  });
};

/**
 * Rastreia interações sociais (GitHub, LinkedIn, etc)
 */
export const trackSocialClick = (platform: string, url: string): void => {
  trackEvent({
    action: 'click_social',
    category: 'social',
    label: platform,
    url,
  });
};

/**
 * Rastreia interações com Discord
 */
export const trackDiscordInteraction = (action: string, details?: string): void => {
  trackEvent({
    action,
    category: 'discord',
    label: details,
  });
};

/**
 * Rastreia interações com Spotify
 */
export const trackSpotifyInteraction = (action: string, trackName?: string): void => {
  trackEvent({
    action,
    category: 'spotify',
    label: trackName,
  });
};

/**
 * Rastreia downloads de arquivos
 */
export const trackDownload = (fileName: string, fileType?: string): void => {
  trackEvent({
    action: 'download_file',
    category: 'download',
    label: fileName,
    file_type: fileType,
  });
};

// Declaração de tipos para window.gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}



