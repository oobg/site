'use client';

import { useLayoutEffect } from 'react';
import { installProductionAnalytics } from '@lib/analytics/browser';

export { isAdminAnalyticsPath, isProductionAnalyticsOrigin } from '@lib/analytics/browser';

export function ProductionGoogleAnalytics({ measurementId }: { measurementId: string }) {
  useLayoutEffect(() => {
    installProductionAnalytics(measurementId);
  }, [measurementId]);
  return null;
}
