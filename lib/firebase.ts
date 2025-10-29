// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// 固定のメール/パスワードで自動ログイン（未認証の場合のみ）
export function initializeAuth() {
  return new Promise<void>((resolve, reject) => {
    // 環境変数のチェック（事前に確認）
    const email = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMAIL;
    const password = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PASSWORD;

    if (!email || !password) {
      reject(new Error('Firebase認証情報が設定されていません。NEXT_PUBLIC_FIREBASE_AUTH_EMAILとNEXT_PUBLIC_FIREBASE_AUTH_PASSWORDを設定してください。'));
      return;
    }

    // 認証状態の初期化を待つ
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // 最初の認証状態確認後、リスナーを解除

      if (user) {
        // 既に認証済み
        resolve();
        return;
      }

      // 未認証の場合は固定のメール/パスワードでログイン
      signInWithEmailAndPassword(auth, email, password)
        .then(() => resolve())
        .catch((error) => {
          // より詳細なエラー情報を提供
          const errorMessage = error?.message || '不明なエラー';
          const errorCode = error?.code || '';
          reject(new Error(`${errorMessage}${errorCode ? ` (${errorCode})` : ''}`));
        });
    });
  });
}
