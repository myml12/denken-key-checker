'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';

interface SensorData {
    temperature: number;
    humidity: number;
    pressure: number;
    gas_resistance_kohms: number;
    iaq: number;
    timestamp: number;
}

export default function SensorStatus({ roomName }: { roomName: string }) {
    const [sensorData, setSensorData] = useState<SensorData | null>(null);

    useEffect(() => {
        const sensorRef = ref(database, `room/${roomName}/sensor`);
        const unsubscribe = onValue(sensorRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setSensorData(data);
            }
        });
        return () => unsubscribe();
    }, [roomName]);

    const formatTime = (ts: number | null) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleString();
    };

    const getIAQColor = (iaq: number) => {
        if (iaq >= 400) return '#ff3333'; // 危険
        if (iaq >= 300) return '#ffaa00'; // 悪い
        if (iaq >= 200) return '#ffdd00'; // 注意
        if (iaq >= 100) return '#88ff00'; // 普通
        return '#00ff88'; // 良好
    };

    return (
        <div style={styles.card}>
            <h2 style={styles.title}>{roomName} 環境モニタ</h2>

            {sensorData ? (
                <>
                    <div style={styles.dataRow}>
                        <span style={styles.label}>🌡️ 温度:</span>
                        <span style={styles.value}>{sensorData.temperature.toFixed(1)}℃</span>
                    </div>

                    <div style={styles.dataRow}>
                        <span style={styles.label}>💧 湿度:</span>
                        <span style={styles.value}>{sensorData.humidity.toFixed(1)}%</span>
                    </div>

                    <div style={styles.dataRow}>
                        <span style={styles.label}>🌊 気圧:</span>
                        <span style={styles.value}>{sensorData.pressure.toFixed(1)}hPa</span>
                    </div>

                    <div style={styles.dataRow}>
                        <span style={styles.label}>🌬️ IAQ:</span>
                        <span style={{ ...styles.value, color: getIAQColor(sensorData.iaq), fontWeight: 'bold' }}>
                            {sensorData.iaq.toFixed(0)}
                        </span>
                    </div>

                    <div style={styles.legend}>
                        <p style={styles.legendTitle}>IAQ指標の目安</p>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendCircle, backgroundColor: '#00ff88' }}></span>
                            <span style={styles.legendText}>0-100: 良好 - 空気がきれいです</span>
                        </div>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendCircle, backgroundColor: '#88ff00' }}></span>
                            <span style={styles.legendText}>100-200: 普通 - 許容範囲内です</span>
                        </div>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendCircle, backgroundColor: '#ffdd00' }}></span>
                            <span style={styles.legendText}>200-300: 注意 - 敏感な人は注意</span>
                        </div>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendCircle, backgroundColor: '#ffaa00' }}></span>
                            <span style={styles.legendText}>300-400: 悪い - 換気を推奨</span>
                        </div>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendCircle, backgroundColor: '#ff3333' }}></span>
                            <span style={styles.legendText}>400以上: 危険 - 換気が必要</span>
                        </div>
                    </div>

                    <p style={styles.timestamp}>
                        Last updated: {formatTime(sensorData.timestamp)}
                    </p>
                </>
            ) : (
                <p style={styles.loading}>読み込み中...</p>
            )}
        </div>
    );
}

const styles = {
    card: {
        backgroundColor: '#121212',
        color: '#ddd',
        padding: 20,
        borderRadius: 14,
        width: 320,
        margin: '1.5rem auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textAlign: 'center' as const,
    },
    title: {
        fontSize: '1.6rem',
        fontWeight: '700',
        marginBottom: 16,
        color: '#00a7db',
    },
    dataRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #333',
    },
    label: {
        fontSize: '1.1rem',
        fontWeight: '500',
        color: '#aaa',
    },
    value: {
        fontSize: '1.2rem',
        fontWeight: '600',
        color: '#fff',
    },
    timestamp: {
        fontSize: '0.9rem',
        color: '#777',
        marginTop: 12,
    },
    loading: {
        fontSize: '1.1rem',
        color: '#aaa',
    },
    legend: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        textAlign: 'left' as const,
    },
    legendTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: 8,
        color: '#00a7db',
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 4,
    },
    legendCircle: {
        width: 12,
        height: 12,
        borderRadius: '50%',
        marginRight: 8,
    },
    legendText: {
        fontSize: '0.85rem',
        color: '#ccc',
    },
};

