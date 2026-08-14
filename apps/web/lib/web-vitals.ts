'use client';

import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

type VitalMetric = { name: string; value: number; rating: string };

export function reportWebVitals() {
  const report = (metric: VitalMetric) => {
    const body = {
      eventType: 'web_vital',
      metadata: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: window.location.pathname,
        userAgent: navigator.userAgent.slice(0, 128),
      },
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
    }
  };

  onCLS((m) => report({ name: 'CLS', value: m.value, rating: m.rating }));
  onFID((m) => report({ name: 'FID', value: m.value, rating: m.rating }));
  onLCP((m) => report({ name: 'LCP', value: m.value, rating: m.rating }));
  onFCP((m) => report({ name: 'FCP', value: m.value, rating: m.rating }));
  onTTFB((m) => report({ name: 'TTFB', value: m.value, rating: m.rating }));
  onINP((m) => report({ name: 'INP', value: m.value, rating: m.rating }));
}
