'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useEffect } from 'react';
import Script from 'next/script';

interface AnalyticsProps {
  gaId?: string;
}

/**
 * Componente que gerencia todas as integrações de analytics
 * - Google Analytics 4
 * - Vercel Analytics
 * - Vercel Speed Insights
 */
export default function Analytics({ gaId }: AnalyticsProps) {
  const googleAnalyticsId = gaId || process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    // Inicializa o dataLayer do Google Analytics se não existir
    if (typeof window !== 'undefined' && !window.dataLayer) {
      window.dataLayer = [];
    }
  }, []);

  return (
    <>
      {/* Google Analytics */}
      {googleAnalyticsId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}', {
                  page_path: window.location.pathname,
                  send_page_view: true
                });
              `,
            }}
          />
        </>
      )}

      {/* Vercel Analytics */}
      <VercelAnalytics />

      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </>
  );
}

