'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';

interface RoomStatusProps {
  roomName: string;
}

export default function RoomStatus({ roomName }: RoomStatusProps) {
  const [state, setState] = useState<boolean | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [lightState, setLightState] = useState<boolean | null>(null);
  const [lookedAt, setLookedAt] = useState<number | null>(null);

  useEffect(() => {
    const roomRef = ref(database, `room/${roomName}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setState(data.state === 0);  // 0=解錠なのでtrue
        setTimestamp(data.timestamp);
        setLightState(data.lightState === 0); //0=消灯なのでtrue
        setLookedAt(data.lookedAt);
      }
    });
    return () => unsubscribe();
  }, [roomName]);

  const formatTime = (ts: number | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString();
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{roomName}</h2>
      <p style={{
        ...styles.stateText,
        color: state === null ? '#aaa' : state ? '#89ff89' : '#ff0582',
      }}>
        {state === null
          ? '読み込み中...'
          : state
          ? '🔓 解錠中 OPEN'
          : '🔐 施錠中 CLOSE'}
      </p>
      <p style={{
        ...styles.stateText,
        color: lightState === null ? '#aaa' : lightState ? '#ff0582' : '#89ff89',
      }}>
        {lightState === null
          ? '読み込み中...'
          : lightState
          ? '🌃 消灯中 OFF'
          : '💡 点灯中 ON'}
      </p>
      <p style={styles.timestamp}>Key checked at {formatTime(timestamp)}</p>
      <p style={styles.timestamp}>Light checked at {formatTime(lookedAt)}</p>
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
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: 12,
    color: '#00a7db',
  },
  stateText: {
    fontSize: '1.2rem',
    fontWeight: '600',
    marginBottom: 12,
  },
  timestamp: {
    fontSize: '0.9rem',
    color: '#777',
  },
};
