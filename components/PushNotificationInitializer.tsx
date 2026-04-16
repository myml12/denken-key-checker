'use client';

import { useEffect } from 'react';
import { initializePushNotifications } from '@/lib/push';

export default function PushNotificationInitializer() {
  useEffect(() => {
    initializePushNotifications().catch((error) => {
      console.error('Push初期化エラー:', error);
    });
  }, []);

  return null;
}
