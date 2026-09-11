'use client';

import { useSyncExternalStore } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

const PRODUCTION_HOSTNAME = 'raven.kr';
const subscribeToOrigin = () => () => {};
const getServerOrigin = () => false;
const getBrowserOrigin = () => window.location.hostname === PRODUCTION_HOSTNAME;

export function ProductionGoogleAnalytics({ measurementId }: { measurementId: string }) {
  const isProductionOrigin = useSyncExternalStore(
    subscribeToOrigin,
    getBrowserOrigin,
    getServerOrigin,
  );

  return isProductionOrigin ? <GoogleAnalytics gaId={measurementId} /> : null;
}
