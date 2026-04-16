'use client';

import { getToken, onMessage } from 'firebase/messaging';
import { ref, remove, set } from 'firebase/database';
import { database, getMessagingIfSupported } from '@/lib/firebase';

const TOKEN_KEY = 'denken-fcm-token';
const SW_PATH = '/firebase-messaging-sw.js';
let foregroundListenerAttached = false;

export type PushSetupStatus =
  | 'enabled'
  | 'unsupported'
  | 'blocked'
  | 'needs_user_action'
  | 'needs_home_screen'
  | 'error';

export interface PushSetupResult {
  status: PushSetupStatus;
  message: string;
}

function vapidKey(): string {
  const key = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_FIREBASE_VAPID_KEY が設定されていません');
  }
  return key;
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('このブラウザはService Workerをサポートしていません');
  }
  return navigator.serviceWorker.register(SW_PATH);
}

function tokenPath(token: string): string {
  return `pushTokens/${encodeURIComponent(token)}`;
}

async function saveToken(token: string) {
  await set(ref(database, tokenPath(token)), {
    token,
    updatedAt: Date.now(),
    userAgent: navigator.userAgent,
  });
}

async function removeToken(token: string) {
  await remove(ref(database, tokenPath(token)));
}

function isIosDevice(): boolean {
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

function isStandaloneMode(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export async function initializePushNotifications(options?: {
  requireUserGesture?: boolean;
}): Promise<PushSetupResult> {
  const requireUserGesture = options?.requireUserGesture ?? false;

  if (!('Notification' in window)) {
    return { status: 'unsupported', message: 'このブラウザは通知に対応していません。' };
  }
  if (Notification.permission === 'denied') {
    return {
      status: 'blocked',
      message: '通知がブロックされています。ブラウザ設定から通知を許可してください。',
    };
  }
  if (isIosDevice() && !isStandaloneMode()) {
    return {
      status: 'needs_home_screen',
      message: 'iPhoneでは「ホーム画面に追加」したPWAでのみ通知を有効化できます。',
    };
  }
  if (Notification.permission !== 'granted' && !requireUserGesture) {
    return {
      status: 'needs_user_action',
      message: '通知を受け取るには「通知を有効化」ボタンを押してください。',
    };
  }

  try {
    const registration = await registerServiceWorker();
    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      return { status: 'unsupported', message: 'この環境ではPush通知を利用できません。' };
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          status: 'needs_user_action',
          message: '通知が未許可です。許可すると状態変化を受け取れます。',
        };
      }
    }

    const nextToken = await getToken(messaging, {
      vapidKey: vapidKey(),
      serviceWorkerRegistration: registration,
    });
    if (!nextToken) {
      return { status: 'error', message: '通知トークンの取得に失敗しました。' };
    }

    const prevToken = window.localStorage.getItem(TOKEN_KEY);
    if (prevToken && prevToken !== nextToken) {
      await removeToken(prevToken);
    }

    await saveToken(nextToken);
    window.localStorage.setItem(TOKEN_KEY, nextToken);

    if (!foregroundListenerAttached) {
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? '部屋の状態が更新されました';
        const body = payload.notification?.body ?? '';
        if (Notification.permission !== 'granted') return;
        new Notification(title, {
          body,
          icon: '/web-app-manifest-192x192.png',
          data: payload.data ?? {},
        });
      });
      foregroundListenerAttached = true;
    }

    return { status: 'enabled', message: '通知を有効化しました。' };
  } catch (error) {
    console.error('Push初期化エラー:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '通知の初期化に失敗しました。',
    };
  }
}
