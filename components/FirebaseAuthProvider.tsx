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
                // エラーの詳細を表示（デプロイ環境でのデバッグ用）
                const errorMessage = err?.message || err?.toString() || '不明なエラー';
                const errorCode = err?.code || '';
                setError(`Firebase認証に失敗しました: ${errorMessage}${errorCode ? ` (${errorCode})` : ''}`);
            });
    }, []);

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff3333',
                backgroundColor: '#121212',
                padding: '2rem',
                textAlign: 'center',
            }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>認証エラー</h2>
                <p style={{ marginBottom: '1rem' }}>{error}</p>
                <p style={{ fontSize: '0.9rem', color: '#777', marginTop: '1rem' }}>
                    環境変数が正しく設定されているか確認してください
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ddd',
                backgroundColor: '#121212',
            }}>
                認証中...
            </div>
        );
    }

    return <>{children}</>;
}

