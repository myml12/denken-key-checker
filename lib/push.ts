'use client';

import { getToken, onMessage } from 'firebase/messaging';
import { ref, remove, set } from 'firebase/database';
import { database, getMessagingIfSupported } from '@/lib/firebase';

const TOKEN_KEY = 'denken-fcm-token';
const SW_PATH = '/firebase-messaging-sw.js';

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

export async function initializePushNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  const registration = await registerServiceWorker();
  const messaging = await getMessagingIfSupported();
  if (!messaging) return;

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
  }

  const nextToken = await getToken(messaging, {
    vapidKey: vapidKey(),
    serviceWorkerRegistration: registration,
  });
  if (!nextToken) return;

  const prevToken = window.localStorage.getItem(TOKEN_KEY);
  if (prevToken && prevToken !== nextToken) {
    await removeToken(prevToken);
  }

  await saveToken(nextToken);
  window.localStorage.setItem(TOKEN_KEY, nextToken);

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
}
