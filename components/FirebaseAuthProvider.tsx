'use client';

import { useEffect, useState } from 'react';
import { initializeAuth } from '../lib/firebase';

export default function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth()
      .then(() => {
        setIsAuthenticated(true);
      })
      .catch((err) => {
        console.error('Firebase認証エラー:', err);
        const errorMessage = err?.message || err?.toString() || '不明なエラー';
        const errorCode = err?.code || '';
        setError(
          `Firebase認証に失敗しました: ${errorMessage}${errorCode ? ` (${errorCode})` : ''}`,
        );
      });
  }, []);

  if (error) {
    return (
      <div className="dm-screen dm-screen--error">
        <h2 className="dm-screenErrorTitle">認証エラー</h2>
        <p className="dm-screenErrorBody">{error}</p>
        <p className="dm-screenErrorHint">環境変数が正しく設定されているか確認してください</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="dm-screen dm-screen--loading">認証中...</div>;
  }

  return <>{children}</>;
}
