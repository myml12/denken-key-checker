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
                setError(err.message);
            });
    }, []);

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff3333',
                backgroundColor: '#121212',
            }}>
                認証エラー: {error}
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

