'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../lib/firebase';

interface RoomStatusProps {
  roomName: string;
}

interface DialogState {
  show: boolean;
  type: 'lock' | 'light' | null;
  newState: string;
}

export default function RoomStatus({ roomName }: RoomStatusProps) {
  const [state, setState] = useState<boolean | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [lightState, setLightState] = useState<boolean | null>(null);
  const [lookedAt, setLookedAt] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    show: false,
    type: null,
    newState: '',
  });
  const [rawData, setRawData] = useState<any>(null);

  const isEditable = roomName === '6433';

  useEffect(() => {
    const roomRef = ref(database, `room/${roomName}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRawData(data);
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

  const handleToggle = (type: 'lock' | 'light') => {
    if (!isEditable || !rawData) return;

    if (type === 'lock') {
      const newLockState = rawData.state === 0 ? '施錠中' : '解錠中';
      setDialog({
        show: true,
        type: 'lock',
        newState: newLockState,
      });
    } else {
      const newLightState = rawData.lightState === 0 ? '点灯中' : '消灯中';
      setDialog({
        show: true,
        type: 'light',
        newState: newLightState,
      });
    }
  };

  const handleConfirm = () => {
    if (!rawData || !dialog.type) {
      setDialog({ show: false, type: null, newState: '' });
      return;
    }

    // 即座にダイアログを閉じる
    const dialogType = dialog.type;
    const currentRawData = rawData;
    setDialog({ show: false, type: null, newState: '' });

    // 非同期で書き込み処理を実行（リスナーが自動的に反映するので、表示は変更しない）
    (async () => {
      const roomRef = ref(database, `room/${roomName}`);
      const updates: any = {
        ...currentRawData,
      };

      if (dialogType === 'lock') {
        updates.state = currentRawData.state === 0 ? 1 : 0;
        updates.timestamp = Date.now();
      } else {
        updates.lightState = currentRawData.lightState === 0 ? 1 : 0;
        updates.lookedAt = Date.now();
      }

      try {
        await set(roomRef, updates);
      } catch (error) {
        console.error('更新エラー:', error);
        alert('更新に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
      }
    })();
  };

  const handleCancel = () => {
    setDialog({ show: false, type: null, newState: '' });
  };

  return (
    <>
      <div style={styles.card}>
        <h2 style={styles.title}>{roomName}</h2>
        <p
          style={{
            ...styles.stateText,
            color: state === null ? '#aaa' : state ? '#89ff89' : '#ff0582',
            ...(isEditable ? styles.clickable : {}),
          }}
          onClick={() => isEditable && state !== null && handleToggle('lock')}
        >
          {state === null
            ? '読み込み中...'
            : state
              ? '🔓 解錠中 OPEN'
              : '🔐 施錠中 CLOSE'}
        </p>
        <p
          style={{
            ...styles.stateText,
            color: lightState === null ? '#aaa' : lightState ? '#ff0582' : '#89ff89',
            ...(isEditable ? styles.clickable : {}),
          }}
          onClick={() => isEditable && lightState !== null && handleToggle('light')}
        >
          {lightState === null
            ? '読み込み中...'
            : lightState
              ? '🌃 消灯中 OFF'
              : '💡 点灯中 ON'}
        </p>
        <p style={styles.timestamp}>Key checked at {formatTime(timestamp)}</p>
        <p style={styles.timestamp}>Light checked at {formatTime(lookedAt)}</p>
      </div>

      {dialog.show && (
        <div style={styles.overlay} onClick={handleCancel}>
          <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.dialogTitle}>{dialog.newState}に変更しますか？</h3>
            <div style={styles.dialogButtons}>
              <button
                style={styles.cancelButton}
                onClick={handleCancel}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#333'; }}
              >
                キャンセル
              </button>
              <button
                style={styles.confirmButton}
                onClick={handleConfirm}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#00c5f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00a7db'; }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  clickable: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'opacity 0.2s',
  },
  timestamp: {
    fontSize: '0.9rem',
    color: '#777',
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#1e1e1e',
    color: '#ddd',
    padding: 24,
    borderRadius: 14,
    width: '90%',
    maxWidth: 400,
    boxShadow: '0 8px 24px rgba(0,0,0,0.9)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  dialogTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: 24,
    color: '#00a7db',
    textAlign: 'center' as const,
  },
  dialogButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#333',
    color: '#ddd',
    border: 'none',
    borderRadius: 8,
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  confirmButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#00a7db',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
